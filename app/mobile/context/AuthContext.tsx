import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

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
  authMethod?: "phone" | "google" | "apple";
  avatarUrl?: string;
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
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
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

function generateWallet() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result + "..." + chars.slice(0, 4);
}

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
        if (!parsed.kyc) parsed.kyc = defaultKYC;
        setUser(parsed);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  async function login(phone: string) {
    const userData: User = {
      id: "usr_" + Date.now().toString(36),
      phone,
      name: "ATMOS User",
      email: "",
      walletAddress: generateWallet(),
      kycStatus: "unverified",
      role: "producer",
      authMethod: "phone",
      kyc: defaultKYC,
    };
    await AsyncStorage.setItem("atmos_user", JSON.stringify(userData));
    setUser(userData);
  }

  async function loginWithGoogle() {
    const clientId =
      process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ??
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error("Google OAuth client IDs are missing");
    }

    const redirectUri = makeRedirectUri({ scheme: "atmos", path: "auth/google" });
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent("openid email profile")}` +
      `&prompt=select_account`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    if (result.type !== "success" || !result.url) {
      throw new Error("Google sign-in was cancelled or failed");
    }

    const fragment = result.url.includes("#") ? result.url.split("#")[1] : "";
    const params = new URLSearchParams(fragment);
    const accessToken = params.get("access_token");
    if (!accessToken) {
      throw new Error("Google sign-in completed but no access token was returned");
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      throw new Error("Failed to fetch Google profile");
    }

    const profile = (await profileRes.json()) as {
      sub?: string;
      name?: string;
      email?: string;
      picture?: string;
    };

    const userData: User = {
      id: "usr_g_" + String(profile.sub ?? Date.now().toString(36)).slice(-8),
      phone: "",
      name: profile.name ?? "Google User",
      email: profile.email ?? "",
      walletAddress: generateWallet(),
      kycStatus: "unverified",
      role: "producer",
      authMethod: "google",
      avatarUrl: profile.picture,
      kyc: defaultKYC,
    };

    await AsyncStorage.setItem("atmos_user", JSON.stringify(userData));
    setUser(userData);
  }

  async function loginWithApple() {
    const userData: User = {
      id: "usr_a_" + Date.now().toString(36),
      phone: "",
      name: "Apple User",
      email: "user@privaterelay.appleid.com",
      walletAddress: generateWallet(),
      kycStatus: "unverified",
      role: "producer",
      authMethod: "apple",
      kyc: defaultKYC,
    };
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
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        loginWithApple,
        logout,
        updateUser,
        updateKYC,
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
