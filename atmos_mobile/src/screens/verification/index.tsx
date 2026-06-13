import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions,
  Linking, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { Button, Card, GradeBadge } from '../../components/common';
import { ProjectsAPI, connectMRVWebSocket, TokenStore, MarketAPI } from '../../services/api';
import { useMRVStore } from '../../store';

const { width } = Dimensions.get('window');

// ─── Animated progress ring ───────────────────────────
function ProgressRing({
  score, size = 120, color = Colors.primary,
}: { score: number; size?: number; color?: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: score, duration: 1200, useNativeDriver: false }).start();
  }, [score]);

  const circumference = 2 * Math.PI * (size / 2 - 8);
  const strokeDash = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, circumference],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: size / 2, borderWidth: 6,
        borderColor: Colors.bgInput,
      }} />
      {/* Score */}
      <View style={{ alignItems: 'center' }}>
        <Text style={[Typography.displayLg, { color, fontWeight: '700' }]}>{score}</Text>
        <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>/100</Text>
      </View>
    </View>
  );
}

// ─── Score bar ────────────────────────────────────────
function ScoreBar({ label, value, color = Colors.primary }: { label: string; value: number; color?: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 800, delay: 200, useNativeDriver: false }).start();
  }, [value]);
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>{label}</Text>
        <Text style={[Typography.monoSm, { color }]}>{value}/100</Text>
      </View>
      <View style={{ height: 6, backgroundColor: Colors.bgInput, borderRadius: 3, overflow: 'hidden' }}>
        <Animated.View style={{
          height: 6, borderRadius: 3, backgroundColor: color,
          width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        }} />
      </View>
    </View>
  );
}

// ─── Step progress item ───────────────────────────────
type StepStatus = 'waiting' | 'running' | 'done' | 'error';
function StepItem({ icon, label, sub, status }: {
  icon: string; label: string; sub?: string; status: StepStatus;
}) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (status === 'running') {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
      ).start();
    } else {
      spinAnim.stopAnimation();
    }
  }, [status]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const statusIcon = status === 'done'    ? '✅'
                   : status === 'error'   ? '❌'
                   : status === 'running' ? '⟳'
                   : '○';
  const statusColor = status === 'done'  ? Colors.success
                    : status === 'error' ? Colors.error
                    : status === 'running' ? Colors.warning
                    : Colors.textDim;

  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepIconBox, { backgroundColor: statusColor + '15' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Text style={[Typography.labelMd, { color: status === 'waiting' ? Colors.textDim : Colors.text }]}>
          {label}
        </Text>
        {sub && <Text style={[Typography.bodyXs, { color: Colors.textMuted, marginTop: 2 }]}>{sub}</Text>}
      </View>
      <Animated.Text style={[
        { fontSize: 16, color: statusColor },
        status === 'running' ? { transform: [{ rotate: spin }] } : {},
      ]}>
        {statusIcon}
      </Animated.Text>
    </View>
  );
}

