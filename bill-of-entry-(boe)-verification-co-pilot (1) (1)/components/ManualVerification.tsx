
import React from 'react';
import type { VerificationResult, BoEData, MonetaryValue, VerificationStatus, SummaryVerificationStatus, SummaryActions, ItemAction, ItemActions, DutyAmount } from '../types';
import { FileUpload } from './FileUpload';
import { VerificationTable } from './VerificationTable';
import { FileUp, CheckCircle2, XCircle, Loader, ThumbsUp, MailPlus } from 'lucide-react';
import { useSummaryVerification } from '../hooks/useSummaryVerification';
import { useSettings, useManualVerification } from '../contexts/GlobalDataProvider';

const SummaryItem: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
    <div className={className}>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-base text-white font-medium break-words">{children}</p>
    </div>
);

type SummaryAction = 'pending' | 'added' | 'ignored';

const VerifiedSummaryItem: React.FC<{
    label: string;
    boeValue: string;
    settingsValue?: string;
    status: VerificationStatus;
    actionStatus: SummaryAction;
    isLoading: boolean;
    onAdd: () => void;
    onIgnore: () => void;
    className?: string;
}> = ({ label, boeValue, settingsValue, status, actionStatus, isLoading, onAdd, onIgnore, className = '' }) => {
    
    const renderStatus = () => {
        if (isLoading) return <Loader className="ml-2 h-4 w-4 animate-spin text-slate-500" />;
        
        if (status === 'match') {
             return <span title="Match"><CheckCircle2 className="ml-2 h-4 w-4 text-green-500" /></span>;
        }

        if (status === 'mismatch') {
            if (actionStatus === 'added') {
                return <span title="Added to email"><MailPlus className="ml-2 h-4 w-4 text-cyan-400" /></span>;
            }
            if (actionStatus === 'ignored') {
                return <span title="Ignored"><ThumbsUp className="ml-2 h-4 w-4 text-yellow-400" /></span>;
            }
             return <span title="Mismatch"><XCircle className="ml-2 h-4 w-4 text-red-500" /></span>;
        }
        return null;
    }

    return (
        <div className={className}>
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-400 flex items-center">
                    {label}
                    {renderStatus()}
                </p>
                {status === 'mismatch' && actionStatus === 'pending' && !isLoading && (
                    <div className="flex items-center gap-2">
                        <button onClick={onAdd} className="px-2 py-1 text-xs bg-cyan-600/50 hover:bg-cyan-600/80 border border-cyan-500/50 text-cyan-300 rounded">Add to Email</button>
                        <button onClick={onIgnore} className="px-2 py-1 text-xs bg-slate-600/50 hover:bg-slate-600/80 border border-slate-500/50 text-slate-300 rounded">Ignore</button>
                    </div>
                )}
            </div>
            <p className="text-base text-white font-medium break-words">{boeValue}</p>
            {status === 'mismatch' && (
                <p className="text-xs text-slate-500">
                    Expected: <span className="font-medium text-slate-400">{settingsValue || 'N/A'}</span>
                </p>
            )}
        </div>
    );
};


