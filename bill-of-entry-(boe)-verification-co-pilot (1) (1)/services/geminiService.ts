import type { BoEData, MonetaryValue } from '../types';

// The URL for the backend server. For development, this points to the local FastAPI server.
const BACKEND_URL = 'http://127.0.0.1:8000/api/v1/parse-pdf';

export const extractBoEData = async (text: string, options?: { needsCorrection: boolean; invoiceValue: MonetaryValue }): Promise<BoEData> => {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        options: options,
      }),
    });

    if (!response.ok) {
      // Try to parse the error message from the backend
      let errorDetail = `Backend returned status ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
      } catch (e) {
        // Could not parse JSON, use the status text
        errorDetail = response.statusText;
      }
      throw new Error(errorDetail);
    }

    const jsonData = await response.json();
    return jsonData as BoEData;

  } catch (error) {
    console.error("Error calling backend service:", error);
    if (error instanceof TypeError) { // This often indicates a network error
        throw new Error("Cannot connect to the backend service. Please ensure the backend server is running and accessible.");
    }
    // Re-throw the error to be caught by the calling hook
    throw error;
  }
};
