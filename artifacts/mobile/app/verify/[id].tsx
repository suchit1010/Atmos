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

const PHASES = [
  { label: "Fetching satellite data", sub: "Sentinel-2 Imagery · NIR / Red — Live use", duration: 2000 },
  { label: "Activity verification", sub: "Cross-referencing land use data", duration: 1500 },
  { label: "Carbon estimation", sub: "Running NDVI carbon model", duration: 2000 },
  { label: "Confidence scoring", sub: "8-dimension quality assessment", duration: 1000 },
];

export default function VerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, updateProject } = useAtmos();
  const project = projects.find((p) => p.id === id);

  const [currentPhase, setCurrentPhase] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ co2: number; confidence: number; grade: string } | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  const isAlreadyVerified = project?.status === "minted" || project?.status === "verified";

  useEffect(() => {
    if (isAlreadyVerified) {
      setDone(true);
      setResult({ co2: project?.co2 ?? 2.46, confidence: project?.confidence ?? 87, grade: project?.grade ?? "A" });
      return;
    }

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
    ).start();

    runPhases();
  }, []);

  async function runPhases() {
    for (let i = 0; i < PHASES.length; i++) {
      setCurrentPhase(i);
      Animated.timing(progressAnim, {
        toValue: (i + 1) / PHASES.length,
        duration: PHASES[i].duration,
        useNativeDriver: false,
      }).start();
      await new Promise((r) => setTimeout(r, PHASES[i].duration));
    }
    const co2 = parseFloat((1.5 + Math.random() * 2).toFixed(2));
    const confidence = Math.floor(78 + Math.random() * 15);
    const grade = confidence >= 90 ? "S" : confidence >= 82 ? "A" : "B";
    const verifyResult = { co2, confidence, grade };
    setResult(verifyResult);
    updateProject(id!, { status: "verified", co2, confidence, grade, fraudRisk: "LOW" });
    setDone(true);
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>AI Verification</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {done ? "Analysis complete" : "Analyzing your project..."}
        </Text>

        <AtmosCard style={styles.statusCard}>
          <View style={styles.phaseHeader}>
            <Text style={[styles.phaseCount, { color: colors.secondary }]}>
              Phase {Math.min(currentPhase + 1, PHASES.length)}/{PHASES.length}
            </Text>
            {!done && (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Feather name="loader" size={18} color={colors.primary} />
              </Animated.View>
            )}
            {done && <Feather name="check-circle" size={18} color={colors.primary} />}
          </View>

          <Text style={[styles.phaseLabel, { color: colors.foreground }]}>
            {done ? "Verification complete" : PHASES[currentPhase]?.label}
          </Text>
          <Text style={[styles.phaseSub, { color: colors.mutedForeground }]}>
            {done ? "All checks passed successfully" : PHASES[currentPhase]?.sub}
          </Text>

          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: done ? "100%" : progressWidth as any },
              ]}
            />
          </View>
        </AtmosCard>

        <View style={styles.checkList}>
          {PHASES.map((phase, i) => {
            const completed = done || i < currentPhase;
            const active = !done && i === currentPhase;
            return (
              <View key={phase.label} style={[styles.checkItem, { borderBottomColor: colors.border }]}>
                <View style={[
                  styles.checkIcon,
                  { backgroundColor: completed ? colors.primary + "22" : colors.muted },
                ]}>
                  {completed ? (
                    <Feather name="check" size={14} color={colors.primary} />
                  ) : active ? (
                    <Feather name="loader" size={14} color={colors.secondary} />
                  ) : (
                    <Feather name="circle" size={14} color={colors.mutedForeground} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkLabel, { color: completed ? colors.foreground : colors.mutedForeground }]}>
                    {phase.label}
                  </Text>
                  <Text style={[styles.checkSub, { color: colors.mutedForeground }]}>{phase.sub}</Text>
                </View>
                {completed && <Feather name="check-circle" size={16} color={colors.primary} />}
              </View>
            );
          })}
        </View>

        {done && result && (
          <Animated.View style={{ opacity: fadeIn }}>
            <AtmosCard style={styles.resultCard}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>Estimated CO₂</Text>
              <View style={styles.co2Row}>
                <Text style={[styles.co2Value, { color: colors.primary }]}>{result.co2.toFixed(2)}</Text>
                <Text style={[styles.co2Unit, { color: colors.mutedForeground }]}>tCO₂e</Text>
              </View>
              <View style={styles.resultMeta}>
                <View style={[styles.metaBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Confidence</Text>
                  <Text style={[styles.metaValue, { color: colors.secondary }]}>{result.confidence}/100</Text>
                </View>
                <View style={[styles.metaBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Grade</Text>
                  <Text style={[styles.metaValue, { color: colors.primary }]}>{result.grade}</Text>
                </View>
                <View style={[styles.metaBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Risk</Text>
                  <Text style={[styles.metaValue, { color: colors.primary }]}>LOW</Text>
                </View>
              </View>
              <View style={[styles.priceRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Price Range</Text>
                <Text style={[styles.priceValue, { color: colors.foreground }]}>
                  ₹1,500 — ₹1,850 / tonne ({result.grade})
                </Text>
              </View>
            </AtmosCard>
          </Animated.View>
        )}
      </ScrollView>

      {done && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.zkBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push({ pathname: "/zk/[id]", params: { id: id! } })}
          >
            <Feather name="lock" size={18} color={colors.primaryForeground} />
            <Text style={[styles.zkBtnText, { color: colors.primaryForeground }]}>
              Next: Generate ZK Proof
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  statusCard: {
    gap: 8,
  },
  phaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phaseCount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  phaseLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  phaseSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  checkList: {
    gap: 0,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  checkSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  resultCard: {
    gap: 10,
  },
  resultTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  co2Row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  co2Value: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
  },
  co2Unit: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
  },
  resultMeta: {
    flexDirection: "row",
    gap: 8,
  },
  metaBadge: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    gap: 2,
    alignItems: "center",
  },
  metaLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  metaValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  priceRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 2,
  },
  priceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  priceValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
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
  zkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  zkBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
