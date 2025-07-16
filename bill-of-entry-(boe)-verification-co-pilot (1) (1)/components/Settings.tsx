import React, { useState, useEffect } from 'react';
import type { ImporterDetails } from '../types';
import { Settings as SettingsIcon, Save, Loader } from 'lucide-react';
import { useSettings } from '../contexts/GlobalDataProvider';

export const Settings: React.FC = () => {
    const { details: initialDetails, isLoading, saveSettings } = useSettings();
    const [details, setDetails] = useState<ImporterDetails>({
        importerName: '',
        iecNumber: '',
        gstin: '',
        adCode: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (initialDetails) {
            setDetails(initialDetails);
        } else {
            // Reset form if details are cleared/null
            setDetails({
                importerName: '',
                iecNumber: '',
                gstin: '',
                adCode: '',
            });
        }
    }, [initialDetails]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveSuccess(false);
        await saveSettings(details);
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const InputField: React.FC<{ name: keyof ImporterDetails, label: string, disabled: boolean }> = ({ name, label, disabled }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
            <input
                type="text"
                id={name}
                name={name}
                value={details[name]}
                onChange={handleChange}
                disabled={disabled}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-800 disabled:cursor-not-allowed"
            />
        </div>
    );

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <Loader className="animate-spin h-8 w-8 text-cyan-400" />
                <span className="ml-4 text-lg text-slate-400">Loading Settings...</span>
            </div>
        );
    }
    
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <SettingsIcon className="mr-3 text-cyan-400" />
                Settings
            </h1>
            <p className="text-slate-400 mb-8">Enter your company's default information for automated verification.</p>

            <div className="max-w-2xl mx-auto bg-slate-800 p-8 rounded-lg shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputField name="importerName" label="Importer Name & Address" disabled={isSaving} />
                    <InputField name="iecNumber" label="IEC Number" disabled={isSaving} />
                    <InputField name="gstin" label="GSTIN" disabled={isSaving} />
                    <InputField name="adCode" label="AD Code" disabled={isSaving} />

                    <div className="flex items-center justify-end gap-4 pt-4">
                        {saveSuccess && (
                            <p className="text-sm text-green-400 animate-pulse">Settings saved successfully!</p>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center justify-center px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isSaving ? (
                                <Loader className="animate-spin mr-2 h-5 w-5" />
                            ) : (
                                <Save className="mr-2 h-5 w-5" />
                            )}
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
