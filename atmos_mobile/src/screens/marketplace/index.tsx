import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ScrollView, RefreshControl, Dimensions, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { Card, GradeBadge, Chip, Button } from '../../components/common';
import { BlurView } from 'expo-blur';
import { Search, Settings2, Leaf, TreePine, Sun, Zap, Building2, Sprout, ChevronRight, ShieldCheck, Activity } from 'lucide-react-native';
import { MarketAPI } from '../../services/api';

const { width: windowWidth } = Dimensions.get('window');
const containerWidth = Platform.OS === 'web' ? Math.min(windowWidth, 430) : windowWidth;

// ─── Ticker strip ─────────────────────────────────────
function LiveTicker({ ticker }: { ticker: any[] }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(x, { toValue: -containerWidth * 1.8, duration: 18000, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const items = [...ticker, ...ticker].map((t) =>
    `Grade ${t.grade}: ₹${parseFloat(t.avg_price || 0).toFixed(0)}/t (${t.listing_count} listings)`
  ).join('    ✦    ');

  return (
    <View style={styles.ticker}>
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={[Typography.labelXs, { color: Colors.primary, fontWeight: '700' }]}>LIVE</Text>
      </View>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.Text style={[Typography.monoSm, { color: Colors.text, transform: [{ translateX: x }] }]}>
          {items}
        </Animated.Text>
      </View>
    </View>
  );
}

// ─── Credit card ──────────────────────────────────────
function CreditCard({ item, onBuy }: { item: any; onBuy: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isHighGrade = item.grade === 'S' || item.grade === 'A';

  return (
    <Card style={styles.creditCard} onPress={() => setExpanded(!expanded)} glowGreen={isHighGrade}>
      {/* Top row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={styles.entityIcon}>
          {(() => {
            const type = item.entity_type as string;
            if (type === 'biochar') return <Leaf color="#22C55E" size={24} strokeWidth={2.5} />;
            if (type === 'agroforestry') return <TreePine color="#22C55E" size={24} strokeWidth={2.5} />;
            if (type === 'solar_energy') return <Sun color="#EAB308" size={24} strokeWidth={2.5} />;
            if (type === 'ev_fleet') return <Zap color="#3B82F6" size={24} strokeWidth={2.5} />;
            if (type === 'building') return <Building2 color="#8B5CF6" size={24} strokeWidth={2.5} />;
            if (type === 'soil_carbon') return <Sprout color="#A855F7" size={24} strokeWidth={2.5} />;
            return <Leaf color="#22C55E" size={24} strokeWidth={2.5} />;
          })()}
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <GradeBadge grade={item.grade || 'A'} size="sm" />
            {item.proof_hash && (
              <View style={styles.zkBadge}>
                <ShieldCheck color={Colors.zkPurple} size={14} strokeWidth={3} style={{ marginRight: 4 }} />
                <Text style={[Typography.labelXs, { color: Colors.zkPurple, fontWeight: '700' }]}>ZK Verified</Text>
              </View>
            )}
          </View>
          <Text style={[Typography.labelLg, { color: Colors.text, marginTop: 4 }]} numberOfLines={1}>
            {item.project_name}
          </Text>
          <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>
            📍 {item.lat && item.lng ? `${item.lat?.toFixed(2)}°N, ${item.lng?.toFixed(2)}°E` : 'India'}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={{ alignItems: 'center' }}>
          <Text style={[Typography.monoMd, { color: Colors.primary }]}>
            {parseFloat(item.co2e_estimated || item.quantity || 0).toFixed(2)}
          </Text>
          <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>tCO₂e</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={{ alignItems: 'center' }}>
          <Text style={[Typography.monoMd, { color: Colors.text }]}>
            {item.confidence_score || 87}
          </Text>
          <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>/100 score</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={{ alignItems: 'center' }}>
          <Text style={[Typography.monoMd, { color: Colors.text }]}>
            {item.quantity?.toFixed(1) || '48.0'}
          </Text>
          <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>t avail</Text>
        </View>
      </View>

      {/* Price + Buy */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md }}>
        <View>
          <Text style={[Typography.display2xl, { color: Colors.primary }]}>
            ₹{parseFloat(item.unit_price_inr || 1485).toLocaleString('en-IN')}
          </Text>
          <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>per tonne CO₂e</Text>
        </View>
        <TouchableOpacity
          style={styles.buyBtn}
          onPress={(e) => { e.stopPropagation?.(); onBuy(); }}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.buyBtnGrad}>
            <Text style={[Typography.labelMd, { color: '#040C06', fontWeight: '800' }]}>Buy Now</Text>
            <ChevronRight color="#040C06" size={18} strokeWidth={3} style={{ marginLeft: 4 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={{ marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderColor: Colors.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>Methodology</Text>
            <Text style={[Typography.monoSm, { color: Colors.text }]}>{item.methodology || 'VM0044'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>Vintage</Text>
            <Text style={[Typography.monoSm, { color: Colors.text }]}>{item.vintage_year || 2026}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>Seller</Text>
            <Text style={[Typography.monoSm, { color: Colors.text }]}>{item.seller_name || 'Verified Producer'}</Text>
          </View>
          {item.proof_hash && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>ZK Proof</Text>
              <Text style={[Typography.monoSm, { color: Colors.zkPurple }]} numberOfLines={1}>
                {item.proof_hash.slice(0, 18)}...
              </Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const TYPE_MAP: Record<string, string> = {
  'Biochar': 'biochar',
  'Agroforestry': 'agroforestry',
  'Solar': 'solar_energy',
  'EV Fleet': 'ev_fleet',
  'Building': 'building',
  'Soil Carbon': 'soil_carbon',
};

// ─── Marketplace Screen ───────────────────────────────
export function MarketplaceScreen({ navigation }: any) {
  const [search,     setSearch]     = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [refreshing,  setRefreshing]  = useState(false);

  const { data: tickerData } = useQuery({
    queryKey: ['ticker'],
    queryFn:  () => MarketAPI.ticker().then(r => r.data),
    refetchInterval: 10000,
  });

  const { data: listingsData, refetch } = useQuery({
    queryKey: ['marketplace', gradeFilter, typeFilter],
    queryFn:  () => MarketAPI.listings({ grade: gradeFilter || undefined, entityType: typeFilter || undefined })
      .then(r => r.data),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const allListings: any[] = (listingsData?.listings && listingsData.listings.length > 0)
    ? listingsData.listings
    : MOCK_LISTINGS;

  const filtered = allListings.filter(l => {
    const matchesSearch = !search ||
      (l.project_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.entity_type  || '').toLowerCase().includes(search.toLowerCase());

    const matchesGrade = !gradeFilter || l.grade === gradeFilter;

    const itemType = (l.entity_type || '').toLowerCase().replace(' ', '_');
    const filterType = (typeFilter || '').toLowerCase().replace(' ', '_');
    const matchesType = !typeFilter || itemType === filterType;

    return matchesSearch && matchesGrade && matchesType;
  });

  const GRADES = ['All', 'S', 'A', 'B', 'C'];
  const TYPES  = ['All', 'Biochar', 'Agroforestry', 'Solar', 'EV Fleet', 'Building', 'Soil Carbon'];

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[Typography.displaySm, { color: Colors.text }]}>Marketplace</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Settings2 color={Colors.text} size={22} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Ticker */}
        {tickerData?.ticker?.length > 0 && <LiveTicker ticker={tickerData.ticker} />}

        {/* Market Overview Header */}
        <View style={styles.overviewRow}>
          <Card style={styles.overviewCard} glowGreen>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[Typography.bodyXs, { color: Colors.textDim, letterSpacing: 0.5, fontSize: 9 }]}>VOLUME TRADED</Text>
                <Text style={[Typography.monoMd, { color: Colors.primary, marginTop: 4, fontSize: 13 }]}>1,420 tCO₂e</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[Typography.bodyXs, { color: Colors.textDim, letterSpacing: 0.5, fontSize: 9 }]}>AVG PRICE</Text>
                <Text style={[Typography.monoMd, { color: Colors.text, marginTop: 4, fontSize: 13 }]}>₹1,410/t</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[Typography.bodyXs, { color: Colors.textDim, letterSpacing: 0.5, fontSize: 9 }]}>ACTIVE</Text>
                <Text style={[Typography.monoMd, { color: Colors.text, marginTop: 4, fontSize: 13 }]}>{allListings.length} assets</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search color={Colors.textDim} size={20} strokeWidth={2.5} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search carbon assets..."
              placeholderTextColor={Colors.textDim}
            />
          </View>
        </View>

        {/* Grade & Type filters */}
        <View style={{ height: 44, marginBottom: Spacing.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.xs, alignItems: 'center' }}>
            {GRADES.map(g => (
              <Chip
                key={g} label={g}
                active={gradeFilter === (g === 'All' ? '' : g)}
                onPress={() => setGradeFilter(g === 'All' ? '' : g)}
              />
            ))}
            <View style={styles.filterSeparator} />
            {TYPES.map(t => (
              <Chip
                key={t} label={t}
                active={typeFilter === (t === 'All' ? '' : TYPE_MAP[t])}
                onPress={() => setTypeFilter(t === 'All' ? '' : TYPE_MAP[t])}
              />
            ))}
          </ScrollView>
        </View>

        {/* Listings */}
        <FlatList
          data={filtered}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
              <CreditCard item={item} onBuy={() => navigation.navigate('Payment', { listing: item })} />
            </View>
          )}
          contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', padding: Spacing['4xl'] }}>
              <Text style={{ fontSize: 48 }}>🌍</Text>
              <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center' }]}>
                No listings found.{'\n'}Try different filters.
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Mock data (shows when API is offline) ────────────
const MOCK_LISTINGS = [
  { listing_id: 'mock_list_1', project_name: 'Biochar Production, Rajasthan', entity_type: 'biochar', grade: 'A', co2e_estimated: 2.46, confidence_score: 87, quantity: 48, unit_price_inr: 1485, proof_hash: 'zk_79a2b1c...', methodology: 'VM0044', vintage_year: 2026, lat: 26.9, lng: 75.7, seller_name: 'Raju Biochar Plant' },
  { listing_id: 'mock_list_2', project_name: 'Agroforestry Project, Gujarat', entity_type: 'agroforestry', grade: 'B', co2e_estimated: 5.20, confidence_score: 76, quantity: 30, unit_price_inr: 945, proof_hash: 'zk_12cdef...', methodology: 'VM0047', vintage_year: 2025, lat: 22.3, lng: 70.8, seller_name: 'Green Fields Farm' },
  { listing_id: 'mock_list_3', project_name: 'Solar Energy, Maharashtra', entity_type: 'solar_energy', grade: 'A', co2e_estimated: 4.10, confidence_score: 91, quantity: 25, unit_price_inr: 1320, proof_hash: 'zk_aab123...', methodology: 'AMS-I.D', vintage_year: 2026, lat: 19.0, lng: 73.2, seller_name: 'SunPower Co.' },
  { listing_id: 'mock_list_4', project_name: 'EV Fleet, Delhi NCR', entity_type: 'ev_fleet', grade: 'S', co2e_estimated: 12.80, confidence_score: 94, quantity: 100, unit_price_inr: 2100, proof_hash: 'zk_fff888...', methodology: 'AMS-III.C', vintage_year: 2026, lat: 28.6, lng: 77.2, seller_name: 'GreenMobility' },
  { listing_id: 'mock_list_5', project_name: 'Soil Carbon, Punjab', entity_type: 'soil_carbon', grade: 'B', co2e_estimated: 3.20, confidence_score: 71, quantity: 20, unit_price_inr: 850, proof_hash: '', methodology: 'VM0042', vintage_year: 2025, lat: 31.1, lng: 75.3, seller_name: 'Punjab AgriCo' },
];

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  ticker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(9, 20, 16, 0.6)', borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.12)', paddingHorizontal: Spacing.lg, paddingVertical: 8,
    overflow: 'hidden',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: Spacing.sm,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 4,
  },
  overviewRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  overviewCard: {
    backgroundColor: 'rgba(5, 15, 8, 0.55)',
    borderColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: Spacing.md,
  },
  overviewDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  searchRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: Spacing.lg,
    height: 46,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: Spacing.sm,
    color: Colors.textDim,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    ...Typography.bodyMd,
    paddingVertical: 8,
  },
  filterScroll: {
    height: 44,
  },
  filterSeparator: {
    width: 1,
    height: 18,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditCard: {
    marginBottom: 0,
    backgroundColor: 'rgba(9, 20, 16, 0.45)',
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },
  entityIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 20, 16, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
  },
  zkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 15, 8, 0.4)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
  },
  statsDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  buyBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.green,
  },
  buyBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
});
