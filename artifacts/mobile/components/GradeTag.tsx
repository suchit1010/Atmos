import React from "react";
import { StyleSheet, Text, View } from "react-native";

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  S: { bg: "#FFD700", text: "#000" },
  A: { bg: "#0DFF6E", text: "#07110B" },
  B: { bg: "#00D4FF", text: "#07110B" },
  C: { bg: "#FF9900", text: "#000" },
};

export function GradeTag({ grade }: { grade: string }) {
  const colors = GRADE_COLORS[grade] ?? { bg: "#7AB891", text: "#07110B" };
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
