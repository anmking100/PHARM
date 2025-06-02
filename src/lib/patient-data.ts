
'use client';

import type { MedicationData } from './types';

const PATIENT_DATA_KEY = 'rxflow_patient_data_v1';

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

export function upsertPatientRecord(record: MedicationData): MedicationData {
  if (typeof window === 'undefined') {
    return record; // Should not happen in client-side flow
  }
  try {
    const records = getAllPatientRecords();
    const recordId = record.id || `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const updatedRecord = { ...record, id: recordId };

    const existingRecordIndex = records.findIndex(r => r.id === updatedRecord.id);

    if (existingRecordIndex > -1) {
      records[existingRecordIndex] = updatedRecord; // Update existing
    } else {
      records.push(updatedRecord); // Add new
    }
    localStorage.setItem(PATIENT_DATA_KEY, JSON.stringify(records));
    return updatedRecord; // Return the record with ID
  } catch (error) {
    console.error("Error upserting patient data to localStorage:", error);
    return record; // Return original record on error
  }
}

export function deletePatientRecord(recordId: string): boolean {
  if (typeof window === 'undefined' || !recordId) {
    return false;
  }
  try {
    let records = getAllPatientRecords();
    const initialLength = records.length;
    records = records.filter(r => r.id !== recordId);
    if (records.length < initialLength) {
      localStorage.setItem(PATIENT_DATA_KEY, JSON.stringify(records));
      console.log(`Record with ID ${recordId} deleted.`);
      return true;
    }
    console.log(`Record with ID ${recordId} not found for deletion.`);
    return false; // Record not found
  } catch (error) {
    console.error(`Error deleting patient record with ID ${recordId} from localStorage:`, error);
    return false;
  }
}

export function clearAllPatientRecords(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(PATIENT_DATA_KEY);
  console.log("All patient records cleared from localStorage.");
}

