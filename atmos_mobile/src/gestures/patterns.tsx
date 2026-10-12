/**
 * ATMOS Gesture Patterns
 * Advanced gesture handling with react-native-gesture-handler
 */

import React, { useState, useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Spring } from '../motion/constants';
import { HapticPattern } from '../haptics';

// ── SWIPE TO DELETE/RETIRE ─────────────────────────────────
// For Portfolio holdings list
interface SwipeToActionProps {
  onDelete?: () => void;
  onList?: () => void;
  children: React.ReactNode;
}

export const SwipeToAction: React.FC<SwipeToActionProps> = ({ onDelete, onList, children }) => {
  const translateX = useSharedValue(0);
  const THRESHOLD = -80;

  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow left swipe
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX < THRESHOLD) {
        // Reveal action buttons
        translateX.value = withSpring(-160, Spring.smooth);
        runOnJS(HapticPattern.longPress)();
      } else {
        // Snap back
        translateX.value = withSpring(0, Spring.snappy);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
};

// ── LONG PRESS FOR CONTEXT MENU ───────────────────────────
export interface MenuItem {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
}

export const useLongPressMenu = (options: MenuItem[]) => {
  const [visible, setVisible] = useState(false);

  const gesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      runOnJS(HapticPattern.longPress)();
      runOnJS(setVisible)(true);
    });

  return { gesture, visible, setVisible, options };
};

// ── PINCH TO ZOOM (for satellite imagery) ─────────────────
export const useMapGesture = () => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Clamp between 0.8x and 4x
      if (scale.value < 0.8) scale.value = withSpring(0.8, Spring.snappy);
      if (scale.value > 4) scale.value = withSpring(4, Spring.snappy);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { pinch, scale, animatedStyle };
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return { pan, translateY: animatedStyle, refreshing };
};
