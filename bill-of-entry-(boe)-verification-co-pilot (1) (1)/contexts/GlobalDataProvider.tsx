import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ImporterDetails, Product, BoEData, VerificationResult, SummaryAction, SummaryActions, ItemAction, ItemActions } from '../types';
import { settingsService } from '../services/settingsService';
import { productDbService } from '../services/productDbService';
import { usePdfParser } from '../hooks/usePdfParser';
import { verificationService } from '../services/verificationService';

// --- Settings Context ---
interface SettingsContextType {
    details: ImporterDetails | null;
    isLoading: boolean;
    saveSettings: (details: ImporterDetails) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a GlobalDataProvider');
    }
    return context;
};

// --- Products Context ---
interface ProductsContextType {
    products: Product[];
    isLoading: boolean;
    saveProducts: (products: Product[]) => Promise<void>;
    addProduct: (product: Product) => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const useProducts = () => {
    const context = useContext(ProductsContext);
    if (!context) {
        throw new Error('useProducts must be used within a GlobalDataProvider');
    }
    return context;
};

// --- Draft Email Context ---
interface DraftEmailContextType {
    draftContent: string;
    appendToDraft: (content: string) => void;
    setDraftContent: (content: string) => void;
    clearDraft: () => void;
}

const DraftEmailContext = createContext<DraftEmailContextType | undefined>(undefined);

export const useDraftEmail = () => {
    const context = useContext(DraftEmailContext);
    if (!context) {
        throw new Error('useDraftEmail must be used within a GlobalDataProvider');
    }
    return context;
};

// --- Manual Verification Context ---
const initialSummaryActions: SummaryActions = {
    importerName: 'pending',
    iecNumber: 'pending',
    gstin: 'pending',
    adCode: 'pending'
};

interface ManualVerificationContextType {
    file: File | null;
    isProcessing: boolean;
    processingStatus: string;
    data: BoEData | null;
    error: string | null;
    verificationResults: VerificationResult[] | null;
    summaryActions: SummaryActions;
    itemActions: ItemActions;
    isApproved: boolean;
    setFile: (file: File | null) => void;
    parseFile: () => Promise<void>;
    handleSummaryAction: (field: keyof SummaryActions, action: SummaryAction, boeValue: string, settingsValue: string | undefined, label: string) => void;
    handleItemAction: (itemIndex: number, action: ItemAction, result: VerificationResult) => void;
    approveChecklist: () => void;
}

const ManualVerificationContext = createContext<ManualVerificationContextType | undefined>(undefined);

export const useManualVerification = () => {
    const context = useContext(ManualVerificationContext);
    if (!context) {
        throw new Error('useManualVerification must be used within a GlobalDataProvider');
    }
    return context;
}


// --- Global Data Provider ---
export const GlobalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Settings State
    const [settingsDetails, setSettingsDetails] = useState<ImporterDetails | null>(null);
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);

    // Products State
    const [products, setProducts] = useState<Product[]>([]);
    const [isProductsLoading, setIsProductsLoading] = useState(true);
    
    // Draft Email State
    const [draftContent, setDraftContent] = useState('');
    
    // Manual Verification State
    const [manualFile, setManualFile] = useState<File | null>(null);
    const { isProcessing: isParsing, status: parsingStatus, data: parsedData, error: parsingError, parse, reset: resetParser } = usePdfParser();
    const [manualVerificationResults, setManualVerificationResults] = useState<VerificationResult[] | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [manualSummaryActions, setManualSummaryActions] = useState<SummaryActions>(initialSummaryActions);
    const [manualItemActions, setManualItemActions] = useState<ItemActions>({});
    const [manualIsApproved, setManualIsApproved] = useState(false);

    // Initial data load for settings and products
    useEffect(() => {
        const loadInitialData = async () => {
            setIsSettingsLoading(true);
            const loadedDetails = await settingsService.getImporterDetails();
            setSettingsDetails(loadedDetails);
            setIsSettingsLoading(false);

            setIsProductsLoading(true);
            const loadedProducts = await productDbService.getProducts();
            setProducts(loadedProducts);
            setIsProductsLoading(false);
        };
        loadInitialData();
    }, []);

    // Effect for running manual verification after parsing
    useEffect(() => {
        const verifyData = async (boeData: BoEData) => {
            if (isProductsLoading) return; // Don't run verification until products are loaded
            setIsVerifying(true);
            const results = await verificationService.verifyBoeData(boeData, products);
            setManualVerificationResults(results);
            setManualItemActions(results.reduce((acc, _, index) => ({ ...acc, [index]: 'pending' }), {}));
            setIsVerifying(false);
        };

        if (parsedData) {
            verifyData(parsedData);
        }
    }, [parsedData, products, isProductsLoading]);

    // Settings actions
    const saveSettings = useCallback(async (detailsToSave: ImporterDetails) => {
        await settingsService.saveImporterDetails(detailsToSave);
        setSettingsDetails(detailsToSave);
    }, []);

    // Products actions
    const saveProducts = useCallback(async (productsToSave: Product[]) => {
        await productDbService.saveProducts(productsToSave);
        setProducts(productsToSave);
    }, []);

    const addProduct = useCallback(async (newProduct: Product) => {
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts); // Optimistic update
        await productDbService.saveProducts(updatedProducts);
    }, [products]);


    // Draft Email actions
    const appendToDraft = useCallback((content: string) => {
        setDraftContent(prev => {
            const intro = `Hi Team,\n\nPlease see the requested corrections for the attached checklist:`;
            if (prev.startsWith(intro)) {
                return `${prev}\n\n${content}`;
            }
            // If the current content is an approval message, start fresh
            if(prev.includes('Checklist is Approved')){
                 return `${intro}\n\n${content}`;
            }
            if (prev) {
                 return `${prev}\n\n${content}`;
            }
            return `${intro}\n\n${content}`;
        });
    }, []);

    const clearDraft = useCallback(() => {
        setDraftContent('');
    }, []);

    // Manual Verification Actions
    const setFileForManualVerification = useCallback((file: File | null) => {
        setManualFile(file);
        if (!file) {
            resetParser();
            setManualVerificationResults(null);
            setManualSummaryActions(initialSummaryActions);
            setManualItemActions({});
            setManualIsApproved(false);
        }
    }, [resetParser]);

    const parseManualFile = useCallback(async () => {
        if (!manualFile) return;
        setManualVerificationResults(null);
        setManualSummaryActions(initialSummaryActions);
        setManualItemActions({});
        setManualIsApproved(false);
        await parse(manualFile);
    }, [manualFile, parse]);
    
    const approveManualChecklist = useCallback(() => {
        const approvalEmail = `Hi Team,\n\nChecklist is Approved from our side.\nPlease go ahead and file.`;
        setDraftContent(approvalEmail);
        setManualIsApproved(true);
    }, [setDraftContent]);

    const handleManualSummaryAction = useCallback((field: keyof SummaryActions, action: SummaryAction, boeValue: string, settingsValue: string | undefined, label: string) => {
        if (action === 'added') {
            const correctionText = `- ${label}:\n  Checklist Value: "${boeValue}"\n  Correct Value:   "${settingsValue || 'N/A'}"`;
            appendToDraft(correctionText);
        }
        setManualSummaryActions(prev => ({...prev, [field]: action}));
    }, [appendToDraft]);

    const handleManualItemAction = useCallback((itemIndex: number, action: ItemAction, result: VerificationResult) => {
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
        setManualItemActions(prev => ({ ...prev, [itemIndex]: action }));
    }, [appendToDraft, addProduct]);


    const settingsValue: SettingsContextType = { details: settingsDetails, isLoading: isSettingsLoading, saveSettings };
    const productsValue: ProductsContextType = { products, isLoading: isProductsLoading, saveProducts, addProduct };
    const draftEmailValue: DraftEmailContextType = { draftContent, appendToDraft, setDraftContent, clearDraft };
    const manualVerificationValue: ManualVerificationContextType = {
        file: manualFile,
        isProcessing: isParsing || isVerifying || isProductsLoading,
        processingStatus: isVerifying ? 'Comparing with product database...' : (isProductsLoading ? 'Loading product data...' : parsingStatus),
        data: parsedData,
        error: parsingError,
        verificationResults: manualVerificationResults,
        summaryActions: manualSummaryActions,
        itemActions: manualItemActions,
        isApproved: manualIsApproved,
        setFile: setFileForManualVerification,
        parseFile: parseManualFile,
        handleSummaryAction: handleManualSummaryAction,
        handleItemAction: handleManualItemAction,
        approveChecklist: approveManualChecklist,
    };

    return (
        <SettingsContext.Provider value={settingsValue}>
            <ProductsContext.Provider value={productsValue}>
                <DraftEmailContext.Provider value={draftEmailValue}>
                   <ManualVerificationContext.Provider value={manualVerificationValue}>
                        {children}
                   </ManualVerificationContext.Provider>
                </DraftEmailContext.Provider>
            </ProductsContext.Provider>
        </SettingsContext.Provider>
    );
};