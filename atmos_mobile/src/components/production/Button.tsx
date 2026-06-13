/**
 * ATMOS Button Component
 * Production-grade button with 6 states: default, pressed, loading, disabled, success, error
 * Follows enterprise design specifications
 */

import React, { useEffect, useState } from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Tokens as T, ComponentTokens as C } from '../../tokens';
import { Spring, Duration } from '../../motion/constants';
import { HapticPattern } from '../../haptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonState = 'default' | 'pressed' | 'loading' | 'disabled' | 'success' | 'error';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode; // Left icon
  trailingIcon?: React.ReactNode; // Right icon (for "Next →")
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: keyof typeof HapticPattern;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  // Advanced: Manual state control for success/error animations
  showSuccess?: boolean;
  showError?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = 'tap',
  accessibilityLabel,
  accessibilityHint,
  style,
  showSuccess = false,
  showError = false,
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(1);
  const shakeX = useSharedValue(0);

  // Determine current state
  const getCurrentState = (): ButtonState => {
    if (disabled) return 'disabled';
    if (loading) return 'loading';
    if (showSuccess) return 'success';
    if (showError) return 'error';
    return 'default';
  };

  const currentState = getCurrentState();

  // Variant styles
  const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    primary: {
      container: {
        backgroundColor: T.interactive.primary,
        borderWidth: 0,
      },
      text: {
        color: T.text.inverse,
      },
    },
    secondary: {
      container: {
        backgroundColor: T.interactive.secondary,
        borderWidth: 1,
        borderColor: T.border.accent,
      },
      text: {
        color: T.text.accent,
      },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      text: {
        color: T.text.secondary,
      },
    },
    danger: {
      container: {
        backgroundColor: T.interactive.danger,
        borderWidth: 0,
      },
      text: {
        color: T.text.primary,
      },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: T.border.default,
      },
      text: {
        color: T.text.secondary,
      },
    },
  };

  // Success animation
  useEffect(() => {
    if (showSuccess) {
      bgOpacity.value = withSequence(
        withTiming(0.7, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [showSuccess]);

  // Error animation (shake)
  useEffect(() => {
    if (showError) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-7, { duration: 50 }),
        withTiming(7, { duration: 50 }),
        withTiming(-4, { duration: 40 }),
        withSpring(0, Spring.rigid)
      );
    }
  }, [showError]);

  // Press handlers
  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, Spring.snappy);
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1, Spring.snappy);
  };

  const handlePress = async () => {
    if (disabled || loading) return;
    if (haptic && HapticPattern[haptic]) {
      await HapticPattern[haptic]();
    }
    onPress();
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shakeX.value }],
    opacity: bgOpacity.value,
  }));

  const heights = C.button.height;
  const paddingX = C.button.paddingX;
  const fontSize = C.button.font;

  const containerStyle: ViewStyle = {
    height: heights[size],
    paddingHorizontal: paddingX[size],
    borderRadius: C.button.radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...variantStyles[variant].container,
    ...(disabled || loading ? { opacity: 0.4 } : {}),
    ...(fullWidth ? { width: '100%' } : {}),
  };

  const textStyle: TextStyle = {
    fontSize: fontSize[size],
    fontWeight: C.button.fontWeight as any,
    ...variantStyles[variant].text,
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      style={[animatedStyle, containerStyle, style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles[variant].text.color}
        />
      ) : (
        <>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={textStyle}>{label}</Text>
          {trailingIcon && <View style={styles.iconRight}>{trailingIcon}</View>}
        </>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