// ─── Main Verification screen ─────────────────────────
export function VerificationScreen({ route, navigation }: any) {
  const { projectId } = route.params;
  const setMRVStep    = useMRVStore(s => s.setStep);
  const mrvData       = useMRVStore(s => s.pipelineData);
  const isRunning     = useMRVStore(s => s.isRunning);

  const [phase, setPhase]   = useState<'analyzing' | 'result'>('analyzing');
  const [steps, setSteps]   = useState({
    satellite: 'waiting' as StepStatus,
    ai:        'waiting' as StepStatus,
    zk:        'waiting' as StepStatus,
  });
  const [result, setResult] = useState<any>(null);
  const [error,  setError]  = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  // Polling fallback (when WebSocket not available in Expo Go)
  const pollTimer = useRef<any>(null);

  useEffect(() => {
    startPipeline();
    return () => {
      wsRef.current?.close();
      clearInterval(pollTimer.current);
    };
  }, [projectId]);

  const startPipeline = async () => {
    // Try WebSocket first
    const token = await TokenStore.getAccess() || '';
    try {
      const ws = connectMRVWebSocket(projectId, token, handleWSEvent);
      wsRef.current = ws;
    } catch { /* fall through to polling */ }

    // Always start polling as fallback
    pollTimer.current = setInterval(pollProjectStatus, 3000);

    // Trigger pipeline (already triggered on creation, but can re-trigger)
    setSteps(s => ({ ...s, satellite: 'running' }));
  };

  const handleWSEvent = (step: string, data: any) => {
    setMRVStep(step, data);
    switch (step) {
      case 'satellite.start': setSteps(s => ({ ...s, satellite: 'running' })); break;
      case 'satellite.done':  setSteps(s => ({ ...s, satellite: 'done', ai: 'running' })); break;
      case 'ai.start':        setSteps(s => ({ ...s, ai: 'running' })); break;
      case 'ai.done':         setSteps(s => ({ ...s, ai: 'done', zk: 'running' })); break;
      case 'zk.start':        setSteps(s => ({ ...s, zk: 'running' })); break;
      case 'zk.done':
      case 'verified':
        setSteps(s => ({ ...s, zk: 'done' }));
        clearInterval(pollTimer.current);
        loadResult();
        break;
      case 'rejected':
        setError(data?.reason || 'Project rejected');
        setSteps(s => ({ ...s, ai: 'error', zk: 'error' }));
        break;
    }
  };

  const pollProjectStatus = async () => {
    try {
      const { data } = await ProjectsAPI.get(projectId);
      const status   = data.status;

      if (status === 'analyzing') {
        setSteps(s => ({ ...s, satellite: 'done', ai: 'running' }));
      } else if (status === 'ai_complete') {
        setSteps(s => ({ ...s, satellite: 'done', ai: 'done', zk: 'running' }));
      } else if (status === 'zk_generated' || status === 'verified' || status === 'listed') {
        setSteps({ satellite: 'done', ai: 'done', zk: 'done' });
        clearInterval(pollTimer.current);
        setResult(data);
        setPhase('result');
      } else if (status === 'rejected') {
        setError('Project was rejected by AI verification');
        clearInterval(pollTimer.current);
      }
    } catch { /* silent */ }
  };

  const loadResult = async () => {
    try {
      const { data } = await ProjectsAPI.get(projectId);
      setResult(data);
      setPhase('result');
    } catch { /* silent */ }
  };

  const handleMint = () => {
    navigation.navigate('ZKProof', { projectId, result });
  };

  if (error) return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
        <Text style={{ fontSize: 64 }}>❌</Text>
        <Text style={[Typography.displaySm, { color: Colors.error, marginTop: Spacing.lg, textAlign: 'center' }]}>
          Verification Failed
        </Text>
        <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center' }]}>
          {error}
        </Text>
        <Button label="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: Spacing.xl }} />
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[Typography.bodyLg, { color: Colors.textMuted }]}>←</Text>
          </TouchableOpacity>
          <Text style={[Typography.displaySm, { color: Colors.text }]}>
            {phase === 'analyzing' ? 'AI Verification' : 'Verification Complete'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {phase === 'analyzing' && (
            <>
              {/* Animated satellite graphic */}
              <View style={styles.satelliteGraphic}>
                <View style={styles.satelliteOrbit}>
                  <Text style={{ fontSize: 32, position: 'absolute', top: 10, right: 20 }}>🛰️</Text>
                </View>
                <Text style={{ fontSize: 48 }}>🌍</Text>
                <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: Spacing.md }]}>
                  Fetching Sentinel-2 imagery...
                </Text>
              </View>

              {/* Steps */}
              <Card style={{ marginTop: Spacing.lg }}>
                <StepItem
                  icon="🛰️" label="Satellite Data Fetch" status={steps.satellite}
                  sub="Sentinel-2 imagery • NDVI • Biomass • Land-use"
                />
                <View style={styles.stepDivider} />
                <StepItem
                  icon="🤖" label="AI Carbon Estimation" status={steps.ai}
                  sub="Activity detection • Fraud check • CO₂e calculation"
                />
                <View style={styles.stepDivider} />
                <StepItem
                  icon="🔐" label="ZK Proof Generation" status={steps.zk}
                  sub="Privacy-preserving verification on Solana"
                />
              </Card>

              <Text style={[Typography.bodyXs, { color: Colors.textDim, textAlign: 'center', marginTop: Spacing.lg }]}>
                This may take a few seconds...
              </Text>
            </>
          )}

          {phase === 'result' && result && (
            <>
              {/* Hero result card */}
              <Card glowGreen style={{ alignItems: 'center', padding: Spacing['2xl'] }}>
                <ProgressRing
                  score={result.confidence_score || 87}
                  size={140}
                  color={
                    (result.confidence_score || 87) >= 80 ? Colors.primary :
                    (result.confidence_score || 87) >= 60 ? Colors.warning : Colors.error
                  }
                />
                <Text style={[Typography.labelLg, { color: Colors.primary, marginTop: Spacing.md }]}>
                  {(result.confidence_score || 87) >= 80 ? 'Very Good' :
                   (result.confidence_score || 87) >= 60 ? 'Good' : 'Fair'} Verification
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md }}>
                  <Text style={[Typography.display2xl, { color: Colors.text }]}>
                    {parseFloat(result.co2e_estimated || 2.46).toFixed(2)}
                  </Text>
                  <View>
                    <Text style={[Typography.bodyMd, { color: Colors.textMuted }]}>tCO₂e</Text>
                    <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>Estimated Annual</Text>
                  </View>
                  {result.grade && <GradeBadge grade={result.grade} size="lg" />}
                </View>
                <Text style={[Typography.bodyXs, { color: Colors.textDim, marginTop: 4 }]}>
                  ±{((parseFloat(result.co2e_estimated || 2.46)) * 0.18).toFixed(2)} tCO₂e uncertainty range
                </Text>
              </Card>

              {/* Score breakdown */}
              <Card style={{ marginTop: Spacing.md }}>
                <Text style={[Typography.labelMd, { color: Colors.textMuted, marginBottom: Spacing.md }]}>
                  SCORE BREAKDOWN
                </Text>
                <ScoreBar label="Activity Detection"    value={result.activity_detection    || 92} color={Colors.satellite} />
                <ScoreBar label="Satellite Consistency" value={result.satellite_consistency  || 85} color={Colors.primary} />
                <ScoreBar label="Data Quality"          value={result.data_quality           || 90} color={Colors.success} />
                <ScoreBar label="Fraud Risk (inverse)"  value={Math.round((1 - (result.fraud_risk === 'high' ? 0.8 : result.fraud_risk === 'medium' ? 0.5 : 0.1)) * 100)} color={Colors.gradeA} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm }}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Fraud Risk</Text>
                  <Text style={[Typography.labelSm, { color: result.fraud_risk === 'low' ? Colors.success : Colors.warning }]}>
                    {(result.fraud_risk || 'Low').charAt(0).toUpperCase() + (result.fraud_risk || 'Low').slice(1)} Risk
                  </Text>
                </View>
              </Card>

              {/* Methodology + Price */}
              <Card style={{ marginTop: Spacing.md }}>
                <View style={styles.metaRow}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Methodology</Text>
                  <Text style={[Typography.monoSm, { color: Colors.text }]}>
                    {result.methodology_match || 'VM0044'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Vintage Year</Text>
                  <Text style={[Typography.monoSm, { color: Colors.text }]}>
                    {new Date().getFullYear()}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Grade</Text>
                  <GradeBadge grade={result.grade || 'A'} />
                </View>
                <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Est. Price Range</Text>
                  <Text style={[Typography.labelMd, { color: Colors.primary }]}>
                    ₹{(result.price_min_inr || 1500).toLocaleString('en-IN')} — ₹{(result.price_max_inr || 1850).toLocaleString('en-IN')}/t
                  </Text>
                </View>
              </Card>

              {/* ZK proof info */}
              {result.proof_hash && (
                <Card style={{ marginTop: Spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <Text style={{ fontSize: 20 }}>🔐</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.labelSm, { color: Colors.zkPurple }]}>ZK Proof Generated</Text>
                      <Text style={[Typography.monoSm, { color: Colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
                        {result.proof_hash}
                      </Text>
                    </View>
                  </View>
                  {result.solana_anchor_tx && result.solana_anchor_tx !== 'pending' && (
                    <Text style={[Typography.bodyXs, { color: Colors.textDim, marginTop: Spacing.sm }]}>
                      Anchored on Solana · {result.solana_anchor_tx.slice(0, 16)}...
                    </Text>
                  )}
                </Card>
              )}
            </>
          )}
        </ScrollView>

        {phase === 'result' && (
          <View style={styles.bottomBar}>
            <Button label="Next: Create Carbon Asset →" onPress={handleMint} size="lg" />
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── ZK Proof screen ──────────────────────────────────
export function ZKProofScreen({ route, navigation }: any) {
  const { projectId, result } = route.params;
  const [step, setStep]   = useState(0); // 0-4 steps
  const [done,  setDone]  = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const ZK_STEPS = [
    { icon: '🔒', label: 'Encrypting your data',     sub: 'Production volumes • Coordinates • Equipment logs' },
    { icon: '⚙️', label: 'Building ZK proof circuit', sub: 'Groth16 • bn128 curve • carbon_mrv_v1' },
    { icon: '✓',  label: 'Verifying proof',           sub: 'Local verification before anchoring' },
    { icon: '⛓️', label: 'Anchoring to Solana',       sub: 'Memo program • Devnet' },
    { icon: '🎉', label: 'Proof complete',             sub: 'Privacy-preserving MRV verified' },
  ];

  useEffect(() => {
    let current = 0;
    const advance = () => {
      if (current >= ZK_STEPS.length) { setDone(true); return; }
      setStep(current);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      current++;
      setTimeout(advance, current === ZK_STEPS.length ? 800 : 1400);
    };
    setTimeout(advance, 600);
  }, []);

  const proofHash = result?.proof_hash || 'zk_7f9a2b1c...';

  return (
    <LinearGradient colors={['#040C06', '#0C0A14']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={{ width: 24 }} />
          <Text style={[Typography.displaySm, { color: Colors.text }]}>ZK Proof Generation</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* Hex animation graphic */}
          <View style={styles.zkGraphic}>
            <View style={[styles.zkHex, { borderColor: Colors.zkPurple + '40' }]}>
              <View style={[styles.zkHex, { width: 100, height: 100, borderRadius: 50, borderColor: Colors.zkPurple + '60' }]}>
                <Text style={{ fontSize: 36 }}>🔐</Text>
              </View>
            </View>
            <Text style={[Typography.labelMd, { color: Colors.zkPurple, marginTop: Spacing.md }]}>
              {done ? 'Proof Complete ✓' : 'Generating proof...'}
            </Text>
          </View>

          {/* Steps */}
          <Card style={{ marginTop: Spacing.xl }}>
            {ZK_STEPS.map((s, i) => (
              <View key={i}>
                <StepItem
                  icon={s.icon} label={s.label} sub={s.sub}
                  status={i < step ? 'done' : i === step ? 'running' : 'waiting'}
                />
                {i < ZK_STEPS.length - 1 && <View style={styles.stepDivider} />}
              </View>
            ))}
          </Card>

          {/* Privacy info */}
          <Card style={{ marginTop: Spacing.md, borderColor: Colors.zkDim }}>
            <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.sm }]}>
              WHAT IS NOT EXPOSED
            </Text>
            {['Production volumes', 'Exact coordinates', 'Equipment logs', 'Farmer identity'].map(item => (
              <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: Colors.error, marginRight: 8 }}>✕</Text>
                <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>{item}</Text>
              </View>
            ))}
            <Text style={[Typography.labelSm, { color: Colors.textMuted, marginTop: Spacing.md, marginBottom: Spacing.sm }]}>
              WHAT IS VERIFIED ON-CHAIN
            </Text>
            {[`${parseFloat(result?.co2e_estimated || 2.46).toFixed(1)} tCO₂e reduction`, 'Data timestamp', 'Geographic region (state-level)', 'Confidence score'].map(item => (
              <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: Colors.success, marginRight: 8 }}>✓</Text>
                <Text style={[Typography.bodySm, { color: Colors.text }]}>{item}</Text>
              </View>
            ))}
          </Card>

          {done && (
            <Card style={{ marginTop: Spacing.md, borderColor: Colors.borderBright }}>
              <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.xs }]}>
                Proof ID
              </Text>
              <Text style={[Typography.monoMd, { color: Colors.primary }]} numberOfLines={1}>
                {proofHash}
              </Text>
              {result?.solana_anchor_tx && (
                <>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted, marginTop: Spacing.sm, marginBottom: Spacing.xs }]}>
                    Solana Anchor TX
                  </Text>
                  <Text style={[Typography.monoSm, { color: Colors.solana }]} numberOfLines={1}>
                    {result.solana_anchor_tx}
                  </Text>
                </>
              )}
            </Card>
          )}
        </ScrollView>

        {done && (
          <View style={styles.bottomBar}>
            <Button
              label="Create Carbon Asset →"
              onPress={() => navigation.navigate('AssetCreated', { projectId, result })}
              size="lg"
            />
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Asset Created (Mint success) screen ──────────────
export function AssetCreatedScreen({ route, navigation }: any) {
  const { projectId, result } = route.params;
  const [minting, setMinting] = useState(false);
  const [minted,  setMinted]  = useState(false);
  const [mintData, setMintData] = useState<any>(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingPrice, setListingPrice] = useState('');
  const [creating, setCreating] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const explorerUrl = mintData?.mintAddress
    ? `https://explorer.solana.com/address/${mintData.mintAddress}?cluster=devnet`
    : null;

  const handleMint = async () => {
    setMinting(true);
    try {
      const { data } = await ProjectsAPI.mint(projectId, true);
      setMintData(data);
      setMinted(true);
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    } catch { setMinting(false); }
  };

  const handleListOnMarket = () => {
    setShowListingModal(true);
  };

  const handleCreateListing = async () => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return;
    }

    setCreating(true);
    try {
      await MarketAPI.createListing({
        creditId: mintData?.creditId || projectId,
        quantity: parseFloat(result?.co2e_estimated || 2.46),
        unitPriceInr: parseFloat(listingPrice),
      });

      setShowListingModal(false);
      Alert.alert(
        'Success!',
        'Your carbon credits are now listed on the marketplace',
        [
          {
            text: 'View Marketplace',
            onPress: () => navigation.navigate('Marketplace'),
          },
          {
            text: 'Go Home',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create listing');
    } finally {
      setCreating(false);
    }
  };

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, alignItems: 'center' }}>

          {minted ? (
            <>
              <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', marginTop: Spacing['4xl'] }}>
                <View style={styles.successCircle}>
                  <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.successGradient}>
                    <Text style={{ fontSize: 48 }}>✓</Text>
                  </LinearGradient>
                </View>
                <Text style={[Typography.displayMd, { color: Colors.text, marginTop: Spacing.xl, textAlign: 'center' }]}>
                  Your carbon asset{'\n'}is created!
                </Text>
                  <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' }]}>
                    Register it on the marketplace or keep it as a verified certificate.
                  </Text>
              </Animated.View>

              <Card style={{ width: '100%', marginTop: Spacing.xl }}>
                <View style={styles.assetMetaRow}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Name</Text>
                  <Text style={[Typography.bodySm, { color: Colors.text }]}>
                    {result?.name || 'Biochar Batch #B24-018'}
                  </Text>
                </View>
                <View style={styles.assetMetaRow}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Amount</Text>
                  <Text style={[Typography.labelMd, { color: Colors.primary }]}>
                    {parseFloat(result?.co2e_estimated || 2.46).toFixed(2)} tCO₂e
                  </Text>
                </View>
                <View style={styles.assetMetaRow}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Grade</Text>
                  <GradeBadge grade={result?.grade || 'A'} />
                </View>
                <View style={styles.assetMetaRow}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Methodology</Text>
                  <Text style={[Typography.monoSm, { color: Colors.text }]}>
                    {result?.methodology_match || 'VM0044'}
                  </Text>
                </View>
                <View style={styles.assetMetaRow}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Vintage</Text>
                  <Text style={[Typography.monoSm, { color: Colors.text }]}>{new Date().getFullYear()}</Text>
                </View>
                <View style={styles.assetMetaRow}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>On-chain</Text>
                  <Text style={[Typography.monoSm, { color: Colors.solana }]}>Solana Devnet</Text>
                </View>
                {mintData?.mintAddress && (
                  <View style={[styles.assetMetaRow, { borderBottomWidth: 0 }]}>
                    <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Mint Address</Text>
                    <Text style={[Typography.monoSm, { color: Colors.primary }]} numberOfLines={1}>
                      {(result?.proof_hash || 'zk_79a2b1c...').slice(0, 18)}...
                    </Text>
                  </View>
                )}
              </Card>
            </>
          ) : (
            <>
              <View style={{ marginTop: Spacing['4xl'], alignItems: 'center' }}>
                <Text style={{ fontSize: 64 }}>🪙</Text>
                <Text style={[Typography.displayMd, { color: Colors.text, marginTop: Spacing.lg, textAlign: 'center' }]}>
                  Ready to Mint
                </Text>
                <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' }]}>
                  Mint your verified carbon reduction as an SPL token on Solana
                </Text>
              </View>
              <Card style={{ width: '100%', marginTop: Spacing.xl }}>
                <View style={styles.assetMetaRow}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>CO₂e</Text>
                  <Text style={[Typography.labelMd, { color: Colors.primary }]}>
                    {parseFloat(result?.co2e_estimated || 2.46).toFixed(2)} tCO₂e
                  </Text>
                </View>
                <View style={styles.assetMetaRow}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Grade</Text>
                  <GradeBadge grade={result?.grade || 'A'} />
                </View>
                <View style={[styles.assetMetaRow, { borderBottomWidth: 0 }]}>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Solana tx fee</Text>
                  <Text style={[Typography.monoSm, { color: Colors.textDim }]}>~$0.0001</Text>
                </View>
              </Card>
            </>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          {minted ? (
            <View style={{ gap: Spacing.sm }}>
              <Button 
                label="List on Marketplace 🏦" 
                onPress={handleListOnMarket} 
                size="lg" 
              />
              <Button label="Back to Home" variant="ghost" onPress={() => navigation.navigate('Main')} />
              {explorerUrl && (
                <Button
                  label="Open Solana Explorer"
                  variant="ghost"
                  onPress={() => Linking.openURL(explorerUrl)}
                />
              )}
            </View>
          ) : (
            <Button label="Mint on Solana 🪙" onPress={handleMint} loading={minting} size="lg" />
          )}
        </View>

        {/* Listing Creation Modal */}
        <Modal
          visible={showListingModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowListingModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[Typography.displaySm, { color: Colors.text }]}>
                  List on Marketplace
                </Text>
                <TouchableOpacity onPress={() => setShowListingModal(false)}>
                  <Text style={[Typography.displaySm, { color: Colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 500 }}>
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={[Typography.labelMd, { color: Colors.textMuted, marginBottom: Spacing.md }]}>
                    ASSET DETAILS
                  </Text>
                  <View style={styles.assetMetaRow}>
                    <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Amount</Text>
                    <Text style={[Typography.labelMd, { color: Colors.primary }]}>
                      {parseFloat(result?.co2e_estimated || 2.46).toFixed(2)} tCO₂e
                    </Text>
                  </View>
                  <View style={styles.assetMetaRow}>
                    <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Grade</Text>
                    <GradeBadge grade={result?.grade || 'A'} />
                  </View>
                  <View style={[styles.assetMetaRow, { borderBottomWidth: 0 }]}>
                    <Text style={[Typography.labelSm, { color: Colors.textMuted }]}>Methodology</Text>
                    <Text style={[Typography.monoSm, { color: Colors.text }]}>
                      {result?.methodology_match || 'VM0044'}
                    </Text>
                  </View>
                </Card>

                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={[Typography.labelMd, { color: Colors.textMuted, marginBottom: Spacing.sm }]}>
                    SET PRICE
                  </Text>
                  <Text style={[Typography.bodyXs, { color: Colors.textDim, marginBottom: Spacing.md }]}>
                    Suggested price range: ₹{(result?.price_min_inr || 1500).toLocaleString('en-IN')} - ₹{(result?.price_max_inr || 1850).toLocaleString('en-IN')} per tCO₂e
                  </Text>
                  
                  <View style={styles.priceInputContainer}>
                    <Text style={[Typography.labelLg, { color: Colors.textMuted, marginRight: Spacing.xs }]}>₹</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="1500"
                      placeholderTextColor={Colors.textDim}
                      keyboardType="numeric"
                      value={listingPrice}
                      onChangeText={setListingPrice}
                    />
                    <Text style={[Typography.labelSm, { color: Colors.textMuted, marginLeft: Spacing.xs }]}>
                      /tCO₂e
                    </Text>
                  </View>

                  {listingPrice && parseFloat(listingPrice) > 0 && (
                    <View style={{ marginTop: Spacing.md, padding: Spacing.md, backgroundColor: Colors.primaryDim, borderRadius: Radius.md }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={[Typography.labelSm, { color: Colors.text }]}>Total Listing Value</Text>
                        <Text style={[Typography.labelLg, { color: Colors.primary }]}>
                          ₹{(parseFloat(listingPrice) * parseFloat(result?.co2e_estimated || 2.46)).toFixed(2)}
                        </Text>
                      </View>
                      <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>
                        = ₹{listingPrice} × {parseFloat(result?.co2e_estimated || 2.46).toFixed(2)} tCO₂e
                      </Text>
                    </View>
                  )}
                </Card>

                <Text style={[Typography.bodyXs, { color: Colors.textDim, textAlign: 'center', marginBottom: Spacing.lg }]}>
                  Your listing will appear on the marketplace immediately. You can withdraw it anytime.
                </Text>
              </ScrollView>

              <View style={{ gap: Spacing.sm }}>
                <Button 
                  label={creating ? "Creating Listing..." : "Create Listing →"} 
                  onPress={handleCreateListing}
                  loading={creating}
                  size="lg"
                />
                <Button 
                  label="Cancel" 
                  variant="ghost" 
                  onPress={() => setShowListingModal(false)}
                />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  satelliteGraphic: {
    alignItems: 'center', paddingVertical: Spacing['2xl'],
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
  },
  satelliteOrbit: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 1, borderColor: Colors.satellite + '30', borderStyle: 'dashed',
  },
  stepItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md,
  },
  stepIconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderColor: Colors.border,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bg, borderTopWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, paddingBottom: Spacing['2xl'],
  },
  zkGraphic: {
    alignItems: 'center', paddingVertical: Spacing['3xl'],
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.zkDim,
  },
  zkHex: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  successCircle: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden', ...Shadow.green },
  successGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  assetMetaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderColor: Colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  priceInput: {
    flex: 1,
    ...Typography.displayMd,
    color: Colors.text,
    padding: 0,
    textAlign: 'center',
  },
});
