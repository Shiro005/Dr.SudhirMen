// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc, getDocs, query, where, orderBy, updateDoc, onSnapshot, getCountFromServer, limit, startAfter } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzUbjAlvYgGx91ol0SivcYBLEEulDuBkk",
  authDomain: "drmensir.firebaseapp.com",
  projectId: "drmensir",
  storageBucket: "drmensir.firebasestorage.app",
  messagingSenderId: "100996942943",
  appId: "1:100996942943:web:9781cf998b0da05b4b9fea",
  databaseURL: "https://drmensir-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore, collection, addDoc, doc, setDoc, getDocs, query, where, orderBy, updateDoc, onSnapshot, getCountFromServer, limit, startAfter };