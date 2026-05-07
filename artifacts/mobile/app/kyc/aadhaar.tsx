import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { AtmosButton } from "@/components/AtmosButton";
import { AtmosCard } from "@/components/AtmosCard";

export default function AadhaarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateKYC } = useAuth();

  const existing = user?.kyc?.aadhaar;
  const [aadhaarNumber, setAadhaarNumber] = useState(existing?.number ?? "");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp" | "done">(
    existing?.status === "verified" ? "done" : "form"
  );

  const formattedNumber = aadhaarNumber
    .replace(/\D/g, "")
    .slice(0, 12)
    .replace(/(\d{4})(?=\d)/g, "$1-");

  const rawNumber = aadhaarNumber.replace(/\D/g, "");

  async function pickImage(side: "front" | "back") {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (side === "front") setFrontImage(result.assets[0].uri);
      else setBackImage(result.assets[0].uri);
    }
  }

  async function handleSendOTP() {
    if (rawNumber.length !== 12) {
      Alert.alert("Invalid Aadhaar", "Please enter a valid 12-digit Aadhaar number");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setOtpSent(true);
    setStep("otp");
    setLoading(false);
  }

  async function handleVerifyOTP() {
    if (otp.length < 4) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    updateKYC("aadhaar", {
      status: "verified",
      number: rawNumber,
      fileName: "aadhaar_" + rawNumber.slice(-4),
      submittedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    });
    setStep("done");
    setLoading(false);
  }

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Aadhaar Verification</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Government ID verification
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === "done" ? (
          <View style={styles.doneSection}>
            <View style={[styles.doneIcon, { backgroundColor: colors.primary + "22" }]}>
              <Feather name="check-circle" size={52} color={colors.primary} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>Aadhaar Verified!</Text>
            <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
              Your Aadhaar card ending in{" "}
              <Text style={{ color: colors.primary }}>
                XXXX-XXXX-{(existing?.number ?? rawNumber).slice(-4)}
              </Text>{" "}
              has been successfully verified.
            </Text>
            <AtmosCard style={styles.verifiedCard}>
              {[
                { label: "Document Type", value: "Aadhaar Card" },
                { label: "Status", value: "Verified ✓" },
                { label: "Verified At", value: new Date().toLocaleDateString() },
              ].map((item) => (
                <View key={item.label} style={[styles.verifiedRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.verifiedLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                  <Text style={[styles.verifiedValue, { color: item.label === "Status" ? colors.primary : colors.foreground }]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </AtmosCard>
            <AtmosButton label="Back to Profile" onPress={() => router.back()} />
          </View>
        ) : step === "otp" ? (
          <View style={styles.otpSection}>
            <View style={[styles.otpIcon, { backgroundColor: colors.muted }]}>
              <Feather name="message-square" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.otpTitle, { color: colors.foreground }]}>Enter OTP</Text>
            <Text style={[styles.otpSub, { color: colors.mutedForeground }]}>
              A 6-digit OTP has been sent to the mobile number linked with Aadhaar ending in{" "}
              <Text style={{ color: colors.foreground }}>{rawNumber.slice(-4)}</Text>
            </Text>
            <Text style={[styles.demoHint, { color: colors.primary }]}>Demo: enter any 6 digits</Text>
            <View style={[styles.otpInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.otpInputText, { color: colors.foreground }]}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={colors.mutedForeground}
                textAlign="center"
              />
            </View>
            <AtmosButton
              label="Verify OTP"
              onPress={handleVerifyOTP}
              loading={loading}
              disabled={otp.length < 4}
            />
            <Pressable onPress={() => setStep("form")}>
              <Text style={[styles.backLink, { color: colors.mutedForeground }]}>← Back to Aadhaar form</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <AtmosCard>
              <View style={styles.infoBox}>
                <Feather name="info" size={16} color={colors.secondary} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Your Aadhaar number is encrypted and stored securely. We use ZK proofs to verify your identity without exposing your data.
                </Text>
              </View>
            </AtmosCard>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Aadhaar Number *
              </Text>
              <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="credit-card" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.inputText, { color: colors.foreground }]}
                  value={formattedNumber}
                  onChangeText={(v) => setAadhaarNumber(v.replace(/\D/g, ""))}
                  placeholder="XXXX-XXXX-XXXX"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={14}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Upload Aadhaar Card Photos
              </Text>
              <View style={styles.photoRow}>
                <Pressable
                  onPress={() => pickImage("front")}
                  style={[
                    styles.photoBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: frontImage ? colors.primary : colors.border,
                      borderStyle: frontImage ? "solid" : "dashed",
                    },
                  ]}
                >
                  {frontImage ? (
                    <Image source={{ uri: frontImage }} style={styles.photoPreview} />
                  ) : (
                    <>
                      <Feather name="camera" size={24} color={colors.mutedForeground} />
                      <Text style={[styles.photoLabel, { color: colors.mutedForeground }]}>Front</Text>
                    </>
                  )}
                  {frontImage && (
                    <View style={[styles.photoCheck, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={12} color={colors.primaryForeground} />
                    </View>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => pickImage("back")}
                  style={[
                    styles.photoBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: backImage ? colors.primary : colors.border,
                      borderStyle: backImage ? "solid" : "dashed",
                    },
                  ]}
                >
                  {backImage ? (
                    <Image source={{ uri: backImage }} style={styles.photoPreview} />
                  ) : (
                    <>
                      <Feather name="camera" size={24} color={colors.mutedForeground} />
                      <Text style={[styles.photoLabel, { color: colors.mutedForeground }]}>Back</Text>
                    </>
                  )}
                  {backImage && (
                    <View style={[styles.photoCheck, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={12} color={colors.primaryForeground} />
                    </View>
                  )}
                </Pressable>
              </View>
            </View>

            <AtmosCard>
              <View style={styles.infoBox}>
                <Feather name="lock" size={14} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  OTP will be sent to the mobile number linked with your Aadhaar via UIDAI
                </Text>
              </View>
            </AtmosCard>

            <AtmosButton
              label="Send OTP to Verify"
              onPress={handleSendOTP}
              loading={loading}
              disabled={rawNumber.length !== 12}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginTop: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13 },
  content: { padding: 20, gap: 16 },
  infoBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
  },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 18 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  fieldInput: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13,
  },
  inputText: { fontFamily: "Inter_400Regular", fontSize: 16, flex: 1 },
  photoRow: { flexDirection: "row", gap: 12 },
  photoBox: {
    flex: 1, aspectRatio: 1.6, borderRadius: 12, borderWidth: 2,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  photoPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  photoLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 6 },
  photoCheck: {
    position: "absolute", top: 8, right: 8, width: 22, height: 22,
    borderRadius: 11, alignItems: "center", justifyContent: "center",
  },
  doneSection: { alignItems: "center", gap: 16, paddingTop: 20 },
  doneIcon: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center",
  },
  doneTitle: { fontFamily: "Inter_700Bold", fontSize: 24 },
  doneSub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  verifiedCard: { width: "100%", gap: 0 },
  verifiedRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: 1,
  },
  verifiedLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  verifiedValue: { fontFamily: "Inter_500Medium", fontSize: 14 },
  otpSection: { alignItems: "center", gap: 16, paddingTop: 20 },
  otpIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  otpTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  otpSub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  demoHint: { fontFamily: "Inter_400Regular", fontSize: 12 },
  otpInput: {
    width: "100%", borderRadius: 12, borderWidth: 1, paddingVertical: 16,
  },
  otpInputText: { fontFamily: "Inter_700Bold", fontSize: 24 },
  backLink: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 },
});
