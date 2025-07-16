import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/GlobalDataProvider';
import type { BoEData, SummaryVerificationStatus } from '../types';

const initialStatus: SummaryVerificationStatus = {
  importerName: 'not_available',
  iecNumber: 'not_available',
  gstin: 'not_available',
  adCode: 'not_available',
};

export const useSummaryVerification = (boeData: BoEData | null): { status: SummaryVerificationStatus; isLoading: boolean } => {
  const { details: savedDetails, isLoading: isSettingsLoading } = useSettings();
  const [status, setStatus] = useState<SummaryVerificationStatus>(initialStatus);
  
  useEffect(() => {
    if (!boeData || isSettingsLoading) {
      setStatus(initialStatus);
      return;
    }

    if (!savedDetails) {
      setStatus(initialStatus);
    } else {
      const newStatus: SummaryVerificationStatus = {
        importerName: boeData.importerName.trim() === savedDetails.importerName.trim() ? 'match' : 'mismatch',
        iecNumber: boeData.iecNumber.trim() === savedDetails.iecNumber.trim() ? 'match' : 'mismatch',
        gstin: boeData.gstin.trim() === savedDetails.gstin.trim() ? 'match' : 'mismatch',
        adCode: boeData.adCode.trim() === savedDetails.adCode.trim() ? 'match' : 'mismatch',
      };
      setStatus(newStatus);
    }
  }, [boeData, savedDetails, isSettingsLoading]);

  // The hook's loading state now reflects the settings loading state from the context.
  return { status, isLoading: isSettingsLoading };
};
