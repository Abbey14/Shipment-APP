import React, { useState, useMemo } from 'react';
import { productDbService } from '../services/productDbService';
import type { Product, MonetaryValue } from '../types';
import { Database, Search, Upload, Download, AlertTriangle, Loader } from 'lucide-react';
import { useProducts } from '../contexts/GlobalDataProvider';

const formatCurrency = (money: MonetaryValue) => {
    if (!money || typeof money.value !== 'number' || !money.currency) return 'N/A';
    return `${money.currency} ${money.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const Products: React.FC = () => {
    const { products, isLoading, saveProducts } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.hsCode.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            setError(null);
            setSuccess(null);
            setIsUploading(true);
            try {
                const parsedProducts = productDbService.parseCsv(text);
                await saveProducts(parsedProducts);
                setSuccess(`${parsedProducts.length} products successfully imported.`);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred during parsing.");
            } finally {
                setIsUploading(false);
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleFileDownload = () => {
        const csvString = productDbService.generateCsv(products);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "product_database.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const renderTableBody = () => {
        if (isLoading) {
            return (
                <tr>
                    <td colSpan={3} className="text-center p-8 text-slate-500">
                        <div className="flex items-center justify-center">
                           <Loader className="h-6 w-6 mr-2 animate-spin" />
                           <span>Loading product database...</span>
                        </div>
                    </td>
                </tr>
            );
        }
        if (filteredProducts.length > 0) {
            return filteredProducts.map((p, index) => (
                <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 font-medium text-white">{p.name}</td>
                    <td className="p-3 text-slate-300 font-mono text-sm">{p.hsCode}</td>
                    <td className="p-3 text-slate-300 text-right">{formatCurrency(p.unitPrice)}</td>
                </tr>
            ));
        }
        return (
             <tr>
                <td colSpan={3} className="text-center p-8 text-slate-500">
                    <div className="flex flex-col items-center">
                        <AlertTriangle className="h-8 w-8 mb-2" />
                        <span>{products.length === 0 ? "Your product database is empty." : "No products match your search."}</span>
                        {products.length === 0 && <span className="text-sm">Upload a CSV to get started.</span>}
                    </div>
                </td>
            </tr>
        );
    };
    
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <Database className="mr-3 text-cyan-400" />
                Product Database
            </h1>
            <p className="text-slate-400 mb-8">Manage your product catalog for automated verification.</p>

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-slate-900 border border-slate-700 rounded-md pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleFileDownload}
                            disabled={isLoading || products.length === 0}
                            className="inline-flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                        </button>
                        <label className={`inline-flex items-center justify-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors text-sm ${isUploading ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}>
                           {isUploading ? (
                               <Loader className="animate-spin mr-2 h-4 w-4" />
                           ) : (
                               <Upload className="mr-2 h-4 w-4" />
                           )}
                           <span className="w-24 text-center">{isUploading ? 'Uploading...' : 'Upload CSV'}</span>
                            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                    </div>
                </div>

                {error && <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md text-sm">{error}</div>}
                {success && <div className="mb-4 p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-md text-sm">{success}</div>}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="p-3 text-sm font-semibold text-slate-400">Product Name</th>
                                <th className="p-3 text-sm font-semibold text-slate-400">HS Code</th>
                                <th className="p-3 text-sm font-semibold text-slate-400 text-right">Unit Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableBody()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
