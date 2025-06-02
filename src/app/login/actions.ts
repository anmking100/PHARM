
'use server';

// Hardcoded admin credentials
const HARDCODED_ADMIN_EMAIL = 'admin@example.com';
const HARDCODED_ADMIN_PASSWORD = 'password123'; // Be careful with hardcoding passwords in real apps

interface SignInCredentials {
  email: string;
  password?: string; // Password might be optional if using magic links, etc., but required here.
}

interface SignInResult {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    isAdmin: boolean; // Indicate if this user is the hardcoded admin
  };
  error?: string;
}

export async function signInUser(credentials: SignInCredentials): Promise<SignInResult> {
  console.log('[signInUser Action] Attempting login for:', credentials.email);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (
    credentials.email.toLowerCase() === HARDCODED_ADMIN_EMAIL.toLowerCase() &&
    credentials.password === HARDCODED_ADMIN_PASSWORD
  ) {
    console.log('[signInUser Action] Hardcoded admin credentials match.');
    return {
      success: true,
      user: {
        uid: 'hardcoded-admin-uid',
        email: HARDCODED_ADMIN_EMAIL,
        isAdmin: true,
      },
    };
  } else {
    console.log('[signInUser Action] Credentials do not match hardcoded admin.');
    return {
      success: false,
      error: 'Invalid email or password.',
    };
  }
}

// We'll need a signOut action as well for completeness if we manage session state via context
export async function signOutUser(): Promise<{ success: boolean }> {
  console.log('[signOutUser Action] Signing out user.');
  // In a real app with server-side sessions, you'd clear the session here.
  // For this hardcoded example, client-side context handles it.
  return { success: true };
}
