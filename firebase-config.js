import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXtN8Ydq2yH77agfWQBCBR3qwESlP1eRg",
  authDomain: "restaurant-29933.firebaseapp.com",
  projectId: "restaurant-29933",
  storageBucket: "restaurant-29933.firebasestorage.app",
  messagingSenderId: "968625287708",
  appId: "1:968625287708:web:1a65c2e3e541d8a16d25d9"
};

let app, auth, db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

export { auth, db };
