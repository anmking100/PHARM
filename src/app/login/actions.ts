
'use server';

// This file is no longer strictly necessary for the hardcoded admin login
// as the logic is now primarily handled in the LoginPage client component
// and AuthContext. However, it can be kept for structure or future use
// if server-side checks are reintroduced.

interface SignInCredentials {
  email: string;
  password?: string;
}

interface SignInResult {
  success: boolean;
  isHardcodedAdmin?: boolean; // This will always be true if success
  error?: string;
}

const HARDCODED_ADMIN_EMAIL = 'admin@example.com';
const HARDCODED_ADMIN_PASSWORD = 'password123';

export async function signInUser(credentials: SignInCredentials): Promise<SignInResult> {
  console.log('[signInUser Action] Conceptual check for hardcoded admin:', credentials.email);

  if (!credentials.password) {
    return { success: false, error: "Password is required." };
  }

  if (
    credentials.email.toLowerCase() === HARDCODED_ADMIN_EMAIL.toLowerCase() &&
    credentials.password === HARDCODED_ADMIN_PASSWORD
  ) {
    console.log('[signInUser Action] Hardcoded admin credentials match.');
    return {
      success: true,
      isHardcodedAdmin: true,
    };
  }

  return { success: false, error: 'Invalid credentials.' };
}
