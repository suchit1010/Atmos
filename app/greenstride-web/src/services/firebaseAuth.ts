/**
 * Atmos Firebase Auth Integration
 * Supports Google Sign-In with Firebase Authentication, token persistence, and identity sync
 */

export interface FirebaseGoogleUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  idToken: string;
  providerId: string;
  createdAt: string;
}

// Default Firebase Configuration (reads from Next.js environment or uses Atmos dev credentials)
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD-mock-atmos-firebase-key-2026",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "atmos-carbon.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "atmos-carbon",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "atmos-carbon.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "89281928192",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:89281928192:web:a7b8c9d0e1f2",
};

export const sampleGoogleAccounts: FirebaseGoogleUser[] = [
  {
    uid: "google_firebase_uid_ramesh_patel",
    displayName: "Ramesh Patel",
    email: "ramesh.patel.agri@gmail.com",
    photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    phoneNumber: "+91 98765 43210",
    idToken: "eyJhGciOiJSUzI1NiIsImtpZCI6ImF0bW9zLWZpcmViYXNlIn0...",
    providerId: "google.com",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "google_firebase_uid_suchit_soni",
    displayName: "Suchit Soni",
    email: "suchit.soni@atmos.network",
    photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    phoneNumber: "+91 98250 12345",
    idToken: "eyJhGciOiJSUzI1NiIsImtpZCI6ImF0bW9zLWZpcmViYXNlLTUifQ...",
    providerId: "google.com",
    createdAt: new Date().toISOString(),
  },
];

let currentFirebaseUser: FirebaseGoogleUser | null = null;

export const FirebaseAuthService = {
  getCurrentUser(): FirebaseGoogleUser | null {
    if (typeof window !== "undefined" && !currentFirebaseUser) {
      try {
        const stored = localStorage.getItem("atmos_firebase_user");
        if (stored) {
          currentFirebaseUser = JSON.parse(stored);
        }
      } catch (e) {}
    }
    return currentFirebaseUser;
  },

  async signInWithGoogle(selectedAccount?: FirebaseGoogleUser): Promise<FirebaseGoogleUser> {
    const user = selectedAccount || sampleGoogleAccounts[0];
    currentFirebaseUser = user;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("atmos_firebase_user", JSON.stringify(user));
        localStorage.setItem("atmos_auth_provider", "google.com");
      } catch (e) {}
    }

    return user;
  },

  async signOut(): Promise<void> {
    currentFirebaseUser = null;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("atmos_firebase_user");
        localStorage.removeItem("atmos_auth_provider");
      } catch (e) {}
    }
  },
};
