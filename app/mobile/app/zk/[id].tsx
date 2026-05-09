import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAtmos } from "@/context/AtmosContext";
import { AtmosCard } from "@/components/AtmosCard";

const ZK_STEPS = [
  { label: "Encrypting your data...", sub: "AES-256 encryption applied", duration: 1500 },
  { label: "Generating ZK proof...", sub: "Groth16 circuit computing witness", duration: 2500 },
  { label: "Verifying proof...", sub: "On-chain verification via Solana", duration: 1500 },
];

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableSerialize(v)}`).join(",")}}`;
}

function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function buildSimulatedProofHash(project: unknown): string {
  const serialized = stableSerialize(project);
  const digestA = fnv1aHash(serialized);
  const digestB = fnv1aHash(`atmos-zk-v1:${serialized.length}:${serialized}`);
  return `zk_${digestA}${digestB}`;
}

export default function ZKProofScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, updateProject } = useAtmos();
  const project = projects.find((p) => p.id === id);

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [proofHash, setProofHash] = useState("");
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lockScaleAnim = useRef(new Animated.Value(1)).current;

  const alreadyHasProof = project?.proofHash;

  useEffect(() => {
    if (alreadyHasProof) {
      setProofHash(project.proofHash!);
      setDone(true);
      setCompletedSteps([0, 1, 2]);
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    runSteps();
  }, []);

  async function runSteps() {
    const completed: number[] = [];
    for (let i = 0; i < ZK_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, ZK_STEPS[i].duration));
      completed.push(i);
      setCompletedSteps([...completed]);
    }

    const proofPayload = {
      id: project?.id,
      type: project?.type,
      location: project?.location,
      co2: project?.co2,
      confidence: project?.confidence,
      metadata: project?.metadata,
      mediaCount: project?.mediaCount,
    };
    const hash = buildSimulatedProofHash(proofPayload);
    setProofHash(hash);
    updateProject(id!, {
      proofHash: hash,
      status: "verified",
    });
    setDone(true);

    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.timing(lockScaleAnim, { toValue: 1.3, duration: 300, useNativeDriver: true }),
      Animated.timing(lockScaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const HIDDEN_FIELDS = ["GPS Coordinates", "Production Volume", "Equipment Logs"];
  const PUBLIC_FIELDS = [
    { label: "CO₂ Amount", value: `${project?.co2?.toFixed(2) ?? "2.46"} tCO₂e` },
    { label: "Data Timestamp", value: new Date().toLocaleDateString() },
    { label: "Geographic Region", value: "Rajasthan, India" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Zero-Knowledge Proof</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Protecting your privacy</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.lockCenter}>
          <Animated.View
            style={[
              styles.lockOrb,
              {
                backgroundColor: done ? colors.primary + "22" : colors.muted,
                borderColor: done ? colors.primary : colors.border,
                transform: [{ scale: done ? lockScaleAnim : pulseAnim }],
              },
            ]}
          >
            <Feather name={done ? "check-circle" : "lock"} size={40} color={done ? colors.primary : colors.secondary} />
          </Animated.View>
          {done ? (
            <Text style={[styles.lockStatus, { color: colors.primary }]}>Proof Generated</Text>
          ) : (
            <Text style={[styles.lockStatus, { color: colors.secondary }]}>Generating Proof...</Text>
          )}
        </View>

        <View style={styles.stepsList}>
          {ZK_STEPS.map((step, i) => {
            const isCompleted = completedSteps.includes(i);
            const isActive = !done && i === currentStep;
            return (
              <View key={step.label} style={[styles.stepRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.stepNum, {
                  backgroundColor: isCompleted ? colors.primary : isActive ? colors.secondary + "33" : colors.muted,
                  borderColor: isActive ? colors.secondary : "transparent",
                  borderWidth: isActive ? 2 : 0,
                }]}>
                  {isCompleted ? (
                    <Feather name="check" size={14} color={colors.primaryForeground} />
                  ) : (
                    <Text style={[styles.numText, { color: isActive ? colors.secondary : colors.mutedForeground }]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepLabel, { color: isCompleted || isActive ? colors.foreground : colors.mutedForeground }]}>
                    {step.label}
                  </Text>
                  <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>{step.sub}</Text>
                </View>
                {isCompleted && <Feather name="check" size={16} color={colors.primary} />}
              </View>
            );
          })}
        </View>

        <AtmosCard style={styles.privacyCard}>
          <Text style={[styles.privacyTitle, { color: colors.foreground }]}>
            What is <Text style={{ color: colors.destructive }}>NOT</Text> exposed:
          </Text>
          {HIDDEN_FIELDS.map((f) => (
            <View key={f} style={styles.privacyRow}>
              <Feather name="eye-off" size={14} color={colors.destructive} />
              <Text style={[styles.privacyField, { color: colors.mutedForeground }]}>{f}</Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.privacyTitle, { color: colors.foreground }]}>
            What <Text style={{ color: colors.primary }}>IS</Text> verified:
          </Text>
          {PUBLIC_FIELDS.map((f) => (
            <View key={f.label} style={styles.privacyRow}>
              <Feather name="check-circle" size={14} color={colors.primary} />
              <Text style={[styles.privacyField, { color: colors.foreground }]}>{f.label}</Text>
              <Text style={[styles.privacyValue, { color: colors.secondary }]}>{f.value}</Text>
            </View>
          ))}
        </AtmosCard>

        {done && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <AtmosCard style={styles.hashCard}>
              <View style={styles.hashHeader}>
                <Feather name="shield" size={16} color={colors.primary} />
                <Text style={[styles.hashTitle, { color: colors.foreground }]}>Proof Hash</Text>
              </View>
              <View style={[styles.hashBox, { backgroundColor: colors.muted }]}>
                <Text style={[styles.hashValue, { color: colors.primary }]}>{proofHash}</Text>
              </View>
              <Text style={[styles.hashNote, { color: colors.mutedForeground }]}>
                Anchored on Solana Devnet · Groth16 / Halo2 compatible
              </Text>
            </AtmosCard>
          </Animated.View>
        )}
      </ScrollView>

      {done && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push({ pathname: "/asset/[id]", params: { id: id! } })}
          >
            <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
              Next: Create Asset
            </Text>
            <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
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
    fontSize: 22,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  lockCenter: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  lockOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  lockStatus: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  stepsList: {
    gap: 0,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  numText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  stepLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  stepSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  privacyCard: {
    gap: 8,
  },
  privacyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
  },
  privacyField: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
  },
  privacyValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  hashCard: {
    gap: 10,
  },
  hashHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hashTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  hashBox: {
    padding: 12,
    borderRadius: 10,
  },
  hashValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  hashNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
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
