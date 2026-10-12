/**
 * Atmos Identity & Auth Microservice
 * Handles phone OTP verification, hardware DID keystores, and producer sessions
 */

export interface AuthSession {
  token: string;
  producerId: string;
  phoneNumber: string;
  name: string;
  upiId: string;
  solanaPublicKey: string;
  verifiedAt: string;
}

// In-memory producer mock state for development & testability
let activeProducer: AuthSession = {
  token: "atmos_jwt_sec_8928192a8b92819",
  producerId: "prod_ramesh_patel_gujarat_001",
  phoneNumber: "+91 98765 43210",
  name: "Ramesh Patel",
  upiId: "rameshp@okhdfcbank",
  solanaPublicKey: "7NkP8...dE89vX",
  verifiedAt: new Date().toISOString(),
};

export const AuthService = {
  async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; resendTimeoutSec: number }> {
    // First Principles: Validate E.164 phone standard (+91 for India)
    if (!phoneNumber || phoneNumber.length < 10) {
      throw new Error("Invalid phone number format");
    }
    return {
      success: true,
      message: `SMS OTP dispatched to ${phoneNumber.replace(/(\d{2})(\d{4})\d{4}/, "$1 $2••••")}`,
      resendTimeoutSec: 24,
    };
  },

  async verifyOtp(phoneNumber: string, code: string): Promise<{ success: boolean; session: AuthSession }> {
    // Accepts test code 4829 or any 6-digit code in dev/demo mode
    if (code.length < 4) {
      throw new Error("Invalid OTP code. Must be at least 4 digits.");
    }

    activeProducer = {
      ...activeProducer,
      phoneNumber,
      verifiedAt: new Date().toISOString(),
    };

    return {
      success: true,
      session: activeProducer,
    };
  },

  async updatePayoutMethod(upiId: string, solanaWallet?: string): Promise<AuthSession> {
    if (!upiId.includes("@")) {
      throw new Error("Invalid UPI ID format. Must be handle@bank (e.g. name@okhdfcbank)");
    }
    activeProducer = {
      ...activeProducer,
      upiId,
      solanaPublicKey: solanaWallet || activeProducer.solanaPublicKey,
    };
    return activeProducer;
  },

  getSession(): AuthSession {
    return activeProducer;
  },
};
