import React, { useState } from 'react';
import { MailPlus, Copy, Trash2, Check } from 'lucide-react';
import { useDraftEmail } from '../contexts/GlobalDataProvider';

export const DraftEmail: React.FC = () => {
    const { draftContent, clearDraft } = useDraftEmail();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!draftContent) return;
        navigator.clipboard.writeText(draftContent).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear the draft email? This action cannot be undone.')) {
            clearDraft();
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <MailPlus className="mr-3 text-cyan-400" />
                Draft Email
            </h1>
            <p className="text-slate-400 mb-8">This draft is automatically generated based on the corrections you add.</p>

            <div className="max-w-4xl mx-auto bg-slate-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Correction Email Content</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            disabled={!draftContent || copied}
                            className="inline-flex items-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                        >
                            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={!draftContent}
                            className="inline-flex items-center px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-md min-h-[300px] whitespace-pre-wrap text-slate-300 border border-slate-700">
                    {draftContent ? draftContent : <span className="italic text-slate-500">No corrections have been added to the draft yet.</span>}
                </div>
            </div>
        </div>
    );
};