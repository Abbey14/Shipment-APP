import type { ImporterDetails } from '../types';
import { mockApi } from './mockApi';

export const settingsService = {
  async saveImporterDetails(details: ImporterDetails): Promise<void> {
    try {
      await mockApi.saveSettings(details);
    } catch (error) {
      console.error("Failed to save importer details via API", error);
      // In a real app, you might want to throw the error
      // to be handled by the UI.
    }
  },

  async getImporterDetails(): Promise<ImporterDetails | null> {
    try {
      const details = await mockApi.fetchSettings();
      return details;
    } catch (error) {
      console.error("Failed to retrieve importer details from API", error);
      return null;
    }
  },
};
