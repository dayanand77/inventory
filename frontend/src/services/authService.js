import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "./firebase";

export async function loginWithEmailPassword(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signupWithEmailPassword({ email, password, displayName }) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(userCredential.user, {
    displayName,
  });

  return userCredential;
}

export async function logoutUser() {
  return signOut(auth);
}

export async function getUserIdToken(user, forceRefresh = false) {
  if (!user) {
    return null;
  }

  return user.getIdToken(forceRefresh);
}
