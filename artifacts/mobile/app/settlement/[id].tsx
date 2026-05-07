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

export default function SettlementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id, amount, qty } = useLocalSearchParams<{ id: string; amount: string; qty: string }>();
  const { assets, payments } = useAtmos();
  const asset = assets.find((a) => a.id === id);
  const payment = payments.find((p) => p.assetId === id);

  const [phase, setPhase] = useState<"recording" | "complete">("recording");
  const blockNum = 250231 + Math.floor(Math.random() * 1000);
  const txId = payment?.txId ?? "Sol_" + Math.random().toString(36).substring(2, 12).toUpperCase();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: 1, duration: 3000, useNativeDriver: false }).start(async () => {
      setPhase("complete");
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(borderAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
            Animated.timing(borderAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
          ])
        ),
      ]).start();
    });
  }, []);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const glowColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: ["#FFD700", "#0DFF6E"] });

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const totalAmount = amount ?? "8,610";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.replace("/(tabs)/")} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Settlement</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]} showsVerticalScrollIndicator={false}>
        {phase === "recording" ? (
          <AtmosCard style={styles.recordingCard}>
            <View style={styles.recordingHeader}>
              <Feather name="activity" size={20} color={colors.secondary} />
              <Text style={[styles.recordingTitle, { color: colors.foreground }]}>Recording on Solana</Text>
            </View>
            <Text style={[styles.recordingSub, { color: colors.mutedForeground }]}>Settlement in progress...</Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <Animated.View style={[styles.progressFill, { width: progressWidth as any, backgroundColor: colors.secondary }]} />
            </View>
            <View style={styles.blockInfo}>
              <Text style={[styles.blockLabel, { color: colors.mutedForeground }]}>TxHash · {txId.substring(0, 12)}...</Text>
              <Text style={[styles.blockLabel, { color: colors.mutedForeground }]}>Block: {blockNum.toLocaleString()}</Text>
            </View>
          </AtmosCard>
        ) : null}

        {phase === "complete" && (
          <Animated.View style={{ opacity: fadeAnim, gap: 16 }}>
            <View style={styles.successBanner}>
              <View style={[styles.successIcon, { backgroundColor: colors.primary + "22" }]}>
                <Feather name="check-circle" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.successText, { color: colors.primary }]}>Payment Confirmed</Text>
              <Text style={[styles.successAmount, { color: colors.foreground }]}>
                ₹{parseInt(totalAmount).toLocaleString("en-IN")}
              </Text>
              <Text style={[styles.successTx, { color: colors.mutedForeground }]}>TxID: {txId}</Text>
            </View>

            <AtmosCard style={styles.certificate} padding={20}>
              <View style={[styles.certBorder, { borderColor: "#FFD700" }]}>
                <Text style={[styles.certTitle, { color: "#FFD700" }]}>CARBON ASSET CERTIFICATE</Text>
                <View style={[styles.certDivider, { backgroundColor: "#FFD700" }]} />

                {[
                  { label: "Buyer", value: "Maria Garcia" },
                  { label: "Asset", value: asset?.name ?? "Biochar Batch #824-018" },
                  { label: "Amount", value: `${asset?.amount ?? 2.46} tCO₂e` },
                  { label: "Price", value: `₹${asset?.price?.toLocaleString("en-IN") ?? "1,485"}/t` },
                  { label: "Date", value: new Date().toLocaleDateString() },
                  { label: "Blockchain", value: "Solana — Devnet" },
                ].map((item) => (
                  <View key={item.label} style={styles.certRow}>
                    <Text style={[styles.certLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                    <Text style={[styles.certValue, { color: colors.foreground }]}>{item.value}</Text>
                  </View>
                ))}

                <View style={[styles.certDivider, { backgroundColor: "#FFD700" }]} />

                <View style={[styles.qrPlaceholder, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <Feather name="grid" size={40} color={colors.primary} />
                  <Text style={[styles.qrLabel, { color: colors.mutedForeground }]}>Verify on Solana Explorer</Text>
                </View>

                <Text style={[styles.certUrl, { color: colors.secondary }]}>
                  atmos.protocol/verify/{payment?.txId?.substring(0, 8) ?? "abc123"}
                </Text>
              </View>
            </AtmosCard>
          </Animated.View>
        )}
      </ScrollView>

      {phase === "complete" && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
          <View style={styles.footerBtns}>
            <Pressable
              style={[styles.outlineBtn, { borderColor: colors.primary }]}
              onPress={() => {}}
            >
              <Text style={[styles.outlineBtnText, { color: colors.primary }]}>View Certificate</Text>
            </Pressable>
            <Pressable
              style={[styles.outlineBtn, { borderColor: colors.secondary }]}
              onPress={() => {}}
            >
              <Text style={[styles.outlineBtnText, { color: colors.secondary }]}>View on Explorer</Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)/portfolio")}
          >
            <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Done</Text>
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
    paddingBottom: 12,
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
  recordingCard: {
    gap: 10,
  },
  recordingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recordingTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  recordingSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  blockInfo: {
    gap: 2,
  },
  blockLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  successBanner: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  successAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
  },
  successTx: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  certificate: {
    gap: 0,
  },
  certBorder: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  certTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    letterSpacing: 1,
    textAlign: "center",
  },
  certDivider: {
    height: 1,
    opacity: 0.4,
  },
  certRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  certLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  certValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  qrPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    gap: 8,
    alignSelf: "center",
    width: 140,
  },
  qrLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textAlign: "center",
  },
  certUrl: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  footerBtns: {
    flexDirection: "row",
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  outlineBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  doneBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
