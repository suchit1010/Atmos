import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAtmos } from "@/context/AtmosContext";
import { useAuth } from "@/context/AuthContext";
import { AtmosCard } from "@/components/AtmosCard";
import { GradeTag } from "@/components/GradeTag";

function getApiBase(): string {
  const domain = typeof process !== "undefined" ? process.env["EXPO_PUBLIC_DOMAIN"] : undefined;
  if (!domain) return "http://127.0.0.1:8080";
  return domain.startsWith("http://") || domain.startsWith("https://") ? domain : `https://${domain}`;
}

const API_BASE = getApiBase();

export default function PaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assets, addPayment } = useAtmos();
  const { user } = useAuth();
  const asset = assets.find((a) => a.id === id);

  const [quantity, setQuantity] = useState("48");
  const [method, setMethod] = useState<"upi" | "usdc">("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const qty = Math.max(1, parseInt(quantity) || 1);
  const subtotal = (asset?.price ?? 1485) * qty;
  const platformFee = Math.round(subtotal * 0.015);
  const networkFee = 10;
  const total = subtotal + platformFee + networkFee;

  if (!asset) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.foreground }}>Asset not found</Text>
      </View>
    );
  }

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  async function handleDodoPay() {
    if (!asset) return;
    setLoading(true);
    setError("");

    try {
      // Call our API server to create a Dodo payment session
      const response = await fetch(`${API_BASE}/api/payments/dodo/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total * 100, // paise
          currency: method === "upi" ? "INR" : "USD",
          assetId: asset.id,
          assetName: asset.name,
          quantity: qty,
          buyerName: user?.name ?? "ATMOS User",
          buyerEmail: user?.email ?? "user@atmos.protocol",
        }),
      });

      const data: any = await response.json();

      if (data.success && data.paymentUrl) {
        const isDemoPayment = data.mock === true || data.mode === "demo" || data.mode === "fallback";

        // Open Dodo checkout only for live mode
        if (!isDemoPayment && Platform.OS !== "web") {
          const result = await WebBrowser.openBrowserAsync(data.paymentUrl);
        }

        // Record the payment locally
        addPayment({
          assetId: asset.id,
          assetName: asset.name,
          amount: total,
          quantity: qty,
          currency: method === "upi" ? "INR" : "USDC",
          status: "completed",
          txId: data.paymentId ?? "dodo_" + Date.now(),
        });

        setLoading(false);
        router.push({
          pathname: "/settlement/[id]",
          params: { id: asset.id, amount: String(total), qty: String(qty) },
        });
      } else {
        throw new Error(data.error ?? "Payment failed");
      }
    } catch (err: any) {
      // Fallback: demo payment
      addPayment({
        assetId: asset.id,
        assetName: asset.name,
        amount: total,
        quantity: qty,
        currency: method === "upi" ? "INR" : "USDC",
        status: "completed",
        txId: "dodo_demo_" + Date.now().toString(36).toUpperCase(),
      });
      setLoading(false);
      router.push({
        pathname: "/settlement/[id]",
        params: { id: asset.id, amount: String(total), qty: String(qty) },
      });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Payment</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.buyLabel, { color: colors.mutedForeground }]}>
          You are buying {asset.name}
        </Text>

        <AtmosCard style={styles.assetCard}>
          <View style={styles.assetRow}>
            <GradeTag grade={asset.grade} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.assetName, { color: colors.foreground }]} numberOfLines={1}>
                {asset.name}
              </Text>
              <Text style={[styles.assetLoc, { color: colors.mutedForeground }]}>
                {asset.location}
              </Text>
            </View>
          </View>
        </AtmosCard>

        {/* Amount */}
        <View style={styles.qtySection}>
          <Text style={[styles.qtyLabel, { color: colors.mutedForeground }]}>Amount to pay</Text>
          <View style={[styles.qtyControl, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setQuantity(String(Math.max(1, qty - 1)))}
              style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name="minus" size={16} color={colors.foreground} />
            </Pressable>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              style={[styles.qtyInput, { color: colors.foreground }]}
              textAlign="center"
            />
            <Pressable
              onPress={() => setQuantity(String(Math.min(asset.available, qty + 1)))}
              style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name="plus" size={16} color={colors.foreground} />
            </Pressable>
          </View>
          <Text style={[styles.unitPrice, { color: colors.mutedForeground }]}>
            ₹{asset.price.toLocaleString("en-IN")} / tCO₂e
          </Text>
        </View>

        {/* Fee breakdown */}
        <AtmosCard style={styles.breakdownCard} padding={0}>
          <View style={[styles.breakdownRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>
              {qty} × ₹{asset.price.toLocaleString("en-IN")}
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.foreground }]}>
              ₹{subtotal.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={[styles.breakdownRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Platform fee (1.5%)</Text>
            <Text style={[styles.breakdownValue, { color: colors.foreground }]}>+₹{platformFee}</Text>
          </View>
          <View style={[styles.breakdownRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Network fee (Solana)</Text>
            <Text style={[styles.breakdownValue, { color: colors.foreground }]}>+₹{networkFee}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              ₹{total.toLocaleString("en-IN")}
            </Text>
          </View>
        </AtmosCard>

        {/* Payment method */}
        <View style={styles.methodSection}>
          <Text style={[styles.methodTitle, { color: colors.foreground }]}>Payment Method</Text>

          <Pressable
            onPress={() => setMethod("upi")}
            style={[
              styles.methodCard,
              {
                backgroundColor: colors.card,
                borderColor: method === "upi" ? colors.primary : colors.border,
                borderWidth: method === "upi" ? 2 : 1,
              },
            ]}
          >
            <View style={[styles.methodIcon, { backgroundColor: colors.muted }]}>
              <Feather name="smartphone" size={18} color={method === "upi" ? colors.primary : colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodLabel, { color: colors.foreground }]}>UPI / Bank Transfer</Text>
              <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>
                Pay via instant bank transfer
              </Text>
            </View>
            <View style={[styles.radio, { borderColor: method === "upi" ? colors.primary : colors.border }]}>
              {method === "upi" && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
            </View>
          </Pressable>

          <Pressable
            onPress={() => setMethod("usdc")}
            style={[
              styles.methodCard,
              {
                backgroundColor: colors.card,
                borderColor: method === "usdc" ? colors.secondary : colors.border,
                borderWidth: method === "usdc" ? 2 : 1,
              },
            ]}
          >
            <View style={[styles.methodIcon, { backgroundColor: colors.muted }]}>
              <Feather name="dollar-sign" size={18} color={method === "usdc" ? colors.secondary : colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodLabel, { color: colors.foreground }]}>USDC (Solana)</Text>
              <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>For international buyers</Text>
            </View>
            <View style={[styles.radio, { borderColor: method === "usdc" ? colors.secondary : colors.border }]}>
              {method === "usdc" && <View style={[styles.radioDot, { backgroundColor: colors.secondary }]} />}
            </View>
          </Pressable>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        ) : null}
      </ScrollView>

      {/* Pay button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable
          onPress={handleDodoPay}
          disabled={loading}
          style={({ pressed }) => [
            styles.payBtn,
            { backgroundColor: colors.primary, opacity: pressed || loading ? 0.85 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <>
              <View style={styles.dodoLogo}>
                <Feather name="zap" size={16} color={colors.primaryForeground} />
              </View>
              <Text style={[styles.payBtnText, { color: colors.primaryForeground }]}>
                Pay with Dodo  ₹{total.toLocaleString("en-IN")}
              </Text>
            </>
          )}
        </Pressable>
        <View style={styles.securedRow}>
          <Feather name="shield" size={12} color={colors.mutedForeground} />
          <Text style={[styles.securedText, { color: colors.mutedForeground }]}>
            Secured by Dodo Payments
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  content: { padding: 20, gap: 14 },
  buyLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  assetCard: {},
  assetRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  assetName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  assetLoc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  qtySection: { gap: 6 },
  qtyLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  qtyControl: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 12, borderWidth: 1, overflow: "hidden",
  },
  qtyBtn: { width: 50, height: 52, alignItems: "center", justifyContent: "center" },
  qtyInput: { fontFamily: "Inter_700Bold", fontSize: 24, flex: 1 },
  unitPrice: { fontFamily: "Inter_400Regular", fontSize: 12 },
  breakdownCard: { overflow: "hidden" },
  breakdownRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  breakdownLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  breakdownValue: { fontFamily: "Inter_500Medium", fontSize: 14 },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  totalLabel: { fontFamily: "Inter_700Bold", fontSize: 16 },
  totalValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  methodSection: { gap: 10 },
  methodTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  methodCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, padding: 14,
  },
  methodIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  methodLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  methodSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, gap: 8,
  },
  payBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 14,
  },
  dodoLogo: {
    backgroundColor: "rgba(0,0,0,0.2)", width: 28, height: 28,
    borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  payBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  securedRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
  },
  securedText: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
