import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
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
import { GradeTag } from "@/components/GradeTag";

export default function AssetCreatedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, assets, updateProject } = useAtmos();
  const project = projects.find((p) => p.id === id);

  function generateBase58Like(seed: string): string {
    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    let out = "";
    let state = hash >>> 0;
    for (let i = 0; i < 44; i++) {
      state = Math.imul(state ^ (i * 2654435761), 2246822519) >>> 0;
      out += alphabet[state % alphabet.length];
    }
    return out;
  }

  const checkScale = useRef(new Animated.Value(0)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const [minted, setMinted] = useState(false);
  const [loading, setLoading] = useState(false);
  const mintAddressRef = useRef(
    project?.mintAddress ?? generateBase58Like(String(id ?? "project"))
  );
  const mintAddress = mintAddressRef.current;

  const alreadyMinted = project?.status === "minted";

  useEffect(() => {
    if (alreadyMinted) {
      setMinted(true);
      animateIn();
      return;
    }
    mintAsset();
  }, []);

  async function mintAsset() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    updateProject(id!, { status: "minted", mintAddress });
    setLoading(false);
    setMinted(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    animateIn();
  }

  async function handleOpenMintExplorer() {
    const url = `https://explorer.solana.com/address/${encodeURIComponent(mintAddress)}?cluster=devnet`;
    try {
      await Linking.openURL(url);
    } catch {
      // no-op fallback for unsupported environments
    }
  }

  function animateIn() {
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
      Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const assetDetails = [
    { label: "Name", value: project?.name ?? "Biochar Batch #824-018" },
    { label: "Amount", value: `${project?.co2?.toFixed(2) ?? "2.46"} tCO₂e` },
    { label: "Grade", value: project?.grade ?? "A", isGrade: true },
    { label: "Methodology", value: "VM0044 (Biochar)" },
    { label: "Vintage", value: "2026" },
    { label: "On-chain", value: "Solana Devnet" },
    { label: "Proof Hash", value: project?.proofHash ?? "zk_79a2b1c..." },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.replace("/(tabs)" as any)} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Asset Creation</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.successCenter}>
          <Animated.View
            style={[
              styles.checkOrb,
              {
                backgroundColor: minted ? colors.primary + "22" : colors.muted,
                borderColor: minted ? colors.primary : colors.border,
                transform: [{ scale: checkScale }],
              },
            ]}
          >
            {minted ? (
              <Feather name="check-circle" size={52} color={colors.primary} />
            ) : (
              <Feather name="loader" size={40} color={colors.secondary} />
            )}
          </Animated.View>

          {minted ? (
            <>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>
                Your carbon asset{"\n"}is created!
              </Text>
              <View style={[styles.mintedBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
                <Feather name="check" size={12} color={colors.primary} />
                <Text style={[styles.mintedText, { color: colors.primary }]}>Minted on Solana Devnet</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Minting Asset...</Text>
              <Text style={[styles.mintSub, { color: colors.mutedForeground }]}>Creating SPL token on Solana</Text>
            </>
          )}
        </View>

        {minted && (
          <Animated.View style={{ opacity: cardFade, gap: 16 }}>
            <AtmosCard style={styles.detailsCard} padding={0}>
              {assetDetails.map((item, i) => (
                <View
                  key={item.label}
                  style={[
                    styles.detailRow,
                    {
                      borderBottomWidth: i < assetDetails.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                  {item.isGrade ? (
                    <GradeTag grade={item.value} />
                  ) : (
                    <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                      {item.value}
                    </Text>
                  )}
                </View>
              ))}
            </AtmosCard>

            <AtmosCard style={styles.mintCard}>
              <View style={styles.mintRow}>
                <Feather name="link" size={16} color={colors.secondary} />
                <Text style={[styles.mintLabel, { color: colors.mutedForeground }]}>Mint Address</Text>
              </View>
              <Text style={[styles.mintAddress, { color: colors.secondary }]}>{mintAddress}</Text>
              <Pressable onPress={handleOpenMintExplorer} style={[styles.explorerBtn, { borderColor: colors.secondary }]}> 
                <Feather name="external-link" size={14} color={colors.secondary} />
                <Text style={[styles.explorerBtnText, { color: colors.secondary }]}>View Mint on Solana Explorer</Text>
              </Pressable>
            </AtmosCard>
          </Animated.View>
        )}
      </ScrollView>

      {minted && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
          <View style={styles.footerBtns}>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.primary, flex: 1 }]}
              onPress={() => router.replace("/(tabs)/market" as any)}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>List on Market</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.primary, flex: 1 }]}
              onPress={() => router.push({ pathname: "/payment/[id]", params: { id: id! } })}
            >
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Buy with Dodo</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.secondary, flex: 1 }]}
              onPress={() => router.replace("/(tabs)/portfolio" as any)}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.secondary }]}>View Portfolio</Text>
            </Pressable>
          </View>
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
    gap: 20,
  },
  successCenter: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
  },
  checkOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    textAlign: "center",
    lineHeight: 32,
  },
  mintedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  mintedText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  mintSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  detailsCard: {
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  detailValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    maxWidth: 200,
    textAlign: "right",
  },
  mintCard: {
    gap: 8,
  },
  mintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mintLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  mintAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  explorerBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
  },
  explorerBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
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
  footerBtns: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
