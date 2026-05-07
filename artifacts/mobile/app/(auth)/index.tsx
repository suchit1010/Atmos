import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { AtmosButton } from "@/components/AtmosButton";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
];

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleContinue() {
    if (phone.length < 7) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push({
        pathname: "/(auth)/otp",
        params: { phone: selectedCountry.code + phone },
      });
    }, 800);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>ATMOS</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Private. Verifiable. Instant. Global.
          </Text>
          <View style={styles.pillRow}>
            {["AI Verified", "ZK Privacy", "Solana"].map((t) => (
              <View key={t} style={[styles.pill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.pillText, { color: colors.primary }]}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.form}>
          <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>Welcome to ATMOS</Text>
          <Text style={[styles.welcomeSub, { color: colors.mutedForeground }]}>Sign in to continue</Text>

          <View style={[styles.phoneRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.countryBtn}
              onPress={() => setShowCountryPicker(!showCountryPicker)}
            >
              <Text style={styles.flag}>{selectedCountry.flag}</Text>
              <Text style={[styles.code, { color: colors.foreground }]}>{selectedCountry.code}</Text>
              <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TextInput
              style={[styles.phoneInput, { color: colors.foreground }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="98765 43210"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              maxLength={12}
            />
          </View>

          {showCountryPicker && (
            <View style={[styles.countryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {COUNTRY_CODES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(c);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.flag}>{c.flag}</Text>
                  <Text style={[styles.countryName, { color: colors.foreground }]}>{c.name}</Text>
                  <Text style={[styles.code, { color: colors.mutedForeground }]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <AtmosButton
            label="Continue with Phone"
            onPress={handleContinue}
            loading={loading}
            disabled={phone.length < 7}
            style={{ marginTop: 8 }}
          />

          <View style={styles.orRow}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>or continue with</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.socialRow}>
            {[
              { icon: "mail", label: "Google" },
              { icon: "smartphone", label: "Apple" },
            ].map((s) => (
              <TouchableOpacity
                key={s.label}
                style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push("/(auth)/otp" as any)}
              >
                <Feather name={s.icon as any} size={18} color={colors.foreground} />
                <Text style={[styles.socialLabel, { color: colors.foreground }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            No passwords. No KYC friction.{"\n"}Privacy by design.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 32,
  },
  logoSection: {
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 60,
    height: 60,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  form: {
    gap: 12,
  },
  welcomeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  welcomeSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    height: 52,
    overflow: "hidden",
  },
  countryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
  },
  flag: {
    fontSize: 20,
  },
  code: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  divider: {
    width: 1,
    height: "60%",
    marginHorizontal: 4,
  },
  phoneInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    paddingHorizontal: 8,
  },
  countryDropdown: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  countryName: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    flex: 1,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  line: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  socialRow: {
    flexDirection: "row",
    gap: 10,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  socialLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  disclaimer: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
});
