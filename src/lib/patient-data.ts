
'use client';

import type { MedicationData } from './types';

const PATIENT_DATA_KEY = 'rxflow_patient_data_v1'; // Added versioning to key in case of structure changes

export function getAllPatientRecords(): MedicationData[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const data = localStorage.getItem(PATIENT_DATA_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading patient data from localStorage:", error);
    return [];
  }
}

export function addPatientRecord(record: MedicationData): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const records = getAllPatientRecords();
    // Add a unique ID to each record for potential future use (e.g., key in React list)
    // And to differentiate if the same prescription is "saved" multiple times,
    // though current logic replaces based on status.
    // For this simple store, we'll just push. A more robust store would check for duplicates/updates.
    const recordWithId = { ...record, id: record.id || `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`};
    records.push(recordWithId);
    localStorage.setItem(PATIENT_DATA_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("Error saving patient data to localStorage:", error);
  }
}

export function clearAllPatientRecords(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(PATIENT_DATA_KEY);
  console.log("All patient records cleared from localStorage.");
}
