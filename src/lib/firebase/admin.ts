
// THIS FILE IS INTENDED TO RUN IN A SERVER-SIDE ENVIRONMENT (e.g., Next.js API Route, Firebase Function)
// DO NOT IMPORT OR USE THIS IN CLIENT-SIDE CODE.
import admin from 'firebase-admin';

console.log('[FirebaseAdmin] Module loaded. Checking admin.apps.length before initialization:', admin.apps.length);

if (!admin.apps.length) {
  console.log('[FirebaseAdmin] No Firebase Admin app initialized yet. Attempting initialization...');
  try {
    // This relies on GOOGLE_APPLICATION_CREDENTIALS environment variable being set correctly.
    // It should point to the path of your service account key JSON file.
    admin.initializeApp();
    console.log('[FirebaseAdmin] Firebase Admin SDK initializeApp() called.');
    if (admin.apps.length > 0) {
      console.log(`[FirebaseAdmin] Firebase Admin SDK initialized successfully. Number of apps: ${admin.apps.length}. App name: ${admin.apps[0]?.name}`);
    } else {
      console.error('[FirebaseAdmin] Firebase Admin SDK initializeApp() was called, but admin.apps is still empty. This indicates a silent initialization failure. PLEASE DOUBLE-CHECK YOUR GOOGLE_APPLICATION_CREDENTIALS ENVIRONMENT VARIABLE AND THE SERVICE ACCOUNT KEY FILE. Ensure the server was restarted after setting the variable.');
    }
  } catch (error: any) {
    console.error('[FirebaseAdmin] Firebase Admin SDK initializeApp() FAILED WITH ERROR. PLEASE DOUBLE-CHECK YOUR GOOGLE_APPLICATION_CREDENTIALS ENVIRONMENT VARIABLE AND THE SERVICE ACCOUNT KEY FILE. Ensure the server was restarted after setting the variable.');
    console.error('[FirebaseAdmin] Initialization Error Code:', error.code);
    console.error('[FirebaseAdmin] Initialization Error Message:', error.message);
    // Log the full error object for more details if available
    console.error('[FirebaseAdmin] Full Initialization Error Object:', error);
  }
} else {
  console.log(`[FirebaseAdmin] Firebase Admin SDK was already initialized. Number of apps: ${admin.apps.length}. App name: ${admin.apps[0]?.name}`);
}

export default admin;
