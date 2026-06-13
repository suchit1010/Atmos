/**
 * ATMOS OTP Input Component
 * 6-digit OTP with SMS autofill, shake animation, and auto-focus
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Tokens as T, ComponentTokens as C } from '../../tokens';
import { Spring } from '../../motion/constants';
import { HapticPattern } from '../../haptics';

interface OTPInputProps {
  length?: number; // Default 6
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = true,
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const shakeX = useSharedValue(0);

  // Split value into array
  const digits = value.split('');

  // Trigger shake animation on error
  useEffect(() => {
    if (error) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-7, { duration: 50 }),
        withTiming(7, { duration: 50 }),
        withTiming(-4, { duration: 40 }),
        withSpring(0, Spring.rigid)
      );
      HapticPattern.error();
    }
  }, [error]);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  // Check if complete
  useEffect(() => {
    if (value.length === length && onComplete) {
      HapticPattern.success();
      onComplete(value);
    }
  }, [value, length, onComplete]);

  // Handle text change
  const handleChange = (text: string) => {
    // Only allow numbers
    const cleanText = text.replace(/[^0-9]/g, '');
    // Limit to length
    const limitedText = cleanText.slice(0, length);
    onChange(limitedText);

    // Haptic feedback on each digit
    if (limitedText.length > value.length) {
      HapticPattern.select();
    }
  };

  // Handle box press - focus input
  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  // Animated shake style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Get border color for box
  const getBoxBorderColor = (index: number): string => {
    if (error) return T.border.error;
    if (focused && index === digits.length) return T.border.focus;
    if (digits[index]) return T.border.accent;
    return T.border.default;
  };

  return (
    <View style={styles.container}>
      {/* Hidden TextInput for actual input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        autoComplete="sms-otp" // SMS autofill on iOS
        textContentType="oneTimeCode" // iOS autofill
        autoFocus={autoFocus}
        editable={!disabled}
        style={styles.hiddenInput}
        {...(Platform.OS === 'android' && { autoComplete: 'sms-otp' })} // Android autofill
      />

      {/* Visual boxes */}
      <Animated.View style={[styles.boxesContainer, animatedStyle]}>
        {Array.from({ length }).map((_, index) => (
          <Pressable
            key={index}
            onPress={handleBoxPress}
            style={[
              styles.box,
              {
                borderColor: getBoxBorderColor(index),
                borderWidth: C.otp.borderWidth,
                width: C.otp.boxSize,
                height: C.otp.boxSize,
                marginHorizontal: C.otp.boxGap / 2,
                backgroundColor: disabled ? T.bg.hover : T.bg.input,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            {digits[index] ? (
              <Text
                style={[
                  styles.digit,
                  {
                    fontSize: C.otp.fontSize,
                    color: error ? T.text.error : T.text.primary,
                  },
                ]}
              >
                {digits[index]}
              </Text>
            ) : (
              focused &&
              index === digits.length && (
                <View
                  style={[
                    styles.cursor,
                    { backgroundColor: T.border.focus },
                  ]}
                />
              )
            )}
          </Pressable>
        ))}
      </Animated.View>

      {/* Helper text for paste */}
      {focused && value.length === 0 && (
        <Text style={[styles.hint, { color: T.text.tertiary }]}>
          Tap to paste or enter OTP
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  box: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  cursor: {
    width: 2,
    height: 24,
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
  },
});
