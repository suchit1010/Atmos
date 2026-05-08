import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Asset } from "@/context/AtmosContext";
import { GradeTag } from "./GradeTag";

interface AssetCardProps {
  asset: Asset;
  onPress?: () => void;
  showBuy?: boolean;
}

export function AssetCard({ asset, onPress, showBuy = true }: AssetCardProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {asset.name}
          </Text>
          <GradeTag grade={asset.grade} />
        </View>
        <Text style={[styles.location, { color: colors.mutedForeground }]}>
          {asset.location}
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            ₹{asset.price.toLocaleString("en-IN")}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>/ tCO₂e</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {asset.amount} t
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Amount</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {asset.available}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Available</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.tag, { backgroundColor: colors.muted }]}>
          <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
            {asset.vintage}
          </Text>
        </View>
        <View style={[styles.tag, { backgroundColor: colors.muted }]}>
          <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
            Solana Devnet
          </Text>
        </View>
        {showBuy && (
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              styles.buyBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.buyText, { color: colors.primaryForeground }]}>Buy</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  header: {
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    flex: 1,
  },
  location: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  stats: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    gap: 2,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  buyBtn: {
    marginLeft: "auto",
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
  },
  buyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
