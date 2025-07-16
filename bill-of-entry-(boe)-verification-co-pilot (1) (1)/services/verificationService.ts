import { productDbService } from './productDbService';
import type { BoEData, BoEItem, Product, VerificationResult, Difference, MonetaryValue } from '../types';

const formatCurrency = (money: MonetaryValue) => `${money.currency} ${money.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const compareFields = (item: BoEItem, product: Product): Difference[] => {
  const differences: Difference[] = [];

  // Compare HS Code
  if (item.hsCode !== product.hsCode) {
    differences.push({
      field: 'HS Code',
      checklistValue: item.hsCode,
      dbValue: product.hsCode,
      status: 'mismatch',
    });
  } else {
    differences.push({ field: 'HS Code', checklistValue: item.hsCode, dbValue: product.hsCode, status: 'match' });
  }

  // Compare Unit Price
  const checklistPrice = item.unitPrice;
  const dbPrice = product.unitPrice;

  if (checklistPrice.currency !== dbPrice.currency || checklistPrice.value !== dbPrice.value) {
    differences.push({
      field: 'Unit Price',
      checklistValue: formatCurrency(checklistPrice),
      dbValue: formatCurrency(dbPrice),
      status: 'mismatch',
    });
  } else {
    differences.push({ field: 'Unit Price', checklistValue: formatCurrency(checklistPrice), dbValue: formatCurrency(dbPrice), status: 'match' });
  }
  
  return differences;
};

export const verificationService = {
  verifyBoeData: async (boeData: BoEData, allProducts: Product[]): Promise<VerificationResult[]> => {
    const verificationResults: VerificationResult[] = [];

    for (const item of boeData.items) {
      // Look up the product in the provided list instead of making a new API call each time.
      const product = productDbService.findProductInList(item.description, allProducts);

      let differences: Difference[] = [];
      let overallStatus: 'ok' | 'review_needed' = 'ok';

      if (!product) {
        differences.push({
          field: 'Product Lookup',
          checklistValue: item.description,
          dbValue: 'Not Found in DB',
          status: 'missing_in_db',
        });
        overallStatus = 'review_needed';
      } else {
        differences = compareFields(item, product);
        if (differences.some(d => d.status !== 'match')) {
          overallStatus = 'review_needed';
        }
      }

      verificationResults.push({
        boeItem: item,
        product,
        differences,
        overallStatus,
      });
    }

    return verificationResults;
  },
};
