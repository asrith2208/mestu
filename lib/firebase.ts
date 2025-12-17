
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDSolGdHoNxDkHQyi0UkYu4EBwYdthvh2c",
    authDomain: "menst-248cb.firebaseapp.com",
    projectId: "menst-248cb",
    storageBucket: "menst-248cb.firebasestorage.app",
    messagingSenderId: "1034141462560",
    appId: "1:1034141462560:web:b051fca4def8fcd4ea0c45"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
