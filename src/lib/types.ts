
import type { ExtractMedicationDataOutput } from '@/ai/flows/extract-medication-data';

export type UserRole = 'admin' | 'pharmacist' | 'technician' | 'unassigned';

export type MedicationStatus = 'pending_extraction' | 'pending_review' | 'reviewed' | 'packed';

// Add an optional id field to MedicationData, which can be used as a key in lists
// and potentially for identifying records in a more complex store.
export interface MedicationData extends ExtractMedicationDataOutput {
  id?: string; // Optional unique identifier for the record
  status?: MedicationStatus;
}

// Updated AppUser for conceptual user management within AuthContext
export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  // Source helps distinguish hardcoded conceptual users
  // This might be expanded if integrating with a real auth system later
  source: 'hardcoded';
  canUploadDocs?: boolean;
  canReviewDocs?: boolean;
  canApproveMedication?: boolean;
}

export interface NewUserFormData {
  email: string;
  role: UserRole;
  password?: string; // Password for conceptual user creation by admin
  canUploadDocs?: boolean;
  canReviewDocs?: boolean;
  canApproveMedication?: boolean;
}

// Conceptual user stored in AdminPage state
export interface ConceptualUser extends NewUserFormData {
  id: string; 
  isSystemUser?: boolean; // Flag to identify if the user is from the hardcoded list
  // email, role, password, canUploadDocs, canReviewDocs, canApproveMedication are inherited
}
