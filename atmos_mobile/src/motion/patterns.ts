/**
 * ATMOS Specific Animation Patterns
 * Complex animations for specific use cases
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
} from 'react-native-reanimated';
import { Spring, Duration } from './constants';

// ── VERIFIED CELEBRATION ──────────────────────────────────
// Used on: Verification complete, Minting complete, Payment success
export const useVerifiedAnimation = () => {
  const scale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const trigger = () => {
    // 1. Circle pops in
    scale.value = withSequence(
      withSpring(1.2, Spring.bouncy),
      withSpring(1.0, Spring.snappy)
    );
    // 2. Check fades in
    checkOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    // 3. Glow pulses
    glowOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(1, { duration: 400 }),
        withRepeat(withTiming(0.4, { duration: 1200 }), -1, true)
      )
    );
  };

  return { scale, checkOpacity, glowOpacity, trigger };
};

// ── STEP PROGRESSION ──────────────────────────────────────
// Used on: Verification steps, ZK proof steps
export const StepTransition = {
  exitStep: (direction: 'left' | 'right' = 'left') => ({
    opacity: withTiming(0, { duration: 180 }),
    translateX: withTiming(direction === 'left' ? -20 : 20, { duration: 200 }),
  }),
  enterStep: () => ({
    opacity: withDelay(200, withTiming(1, { duration: 250 })),
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
      easing: (t) => t, // Linear easing for counter
    });
  }, [value]);

  return displayed;
};

// ── PULSE EFFECT ──────────────────────────────────────────
// For live indicators (ticker, notifications)
export const usePulse = (active: boolean) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(withSpring(1.15, Spring.snappy), withSpring(1, Spring.snappy)),
        -1,
        false
      );
    } else {
      scale.value = withSpring(1, Spring.snappy);
    }
  }, [active]);

  return scale;
};

// ── LOADING SHIMMER ───────────────────────────────────────
// For skeleton loaders
export const useShimmer = () => {
  const translateX = useSharedValue(-100);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(100, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  return translateX;
};
