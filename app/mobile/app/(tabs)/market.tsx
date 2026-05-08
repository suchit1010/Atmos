import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAtmos } from "@/context/AtmosContext";
import { AssetCard } from "@/components/AssetCard";

const FILTER_TABS = ["All", "Biochar", "Agroforestry", "Solar"];
const GRADE_FILTERS = ["All", "S", "A", "B"];

export default function MarketScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { assets } = useAtmos();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [gradeFilter, setGradeFilter] = useState("All");

  const filtered = assets.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || a.type === typeFilter.toLowerCase();
    const matchGrade = gradeFilter === "All" || a.grade === gradeFilter;
    return matchSearch && matchType && matchGrade;
  });

  const avgPrice = filtered.length > 0
    ? Math.round(filtered.reduce((s, a) => s + a.price, 0) / filtered.length)
    : 0;

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom + 70;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Marketplace</Text>
        <View style={styles.headerMeta}>
          <Text style={[styles.avgLabel, { color: colors.mutedForeground }]}>Avg. Price</Text>
          <Text style={[styles.avgPrice, { color: colors.secondary }]}>₹{avgPrice.toLocaleString("en-IN")}/t</Text>
        </View>
      </View>

      <View style={[styles.searchRow, { paddingHorizontal: 20 }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search carbon assets..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
        <Pressable style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="sliders" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={[styles.filterRow, { paddingHorizontal: 20 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTER_TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setTypeFilter(tab)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: typeFilter === tab ? colors.primary : colors.card,
                  borderColor: typeFilter === tab ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.filterChipText, { color: typeFilter === tab ? colors.primaryForeground : colors.foreground }]}>
                {tab}
              </Text>
            </Pressable>
          ))}
          <View style={{ width: 8 }} />
          {GRADE_FILTERS.map((g) => (
            <Pressable
              key={"grade_" + g}
              onPress={() => setGradeFilter(g)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: gradeFilter === g ? colors.secondary : colors.card,
                  borderColor: gradeFilter === g ? colors.secondary : colors.border,
                },
              ]}
            >
              <Text style={[styles.filterChipText, { color: gradeFilter === g ? colors.secondaryForeground : colors.foreground }]}>
                {g === "All" ? "All Grades" : `Grade ${g}`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            showBuy
            onPress={() =>
              router.push({ pathname: "/payment/[id]", params: { id: asset.id } })
            }
          />
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Feather name="search" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No assets found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
  },
  headerMeta: {
    alignItems: "flex-end",
  },
  avgLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  avgPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 20,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 80,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
});
