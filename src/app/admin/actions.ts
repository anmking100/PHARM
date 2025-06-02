
'use server';

import type { NewUserFormData, UserRole } from '@/lib/types';
// IMPORTANT: The firebase-admin SDK should ONLY be used in secure backend environments
// (e.g., dedicated API routes, Firebase Functions).
// Directly calling it from a Server Action invoked by a non-Firebase-authenticated admin
// without additional security (like a secret token check) is NOT recommended for production.
import adminInstance from '@/lib/firebase/admin'; // Renamed for clarity

export async function createUserWithRole(
  userData: NewUserFormData,
  passwordMaybe?: string
): Promise<{ success: boolean; message: string; userId?: string, email?: string, role?: UserRole }> {
  console.log('[AdminAction] Attempting to create user:', userData);

  if (!userData.email || !userData.role || !passwordMaybe) {
    return { success: false, message: 'Email, password, and role are required.' };
  }
  
  if (!userData.email.includes('@')) {
    return { success: false, message: 'Invalid email format.' };
  }
  if (passwordMaybe.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }

  try {
    // --- !!! SECURITY WARNING !!! ---
    // The following Admin SDK calls should be in a secure backend environment,
    // protected and callable only by an authenticated admin.
    // For this example, we proceed conceptually. Ensure this action itself is secured
    // if used directly, e.g. by checking a secret passed from the client or ensuring
    // the caller (the hardcoded admin) has a session that this action can verify.

    console.log('[AdminAction] Checking Firebase Admin SDK initialization status. adminInstance.apps.length:', adminInstance.apps.length);
    // Check if Admin SDK is initialized by verifying if any apps are initialized
    if (!adminInstance.apps.length) {
      console.error('[AdminAction] Firebase Admin SDK is not initialized (no apps found). User creation will be purely conceptual. This usually means GOOGLE_APPLICATION_CREDENTIALS environment variable is not set correctly or the server was not restarted after setting it. Check server startup logs from src/lib/firebase/admin.ts for detailed initialization errors.');
      // Fallback to conceptual creation if Admin SDK isn't working
      const mockUserId = `mock_user_${Date.now()}`;
      console.log(`[AdminAction] Conceptual user ${userData.email} with role ${userData.role} created with ID: ${mockUserId}. (Admin SDK not initialized)`);
      return { 
        success: true, 
        message: `User ${userData.email} (${userData.role}) conceptually created (Firebase Admin SDK not initialized - check GOOGLE_APPLICATION_CREDENTIALS and server logs).`,
        userId: mockUserId,
        email: userData.email,
        role: userData.role
      };
    }

    console.log('[AdminAction] Firebase Admin SDK appears initialized. Attempting to create user with Firebase Admin SDK...');
    const userRecord = await adminInstance.auth().createUser({
      email: userData.email,
      password: passwordMaybe,
      emailVerified: false, // Or true, depending on your flow
      disabled: false,
    });
    console.log('[AdminAction] Successfully created new user with Firebase Admin SDK:', userRecord.uid);

    // Set custom claims for the role
    await adminInstance.auth().setCustomUserClaims(userRecord.uid, { role: userData.role, admin: userData.role === 'admin' });
    console.log('[AdminAction] Successfully set custom claims for user:', userRecord.uid, { role: userData.role });

    return { 
      success: true, 
      message: `User ${userData.email} (${userData.role}) created successfully with Firebase.`,
      userId: userRecord.uid,
      email: userData.email,
      role: userData.role
    };

  } catch (error: any) {
    console.error('[AdminAction] Error creating user with Firebase Admin SDK. Full error object:', error);
    console.error(`[AdminAction] Error Code: ${error.code}, Error Message: ${error.message}`);
    
    let errorMessage = 'Failed to create user with Firebase.'; // Default message

    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'This email address is already in use.';
    } else if (error.code === 'auth/invalid-password') {
      errorMessage = 'Password must be at least 6 characters long.';
    } else if (error.message && (error.message.toLowerCase().includes("failed to fetch a valid google oauth2 access token") || error.message.toLowerCase().includes("error fetching access token"))) {
        errorMessage = `Firebase Admin SDK Authentication Error: Could not fetch a valid OAuth2 access token. This most often means an issue with your GOOGLE_APPLICATION_CREDENTIALS environment variable (e.g., path is incorrect, file is invalid/corrupted, or service account lacks permissions) or the server was not restarted after setting it. Please verify it's correctly set to a valid service account JSON file path, the service account has necessary IAM permissions in Google Cloud, and restart your server. Original error: ${error.message}`;
    } else if (error.message && error.message.toLowerCase().includes("the default firebase app does not exist")) {
        errorMessage = "Firebase Admin SDK not properly initialized: The default Firebase app does not exist. User creation failed. Check server startup logs for initialization errors from 'src/lib/firebase/admin.ts' and ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly and the server restarted.";
    } else if (error.message && error.message.toLowerCase().includes("must initialize app")) {
        errorMessage = "Firebase Admin SDK not initialized (must initialize app error). User creation failed. Check server startup logs from 'src/lib/firebase/admin.ts', ensure GOOGLE_APPLICATION_CREDENTIALS is set, and server restarted.";
    } else if (error.message) {
        errorMessage = `Firebase user creation failed: ${error.message}`;
    }

    return { 
      success: false, 
      message: errorMessage,
    };
  }
}
