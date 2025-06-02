
'use server';

import type { NewUserFormData, UserRole, ConceptualUser } from '@/lib/types';

// Define HARDCODED_USERS_FOR_ADMIN_VIEW directly here for use in getSystemUsers
// This avoids exporting it from a 'use server' context in login/actions.ts
export const HARDCODED_USERS_FOR_ADMIN_VIEW: Record<string, { password?: string, role: UserRole }> = {
  'admin@example.com': { password: 'password123', role: 'admin' },
  'pharmacist@example.com': { password: 'password123', role: 'pharmacist' },
  'technician@example.com': { password: 'password123', role: 'technician' },
};


export async function getSystemUsers(): Promise<ConceptualUser[]> {
  return Object.entries(HARDCODED_USERS_FOR_ADMIN_VIEW).map(([email, data]) => {
    const isPrivileged = data.role === 'admin' || data.role === 'pharmacist';
    const canUpload = data.role === 'admin' || data.role === 'pharmacist' || data.role === 'technician';
    
    // Default permissions based on role
    let defaultCanUploadDocs = false;
    let defaultCanReviewDocs = false;
    let defaultCanApproveMedication = false;

    switch (data.role) {
        case 'admin':
            defaultCanUploadDocs = true;
            defaultCanReviewDocs = true;
            defaultCanApproveMedication = true;
            break;
        case 'pharmacist':
            defaultCanUploadDocs = true;
            defaultCanReviewDocs = true;
            defaultCanApproveMedication = true;
            break;
        case 'technician':
            defaultCanUploadDocs = true;
            defaultCanReviewDocs = false; 
            defaultCanApproveMedication = false;
            break;
    }
    
    return {
      id: email, // Use email as ID for hardcoded users
      email: email,
      role: data.role,
      password: data.password, // Store password conceptually, not displayed
      canUploadDocs: defaultCanUploadDocs,
      canReviewDocs: defaultCanReviewDocs,
      canApproveMedication: defaultCanApproveMedication,
    };
  });
}


export async function createUserWithRole(
  userData: NewUserFormData
): Promise<{ 
  success: boolean; 
  message: string; 
  userId?: string; 
  email?: string; 
  role?: UserRole;
  canUploadDocs?: boolean;
  canReviewDocs?: boolean;
  canApproveMedication?: boolean; 
}> {
  console.log('[AdminAction] Attempting to create user (conceptual):', userData);

  if (!userData.email || !userData.role || !userData.password) {
    return { success: false, message: 'Email, password, and role are required.' };
  }

  if (!userData.email.includes('@')) {
    return { success: false, message: 'Invalid email format.' };
  }
  if (userData.password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }

  // Conceptual user creation (not interacting with Firebase)
  try {
    const mockUserId = `mock_user_${Date.now()}`;
    console.log(`[AdminAction] Conceptual user ${userData.email} with role ${userData.role} created with ID: ${mockUserId}.`);
    console.log(`[AdminAction] Permissions: Upload=${userData.canUploadDocs}, Review=${userData.canReviewDocs}, Approve=${userData.canApproveMedication}`);
    
    return { 
      success: true, 
      message: `User ${userData.email} (${userData.role}) conceptually created with specified permissions. This user is added to the admin view for this session only.`,
      userId: mockUserId,
      email: userData.email,
      role: userData.role,
      canUploadDocs: userData.canUploadDocs,
      canReviewDocs: userData.canReviewDocs,
      canApproveMedication: userData.canApproveMedication,
    };

  } catch (error: any) {
    console.error('[AdminAction] Error during conceptual user creation:', error);
    const errorMessage = `Failed to create user conceptually: ${error.message || 'Unknown error'}`;
    return { 
      success: false, 
      message: errorMessage,
    };
  }
}
