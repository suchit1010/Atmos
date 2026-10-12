import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card, StatusBadge, GradeBadge } from '../../components/common';
import { ProjectsAPI, ZkAPI } from '../../services/api';

export function ProjectDetailScreen({ route, navigation }: any) {
  const { projectId } = route.params || {};
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    verification: true,
    blockchain: false,
    satellite: false,
  });

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => ProjectsAPI.get(projectId).then(r => r.data),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </LinearGradient>
    );
  }

  if (error || !project) {
    return (
      <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[Typography.labelMd, { color: Colors.error }]}>Project not found</Text>
          <TouchableOpacity
            style={[styles.button, { marginTop: Spacing.lg }]}
            onPress={() => navigation?.goBack()}
          >
            <Text style={[Typography.labelMd, { color: Colors.primary }]}>← Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const toggleSection = (key: string) => {
    setExpandedSections(s => ({ ...s, [key]: !s[key] }));
  };

  const solscanUrl = `https://solscan.io/tx/${project.mint_address}?cluster=devnet`;
  const explorerUrl = `https://explorer.atmos.app/project/${projectId}`;

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
              <Text style={{ fontSize: 20 }}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Project Details</Text>
              <Text style={[Typography.labelMd, { color: Colors.text }]} numberOfLines={1}>
                {project.name}
              </Text>
            </View>
          </View>

          {/* Project Hero */}
          <Card style={{ marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: 4 }]}>
                  {project.entity_type?.toUpperCase()}
                </Text>
                <Text style={[Typography.display2xl, { color: Colors.primary, marginBottom: 2 }]}>
                  {parseFloat(project.co2e_estimated || 0).toFixed(2)}
                </Text>
                <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>
                  tCO₂e Estimated
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {project.grade && <GradeBadge grade={project.grade} size="lg" />}
                <View style={{ marginTop: Spacing.sm }}>
                  <StatusBadge status={project.status} />
                </View>
              </View>
            </View>

            <View style={[styles.divider, { marginVertical: Spacing.md }]} />

            <View style={{ gap: Spacing.sm }}>
              <Row label="Location" value={`${project.lat?.toFixed(2)}°N, ${project.lng?.toFixed(2)}°E`} />
              <Row label="Area" value={`${project.area_ha} hectares`} />
              <Row label="Created" value={new Date(project.created_at).toLocaleDateString()} />
            </View>
          </Card>

          {/* AI Verification Section */}
          <CollapsibleSection
            title="🤖 AI Verification Results"
            expanded={expandedSections.verification}
            onToggle={() => toggleSection('verification')}
          >
            <View style={{ gap: Spacing.md }}>
              <InfoBox
                label="Confidence Score"
                value={`${project.confidence_score}%`}
                color={project.confidence_score >= 80 ? Colors.success : Colors.warning}
                description="How confident the AI is in this estimate"
              />

              <InfoBox
                label="Grade"
                value={project.grade}
                color={Colors.primary}
                description="Quality assessment of this project"
              />

              <InfoBox
                label="Fraud Risk"
                value={project.fraud_risk_level || 'Low'}
                color={project.fraud_risk_level === 'high' ? Colors.error : Colors.success}
                description="Detected anomalies or risks"
              />

              {project.metadata?.verificationNotes && (
                <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: Colors.border }}>
                  <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>Notes</Text>
                  <Text style={[Typography.bodySm, { color: Colors.text, marginTop: 4 }]}>
                    {project.metadata.verificationNotes}
                  </Text>
                </View>
              )}
            </View>
          </CollapsibleSection>

          {/* Blockchain Settlement */}
          <CollapsibleSection
            title="🔗 Blockchain Settlement"
            expanded={expandedSections.blockchain}
            onToggle={() => toggleSection('blockchain')}
          >
            <View style={{ gap: Spacing.md }}>
              <InfoBox
                label="Status"
                value={project.status?.toUpperCase()}
                color={project.status === 'verified' ? Colors.success : Colors.warning}
              />

              {project.proof_hash && (
                <>
                  <View style={{ backgroundColor: Colors.bgCard, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: Colors.border }}>
                    <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.xs }]}>
                      ZK Proof Hash
                    </Text>
                    <Text style={[Typography.monoSm, { color: Colors.primary }]}>
                      {project.proof_hash}
                    </Text>
                    <TouchableOpacity
                      style={[styles.linkButton, { marginTop: Spacing.sm }]}
                      onPress={() => {
                        if (project.proof_hash) {
                          Linking.openURL(
                            `https://explorer.atmos.app/proof/${project.proof_hash}?cluster=devnet`
                          ).catch(() => Alert.alert('Info', `Proof: ${project.proof_hash}`));
                        }
                      }}
                    >
                      <Text style={[Typography.labelSm, { color: Colors.primary }]}>
                        🔍 View Proof
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ backgroundColor: Colors.bgCard, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: Colors.border }}>
                    <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.xs }]}>
                      Verification Transaction
                    </Text>
                    <Text style={[Typography.monoXs, { color: Colors.text }]}>
                      {project.mint_address ? `${project.mint_address.slice(0, 8)}...${project.mint_address.slice(-8)}` : 'Pending...'}
                    </Text>
                    {project.mint_address && (
                      <TouchableOpacity
                        style={[styles.linkButton, { marginTop: Spacing.sm, backgroundColor: Colors.primary }]}
                        onPress={() => Linking.openURL(solscanUrl)}
                      >
                        <Text style={[Typography.labelSm, { color: Colors.textInverse }]}>
                          🔗 View on Solscan
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </CollapsibleSection>

          {/* Satellite Data */}
          <CollapsibleSection
            title="🛰️ Satellite Analysis"
            expanded={expandedSections.satellite}
            onToggle={() => toggleSection('satellite')}
          >
            <View style={{ gap: Spacing.md }}>
              {project.metadata?.satelliteData ? (
                <>
                  <Row label="NDVI Index" value={`${project.metadata.satelliteData.ndvi?.toFixed(3)}`} />
                  <Row label="Biomass Estimate" value={`${project.metadata.satelliteData.biomass?.toFixed(2)} tC/ha`} />
                  <Row label="Land Use" value={project.metadata.satelliteData.landUse || 'N/A'} />
                  <Row label="Cloud Cover" value={`${project.metadata.satelliteData.cloudCover}%`} />
                  <Row label="Analysis Date" value={new Date(project.metadata.satelliteData.date).toLocaleDateString()} />
                </>
              ) : (
                <Text style={[Typography.bodySm, { color: Colors.textMuted, textAlign: 'center' }]}>
                  Satellite data processing...
                </Text>
              )}
            </View>
          </CollapsibleSection>

          {/* Actions */}
          <View style={{ gap: Spacing.sm, marginTop: Spacing.xl }}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.primary }]}
              onPress={() => navigation.navigate('ZKProof', { projectId, result: project })}
            >
              <Text style={[Typography.labelMd, { color: Colors.textInverse }]}>💰 Mint Carbon Credits</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Collapsible Section Component ────────────────────
function CollapsibleSection({ title, expanded, onToggle, children }: any) {
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={onToggle}
      >
        <Text style={[Typography.labelMd, { color: Colors.text, flex: 1 }]}>{title}</Text>
        <Text style={{ fontSize: 18, transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>⌄</Text>
      </TouchableOpacity>

      {expanded && (
        <Card style={{ marginTop: Spacing.sm }}>
          {children}
        </Card>
      )}
    </View>
  );
}

// ─── Info Box Component ───────────────────────────────
function InfoBox({ label, value, color = Colors.primary, description }: any) {
  return (
    <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: color }}>
      <Text style={[Typography.bodySm, { color: Colors.textMuted, marginBottom: 2 }]}>{label}</Text>
      <Text style={[Typography.labelMd, { color }]}>{value}</Text>
      {description && (
        <Text style={[Typography.bodyXs, { color: Colors.textDim, marginTop: 4 }]}>
          {description}
        </Text>
      )}
    </View>
  );
}

// ─── Row Component ────────────────────────────────────
function Row({ label, value }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>{label}</Text>
      <Text style={[Typography.labelSm, { color: Colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkButton: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
