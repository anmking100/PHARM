
// THIS FILE IS INTENDED TO RUN IN A SERVER-SIDE ENVIRONMENT (e.g., Next.js API Route, Firebase Function)
// DO NOT IMPORT OR USE THIS IN CLIENT-SIDE CODE.
import admin from 'firebase-admin';

// Ensure you have GOOGLE_APPLICATION_CREDENTIALS set in your environment
// or initialize with a service account key explicitly.
// For example, if using a service account JSON file:
/*
if (!admin.apps.length) {
  try {
    const serviceAccountKeyJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY_JSON;
    if (!serviceAccountKeyJson) {
      throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY_JSON environment variable is not set.");
    }
    const serviceAccount = JSON.parse(serviceAccountKeyJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized.');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    // Optionally re-throw or handle as appropriate for your app's startup
  }
}
*/

// Simpler initialization if GOOGLE_APPLICATION_CREDENTIALS env var is set (e.g., in Cloud Functions, Cloud Run)
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized (using GOOGLE_APPLICATION_CREDENTIALS).');
  } catch (error) {
     console.error('Firebase Admin SDK initialization error (using GOOGLE_APPLICATION_CREDENTIALS):', error);
  }
}


export default admin;
