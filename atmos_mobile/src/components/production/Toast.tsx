import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const TOAST_COLORS: Record<ToastType, { bg: string; text: string; border: string }> = {
  success: { bg: Colors.successDim, text: Colors.success, border: Colors.success },
  error: { bg: Colors.errorDim, text: Colors.error, border: Colors.error },
  warning: { bg: Colors.warningDim, text: Colors.warning, border: Colors.warning },
  info: { bg: Colors.infoDim, text: Colors.info, border: Colors.info },
};

/**
 * Production-ready Toast notification component
 * Auto-hides after duration, customizable types and positions
 */
export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const colors = TOAST_COLORS[type];

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onHide?.());
      }, duration);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-100);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: colors.bg,
            borderLeftColor: colors.border,
          },
        ]}
      >
        <Text style={{ fontSize: 16, marginRight: Spacing.sm, color: colors.text }}>
          {TOAST_ICONS[type]}
        </Text>
        <Text style={[Typography.bodySm, { color: Colors.text, flex: 1 }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    backgroundColor: Colors.bgCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
