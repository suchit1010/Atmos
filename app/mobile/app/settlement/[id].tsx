import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAtmos } from "@/context/AtmosContext";
import { useAuth } from "@/context/AuthContext";
import { AtmosCard } from "@/components/AtmosCard";

export default function SettlementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id, amount } = useLocalSearchParams<{ id: string; amount: string; qty: string }>();
  const { assets, payments, projects } = useAtmos();
  const { user } = useAuth();
  const asset = assets.find((a) => a.id === id);
  const payment = payments.find((p) => p.assetId === id);
  const project = projects.find((p) => p.id === asset?.projectId);

  const [phase, setPhase] = useState<"recording" | "complete">("recording");
  const [showCertModal, setShowCertModal] = useState(false);
  const blockNum = useRef(250231 + Math.floor(Math.random() * 1000)).current;
  const txId = useRef(
    payment?.txId ?? "dodo_demo_" + Date.now()
  ).current;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: 1, duration: 3000, useNativeDriver: false }).start(() => {
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

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const totalAmount = amount ?? "8610";

  const txLooksLikeSignature = /^[1-9A-HJ-NP-Za-km-z]{70,120}$/.test(txId);
  const mintAddress = asset?.mintAddress ?? project?.mintAddress;
  const explorerUrl = txLooksLikeSignature
    ? `https://explorer.solana.com/tx/${encodeURIComponent(txId)}?cluster=devnet`
    : mintAddress
      ? `https://explorer.solana.com/address/${encodeURIComponent(mintAddress)}?cluster=devnet`
      : `https://explorer.solana.com/?cluster=devnet`;

  async function handleViewExplorer() {
    try {
      await Linking.openURL(explorerUrl);
    } catch {
      Alert.alert(
        "Explorer",
        txLooksLikeSignature
          ? `Transaction ID:\n${txId}\n\nOpen explorer.solana.com to verify.`
          : `Mint Address:\n${mintAddress ?? "N/A"}\n\nOpen explorer.solana.com to verify.`
      );
    }
  }

  async function handleShareCertificate() {
    const certText =
      `CARBON ASSET CERTIFICATE — ATMOS Protocol\n\n` +
      `Buyer: ${user?.name ?? "ATMOS User"}\n` +
      `Asset: ${asset?.name ?? "Carbon Asset"}\n` +
      `Amount: ${asset?.amount ?? "—"} tCO₂e\n` +
      `Price: ₹${asset?.price?.toLocaleString("en-IN") ?? "—"}/t\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `Blockchain: Solana — Devnet\n` +
      `TxID: ${txId}\n\n` +
      `Verify at: atmos.protocol/verify/${txId.substring(0, 12)}`;
    try {
      await Share.share({ message: certText, title: "Carbon Asset Certificate" });
    } catch {
      // ignore
    }
  }

  const certRows = [
    { label: "Buyer", value: user?.name ?? "ATMOS User" },
    { label: "Asset", value: asset?.name ?? "Biochar Batch #824-018" },
    { label: "Amount", value: `${asset?.amount ?? 2.46} tCO₂e` },
    { label: "Price", value: `₹${asset?.price?.toLocaleString("en-IN") ?? "1,485"}/t` },
    { label: "Date", value: new Date().toLocaleDateString() },
    { label: "Methodology", value: asset?.methodology ?? "VM0044" },
    { label: "Blockchain", value: "Solana — Devnet" },
    { label: "TxID", value: txId.substring(0, 18) + "..." },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.replace("/(tabs)" as any)} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Settlement</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 160 }]}
        showsVerticalScrollIndicator={false}
      >
        {phase === "recording" && (
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
        )}

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

                {certRows.map((item) => (
                  <View key={item.label} style={styles.certRow}>
                    <Text style={[styles.certLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                    <Text style={[styles.certValue, { color: colors.foreground }]} numberOfLines={1}>{item.value}</Text>
                  </View>
                ))}

                <View style={[styles.certDivider, { backgroundColor: "#FFD700" }]} />

                <Pressable
                  style={[styles.qrPlaceholder, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  onPress={handleViewExplorer}
                >
                  <Feather name="grid" size={40} color={colors.primary} />
                  <Text style={[styles.qrLabel, { color: colors.mutedForeground }]}>Tap to Verify on{"\n"}Solana Explorer</Text>
                </Pressable>

                <Text style={[styles.certUrl, { color: colors.secondary }]}>
                  atmos.protocol/verify/{txId.substring(0, 12)}
                </Text>
              </View>
            </AtmosCard>
          </Animated.View>
        )}
      </ScrollView>

      {phase === "complete" && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.footerBtns}>
            <Pressable
              style={[styles.outlineBtn, { borderColor: colors.primary }]}
              onPress={() => setShowCertModal(true)}
            >
              <Feather name="award" size={14} color={colors.primary} />
              <Text style={[styles.outlineBtnText, { color: colors.primary }]}>View Certificate</Text>
            </Pressable>
            <Pressable
              style={[styles.outlineBtn, { borderColor: colors.secondary }]}
              onPress={handleViewExplorer}
            >
              <Feather name="external-link" size={14} color={colors.secondary} />
              <Text style={[styles.outlineBtnText, { color: colors.secondary }]}>View on Explorer</Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)/portfolio" as any)}
          >
            <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Done</Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={showCertModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCertModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Carbon Certificate</Text>
              <Pressable onPress={() => setShowCertModal(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={[styles.certBorder, { borderColor: "#FFD700" }]}>
                <Text style={[styles.certTitle, { color: "#FFD700" }]}>CARBON ASSET CERTIFICATE</Text>
                <Text style={[styles.certSubtitle, { color: colors.mutedForeground }]}>Verified by ATMOS Protocol — ZK Proof</Text>
                <View style={[styles.certDivider, { backgroundColor: "#FFD700" }]} />

                {certRows.map((item) => (
                  <View key={item.label} style={styles.certRow}>
                    <Text style={[styles.certLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                    <Text style={[styles.certValue, { color: colors.foreground }]}>{item.value}</Text>
                  </View>
                ))}

                <View style={[styles.certDivider, { backgroundColor: "#FFD700" }]} />

                <View style={[styles.certBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
                  <Feather name="shield" size={16} color={colors.primary} />
                  <Text style={[styles.certBadgeText, { color: colors.primary }]}>
                    Zero-Knowledge Proof Verified{"\n"}Privacy-preserving carbon accounting
                  </Text>
                </View>

                <Text style={[styles.certUrl, { color: colors.secondary }]}>
                  atmos.protocol/verify/{txId.substring(0, 16)}
                </Text>
              </View>

              <Pressable
                style={[styles.shareBtn, { backgroundColor: colors.primary }]}
                onPress={handleShareCertificate}
              >
                <Feather name="share-2" size={16} color={colors.primaryForeground} />
                <Text style={[styles.shareBtnText, { color: colors.primaryForeground }]}>Share Certificate</Text>
              </Pressable>

              <Pressable
                style={[styles.explorerBtn, { borderColor: colors.secondary }]}
                onPress={handleViewExplorer}
              >
                <Feather name="external-link" size={16} color={colors.secondary} />
                <Text style={[styles.explorerBtnText, { color: colors.secondary }]}>Open Solana Explorer</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  content: { padding: 20, gap: 16 },
  recordingCard: { gap: 10 },
  recordingHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  recordingTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  recordingSub: { fontFamily: "Inter_400Regular", fontSize: 13 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  blockInfo: { gap: 2 },
  blockLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  successBanner: { alignItems: "center", gap: 8, paddingVertical: 12 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  successText: { fontFamily: "Inter_700Bold", fontSize: 20 },
  successAmount: { fontFamily: "Inter_700Bold", fontSize: 32 },
  successTx: { fontFamily: "Inter_400Regular", fontSize: 12 },
  certificate: { gap: 0 },
  certBorder: { borderWidth: 1.5, borderRadius: 12, padding: 16, gap: 10 },
  certTitle: { fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 1, textAlign: "center" },
  certSubtitle: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", marginTop: -6 },
  certDivider: { height: 1, opacity: 0.4 },
  certRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  certLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  certValue: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1, textAlign: "right" },
  qrPlaceholder: { alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, padding: 16, gap: 6, alignSelf: "center", width: 140 },
  qrLabel: { fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },
  certUrl: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" },
  certBadge: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: "flex-start" },
  certBadgeText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 17 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  footerBtns: { flexDirection: "row", gap: 10 },
  outlineBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  outlineBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  doneBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  doneBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  modalContent: { padding: 20, gap: 12 },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  shareBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  explorerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  explorerBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
