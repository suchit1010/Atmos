import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAtmos } from "@/context/AtmosContext";
import { SparklineChart } from "@/components/SparklineChart";
import { AtmosCard } from "@/components/AtmosCard";
import { GradeTag } from "@/components/GradeTag";

const PORTFOLIO_TABS = ["Holdings", "History", "Performance"];

const HISTORY_SPARKLINE = [95, 102, 98, 110, 115, 108, 120, 130, 127, 135];

export default function PortfolioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { assets, payments, totalCO2, totalValue } = useAtmos();
  const [activeTab, setActiveTab] = useState("Holdings");

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom + 70;

  const myAssets = assets.filter((a) => a.seller === "Self");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Portfolio</Text>

      <AtmosCard style={styles.summaryCard}>
        <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Assets</Text>
        <Text style={[styles.summaryValue, { color: colors.foreground }]}>
          {totalCO2.toFixed(2)} tCO₂e
        </Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryUsd, { color: colors.secondary }]}>
            ₹{totalValue.toLocaleString("en-IN")} USDC
          </Text>
          <View style={styles.deltaPill}>
            <Feather name="trending-up" size={12} color={colors.primary} />
            <Text style={[styles.deltaText, { color: colors.primary }]}>+₹450 (+2.4%) 24h</Text>
          </View>
        </View>
        <SparklineChart data={HISTORY_SPARKLINE} width={300} height={70} />
        <View style={styles.summaryFooter}>
          <Text style={[styles.footerStat, { color: colors.mutedForeground }]}>
            Avg. Price: <Text style={{ color: colors.foreground }}>₹1,247/t</Text>
          </Text>
          <Text style={[styles.footerStat, { color: colors.mutedForeground }]}>
            {myAssets.length} Assets
          </Text>
        </View>
      </AtmosCard>

      <View style={styles.tabBar}>
        {PORTFOLIO_TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab ? colors.primary : colors.card,
                borderColor: activeTab === tab ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primaryForeground : colors.mutedForeground }]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "Holdings" && (
        <View style={styles.holdingsList}>
          {myAssets.map((asset) => {
            const pnl = ((asset.price - 1100) / 1100) * 100;
            const isPos = pnl >= 0;
            return (
              <AtmosCard key={asset.id} style={styles.holdingCard} padding={14}>
                <View style={styles.holdingRow}>
                  <View style={styles.holdingLeft}>
                    <View style={styles.holdingTitleRow}>
                      <GradeTag grade={asset.grade} />
                      <Text style={[styles.holdingName, { color: colors.foreground }]} numberOfLines={1}>
                        {asset.name}
                      </Text>
                    </View>
                    <Text style={[styles.holdingMeta, { color: colors.mutedForeground }]}>
                      {asset.amount} tCO₂e · {asset.vintage}
                    </Text>
                  </View>
                  <View style={styles.holdingRight}>
                    <Text style={[styles.holdingValue, { color: colors.foreground }]}>
                      ₹{(asset.price * asset.amount).toLocaleString("en-IN")}
                    </Text>
                    <Text style={[styles.holdingPnl, { color: isPos ? colors.primary : colors.destructive }]}>
                      {isPos ? "+" : ""}{pnl.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <SparklineChart
                  data={[95, 100, 98, 105, 110, asset.price / 14]}
                  width={260}
                  height={36}
                  positive={isPos}
                />
              </AtmosCard>
            );
          })}
        </View>
      )}

      {activeTab === "History" && (
        <View style={styles.holdingsList}>
          {payments.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Feather name="clock" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions yet</Text>
            </View>
          ) : (
            payments.map((p) => (
              <AtmosCard key={p.id} style={styles.holdingCard} padding={14}>
                <View style={styles.holdingRow}>
                  <View>
                    <Text style={[styles.holdingName, { color: colors.foreground }]}>{p.assetName}</Text>
                    <Text style={[styles.holdingMeta, { color: colors.mutedForeground }]}>
                      {new Date(p.createdAt).toLocaleDateString()} · {p.quantity} units
                    </Text>
                  </View>
                  <View style={styles.holdingRight}>
                    <Text style={[styles.holdingValue, { color: colors.primary }]}>
                      ₹{p.amount.toLocaleString("en-IN")}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: p.status === "completed" ? colors.primary + "22" : colors.muted }]}>
                      <Text style={[styles.statusBadgeText, { color: p.status === "completed" ? colors.primary : colors.mutedForeground }]}>
                        {p.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </AtmosCard>
            ))
          )}
        </View>
      )}

      {activeTab === "Performance" && (
        <AtmosCard style={styles.perfCard}>
          {[
            { label: "Total Carbon Offset", value: `${totalCO2.toFixed(2)} tCO₂e`, icon: "wind" },
            { label: "Projects Created", value: String(myAssets.length), icon: "folder" },
            { label: "Credits Minted", value: `${myAssets.reduce((s, a) => s + a.amount, 0).toFixed(1)} t`, icon: "check-circle" },
            { label: "Avg. Confidence Score", value: "87/100", icon: "shield" },
            { label: "ZK Proofs Generated", value: String(myAssets.length), icon: "lock" },
          ].map((item) => (
            <View key={item.label} style={[styles.perfRow, { borderBottomColor: colors.border }]}>
              <Feather name={item.icon as any} size={16} color={colors.primary} />
              <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.perfValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </AtmosCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
  },
  summaryCard: {
    gap: 6,
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  summaryValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryUsd: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  deltaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deltaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  summaryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  footerStat: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  tabText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  holdingsList: {
    gap: 10,
  },
  holdingCard: {
    gap: 8,
  },
  holdingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  holdingLeft: {
    flex: 1,
    gap: 3,
  },
  holdingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  holdingName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    flex: 1,
  },
  holdingMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  holdingRight: {
    alignItems: "flex-end",
    gap: 3,
  },
  holdingValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  holdingPnl: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textTransform: "capitalize",
  },
  emptyHistory: {
    alignItems: "center",
    gap: 10,
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  perfCard: {
    gap: 0,
  },
  perfRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  perfLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    flex: 1,
  },
  perfValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
