import React from 'react';
import { Mail, BriefcaseBusiness, CheckCircle, XCircle } from 'lucide-react';

const ConnectorCard: React.FC<{ icon: React.ReactNode; title: string; description: string; connected: boolean; }> = ({ icon, title, description, connected }) => (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
        <div className="mr-6 text-cyan-400">{icon}</div>
        <div className="flex-grow">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
        <div className="flex items-center ml-6">
            {connected ? (
                <>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-400 font-medium text-sm">Connected</span>
                </>
            ) : (
                <>
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-400 font-medium text-sm">Not Connected</span>
                </>
            )}
        </div>
        <button className="ml-8 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm rounded-md transition-colors disabled:opacity-50" disabled>
            {connected ? 'Manage' : 'Connect'}
        </button>
    </div>
);


export const Connectors: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Connectors</h1>
            <p className="text-slate-400 mb-8">Manage connections to your external services. (These are mock connectors for UI demonstration).</p>

            <div className="space-y-6">
                <ConnectorCard
                    icon={<Mail size={32} />}
                    title="Google Mail (Gmail)"
                    description="Automatically fetch new checklist emails."
                    connected={true}
                />
                <ConnectorCard
                    icon={<BriefcaseBusiness size={32} />}
                    title="Zoho Books"
                    description="Verify product details like HS Code and last price."
                    connected={true}
                />
            </div>
        </div>
    );
};
