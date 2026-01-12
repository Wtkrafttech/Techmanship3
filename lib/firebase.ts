
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDe5Bi1ByGEJXPiTaZgvQ3Ag3nqRqWb6Ss",
  authDomain: "studio-2987635455-631ce.firebaseapp.com",
  projectId: "studio-2987635455-631ce",
  storageBucket: "studio-2987635455-631ce.firebasestorage.app",
  messagingSenderId: "1050123704802",
  appId: "1:1050123704802:web:18d0e1f8fbb11ffb8081bb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
