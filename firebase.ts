
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyClTcvC7JJgGWIGsEwMStyMMfJn0ZOuOFM",
  authDomain: "freefire-tournament-e9506.firebaseapp.com",
  databaseURL: "https://freefire-tournament-e9506-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "freefire-tournament-e9506",
  storageBucket: "freefire-tournament-e9506.firebasestorage.app",
  messagingSenderId: "999640805909",
  appId: "1:999640805909:web:87f6956b47d13c4134541c"
};

// Initialize Firebase
// Use existing app if available to prevent duplicate initialization errors
const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);

// Export auth and db instances
// Using compat methods directly on the app instance
export const auth = app.auth();
export const db = app.database();
export const storage = app.storage();

export default app;
