/**
 * ATMOS — Privacy Toggle Component
 * ═════════════════════════════════════════════════════════════════
 * Mobile UI for Umbra private vs public purchase mode.
 */

import React, { useState } from 'react';
import { View, Text, Switch, Pressable, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { AtmosCard } from '@/components/AtmosCard';

interface PrivacyToggleProps {
  privacyMode: boolean;
  onPrivacyModeChange: (mode: boolean) => void;
  disabled?: boolean;
}

export function PrivacyToggle({
  privacyMode,
  onPrivacyModeChange,
  disabled = false,
}: PrivacyToggleProps) {
  const colors = useColors();
  const [showInfo, setShowInfo] = useState(false);

  const handleToggle = () => {
    if (privacyMode) {
      // Switching FROM private to public
      Alert.alert('Switch to Public Mode?', 'Your purchase will be visible on the blockchain.', [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Make Public',
          onPress: () => onPrivacyModeChange(false),
          style: 'destructive',
        },
      ]);
    } else {
      // Switching FROM public to private
      onPrivacyModeChange(true);
    }
  };

  return (
    <View>
      {/* PRIVACY MODE CARD */}
      <AtmosCard
        style={[
          styles.card,
          {
            backgroundColor: privacyMode ? '#1a472a' : '#472a1a', // Green if private, orange if public
            borderColor: privacyMode ? '#4caf50' : '#ff9800',
          },
        ]}
        padding={16}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Feather
              name={privacyMode ? 'lock' : 'unlock'}
              size={20}
              color={privacyMode ? '#4caf50' : '#ff9800'}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.title, { color: colors.foreground }]}>
              {privacyMode ? '🔐 Private Mode' : '🔓 Public Mode'}
            </Text>
          </View>

          <Pressable
            onPress={() => setShowInfo(!showInfo)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Feather name="info" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* DESCRIPTION */}
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {privacyMode
            ? 'Purchase amount and recipient hidden from public ledger. Only you and Umbra know the details.'
            : 'Purchase amount and recipient visible on public blockchain. Competitive advantage visible.'}
        </Text>

        {/* TOGGLE SWITCH */}
        <View style={[styles.toggleRow, { borderTopColor: colors.border, marginTop: 12, paddingTop: 12 }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>Enable Private Mode</Text>
          <Switch
            value={privacyMode}
            onValueChange={handleToggle}
            disabled={disabled}
            trackColor={{ false: '#ccc', true: '#4caf50' }}
            thumbColor={privacyMode ? '#fff' : '#f0f0f0'}
            style={{ marginLeft: 'auto' }}
          />
        </View>
      </AtmosCard>

      {/* INFO SHEET */}
      {showInfo && (
        <AtmosCard style={[styles.infoCard, { backgroundColor: colors.card }]} padding={12}>
          <View style={styles.infoSection}>
            <View style={styles.infoBullet}>
              <Feather name="chevron-right" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                <Text style={{ fontWeight: '600' }}>Umbra Privacy:</Text> Uses encrypted transfers
              </Text>
            </View>

            <View style={styles.infoBullet}>
              <Feather name="chevron-right" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                <Text style={{ fontWeight: '600' }}>View Key:</Text> Generate for tax/audit reports
              </Text>
            </View>

            <View style={styles.infoBullet}>
              <Feather name="chevron-right" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                <Text style={{ fontWeight: '600' }}>Compliance:</Text> Share viewing key with accountant
              </Text>
            </View>

            <View style={styles.infoBullet}>
              <Feather name="chevron-right" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                <Text style={{ fontWeight: '600' }}>Fee:</Text> +0.5% for Umbra privacy layer
              </Text>
            </View>
          </View>

          {/* COMPLIANCE NOTE */}
          <Pressable
            onPress={() => {
              Alert.alert(
                'Viewing Keys',
                'Generate a viewing key to allow your accountant to decrypt transactions for tax reporting without seeing your entire portfolio.'
              );
            }}
            style={({ pressed }) => [styles.viewingKeyLink, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="key" size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.primary }]}>Generate Viewing Key</Text>
          </Pressable>
        </AtmosCard>
      )}

      {/* PRIVACY BADGE */}
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            { backgroundColor: privacyMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)' },
          ]}
        >
          <Feather
            name={privacyMode ? 'shield-off' : 'eye'}
            size={12}
            color={privacyMode ? '#4caf50' : '#ff9800'}
          />
          <Text
            style={[
              styles.badgeText,
              { color: privacyMode ? '#4caf50' : '#ff9800' },
            ]}
          >
            {privacyMode ? 'Hidden from observers' : 'Visible on-chain'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoSection: {
    marginBottom: 12,
  },
  infoBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  viewingKeyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  badgeRow: {
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 6,
  },
});
