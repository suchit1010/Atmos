import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { ProjectCard } from "@/components/ProjectCard";

const TABS = ["All", "Active", "Verified", "Draft"];

export default function ProjectsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { projects } = useAtmos();
  const [activeTab, setActiveTab] = useState("All");

  const filtered = projects.filter((p) => {
    if (activeTab === "All") return true;
    if (activeTab === "Active") return p.status === "minted";
    if (activeTab === "Verified") return p.status === "verified";
    if (activeTab === "Draft") return p.status === "draft";
    return true;
  });

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom + 70;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Projects</Text>
        <Pressable
          onPress={() => router.push("/project/create")}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="folder" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No projects yet</Text>
            <Pressable
              onPress={() => router.push("/project/create")}
              style={[styles.emptyBtn, { borderColor: colors.primary }]}
            >
              <Text style={[styles.emptyBtnText, { color: colors.primary }]}>Create First Project</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onPress={() => router.push({ pathname: "/verify/[id]", params: { id: p.id } })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 4,
  },
  tabText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  list: {
    padding: 20,
    gap: 0,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 4,
  },
  emptyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
