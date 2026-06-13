import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { Card, SectionHeader, StatusBadge, GradeBadge } from '../../components/common';
import { EmptyState, SkeletonLoader, ProfileSkeleton, Toast } from '../../components/production';
import { DashboardAPI, MarketAPI, ProjectsAPI } from '../../services/api';
import { useAuthStore } from '../../store';

const { width } = Dimensions.get('window');

// ─── Enhanced animated stat card ───────────────────────
function StatCard({ 
  label, 
  value, 
  sub, 
  color = Colors.primary, 
  icon,
  loading = false,
}: {
  label: string; 
  value: string; 
  sub?: string; 
  color?: string; 
  icon: string;
  loading?: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.spring(anim, { 
      toValue: 1, 
      friction: 6, 
      tension: 80, 
      useNativeDriver: true 
    }).start();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <Card>
          <ProfileSkeleton />
        </Card>
      </View>
    );
  }

  return (
    <Animated.View style={{ 
      transform: [{ scale: anim }], 
      flex: 1,
    }}>
      <Card style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
          <Text style={[Typography.displaySm, { color, marginTop: Spacing.xs, fontWeight: '700' }]}>
            {value}
          </Text>
          <Text style={[Typography.bodyXs, { color: Colors.textMuted, marginTop: 2 }]}>
            {label}
          </Text>
          {sub && (
            <Text style={[Typography.bodyXs, { color: Colors.textDim, marginTop: 2 }]}>
              {sub}
            </Text>
          )}
        </View>
      </Card>
    </Animated.View>
  );
}

// ─── Enhanced live ticker strip ────────────────────────
function TickerStrip({ data, loading }: { data: any[]; loading?: boolean }) {
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading && data.length > 0) {
      const anim = Animated.loop(
        Animated.timing(scrollX, {
          toValue: -width * 2,
          duration: 20000,
          useNativeDriver: true,
        })
      );
      anim.start();
      return () => anim.stop();
    }
  }, [loading, data]);

  if (loading) {
    return (
      <View style={styles.tickerContainer}>
        <SkeletonLoader width="100%" height={24} borderRadius={Radius.md} />
      </View>
    );
  }

  const tickerText = data
    .map((t) => `Grade ${t.grade} avg: ₹${parseFloat(t.avg_price || 0).toFixed(0)}/t`)
    .join('    •    ');

  return (
    <View style={styles.tickerContainer}>
      <View style={styles.tickerDot} />
      <Text style={[Typography.labelXs, { color: Colors.primary, marginRight: 8 }]}>
        LIVE MARKET
      </Text>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.View
          style={{
            transform: [{ translateX: scrollX }],
            flexDirection: 'row',
          }}
        >
          <Text style={[Typography.monoSm, { color: Colors.textMuted }]}>
            {tickerText}    
          </Text>
          <Text style={[Typography.monoSm, { color: Colors.textMuted }]}>
            {tickerText}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Main Dashboard Screen ─────────────────────────────
export function DashboardScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => DashboardAPI.get().then((r) => r.data),
  });

  const { data: tickerData, isLoading: tickerLoading } = useQuery({
    queryKey: ['ticker'],
    queryFn: () => MarketAPI.ticker().then((r) => r.data.ticker || []),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'recent'],
    queryFn: () =>
      ProjectsAPI.list({ page: 1, limit: 3 }).then((r) => r.data.projects || []),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchDashboard();
      setToastMsg('Dashboard updated');
      setToastVisible(true);
    } catch (err) {
      setToastMsg('Failed to refresh dashboard');
      setToastVisible(true);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={{ marginBottom: Spacing.xl }}>
            <Text style={[Typography.bodyXs, { color: Colors.textDim, marginBottom: Spacing.xs }]}>
              Welcome back
            </Text>
            <Text style={[Typography.displayLg, { color: Colors.text }]}>
              {user?.name || 'Carbon Producer'}
            </Text>
          </View>

          {/* Live Market Ticker */}
          <TickerStrip data={tickerData || []} loading={tickerLoading} />

          {/* Stats Grid */}
          <SectionHeader title="Your Portfolio" subtitle="Last 30 days" />
          <View style={styles.statsGrid}>
            <StatCard
              label="Projects"
              value={dashboardData?.projects?.total?.toString() || '0'}
              sub={`${dashboardData?.projects?.verified || 0} verified`}
              color={Colors.primary}
              icon="🌱"
              loading={dashboardLoading}
            />
            <StatCard
              label="Carbon"
              value={`${parseFloat(dashboardData?.portfolio?.totalCo2e || 0).toFixed(1)}`}
              sub="tCO₂e held"
              color={Colors.satellite}
              icon="🌍"
              loading={dashboardLoading}
            />
            <StatCard
              label="Earnings"
              value={`₹${parseFloat(dashboardData?.earnings?.totalInr || 0).toFixed(0)}`}
              sub="from sales"
              color={Colors.success}
              icon="💰"
              loading={dashboardLoading}
            />
          </View>

          {/* Recent Projects */}
          <SectionHeader
            title="Recent Projects"
            action={{
              label: 'View All',
              onPress: () => navigation.navigate('Projects'),
            }}
          />
          {projectsData && projectsData.length > 0 ? (
            <View style={{ gap: Spacing.sm }}>
              {projectsData.map((project: any) => (
                <TouchableOpacity
                  key={project.id}
                  onPress={() =>
                    navigation.navigate('ProjectDetail', { projectId: project.id })
                  }
                >
                  <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, marginRight: Spacing.md }}>
                      {project.entity_type === 'biochar'
                        ? '🌾'
                        : project.entity_type === 'solar'
                          ? '☀️'
                          : '🌳'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[Typography.labelMd, { color: Colors.text }]}
                        numberOfLines={1}
                      >
                        {project.name}
                      </Text>
                      <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>
                        {project.co2e_estimated
                          ? `${parseFloat(project.co2e_estimated).toFixed(2)} tCO₂e`
                          : 'Pending analysis'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <StatusBadge status={project.status} />
                      {project.grade && <GradeBadge grade={project.grade} size="sm" />}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="🌱"
              title="No projects yet"
              subtitle="Create your first carbon project to get started"
              action={{
                label: 'Create Project',
                onPress: () => navigation.navigate('NewProject'),
              }}
            />
          )}

          {/* Quick Actions */}
          <SectionHeader title="Quick Actions" />
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('NewProject')}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={[Typography.labelSm, { color: Colors.text, marginTop: Spacing.sm }]}>
                New Project
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Market')}
            >
              <Text style={styles.actionIcon}>🏦</Text>
              <Text style={[Typography.labelSm, { color: Colors.text, marginTop: Spacing.sm }]}>
                Marketplace
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={[Typography.labelSm, { color: Colors.text, marginTop: Spacing.sm }]}>
                Portfolio
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Toast Notification */}
        <Toast
          visible={toastVisible}
          message={toastMsg}
          type="success"
          onHide={() => setToastVisible(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDim,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
    animation: 'pulse 2s infinite',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    fontSize: 28,
  },
});
      </View>
    </View>
  );
}