const formatCurrency = (money: MonetaryValue | undefined) => {
    if (!money || typeof money.value !== 'number' || !money.currency) return 'N/A';
    return `${money.currency} ${money.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const formatDuty = (duty: DutyAmount | undefined) => {
    if (!duty) return 'N/A';
    return `${formatCurrency(duty.numerical)} (${duty.words})`;
};


export const ManualVerification: React.FC = () => {
    const {
        file,
        setFile,
        parseFile,
        isProcessing,
        processingStatus,
        data,
        error,
        verificationResults,
        summaryActions,
        itemActions,
        isApproved,
        handleSummaryAction,
        handleItemAction,
        approveChecklist,
    } = useManualVerification();

    const { status: summaryStatus, isLoading: summaryIsLoading } = useSummaryVerification(data);
    const { details: settingsDetails } = useSettings();

    const calculatedInvoiceValueData = React.useMemo(() => {
        // Ensure we have data and items to process
        if (!data || !data.items || data.items.length === 0) return null;

        // Check if all unit prices are available and have a currency
        if (data.items.some(item => !item.unitPrice?.currency)) return {
            displayValue: 'Missing item price data',
            isMatch: false,
        };

        // Determine the currency from the first item
        const calculationCurrency = data.items[0].unitPrice.currency;
        
        // Check if all items use the same currency
        const uniformCurrency = data.items.every(
          (item) => item.unitPrice.currency === calculationCurrency
        );

        if (!uniformCurrency) {
          return {
            displayValue: "Mixed currencies in items",
            isMatch: false,
          };
        }

        // Calculate the total by multiplying quantity and unit price for each item
        const total = data.items.reduce(
          (sum, item) => sum + (item.quantity * item.unitPrice.value),
          0
        );
        
        // Compare with the invoice value from the summary
        const isMatch =
          data.invoiceValue.currency === calculationCurrency &&
          Math.abs(data.invoiceValue.value - total) < 0.01; // Using a small tolerance for float comparison
        
        return {
            displayValue: `${calculationCurrency} ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            isMatch: isMatch
        };
    }, [data]);
    
    const allSummaryMismatchesHandled = Object.keys(summaryStatus).every(key => {
        const fieldKey = key as keyof SummaryVerificationStatus;
        if (summaryStatus[fieldKey] === 'mismatch') {
            return summaryActions[fieldKey] !== 'pending';
        }
        return true;
    });

    const allItemsHandled = verificationResults ? 
        Object.keys(itemActions).length === verificationResults.length &&
        Object.values(itemActions).every(action => action !== 'pending')
        : true;
        
    const isReadyForApproval = !!data && allSummaryMismatchesHandled && allItemsHandled;
    
    const getSummaryStatusDisplay = () => {
        const hasMismatches = Object.values(summaryStatus).includes('mismatch');
        if (!hasMismatches && !summaryIsLoading) {
            return { text: 'ALL MATCH', className: 'bg-green-500/20 text-green-400' };
        }
        
        if (allSummaryMismatchesHandled) {
            return { text: 'REVIEWED', className: 'bg-cyan-500/20 text-cyan-400' };
        }
        
        return { text: 'REVIEW NEEDED', className: 'bg-yellow-500/20 text-yellow-400' };
    };
    
    const summaryStatusDisplay = getSummaryStatusDisplay();
    
    const perKgCharges = (data?.freight && data.grossWeight > 0) 
        ? `${data.freight.currency} ${(data.freight.value / data.grossWeight).toFixed(2)}`
        : 'N/A';

    const approvalButtonClasses = isReadyForApproval && !isApproved
        ? 'bg-green-600 hover:bg-green-500'
        : 'bg-slate-700';

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <FileUp className="mr-3 text-cyan-400" />
                Manual Verification
            </h1>
            <p className="text-slate-400 mb-8">Upload a checklist PDF to parse and verify it against your product database.</p>
            
            <div className="max-w-4xl mx-auto">
                 <FileUpload 
                    file={file}
                    onFileChange={setFile}
                    onParse={parseFile}
                    isProcessing={isProcessing}
                    processingStatus={processingStatus}
                 />
                 
                 {error && (
                    <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                        <h3 className="font-bold">Error</h3>
                        <p>{error}</p>
                    </div>
                 )}

                 {verificationResults && data && (
                    <div className="mt-8">
                        <div className="bg-slate-800 p-6 rounded-lg mb-6">
                            <h2 className="text-xl font-bold text-white mb-4">Verification Summary</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <VerifiedSummaryItem label="Importer Details" boeValue={data.importerName} settingsValue={settingsDetails?.importerName} status={summaryStatus.importerName} actionStatus={summaryActions.importerName} isLoading={summaryIsLoading} onAdd={() => handleSummaryAction('importerName', 'added', data.importerName, settingsDetails?.importerName, 'Importer Name')} onIgnore={() => handleSummaryAction('importerName', 'ignored', data.importerName, settingsDetails?.importerName, 'Importer Name')} className="md:col-span-2" />
                                <SummaryItem label="Supplier Details" className="md:col-span-2">{data.supplierDetails}</SummaryItem>
                                <SummaryItem label="Waybill No">{data.awbNumber}</SummaryItem>
                                <SummaryItem label="Invoice Value">{formatCurrency(data.invoiceValue)}</SummaryItem>
                                <VerifiedSummaryItem label="IEC Number" boeValue={data.iecNumber} settingsValue={settingsDetails?.iecNumber} status={summaryStatus.iecNumber} actionStatus={summaryActions.iecNumber} isLoading={summaryIsLoading} onAdd={() => handleSummaryAction('iecNumber', 'added', data.iecNumber, settingsDetails?.iecNumber, 'IEC Number')} onIgnore={() => handleSummaryAction('iecNumber', 'ignored', data.iecNumber, settingsDetails?.iecNumber, 'IEC Number')} />
                                <div>
                                    <p className="text-sm text-slate-400">Calculated Invoice Value</p>
                                    {calculatedInvoiceValueData ? (
                                        <p className={`text-base font-medium ${calculatedInvoiceValueData.isMatch ? 'text-green-400' : 'text-red-400'}`}>
                                            {calculatedInvoiceValueData.displayValue}
                                        </p>
                                    ) : <p className="text-base text-white font-medium">N/A</p>}
                                </div>
                                <VerifiedSummaryItem label="GSTIN" boeValue={data.gstin} settingsValue={settingsDetails?.gstin} status={summaryStatus.gstin} actionStatus={summaryActions.gstin} isLoading={summaryIsLoading} onAdd={() => handleSummaryAction('gstin', 'added', data.gstin, settingsDetails?.gstin, 'GSTIN')} onIgnore={() => handleSummaryAction('gstin', 'ignored', data.gstin, settingsDetails?.gstin, 'GSTIN')} />
                                <VerifiedSummaryItem label="AD Code" boeValue={data.adCode} settingsValue={settingsDetails?.adCode} status={summaryStatus.adCode} actionStatus={summaryActions.adCode} isLoading={summaryIsLoading} onAdd={() => handleSummaryAction('adCode', 'added', data.adCode, settingsDetails?.adCode, 'AD Code')} onIgnore={() => handleSummaryAction('adCode', 'ignored', data.adCode, settingsDetails?.adCode, 'AD Code')} />
                                <SummaryItem label="Incoterm">{data.incoterm}</SummaryItem>
                                <SummaryItem label="Gross Wt.">{data.grossWeight.toLocaleString()} KG</SummaryItem>
                                <SummaryItem label="Freight">{formatCurrency(data.freight)}</SummaryItem>
                                <SummaryItem label="Misc. Charges">{formatCurrency(data.miscCharges)}</SummaryItem>
                                <SummaryItem label="Per Kg Charges">{perKgCharges}</SummaryItem>
                                <SummaryItem label="Duty Amount" className="md:col-span-2">{formatDuty(data.dutyAmount)}</SummaryItem>
                                <SummaryItem label="Inv Nos and Dates" className="md:col-span-2">{data.invoiceNumbersAndDates}</SummaryItem>
                             </div>
                              <div className="flex justify-between items-center border-t border-slate-700 pt-4 mt-4">
                                <span className="text-slate-400 font-semibold">Overall Status</span>
                                <span className={`font-bold px-2 py-1 rounded text-xs ${summaryStatusDisplay.className}`}>
                                    {summaryStatusDisplay.text}
                                </span>
                            </div>
                        </div>

                        <VerificationTable 
                            results={verificationResults}
                            itemActions={itemActions}
                            onItemAction={handleItemAction}
                        />
                        
                        <div className="mt-8 flex flex-col items-end">
                             <div className="flex justify-end gap-4">
                                <a href="#/draft-email" className={`inline-flex items-center px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-colors ${isApproved ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    Review Correction Email
                                </a>
                                <button
                                    onClick={approveChecklist}
                                    className={`px-6 py-2 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${approvalButtonClasses}`}
                                    disabled={!isReadyForApproval || isApproved}
                                >
                                    {isApproved ? 'Approved' : 'Approve Checklist'}
                                </button>
                            </div>
                            {isApproved && (
                                <p className="mt-4 text-green-400 font-semibold text-center animate-pulse">
                                    Checklist approved! The email draft has been updated.
                                </p>
                            )}
                        </div>

                    </div>
                 )}
            </div>
        </div>
    );
};
