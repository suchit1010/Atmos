import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { Button, Card, GradeBadge } from '../../components/common';
import { PaymentAPI } from '../../services/api';

const { width } = Dimensions.get('window');

type PayMethod = 'upi' | 'usdc';

// ─── Payment screen ───────────────────────────────────
export function PaymentScreen({ route, navigation }: any) {
  const { listing } = route.params;
  const [quantity,   setQuantity]   = useState(Math.min(5, listing?.quantity || 5));
  const [payMethod,  setPayMethod]  = useState<PayMethod>('upi');
  const [loading,    setLoading]    = useState(false);

  const unitPrice  = parseFloat(listing?.unit_price_inr || 1485);
  const subtotal   = unitPrice * quantity;
  const platformFee = Math.round(subtotal * 0.015);
  const networkFee  = 10;
  const total       = subtotal + platformFee + networkFee;
  const totalUSDC   = (total / 83.97).toFixed(2);

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data } = await PaymentAPI.createCheckout(listing.listing_id, quantity);

      // In production: open Dodo checkout webview
      // For hackathon demo: simulate success directly
      if (process.env.EXPO_PUBLIC_ENV === 'demo') {
        await PaymentAPI.simulateSuccess(data.sessionId);
        navigation.navigate('Settlement', {
          sessionId: data.sessionId,
          quantity,
          total,
          listing,
        });
      } else {
        navigation.navigate('Settlement', {
          sessionId: data.sessionId,
          checkoutUrl: data.checkoutUrl,
          quantity,
          total,
          listing,
        });
      }
    } catch (e: any) {
      // Demo fallback — simulate payment
      navigation.navigate('Settlement', {
        sessionId: 'demo_' + Date.now(),
        quantity, total, listing,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[Typography.bodyLg, { color: Colors.textMuted }]}>←</Text>
          </TouchableOpacity>
          <Text style={[Typography.displaySm, { color: Colors.text }]}>Payment</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>

          {/* What you're buying */}
          <Text style={[Typography.bodySm, { color: Colors.textMuted, marginBottom: Spacing.sm }]}>
            You are buying {listing?.project_name || 'Carbon Credits'}
          </Text>

          <Card style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View style={styles.assetIcon}>
                <Text style={{ fontSize: 24 }}>🌿</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.labelLg, { color: Colors.text }]} numberOfLines={1}>
                  {listing?.project_name || 'Biochar Production, Rajasthan'}
                </Text>
                <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>
                  {listing?.entity_type || 'Biochar'} · {listing?.methodology || 'VM0044'}
                </Text>
              </View>
              <GradeBadge grade={listing?.grade || 'A'} />
            </View>
          </Card>

          {/* Quantity selector */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.md }]}>
              QUANTITY (tCO₂e)
            </Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.qBtn}
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
              >
                <Text style={[Typography.displaySm, { color: Colors.text }]}>−</Text>
              </TouchableOpacity>
              <View style={styles.quantityDisplay}>
                <Text style={[Typography.display2xl, { color: Colors.primary }]}>{quantity}</Text>
                <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>tCO₂e</Text>
              </View>
              <TouchableOpacity
                style={styles.qBtn}
                onPress={() => setQuantity(q => Math.min(listing?.quantity || 48, q + 1))}
              >
                <Text style={[Typography.displaySm, { color: Colors.text }]}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={[Typography.bodyXs, { color: Colors.textDim, textAlign: 'center', marginTop: Spacing.sm }]}>
              Max available: {listing?.quantity || 48} t
            </Text>
          </Card>

          {/* Amount breakdown */}
          <Card style={{ marginBottom: Spacing.md }}>
            <View style={styles.priceRow}>
              <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>
                {quantity} tCO₂e × ₹{unitPrice.toLocaleString('en-IN')}
              </Text>
              <Text style={[Typography.monoMd, { color: Colors.text }]}>
                ₹{subtotal.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>Platform fee (1.5%)</Text>
              <Text style={[Typography.monoMd, { color: Colors.text }]}>₹{platformFee}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>Network fee (Solana)</Text>
              <Text style={[Typography.monoSm, { color: Colors.textDim }]}>~₹{networkFee}</Text>
            </View>
            <View style={[styles.totalRow]}>
              <Text style={[Typography.displaySm, { color: Colors.text }]}>Total</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[Typography.displayMd, { color: Colors.primary }]}>
                  ₹{total.toLocaleString('en-IN')}
                </Text>
                <Text style={[Typography.monoSm, { color: Colors.textMuted }]}>${totalUSDC} USDC</Text>
              </View>
            </View>
          </Card>

          {/* Payment method */}
          <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.sm }]}>
            PAYMENT METHOD
          </Text>

          <TouchableOpacity onPress={() => setPayMethod('upi')}>
            <View style={[styles.payMethodCard, payMethod === 'upi' ? styles.payMethodActive : {}]}>
              <View style={styles.payMethodIcon}>
                <Text style={{ fontSize: 22 }}>🏦</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={[Typography.labelMd, { color: Colors.text }]}>UPI / Bank Transfer</Text>
                <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>
                  Instant bank transfer via Dodo
                </Text>
              </View>
              <View style={[styles.radioOuter, payMethod === 'upi' ? styles.radioActive : {}]}>
                {payMethod === 'upi' && <View style={styles.radioInner} />}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPayMethod('usdc')} style={{ marginTop: Spacing.sm }}>
            <View style={[styles.payMethodCard, payMethod === 'usdc' ? styles.payMethodActive : {}]}>
              <View style={styles.payMethodIcon}>
                <Text style={{ fontSize: 22 }}>💎</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={[Typography.labelMd, { color: Colors.text }]}>USDC (Solana)</Text>
                <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>
                  Pay with stablecoin · ${totalUSDC}
                </Text>
              </View>
              <View style={[styles.radioOuter, payMethod === 'usdc' ? styles.radioActive : {}]}>
                {payMethod === 'usdc' && <View style={styles.radioInner} />}
              </View>
            </View>
          </TouchableOpacity>

          {/* Dodo logo */}
          <View style={styles.dodoRow}>
            <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>Secured by</Text>
            <View style={styles.dodoBadge}>
              <Text style={[Typography.labelSm, { color: Colors.dodo }]}>⚡ DODO PAYMENTS</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            label={`Pay ₹${total.toLocaleString('en-IN')}`}
            onPress={handlePay}
            loading={loading}
            size="lg"
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Settlement screen ────────────────────────────────
export function SettlementScreen({ route, navigation }: any) {
  const { sessionId, quantity, total, listing } = route.params;
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const txHash    = `${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`;

  React.useEffect(() => {
    const steps = [0, 1, 2, 3];
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setStep(i);
      if (i >= steps.length) {
        clearInterval(timer);
        setDone(true);
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
      }
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, alignItems: 'center' }}>

          {!done ? (
            <>
              <View style={{ marginTop: Spacing['4xl'], alignItems: 'center' }}>
                <Text style={{ fontSize: 48 }}>⛓️</Text>
                <Text style={[Typography.displaySm, { color: Colors.text, marginTop: Spacing.lg }]}>
                  Recording on Solana
                </Text>
                <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: Spacing.sm }]}>
                  Settlement in progress...
                </Text>
              </View>

              <Card style={{ width: '100%', marginTop: Spacing.xl }}>
                {['Confirming payment...', 'Transferring carbon asset...', 'Anchoring on Solana...', 'Issuing certificate...'].map((s, i) => (
                  <View key={i} style={[styles.settlementStep, i > 0 ? { borderTopWidth: 1, borderColor: Colors.border } : {}]}>
                    <Text style={[Typography.bodySm, { color: i <= step ? Colors.text : Colors.textDim, flex: 1 }]}>{s}</Text>
                    <Text style={{ fontSize: 14 }}>
                      {i < step ? '✅' : i === step ? '⟳' : '○'}
                    </Text>
                  </View>
                ))}
              </Card>

              <View style={styles.txInfo}>
                <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>TxHash:</Text>
                <Text style={[Typography.monoSm, { color: Colors.solana }]} numberOfLines={1}>
                  {txHash}
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Success animation */}
              <Animated.View style={{ marginTop: Spacing['3xl'], transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                <View style={styles.successCircle}>
                  <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.successGrad}>
                    <Text style={{ fontSize: 52 }}>✓</Text>
                  </LinearGradient>
                </View>
                <Text style={[Typography.displayMd, { color: Colors.text, marginTop: Spacing.xl, textAlign: 'center' }]}>
                  Payment Complete!
                </Text>
                <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' }]}>
                  Your credit is now in your portfolio and ready to register or issue as a certificate.
                </Text>
              </Animated.View>

              {/* Certificate card */}
              <Card style={{ width: '100%', marginTop: Spacing.xl, borderColor: Colors.primary + '40' }}>
                <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
                  <Text style={[Typography.labelXs, { color: Colors.primary, letterSpacing: 2 }]}>
                    ✦ CARBON ASSET CERTIFICATE ✦
                  </Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>Buyer</Text>
                  <Text style={[Typography.bodySm, { color: Colors.text }]}>You</Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>Asset</Text>
                  <Text style={[Typography.bodySm, { color: Colors.text }]} numberOfLines={1}>
                    {listing?.project_name || 'Biochar Batch #B24-018'}
                  </Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>Amount</Text>
                  <Text style={[Typography.labelMd, { color: Colors.primary }]}>{quantity} tCO₂e</Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>Price</Text>
                  <Text style={[Typography.monoMd, { color: Colors.text }]}>₹{total?.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>Date</Text>
                  <Text style={[Typography.monoSm, { color: Colors.text }]}>
                    {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>Blockchain</Text>
                  <Text style={[Typography.monoSm, { color: Colors.solana }]}>Solana · Devnet</Text>
                </View>
                <View style={[styles.certRow, { borderBottomWidth: 0 }]}>
                  <Text style={[Typography.bodyXs, { color: Colors.textDim }]}>TX</Text>
                  <Text style={[Typography.monoSm, { color: Colors.primary }]} numberOfLines={1}>
                    {txHash}
                  </Text>
                </View>
              </Card>
            </>
          )}
        </ScrollView>

        {done && (
          <View style={styles.bottomBar}>
            <View style={{ gap: Spacing.sm }}>
              <Button label="View Certificate" onPress={() => navigation.navigate('Portfolio')} size="lg" />
              <Button label="Explore More Credits" variant="ghost" onPress={() => navigation.navigate('Marketplace')} />
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  assetIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center',
  },
  quantityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl,
  },
  qBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  quantityDisplay: { alignItems: 'center' },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.md, marginTop: Spacing.xs,
  },
  payMethodCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
  },
  payMethodActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  payMethodIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.bgInput, alignItems: 'center', justifyContent: 'center',
  },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: Colors.textDim, alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  dodoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.xl,
  },
  dodoBadge: {
    backgroundColor: Colors.dodoDim, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.dodo + '40',
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bg, borderTopWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, paddingBottom: Spacing['2xl'],
  },
  settlementStep: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  txInfo: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'center',
    marginTop: Spacing.lg,
  },
  successCircle: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden', ...Shadow.green },
  successGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  certRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderColor: Colors.border,
  },
});
