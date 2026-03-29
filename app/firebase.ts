// app/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxEt3yIZRVm9ZA5as-n-37D8cqqQ8BxOw",
  authDomain: "week-out-c0b47.firebaseapp.com",
  projectId: "week-out-c0b47",
  storageBucket: "week-out-c0b47.firebasestorage.app",
  messagingSenderId: "811139031618",
  appId: "1:811139031618:web:05236fd771c4b2309bc3db"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);