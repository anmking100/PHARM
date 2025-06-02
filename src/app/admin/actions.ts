
'use server';

import type { NewUserFormData, UserRole } from '@/lib/types';
// IMPORTANT: The firebase-admin SDK should ONLY be used in secure backend environments
// (e.g., dedicated API routes, Firebase Functions).
// Directly calling it from a Server Action invoked by a non-Firebase-authenticated admin
// without additional security (like a secret token check) is NOT recommended for production.
import admin from '@/lib/firebase/admin'; // Conceptual import for Firebase Admin SDK

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

  // CONCEPTUAL FIREBASE ADMIN SDK USAGE
  // In a real, secure backend environment, you would do the following:
  try {
    // --- !!! SECURITY WARNING !!! ---
    // The following Admin SDK calls should be in a secure backend environment,
    // protected and callable only by an authenticated admin.
    // For this example, we proceed conceptually. Ensure this action itself is secured
    // if used directly, e.g. by checking a secret passed from the client or ensuring
    // the caller (the hardcoded admin) has a session that this action can verify.

    if (!admin.apps.length) {
        // This is a fallback if admin SDK wasn't initialized elsewhere,
        // but ideally it's initialized once at app/server startup.
        // This re-initialization attempt here might not always work as expected in all serverless environments.
        console.warn('[AdminAction] Firebase Admin SDK not initialized. Attempting re-init (may not be suitable for all environments).');
        // admin.initializeApp(); // Potentially re-initialize if needed and safe.
                               // For now, we assume it's initialized by admin.ts import.
                               // If it's not, admin.auth() will throw.
    }
    
    // Check if admin SDK is actually available
    if (!admin.auth) {
      console.error('[AdminAction] Firebase Admin SDK (admin.auth) is not available. User creation will be purely conceptual.');
      // Fallback to conceptual creation if Admin SDK isn't working
      const mockUserId = `mock_user_${Date.now()}`;
      console.log(`Conceptual user ${userData.email} with role ${userData.role} created with ID: ${mockUserId}. (Admin SDK not available)`);
      return { 
        success: true, 
        message: `User ${userData.email} (${userData.role}) conceptually created (Admin SDK not available).`,
        userId: mockUserId,
        email: userData.email,
        role: userData.role
      };
    }


    console.log('[AdminAction] Attempting to create user with Firebase Admin SDK...');
    const userRecord = await admin.auth().createUser({
      email: userData.email,
      password: passwordMaybe,
      emailVerified: false, // Or true, depending on your flow
      disabled: false,
    });
    console.log('[AdminAction] Successfully created new user with Firebase Admin SDK:', userRecord.uid);

    // Set custom claims for the role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: userData.role, admin: userData.role === 'admin' });
    console.log('[AdminAction] Successfully set custom claims for user:', userRecord.uid, { role: userData.role });

    // Optionally, store additional user details in Firestore if needed (e.g., name, etc.)
    // await admin.firestore().collection('users').doc(userRecord.uid).set({ email: userData.email, role: userData.role });

    return { 
      success: true, 
      message: `User ${userData.email} (${userData.role}) created successfully with Firebase.`,
      userId: userRecord.uid,
      email: userData.email,
      role: userData.role
    };

  } catch (error: any) {
    console.error('[AdminAction] Error creating user with Firebase Admin SDK:', error);
    let errorMessage = 'Failed to create user with Firebase.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'This email address is already in use.';
    } else if (error.code === 'auth/invalid-password') {
      errorMessage = 'Password must be at least 6 characters long.';
    }
    // Check for admin SDK initialization errors
    if (error.message && error.message.includes("Firebase App named '[DEFAULT]' already exists")) {
        errorMessage = "Firebase Admin SDK conflict or already initialized. User creation failed.";
    } else if (error.message && error.message.includes("Must initialize app")) {
        errorMessage = "Firebase Admin SDK not initialized. User creation failed.";
    }

    return { 
      success: false, 
      message: errorMessage,
      // errorCode: error.code // Optionally pass error code
    };
  }
}
