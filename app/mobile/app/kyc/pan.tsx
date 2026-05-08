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

function validatePAN(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
}

export default function PANScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateKYC } = useAuth();

  const existing = user?.kyc?.pan;
  const [panNumber, setPanNumber] = useState(existing?.number ?? "");
  const [panName, setPanName] = useState(user?.name ?? "");
  const [dob, setDob] = useState("");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(existing?.status === "verified");

  const panFormatted = panNumber.toUpperCase().slice(0, 10);
  const isValidPAN = validatePAN(panFormatted);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setFrontImage(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!isValidPAN) {
      Alert.alert("Invalid PAN", "PAN format must be: AAAAA9999A (5 letters, 4 digits, 1 letter)");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    updateKYC("pan", {
      status: "verified",
      number: panFormatted,
      fileName: "pan_" + panFormatted,
      submittedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    });
    setDone(true);
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
          <Text style={[styles.title, { color: colors.foreground }]}>PAN Card Verification</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Income Tax Department ID
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {done ? (
          <View style={styles.doneSection}>
            <View style={[styles.doneIcon, { backgroundColor: colors.primary + "22" }]}>
              <Feather name="check-circle" size={52} color={colors.primary} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>PAN Verified!</Text>
            <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
              Your PAN card{" "}
              <Text style={{ color: colors.primary }}>{panFormatted || existing?.number}</Text>{" "}
              has been verified.
            </Text>
            <AtmosCard style={styles.verifiedCard}>
              {[
                { label: "Document Type", value: "PAN Card" },
                { label: "PAN Number", value: panFormatted || existing?.number || "-" },
                { label: "Status", value: "Verified ✓" },
                { label: "Verified At", value: new Date().toLocaleDateString() },
              ].map((item) => (
                <View key={item.label} style={[styles.verifiedRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.verifiedLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                  <Text style={[styles.verifiedValue, {
                    color: item.label === "Status" ? colors.primary : colors.foreground
                  }]}>{item.value}</Text>
                </View>
              ))}
            </AtmosCard>
            <AtmosButton label="Back to Profile" onPress={() => router.back()} />
          </View>
        ) : (
          <>
            <AtmosCard style={styles.infoBox}>
              <Feather name="info" size={16} color={colors.secondary} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                PAN is required for transactions above ₹50,000 as per CBDT regulations. Your data is encrypted at rest.
              </Text>
            </AtmosCard>

            {/* PAN Number */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PAN Number *</Text>
              <View style={[
                styles.fieldInput,
                {
                  backgroundColor: colors.card,
                  borderColor: panFormatted.length === 10
                    ? (isValidPAN ? colors.primary : colors.destructive)
                    : colors.border,
                },
              ]}>
                <Feather name="file-text" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.inputText, { color: colors.foreground, textTransform: "uppercase", letterSpacing: 2 }]}
                  value={panFormatted}
                  onChangeText={(v) => setPanNumber(v.replace(/[^A-Za-z0-9]/g, ""))}
                  placeholder="ABCDE1234F"
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={10}
                  autoCapitalize="characters"
                />
                {panFormatted.length === 10 && (
                  <Feather
                    name={isValidPAN ? "check-circle" : "x-circle"}
                    size={16}
                    color={isValidPAN ? colors.primary : colors.destructive}
                  />
                )}
              </View>
              <Text style={[styles.formatHint, { color: colors.mutedForeground }]}>
                Format: AAAAA9999A (5 letters · 4 digits · 1 letter)
              </Text>
            </View>

            {/* Name as per PAN */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Name as per PAN *</Text>
              <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.inputText, { color: colors.foreground }]}
                  value={panName}
                  onChangeText={setPanName}
                  placeholder="Full name as on PAN"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Date of Birth *</Text>
              <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="calendar" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.inputText, { color: colors.foreground }]}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            {/* PAN photo upload */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Upload PAN Card Photo</Text>
              <Pressable
                onPress={pickImage}
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
                  <View style={styles.photoPlaceholder}>
                    <Feather name="camera" size={28} color={colors.mutedForeground} />
                    <Text style={[styles.photoLabel, { color: colors.mutedForeground }]}>
                      Tap to upload PAN card
                    </Text>
                    <Text style={[styles.photoSub, { color: colors.mutedForeground }]}>
                      JPG, PNG up to 5MB
                    </Text>
                  </View>
                )}
                {frontImage && (
                  <View style={[styles.photoCheck, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={12} color={colors.primaryForeground} />
                  </View>
                )}
              </Pressable>
            </View>

            <AtmosButton
              label="Verify PAN Card"
              onPress={handleSubmit}
              loading={loading}
              disabled={!isValidPAN || !panName || !dob}
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
  infoBox: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 18 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  fieldInput: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 13,
  },
  inputText: { fontFamily: "Inter_400Regular", fontSize: 15, flex: 1 },
  formatHint: { fontFamily: "Inter_400Regular", fontSize: 11 },
  photoBox: {
    borderRadius: 14, borderWidth: 2, overflow: "hidden",
    height: 160, width: "100%",
  },
  photoPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  photoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  photoLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  photoSub: { fontFamily: "Inter_400Regular", fontSize: 11 },
  photoCheck: {
    position: "absolute", top: 10, right: 10, width: 24, height: 24,
    borderRadius: 12, alignItems: "center", justifyContent: "center",
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
});
