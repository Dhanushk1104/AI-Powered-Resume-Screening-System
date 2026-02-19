import React, { createContext, useContext, useEffect, useState } from "react";
import API, { setAuthToken } from "../api";
import type { AuthResponse, Role } from "../types";

type AuthState = {
  token?: string;
  role?: Role;
  username?: string; // store email/username
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUsername: (username: string) => void; // helper to update after edit
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | undefined>(() => localStorage.getItem("token") || undefined);
  const [role, setRole] = useState<Role | undefined>(() => (localStorage.getItem("role") as Role) || undefined);
  const [username, setUsername] = useState<string | undefined>(() => localStorage.getItem("username") || undefined);

  // Sync token, role, and username with localStorage & API
  useEffect(() => {
    setAuthToken(token);

    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (role) localStorage.setItem("role", role);
    else localStorage.removeItem("role");

    if (username) localStorage.setItem("username", username);
    else localStorage.removeItem("username");
  }, [token, role, username]);

  // Login function
  async function login(email: string, password: string) {
    const res = await API.post<AuthResponse>("/auth/login", { email, password });
    setToken(res.data.token);
    setRole(res.data.role);
    setUsername(email);
    setAuthToken(res.data.token);
  }

  // Logout function
  function logout() {
    setToken(undefined);
    setRole(undefined);
    setUsername(undefined);
    setAuthToken(undefined);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
  }

  return (
    <AuthContext.Provider value={{ token, role, username, login, logout, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
};
