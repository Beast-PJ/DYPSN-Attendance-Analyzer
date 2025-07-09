// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD9cTcEq397TcVZWEvnECca5ZK6DsB0pHI",
  authDomain: "attendance-analyzer-a4af7.firebaseapp.com",
  projectId: "attendance-analyzer-a4af7",
  storageBucket: "attendance-analyzer-a4af7.firebasestorage.app",
  messagingSenderId: "246887081306",
  appId: "1:246887081306:web:a23d000d6b9e31edc03f63",
  measurementId: "G-RL1LQSLRFS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;

