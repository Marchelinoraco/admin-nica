// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcwgo2SYlkx052aijcfUsmxSNZIn1G66s",
  authDomain: "nisa-ta.firebaseapp.com",
  projectId: "nisa-ta",
  storageBucket: "nisa-ta.firebasestorage.app",
  messagingSenderId: "77775376062",
  appId: "1:77775376062:web:c4537afa2505072aecd8ef",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
