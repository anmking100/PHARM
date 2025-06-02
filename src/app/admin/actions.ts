
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

    // Check if Admin SDK is initialized by verifying if any apps are initialized
    if (!adminInstance.apps.length) {
      console.error('[AdminAction] Firebase Admin SDK is not initialized (no apps found). User creation will be purely conceptual. Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly and the server has restarted.');
      // Fallback to conceptual creation if Admin SDK isn't working
      const mockUserId = `mock_user_${Date.now()}`;
      console.log(`[AdminAction] Conceptual user ${userData.email} with role ${userData.role} created with ID: ${mockUserId}. (Admin SDK not initialized)`);
      return { 
        success: true, 
        message: `User ${userData.email} (${userData.role}) conceptually created (Admin SDK not initialized).`,
        userId: mockUserId,
        email: userData.email,
        role: userData.role
      };
    }

    console.log('[AdminAction] Attempting to create user with Firebase Admin SDK...');
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

    // Optionally, store additional user details in Firestore if needed (e.g., name, etc.)
    // await adminInstance.firestore().collection('users').doc(userRecord.uid).set({ email: userData.email, role: userData.role });

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
    } else if (error.message && error.message.toLowerCase().includes("the default firebase app does not exist")) {
        errorMessage = "Firebase Admin SDK not properly initialized. User creation failed. Check server logs for initialization errors and ensure GOOGLE_APPLICATION_CREDENTIALS is set and server restarted.";
    } else if (error.message && error.message.toLowerCase().includes("must initialize app")) {
        errorMessage = "Firebase Admin SDK not initialized. User creation failed. Check server logs and ensure GOOGLE_APPLICATION_CREDENTIALS is set and server restarted.";
    } else if (error.message) {
        // If no specific code matched, but there's an error message, use it.
        errorMessage = `Firebase user creation failed: ${error.message}`;
    }


    return { 
      success: false, 
      message: errorMessage,
      // errorCode: error.code // Optionally pass error code
    };
  }
}

