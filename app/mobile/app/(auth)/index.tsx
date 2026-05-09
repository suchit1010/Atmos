import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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
import { useAuth } from "@/context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
];

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { loginWithGoogle, loginWithApple } = useAuth();
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

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

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      console.warn("Google login error:", e);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleAppleLogin() {
    setAppleLoading(true);
    try {
      await loginWithApple();
    } catch (e) {
      console.warn("Apple login error:", e);
    } finally {
      setAppleLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ImageBackground
        source={require("@/assets/images/splash_bg.png")}
        style={styles.splashBg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.18)", "rgba(12,30,12,0.7)", colors.background]}
          style={styles.splashGradient}
        />
        <View style={[styles.logoSection, { paddingTop: insets.top + 32 }]}>
          <View style={[styles.heroBadge, { borderColor: colors.primary + "55", backgroundColor: "rgba(0,0,0,0.28)" }]}>
            <Feather name="shield" size={12} color={colors.primary} />
            <Text style={styles.heroBadgeText}>Climate finance rails</Text>
          </View>

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

          <View style={styles.heroStatsRow}>
            <View style={[styles.heroStatPill, { borderColor: colors.primary + "44" }]}>
              <Text style={[styles.heroStatValue, { color: colors.primary }]}>AI + Sat</Text>
              <Text style={styles.heroStatLabel}>Verification</Text>
            </View>
            <View style={[styles.heroStatPill, { borderColor: colors.secondary + "44" }]}>
              <Text style={[styles.heroStatValue, { color: colors.secondary }]}>ZK</Text>
              <Text style={styles.heroStatLabel}>Privacy</Text>
            </View>
            <View style={[styles.heroStatPill, { borderColor: colors.mutedForeground + "44" }]}>
              <Text style={[styles.heroStatValue, { color: colors.foreground }]}>24h</Text>
              <Text style={styles.heroStatLabel}>Settlement</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.workflowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.workflowHeader}>
              <Feather name="layers" size={14} color={colors.primary} />
              <Text style={[styles.workflowTitle, { color: colors.foreground }]}>Your flow</Text>
            </View>
            <View style={styles.workflowRow}>
              <WorkflowStep index="1" label="Sign in" desc="Phone, Google, or Apple" colors={colors} />
              <WorkflowStep index="2" label="Capture" desc="Project + land data" colors={colors} />
              <WorkflowStep index="3" label="Verify" desc="AI, satellite, ZK" colors={colors} />
              <WorkflowStep index="4" label="Settle" desc="Payment + asset" colors={colors} />
            </View>
          </View>

          <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
            Welcome to ATMOS
          </Text>
          <Text style={[styles.welcomeSub, { color: colors.mutedForeground }]}>
            Sign in to continue
          </Text>

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
            <SocialButton
              icon="mail"
              label={googleLoading ? "Signing in..." : "Continue with Google"}
              onPress={handleGoogleLogin}
              loading={googleLoading}
              colors={colors}
              accentColor={colors.secondary}
            />
            <SocialButton
              icon="smartphone"
              label={appleLoading ? "Signing in..." : "Continue with Apple"}
              onPress={handleAppleLogin}
              loading={appleLoading}
              colors={colors}
              accentColor={colors.mutedForeground}
            />
          </View>

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            No passwords. No KYC friction.{"\n"}Privacy by design.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SocialButton({
  icon,
  label,
  onPress,
  loading,
  colors,
  accentColor,
}: {
  icon: "mail" | "smartphone";
  label: string;
  onPress: () => void;
  loading: boolean;
  colors: ReturnType<typeof useColors>;
  accentColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.socialBtn,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed || loading ? 0.7 : 1,
        },
      ]}
    >
      <Feather name={loading ? "loader" : icon} size={16} color={accentColor} />
      <Text style={[styles.socialLabel, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

function WorkflowStep({
  index,
  label,
  desc,
  colors,
}: {
  index: string;
  label: string;
  desc: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.workflowStep, { borderColor: colors.border }]}>
      <View style={[styles.workflowIndex, { backgroundColor: colors.muted }]}>
        <Text style={[styles.workflowIndexText, { color: colors.foreground }]}>{index}</Text>
      </View>
      <Text style={[styles.workflowLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.workflowDesc, { color: colors.mutedForeground }]}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splashBg: {
    height: 360,
    width: "100%",
  },
  splashGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  logoSection: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 0.4,
    color: "#F4FBEF",
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  heroStatPill: {
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  heroStatValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  heroStatLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#8BAA8B",
    marginTop: 2,
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
    marginTop: -40,
  },
  formContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  workflowCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 4,
  },
  workflowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  workflowTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  workflowRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  workflowStep: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  workflowIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  workflowIndexText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  workflowLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  workflowDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
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
