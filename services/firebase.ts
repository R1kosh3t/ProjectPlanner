import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJW1c3USA1-EX9HUYbdxZV9mW4a4yDEH0",
  authDomain: "project-planner-5b663.firebaseapp.com",
  projectId: "project-planner-5b663",
  storageBucket: "project-planner-5b663.firebasestorage.app",
  messagingSenderId: "69248387389",
  appId: "1:69248387389:web:451f2165046e622dc69d54",
  measurementId: "G-PT0VJ0Q0ZZ"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
