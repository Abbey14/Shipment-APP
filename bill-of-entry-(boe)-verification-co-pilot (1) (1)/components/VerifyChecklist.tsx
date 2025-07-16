
import React, { useEffect, useState, useCallback } from 'react';
import { gmailService } from '../services/gmailService';
import { usePdfParser } from '../hooks/usePdfParser';
import { verificationService } from '../services/verificationService';
import type { MockEmail, VerificationResult, BoEData, MonetaryValue, VerificationStatus, SummaryVerificationStatus, SummaryAction, SummaryActions, ItemAction, ItemActions, Product, DutyAmount } from '../types';
import { VerificationTable } from './VerificationTable';
import { Loader, AlertTriangle, Mail, FileText, CheckCircle2, XCircle, ThumbsUp, MailPlus } from 'lucide-react';
import { useSummaryVerification } from '../hooks/useSummaryVerification';
import { useProducts, useSettings, useDraftEmail } from '../contexts/GlobalDataProvider';

// Mock function to "fetch" the PDF file from the mock email
const getMockPdfFile = (fileName: string): File => {
    const content = `This is a mock PDF for ${fileName}`;
    const blob = new Blob([content], { type: 'application/pdf' });
    return new File([blob], fileName, { type: 'application/pdf' });
};

const formatCurrency = (money: MonetaryValue | undefined) => {
    if (!money || typeof money.value !== 'number' || !money.currency) return 'N/A';
    return `${money.currency} ${money.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const formatDuty = (duty: DutyAmount | undefined) => {
    if (!duty) return 'N/A';
    return `${formatCurrency(duty.numerical)} (${duty.words})`;
};

const SummaryItem: React.FC<{ label: string; children: React.ReactNode; }> = ({ label, children }) => (
    <div className="flex justify-between">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium text-right text-ellipsis overflow-hidden whitespace-nowrap">{children}</span>
    </div>
);


const VerifiedSummaryItem: React.FC<{
    label: string;
    boeValue: string;
    settingsValue?: string;
    status: VerificationStatus;
    actionStatus: SummaryAction;
    isLoading: boolean;
    onAdd: () => void;
    onIgnore: () => void;
}> = ({ label, boeValue, settingsValue, status, actionStatus, isLoading, onAdd, onIgnore }) => {
    
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
        <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center">
                {label}
                {renderStatus()}
            </span>
            {status === 'mismatch' && actionStatus === 'pending' && !isLoading ? (
                 <div className="flex items-center gap-2">
                    <button onClick={onAdd} className="px-2 py-0.5 text-xs bg-cyan-600/50 hover:bg-cyan-600/80 border border-cyan-500/50 text-cyan-300 rounded">Add</button>
                    <button onClick={onIgnore} className="px-2 py-0.5 text-xs bg-slate-600/50 hover:bg-slate-600/80 border border-slate-500/50 text-slate-300 rounded">Ignore</button>
                </div>
            ) : (
                <span className="text-white font-medium text-right text-ellipsis overflow-hidden whitespace-nowrap" title={boeValue}>{boeValue}</span>
            )}
        </div>
    );
};


const initialSummaryActions: SummaryActions = {
    importerName: 'pending',
    iecNumber: 'pending',
    gstin: 'pending',
    adCode: 'pending'
};

export const VerifyChecklist: React.FC<{ emailId: string }> = ({ emailId }) => {
    const [email, setEmail] = useState<MockEmail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { 
      isProcessing: isParsing, 
      status: parsingStatus, 
      data: parsedData, 
      error: parsingError, 
      parse 
    } = usePdfParser();

    const { status: summaryStatus, isLoading: summaryIsLoading } = useSummaryVerification(parsedData);
    const { products, isLoading: areProductsLoading, addProduct } = useProducts();
    const { details: settingsDetails } = useSettings();
    const { appendToDraft, setDraftContent } = useDraftEmail();

    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResults, setVerificationResults] = useState<VerificationResult[] | null>(null);
    const [summaryActions, setSummaryActions] = useState<SummaryActions>(initialSummaryActions);
    const [itemActions, setItemActions] = useState<ItemActions>({});
    const [isApproved, setIsApproved] = useState(false);
    
    useEffect(() => {
        const fetchAndProcess = async () => {
            setIsLoading(true);
            setError(null);
            setVerificationResults(null);
            setSummaryActions(initialSummaryActions);
            setItemActions({});
            setIsApproved(false);
            try {
                const fetchedEmail = await gmailService.getEmailById(emailId);
                if (fetchedEmail) {
                    setEmail(fetchedEmail);
                    const mockPdf = getMockPdfFile(fetchedEmail.pdfAttachmentName);
                    await parse(mockPdf);
                } else {
                    setError(`Email with ID "${emailId}" not found.`);
                    setIsLoading(false);
                }
            } catch (err) {
                setError("Failed to fetch email details.");
                setIsLoading(false);
            }
        };
        fetchAndProcess();
    }, [emailId, parse]);

    useEffect(() => {
        const verifyData = async (boeData: BoEData) => {
            if (areProductsLoading) return; // Don't verify until products are loaded
            setIsVerifying(true);
            try {
                const results = await verificationService.verifyBoeData(boeData, products);
                setVerificationResults(results);
                setItemActions(results.reduce((acc, _, index) => ({ ...acc, [index]: 'pending' }), {}));
            } catch (err) {
                 setError("An error occurred during verification with product database.");
            } finally {
                setIsVerifying(false);
                setIsLoading(false);
            }
        };

        if (parsedData) {
            verifyData(parsedData);
        }
    }, [parsedData, products, areProductsLoading]);
    
    const handleSummaryAction = (field: keyof SummaryActions, action: SummaryAction, boeValue: string, settingsValue: string | undefined, label: string) => {
        if (action === 'added') {
            const correctionText = `- ${label}:\n  Checklist Value: "${boeValue}"\n  Correct Value:   "${settingsValue || 'N/A'}"`;
            appendToDraft(correctionText);
        }
        setSummaryActions(prev => ({...prev, [field]: action}));
    };
    
    const handleItemAction = useCallback((itemIndex: number, action: ItemAction, result: VerificationResult) => {
        if (action === 'added_to_email') {
            const hsCodeDiff = result.differences.find(d => d.field === 'HS Code' && d.status === 'mismatch');
            if (hsCodeDiff) {
                 const correctionText = `- Item Sr. No. ${result.boeItem.itemNumber || `(Desc: ${result.boeItem.description.substring(0,20)}...)`}: Correct HS Code\n  Checklist Value: "${hsCodeDiff.checklistValue}"\n  Correct Value:   "${hsCodeDiff.dbValue}"`;
                appendToDraft(correctionText);
            }
        }
        if (action === 'added_to_db') {
            const newProduct: Product = {
                name: result.boeItem.description,
                hsCode: result.boeItem.hsCode,
                unitPrice: result.boeItem.unitPrice
            };
            addProduct(newProduct);
        }
        setItemActions(prev => ({ ...prev, [itemIndex]: action }));
    }, [appendToDraft, addProduct]);

    const handleApprove = () => {
        const approvalEmail = `Hi Team,\n\nChecklist is Approved from our side.\nPlease go ahead and file.`;
        setDraftContent(approvalEmail);
        setIsApproved(true);
    };

    const calculatedInvoiceValueData = React.useMemo(() => {
        // Ensure we have data and items to process
        if (!parsedData || !parsedData.items || parsedData.items.length === 0) return null;

        // Check if all unit prices are available and have a currency
        if (parsedData.items.some(item => !item.unitPrice?.currency)) return {
            displayValue: 'Missing item price data',
            isMatch: false,
        };

        // Determine the currency from the first item
        const calculationCurrency = parsedData.items[0].unitPrice.currency;
        
        // Check if all items use the same currency
        const uniformCurrency = parsedData.items.every(
          (item) => item.unitPrice.currency === calculationCurrency
        );

        if (!uniformCurrency) {
          return {
            displayValue: "Mixed currencies in items",
            isMatch: false,
          };
        }

        // Calculate the total by multiplying quantity and unit price for each item
        const total = parsedData.items.reduce(
          (sum, item) => sum + (item.quantity * item.unitPrice.value),
          0
        );
        
        // Compare with the invoice value from the summary
        const isMatch =
          parsedData.invoiceValue.currency === calculationCurrency &&
          Math.abs(parsedData.invoiceValue.value - total) < 0.01; // Using a small tolerance for float comparison
        
        return {
            displayValue: `${calculationCurrency} ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            isMatch: isMatch
        };
    }, [parsedData]);

    const combinedError = error || parsingError;
    const isProcessing = isLoading || isParsing || isVerifying || areProductsLoading;
    
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
        
    const isReadyForApproval = !!parsedData && allSummaryMismatchesHandled && allItemsHandled;
    
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

    const perKgCharges = (parsedData?.freight && parsedData.grossWeight > 0) 
        ? `${parsedData.freight.currency} ${(parsedData.freight.value / parsedData.grossWeight).toFixed(2)}`
        : 'N/A';

    const approvalButtonClasses = isReadyForApproval && !isApproved
        ? 'bg-green-600 hover:bg-green-500'
        : 'bg-slate-700';

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Verify Checklist</h1>
            {email && <p className="text-slate-400 mb-8">Verifying checklist from email: <span className="font-medium text-slate-300">{email.subject}</span></p>}

            {isProcessing && !combinedError && (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Loader className="animate-spin h-8 w-8 mb-4" />
                    <p className="font-semibold text-lg">Processing...</p>
                    <p>{parsingStatus || (isVerifying ? 'Comparing with product database...' : (areProductsLoading ? 'Loading product data...' : 'Fetching email...'))}</p>
                </div>
            )}
            
            {combinedError && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-lg">An Error Occurred</h3>
                        <p>{combinedError}</p>
                    </div>
                </div>
            )}

            {!isProcessing && !combinedError && parsedData && verificationResults && email && (
                 <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div className="bg-slate-800 p-4 rounded-lg">
                                <h2 className="text-xl font-bold text-white mb-3">Summary</h2>
                                <div className="space-y-3 text-sm">
                                    <VerifiedSummaryItem label="Importer" boeValue={parsedData.importerName} settingsValue={settingsDetails?.importerName} status={summaryStatus.importerName} actionStatus={summaryActions.importerName} isLoading={summaryIsLoading} onAdd={() => handleSummaryAction('importerName', 'added', parsedData.importerName, settingsDetails?.importerName, 'Importer Name')} onIgnore={() => handleSummaryAction('importerName', 'ignored', parsedData.importerName, settingsDetails?.importerName, 'Importer Name')} />
                                    <SummaryItem label="AWB Number">{parsedData.awbNumber}</SummaryItem>
                                    <SummaryItem label="Invoice Value">{formatCurrency(parsedData.invoiceValue)}</SummaryItem>
                                    {calculatedInvoiceValueData && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Calculated Invoice Value</span>
                                            <span className={`font-medium text-right ${calculatedInvoiceValueData.isMatch ? 'text-green-400' : 'text-red-400'}`}>
                                                {calculatedInvoiceValueData.displayValue}
                                            </span>
                                        </div>
                                    )}
                                    <VerifiedSummaryItem label="IEC Number" boeValue={parsedData.iecNumber} settingsValue={settingsDetails?.iecNumber} status={summaryStatus.iecNumber} actionStatus={summaryActions.iecNumber} isLoading={summaryIsLoading} onAdd={() => handleSummaryAction('iecNumber', 'added', parsedData.iecNumber, settingsDetails?.iecNumber, 'IEC Number')} onIgnore={() => handleSummaryAction('iecNumber', 'ignored', parsedData.iecNumber, settingsDetails?.iecNumber, 'IEC Number')} />
                                    <VerifiedSummaryItem label="GSTIN" boeValue={parsedData.gstin} settingsValue={settingsDetails?.gstin} status={summaryStatus.gstin} actionStatus={summaryActions.gstin} isLoading={summaryIsLoading} onAdd={() => handleSummaryAction('gstin', 'added', parsedData.gstin, settingsDetails?.gstin, 'GSTIN')} onIgnore={() => handleSummaryAction('gstin', 'ignored', parsedData.gstin, settingsDetails?.gstin, 'GSTIN')} />
                                    <VerifiedSummaryItem label="AD Code" boeValue={parsedData.adCode} settingsValue={settingsDetails?.adCode} status={summaryStatus.adCode} actionStatus={summaryActions.adCode} isLoading={summaryIsLoading} onAdd={() => handleSummaryAction('adCode', 'added', parsedData.adCode, settingsDetails?.adCode, 'AD Code')} onIgnore={() => handleSummaryAction('adCode', 'ignored', parsedData.adCode, settingsDetails?.adCode, 'AD Code')} />
                                    <SummaryItem label="Incoterm">{parsedData.incoterm}</SummaryItem>
                                    <SummaryItem label="Gross Wt.">{parsedData.grossWeight.toLocaleString()} KG</SummaryItem>
                                    <SummaryItem label="Freight">{formatCurrency(parsedData.freight)}</SummaryItem>
                                    <SummaryItem label="Misc. Charges">{formatCurrency(parsedData.miscCharges)}</SummaryItem>
                                    <SummaryItem label="Per Kg Charges">{perKgCharges}</SummaryItem>
                                    <SummaryItem label="Duty Amount">{formatDuty(parsedData.dutyAmount)}</SummaryItem>
                                     <div className="flex justify-between items-center border-t border-slate-700 pt-3 mt-3">
                                        <span className="text-slate-400 font-semibold">Overall Status</span>
                                        <span className={`font-bold px-2 py-1 rounded text-xs ${summaryStatusDisplay.className}`}>
                                            {summaryStatusDisplay.text}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-800 p-4 rounded-lg">
                                <h2 className="text-xl font-bold text-white mb-3">Source</h2>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-slate-500" />
                                        <div>
                                            <p className="text-slate-400">From: <span className="text-white">{email.from}</span></p>
                                            <p className="text-slate-400">Subject: <span className="text-white">{email.subject}</span></p>
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-slate-500" />
                                         <p className="text-slate-400">Attachment: <span className="text-white">{email.pdfAttachmentName}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-lg">
                            <VerificationTable
                                results={verificationResults}
                                itemActions={itemActions}
                                onItemAction={handleItemAction}
                            />
                        </div>
                    </div>
                    
                    <div className="mt-8 flex flex-col items-end">
                        <div className="flex justify-end gap-4">
                            <a href="#/draft-email" className={`inline-flex items-center px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-colors ${isApproved ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                Review Correction Email
                            </a>
                            <button
                                onClick={handleApprove}
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
    );
};
