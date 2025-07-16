import React, { useState, useCallback } from 'react';
import { useManualVerification } from '../contexts/GlobalDataProvider';
import { FileSignature, UploadCloud, File as FileIcon, X, Download, AlertTriangle, Info, Loader } from 'lucide-react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { MonetaryValue } from '../types';

const formatCurrency = (money: MonetaryValue | undefined) => {
    if (!money || typeof money.value !== 'number' || !money.currency) return 'N/A';
    return `${money.currency} ${money.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Promise-based file reader
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
};

export const PtpLetter: React.FC = () => {
    const { data: boeData } = useManualVerification();
    const [template, setTemplate] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
            setTemplate(file);
            setError(null);
        } else {
            setTemplate(null);
            setError("Please upload a valid .docx file.");
        }
        e.target.value = '';
    };

    const handleGenerateAndDownload = useCallback(async () => {
        if (!template || !boeData) {
            setError("Template file and verified data are required.");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const content = await readFileAsArrayBuffer(template);

            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            doc.setData({
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                awb_number: boeData.awbNumber,
                duty_amount_words: boeData.dutyAmount?.words || 'N/A',
                duty_amount_numerical: formatCurrency(boeData.dutyAmount?.numerical),
            });

            doc.render();

            const populatedDocBlob = doc.getZip().generate({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            
            const url = URL.createObjectURL(populatedDocBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `PTP_Letter_${boeData.awbNumber}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error("Error generating document:", err);
            let errorMessage = "An error occurred while processing the template.";
            if (err.properties && err.properties.errors) {
               const specificError = err.properties.errors[0];
               errorMessage += ` Details: ${specificError.message || 'Possible undefined placeholder'}`;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    }, [template, boeData]);

    const isReadyForGeneration = !!template && !!boeData;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <FileSignature className="mr-3 text-cyan-400" />
                PTP Letter Generator
            </h1>
            <p className="text-slate-400 mb-8">Generate a Promise-to-Pay letter with your original formatting preserved.</p>
            
            <div className="max-w-3xl mx-auto space-y-6">
                 <div className="bg-slate-800 p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Instructions & Placeholders</h2>
                    <ol className="list-decimal list-inside space-y-3 text-slate-300">
                        <li>First, verify a checklist to load its data.</li>
                        <li>Create a PTP letter in Word (.docx) using the placeholders below. The app will preserve your original formatting.</li>
                        <li>Upload your template and click "Generate & Download".</li>
                        <li>A populated `.docx` file will be downloaded. You can open it and save as PDF if needed.</li>
                    </ol>
                    
                    <h3 className="text-lg font-semibold text-white mt-6 mb-3">Available Placeholders</h3>
                    <div className="font-mono bg-slate-900 p-4 rounded-md text-cyan-300 text-sm space-y-1">
                        <p>{'{date}'} <span className="text-slate-400">- Today's date</span></p>
                        <p>{'{awb_number}'} <span className="text-slate-400">- Air Waybill Number</span></p>
                        <p>{'{duty_amount_words}'} <span className="text-slate-400">- Duty amount in words</span></p>
                        <p>{'{duty_amount_numerical}'} <span className="text-slate-400">- Duty amount as a number</span></p>
                    </div>
                 </div>
                 <div className="bg-slate-800 p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Generate Letter</h2>
                    
                    {!template ? (
                         <div className="w-full p-10 border-2 border-dashed rounded-lg border-slate-600 hover:border-cyan-400 transition-colors">
                            <input
                              type="file"
                              id="template-upload"
                              className="hidden"
                              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={handleFileChange}
                            />
                            <label htmlFor="template-upload" className="cursor-pointer flex flex-col items-center text-center">
                                <UploadCloud className="w-12 h-12 mb-4 text-slate-500" />
                                <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-cyan-400">Click to upload template</span></p>
                                <p className="text-xs text-slate-500">.docx files only</p>
                            </label>
                        </div>
                    ) : (
                         <div className="w-full p-4 mb-4 bg-slate-700 rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileIcon className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                                <span className="font-medium text-slate-200 truncate" title={template.name}>{template.name}</span>
                              </div>
                              <button onClick={() => setTemplate(null)} className="p-1 text-slate-400 hover:text-white transition-colors" aria-label="Remove file">
                                  <X className="h-5 w-5" />
                              </button>
                           </div>
                    )}
                    
                     <div className="mt-4">
                            <button
                                onClick={handleGenerateAndDownload}
                                disabled={!isReadyForGeneration || isGenerating}
                                className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isGenerating ? <Loader className="animate-spin mr-3 h-5 w-5" /> : <Download className="mr-3 h-5 w-5" />}
                                {isGenerating ? "Generating..." : "Generate & Download Letter"}
                            </button>
                    </div>
                    {error && (
                        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md text-sm flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0"/>
                            <span>{error}</span>
                        </div>
                    )}
                 </div>
                  {!boeData && (
                     <div className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-md text-slate-400">
                        <Info className="h-5 w-5 flex-shrink-0" />
                        <span>No verified data loaded. Please verify a document first to activate this feature.</span>
                     </div>
                 )}
            </div>
        </div>
    );
};