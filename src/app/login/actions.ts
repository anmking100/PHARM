'use server';

import { auth } from '@/lib/firebase/client';
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';

export async function signInUser(email: string, password: string): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Login failed.', errorCode: error.code };
  }
}

export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Sign out failed.' };
  }
}
