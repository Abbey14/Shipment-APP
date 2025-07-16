import type { Product } from '../types';
import { mockApi } from './mockApi';

const normalizeName = (name: string): string => {
    return name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
};

const productDbService = {
  async getProducts(): Promise<Product[]> {
    try {
      return await mockApi.fetchProducts();
    } catch (error) {
      console.error("Failed to retrieve products from API", error);
      return [];
    }
  },

  async saveProducts(products: Product[]): Promise<void> {
    try {
      await mockApi.saveProducts(products);
    } catch (error) {
      console.error("Failed to save products via API", error);
    }
  },
  
  findProductInList(name: string, products: Product[]): Product | null {
    const normalizedName = normalizeName(name);
    const product = products.find(p => normalizedName.includes(normalizeName(p.name)));
    return product || null;
  },

  parseCsv(csvText: string): Product[] {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error("CSV file is empty or missing headers.");
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['name', 'hsCode', 'unitPriceValue', 'unitPriceCurrency'];
    if (!requiredHeaders.every(h => headers.includes(h))) {
        throw new Error(`CSV file must contain the following headers: ${requiredHeaders.join(', ')}`);
    }

    const products: Product[] = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const data = lines[i].split(',');
        const row = headers.reduce((obj, nextKey, index) => {
            obj[nextKey] = data[index]?.trim();
            return obj;
        }, {} as {[key: string]: string});
        
        const priceValue = parseFloat(row.unitPriceValue);
        if (isNaN(priceValue)) {
            throw new Error(`Invalid number for unitPriceValue on line ${i + 1}: '${row.unitPriceValue}'`);
        }

        products.push({
            name: row.name,
            hsCode: row.hsCode,
            unitPrice: {
                value: priceValue,
                currency: row.unitPriceCurrency,
            },
        });
    }
    return products;
  },

  generateCsv(products: Product[]): string {
    const header = 'name,hsCode,unitPriceValue,unitPriceCurrency\n';
    const rows = products.map(p => 
        `${p.name},${p.hsCode},${p.unitPrice.value},${p.unitPrice.currency}`
    );
    return header + rows.join('\n');
  }
};

export { productDbService };
