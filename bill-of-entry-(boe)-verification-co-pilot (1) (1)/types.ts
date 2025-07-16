// Data structure for saved importer settings
export interface ImporterDetails {
  importerName: string;
  iecNumber: string;
  gstin: string;
  adCode: string;
}

// Status for a single verified field
export type VerificationStatus = 'match' | 'mismatch' | 'not_available';

// Status object for all verified summary fields
export interface SummaryVerificationStatus {
  importerName: VerificationStatus;
  iecNumber: VerificationStatus;
  gstin: VerificationStatus;
  adCode: VerificationStatus;
}

// A reusable structure for monetary values
export interface MonetaryValue {
  value: number;
  currency: string; // e.g., 'USD', 'EUR', 'INR'
}

// Structure for total duty amount
export interface DutyAmount {
  words: string;
  numerical: MonetaryValue;
}

// Data structure for the user-managed product database
export interface Product {
  name: string;
  hsCode: string;
  unitPrice: MonetaryValue;
}

// Data structure from the parsed Bill of Entry (BoE) PDF
export interface BoEData {
  awbNumber: string;
  importerName: string;
  adCode: string;
  iecNumber: string;
  gstin: string;
  incoterm: string;
  grossWeight: number; // Assuming KG
  freight: MonetaryValue;
  miscCharges: MonetaryValue;
  invoiceValue: MonetaryValue;
  invoiceNumbersAndDates: string;
  supplierDetails: string;
  dutyAmount?: DutyAmount; // Optional total duty amount
  items: BoEItem[];
}

export interface BoEItem {
  itemNumber?: number; // Optional item serial number
  description: string;
  hsCode: string;
  quantity: number;
  unit: string;
  unitPrice: MonetaryValue;
  totalPrice: MonetaryValue;
  bcd?: number; // Basic Customs Duty as a percentage, e.g., 7.5
  notificationDetails?: string; // e.g., "01/2017-Cus (Sl. No. 45)"
  exchangeRate?: number; // e.g., 83.50
}

// Result of comparing one field
export interface Difference {
  field: string;
  checklistValue: string; // Display-ready string
  dbValue: string; // Display-ready string
  status: 'match' | 'mismatch' | 'missing_in_db';
}

// The final result of verification for one item
export interface VerificationResult {
  boeItem: BoEItem;
  product: Product | null;
  differences: Difference[];
  overallStatus: 'ok' | 'review_needed';
}

// Mock email structure from Gmail
export interface MockEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  status: 'new' | 'processed' | 'approved';
  pdfAttachmentName: string; // e.g. 'checklist_123.pdf'
}

// Type for the results displayed in the ResultsDisplay component.
export interface ParsingResults {
  consolidatedText?: string;
  structuredText?: string;
  directText?: string;
  ocrText?: string;
}

// Type for handling summary mismatch actions
export type SummaryAction = 'pending' | 'added' | 'ignored';

export interface SummaryActions {
    importerName: SummaryAction;
    iecNumber: SummaryAction;
    gstin: SummaryAction;
    adCode: SummaryAction;
}

// Type for handling item-level mismatch actions
export type ItemAction = 'pending' | 'added_to_email' | 'ignored' | 'added_to_db';

export interface ItemActions {
    [itemIndex: number]: ItemAction;
}