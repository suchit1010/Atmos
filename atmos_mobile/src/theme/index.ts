/**
 * ATMOS Protocol — Design System
 * Bloomberg Terminal × Stripe × Apple
 * Dark-first, premium, minimal
 * Version 2.0 - Enterprise Grade
 */

// Import token system
import { Tokens as T, Primitives as P } from '../tokens';

// ─── FONT FAMILIES ─────────────────────────────────────────
// Note: For production, install these fonts via expo-font
// For now, using system fallbacks
export const FontFamily = {
  // PRIMARY: All UI, body, labels
  sans: {
    regular: 'System', // TODO: Install Inter-Regular
    medium: 'System', // TODO: Install Inter-Medium
    semibold: 'System', // TODO: Install Inter-SemiBold
    bold: 'System', // TODO: Install Inter-Bold
  },
  // DISPLAY: Headers only, for impact
  display: {
    medium: 'System', // TODO: Install Poppins-Medium
    semibold: 'System', // TODO: Install Poppins-SemiBold
    bold: 'System', // TODO: Install Poppins-Bold
  },
  // MONO: Numbers, hashes, technical data (critical for fintech)
  mono: {
    regular: 'monospace', // Native monospace (works on all platforms)
    medium: 'monospace',
    semibold: 'monospace',
  },
} as const;

// ─── TYPOGRAPHY SCALE ──────────────────────────────────────
export const Typography = {
  // Display (Poppins for headers >20px)
  display2xl: { 
    fontSize: 40, 
    lineHeight: 44, 
    letterSpacing: -1.5, 
    fontFamily: FontFamily.display.bold,
    fontWeight: '700' as const,
  },
  displayXl: { 
    fontSize: 32, 
    lineHeight: 36, 
    letterSpacing: -1.2, 
    fontFamily: FontFamily.display.bold,
    fontWeight: '700' as const,
  },
  displayLg: { 
    fontSize: 28, 
    lineHeight: 32, 
    letterSpacing: -0.8, 
    fontFamily: FontFamily.display.semibold,
    fontWeight: '600' as const,
  },
  displayMd: { 
    fontSize: 24, 
    lineHeight: 28, 
    letterSpacing: -0.5, 
    fontFamily: FontFamily.display.semibold,
    fontWeight: '600' as const,
  },
  displaySm: { 
    fontSize: 20, 
    lineHeight: 24, 
    letterSpacing: -0.3, 
    fontFamily: FontFamily.display.medium,
    fontWeight: '500' as const,
  },

  // Headings (Inter semibold)
  headingLg: { 
    fontSize: 18, 
    lineHeight: 24, 
    letterSpacing: -0.2, 
    fontFamily: FontFamily.sans.semibold,
    fontWeight: '600' as const,
  },
  headingMd: { 
    fontSize: 16, 
    lineHeight: 22, 
    letterSpacing: -0.1, 
    fontFamily: FontFamily.sans.semibold,
    fontWeight: '600' as const,
  },
  headingSm: { 
    fontSize: 14, 
    lineHeight: 20, 
    letterSpacing: 0, 
    fontFamily: FontFamily.sans.semibold,
    fontWeight: '600' as const,
  },

  // Body (Inter regular)
  bodyLg: { 
    fontSize: 16, 
    lineHeight: 24, 
    letterSpacing: 0.1, 
    fontFamily: FontFamily.sans.regular,
    fontWeight: '400' as const,
  },
  bodyMd: { 
    fontSize: 15, 
    lineHeight: 22, 
    letterSpacing: 0.1, 
    fontFamily: FontFamily.sans.regular,
    fontWeight: '400' as const,
  },
  bodySm: { 
    fontSize: 13, 
    lineHeight: 20, 
    letterSpacing: 0.1, 
    fontFamily: FontFamily.sans.regular,
    fontWeight: '400' as const,
  },
  bodyXs: { 
    fontSize: 12, 
    lineHeight: 18, 
    letterSpacing: 0.1, 
    fontFamily: FontFamily.sans.regular,
    fontWeight: '400' as const,
  },

  // Labels (Inter medium)
  labelLg: { 
    fontSize: 14, 
    lineHeight: 18, 
    letterSpacing: 0.2, 
    fontFamily: FontFamily.sans.medium,
    fontWeight: '500' as const,
  },
  labelMd: { 
    fontSize: 12, 
    lineHeight: 16, 
    letterSpacing: 0.3, 
    fontFamily: FontFamily.sans.medium,
    fontWeight: '500' as const,
  },
  labelSm: { 
    fontSize: 10, 
    lineHeight: 14, 
    letterSpacing: 0.5, 
    fontFamily: FontFamily.sans.medium,
    fontWeight: '500' as const,
  },
  labelXs: { 
    fontSize: 9, 
    lineHeight: 12, 
    letterSpacing: 0.8, 
    fontFamily: FontFamily.sans.semibold,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },

  // MONO — for prices, hashes, scores, block numbers
  monoXl: { 
    fontSize: 24, 
    lineHeight: 28, 
    letterSpacing: -0.5, 
    fontFamily: FontFamily.mono.semibold,
    fontWeight: '600' as const,
  },
  monoLg: { 
    fontSize: 20, 
    lineHeight: 24, 
    letterSpacing: -0.3, 
    fontFamily: FontFamily.mono.semibold,
    fontWeight: '600' as const,
  },
  monoMd: { 
    fontSize: 16, 
    lineHeight: 20, 
    letterSpacing: 0, 
    fontFamily: FontFamily.mono.medium,
    fontWeight: '500' as const,
  },
  monoSm: { 
    fontSize: 13, 
    lineHeight: 18, 
    letterSpacing: 0.1, 
    fontFamily: FontFamily.mono.regular,
    fontWeight: '400' as const,
  },
  monoXs: { 
    fontSize: 11, 
    lineHeight: 14, 
    letterSpacing: 0.1, 
    fontFamily: FontFamily.mono.regular,
    fontWeight: '400' as const,
  },
} as const;

