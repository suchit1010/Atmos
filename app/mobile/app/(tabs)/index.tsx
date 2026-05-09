import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AtmosCard } from "@/components/AtmosCard";
import { SparklineChart } from "@/components/SparklineChart";
import { ProjectCard } from "@/components/ProjectCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useAtmos } from "@/context/AtmosContext";

const SPARKLINE_DATA = [1.2, 1.5, 1.3, 1.8, 2.1, 1.9, 2.3, 2.46];

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { projects, payments, totalCO2, totalValue } = useAtmos();

  const activeProjects = projects.filter((p) =>
    ["verifying", "verified", "minted"].includes(p.status)
  ).length;

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom + 72;

  const pendingPayments = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const creditsRetired = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.quantity, 0);

  const projectEvents = projects
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 3)
    .map((p) => {
      const isMinted = p.status === "minted";
      const isVerified = p.status === "verified";
      return {
        id: `proj-${p.id}`,
        icon: (isMinted ? "check-circle" : isVerified ? "shield" : "clock") as const,
        label: isMinted ? "Asset Minted" : isVerified ? "Project Verified" : "Project Submitted",
        sub: p.name,
        value: p.co2 ? `${p.co2.toFixed(2)} tCO₂e` : "",
        color: isMinted ? "#2ECC71" : isVerified ? "#F39C12" : "#95A5A6",
        date: new Date(p.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      };
    });

  const paymentEvents = payments
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 2)
    .map((p) => ({
      id: `pay-${p.id}`,
      icon: "dollar-sign" as const,
      label: p.status === "completed" ? "Payment Received" : "Payment Pending",
      sub: p.assetName,
      value: `${p.status === "completed" ? "+" : ""}₹${p.amount.toLocaleString("en-IN")}`,
      color: p.status === "completed" ? "#2ECC71" : "#F39C12",
      date: new Date(p.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    }));

  const recentActivity = [...paymentEvents, ...projectEvents].slice(0, 4);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            Hi, {user?.name?.split(" ")[0] ?? "User"}
          </Text>
        </View>
        <View style={[styles.goalPill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.goalText, { color: colors.mutedForeground }]}>Goal: </Text>
          <Text style={[styles.goalValue, { color: colors.primary }]}>10 CO₂</Text>
        </View>
      </View>

      {/* Hero card */}
      <AtmosCard style={styles.heroCard}>
        <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>Your Carbon Assets</Text>
        <Text style={[styles.heroValue, { color: colors.foreground }]}>
          {totalCO2.toFixed(2)}{" "}
          <Text style={[styles.heroUnit, { color: colors.mutedForeground }]}>tCO₂e</Text>
        </Text>
        <Text style={[styles.heroSub, { color: colors.primary }]}>
          +₹{totalValue.toLocaleString("en-IN")} / +${(totalValue / 84).toFixed(0)} USDC
        </Text>
        <Text style={[styles.heroDelta, { color: colors.mutedForeground }]}>
          24h change:{" "}
          <Text style={{ color: colors.primary }}>+₹610 (+2.4%)</Text>
        </Text>
        <SparklineChart data={SPARKLINE_DATA} width={300} height={64} />
      </AtmosCard>

      {/* Stat cards */}
      <View style={styles.statsRow}>
        <AtmosCard style={styles.statCard} padding={14}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{activeProjects}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active{"\n"}Projects</Text>
        </AtmosCard>
        <AtmosCard style={styles.statCard} padding={14}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>₹{pendingPayments.toLocaleString("en-IN")}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Pending{"\n"}Payments</Text>
        </AtmosCard>
        <AtmosCard style={styles.statCard} padding={14}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{creditsRetired}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Credits{"\n"}Retired</Text>
        </AtmosCard>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
          <Pressable onPress={() => router.push("/(tabs)/projects")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>View All</Text>
          </Pressable>
        </View>

        {recentActivity.length === 0 ? (
          <View style={[styles.activityRow, { borderBottomColor: colors.border }]}> 
            <Text style={[styles.activitySub, { color: colors.mutedForeground }]}>No activity yet. Start by creating a project.</Text>
          </View>
        ) : recentActivity.map((a) => (
          <Pressable key={a.id} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
            <View style={[styles.activityRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.activityDot, { backgroundColor: a.color + "22" }]}>
                <Feather name={a.icon} size={15} color={a.color} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityLabel, { color: colors.foreground }]}>{a.label}</Text>
                <Text style={[styles.activitySub, { color: colors.mutedForeground }]}>{a.sub}</Text>
              </View>
              <View style={styles.activityRight}>
                {a.value ? (
                  <Text style={[styles.activityValue, { color: colors.primary }]}>{a.value}</Text>
                ) : null}
                <Text style={[styles.activityDate, { color: colors.mutedForeground }]}>{a.date}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Create CTA */}
      <Pressable
        style={({ pressed }) => [
          styles.createBtn,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={() => router.push("/project/create")}
      >
        <Feather name="plus" size={18} color={colors.primaryForeground} />
        <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>
          Create New Carbon Asset
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
  },
  goalPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  goalText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  goalValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  heroCard: { gap: 4 },
  heroLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  heroValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    lineHeight: 48,
  },
  heroUnit: {
    fontFamily: "Inter_400Regular",
    fontSize: 20,
  },
  heroSub: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  heroDelta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    gap: 4,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 15,
  },
  section: { gap: 0 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  seeAll: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityDot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activityInfo: { flex: 1 },
  activityLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  activitySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  activityRight: { alignItems: "flex-end" },
  activityValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  activityDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  createBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
