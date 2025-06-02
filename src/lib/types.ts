import type { ExtractMedicationDataOutput } from '@/ai/flows/extract-medication-data';

export type MedicationData = ExtractMedicationDataOutput;

// Admin User Management Types
export type UserRole = 'admin' | 'pharmacist' | 'technician' | 'unassigned';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface NewUserFormData {
  email: string;
  role: UserRole;
}
