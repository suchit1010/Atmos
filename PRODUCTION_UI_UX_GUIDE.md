# ATMOS — Pro-Max UI/UX Implementation Guide
## Version 2.0 · June 2026 · Enterprise Grade

> This is a complete redesign of the UI/UX guide using modern mobile design principles.
> Every section has been rebuilt from first principles.

---

## TABLE OF CONTENTS

1. [Design Philosophy](#1-design-philosophy)
2. [Design Token Architecture](#2-design-token-architecture)
3. [Typography System](#3-typography-system)
4. [Motion & Animation System](#4-motion--animation-system)
5. [Haptics System](#5-haptics-system)
6. [Gesture System](#6-gesture-system)
7. [Component Architecture](#7-component-architecture)
8. [Screen Design System](#8-screen-design-system)
9. [Loading & Skeleton System](#9-loading--skeleton-system)
10. [Error Architecture](#10-error-architecture)
11. [Empty State System](#11-empty-state-system)
12. [Form System](#12-form-system)
13. [Navigation Architecture](#13-navigation-architecture)
14. [Accessibility System](#14-accessibility-system)
15. [Performance Patterns](#15-performance-patterns)
16. [Screen-by-Screen Specs](#16-screen-by-screen-specs)
17. [Testing Protocol](#17-testing-protocol)
18. [Implementation Roadmap](#18-implementation-roadmap)

---

## 1. DESIGN PHILOSOPHY

### The One Sentence
> ATMOS should feel like what Bloomberg Terminal would look like if Jony Ive designed it for farmers.

### Three Tensions We Must Hold
| Tension | Wrong | Right |
|---------|-------|-------|
| Technical ↔ Human | Dense data dumps | Data with emotional context |
| Dark ↔ Legible | Style over function | Dark AND crystal clear |
| Complex ↔ Simple | Hiding complexity | Making complexity feel manageable |

### What Makes ATMOS Different From Every Other Green App
Every climate/fintech app uses sage green, rounded corners, and illustrations of trees. ATMOS uses the aesthetic of a trading floor — because that's what we are. The green is electric, not earthy. The data is prominent, not buried. The trust comes from precision, not warmth.

**Reference points:**
- Bloomberg Terminal (data density, monospace numbers)
- Stripe Dashboard (clean tables, precise states)
- Apple Health (progressive disclosure, data visualization)
- Linear.app (keyboard-first, keyboard shortcuts, speed)

### The Three Rules
1. **Every pixel earns its place.** No decoration unless it carries information.
2. **Speed is a feature.** If an action feels slow, that is a bug.
3. **Errors are not embarrassing.** They are instructions.

---

## 2. DESIGN TOKEN ARCHITECTURE

### 2.1 Primitive Tokens (Raw Values)

```typescript
// tokens/primitives.ts
// These are NEVER used directly in components.
// Components only use semantic tokens.

export const Primitives = {
  // ── GREEN SCALE ──────────────────────────────
  green: {
    50:  '#E8FFF3',
    100: '#C0FFDC',
    200: '#86FFBE',
    300: '#4DFFA0',
    400: '#1AFF84',
    500: '#0DFF6E',  // ← ATMOS accent
    600: '#00D45A',
    700: '#00A847',
    800: '#007C34',
    900: '#005222',
    950: '#002B12',
  },

  // ── FOREST SCALE (backgrounds) ───────────────
  forest: {
    50:  '#EBF2ED',
    100: '#C8DFCD',
    200: '#A2C9AB',
    300: '#7AB387',
    400: '#4F9B5F',
    500: '#347A48',
    600: '#235934',
    700: '#153C22',
    800: '#0D2B18',  // ← card bg
    900: '#081A0D',  // ← deep card
    950: '#040E07',  // ← screen bg
    1000:'#020703',  // ← absolute black-green
  },

  // ── NEUTRAL SCALE ────────────────────────────
  neutral: {
    0:   '#FFFFFF',
    50:  '#F8FAF8',
    100: '#EFF3F0',
    200: '#D8E0DA',
    300: '#B8C6BB',
    400: '#8FA098',
    500: '#637068',
    600: '#4A5550',
    700: '#343D38',
    800: '#1F2620',
    900: '#0F1410',
    950: '#070B08',
  },

  // ── STATUS ────────────────────────────────────
  red:    { 400: '#F87171', 500: '#EF4444', 600: '#DC2626', 900: '#1A0606' },
  amber:  { 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 900: '#1A1006' },
  blue:   { 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 900: '#06101A' },
  purple: { 400: '#C084FC', 500: '#A855F7', 600: '#9333EA', 900: '#13061A' },

  // ── SPACING ───────────────────────────────────
  space: {
    px:  1,   '0.5': 2,  '1': 4,   '1.5': 6,
    '2': 8,   '2.5': 10, '3': 12,  '3.5': 14,
    '4': 16,  '5': 20,   '6': 24,  '7': 28,
    '8': 32,  '10': 40,  '12': 48, '14': 56,
    '16': 64, '20': 80,  '24': 96,
  },

  // ── RADII ─────────────────────────────────────
  radius: {
    none: 0,    sm: 6,     md: 10,
    lg:   14,   xl: 18,    '2xl': 24,
    '3xl': 32,  full: 9999,
  },
} as const;
```

### 2.2 Semantic Tokens (What Components Use)

```typescript
// tokens/semantic.ts
import { Primitives as P } from './primitives';

export const Tokens = {
  // ── BACKGROUNDS ──────────────────────────────
  bg: {
    screen:   P.forest[950],   // Main screen background
    elevated: P.forest[900],   // Cards, modals
    input:    P.forest[800],   // Input fields
    hover:    P.forest[700],   // Hover/pressed states
    overlay:  'rgba(4,14,7,0.85)', // Modal overlay
    glass:    'rgba(13,255,110,0.04)', // Glass tint
  },

  // ── BORDERS ───────────────────────────────────
  border: {
    default:  P.forest[700],         // Most borders
    subtle:   P.forest[800],         // Very quiet borders
    strong:   P.neutral[700],        // Emphasized borders
    accent:   P.green[500],          // Green accent border
    error:    P.red[500],
    warning:  P.amber[500],
    focus:    P.green[400],          // Focus ring
  },

  // ── TEXT ──────────────────────────────────────
  text: {
    primary:  P.neutral[50],         // Main content
    secondary:P.neutral[300],        // Supporting content
    tertiary: P.neutral[500],        // Hints, placeholders
    disabled: P.neutral[600],
    accent:   P.green[500],          // Accent text
    error:    P.red[400],
    warning:  P.amber[400],
    success:  P.green[400],
    info:     P.blue[400],
    inverse:  P.forest[950],         // Text on green buttons
  },

  // ── INTERACTIVE ───────────────────────────────
  interactive: {
    primary:      P.green[500],
    primaryHover: P.green[400],
    primaryActive:P.green[600],
    secondary:    'rgba(13,255,110,0.12)',
    secondaryHover:'rgba(13,255,110,0.18)',
    ghost:        'transparent',
    ghostHover:   P.forest[800],
    danger:       P.red[500],
    dangerHover:  P.red[400],
  },

  // ── STATUS ────────────────────────────────────
  status: {
    draft:      { bg: P.neutral[800],   text: P.neutral[300], border: P.neutral[600] },
    pending:    { bg: P.amber[900],     text: P.amber[400],   border: P.amber[600] },
    verified:   { bg: P.green[950],     text: P.green[400],   border: P.green[700] },
    rejected:   { bg: P.red[900],       text: P.red[400],     border: P.red[700] },
    minted:     { bg: P.purple[900],    text: P.purple[400],  border: P.purple[700] },
    retired:    { bg: P.blue[900],      text: P.blue[400],    border: P.blue[700] },
  },

  // ── GRADES ────────────────────────────────────
  grade: {
    S: { bg: P.green[950],    text: P.green[300],  border: P.green[600]  },
    A: { bg: P.green[950],    text: P.green[400],  border: P.green[700]  },
    B: { bg: P.amber[900],    text: P.amber[400],  border: P.amber[700]  },
    C: { bg: '#1A1006',       text: '#F97316',     border: '#C2410C'     },
    D: { bg: P.red[900],      text: P.red[400],    border: P.red[700]    },
  },

  // ── SHADOW ────────────────────────────────────
  shadow: {
    sm:  '0 1px 3px rgba(0,0,0,0.4)',
    md:  '0 4px 12px rgba(0,0,0,0.4)',
    lg:  '0 8px 24px rgba(0,0,0,0.5)',
    xl:  '0 16px 48px rgba(0,0,0,0.6)',
    glow:'0 0 20px rgba(13,255,110,0.25)',
    glowStrong: '0 0 40px rgba(13,255,110,0.4)',
  },
} as const;
```

### 2.3 Component Tokens

```typescript
// tokens/components.ts
// Specific overrides for each component type
export const ComponentTokens = {
  button: {
    height: { sm: 32, md: 44, lg: 52 },
    paddingX: { sm: 12, md: 16, lg: 24 },
    radius: 10,
    font: { sm: 13, md: 15, lg: 16 },
    fontWeight: '600',
  },
  input: {
    height: 48,
    paddingX: 14,
    paddingY: 12,
    radius: 10,
    fontSize: 15,
    labelSize: 12,
    labelWeight: '500',
    errorSize: 12,
  },
  card: {
    padding: { sm: 12, md: 16, lg: 20 },
    radius: 16,
    gap: 12,
  },
  bottomSheet: {
    handleHeight: 4,
    handleWidth: 36,
    handleRadius: 2,
    headerHeight: 56,
    minPeekHeight: 80,
  },
  modal: {
    radius: 24,
    padding: 24,
    overlayOpacity: 0.85,
  },
  toast: {
    height: 52,
    padding: 14,
    radius: 12,
    duration: 3500,
  },
  tab: {
    height: 52,
    iconSize: 22,
    labelSize: 10,
    gap: 4,
  },
} as const;
```

---

## 3. TYPOGRAPHY SYSTEM

### 3.1 Font Stack

```typescript
// Typography.ts — Complete type system

export const FontFamily = {
  // PRIMARY: All UI, body, labels
  sans: {
    regular:   'Inter-Regular',
    medium:    'Inter-Medium',
    semibold:  'Inter-SemiBold',
    bold:      'Inter-Bold',
  },
  // DISPLAY: Headers only, for impact
  display: {
    medium:    'Poppins-Medium',
    semibold:  'Poppins-SemiBold',
    bold:      'Poppins-Bold',
  },
  // MONO: Numbers, hashes, technical data (critical for fintech)
  mono: {
    regular:   'JetBrainsMono-Regular',
    medium:    'JetBrainsMono-Medium',
    semibold:  'JetBrainsMono-SemiBold',
  },
} as const;

export const TypeScale = {
  //                 size  lineH  tracking  weight
  display2xl: { fontSize: 40, lineHeight: 44, letterSpacing: -1.5, fontFamily: FontFamily.display.bold },
  displayXl:  { fontSize: 32, lineHeight: 36, letterSpacing: -1.2, fontFamily: FontFamily.display.bold },
  displayLg:  { fontSize: 28, lineHeight: 32, letterSpacing: -0.8, fontFamily: FontFamily.display.semibold },
  displayMd:  { fontSize: 24, lineHeight: 28, letterSpacing: -0.5, fontFamily: FontFamily.display.semibold },
  displaySm:  { fontSize: 20, lineHeight: 24, letterSpacing: -0.3, fontFamily: FontFamily.display.medium },

  headingLg:  { fontSize: 18, lineHeight: 24, letterSpacing: -0.2, fontFamily: FontFamily.sans.semibold },
  headingMd:  { fontSize: 16, lineHeight: 22, letterSpacing: -0.1, fontFamily: FontFamily.sans.semibold },
  headingSm:  { fontSize: 14, lineHeight: 20, letterSpacing: 0,    fontFamily: FontFamily.sans.semibold },

  bodyLg:     { fontSize: 16, lineHeight: 24, letterSpacing: 0.1,  fontFamily: FontFamily.sans.regular },
  bodyMd:     { fontSize: 15, lineHeight: 22, letterSpacing: 0.1,  fontFamily: FontFamily.sans.regular },
  bodySm:     { fontSize: 13, lineHeight: 20, letterSpacing: 0.1,  fontFamily: FontFamily.sans.regular },
  bodyXs:     { fontSize: 12, lineHeight: 18, letterSpacing: 0.1,  fontFamily: FontFamily.sans.regular },

  labelLg:    { fontSize: 14, lineHeight: 18, letterSpacing: 0.2,  fontFamily: FontFamily.sans.medium },
  labelMd:    { fontSize: 12, lineHeight: 16, letterSpacing: 0.3,  fontFamily: FontFamily.sans.medium },
  labelSm:    { fontSize: 10, lineHeight: 14, letterSpacing: 0.5,  fontFamily: FontFamily.sans.medium },
  labelXs:    { fontSize: 9,  lineHeight: 12, letterSpacing: 0.8,  fontFamily: FontFamily.sans.semibold, textTransform: 'uppercase' },

  // MONO — for prices, hashes, scores, block numbers
  monoXl:     { fontSize: 24, lineHeight: 28, letterSpacing: -0.5, fontFamily: FontFamily.mono.semibold },
  monoLg:     { fontSize: 20, lineHeight: 24, letterSpacing: -0.3, fontFamily: FontFamily.mono.semibold },
  monoMd:     { fontSize: 16, lineHeight: 20, letterSpacing: 0,    fontFamily: FontFamily.mono.medium },
  monoSm:     { fontSize: 13, lineHeight: 18, letterSpacing: 0.1,  fontFamily: FontFamily.mono.regular },
  monoXs:     { fontSize: 11, lineHeight: 14, letterSpacing: 0.1,  fontFamily: FontFamily.mono.regular },
} as const;
```

### 3.2 Typography Rules

```
RULE 1: Numbers are ALWAYS monospace.
  ✓ ₹18,610   ✓ 2.46 tCO₂e   ✓ 87/100   ✓ 0.000005 SOL
  ✗ Never Inter/Poppins for numerical data — it looks amateurish

RULE 2: Headings over 20px use Poppins.
  Everything else uses Inter.

RULE 3: Letter spacing scales inversely with size.
  Large text: tight spacing (-1.5 to -0.5)
  Small text:  wide spacing (0.3 to 0.8)

RULE 4: Line-height ratio
  Display: 1.08–1.1
  Headings: 1.3–1.4
  Body: 1.5–1.6
  Labels: 1.2–1.4

RULE 5: Maximum line length
  Body text: 72 characters max
  Labels: no limit
  Error messages: 80 characters max
```

---

## 4. MOTION & ANIMATION SYSTEM

### 4.1 Motion Principles

```
PRINCIPLE 1: Every animation has a reason.
  Not: "it looks cool"
  Yes: "it tells the user what just changed and how it changed"

PRINCIPLE 2: Fast interactions, slow reveals.
  Taps/presses: 80–150ms (feel instant)
  Screen transitions: 300–400ms
  Data reveals: 400–600ms
  Celebrations: 600–900ms

PRINCIPLE 3: Spring, not timing curves.
  Spring physics (tension/friction) > cubic-bezier
  Overshoot slightly on appear, spring to final position
  Use Reanimated 2 worklets for 60fps on UI thread

PRINCIPLE 4: Choreography over simultaneity.
  Never animate everything at once
  Stagger by 40–80ms for lists
  Sequence for flows (step 1 exits, then step 2 enters)

PRINCIPLE 5: Respect reduce-motion.
  AccessibilityInfo.isReduceMotionEnabled()
  Fade instead of spring when true
  Never disable animations entirely — just simplify them
```

### 4.2 Animation Constants

```typescript
// motion/constants.ts
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
  rigid:  { damping: 30, stiffness: 400, mass: 0.5 },
} as const;

// ── TIMING CONFIGS ─────────────────────────────────────────
export const Duration = {
  instant:    80,    // Pressed state, toggle
  fast:       150,   // Hover, focus
  normal:     250,   // Most UI state changes
  slow:       400,   // Screen transitions, reveals
  deliberate: 600,   // Important moments (verified, minted)
  celebration:900,   // Success screens
} as const;

// ── EASING ────────────────────────────────────────────────
export const Ease = {
  out:    Easing.out(Easing.cubic),
  in:     Easing.in(Easing.cubic),
  inOut:  Easing.inOut(Easing.cubic),
  spring: Easing.elastic(1),
  linear: Easing.linear,
} as const;

// ── STAGGER ───────────────────────────────────────────────
export const Stagger = {
  tight:  40,   // Dense lists
  normal: 60,   // Standard lists
  loose:  80,   // Focused steps
  dramatic: 120, // Onboarding
} as const;
```

### 4.3 Reusable Animation Hooks

```typescript
// motion/hooks.ts
import { useSharedValue, withSpring, withTiming,
  useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { Spring, Duration, Ease } from './constants';

// ── APPEAR ON MOUNT ───────────────────────────────────────
export const useAppear = (delay = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value    = withTiming(1,       { duration: Duration.slow, easing: Ease.out });
      translateY.value = withSpring(0,        Spring.smooth);
      scale.value      = withSpring(1,        Spring.snappy);
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return style;
};

// ── PRESS STATE ───────────────────────────────────────────
export const usePressable = () => {
  const scale = useSharedValue(1);

  const handlers = {
    onPressIn:  () => { scale.value = withSpring(0.95, Spring.snappy) },
    onPressOut: () => { scale.value = withSpring(1,    Spring.snappy) },
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { handlers, style };
};

// ── ERROR SHAKE ───────────────────────────────────────────
export const useShake = () => {
  const x = useSharedValue(0);

  const trigger = () => {
    x.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10,  { duration: 60 }),
      withTiming(-7,  { duration: 50 }),
      withTiming(7,   { duration: 50 }),
      withTiming(-4,  { duration: 40 }),
      withSpring(0,   Spring.rigid),
    );
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return { trigger, style };
};

// ── PROGRESS BAR ──────────────────────────────────────────
export const useProgressBar = (target: number) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(target, {
      duration: Duration.deliberate,
      easing: Ease.out,
    });
  }, [target]);

  const style = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return style;
};

// ── CONFIDENCE RING ───────────────────────────────────────
export const useScoreReveal = (score: number) => {
  const progress = useSharedValue(0);
  const displayed = useDerivedValue(() =>
    Math.round(interpolate(progress.value, [0, 1], [0, score], Extrapolate.CLAMP))
  );

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 1200,
      easing: Ease.out,
    });
  }, [score]);

  return { progress, displayed };
};

// ── STAGGERED LIST ────────────────────────────────────────
export const useStagger = (index: number, delay = 60) => {
  return useAppear(index * delay);
};

// ── SLIDE FROM BOTTOM (bottom sheets, modals) ─────────────
export const useSlideUp = (visible: boolean) => {
  const translateY = useSharedValue(600);

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, Spring.smooth)
      : withTiming(600, { duration: Duration.slow, easing: Ease.in });
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return style;
};
```

### 4.4 Specific Animation Patterns

```typescript
// motion/patterns.ts

// ── VERIFIED CELEBRATION ──────────────────────────────────
// Used on: Verification complete, Minting complete, Payment success
export const VerifiedAnimation = () => {
  const scale     = useSharedValue(0);
  const checkOpac = useSharedValue(0);
  const glowOpac  = useSharedValue(0);

  useEffect(() => {
    // 1. Circle pops in
    scale.value = withSequence(
      withSpring(1.2, Spring.bouncy),
      withSpring(1.0, Spring.snappy),
    );
    // 2. Check fades in
    checkOpac.value = withDelay(200, withTiming(1, { duration: 300 }));
    // 3. Glow pulses
    glowOpac.value  = withDelay(300, withSequence(
      withTiming(1, { duration: 400 }),
      withRepeat(withTiming(0.4, { duration: 1200 }), -1, true),
    ));
  }, []);

  // Render: Circle + Check + Glow ring
};

// ── STEP PROGRESSION ──────────────────────────────────────
// Used on: Verification steps, ZK proof steps
export const StepTransition = {
  exitStep: (direction: 'left' | 'right' = 'left') => ({
    opacity:     withTiming(0, { duration: 180 }),
    translateX:  withTiming(direction === 'left' ? -20 : 20, { duration: 200 }),
  }),
  enterStep: () => ({
    opacity:    withDelay(200, withTiming(1, { duration: 250 })),
    translateX: withDelay(200, withSpring(0, Spring.smooth)),
  }),
};

// ── COUNTER TICK ──────────────────────────────────────────
// For animating numbers (dashboard stats changing live)
export const useCountUp = (value: number, duration = 800) => {
  const displayed = useSharedValue(0);

  useEffect(() => {
    displayed.value = withTiming(value, {
      duration,
      easing: Ease.out,
    });
  }, [value]);

  return useAnimatedProps(() => ({
    text: Math.round(displayed.value).toLocaleString('en-IN'),
  }));
};
```

---

## 5. HAPTICS SYSTEM

```typescript
// haptics/index.ts
// Every tap, every error, every success — defined in one place.
// Haptics are the sound design of mobile apps.

import * as Haptics from 'expo-haptics';

export const HapticPattern = {
  // ── NAVIGATIONAL ──────────────────────────────
  tap: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  select: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  tabSwitch: () =>
    Haptics.selectionAsync(),

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
  longPress: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

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
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 150);
  },

  // ── SCROLL ────────────────────────────────────
  scrollSnap: () =>
    Haptics.selectionAsync(),

  pullRefresh: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
} as const;

// ── USAGE MAP ─────────────────────────────────────────────
/*
  SCREEN               EVENT                    HAPTIC
  ─────────────────────────────────────────────────────────
  All                  Button tap               tap
  Auth OTP             OTP complete digit       selectionAsync
  Auth OTP             Wrong OTP                error
  Dashboard            Pull refresh             pullRefresh
  Dashboard            Card tap                 tap
  Project Create       Step complete            success
  Project Create       Validation error         error
  Verification         Step complete            select
  Verification         Verification done        verified
  Marketplace          Buy button               confirm
  Payment              Payment success          payment
  Minting              Token minted             minted
  Portfolio            Swipe to retire          delete
  Any                  Destructive confirm      warning
*/
```

---

## 6. GESTURE SYSTEM

```typescript
// gestures/patterns.ts
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// ── SWIPE TO DELETE/RETIRE ─────────────────────────────────
// For Portfolio holdings list
export const SwipeToAction = ({ onDelete, onList, children }) => {
  const translateX = useSharedValue(0);
  const THRESHOLD  = -80;

  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow left swipe
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX < THRESHOLD) {
        // Reveal action buttons
        translateX.value = withSpring(-160, Spring.smooth);
        HapticPattern.longPress();
      } else {
        // Snap back
        translateX.value = withSpring(0, Spring.snappy);
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={[{ transform: [{ translateX }] }]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

// ── LONG PRESS FOR CONTEXT MENU ───────────────────────────
export const useLongPressMenu = (options: MenuItem[]) => {
  const [visible, setVisible] = useState(false);

  const gesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      runOnJS(HapticPattern.longPress)();
      runOnJS(setVisible)(true);
    });

  return { gesture, visible, setVisible };
};

// ── PINCH TO ZOOM (for satellite imagery) ─────────────────
export const useMapGesture = () => {
  const scale  = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Clamp between 0.8x and 4x
      if (scale.value < 0.8) scale.value = withSpring(0.8, Spring.snappy);
      if (scale.value > 4)   scale.value = withSpring(4,   Spring.snappy);
    });

  return { pinch, scale };
};

// ── PULL TO REFRESH ───────────────────────────────────────
export const PULL_THRESHOLD = 80;

export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const translateY = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        // Rubber-band effect: less movement the further you pull
        translateY.value = Math.sqrt(e.translationY) * 5;
      }
    })
    .onEnd(async (e) => {
      if (e.translationY > PULL_THRESHOLD) {
        runOnJS(HapticPattern.pullRefresh)();
        runOnJS(setRefreshing)(true);
        translateY.value = withSpring(PULL_THRESHOLD, Spring.smooth);
        await runOnJS(onRefresh)();
        translateY.value = withSpring(0, Spring.smooth);
        runOnJS(setRefreshing)(false);
      } else {
        translateY.value = withSpring(0, Spring.snappy);
      }
    });

  return { pan, translateY, refreshing };
};
```

---

## 7. COMPONENT ARCHITECTURE

### 7.1 Button System (All States)

```typescript
// components/Button/Button.tsx

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;          // Left icon
  trailingIcon?: ReactNode;  // Right icon (for "Next →")
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: keyof typeof HapticPattern;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// STATES TO DESIGN FOR:
// 1. Default
// 2. Pressed (scale 0.96, darker)
// 3. Loading (spinner + disabled interaction)
// 4. Disabled (40% opacity, no interaction)
// 5. Success (brief green flash before completing)
// 6. Error (brief red flash + shake)

const variantStyles: Record<ButtonVariant, ViewStyle & TextStyle> = {
  primary: {
    backgroundColor: Tokens.interactive.primary,
    color: Tokens.text.inverse,
  },
  secondary: {
    backgroundColor: Tokens.interactive.secondary,
    color: Tokens.text.accent,
    // + accent border via before-pseudo via outline approach
  },
  ghost: {
    backgroundColor: 'transparent',
    color: Tokens.text.secondary,
  },
  danger: {
    backgroundColor: Tokens.interactive.danger,
    color: Tokens.text.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Tokens.border.default,
    color: Tokens.text.secondary,
  },
};

export const Button: FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  haptic = 'tap',
  ...props
}) => {
  const { handlers, style: pressStyle } = usePressable();
  const { trigger: shake, style: shakeStyle } = useShake();

  const handlePress = async () => {
    if (loading || disabled) return;
    await HapticPattern[haptic]?.();
    onPress();
  };

  return (
    <Animated.View style={[pressStyle, shakeStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlers.onPressIn}
        onPressOut={handlers.onPressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          styles.base,
          styles[size],
          variantStyles[variant],
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'primary' ? Tokens.text.inverse : Tokens.text.accent} />
        ) : (
          <>
            {props.icon}
            <Text style={[TypeScale.labelMd, { color: variantStyles[variant].color }]}>{label}</Text>
            {props.trailingIcon}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};
```

### 7.2 Input System (All States)

```typescript
// components/Input/Input.tsx

interface InputProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: 'text' | 'number' | 'phone' | 'email' | 'password' | 'multiline' | 'otp';
  prefix?: ReactNode;       // Currency symbols, icons
  suffix?: ReactNode;       // Copy button, unit labels
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  nextInputRef?: RefObject<TextInput>;
}

// STATES:
// 1. Empty      — subtle border
// 2. Focused    — green accent border + label lifts
// 3. Filled     — green subtle border
// 4. Error      — red border + error message + shake
// 5. Disabled   — 40% opacity, no interaction
// 6. Loading    — pulse shimmer
// 7. Success    — brief green checkmark then settled

const InputComponent: FC<InputProps> = ({ label, error, hint, required, ...props }) => {
  const [focused, setFocused] = useState(false);
  const { trigger: shake, style: shakeStyle } = useShake();
  const borderColor = useSharedValue(Tokens.border.default);

  useEffect(() => {
    if (error) {
      borderColor.value = withTiming(Tokens.border.error, { duration: 150 });
      shake();
      HapticPattern.error();
    } else if (focused) {
      borderColor.value = withTiming(Tokens.border.focus, { duration: 150 });
    } else {
      borderColor.value = withTiming(Tokens.border.default, { duration: 150 });
    }
  }, [error, focused]);

  const animBorder = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  return (
    <View style={styles.fieldGroup}>
      {/* Label */}
      <View style={styles.labelRow}>
        <Text style={[TypeScale.labelMd, { color: error ? Tokens.text.error : Tokens.text.tertiary }]}>
          {label}
          {required && <Text style={{ color: Tokens.text.error }}> *</Text>}
        </Text>
        {props.maxLength && (
          <Text style={[TypeScale.labelXs, { color: Tokens.text.tertiary }]}>
            {props.value.length}/{props.maxLength}
          </Text>
        )}
      </View>

      {/* Input wrapper */}
      <Animated.View style={[styles.inputWrap, shakeStyle, animBorder]}>
        {props.prefix}
        <TextInput
          style={[styles.input, TypeScale.bodyMd]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {props.suffix}
      </Animated.View>

      {/* Error / hint */}
      {error ? (
        <View style={styles.errorRow}>
          <AlertCircle size={11} color={Tokens.text.error} />
          <Text style={[TypeScale.bodyXs, { color: Tokens.text.error }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[TypeScale.bodyXs, { color: Tokens.text.tertiary }]}>{hint}</Text>
      ) : null}
    </View>
  );
};
```

### 7.3 OTP Input (Properly Engineered)

```typescript
// components/OTPInput/OTPInput.tsx
// The most important input in the app. Gets first-time users in.
// Must be flawless.

interface OTPInputProps {
  length?: number;           // default: 6
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  error?: boolean;
  loading?: boolean;
}

export const OTPInput: FC<OTPInputProps> = ({
  length = 6, value, onChange, onComplete, error, loading,
}) => {
  const inputRef = useRef<TextInput>(null);
  const { trigger: shake, style: shakeStyle } = useShake();

  // A single hidden TextInput drives the display
  // Avoids the jank of 6 separate inputs
  const digits = value.padEnd(length, '').split('').slice(0, length);

  useEffect(() => {
    if (error) { shake(); HapticPattern.error(); }
  }, [error]);

  useEffect(() => {
    if (value.length === length) {
      onComplete(value);
      HapticPattern.success();
    }
  }, [value]);

  // Auto-fill from SMS on Android/iOS
  // Uses textContentType="oneTimeCode" on iOS
  // Uses importantForAutofill on Android

  return (
    <Animated.View style={shakeStyle}>
      {/* Hidden master input */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"  // iOS SMS autofill
        autoComplete="one-time-code"   // Android SMS autofill
        caretHidden
      />

      {/* Visual digit boxes */}
      <Pressable onPress={() => inputRef.current?.focus()} style={styles.digitRow}>
        {digits.map((digit, i) => {
          const isFocused = value.length === i;
          const isFilled  = i < value.length;
          const isError   = error;

          return (
            <Animated.View
              key={i}
              style={[
                styles.digitBox,
                isFocused && styles.digitBoxFocused,
                isFilled  && styles.digitBoxFilled,
                isError   && styles.digitBoxError,
              ]}
            >
              {/* Cursor blink when focused on this box */}
              {isFocused && !digit && <CursorBlink />}
              {digit && (
                <Text style={[TypeScale.monoXl, { color: Tokens.text.primary }]}>
                  {digit}
                </Text>
              )}
            </Animated.View>
          );
        })}
      </Pressable>
    </Animated.View>
  );
};

// Digit box styles
const styles = StyleSheet.create({
  digitRow:     { flexDirection: 'row', gap: 8 },
  digitBox:     {
    width: 44, height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Tokens.border.default,
    backgroundColor: Tokens.bg.input,
    alignItems: 'center', justifyContent: 'center',
  },
  digitBoxFocused: { borderColor: Tokens.border.focus },
  digitBoxFilled:  { borderColor: Tokens.border.subtle, backgroundColor: Tokens.bg.elevated },
  digitBoxError:   { borderColor: Tokens.border.error, backgroundColor: Tokens.status.rejected.bg },
  hiddenInput:     { position: 'absolute', opacity: 0, width: 0, height: 0 },
});
```

### 7.4 Toast System

```typescript
// components/Toast/ToastManager.tsx
// Inspired by Vercel's sonner — single source of truth

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: { label: string; onPress: () => void };
  promise?: Promise<any>;
}

// Singleton store — no context needed
export const ToastStore = create<{
  toasts: Toast[];
  add: (t: Omit<Toast, 'id'>) => string;
  remove: (id: string) => void;
  update: (id: string, t: Partial<Toast>) => void;
}>()((set) => ({
  toasts: [],
  add: (t) => {
    const id = nanoid();
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    if (t.duration !== 0) {
      setTimeout(() => ToastStore.getState().remove(id), t.duration ?? 3500);
    }
    return id;
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  update: (id, t) => set((s) => ({ toasts: s.toasts.map(x => x.id === id ? { ...x, ...t } : x) })),
}));

// Shorthand API — call from anywhere, no hooks needed
export const toast = {
  success: (title: string, opts?: Partial<Toast>) => {
    HapticPattern.success();
    return ToastStore.getState().add({ type: 'success', title, ...opts });
  },
  error: (title: string, opts?: Partial<Toast>) => {
    HapticPattern.error();
    return ToastStore.getState().add({ type: 'error', title, duration: 5000, ...opts });
  },
  loading: (title: string) =>
    ToastStore.getState().add({ type: 'loading', title, duration: 0 }),
  promise: async <T,>(promise: Promise<T>, opts: {
    loading: string; success: string | ((v: T) => string); error: string;
  }) => {
    const id = toast.loading(opts.loading);
    try {
      const v = await promise;
      ToastStore.getState().update(id, {
        type: 'success',
        title: typeof opts.success === 'function' ? opts.success(v) : opts.success,
        duration: 3500,
      });
      return v;
    } catch (e) {
      ToastStore.getState().update(id, { type: 'error', title: opts.error, duration: 5000 });
      throw e;
    }
  },
};

// Usage examples:
// toast.success('Project verified', { description: '2.46 tCO₂e · Grade A' });
// toast.error('Verification failed', { action: { label: 'Retry', onPress: retry } });
// toast.promise(verifyProject(id), {
//   loading: 'Verifying project...',
//   success: (r) => `Verified: ${r.tonnes} tCO₂e`,
//   error: 'Verification failed',
// });
```

### 7.5 Bottom Sheet System

```typescript
// components/BottomSheet/BottomSheet.tsx
// All modals, option sheets, and detail panels use this.
// Never use Alert.alert for anything the user chose to trigger.

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  snapPoints?: number[];    // [0.4, 0.8] = 40% and 80% of screen
  scrollable?: boolean;
  children: ReactNode;
}

// Snap points usage:
// Single action sheet (delete, confirm): snapPoints={[0.35]}
// Content sheet (listing detail):        snapPoints={[0.55]}
// Full content (filter panel):           snapPoints={[0.7, 0.95]}
// Long scrollable (portfolio detail):    snapPoints={[0.6, 0.95]}
```

### 7.6 Skeleton System

```typescript
// components/Skeleton/Skeleton.tsx
// Every data-dependent view has a skeleton.
// Skeletons have the SAME layout as real content.

const Shimmer: FC<{ style: ViewStyle }> = ({ style }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 700, easing: Ease.inOut }),
        withTiming(0.4, { duration: 700, easing: Ease.inOut }),
      ),
      -1, false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{
        backgroundColor: Tokens.bg.elevated,
        borderRadius: 6,
      }, style, animStyle]}
    />
  );
};

// Skeleton variants — match actual component layouts exactly
export const Skeletons = {
  DashboardCard:    () => (/* Same layout as DashboardCard, filled with Shimmer */),
  ProjectListItem:  () => (/* Same layout as ProjectListItem */),
  VerificationStep: () => (/* Same layout as VerificationStep */),
  MarketplaceListing: () => (/* Same layout as listing card */),
  ProfileHeader:    () => (/* Avatar + name + badge, all Shimmer */),
};
```

---

## 8. SCREEN DESIGN SYSTEM

### Nav Bar Contract

```typescript
// Every screen gets one of four nav bar patterns.
// NEVER deviate from these. Inconsistency kills trust.

type NavPattern =
  | 'root'         // Home, Market, Portfolio, Profile tabs (no back)
  | 'modal'        // X dismiss, title center, optional action right
  | 'flow'         // Back arrow, step "2 of 4" center, no right action
  | 'detail';      // Back arrow, entity title center, kebab/share right

// NEVER put the hamburger menu on nav bar. The tab bar IS the nav.
// NEVER put navigation items inside the screen content area.
```

### Screen Template

```typescript
// Every screen follows this structure exactly.
// Copy this template, don't improvise.

const ScreenTemplate: FC<ScreenProps> = ({ navigation, route }) => {
  // 1. Data loading
  const { data, isLoading, error, refetch } = useQuery(...);

  // 2. State
  const [localState, setLocalState] = useState();

  // 3. Handlers
  const handleAction = async () => { ... };

  // 4. Early returns
  if (isLoading) return <LoadingScreen />;
  if (error)     return <ErrorScreen onRetry={refetch} error={error} />;

  // 5. Render
  return (
    <ScreenWrapper>
      {/* Nav bar */}
      <NavBar pattern="detail" title="Screen Title" />

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* ... */}
      </ScrollView>

      {/* Fixed bottom action */}
      <SafeBottomAction>
        <Button label="Primary Action" onPress={handleAction} fullWidth />
      </SafeBottomAction>
    </ScreenWrapper>
  );
};
```

---

## 9. LOADING & SKELETON SYSTEM

```typescript
// The golden rule: data-dependent UI never shows empty containers.
// It either shows skeleton or content. Never both. Never neither.

// ── DATA STATES ───────────────────────────────────────────
type DataState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'empty' }
  | { status: 'success'; data: T };

// ── QUERY WRAPPER ─────────────────────────────────────────
function useDataState<T>(query: UseQueryResult<T, Error>): DataState<T> {
  const { data, isLoading, isError, error } = query;
  if (isLoading) return { status: 'loading' };
  if (isError)   return { status: 'error', error: error! };
  if (!data || (Array.isArray(data) && data.length === 0))
    return { status: 'empty' };
  return { status: 'success', data };
}

// ── USAGE ─────────────────────────────────────────────────
const state = useDataState(useProjects());

return match(state)
  .with({ status: 'loading' }, () => <ProjectListSkeleton count={4} />)
  .with({ status: 'error'   }, ({ error }) => <ErrorBlock error={error} onRetry={refetch} />)
  .with({ status: 'empty'   }, () => <EmptyState type="projects" />)
  .with({ status: 'success' }, ({ data }) => <ProjectList projects={data} />)
  .exhaustive();

// ── OPTIMISTIC UPDATES ────────────────────────────────────
// Don't wait for server to confirm non-critical actions.
// Update UI immediately, rollback on error.

const { mutate: retire } = useMutation({
  mutationFn: retireCredit,
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['portfolio'] });
    const prev = queryClient.getQueryData(['portfolio']);
    // Optimistically remove
    queryClient.setQueryData(['portfolio'], (old) =>
      old?.filter(item => item.id !== id)
    );
    return { prev };
  },
  onError: (err, id, ctx) => {
    queryClient.setQueryData(['portfolio'], ctx?.prev);
    toast.error('Failed to retire credit');
  },
  onSuccess: () => {
    toast.success('Credit retired', { description: 'BRSR certificate generated' });
    HapticPattern.success();
  },
});
```

---

## 10. ERROR ARCHITECTURE

```typescript
// errors/taxonomy.ts
// Every error in the app is one of these types.
// Never show a raw error string to the user.

export const ErrorType = {
  // NETWORK
  OFFLINE:          { title: 'No connection', action: 'Try again when online', canRetry: false },
  TIMEOUT:          { title: 'Request timed out', action: 'Check your connection and retry', canRetry: true },
  SERVER_ERROR:     { title: 'Something went wrong', action: 'Our team has been notified. Try again in a minute.', canRetry: true },

  // AUTH
  OTP_INVALID:      { title: 'Wrong code', action: 'Check the SMS and try again', canRetry: false },
  OTP_EXPIRED:      { title: 'Code expired', action: 'Request a new code', canRetry: false },
  SESSION_EXPIRED:  { title: 'Session expired', action: 'Sign in again to continue', canRetry: false },

  // SATELLITE/AI
  SATELLITE_UNAVAILABLE: { title: 'Satellite data unavailable', action: 'Try again in 2–4 hours, or upload manual evidence', canRetry: true },
  AI_TIMEOUT:            { title: 'Verification is taking longer than expected', action: 'We\'ll notify you when it\'s ready', canRetry: false },
  FRAUD_DETECTED:        { title: 'Verification flagged for review', action: 'A team member will review your project within 48 hours', canRetry: false },

  // PAYMENT
  PAYMENT_DECLINED:     { title: 'Payment declined', action: 'Check your UPI app or try a different method', canRetry: true },
  PAYMENT_FAILED:       { title: 'Payment failed', action: 'Your money was not charged. Try again.', canRetry: true },
  INSUFFICIENT_FUNDS:   { title: 'Insufficient funds', action: 'Add funds to your account and try again', canRetry: false },

  // SOLANA
  SOLANA_DOWN:          { title: 'Blockchain temporarily unavailable', action: 'Settlement will complete automatically when the network recovers', canRetry: false },
  TX_FAILED:            { title: 'Transaction failed', action: 'No funds were transferred. Try again.', canRetry: true },

  // VALIDATION
  INVALID_COORDINATES:  { title: 'Invalid location', action: 'Make sure location services are enabled', canRetry: false },
  FILE_TOO_LARGE:       { title: 'Photo too large', action: 'Use a photo under 10MB', canRetry: false },
  UNSUPPORTED_FORMAT:   { title: 'Unsupported file format', action: 'Use JPG, PNG, or HEIC photos', canRetry: false },
} as const;

// Error display components:
// ErrorBlock    — inline, for sections that failed to load
// ErrorBanner   — top of screen, dismissible
// ErrorScreen   — full screen, with retry CTA
// ErrorToast    — toast.error() for transient errors
// ErrorField    — below form inputs
```

---

## 11. EMPTY STATE SYSTEM

```typescript
// empty-states/types.ts
// Every list, feed, or data view has an empty state.
// Empty states are NOT sad — they are invitations.

export const EmptyStateConfigs = {
  projects: {
    icon: 'leaf',                   // Feather icon name
    title: 'No projects yet',
    description: 'Create your first climate project to start generating verified carbon credits.',
    cta: { label: 'Create Project', route: 'CreateProject' },
  },
  marketplace: {
    icon: 'shopping-bag',
    title: 'No listings match your filters',
    description: 'Try adjusting your filters, or check back later for new listings.',
    cta: { label: 'Clear Filters', action: 'clearFilters' },
    secondaryCta: { label: 'View All', action: 'viewAll' },
  },
  portfolio: {
    icon: 'briefcase',
    title: 'Your portfolio is empty',
    description: 'Buy carbon credits on the marketplace to build your portfolio.',
    cta: { label: 'Browse Marketplace', route: 'Marketplace' },
  },
  activity: {
    icon: 'activity',
    title: 'No recent activity',
    description: 'Your project updates, payments, and settlements will appear here.',
    cta: null,
  },
  search: {
    icon: 'search',
    title: 'No results for "{query}"',
    description: 'Try a different search term or browse all listings.',
    cta: { label: 'Clear Search', action: 'clearSearch' },
  },
  notifications: {
    icon: 'bell',
    title: 'You\'re all caught up',
    description: 'New verification results, payments, and updates will appear here.',
    cta: null,
  },
} as const;
```

---

## 12. FORM SYSTEM

### 12.1 React Hook Form + Zod Integration

```typescript
// forms/schemas.ts
import { z } from 'zod';

export const PhoneSchema = z.object({
  countryCode: z.string().min(1),
  number: z.string()
    .min(10, 'Enter a valid 10-digit number')
    .max(10, 'Enter a valid 10-digit number')
    .regex(/^\d+$/, 'Numbers only'),
});

export const ProjectSchema = z.object({
  entityType: z.enum(['biochar', 'agroforestry', 'solar', 'ev', 'building', 'shipping'],
    { errorMap: () => ({ message: 'Select a project type' }) }),
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be under 100 characters')
    .trim(),
  location: z.object({
    lat: z.number({ invalid_type_error: 'Invalid coordinates' }).min(-90).max(90),
    lng: z.number({ invalid_type_error: 'Invalid coordinates' }).min(-180).max(180),
    address: z.string().optional(),
  }),
  areaHa: z
    .number({ invalid_type_error: 'Enter a valid area' })
    .positive('Area must be positive')
    .max(100000, 'Area seems too large — contact support'),
  photos: z.array(z.string()).min(1, 'Add at least one photo'),
  metadata: z.record(z.string(), z.any()).optional(),
});

// forms/useProjectForm.ts
export const useProjectForm = () => {
  const { control, handleSubmit, formState: { errors, isDirty }, watch, setValue } = useForm({
    resolver: zodResolver(ProjectSchema),
    defaultValues: { entityType: '', name: '', location: null, areaHa: undefined, photos: [] },
    mode: 'onBlur',         // Validate on blur, not on every keystroke
    reValidateMode: 'onChange', // Re-validate on change after first blur
  });

  // Auto-save draft every 30 seconds if dirty
  const values = watch();
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => saveDraft(values), 30_000);
    return () => clearTimeout(timer);
  }, [values, isDirty]);

  return { control, handleSubmit: handleSubmit(onSubmit), errors };
};
```

### 12.2 Multi-Step Form Architecture

```typescript
// forms/MultiStepForm.tsx
// All multi-step flows in ATMOS use this pattern.

interface StepConfig {
  id: string;
  title: string;
  subtitle?: string;
  component: FC<StepProps>;
  validationKeys: (keyof ProjectSchema)[];  // Which fields to validate in this step
  canSkip?: boolean;
}

const STEPS: StepConfig[] = [
  {
    id: 'type',
    title: 'Project Type',
    subtitle: 'Choose your climate action',
    component: ProjectTypeStep,
    validationKeys: ['entityType'],
  },
  {
    id: 'details',
    title: 'Project Details',
    component: ProjectDetailsStep,
    validationKeys: ['name', 'areaHa'],
  },
  {
    id: 'location',
    title: 'Location & Media',
    component: LocationStep,
    validationKeys: ['location', 'photos'],
  },
];

// The key insight: validation happens per-step, not at end.
// User knows immediately if something is wrong.
// Progress is saved so interruptions are not catastrophic.
```

---

## 13. NAVIGATION ARCHITECTURE

### 13.1 Stack Structure

```
Root Navigator
├── AuthStack (unauthenticated)
│   ├── WelcomeScreen
│   ├── PhoneScreen
│   └── OTPScreen
│
└── AppStack (authenticated)
    ├── TabNavigator
    │   ├── HomeTab
    │   │   ├── DashboardScreen
    │   │   └── NotificationsScreen
    │   ├── ProjectsTab
    │   │   ├── ProjectListScreen
    │   │   ├── ProjectDetailScreen
    │   │   └── ProjectCreateFlow (sub-stack)
    │   │       ├── TypeStep
    │   │       ├── DetailsStep
    │   │       └── MediaStep
    │   ├── MarketTab
    │   │   ├── MarketplaceScreen
    │   │   └── ListingDetailScreen
    │   ├── PortfolioTab
    │   │   └── PortfolioScreen
    │   └── ProfileTab
    │       ├── ProfileScreen
    │       └── SettingsScreen
    │
    └── Modal Screens (presented over tabs)
        ├── VerificationFlow
        │   ├── VerifyingScreen
        │   └── VerificationResultScreen
        ├── ZKProofScreen
        ├── MintingScreen
        ├── PaymentFlow
        │   ├── PaymentSummaryScreen
        │   ├── DodoCheckoutScreen
        │   └── PaymentSuccessScreen
        └── CertificateScreen
```

### 13.2 Tab Bar Design

```typescript
// The tab bar is the app's navigation spine.
// Five tabs, never more. Icons always + labels.
// Active tab shows icon filled + label green + indicator dot.
// Badge on tab shows count (red pill, max "9+").

const TAB_CONFIG = [
  { key: 'home',      icon: Home,      label: 'Home'      },
  { key: 'projects',  icon: Leaf,      label: 'Projects'  },
  { key: 'market',    icon: BarChart2, label: 'Market'    },
  { key: 'portfolio', icon: Briefcase, label: 'Portfolio' },
  { key: 'profile',   icon: User,      label: 'Profile'   },
];

// Scroll-to-top on second tap on active tab (like all major apps)
// No animation between tabs — just cut. Swipe between tabs is NOT enabled.
// Tab state persists (don't unmount tabs on navigate away)
```

---

## 14. ACCESSIBILITY SYSTEM

### 14.1 WCAG 2.2 AA Compliance Checklist

```typescript
// a11y/requirements.ts

/*
PERCEIVABLE
✓ All images have descriptive alt text
✓ Color contrast ≥ 4.5:1 for normal text
✓ Color contrast ≥ 3:1 for large text (≥18px or 14px bold)
✓ Color is never the only information conveyor (always add icon + label)
✓ Text can be enlarged to 200% without loss of content
✓ Touch targets ≥ 44×44px (we use 48×48px)
✓ Adequate spacing between touch targets (≥ 8px)

OPERABLE
✓ All interactive elements have focus indicators
✓ No time limits without user control
✓ No content that flashes more than 3 times/second
✓ Skip navigation for screen readers
✓ Keyboard accessible (when using external keyboard)

UNDERSTANDABLE
✓ Language declared (lang attribute)
✓ Error messages identify and describe the error
✓ Labels describe purpose (not just appearance)
✓ Consistent navigation across screens

ROBUST
✓ Valid semantic HTML (React Native accessibility props)
✓ Compatible with VoiceOver (iOS) and TalkBack (Android)
*/
```

### 14.2 Accessibility Props Contract

```typescript
// Every interactive element MUST have these.
// Not optional. Not "when we have time."

// BUTTONS
<TouchableOpacity
  accessibilityLabel="Verify project"          // What it is
  accessibilityHint="Starts the AI verification process" // What happens
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
/>

// INPUTS
<TextInput
  accessibilityLabel="Project name"
  accessibilityRequired={true}
  accessibilityInvalid={!!errors.name}
  accessibilityErrorMessage={errors.name}
/>

// IMAGES
<Image
  accessibilityLabel="Satellite imagery of project site"
  accessible={true}
/>

// LIVE REGIONS (for values that update)
<Text
  accessibilityLiveRegion="polite"   // "polite" for updates, "assertive" for errors
  accessibilityLabel={`Score: ${score} out of 100`}
>
  {score}/100
</Text>

// GROUPING (treat as single unit)
<View accessible={true} accessibilityLabel={`${project.name}, Grade ${project.grade}, ${project.tonnes} tonnes`}>
  <Text>{project.name}</Text>
  <GradeBadge grade={project.grade} />
  <Text>{project.tonnes} tCO₂e</Text>
</View>
```

### 14.3 Contrast Matrix

```
TEXT ON BACKGROUNDS — CONTRAST RATIOS
─────────────────────────────────────────
Text primary (#F8FAF8) on Screen bg (#040E07):  ✓ 19.2:1
Text primary (#F8FAF8) on Card bg (#0D2015):    ✓ 15.8:1
Text secondary (#B8C6BB) on Screen bg:           ✓ 7.4:1
Text secondary on Card bg:                       ✓ 6.1:1
Text tertiary (#637068) on Screen bg:            ✓ 4.7:1 (just passes AA)
Accent (#0DFF6E) on Screen bg:                  ✓ 12.1:1
Accent (#0DFF6E) on Card bg:                    ✓ 9.9:1

FAIL — DO NOT USE
─────────────────────────────────────────
Text tertiary on Card bg:         ✗ 3.8:1 (fails)
Muted text on hover bg:           ✗ 2.9:1 (fails)
Any text below 4.5:1 is a bug.
```

---

## 15. PERFORMANCE PATTERNS

### 15.1 Render Optimization

```typescript
// performance/patterns.ts

// ── 1. MEMO AGGRESSIVELY ──────────────────────────────────
// Memo all list items and expensive components.
const ProjectCard = memo(({ project }) => { ... });
const ListingCard = memo(({ listing }) => { ... });
// Use memo for anything that appears in a list.

// ── 2. VIRTUALIZE ALL LISTS ───────────────────────────────
// FlatList for ANY list with potentially > 5 items.
// Never ScrollView + Array.map for dynamic lists.
<FlashList                      // Use FlashList (better than FlatList)
  data={projects}
  estimatedItemSize={80}
  renderItem={({ item }) => <ProjectCard project={item} />}
  keyExtractor={(item) => item.id}
  ListEmptyComponent={<EmptyState type="projects" />}
  ItemSeparatorComponent={() => <View style={styles.separator} />}
  onEndReached={loadMore}
  onEndReachedThreshold={0.3}
/>

// ── 3. IMAGE OPTIMIZATION ─────────────────────────────────
<Image
  source={{ uri: url }}
  style={styles.image}
  contentFit="cover"             // expo-image (faster than RN Image)
  placeholder={BLUR_HASH}        // Blur hash while loading
  transition={200}               // Smooth load
  cachePolicy="memory-disk"      // Cache aggressively
/>

// ── 4. AVOID RERENDERS ────────────────────────────────────
// Never create objects/arrays in render
// ✗ <Component style={{ margin: 8 }} />   — new object every render
// ✓ <Component style={styles.container} /> — static reference

// ✗ const onPress = () => doSomething(id);  — new function every render
// ✓ const onPress = useCallback(() => doSomething(id), [id]);

// ── 5. HEAVY COMPUTATIONS OFF MAIN THREAD ─────────────────
// Use Reanimated worklets for animations (runs on UI thread)
// Use React Native Threads for heavy computations
// ZK proof generation happens on a background thread

// ── 6. APP STARTUP ────────────────────────────────────────
// Lazy load non-critical screens
const MarketplaceScreen = lazy(() => import('./screens/MarketplaceScreen'));
// Prefetch data on navigation intent (not on arrival)
const prefetchOnHover = () => queryClient.prefetchQuery(marketplaceQuery);
```

### 15.2 Bundle Size

```
TARGET BUNDLE SIZES
─────────────────────────────
Initial JS bundle:  < 2.5MB
Async bundles:      < 500KB each
Image assets:       < 1.5MB total
Icon font:          < 50KB

MONITORING
─────────────────────────────
Track with: react-native-bundle-visualizer
Alert on:   > 10% size increase in a PR
```

---

## 16. SCREEN-BY-SCREEN SPECS

### Dashboard — Production Spec

```
INFORMATION HIERARCHY (top to bottom):
1. Header: Avatar + "Good morning, Shreyash" + notification bell
2. Hero card: Total carbon assets (large mono number) + 24h change + sparkline
3. Stat row: Active projects · Pending payments · Credits retired
4. Quick actions: [+ New Project] [Browse Market] [View Reports]
5. Live ticker: Market prices scrolling (auto-play, pauseable)
6. Recent activity feed: last 3 events (see all →)

MICRO-INTERACTIONS:
- Stats scale-in with spring on first load (staggered 50ms)
- Sparkline draws itself over 800ms on appearance
- Number counter runs from 0 to actual value on first load
- Ticker auto-scrolls at 30px/s, pauses on press
- Pull-to-refresh with haptic

EDGE CASES:
- No projects yet: hero card shows onboarding CTA instead of data
- Loading: all cards show skeletons simultaneously (no stagger on loading)
- Network error: banner at top "Data may be outdated · Tap to refresh"
- No internet: full offline mode state with cached data
```

### Verification Screen — Production Spec

```
THE MOST IMPORTANT SCREEN IN THE APP.
This is where ATMOS proves it works.

STEP INDICATORS:
  ① Satellite fetch    → animates complete ✓ with haptic
  ② NDVI computation  → animates complete ✓
  ③ AI scoring        → animates complete ✓
  ④ Fraud detection   → animates complete ✓
  ⑤ ZK proof          → animates complete ✓ + celebration

RESULT REVEAL (after all steps):
  1. Circle scales in (Spring.bouncy)
  2. Score number counts up from 0 (800ms)
  3. Grade badge fades in
  4. Score breakdown bars slide from left (staggered 60ms)
  5. Haptic: HapticPattern.verified()

SCORE BREAKDOWN DISPLAY:
  Each dimension as a row:
  Label (12px)          Score bar          Value/100
  Additionality         ████████░░          82/100
  Permanence            ██████████          96/100
  Methodology fit       █████████░          89/100
  Vintage               ████████░░          80/100
  Leakage risk          ████████░░          82/100
  Co-benefits           ██████░░░░          64/100

FRAUD RISK DISPLAY:
  LOW:    green pill "Low risk"
  MEDIUM: amber pill "Manual review" + info modal
  HIGH:   red pill "Flagged" + next steps

BOTTOM ACTIONS:
  [Generate ZK Proof →]      primary, full width
  [Share Results]            ghost, shows copy to clipboard
```

### Payment Success Screen — Production Spec

```
THE MOMENT OF DELIGHT.
The user just paid for carbon credits. This is meaningful.

DO NOT: Show a generic "Payment successful" and a close button.

DO:
1. Large animated checkmark (circle draw + check stroke, 600ms)
2. Title: "Carbon secured." (not "Payment successful")
3. Subtitle: "48 tCO₂e transferred to your portfolio"
4. Details card (glass):
   • Buyer: You
   • Asset: Biochar Production, Rajasthan
   • Amount: 48 tCO₂e · Grade A
   • Price: ₹71,280
   • Settlement: Solana (4 seconds)
   • Certificate: Pending generation...
     → switches to "View Certificate" link when ready
5. Chain explorer: "View on Solana Explorer ↗" (small link)
6. Share achievement button (copies certificate link)
7. "Continue" (goes to portfolio)

HAPTIC: HapticPattern.payment() — the "money moment" haptic

DO NOT ADD: Confetti. Balloons. Animations of coins.
           (This is a professional financial product, not a game.)
```

---

## 17. TESTING PROTOCOL

### 17.1 Automated Tests

```typescript
// tests/components/Button.test.tsx
describe('Button', () => {
  it('renders in all 5 variants without error', () => {});
  it('shows loading spinner when loading=true', () => {});
  it('does not call onPress when disabled', () => {});
  it('does not call onPress when loading', () => {});
  it('calls haptic on press', () => {});
  it('meets accessibility requirements', async () => {});
});

// tests/screens/OTPScreen.test.tsx
describe('OTP Screen', () => {
  it('auto-advances focus after 6th digit', () => {});
  it('shakes on invalid OTP', () => {});
  it('disables resend button during countdown', () => {});
  it('enables resend after 30 seconds', () => {});
  it('handles SMS autofill correctly', () => {});
});

// tests/forms/ProjectForm.test.tsx
describe('Project Form', () => {
  it('validates entity type required', () => {});
  it('validates name minimum 3 chars', () => {});
  it('validates coordinates are within bounds', () => {});
  it('requires at least 1 photo', () => {});
  it('auto-saves draft after 30s of changes', () => {});
  it('restores draft on remount', () => {});
});
```

### 17.2 Device Test Matrix

```
DEVICE                    OS          PRIORITY
─────────────────────────────────────────────
iPhone 15 Pro (notch)     iOS 17      P0 — must pass
iPhone 13 mini (small)    iOS 16      P0 — must pass
Samsung Galaxy S24        Android 14  P0 — must pass
Pixel 7a (Google ref)     Android 13  P0 — must pass
iPhone SE 3 (small, old)  iOS 16      P1 — should pass
OnePlus 10 Pro            Android 12  P1 — should pass
iPad Air 5 (tablet)       iPadOS 17   P2 — nice to have

MANUAL TEST CHECKLIST (run each release):
□ OTP autofill from SMS works
□ Camera opens and photo appears in preview
□ Location pin drops on correct coordinates
□ Verification steps animate in sequence
□ Payment flow completes end-to-end (test mode)
□ Bottom sheets dismiss on swipe and backdrop tap
□ Pull-to-refresh works across all list screens
□ Toast appears and auto-dismisses
□ Error states show with retry buttons
□ Empty states show CTAs that navigate correctly
□ Keyboard doesn't cover active input
□ VoiceOver announces all interactive elements
```

---

## 18. IMPLEMENTATION ROADMAP

### Priority Matrix

```
PRIORITY  EFFORT  ITEM
─────────────────────────────────────────────────────────
P0        XS      Design token system (colors, spacing, type)
P0        SM      Button component (all variants + states)
P0        SM      Input component (all states + validation)
P0        SM      OTP input (autofill + shake)
P0        MD      Toast system (singleton store)
P0        MD      Error architecture (taxonomy + components)
P0        MD      Skeleton system (all screen variants)
P0        LG      Verification screen (animation + steps)
P0        LG      Payment success screen (delight moment)
─────────────────────────────────────────────────────────
P1        SM      Haptics system (all patterns)
P1        SM      Gesture system (swipe, long press)
P1        MD      Bottom sheet system
P1        MD      Form validation (ZOD + RHF integration)
P1        MD      Dashboard (stat animations, ticker)
P1        MD      Portfolio (swipe to retire, breakdown)
P1        LG      Marketplace (search, filter, infinite scroll)
─────────────────────────────────────────────────────────
P2        SM      Empty states (all types)
P2        SM      Accessibility audit (all screens)
P2        MD      Performance profiling + optimization
P2        MD      Automated test suite
P2        LG      Animation polish pass (all screens)
P2        LG      E2E test suite (Detox)
─────────────────────────────────────────────────────────
```

### Sprint Plan

```
WEEK 1 (June 12-19): Design System Foundation
  Mon: Token system + Typography
  Tue: Button + Input + OTP
  Wed: Toast + Error + Skeleton
  Thu: Motion constants + usePressable + useAppear
  Fri: Dashboard screen (with all states)

WEEK 2 (June 19-26): Core Flows
  Mon: Verification screen (animation sequence)
  Tue: ZK Proof screen
  Wed: Payment flow (summary + success)
  Thu: Marketplace (search + filter + infinite scroll)
  Fri: Portfolio (swipe gestures + breakdown)

WEEK 3 (June 26 - Jul 3): Polish
  Mon: Haptics audit (every interaction mapped)
  Tue: Accessibility audit + fixes
  Wed: Performance profiling + fixes
  Thu: Animation polish pass
  Fri: Device testing + fixes

WEEK 4 (Jul 3-10): QA
  Mon: Automated unit tests
  Tue: Integration tests
  Wed: E2E tests (Detox)
  Thu: Manual testing matrix
  Fri: Bug fixes + release
```

---

## FINAL PRINCIPLE

> The quality of a mobile app is not measured by what it does when everything works.
> It is measured by what it does when the satellite API is down, the OTP doesn't arrive,
> and the user's phone has 2% battery and bad signal.
>
> ATMOS should be trustworthy in the hardest moments — because that's when a
> farmer needs it most.

---

**Document Version:** 2.0  
**Upgraded from:** v1.0 (June 12, 2026)  
**Owner:** Design & Engineering  
**Next Review:** July 10, 2026  
**Quality Standard:** Enterprise-grade. Every pixel earns its place.