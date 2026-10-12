/**
 * ATMOS Input Component
 * Production-grade input with 7 states: empty, focused, filled, error, disabled, loading, success
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Tokens as T, ComponentTokens as C } from '../../tokens';
import { Duration } from '../../motion/constants';

type InputState = 'empty' | 'focused' | 'filled' | 'error' | 'disabled' | 'loading' | 'success';

interface InputComponentProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputComponentProps> = ({
  label,
  error,
  success,
  hint,
  rightElement,
  leftElement,
  loading = false,
  disabled = false,
  value = '',
  onFocus,
  onBlur,
  containerStyle,
  inputStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Animation value for border color transition
  const focusAnim = useSharedValue(0);

  // Determine current state
  const getCurrentState = (): InputState => {
    if (disabled) return 'disabled';
    if (loading) return 'loading';
    if (error) return 'error';
    if (success) return 'success';
    if (isFocused) return 'focused';
    if (value && value.length > 0) return 'filled';
    return 'empty';
  };

  const currentState = getCurrentState();

  // Border color based on state
  const getBorderColor = (): string => {
    switch (currentState) {
      case 'error':
        return T.border.error;
      case 'success':
        return T.text.success;
      case 'focused':
        return T.border.focus;
      case 'disabled':
        return T.border.subtle;
      default:
        return T.border.default;
    }
  };

  // Handle focus
  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: Duration.fast });
    onFocus?.(e);
  };

  // Handle blur
  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: Duration.fast });
    onBlur?.(e);
  };

  // Animated border style
  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [T.border.default, T.border.focus]
    ),
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error ? T.text.error : T.text.secondary,
              fontSize: C.input.labelSize,
              fontWeight: C.input.labelWeight as any,
            },
          ]}
        >
          {label}
        </Text>
      )}

      {/* Input Container */}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: disabled ? T.border.subtle : T.bg.input,
            opacity: disabled ? 0.5 : 1,
          },
          !error && !success && animatedBorderStyle,
        ]}
      >
        {/* Left Element */}
        {leftElement && <View style={styles.leftElement}>{leftElement}</View>}

        {/* Text Input */}
        <TextInput
          {...textInputProps}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled && !loading}
          style={[
            styles.input,
            {
              color: T.text.primary,
              fontSize: C.input.fontSize,
            },
            inputStyle,
          ]}
          placeholderTextColor={T.text.tertiary}
        />

        {/* Right Element / Loading / Success */}
        {loading && (
          <View style={styles.rightElement}>
            <ActivityIndicator size="small" color={T.text.accent} />
          </View>
        )}
        {!loading && success && !rightElement && (
          <View style={styles.rightElement}>
            <Text style={{ color: T.text.success, fontSize: 16 }}>✓</Text>
          </View>
        )}
        {!loading && rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </Animated.View>

      {/* Error / Success / Hint Message */}
      {error && (
        <Text
          style={[
            styles.helperText,
            {
              color: T.text.error,
              fontSize: C.input.errorSize,
            },
          ]}
        >
          {error}
        </Text>
      )}
      {!error && success && (
        <Text
          style={[
            styles.helperText,
            {
              color: T.text.success,
              fontSize: C.input.errorSize,
            },
          ]}
        >
          {success}
        </Text>
      )}
      {!error && !success && hint && (
        <Text
          style={[
            styles.helperText,
            {
              color: T.text.tertiary,
              fontSize: C.input.errorSize,
            },
          ]}
        >
          {hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: C.input.height,
    paddingHorizontal: C.input.paddingX,
    borderRadius: C.input.radius,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 0, // Remove default padding
  },
  leftElement: {
    marginRight: 8,
  },
  rightElement: {
    marginLeft: 8,
  },
  helperText: {
    marginTop: 4,
  },
});
