import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface KYCDocument {
  type: "aadhaar" | "pan" | "farm_doc";
  status: "not_started" | "pending" | "verified" | "rejected";
  number?: string;
  fileName?: string;
  submittedAt?: string;
  verifiedAt?: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email: string;
  walletAddress: string;
  kycStatus: "unverified" | "pending" | "verified";
  role: "producer" | "buyer";
  kyc: {
    aadhaar: KYCDocument;
    pan: KYCDocument;
    farmDoc: KYCDocument;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  updateKYC: (type: KYCDocument["type"], updates: Partial<KYCDocument>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const defaultKYC: User["kyc"] = {
  aadhaar: { type: "aadhaar", status: "not_started" },
  pan: { type: "pan", status: "not_started" },
  farmDoc: { type: "farm_doc", status: "not_started" },
};

const MOCK_USER: User = {
  id: "usr_001",
  phone: "+91 98765 43210",
  name: "Maria Garcia",
  email: "maria@example.com",
  walletAddress: "7xKp...9mNq",
  kycStatus: "unverified",
  role: "producer",
  kyc: defaultKYC,
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
        const parsed = JSON.parse(stored);
        // Ensure kyc field exists for older stored users
        if (!parsed.kyc) parsed.kyc = defaultKYC;
        setUser(parsed);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  async function login(phone: string) {
    const userData: User = { ...MOCK_USER, phone, kyc: defaultKYC };
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
    // Recompute kycStatus based on sub-documents
    const kycValues = Object.values(updated.kyc ?? {});
    const allVerified = kycValues.every((d) => d.status === "verified");
    const anyPending = kycValues.some((d) => d.status === "pending" || d.status === "verified");
    updated.kycStatus = allVerified ? "verified" : anyPending ? "pending" : "unverified";
    setUser(updated);
    AsyncStorage.setItem("atmos_user", JSON.stringify(updated));
  }

  function updateKYC(type: KYCDocument["type"], updates: Partial<KYCDocument>) {
    if (!user) return;
    const kycKey = type === "aadhaar" ? "aadhaar" : type === "pan" ? "pan" : "farmDoc";
    const newKyc = {
      ...user.kyc,
      [kycKey]: { ...(user.kyc[kycKey] ?? {}), ...updates, type },
    };
    updateUser({ kyc: newKyc });
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, updateUser, updateKYC }}
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
