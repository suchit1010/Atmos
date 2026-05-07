import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { AtmosButton } from "@/components/AtmosButton";
import { Feather } from "@expo/vector-icons";

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState("");
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function handleOTPChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newOtp.every((d) => d !== "")) {
      verifyOtp(newOtp.join(""));
    }
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }

  async function verifyOtp(code: string) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    if (code === "000000" || code.length === 6) {
      await login(phone ?? "");
      router.replace("/(tabs)/");
    } else {
      shake();
      setError("Invalid OTP. Try 000000 for demo.");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
  }

  function resend() {
    setCountdown(30);
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, { backgroundColor: colors.card, borderColor: colors.primary, transform: [{ scale: pulseAnim }] }]}>
          <Feather name="shield" size={32} color={colors.primary} />
        </Animated.View>

        <Text style={[styles.title, { color: colors.foreground }]}>Verify your number</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter the 6-digit code sent to{"\n"}
          <Text style={{ color: colors.foreground }}>{phone}</Text>
        </Text>
        <Text style={[styles.demoHint, { color: colors.primary }]}>Demo: enter any 6 digits</Text>

        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array(OTP_LENGTH).fill(null).map((_, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputRefs.current[i] = r; }}
              style={[
                styles.otpInput,
                {
                  backgroundColor: colors.card,
                  borderColor: otp[i] ? colors.primary : colors.border,
                  color: colors.foreground,
                },
              ]}
              value={otp[i]}
              onChangeText={(v) => handleOTPChange(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              autoFocus={i === 0}
            />
          ))}
        </Animated.View>

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        ) : null}

        <AtmosButton
          label="Verify OTP"
          onPress={() => verifyOtp(otp.join(""))}
          loading={loading}
          disabled={otp.some((d) => !d)}
        />

        <TouchableOpacity onPress={countdown === 0 ? resend : undefined} disabled={countdown > 0}>
          <Text style={[styles.resend, { color: countdown > 0 ? colors.mutedForeground : colors.primary }]}>
            {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  demoHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 8,
  },
  otpInput: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  error: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
  resend: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginTop: 8,
  },
});
