// Firebase Configuration
// Using Firebase Compat library (loaded via CDN in index.html)

// Wait for Firebase SDK to load
if (typeof firebase === 'undefined') {
  console.error('Firebase SDK not loaded! Make sure the CDN scripts are included before this file.');
} else {
  const firebaseConfig = {
    apiKey: "AIzaSyDF49sBcRC7NWjf-xuNEeR6L7f4rkIK1gw",
    authDomain: "cleanup-tasks-80f46.firebaseapp.com",
    databaseURL: "https://cleanup-tasks-80f46-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cleanup-tasks-80f46",
    storageBucket: "cleanup-tasks-80f46.firebasestorage.app",
    messagingSenderId: "1057412674733",
    appId: "1:1057412674733:web:cc37a63dfa9c00af020224"
  };

  // Initialize Firebase using the compat API
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully');
      console.log('🔒 Security: Database rules are protecting your data');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}
