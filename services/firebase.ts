import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";
import { Category } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyByIsqO2Kkpv9vGbSScAy3wSvTw53wuegk",
  authDomain: "cuoc-thi-dieu-duong.firebaseapp.com",
  databaseURL: "https://cuoc-thi-dieu-duong-default-rtdb.firebaseio.com",
  projectId: "cuoc-thi-dieu-duong",
  storageBucket: "cuoc-thi-dieu-duong.firebasestorage.app",
  messagingSenderId: "638987215243",
  appId: "1:638987215243:web:fa96be4e140a1e2f558f8e",
  measurementId: "G-2JES6QFQ3R"
};

// Initialize Firebase
// Note: Analytics is removed to prevent initialization errors in this environment
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export const DATABASE_REF = 'categories';

// Save categories to Firebase
export const saveCategoriesToFirebase = (data: Category[]) => {
  set(ref(db, DATABASE_REF), data)
    .catch((error) => console.error("Firebase write error:", error));
};

// Subscribe to changes
export const subscribeToCategories = (callback: (data: Category[]) => void) => {
  const dataRef = ref(db, DATABASE_REF);
  return onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || []);
  });
};