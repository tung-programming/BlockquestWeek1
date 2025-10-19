// src/components/Auth/Login.jsx
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase";

export function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function loginEmail(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}
