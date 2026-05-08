/**
 * KARTA Protocol — Design System
 * Bloomberg Terminal × Stripe × Apple
 * Dark-first, premium, minimal
 */

export const Colors = {
  // ─── Brand ─────────────────────────────
  primary:     '#22C55E',   // Electric green
  primaryDim:  'rgba(34,197,94,0.12)',
  primaryGlow: 'rgba(34,197,94,0.25)',
  primaryDark: '#16A34A',

  // ─── Background layers ──────────────────
  bg:          '#040C06',   // Deepest black-green
  bgCard:      '#091410',   // Card surface
  bgElevated:  '#0E1E12',   // Elevated modal
  bgInput:     '#111D13',   // Input fields
  bgOverlay:   'rgba(4,12,6,0.92)',

  // ─── Borders ────────────────────────────
  border:      'rgba(34,197,94,0.10)',
  borderBright:'rgba(34,197,94,0.25)',
  borderSubtle:'rgba(255,255,255,0.05)',

  // ─── Text ───────────────────────────────
  text:        '#E8F5EA',   // Primary text
  textMuted:   '#6B9B74',   // Secondary text
  textDim:     '#2E4D35',   // Placeholder
  textInverse: '#040C06',   // On green backgrounds

  // ─── Status ─────────────────────────────
  success:     '#22C55E',
  successDim:  'rgba(34,197,94,0.12)',
  warning:     '#F59E0B',
  warningDim:  'rgba(245,158,11,0.12)',
  error:       '#EF4444',
  errorDim:    'rgba(239,68,68,0.12)',
  info:        '#3B82F6',
  infoDim:     'rgba(59,130,246,0.12)',

  // ─── Grades ─────────────────────────────
  gradeS:      '#10B981',  gradeSBg: 'rgba(16,185,129,0.15)',
  gradeA:      '#22C55E',  gradeABg: 'rgba(34,197,94,0.15)',
  gradeB:      '#F59E0B',  gradeBBg: 'rgba(245,158,11,0.15)',
  gradeC:      '#F97316',  gradeCBg: 'rgba(249,115,22,0.15)',
  gradeD:      '#EF4444',  gradeDBg: 'rgba(239,68,68,0.15)',

  // ─── Special ────────────────────────────
  solana:      '#9945FF',
  solanaDim:   'rgba(153,69,255,0.12)',
  dodo:        '#FF6B35',
  dodoDim:     'rgba(255,107,53,0.12)',
  zkPurple:    '#8B5CF6',
  zkDim:       'rgba(139,92,246,0.12)',
  satellite:   '#06B6D4',
  satelliteDim:'rgba(6,182,212,0.12)',

  // ─── White alpha ────────────────────────
  white10: 'rgba(255,255,255,0.10)',
  white06: 'rgba(255,255,255,0.06)',
  white04: 'rgba(255,255,255,0.04)',
} as const;

export const Typography = {
  // Display (Sora-like)
  display2xl: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1.5, lineHeight: 46 },
  displayXl:  { fontSize: 32, fontWeight: '700' as const, letterSpacing: -1.0, lineHeight: 38 },
  displayLg:  { fontSize: 28, fontWeight: '600' as const, letterSpacing: -0.8, lineHeight: 34 },
  displayMd:  { fontSize: 24, fontWeight: '600' as const, letterSpacing: -0.5, lineHeight: 30 },
  displaySm:  { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.3, lineHeight: 26 },

  // Body
  bodyLg:  { fontSize: 17, fontWeight: '400' as const, lineHeight: 26 },
  bodyMd:  { fontSize: 15, fontWeight: '400' as const, lineHeight: 24 },
  bodySm:  { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  bodyXs:  { fontSize: 11, fontWeight: '400' as const, lineHeight: 17 },

  // Labels
  labelLg: { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.1, lineHeight: 22 },
  labelMd: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.1, lineHeight: 20 },
  labelSm: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2, lineHeight: 16 },
  labelXs: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5, lineHeight: 14 },

  // Mono (for hashes, amounts)
  monoLg:  { fontSize: 17, fontFamily: 'monospace' as const, fontWeight: '500' as const },
  monoMd:  { fontSize: 13, fontFamily: 'monospace' as const, fontWeight: '500' as const },
  monoSm:  { fontSize: 11, fontFamily: 'monospace' as const, fontWeight: '400' as const },
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