// ─── COLORS (Using Token System) ───────────────────────────
export const Colors = {
  // ─── Brand ─────────────────────────────
  primary: T.interactive.primary,
  primaryDim: T.interactive.secondary,
  primaryGlow: T.shadow.glow,
  primaryDark: T.interactive.primaryActive,

  // ─── Background layers ──────────────────
  bg: T.bg.screen,
  bgDark: T.bg.screen, // Backward-compatible alias
  bgCard: T.bg.elevated,
  bgElevated: T.bg.elevated,
  bgInput: T.bg.input,
  bgOverlay: T.bg.overlay,

  // ─── Borders ────────────────────────────
  border: T.border.default,
  borderBright: T.border.accent,
  borderSubtle: T.border.subtle,

  // ─── Text ───────────────────────────────
  text: T.text.primary,
  textMuted: T.text.secondary,
  textDim: T.text.tertiary,
  textInverse: T.text.inverse,

  // ─── Status ─────────────────────────────
  success: T.text.success,
  successDim: T.status.verified.bg,
  warning: T.text.warning,
  warningDim: T.status.pending.bg,
  error: T.text.error,
  errorDim: T.status.rejected.bg,
  info: T.text.info,
  infoDim: P.blue[900],

  // ─── Grades ─────────────────────────────
  gradeS: T.grade.S.text,
  gradeSBg: T.grade.S.bg,
  gradeA: T.grade.A.text,
  gradeABg: T.grade.A.bg,
  gradeB: T.grade.B.text,
  gradeBBg: T.grade.B.bg,
  gradeC: T.grade.C.text,
  gradeCBg: T.grade.C.bg,
  gradeD: T.grade.D.text,
  gradeDBg: T.grade.D.bg,

  // ─── Special ────────────────────────────
  solana: P.purple[500],
  solanaDim: P.purple[900],
  dodo: '#FF6B35',
  dodoDim: 'rgba(255,107,53,0.12)',
  zkPurple: P.purple[500],
  zkDim: P.purple[900],
  satellite: P.blue[500],
  satelliteDim: P.blue[900],

  // ─── White alpha ────────────────────────
  white10: 'rgba(255,255,255,0.10)',
  white06: 'rgba(255,255,255,0.06)',
  white04: 'rgba(255,255,255,0.04)',
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  green: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const getGradeColor = (grade: string) => {
  const map: Record<string, { color: string; bg: string }> = {
    S: { color: Colors.gradeS, bg: Colors.gradeSBg },
    A: { color: Colors.gradeA, bg: Colors.gradeABg },
    B: { color: Colors.gradeB, bg: Colors.gradeBBg },
    C: { color: Colors.gradeC, bg: Colors.gradeCBg },
    D: { color: Colors.gradeD, bg: Colors.gradeDBg },
  };
  return map[grade] || { color: Colors.textMuted, bg: Colors.white06 };
};
