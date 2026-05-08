import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Project } from "@/context/AtmosContext";
import { GradeTag } from "./GradeTag";

const TYPE_ICONS: Record<string, string> = {
  biochar: "zap",
  agroforestry: "wind",
  solar: "sun",
  ev: "truck",
  building: "home",
  shipping: "anchor",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#7AB891",
  verifying: "#00D4FF",
  verified: "#FFD700",
  minted: "#0DFF6E",
  sold: "#7AB891",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  verifying: "Verifying",
  verified: "Verified",
  minted: "Active",
  sold: "Sold",
};

interface ProjectCardProps {
  project: Project;
  onPress?: () => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const colors = useColors();
  const icon = TYPE_ICONS[project.type] ?? "leaf";
  const statusColor = STATUS_COLORS[project.status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: colors.muted }]}>
          <Feather name={icon as any} size={18} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={[styles.location, { color: colors.mutedForeground }]} numberOfLines={1}>
            {project.location}
          </Text>
        </View>
        <View style={styles.right}>
          {project.grade && <GradeTag grade={project.grade} />}
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {STATUS_LABELS[project.status]}
        </Text>
        {project.co2 && (
          <Text style={[styles.co2, { color: colors.mutedForeground }]}>
            {project.co2.toFixed(2)} tCO₂e
          </Text>
        )}
        {project.confidence && (
          <Text style={[styles.confidence, { color: colors.primary }]}>
            {project.confidence}/100
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  location: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    flex: 1,
  },
  co2: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  confidence: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
});
