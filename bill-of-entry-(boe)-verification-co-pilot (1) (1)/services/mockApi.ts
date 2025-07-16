import type { ImporterDetails, Product } from '../types';

// This is our in-memory "cloud database" that is now backed by localStorage for persistence.
// In a real app, this would be a real database on Google Cloud.

const SETTINGS_KEY = 'boe_pilot_settings';
const PRODUCTS_KEY = 'boe_pilot_products';

// Simulate network latency to make the app feel real.
const networkDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const mockApi = {
  // --- Settings API ---
  async fetchSettings(): Promise<ImporterDetails | null> {
    await networkDelay(300); // Simulate fetching settings
    const savedData = localStorage.getItem(SETTINGS_KEY);
    const details = savedData ? JSON.parse(savedData) : null;
    console.log("Mock API (localStorage): Fetched settings", details);
    return details;
  },

  async saveSettings(details: ImporterDetails): Promise<void> {
    await networkDelay(500); // Simulate saving settings
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(details));
    console.log("Mock API (localStorage): Saved settings", details);
  },

  // --- Products API ---
  async fetchProducts(): Promise<Product[]> {
    await networkDelay(400); // Simulate fetching product list
    const savedData = localStorage.getItem(PRODUCTS_KEY);
    const products = savedData ? JSON.parse(savedData) : [];
    console.log("Mock API (localStorage): Fetched products", products);
    return products;
  },

  async saveProducts(products: Product[]): Promise<void> {
    await networkDelay(800); // Simulate a larger upload
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    console.log("Mock API (localStorage): Saved products", products.length);
  }
};
