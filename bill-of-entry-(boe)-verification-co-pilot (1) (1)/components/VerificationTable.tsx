import React from 'react';
import type { VerificationResult, Difference, MonetaryValue, ItemAction, ItemActions } from '../types';
import { Check, X, AlertTriangle, ArrowRight, MailPlus, ThumbsUp, Database, PlusCircle } from 'lucide-react';

const StatusIcon: React.FC<{ status: Difference['status'] }> = ({ status }) => {
    switch (status) {
        case 'match':
            return <Check className="h-5 w-5 text-green-500" />;
        case 'mismatch':
            return <X className="h-5 w-5 text-red-500" />;
        case 'missing_in_db':
            return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        default:
            return null;
    }
};

const DifferenceRow: React.FC<{ diff: Difference }> = ({ diff }) => (
    <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-slate-700/50">
        <div className="flex items-center gap-2">
             <StatusIcon status={diff.status} />
             <span className="font-medium text-slate-300">{diff.field}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
            <span>{diff.checklistValue}</span>
            {diff.status === 'mismatch' && <ArrowRight className="h-4 w-4 text-cyan-400" />}
            {diff.status === 'mismatch' && <span className="font-semibold text-white">{diff.dbValue}</span>}
            {diff.status === 'missing_in_db' && <span className="font-semibold text-yellow-400">{diff.dbValue}</span>}
        </div>
    </div>
);

const DetailItem: React.FC<{ label: string, value: React.ReactNode, className?: string }> = ({ label, value, className = '' }) => (
    <div className={className}>
        <dt className="text-xs text-slate-500 font-medium capitalize">{label}</dt>
        <dd className="text-sm text-slate-200 break-words">{value ?? 'N/A'}</dd>
    </div>
);

const ActionBadge: React.FC<{ action: ItemAction }> = ({ action }) => {
    const badgeMap = {
        'added_to_email': { text: 'Added to Email', icon: MailPlus, color: 'text-cyan-400' },
        'ignored': { text: 'Ignored', icon: ThumbsUp, color: 'text-yellow-400' },
        'added_to_db': { text: 'Added to DB', icon: Database, color: 'text-green-400' },
        'pending': { text: 'Pending', icon: AlertTriangle, color: 'text-slate-500' },
    };
    const { text, icon: Icon, color } = badgeMap[action] || badgeMap.pending;
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/50 text-xs font-semibold ${color}`}>
            <Icon className="h-4 w-4" />
            <span>{text}</span>
        </div>
    );
};

const ActionButton: React.FC<{ onClick: () => void; icon: React.ElementType, children: React.ReactNode, className: string }> = ({ onClick, icon: Icon, children, className }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${className}`}>
        <Icon className="h-4 w-4" />
        {children}
    </button>
);

interface VerificationTableProps {
    results: VerificationResult[];
    itemActions: ItemActions;
    onItemAction: (index: number, action: ItemAction, result: VerificationResult) => void;
}

export const VerificationTable: React.FC<VerificationTableProps> = ({ results, itemActions, onItemAction }) => {
    const formatCurrency = (money: MonetaryValue | undefined) => {
        if (!money || typeof money.value !== 'number' || !money.currency) return 'N/A';
        return `${money.currency} ${money.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-white mb-4">Verification Details</h3>
            <div className="space-y-4">
                {results.map((result, index) => {
                    const action = itemActions[index];
                    const isPending = action === 'pending';
                    const isReviewNeeded = result.overallStatus === 'review_needed';
                    const isMissingInDb = result.differences.some(d => d.status === 'missing_in_db');
                    const hasHsMismatch = result.differences.some(d => d.field === 'HS Code' && d.status === 'mismatch');

                    return (
                        <div key={index} className={`p-4 rounded-lg border ${isReviewNeeded ? 'border-yellow-800/30 bg-yellow-900/10' : 'border-green-800/20 bg-green-900/10'}`}>
                            <div className="mb-3">
                                <h4 className="font-semibold text-white break-all flex items-center">
                                    {result.boeItem.itemNumber && <span className="text-slate-400 mr-2 text-sm font-mono">#{result.boeItem.itemNumber}</span>}
                                    {result.boeItem.description}
                                </h4>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                                    <DetailItem label="Quantity" value={`${result.boeItem.quantity} ${result.boeItem.unit}`} />
                                    <DetailItem label="Unit Price" value={formatCurrency(result.boeItem.unitPrice)} />
                                    <DetailItem label="HSN" value={result.boeItem.hsCode} />
                                    <DetailItem label="BCD" value={result.boeItem.bcd ? `${result.boeItem.bcd}%` : 'N/A'} />
                                    <DetailItem label="Notification" value={result.boeItem.notificationDetails} className="sm:col-span-2" />
                                    <DetailItem label="Exch. Rate" value={result.boeItem.exchangeRate} />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                {result.differences.map((diff, diffIndex) => (
                                    <DifferenceRow key={diffIndex} diff={diff} />
                                ))}
                            </div>

                            {isReviewNeeded && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-end">
                                    {isPending ? (
                                        <div className="flex items-center gap-2">
                                            {isMissingInDb && (
                                                <ActionButton onClick={() => onItemAction(index, 'added_to_db', result)} icon={PlusCircle} className="bg-green-600/20 text-green-300 hover:bg-green-600/40">
                                                    Add to DB
                                                </ActionButton>
                                            )}
                                            {hasHsMismatch && (
                                                <ActionButton onClick={() => onItemAction(index, 'added_to_email', result)} icon={MailPlus} className="bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/40">
                                                    Add to Email
                                                </ActionButton>
                                            )}
                                            <ActionButton onClick={() => onItemAction(index, 'ignored', result)} icon={ThumbsUp} className="bg-slate-600/30 text-slate-300 hover:bg-slate-600/50">
                                                Ignore
                                            </ActionButton>
                                        </div>
                                    ) : (
                                        <ActionBadge action={action} />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};