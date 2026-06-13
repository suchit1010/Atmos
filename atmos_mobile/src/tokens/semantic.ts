/**
 * ATMOS Semantic Tokens
 * What components actually use (maps primitives to purposes)
 */

import { Primitives as P } from './primitives';

export const Tokens = {
  // ── BACKGROUNDS ──────────────────────────────
  bg: {
    screen: P.forest[950], // Main screen background
    elevated: P.forest[900], // Cards, modals
    input: P.forest[800], // Input fields
    hover: P.forest[700], // Hover/pressed states
    overlay: 'rgba(4,14,7,0.85)', // Modal overlay
    glass: 'rgba(13,255,110,0.04)', // Glass tint
  },

  // ── BORDERS ───────────────────────────────────
  border: {
    default: P.forest[700], // Most borders
    subtle: P.forest[800], // Very quiet borders
    strong: P.neutral[700], // Emphasized borders
    accent: P.green[500], // Green accent border
    error: P.red[500],
    warning: P.amber[500],
    focus: P.green[400], // Focus ring
  },

  // ── TEXT ──────────────────────────────────────
  text: {
    primary: P.neutral[50], // Main content
    secondary: P.neutral[300], // Supporting content
    tertiary: P.neutral[500], // Hints, placeholders
    disabled: P.neutral[600],
    accent: P.green[500], // Accent text
    error: P.red[400],
    warning: P.amber[400],
    success: P.green[400],
    info: P.blue[400],
    inverse: P.forest[950], // Text on green buttons
  },

  // ── INTERACTIVE ───────────────────────────────
  interactive: {
    primary: P.green[500],
    primaryHover: P.green[400],
    primaryActive: P.green[600],
    secondary: 'rgba(13,255,110,0.12)',
    secondaryHover: 'rgba(13,255,110,0.18)',
    ghost: 'transparent',
    ghostHover: P.forest[800],
    danger: P.red[500],
    dangerHover: P.red[400],
  },

  // ── STATUS ────────────────────────────────────
  status: {
    draft: { bg: P.neutral[800], text: P.neutral[300], border: P.neutral[600] },
    pending: { bg: P.amber[900], text: P.amber[400], border: P.amber[600] },
    verified: { bg: P.green[950], text: P.green[400], border: P.green[700] },
    rejected: { bg: P.red[900], text: P.red[400], border: P.red[700] },
    minted: { bg: P.purple[900], text: P.purple[400], border: P.purple[700] },
    retired: { bg: P.blue[900], text: P.blue[400], border: P.blue[700] },
  },

  // ── GRADES ────────────────────────────────────
  grade: {
    S: { bg: P.green[950], text: P.green[300], border: P.green[600] },
    A: { bg: P.green[950], text: P.green[400], border: P.green[700] },
    B: { bg: P.amber[900], text: P.amber[400], border: P.amber[700] },
    C: { bg: '#1A1006', text: '#F97316', border: '#C2410C' },
    D: { bg: P.red[900], text: P.red[400], border: P.red[700] },
  },

  // ── SHADOW ────────────────────────────────────
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.4)',
    md: '0 4px 12px rgba(0,0,0,0.4)',
    lg: '0 8px 24px rgba(0,0,0,0.5)',
    xl: '0 16px 48px rgba(0,0,0,0.6)',
    glow: '0 0 20px rgba(13,255,110,0.25)',
    glowStrong: '0 0 40px rgba(13,255,110,0.4)',
  },
} as const;
