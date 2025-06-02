
'use server';

import type { UserRole } from '@/lib/types';

interface SignInCredentials {
  email: string;
  password?: string; // Password remains for the form, but logic will primarily use email for role
}

interface SignInResult {
  success: boolean;
  role?: UserRole;
  error?: string;
  email?: string;
}

// Hardcoded credentials map to roles
const HARDCODED_USERS: Record<string, { password?: string, role: UserRole }> = {
  'admin@example.com': { password: 'password123', role: 'admin' },
  'pharmacist@example.com': { password: 'password123', role: 'pharmacist' },
  'technician@example.com': { password: 'password123', role: 'technician' },
};

export async function signInUser(credentials: SignInCredentials): Promise<SignInResult> {
  console.log('[signInUser Action] Attempting to sign in user:', credentials.email);

  const lowercasedEmail = credentials.email.toLowerCase();
  const hardcodedUser = HARDCODED_USERS[lowercasedEmail];

  if (hardcodedUser && credentials.password === hardcodedUser.password) {
    console.log(`[signInUser Action] Hardcoded user match: ${lowercasedEmail}, Role: ${hardcodedUser.role}`);
    return {
      success: true,
      role: hardcodedUser.role,
      email: lowercasedEmail,
    };
  }

  // Fallback for any other credentials - for now, treat as invalid.
  // Could be extended for Firebase auth later.
  console.log('[signInUser Action] Invalid credentials or user not found in hardcoded list.');
  return { success: false, error: 'Invalid credentials.' };
}
