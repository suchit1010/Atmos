/**
 * ATMOS Motion Constants
 * Animation configurations for consistent motion design
 * Uses react-native-reanimated for 60fps animations
 */

import { Easing } from 'react-native-reanimated';

// ── SPRING CONFIGS ────────────────────────────────────────
export const Spring = {
  // For appearing/popping elements (buttons, cards)
  snappy: { damping: 18, stiffness: 300, mass: 0.8 },
  // For sliding panels, sheets
  smooth: { damping: 22, stiffness: 200, mass: 1 },
  // For large elements (modals, full-screen)
  gentle: { damping: 28, stiffness: 160, mass: 1.2 },
  // For celebration moments (success, confetti)
  bouncy: { damping: 10, stiffness: 280, mass: 0.6 },
  // For error shakes
  rigid: { damping: 30, stiffness: 400, mass: 0.5 },
} as const;

// ── TIMING CONFIGS ─────────────────────────────────────────
export const Duration = {
  instant: 80, // Pressed state, toggle
  fast: 150, // Hover, focus
  normal: 250, // Most UI state changes
  slow: 400, // Screen transitions, reveals
  deliberate: 600, // Important moments (verified, minted)
  celebration: 900, // Success screens
} as const;

// ── EASING ────────────────────────────────────────────────
export const Ease = {
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  spring: Easing.elastic(1),
  linear: Easing.linear,
} as const;

// ── STAGGER ───────────────────────────────────────────────
export const Stagger = {
  tight: 40, // Dense lists
  normal: 60, // Standard lists
  loose: 80, // Focused steps
  dramatic: 120, // Onboarding
} as const;
