import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

const DOC_TYPES = [
  { id: "7_12", label: "7/12 Extract", icon: "file-text", desc: "Land ownership record from taluka office" },
  { id: "property_card", label: "Property Card", icon: "home", desc: "City Survey property ownership document" },
  { id: "mutation", label: "Mutation Record", icon: "refresh-cw", desc: "Transfer of land ownership document" },
  { id: "survey_map", label: "Survey / Field Map", icon: "map", desc: "Village map with plot boundaries" },
  { id: "lease_agreement", label: "Lease Agreement", icon: "file", desc: "Valid lease for leased farmland" },
];

export default function FarmDocScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateKYC } = useAuth();

  const existing = user?.kyc?.farmDoc;
  const [selectedDocType, setSelectedDocType] = useState(DOC_TYPES[0].id);
  const [surveyNumber, setSurveyNumber] = useState("");
  const [village, setVillage] = useState("");
  const [taluka, setTaluka] = useState("");
  const [district, setDistrict] = useState("");
  const [areaHa, setAreaHa] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(existing?.status === "verified");

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      setUploadedImages((prev) => [
        ...prev,
        ...result.assets.map((a) => a.uri),
      ].slice(0, 5));
    }
  }

  async function handleSubmit() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    const docType = DOC_TYPES.find((d) => d.id === selectedDocType);
    updateKYC("farm_doc", {
      status: "pending",
      number: surveyNumber,
      fileName: `farm_${selectedDocType}_${Date.now()}`,
      submittedAt: new Date().toISOString(),
    });
    setDone(true);
    setLoading(false);
  }

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const canSubmit = surveyNumber && village && district && uploadedImages.length > 0;

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
          <Text style={[styles.title, { color: colors.foreground }]}>Farm Documents</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Government-approved land records
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
            <View style={[styles.doneIcon, { backgroundColor: colors.warning + "22" }]}>
              <Feather name="clock" size={52} color={colors.warning} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>Documents Submitted!</Text>
            <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
              Your farm documents are under review. Government verification typically takes 2-3 business days.
            </Text>
            <AtmosCard style={styles.statusCard}>
              {[
                { label: "Document Type", value: DOC_TYPES.find((d) => d.id === selectedDocType)?.label ?? "-" },
                { label: "Survey Number", value: surveyNumber || existing?.number || "-" },
                { label: "Status", value: "Under Review" },
                { label: "Submitted", value: new Date().toLocaleDateString() },
              ].map((item) => (
                <View key={item.label} style={[styles.statusRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                  <Text style={[styles.statusValue, {
                    color: item.label === "Status" ? colors.warning : colors.foreground
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
                Farm documents are required to verify that you have legal right over the land where carbon activities are being conducted. Only government-approved documents are accepted.
              </Text>
            </AtmosCard>

            {/* Document type selection */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Document Type *</Text>
              <View style={styles.docTypeGrid}>
                {DOC_TYPES.map((doc) => (
                  <Pressable
                    key={doc.id}
                    onPress={() => setSelectedDocType(doc.id)}
                    style={[
                      styles.docTypeCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: selectedDocType === doc.id ? colors.primary : colors.border,
                        borderWidth: selectedDocType === doc.id ? 2 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name={doc.icon as any}
                      size={18}
                      color={selectedDocType === doc.id ? colors.primary : colors.mutedForeground}
                    />
                    <Text style={[styles.docTypeLabel, {
                      color: selectedDocType === doc.id ? colors.primary : colors.foreground
                    }]}>{doc.label}</Text>
                    <Text style={[styles.docTypeDesc, { color: colors.mutedForeground }]}>
                      {doc.desc}
                    </Text>
                    {selectedDocType === doc.id && (
                      <View style={[styles.docCheck, { backgroundColor: colors.primary }]}>
                        <Feather name="check" size={10} color={colors.primaryForeground} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Land details */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Survey / Gat Number *</Text>
              <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.inputText, { color: colors.foreground }]}
                  value={surveyNumber}
                  onChangeText={setSurveyNumber}
                  placeholder="e.g., 123/4A"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Village *</Text>
                <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.inputText, { color: colors.foreground }]}
                    value={village}
                    onChangeText={setVillage}
                    placeholder="Village name"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Taluka</Text>
                <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.inputText, { color: colors.foreground }]}
                    value={taluka}
                    onChangeText={setTaluka}
                    placeholder="Taluka"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>District *</Text>
                <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.inputText, { color: colors.foreground }]}
                    value={district}
                    onChangeText={setDistrict}
                    placeholder="District"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Area (Hectares)</Text>
                <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.inputText, { color: colors.foreground }]}
                    value={areaHa}
                    onChangeText={setAreaHa}
                    placeholder="e.g., 2.5"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* Document upload */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Upload Document Photos ({uploadedImages.length}/5) *
              </Text>
              <View style={styles.uploadGrid}>
                {uploadedImages.map((uri, i) => (
                  <View key={i} style={[styles.uploadThumb, { borderColor: colors.primary }]}>
                    <Image source={{ uri }} style={styles.thumbImage} />
                    <Pressable
                      onPress={() => setUploadedImages((prev) => prev.filter((_, idx) => idx !== i))}
                      style={[styles.thumbRemove, { backgroundColor: colors.destructive }]}
                    >
                      <Feather name="x" size={10} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                {uploadedImages.length < 5 && (
                  <Pressable
                    onPress={pickImage}
                    style={[styles.uploadAdd, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Feather name="plus" size={24} color={colors.mutedForeground} />
                    <Text style={[styles.uploadAddText, { color: colors.mutedForeground }]}>Add</Text>
                  </Pressable>
                )}
              </View>
              <Text style={[styles.uploadHint, { color: colors.mutedForeground }]}>
                Upload clear photos of the original government document
              </Text>
            </View>

            <AtmosButton
              label="Submit for Verification"
              onPress={handleSubmit}
              loading={loading}
              disabled={!canSubmit}
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
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  inputText: { fontFamily: "Inter_400Regular", fontSize: 15, flex: 1 },
  twoCol: { flexDirection: "row", gap: 10 },
  docTypeGrid: { gap: 8 },
  docTypeCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, padding: 12, position: "relative",
  },
  docTypeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  docTypeDesc: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  docCheck: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  uploadGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  uploadThumb: {
    width: 80, height: 80, borderRadius: 10, borderWidth: 2, overflow: "hidden",
  },
  thumbImage: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbRemove: {
    position: "absolute", top: 4, right: 4, width: 18, height: 18,
    borderRadius: 9, alignItems: "center", justifyContent: "center",
  },
  uploadAdd: {
    width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  uploadAddText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  uploadHint: { fontFamily: "Inter_400Regular", fontSize: 11 },
  doneSection: { alignItems: "center", gap: 16, paddingTop: 20 },
  doneIcon: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center",
  },
  doneTitle: { fontFamily: "Inter_700Bold", fontSize: 24 },
  doneSub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  statusCard: { width: "100%", gap: 0 },
  statusRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: 1,
  },
  statusLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  statusValue: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
