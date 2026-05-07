import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { AtmosButton } from "@/components/AtmosButton";
import { LinearGradient } from "expo-linear-gradient";

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
        params: { phone: selectedCountry.code + " " + phone },
      });
    }, 800);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Splash hero with forest background */}
      <ImageBackground
        source={require("@/assets/images/splash_bg.png")}
        style={styles.splashBg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["transparent", "rgba(12,30,12,0.7)", colors.background]}
          style={styles.splashGradient}
        />
        <View style={[styles.logoSection, { paddingTop: insets.top + 40 }]}>
          <View style={[styles.logoRing, { borderColor: colors.primary }]}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>ATMOS</Text>
          <Text style={styles.appSub}>Protocol</Text>
          <Text style={styles.tagline}>Private. Verifiable. Instant. Global.</Text>
          <Text style={styles.tagline2}>Real-world climate action → Carbon assets in 24 hours</Text>
        </View>
      </ImageBackground>

      {/* Auth form */}
      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
            Welcome to ATMOS
          </Text>
          <Text style={[styles.welcomeSub, { color: colors.mutedForeground }]}>
            Sign in to continue
          </Text>

          {/* Phone input */}
          <View style={[styles.phoneRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.countryBtn}
              onPress={() => setShowCountryPicker(!showCountryPicker)}
            >
              <Text style={styles.flag}>{selectedCountry.flag}</Text>
              <Text style={[styles.codeText, { color: colors.foreground }]}>
                {selectedCountry.code}
              </Text>
              <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={[styles.phoneDivider, { backgroundColor: colors.border }]} />
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
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {COUNTRY_CODES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                  onPress={() => { setSelectedCountry(c); setShowCountryPicker(false); }}
                >
                  <Text style={styles.flag}>{c.flag}</Text>
                  <Text style={[styles.dropdownName, { color: colors.foreground }]}>{c.name}</Text>
                  <Text style={[styles.codeText, { color: colors.mutedForeground }]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <AtmosButton
            label="Continue with Phone"
            onPress={handleContinue}
            loading={loading}
            disabled={phone.length < 7}
          />

          <View style={styles.orRow}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>or continue with</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.socialRow}>
            {[
              { icon: "mail" as const, label: "Continue with Google" },
              { icon: "smartphone" as const, label: "Continue with Apple" },
            ].map((s) => (
              <TouchableOpacity
                key={s.label}
                style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push("/(auth)/otp" as any)}
              >
                <Feather name={s.icon} size={16} color={colors.foreground} />
                <Text style={[styles.socialLabel, { color: colors.foreground }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            No passwords. No KYC friction.{"\n"}Privacy by design.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  splashBg: {
    height: 320,
    width: "100%",
  },
  splashGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  logoSection: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 24,
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(12,30,12,0.8)",
    marginBottom: 8,
  },
  logo: {
    width: 56,
    height: 56,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: 6,
    color: "#FFFFFF",
  },
  appSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#8BAA8B",
    letterSpacing: 2,
    marginTop: -4,
  },
  tagline: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#FFFFFF",
    marginTop: 8,
  },
  tagline2: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#8BAA8B",
    textAlign: "center",
  },
  formWrapper: {
    flex: 1,
    marginTop: -32,
  },
  formContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  welcomeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginBottom: 2,
  },
  welcomeSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginBottom: 4,
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
    gap: 5,
    paddingHorizontal: 12,
  },
  flag: { fontSize: 20 },
  codeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  phoneDivider: {
    width: 1,
    height: "60%",
  },
  phoneInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    paddingHorizontal: 12,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownName: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    flex: 1,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  line: { flex: 1, height: 1 },
  orText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  socialRow: {
    gap: 10,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
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
    marginTop: 4,
  },
});
