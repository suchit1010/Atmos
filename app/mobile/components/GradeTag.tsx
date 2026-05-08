import React from "react";
import { StyleSheet, Text, View } from "react-native";

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  S: { bg: "#FFD700", text: "#0C1E0C" },
  A: { bg: "#2ECC71", text: "#0C1E0C" },
  B: { bg: "#3498DB", text: "#FFFFFF" },
  C: { bg: "#E67E22", text: "#FFFFFF" },
  D: { bg: "#E74C3C", text: "#FFFFFF" },
};

export function GradeTag({ grade }: { grade: string }) {
  const colors = GRADE_COLORS[grade] ?? { bg: "#2ECC71", text: "#0C1E0C" };
  return (
    <View style={[styles.tag, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{grade}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
});
