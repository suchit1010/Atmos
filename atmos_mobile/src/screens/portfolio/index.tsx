import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card, GradeBadge, Button, SectionHeader, Divider } from '../../components/common';
import { PortfolioAPI } from '../../services/api';
import { useAuthStore, useUIStore } from '../../store';

// ─── Portfolio screen ─────────────────────────────────
export function PortfolioScreen({ navigation }: any) {
  const [activeTab,  setActiveTab]  = useState<'holdings' | 'history'>('holdings');
  const [refreshing, setRefreshing] = useState(false);
  const qc = useQueryClient();

  const { data: portfolioData, refetch } = useQuery({
    queryKey: ['portfolio'],
    queryFn:  () => PortfolioAPI.get().then(r => r.data),
  });

  const { data: certsData } = useQuery({
    queryKey: ['certificates'],
    queryFn:  () => PortfolioAPI.certificates().then(r => r.data),
  });

  const retireMutation = useMutation({
    mutationFn: (body: any) => PortfolioAPI.retireCredits(body),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['portfolio'] }); },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRetire = (creditId: string, quantity: number) => {
    Alert.alert(
      '🔥 Retire Credits',
      `Burn ${quantity} tCO₂e permanently? You'll receive a blockchain certificate.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retire',
          style: 'destructive',
          onPress: () => retireMutation.mutate({ creditId, quantity, makePublic: true }),
        },
      ]
    );
  };

  const holdings  = portfolioData?.holdings  || MOCK_HOLDINGS;
  const summary   = portfolioData?.summary   || { totalCo2e: 103, totalValue: 128610 };
  const certs     = certsData?.certificates  || [];

  const ENTITY_ICONS: Record<string, string> = {
    biochar: '🌾', agroforestry: '🌳', solar_energy: '☀️',
    ev_fleet: '⚡', building: '🏢', soil_carbon: '🌍', crop_residue: '🌾',
  };

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[Typography.displaySm, { color: Colors.text }]}>Portfolio</Text>
        </View>

        {/* Summary hero */}
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
          <Card glowGreen>
            <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Total Carbon Assets</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginTop: Spacing.xs }}>
              <Text style={[Typography.display2xl, { color: Colors.primary }]}>
                {summary.totalCo2e?.toFixed(1) || '103.0'}
              </Text>
              <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginBottom: 6 }]}>tCO₂e</Text>
            </View>
            <Text style={[Typography.bodyMd, { color: Colors.textMuted }]}>
              ₹{(summary.totalValue || 128610).toLocaleString('en-IN')} USDC
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm }}>
              <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>24h change</Text>
              <Text style={[Typography.labelSm, { color: Colors.success }]}>+₹450 (+2.4%) ↑</Text>
            </View>
          </Card>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['holdings', 'history'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab ? styles.tabActive : {}]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[Typography.labelMd, { color: activeTab === tab ? Colors.primary : Colors.textMuted }]}>
                {tab === 'holdings' ? 'Holdings' : 'Certificates'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {activeTab === 'holdings' && (
            <>
              {holdings.map((h: any, i: number) => (
                <Card key={h.credit_id || i} style={{ marginBottom: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.holdingIcon}>
                      <Text style={{ fontSize: 22 }}>{ENTITY_ICONS[h.entity_type] || '🌿'}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text style={[Typography.labelMd, { color: Colors.text }]} numberOfLines={1}>
                        {h.project_name || 'Carbon Credit'}
                      </Text>
                      <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>
                        {h.methodology || 'VM0044'} · {h.vintage_year || 2026}
                      </Text>
                    </View>
                    <GradeBadge grade={h.grade || 'A'} size="sm" />
                  </View>

                  <View style={styles.holdingStats}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={[Typography.monoMd, { color: Colors.text }]}>
                        {parseFloat(h.quantity || 48).toFixed(1)}
                      </Text>
                      <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>tCO₂e</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={[Typography.monoMd, { color: Colors.textMuted }]}>
                        ₹{parseFloat(h.buy_price || 1450).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>buy price</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={[Typography.monoMd, { color: Colors.primary }]}>
                        ₹{parseFloat(h.list_price || h.buy_price || 1485).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>current</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      {(() => {
                        const pnl = (parseFloat(h.list_price || h.buy_price || 1485) - parseFloat(h.buy_price || 1450)) * parseFloat(h.quantity || 48);
                        return (
                          <Text style={[Typography.monoMd, { color: pnl >= 0 ? Colors.success : Colors.error }]}>
                            {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN')}
                          </Text>
                        );
                      })()}
                      <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>P&L</Text>
                    </View>
                  </View>

                  <Button
                    label="🔥 Retire Credits"
                    variant="ghost"
                    size="sm"
                    onPress={() => handleRetire(h.credit_id, parseFloat(h.quantity || 48))}
                    style={{ marginTop: Spacing.sm }}
                  />
                </Card>
              ))}

              {holdings.length === 0 && (
                <View style={{ alignItems: 'center', padding: Spacing['4xl'] }}>
                  <Text style={{ fontSize: 48 }}>📊</Text>
                  <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center' }]}>
                    No holdings yet.{'\n'}Buy credits from the marketplace.
                  </Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {(certs.length > 0 ? certs : MOCK_CERTS).map((c: any, i: number) => (
                <Card key={i} style={{ marginBottom: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.holdingIcon, { backgroundColor: Colors.warningDim }]}>
                      <Text style={{ fontSize: 22 }}>🏅</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text style={[Typography.labelMd, { color: Colors.text }]}>
                        {c.amount_co2e || c.quantity} tCO₂e Retired
                      </Text>
                      <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>
                        {c.organisation_name || 'Personal Offset'} · {new Date(c.retired_at).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  {c.burn_tx_hash && (
                    <Text style={[Typography.monoSm, { color: Colors.textDim, marginTop: Spacing.sm }]} numberOfLines={1}>
                      TX: {c.burn_tx_hash}
                    </Text>
                  )}
                </Card>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Profile / Settings screen ────────────────────────
export function SettingsScreen({ navigation }: any) {
  const user       = useAuthStore(s => s.user);
  const logout     = useAuthStore(s => s.logout);
  const { language, currency, toggleTheme, setLanguage, setCurrency } = useUIStore();

  const initials = (user?.name || user?.phone || 'K').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const SETTINGS_SECTIONS = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Profile Details',   sub: user?.name || 'Not set', arrow: true },
        { icon: '🪪', label: 'KYC Status',        sub: user?.kycStatus || 'Pending', arrow: true },
        { icon: '🔗', label: 'Refer & Earn',       sub: 'Share to earn rewards', arrow: true },
      ],
    },
    {
      title: 'Wallet & Payments',
      items: [
        { icon: '💎', label: 'Solana Wallet',     sub: user?.walletAddress ? user.walletAddress.slice(0, 8) + '...' : 'Not connected', arrow: true },
        { icon: '⚡', label: 'Dodo Payments',     sub: 'Connected · Verified', arrow: false },
        { icon: '💳', label: 'Payment History',   sub: 'View all transactions', arrow: true },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: '🔐', label: 'ZK Privacy',        sub: 'Data stays on device', arrow: false },
        { icon: '🔒', label: 'Biometric Login',   sub: 'Face / Fingerprint', arrow: false, toggle: true },
        { icon: '📤', label: 'Export Data',        sub: 'Download your records', arrow: true },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: '❓', label: 'Help Centre',        sub: 'docs.atmos.pro', arrow: true },
        { icon: '💬', label: 'Contact Support',    sub: '@atmos_support', arrow: true },
        { icon: '📋', label: 'Terms of Service',   sub: '', arrow: true },
      ],
    },
  ];

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[Typography.displaySm, { color: Colors.text }]}>Profile</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* User card */}
          <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.avatar}>
                  <Text style={[Typography.displaySm, { color: Colors.textInverse, fontWeight: '700' }]}>
                    {initials}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={[Typography.labelLg, { color: Colors.text }]}>
                    {user?.name || 'ATMOS User'}
                  </Text>
                  <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>
                    {user?.phone || ''}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs }}>
                    <View style={styles.kycBadge}>
                      <Text style={[Typography.labelXs, { color: Colors.success }]}>
                        {user?.kycStatus === 'verified' ? '✓ KYC Verified' : '⏳ KYC Pending'}
                      </Text>
                    </View>
                    {user?.role === 'producer' && (
                      <View style={[styles.kycBadge, { backgroundColor: Colors.primaryDim }]}>
                        <Text style={[Typography.labelXs, { color: Colors.primary }]}>Producer</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Card>
          </View>

          {/* Preferences */}
          <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
            <Card>
              <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.md }]}>
                PREFERENCES
              </Text>
              <View style={styles.prefRow}>
                <Text style={[Typography.bodyMd, { color: Colors.text }]}>Language</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                  {['en', 'hi', 'gu'].map(lang => (
                    <TouchableOpacity
                      key={lang}
                      onPress={() => setLanguage(lang)}
                      style={[styles.langBtn, language === lang ? styles.langBtnActive : {}]}
                    >
                      <Text style={[Typography.labelXs, { color: language === lang ? Colors.primary : Colors.textMuted }]}>
                        {lang.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <Divider />
              <View style={styles.prefRow}>
                <Text style={[Typography.bodyMd, { color: Colors.text }]}>Currency</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                  {['INR', 'USD', 'EUR'].map(cur => (
                    <TouchableOpacity
                      key={cur}
                      onPress={() => setCurrency(cur)}
                      style={[styles.langBtn, currency === cur ? styles.langBtnActive : {}]}
                    >
                      <Text style={[Typography.labelXs, { color: currency === cur ? Colors.primary : Colors.textMuted }]}>
                        {cur}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Card>
          </View>

          {/* Settings sections */}
          {SETTINGS_SECTIONS.map(section => (
            <View key={section.title} style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
              <Text style={[Typography.labelXs, { color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm }]}>
                {section.title}
              </Text>
              <Card>
                {section.items.map((item, i) => (
                  <View key={item.label}>
                    <TouchableOpacity style={styles.settingsItem}>
                      <View style={styles.settingsIcon}>
                        <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <Text style={[Typography.bodyMd, { color: Colors.text }]}>{item.label}</Text>
                        {item.sub ? <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>{item.sub}</Text> : null}
                      </View>
                      {item.toggle
                        ? <Switch trackColor={{ false: Colors.bgInput, true: Colors.primaryDim }} thumbColor={Colors.primary} value={false} />
                        : item.arrow
                          ? <Text style={[Typography.bodyMd, { color: Colors.textDim }]}>›</Text>
                          : null
                      }
                    </TouchableOpacity>
                    {i < section.items.length - 1 && <View style={{ height: 1, backgroundColor: Colors.border }} />}
                  </View>
                ))}
              </Card>
            </View>
          ))}

          {/* Version + Logout */}
          <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.md }}>
            <Text style={[Typography.bodyXs, { color: Colors.textDim, textAlign: 'center', marginBottom: Spacing.lg }]}>
              ATMOS Protocol v1.0.0 (Solana Devnet) · Built for Colosseum Frontier 2026
            </Text>
            <Button label="Log Out" variant="danger" onPress={handleLogout} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Mock data ────────────────────────────────────────
const MOCK_HOLDINGS = [
  { credit_id: '1', project_name: 'Biochar Production, Rajasthan', entity_type: 'biochar', grade: 'A', quantity: 48, buy_price: 1450, list_price: 1485, methodology: 'VM0044', vintage_year: 2026 },
  { credit_id: '2', project_name: 'Agroforestry, Gujarat',         entity_type: 'agroforestry', grade: 'B+', quantity: 30, buy_price: 950, list_price: 945, methodology: 'VM0047', vintage_year: 2025 },
  { credit_id: '3', project_name: 'Solar Energy, Maharashtra',     entity_type: 'solar_energy', grade: 'A', quantity: 25, buy_price: 1280, list_price: 1320, methodology: 'AMS-I.D', vintage_year: 2026 },
];

const MOCK_CERTS = [
  { amount_co2e: 12, organisation_name: 'Infosys Ltd.', retired_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), burn_tx_hash: '5ayYk...22z1' },
];

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  tabs: {
    flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 4,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.md },
  tabActive: { backgroundColor: Colors.primaryDim },
  holdingIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.bgInput, alignItems: 'center', justifyContent: 'center',
  },
  holdingStats: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.bgInput, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, marginTop: Spacing.md,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  kycBadge: {
    backgroundColor: Colors.successDim, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.success + '40',
  },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  langBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full,
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border,
  },
  langBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  settingsItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md,
  },
  settingsIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.bgInput, alignItems: 'center', justifyContent: 'center',
  },
});
