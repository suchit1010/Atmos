import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { AtmosCard } from "@/components/AtmosCard";

const SETTINGS_GROUPS = [
  {
    title: "Account",
    items: [
      { icon: "user", label: "Account Settings", sub: "Name, email, phone" },
      { icon: "credit-card", label: "Wallet & Payments", sub: "7xKp...9mNq" },
      { icon: "shield", label: "Privacy & Security", sub: "ZK proof settings" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "help-circle", label: "Support", sub: "Help center & FAQ" },
      { icon: "share-2", label: "Refer & Earn", sub: "Share to earn rewards" },
    ],
  },
];

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
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom + 70;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>

      <AtmosCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.muted, borderColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.foreground }]}>{user?.name}</Text>
            <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email}</Text>
            <Text style={[styles.phone, { color: colors.mutedForeground }]}>{user?.phone}</Text>
          </View>
          <Pressable style={[styles.editBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="edit-3" size={16} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={[styles.kycRow, { borderTopColor: colors.border }]}>
          <View style={[styles.kycBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
            <Feather name="check-circle" size={14} color={colors.primary} />
            <Text style={[styles.kycText, { color: colors.primary }]}>KYC Verified</Text>
          </View>
          <View style={[styles.walletBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.walletText, { color: colors.mutedForeground }]}>
              {user?.walletAddress}
            </Text>
          </View>
        </View>
      </AtmosCard>

      <AtmosCard style={styles.statsRow} padding={14}>
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
            {i < arr.length - 1 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </AtmosCard>

      {SETTINGS_GROUPS.map((group) => (
        <View key={group.title} style={styles.settingsGroup}>
          <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{group.title}</Text>
          <AtmosCard padding={0}>
            {group.items.map((item, i) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.settingsItem,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: i < group.items.length - 1 ? 1 : 0,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={[styles.itemIcon, { backgroundColor: colors.muted }]}>
                  <Feather name={item.icon as any} size={16} color={colors.primary} />
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
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
  },
  profileCard: {
    gap: 12,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  email: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  phone: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  kycRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
    flexWrap: "wrap",
  },
  kycBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  kycText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  walletBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  walletText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  settingsGroup: {
    gap: 8,
  },
  groupTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  itemSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 8,
  },
  logoutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
