import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  phone: string;
  name: string;
  email: string;
  walletAddress: string;
  kycStatus: "verified" | "pending" | "unverified";
  role: "producer" | "buyer";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER: User = {
  id: "usr_001",
  phone: "+91 98765 43210",
  name: "Maria Garcia",
  email: "maria@example.com",
  walletAddress: "7xKp...9mNq",
  kycStatus: "verified",
  role: "producer",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  async function loadAuthState() {
    try {
      const stored = await AsyncStorage.getItem("atmos_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  async function login(phone: string) {
    const userData: User = { ...MOCK_USER, phone };
    await AsyncStorage.setItem("atmos_user", JSON.stringify(userData));
    setUser(userData);
  }

  async function logout() {
    await AsyncStorage.removeItem("atmos_user");
    setUser(null);
  }

  function updateUser(updates: Partial<User>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    AsyncStorage.setItem("atmos_user", JSON.stringify(updated));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
