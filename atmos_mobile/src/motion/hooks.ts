/**
 * ATMOS Reusable Animation Hooks
 * Built with react-native-reanimated for 60fps performance
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  useAnimatedStyle,
  useDerivedValue,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Spring, Duration, Ease } from './constants';

// ── APPEAR ON MOUNT ───────────────────────────────────────
export const useAppear = (delay = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: Duration.slow, easing: Ease.out });
      translateY.value = withSpring(0, Spring.smooth);
      scale.value = withSpring(1, Spring.snappy);
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
    onPressIn: () => {
      scale.value = withSpring(0.95, Spring.snappy);
    },
    onPressOut: () => {
      scale.value = withSpring(1, Spring.snappy);
    },
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
      withTiming(10, { duration: 60 }),
      withTiming(-7, { duration: 50 }),
      withTiming(7, { duration: 50 }),
      withTiming(-4, { duration: 40 }),
      withSpring(0, Spring.rigid)
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

// ── FADE IN/OUT ───────────────────────────────────────────
export const useFade = (visible: boolean, duration = Duration.normal) => {
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration,
      easing: Ease.inOut,
    });
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return style;
};

// ── ROTATE SPINNER ────────────────────────────────────────
export const useRotate = () => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(360, Spring.smooth);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return style;
};
