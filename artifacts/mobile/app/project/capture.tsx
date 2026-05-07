import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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
import { useAtmos } from "@/context/AtmosContext";
import { AtmosButton } from "@/components/AtmosButton";

export default function CaptureDataScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: string }>();
  const { addProject } = useAtmos();

  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("Jaipur, Rajasthan, India");
  const [biomassInput, setBiomassInput] = useState("12500");
  const [biocharOutput, setBiocharOutput] = useState("3200");
  const [equipment, setEquipment] = useState("Retort Kiln");
  const [mediaCount, setMediaCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const STEPS = [
    { label: "Project Info", icon: "info" },
    { label: "Metrics", icon: "bar-chart-2" },
    { label: "Media", icon: "camera" },
  ];

  function handleMediaAdd() {
    setMediaCount((c) => Math.min(c + 1, 4));
  }

  async function handleSubmit() {
    if (!projectName) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    const project = addProject({
      name: projectName || `Biochar Batch #${Date.now().toString(36).toUpperCase()}`,
      type: type as any,
      location,
      status: "verifying",
      metadata: {
        biomassInput: Number(biomassInput),
        biocharOutput: Number(biocharOutput),
        equipmentType: equipment,
      },
      mediaCount,
    });
    setLoading(false);
    router.push({ pathname: "/verify/[id]", params: { id: project.id } });
  }

  const progress = (step / 3) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => (step > 1 ? setStep(step - 1) : router.back())} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Capture Data</Text>
          <View style={styles.stepRow}>
            {STEPS.map((s, i) => (
              <View key={s.label} style={styles.stepItem}>
                <View style={[styles.stepDot, { backgroundColor: i + 1 <= step ? colors.primary : colors.muted }]}>
                  {i + 1 < step ? (
                    <Feather name="check" size={10} color={colors.primaryForeground} />
                  ) : (
                    <Text style={[styles.stepNum, { color: i + 1 === step ? colors.primaryForeground : colors.mutedForeground }]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: i + 1 < step ? colors.primary : colors.muted }]} />
                )}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: colors.primary }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Project Information</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>3/5 complete</Text>

            <FormField label="Project Name" colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={projectName}
                onChangeText={setProjectName}
                placeholder="Biochar Unit — Rajasthan"
                placeholderTextColor={colors.mutedForeground}
              />
            </FormField>

            <FormField label="Location" colors={colors}>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={16} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.foreground, flex: 1 }]}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, State, Country"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </FormField>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Production Metrics</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>2/3 complete</Text>

            <FormField label={`Biomass Input (kg/month): ${Number(biomassInput).toLocaleString()}`} colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={biomassInput}
                onChangeText={setBiomassInput}
                keyboardType="numeric"
                placeholderTextColor={colors.mutedForeground}
              />
            </FormField>

            <FormField label={`Biochar Output (kg/month): ${Number(biocharOutput).toLocaleString()}`} colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={biocharOutput}
                onChangeText={setBiocharOutput}
                keyboardType="numeric"
                placeholderTextColor={colors.mutedForeground}
              />
            </FormField>

            <FormField label="Equipment Type" colors={colors}>
              <View style={styles.equipRow}>
                {["Retort Kiln", "TLUD", "Flash Carbonizer"].map((eq) => (
                  <Pressable
                    key={eq}
                    onPress={() => setEquipment(eq)}
                    style={[
                      styles.equipChip,
                      {
                        backgroundColor: equipment === eq ? colors.primary : colors.muted,
                        borderColor: equipment === eq ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.equipText, { color: equipment === eq ? colors.primaryForeground : colors.mutedForeground }]}>
                      {eq}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </FormField>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Media Upload</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>{mediaCount}/4 complete</Text>

            <View style={styles.mediaGrid}>
              {Array(4).fill(null).map((_, i) => (
                <Pressable
                  key={i}
                  onPress={handleMediaAdd}
                  style={[
                    styles.mediaBox,
                    {
                      backgroundColor: i < mediaCount ? colors.muted : colors.card,
                      borderColor: i < mediaCount ? colors.primary : colors.border,
                      borderStyle: i < mediaCount ? "solid" : "dashed",
                    },
                  ]}
                >
                  {i < mediaCount ? (
                    <Feather name="check-circle" size={28} color={colors.primary} />
                  ) : (
                    <Feather name="plus" size={28} color={colors.mutedForeground} />
                  )}
                </Pressable>
              ))}
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="info" size={14} color={colors.secondary} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Photos are analyzed by our AI + satellite system for verification
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
        {step < 3 ? (
          <Pressable
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={() => setStep(step + 1)}
          >
            <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>Next</Text>
            <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        ) : (
          <AtmosButton
            label="Submit for AI Verification"
            onPress={handleSubmit}
            loading={loading}
          />
        )}
      </View>
    </View>
  );
}

function FormField({ label, colors, children }: { label: string; colors: any; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
  },
  stepLine: {
    width: 20,
    height: 2,
  },
  progressBar: {
    height: 3,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  form: {
    padding: 20,
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  stepSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: -8,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  fieldInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  equipRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  equipChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  equipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  mediaBox: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBox: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  infoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  nextBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
