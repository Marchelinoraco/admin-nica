// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAoBo-5-Mqme5AkRaG03Os2j6UKsLYLMkU",
  authDomain: "tania-2e626.firebaseapp.com",
  projectId: "tania-2e626",
  storageBucket: "tania-2e626.firebasestorage.app",
  messagingSenderId: "824737806415",
  appId: "1:824737806415:web:153c72fad3fb780444d23a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
