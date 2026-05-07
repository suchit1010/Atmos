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
const PRICE_DATA = [185, 192, 188, 201, 215, 209, 220, 223];

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { projects, totalCO2, totalValue } = useAtmos();

  const activeProjects = projects.filter((p) => ["verifying", "verified", "minted"].includes(p.status)).length;
  const pendingPayments = 3;
  const creditsRetired = 120;

  const recentActivity = [
    { id: "1", type: "minted", label: "Asset Created", sub: "Biochar Batch #824-018", value: "2.46 tCO₂e", date: "May 20" },
    { id: "2", type: "payment", label: "Payment Received", sub: "Carbon Credit Sale", value: "+₹12,880", date: "May 18" },
    { id: "3", type: "verified", label: "Project Verified", sub: "Agroforestry Plot A7", value: "1.88 tCO₂e", date: "May 16" },
  ];

  const activityIcons: Record<string, string> = {
    minted: "check-circle",
    payment: "dollar-sign",
    verified: "shield",
  };

  const activityColors: Record<string, string> = {
    minted: colors.primary,
    payment: "#00D4FF",
    verified: "#FFD700",
  };

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom + 70;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Hi, {user?.name?.split(" ")[0] ?? "User"}</Text>
          <Text style={[styles.goal, { color: colors.foreground }]}>Goal: 10 CO₂</Text>
        </View>
        <Pressable
          style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <Feather name="bell" size={20} color={colors.foreground} />
          <View style={[styles.notifDot, { backgroundColor: colors.primary }]} />
        </Pressable>
      </View>

      <AtmosCard style={styles.heroCard}>
        <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>Your Carbon Assets</Text>
        <Text style={[styles.heroValue, { color: colors.foreground }]}>
          {totalCO2.toFixed(2)}{" "}
          <Text style={[styles.heroUnit, { color: colors.mutedForeground }]}>tCO₂e</Text>
        </Text>
        <View style={styles.heroSubRow}>
          <Text style={[styles.heroSubValue, { color: colors.secondary }]}>
            ₹{totalValue.toLocaleString("en-IN")} / ${(totalValue / 84).toFixed(0)} USDC
          </Text>
        </View>
        <View style={styles.heroDelta}>
          <Feather name="trending-up" size={14} color={colors.primary} />
          <Text style={[styles.deltaText, { color: colors.primary }]}>+₹1,610 (+2.4%) 24h</Text>
        </View>
        <SparklineChart data={SPARKLINE_DATA} width={280} height={60} />
      </AtmosCard>

      <View style={styles.statsRow}>
        {[
          { label: "Active Projects", value: String(activeProjects), icon: "folder", color: colors.primary },
          { label: "Pending Payments", value: String(pendingPayments), icon: "clock", color: colors.secondary },
          { label: "Credits Retired", value: String(creditsRetired), icon: "award", color: "#FFD700" },
        ].map((s) => (
          <AtmosCard key={s.label} style={styles.statCard} padding={12}>
            <Feather name={s.icon as any} size={18} color={s.color} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </AtmosCard>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
          <Pressable onPress={() => router.push("/(tabs)/projects")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>View All</Text>
          </Pressable>
        </View>
        {recentActivity.map((a) => (
          <AtmosCard key={a.id} style={styles.activityCard} padding={12}>
            <View style={[styles.activityIcon, { backgroundColor: colors.muted }]}>
              <Feather name={activityIcons[a.type] as any} size={16} color={activityColors[a.type]} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={[styles.activityLabel, { color: colors.foreground }]}>{a.label}</Text>
              <Text style={[styles.activitySub, { color: colors.mutedForeground }]}>{a.sub}</Text>
            </View>
            <View style={styles.activityRight}>
              <Text style={[styles.activityValue, { color: colors.primary }]}>{a.value}</Text>
              <Text style={[styles.activityDate, { color: colors.mutedForeground }]}>{a.date}</Text>
            </View>
          </AtmosCard>
        ))}
      </View>

      <Pressable
        style={[styles.createBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/project/create")}
      >
        <Feather name="plus" size={20} color={colors.primaryForeground} />
        <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>
          Create New Carbon Asset
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  goal: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  heroCard: {
    gap: 4,
  },
  heroLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  heroValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
  },
  heroUnit: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
  },
  heroSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroSubValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  heroDelta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deltaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    gap: 4,
    alignItems: "center",
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textAlign: "center",
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  seeAll: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  activitySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  activityRight: {
    alignItems: "flex-end",
  },
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
    marginTop: 4,
  },
  createBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
