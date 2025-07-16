import React, { useState } from 'react';
import type { ParsingResults } from '../types';
import { marked } from 'marked';

interface ResultsDisplayProps {
  results: ParsingResults;
}

type Tab = 'consolidated' | 'structured' | 'direct' | 'ocr';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode, 'aria-controls': string }> = ({ active, onClick, children, ...props }) => (
  <button
    onClick={onClick}
    role="tab"
    aria-selected={active}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
      active
        ? 'bg-brand-accent text-white'
        : 'text-brand-text-secondary hover:bg-brand-secondary'
    }`}
    {...props}
  >
    {children}
  </button>
);

const ResultPanel: React.FC<{ content: string | undefined; id: string; active: boolean; }> = ({ content, id, active }) => {
    const htmlContent = content ? marked.parse(content, { gfm: true, breaks: true, async: false }) as string : '';

    return (
        <div role="tabpanel" id={id} hidden={!active} className="mt-4 focus:outline-none" tabIndex={0}>
            {content ? (
                <div
                    className="prose-like max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            ) : (
                <div className="p-4 bg-brand-secondary rounded-lg">
                    <p className="text-brand-text-secondary italic">No content generated for this method.</p>
                </div>
            )}
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState<Tab>('consolidated');

  return (
    <div className="w-full bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Parsing Results</h2>

      <div className="flex flex-wrap space-x-2 border-b border-brand-secondary pb-2 mb-4" role="tablist" aria-label="Parsing Results">
        <TabButton active={activeTab === 'consolidated'} onClick={() => setActiveTab('consolidated')} aria-controls="panel-consolidated">Consolidated</TabButton>
        <TabButton active={activeTab === 'structured'} onClick={() => setActiveTab('structured')} aria-controls="panel-structured">AI Structured</TabButton>
        <TabButton active={activeTab === 'direct'} onClick={() => setActiveTab('direct')} aria-controls="panel-direct">Direct Text</TabButton>
        <TabButton active={activeTab === 'ocr'} onClick={() => setActiveTab('ocr')} aria-controls="panel-ocr">OCR Text</TabButton>
      </div>

      <div className="p-1">
        <ResultPanel id="panel-consolidated" active={activeTab === 'consolidated'} content={results.consolidatedText} />
        <ResultPanel id="panel-structured" active={activeTab === 'structured'} content={results.structuredText} />
        <ResultPanel id="panel-direct" active={activeTab === 'direct'} content={results.directText} />
        <ResultPanel id="panel-ocr" active={activeTab === 'ocr'} content={results.ocrText} />
      </div>
    </div>
  );
};