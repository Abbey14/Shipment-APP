import React, { useCallback, useState } from 'react';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  onParse: () => void;
  isProcessing: boolean;
  processingStatus: string;
  file: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, onParse, isProcessing, processingStatus, file }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        onFileChange(droppedFile);
      } else {
        alert('Please drop a PDF file.');
      }
      e.dataTransfer.clearData();
    }
  }, [onFileChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    } else {
      onFileChange(null);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    onFileChange(null);
  }

  return (
    <div className="w-full p-6 bg-slate-800 rounded-xl shadow-lg flex flex-col items-center justify-center text-center">
      {!file ? (
         <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`w-full p-10 border-2 border-dashed rounded-lg transition-colors duration-200 ${isDragging ? 'border-cyan-400 bg-slate-700/50' : 'border-slate-600 hover:border-cyan-400'}`}
            aria-label="File upload area"
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <UploadCloud className="w-12 h-12 mb-4 text-slate-500" />
                <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-slate-500">PDF files only</p>
              </div>
            </label>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
           <div className="w-full p-4 mb-4 bg-slate-700 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileIcon className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                <span className="font-medium text-slate-200 truncate" title={file.name}>{file.name}</span>
              </div>
              <button onClick={handleRemoveFile} disabled={isProcessing} className="p-1 text-slate-400 hover:text-white disabled:opacity-50 transition-colors" aria-label="Remove file">
                  <X className="h-5 w-5" />
              </button>
           </div>
          <button
            onClick={onParse}
            disabled={isProcessing || !file}
            className="w-full sm:w-auto px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-600 flex items-center justify-center"
          >
            {isProcessing ? (
               <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="status" aria-label="Processing">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
               </>
            ) : "Parse & Verify"}
          </button>
          {isProcessing && processingStatus && (
            <p className="mt-4 text-sm text-slate-400 animate-pulse" aria-live="polite">{processingStatus}</p>
          )}
        </div>
      )}
    </div>
  );
};
