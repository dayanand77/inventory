import {
  onAuthStateChanged,
  onIdTokenChanged,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import apiClient from "../services/api";
import {
  getUserIdToken,
  loginWithEmailPassword,
  logoutUser,
  signupWithEmailPassword,
} from "../services/authService";
import { auth } from "../services/firebase";
import { clearAccessToken, setAccessToken } from "../services/tokenService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const authHeadersForUser = async (currentFirebaseUser) => {
    const user = currentFirebaseUser || auth.currentUser;
    if (!user) {
      return {};
    }

    const token = await getUserIdToken(user);
    setAccessToken(token);

    return { Authorization: `Bearer ${token}` };
  };

  const fetchProfile = async (currentFirebaseUser) => {
    const response = await apiClient.get("/auth/me", {
      headers: await authHeadersForUser(currentFirebaseUser),
    });
    setProfile(response.data.user);
    return response.data.user;
  };

  const syncProfile = async (payload = {}, currentFirebaseUser) => {
    const response = await apiClient.post("/auth/sync", payload, {
      headers: await authHeadersForUser(currentFirebaseUser),
    });
    setProfile(response.data.user);
    return response.data.user;
  };

  const login = async (email, password) => {
    const credential = await loginWithEmailPassword(email, password);
    const token = await getUserIdToken(credential.user);
    setAccessToken(token);

    await fetchProfile(credential.user);
  };

  const signup = async ({ email, password, displayName, department, role }) => {
    const userCredential = await signupWithEmailPassword({
      email,
      password,
      displayName,
    });

    const token = await getUserIdToken(userCredential.user);
    setAccessToken(token);

    await syncProfile(
      {
        displayName,
        department,
        role,
      },
      userCredential.user
    );
  };

  const logout = async () => {
    await logoutUser();
    clearAccessToken();
    setProfile(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        clearAccessToken();
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        await fetchProfile(user);
      } catch (error) {
        console.error("Failed to fetch user profile on auth change:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        clearAccessToken();
        return;
      }

      const token = await getUserIdToken(user);
      setAccessToken(token);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user: firebaseUser,
      profile,
      loading,
      login,
      signup,
      logout,
      syncProfile,
      isAdmin: profile?.role === "ADMIN",
      isStaff: profile?.role === "STAFF",
    }),
    [firebaseUser, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
