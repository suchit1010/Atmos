/**
 * ATMOS Haptics System
 * Every tap, every error, every success — defined in one place.
 * Haptics are the sound design of mobile apps.
 */

import * as Haptics from 'expo-haptics';

export const HapticPattern = {
  // ── NAVIGATIONAL ──────────────────────────────
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  select: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  tabSwitch: () => Haptics.selectionAsync(),

  // ── FEEDBACK ──────────────────────────────────
  success: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  error: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  warning: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  // ── INTERACTION ───────────────────────────────
  longPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  delete: async () => {
    // Double hit — feels destructive
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 80);
  },

  confirm: async () => {
    // Soft + medium — feels confirmatory
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
  },

  // ── MILESTONES ────────────────────────────────
  verified: async () => {
    // Three-hit celebration
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 400);
  },

  minted: async () => {
    // Success + two soft taps
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), i * 120);
    }
  },

  payment: async () => {
    // Single heavy — money moment
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
      150
    );
  },

  // ── SCROLL ────────────────────────────────────
  scrollSnap: () => Haptics.selectionAsync(),

  pullRefresh: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
} as const;

/**
 * USAGE MAP
 * ─────────────────────────────────────────────────────────
 * SCREEN               EVENT                    HAPTIC
 * ─────────────────────────────────────────────────────────
 * All                  Button tap               tap
 * Auth OTP             OTP complete digit       selectionAsync
 * Auth OTP             Wrong OTP                error
 * Dashboard            Pull refresh             pullRefresh
 * Dashboard            Card tap                 tap
 * Project Create       Step complete            success
 * Project Create       Validation error         error
 * Verification         Step complete            select
 * Verification         Verification done        verified
 * Marketplace          Buy button               confirm
 * Payment              Payment success          payment
 * Minting              Token minted             minted
 * Portfolio            Swipe to retire          delete
 * Any                  Destructive confirm      warning
 */
