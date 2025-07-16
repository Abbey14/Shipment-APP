

import { useState, useCallback } from 'react';
import { extractTextFromPdf } from '../services/pdfProcessor';
import { extractBoEData } from '../services/geminiService';
import type { BoEData } from '../types';

export const usePdfParser = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [data, setData] = useState<BoEData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (pdfFile: File) => {
    setIsProcessing(true);
    setError(null);
    setData(null);

    try {
      setStatus('Extracting text from PDF...');
      const text = await extractTextFromPdf(pdfFile);

      if (!text.trim()) {
        throw new Error('PDF appears to be empty or contains only images. Text extraction failed.');
      }
      
      setStatus('Analyzing document structure with AI...');
      let structuredData = await extractBoEData(text);
      
      // Self-correction logic
      if (structuredData && structuredData.items?.length > 0 && structuredData.invoiceValue) {
        const calculatedTotal = structuredData.items.reduce((sum, item) => {
            // Only add to sum if currencies match the main invoice currency
            if (item.unitPrice?.currency === structuredData.invoiceValue.currency) {
                return sum + (item.quantity * item.unitPrice.value);
            }
            return sum;
        }, 0);

        // If totals don't match, ask the AI to re-evaluate
        if (Math.abs(calculatedTotal - structuredData.invoiceValue.value) > 0.01) {
            setStatus('Invoice value mismatch. Attempting self-correction...');
            console.warn(`Initial parse mismatch. Summary: ${structuredData.invoiceValue.value}, Calculated: ${calculatedTotal}. Attempting correction.`);
            
            const correctedData = await extractBoEData(text, {
                needsCorrection: true,
                invoiceValue: structuredData.invoiceValue,
            });
            structuredData = correctedData;
        }
      }


      // If the AI couldn't find the duty amount in words, provide a safe fallback.
      if (structuredData.dutyAmount && (!structuredData.dutyAmount.words || structuredData.dutyAmount.words.trim().toUpperCase() === 'N/A')) {
         structuredData.dutyAmount.words = `Value in words not found. Numerical: ${structuredData.dutyAmount.numerical.currency} ${structuredData.dutyAmount.numerical.value}`;
      }

      setData(structuredData);
      setStatus('Done.');

    } catch (err) {
      console.error('An error occurred during PDF processing:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to process PDF. ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setStatus('');
    }
  }, []);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setStatus('');
    setData(null);
    setError(null);
  }, []);

  return { isProcessing, status, data, error, parse, reset };
};