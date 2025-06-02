
'use server';

import { extractMedicationData } from '@/ai/flows/extract-medication-data';
import { getDrugInfo } from '@/ai/flows/get-drug-info-flow';
import type { AppStatusType } from './page'; // Ensure this type is defined in page.tsx

// A very small, transparent 1x1 pixel PNG data URI
const DUMMY_FAX_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export async function checkAiFaxProcessingStatus(): Promise<{ success: boolean; message: string; newStatus: AppStatusType }> {
  try {
    await extractMedicationData({ faxDataUri: DUMMY_FAX_DATA_URI });
    return { success: true, message: 'AI Fax Processing flow successfully invoked.', newStatus: 'active' };
  } catch (error: any) {
    console.error('Error checking AI Fax Processing status:', error);
    return { success: false, message: `AI Fax Processing flow error: ${error.message || 'Unknown error'}`, newStatus: 'error' };
  }
}

export async function checkExternalApiIntegrationStatus(): Promise<{ success: boolean; message: string; newStatus: AppStatusType }> {
  try {
    const result = await getDrugInfo({ medicationName: 'lisinopril' });
    if (result && result.sideEffects && result.sideEffects.length > 0) {
      const isRealData = !result.sideEffects.includes('No side effect information available for this medication in the mock database.');
      return { 
        success: true, 
        message: `Mock Drug Info API responded. Data: ${isRealData ? result.sideEffects.join(', ') : 'placeholder message'}`, 
        newStatus: 'active (mocked)' 
      };
    }
    return { success: false, message: 'Mock Drug Info API responded with unexpected data.', newStatus: 'error' };
  } catch (error: any) {
    console.error('Error checking External API Integration status:', error);
    return { success: false, message: `Mock Drug Info API error: ${error.message || 'Unknown error'}`, newStatus: 'error' };
  }
}

export async function checkAutomatedFaxIntakeStatus(): Promise<{ success: boolean; message: string; newStatus: AppStatusType }> {
  // This is simulated as offline
  await new Promise(resolve => setTimeout(resolve, 750)); // Simulate network delay
  return { success: false, message: 'Automated Fax Intake service is simulated as offline.', newStatus: 'error' };
}