// ─── Mini sparkline ───────────────────────────────────
function Sparkline({ values, color = Colors.primary }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 80, H = 30;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - ((v - min) / range) * H,
  }));

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <View style={{ width: W, height: H }}>
      <Text style={{ position: 'absolute', color: 'transparent' }}>chart</Text>
      {/* SVG fallback — show delta instead */}
      <Text style={[Typography.monoSm, { color, textAlign: 'right' }]}>
        {values[values.length - 1] > values[0] ? '↑' : '↓'}
      </Text>
    </View>
  );
}

// ─── Activity item ────────────────────────────────────
function ActivityItem({ item, onPress }: { item: any; onPress?: () => void }) {
  const icons: Record<string, string> = {
    verified: '✅', listed: '📋', sold: '💰', analyzing: '🛰️',
    zk_generated: '🔐', rejected: '❌', submitted: '📤',
  };

  return (
    <TouchableOpacity style={styles.activityItem} onPress={onPress}>
      <View style={styles.activityIcon}>
        <Text style={{ fontSize: 16 }}>{icons[item.status] || '🌿'}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Text style={[Typography.labelMd, { color: Colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[Typography.bodyXs, { color: Colors.textMuted, marginTop: 2 }]}>
          {item.entity_type} · {item.co2e_estimated ? `${parseFloat(item.co2e_estimated).toFixed(2)} tCO₂e` : 'Processing...'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <StatusBadge status={item.status} />
        {item.grade && <GradeBadge grade={item.grade} size="sm" style={{ marginTop: 4 }} />}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Dashboard ───────────────────────────────────
export function DashboardScreen({ navigation }: any) {
  const user       = useAuthStore(s => s.user);
  const [refresh, setRefresh] = useState(false);

  const { data: dashboard, refetch: refetchDash } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => DashboardAPI.get().then(r => r.data),
  });

  const { data: ticker } = useQuery({
    queryKey: ['ticker'],
    queryFn:  () => MarketAPI.ticker().then(r => r.data),
    refetchInterval: 10000,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects', 'recent'],
    queryFn:  () => ProjectsAPI.list({ limit: 5 }).then(r => r.data),
  });

  const onRefresh = async () => {
    setRefresh(true);
    await refetchDash();
    setRefresh(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const d = dashboard;

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>{greeting()},</Text>
            <Text style={[Typography.displaySm, { color: Colors.text }]}>
              {user?.name || user?.phone?.slice(-4).padStart(10, '•') || 'Welcome'}  🌱
            </Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.navigate('Notifications')}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Live ticker */}
        {ticker?.ticker?.length > 0 && <TickerStrip data={ticker.ticker} />}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Carbon asset hero card */}
          <Card glowGreen style={{ marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Your Carbon Assets</Text>
                <Text style={[Typography.display2xl, { color: Colors.primary, marginTop: 4 }]}>
                  {d?.portfolio?.totalCo2e?.toFixed(2) || '0.00'}
                  <Text style={[Typography.bodyMd, { color: Colors.textMuted }]}> tCO₂e</Text>
                </Text>
                <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: 4 }]}>
                  ₹{(d?.portfolio?.portfolioValueInr || 0).toLocaleString('en-IN')} / $
                  {((d?.portfolio?.portfolioValueInr || 0) / 83.5).toFixed(0)} USDC
                </Text>
              </View>
              <View style={styles.co2Badge}>
                <Text style={{ fontSize: 28 }}>🌿</Text>
              </View>
            </View>
            <View style={[styles.separator, { marginVertical: Spacing.md }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>24h change</Text>
              <Text style={[Typography.labelSm, { color: Colors.success }]}>+₹450 (+2.4%) ↑</Text>
            </View>
          </Card>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            <StatCard
              icon="📋"
              label="Active Projects"
              value={String(d?.projects?.total || 0)}
              sub={`${d?.projects?.analyzing || 0} analyzing`}
              color={Colors.primary}
            />
            <StatCard
              icon="⏳"
              label="Pending Payments"
              value={`₹${(d?.earnings?.totalInr || 0).toLocaleString('en-IN', { notation: 'compact' })}`}
              color={Colors.warning}
            />
            <StatCard
              icon="🔥"
              label="Credits Retired"
              value={String(d?.retirements?.totalCo2e?.toFixed(0) || 0)}
              sub="tCO₂e offset"
              color={Colors.satellite}
            />
          </View>

          {/* Quick actions */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl }}>
            <TouchableOpacity
              style={[styles.quickAction, { flex: 2 }]}
              onPress={() => navigation?.navigate('CreateProject')}
            >
              <LinearGradient
                colors={['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.05)']}
                style={styles.quickActionGrad}
              >
                <Text style={{ fontSize: 22 }}>＋</Text>
                <Text style={[Typography.labelMd, { color: Colors.primary, marginTop: 4 }]}>New Project</Text>
                <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>Register climate action</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={{ flex: 1, gap: Spacing.sm }}>
              <TouchableOpacity
                style={styles.quickActionSmall}
                onPress={() => navigation?.navigate('Marketplace')}
              >
                <Text style={{ fontSize: 18 }}>🛒</Text>
                <Text style={[Typography.labelSm, { color: Colors.text, marginTop: 4 }]}>Market</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionSmall}
                onPress={() => navigation?.navigate('Portfolio')}
              >
                <Text style={{ fontSize: 18 }}>📊</Text>
                <Text style={[Typography.labelSm, { color: Colors.text, marginTop: 4 }]}>Portfolio</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent activity */}
          <SectionHeader title="Recent Activity" action="View all" onAction={() => navigation?.navigate('Projects')} />
          <Card>
            {projects?.projects?.length > 0 ? (
              projects.projects.map((p: any, i: number) => (
                <View key={p.id}>
                  <ActivityItem 
                    item={p}
                    onPress={() => navigation?.navigate('ProjectDetail', { projectId: p.id })}
                  />
                  {i < projects.projects.length - 1 && <View style={styles.separator} />}
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', padding: Spacing['2xl'] }}>
                <Text style={{ fontSize: 36 }}>🌱</Text>
                <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center' }]}>
                  No projects yet.{'\n'}Create your first climate action.
                </Text>
                <TouchableOpacity
                  style={{ marginTop: Spacing.lg }}
                  onPress={() => navigation?.navigate('CreateProject')}
                >
                  <Text style={[Typography.labelMd, { color: Colors.primary }]}>+ Register Project →</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          {/* Network status */}
          <View style={styles.networkStatus}>
            {[
              { label: 'API', ok: true },
              { label: 'Satellite', ok: true },
              { label: 'AI Service', ok: true },
              { label: 'Solana', ok: true },
            ].map(s => (
              <View key={s.label} style={styles.networkItem}>
                <View style={[styles.networkDot, { backgroundColor: s.ok ? Colors.success : Colors.error }]} />
                <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, paddingBottom: Spacing.sm,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  tickerContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
    overflow: 'hidden',
  },
  tickerDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginRight: 6,
  },
  co2Badge: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center',
  },
  separator: { height: 1, backgroundColor: Colors.border },
  quickAction: {
    borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.borderBright,
  },
  quickActionGrad: { padding: Spacing.lg, alignItems: 'flex-start' },
  quickActionSmall: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, alignItems: 'center', justifyContent: 'center',
  },
  activityItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md,
  },
  activityIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bgInput, alignItems: 'center', justifyContent: 'center',
  },
  networkStatus: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.md,
    marginTop: Spacing.xl, paddingVertical: Spacing.md,
  },
  networkItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  networkDot: { width: 6, height: 6, borderRadius: 3 },
});
