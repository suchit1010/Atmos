import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { AtmosCard } from "@/components/AtmosCard";

const KYC_STATUS_COLORS: Record<string, string> = {
  verified: "#2ECC71",
  pending: "#F39C12",
  not_started: "#E74C3C",
  rejected: "#E74C3C",
};

const KYC_STATUS_LABELS: Record<string, string> = {
  verified: "Verified",
  pending: "Pending",
  not_started: "Not Started",
  rejected: "Rejected",
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const initials = (user?.name ?? "MG")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom + 72;

  const kycItems = [
    {
      key: "aadhaar",
      label: "Aadhaar Card",
      icon: "credit-card" as const,
      status: user?.kyc?.aadhaar?.status ?? "not_started",
      route: "/kyc/aadhaar",
    },
    {
      key: "pan",
      label: "PAN Card",
      icon: "file-text" as const,
      status: user?.kyc?.pan?.status ?? "not_started",
      route: "/kyc/pan",
    },
    {
      key: "farmDoc",
      label: "Farm Documents",
      icon: "map" as const,
      status: user?.kyc?.farmDoc?.status ?? "not_started",
      route: "/kyc/farm-doc",
    },
  ];

  const allVerified = kycItems.every((k) => k.status === "verified");
  const anyPending = kycItems.some((k) => k.status === "pending");

  const overallStatus = allVerified ? "verified" : anyPending ? "pending" : "not_started";

  const SETTINGS_GROUPS = [
    {
      title: "Account",
      items: [
        { icon: "user" as const, label: "Account Settings", sub: "Name, email, phone" },
        { icon: "credit-card" as const, label: "Wallet & Payments", sub: user?.walletAddress ?? "Not connected" },
        { icon: "shield" as const, label: "Privacy & Security", sub: "ZK proof settings" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "help-circle" as const, label: "Support", sub: "Help center & FAQ" },
        { icon: "share-2" as const, label: "Refer & Earn", sub: "Share to earn rewards" },
      ],
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Profile & Settings</Text>

      {/* Profile card */}
      <AtmosCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.foreground }]}>{user?.name}</Text>
            <Text style={[styles.contact, { color: colors.mutedForeground }]}>{user?.email}</Text>
            <Text style={[styles.contact, { color: colors.mutedForeground }]}>{user?.phone}</Text>
          </View>
        </View>
        <View style={[styles.kycBadgeRow, { borderTopColor: colors.border }]}>
          <View style={[styles.kycBadge, {
            backgroundColor: KYC_STATUS_COLORS[overallStatus] + "22",
            borderColor: KYC_STATUS_COLORS[overallStatus],
          }]}>
            <Feather
              name={overallStatus === "verified" ? "check-circle" : "alert-circle"}
              size={13}
              color={KYC_STATUS_COLORS[overallStatus]}
            />
            <Text style={[styles.kycBadgeText, { color: KYC_STATUS_COLORS[overallStatus] }]}>
              KYC {KYC_STATUS_LABELS[overallStatus]}
            </Text>
          </View>
          <View style={[styles.walletChip, { backgroundColor: colors.muted }]}>
            <Feather name="link" size={11} color={colors.mutedForeground} />
            <Text style={[styles.walletText, { color: colors.mutedForeground }]}>
              {user?.walletAddress}
            </Text>
          </View>
        </View>
      </AtmosCard>

      {/* Stats */}
      <AtmosCard style={styles.statsCard} padding={14}>
        {[
          { label: "Projects", value: "3" },
          { label: "Assets", value: "3" },
          { label: "CO₂ Offset", value: "4.34t" },
        ].map((s, i, arr) => (
          <React.Fragment key={s.label}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={[styles.statDiv, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </AtmosCard>

      {/* KYC Verification */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>KYC VERIFICATION</Text>
        <AtmosCard padding={0}>
          {kycItems.map((item, i) => {
            const statusColor = KYC_STATUS_COLORS[item.status];
            return (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.route as any)}
                style={({ pressed }) => [
                  styles.kycItem,
                  {
                    borderBottomWidth: i < kycItems.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={[styles.itemIcon, { backgroundColor: statusColor + "22" }]}>
                  <Feather name={item.icon} size={16} color={statusColor} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.itemSub, { color: statusColor }]}>
                    {KYC_STATUS_LABELS[item.status]}
                  </Text>
                </View>
                <Feather
                  name={item.status === "verified" ? "check-circle" : "chevron-right"}
                  size={16}
                  color={item.status === "verified" ? colors.primary : colors.mutedForeground}
                />
              </Pressable>
            );
          })}
        </AtmosCard>
      </View>

      {/* Settings */}
      {SETTINGS_GROUPS.map((group) => (
        <View key={group.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{group.title.toUpperCase()}</Text>
          <AtmosCard padding={0}>
            {group.items.map((item, i) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.kycItem,
                  {
                    borderBottomWidth: i < group.items.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={[styles.itemIcon, { backgroundColor: colors.muted }]}>
                  <Feather name={item.icon} size={16} color={colors.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </AtmosCard>
        </View>
      ))}

      {/* Sign out */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutBtn,
          { borderColor: colors.destructive, opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={logout}
      >
        <Feather name="log-out" size={16} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 14 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  profileCard: { gap: 12 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 22 },
  profileInfo: { flex: 1, gap: 2 },
  name: { fontFamily: "Inter_700Bold", fontSize: 17 },
  contact: { fontFamily: "Inter_400Regular", fontSize: 12 },
  kycBadgeRow: {
    flexDirection: "row", gap: 8, borderTopWidth: 1,
    paddingTop: 12, flexWrap: "wrap",
  },
  kycBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  kycBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  walletChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  walletText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statsCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  statDiv: { width: 1, height: 28 },
  section: { gap: 8 },
  sectionTitle: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.5 },
  kycItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  itemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemInfo: { flex: 1 },
  itemLabel: { fontFamily: "Inter_500Medium", fontSize: 14 },
  itemSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginTop: 4,
  },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
