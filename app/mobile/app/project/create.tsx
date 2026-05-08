import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const PROJECT_TYPES = [
  { id: "biochar", label: "Biochar Production", icon: "zap", description: "Biomass to biochar carbon sequestration", color: "#0DFF6E" },
  { id: "agroforestry", label: "Agroforestry", icon: "wind", description: "Tree planting and land restoration", color: "#00D4FF" },
  { id: "solar", label: "Solar Energy", icon: "sun", description: "Renewable solar power generation", color: "#FFD700" },
  { id: "ev", label: "EV Fleet", icon: "truck", description: "Electric vehicle emissions offset", color: "#FF9900" },
  { id: "building", label: "Building Retrofit", icon: "home", description: "Energy-efficient building upgrades", color: "#E040FB" },
  { id: "shipping", label: "Shipping", icon: "anchor", description: "Maritime emissions reduction", color: "#00BCD4" },
  { id: "aviation", label: "Aviation", icon: "navigation", description: "Sustainable aviation credits", color: "#FF5252" },
  { id: "city", label: "City Initiative", icon: "globe", description: "Municipal sustainability projects", color: "#69F0AE" },
  { id: "individual", label: "Individual Action", icon: "user", description: "Personal carbon offset actions", color: "#B2FF59" },
];

export default function CreateProjectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  function handleNext() {
    if (!selected) return;
    router.push({ pathname: "/project/capture", params: { type: selected } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>Select Project Type</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Choose the type of climate action
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {PROJECT_TYPES.map((type) => (
          <Pressable
            key={type.id}
            onPress={() => setSelected(type.id)}
            style={({ pressed }) => [
              styles.typeCard,
              {
                backgroundColor: selected === type.id ? colors.card : colors.card,
                borderColor: selected === type.id ? type.color : colors.border,
                borderWidth: selected === type.id ? 2 : 1,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.typeIcon, { backgroundColor: type.color + "22" }]}>
              <Feather name={type.icon as any} size={24} color={type.color} />
            </View>
            <Text style={[styles.typeName, { color: colors.foreground }]}>{type.label}</Text>
            <Text style={[styles.typeDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
              {type.description}
            </Text>
            {selected === type.id && (
              <View style={[styles.checkMark, { backgroundColor: type.color }]}>
                <Feather name="check" size={12} color="#07110B" />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {selected && (
        <View style={[styles.nextBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
              Next: Capture Data
            </Text>
            <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  typeCard: {
    width: "47%",
    borderRadius: 16,
    padding: 14,
    gap: 6,
    position: "relative",
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  typeName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  typeDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
  },
  checkMark: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  nextBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
