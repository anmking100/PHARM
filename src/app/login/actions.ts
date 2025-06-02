
'use server';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as firebaseAuthClient } from '@/lib/firebase/client';

const HARDCODED_ADMIN_EMAIL = 'admin@example.com';
const HARDCODED_ADMIN_PASSWORD = 'password123';

interface SignInCredentials {
  email: string;
  password?: string;
}

interface SignInResult {
  success: boolean;
  isHardcodedAdmin?: boolean;
  firebaseUser?: {
    uid: string;
    email: string | null;
  };
  error?: string;
  errorCode?: string;
}

export async function signInUser(credentials: SignInCredentials): Promise<SignInResult> {
  console.log('[signInUser Action] Attempting login for:', credentials.email);

  if (!credentials.password) {
    return { success: false, error: "Password is required." };
  }

  // Check for hardcoded admin first
  if (
    credentials.email.toLowerCase() === HARDCODED_ADMIN_EMAIL.toLowerCase() &&
    credentials.password === HARDCODED_ADMIN_PASSWORD
  ) {
    console.log('[signInUser Action] Hardcoded admin credentials match.');
    return {
      success: true,
      isHardcodedAdmin: true,
      firebaseUser: { // Provide a structure consistent with FirebaseUser if needed by AuthContext
        uid: 'hardcoded-admin-uid',
        email: HARDCODED_ADMIN_EMAIL,
      }
    };
  }

  // If not hardcoded admin, try Firebase Authentication
  console.log('[signInUser Action] Not hardcoded admin, attempting Firebase login.');
  try {
    // This is tricky: Server Actions run on the server, but signInWithEmailAndPassword is a client SDK method.
    // For Firebase client SDK auth methods, they should be called from the client.
    // This action should ideally just be for the hardcoded admin or orchestrate things that don't use client SDK.
    // Let's simulate the intent and the client-side will handle the actual Firebase call.
    // For now, this action will return an indicator that Firebase auth should be attempted by the client.
    // OR, the client directly calls Firebase, and only calls this action for the hardcoded admin.
    //
    // Re-thinking: The page.tsx should call Firebase auth directly for non-admin.
    // This server action is only for hardcoded admin.
    //
    // Let's adjust: this server action will *only* handle the hardcoded admin.
    // The client (login page) will decide: if admin email -> call this action. Else -> call Firebase client SDK.

    // For this iteration, the server action will pretend it can try firebase.
    // In a real scenario, client SDK for sign-in is preferred.
    // This server action, if it were to use Admin SDK to validate, wouldn't return a "logged in" Firebase session to the client.
    return {
        success: false,
        error: 'Regular user login should be handled by client-side Firebase SDK. This action is for hardcoded admin.',
    };

  } catch (error: any) {
    console.error('[signInUser Action] Firebase login error:', error);
    return {
      success: false,
      error: error.message || 'Firebase login failed.',
      errorCode: error.code,
    };
  }
}
