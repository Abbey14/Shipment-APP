import * as pdfjsLib from 'pdfjs-dist';

// Set up the PDF.js worker from a CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

const getPdfDocument = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  return pdfjsLib.getDocument(arrayBuffer).promise;
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfDoc = await getPdfDocument(file);
  let fullText = '';
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    try {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      fullText += pageText + '\n\n';
    } catch (pageError) {
      console.error(`Could not process page ${i}:`, pageError);
      // Continue to next page
    }
  }
  return fullText.trim();
};
