import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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
import { AtmosCard } from "@/components/AtmosCard";
import { AtmosButton } from "@/components/AtmosButton";
import { GradeTag } from "@/components/GradeTag";

export default function PaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assets, addPayment } = useAtmos();
  const asset = assets.find((a) => a.id === id);

  const [quantity, setQuantity] = useState("48");
  const [method, setMethod] = useState<"upi" | "usdc">("upi");
  const [loading, setLoading] = useState(false);

  if (!asset) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.foreground }}>Asset not found</Text>
      </View>
    );
  }

  const qty = Math.max(1, parseInt(quantity) || 1);
  const subtotal = asset.price * qty;
  const platformFee = Math.round(subtotal * 0.015);
  const networkFee = 10;
  const total = subtotal + platformFee + networkFee;

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  async function handlePay() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    addPayment({
      assetId: asset.id,
      assetName: asset.name,
      amount: total,
      quantity: qty,
      currency: method === "upi" ? "INR" : "USDC",
      status: "completed",
      txId: "Sol_" + Math.random().toString(36).substring(2, 12).toUpperCase(),
    });
    setLoading(false);
    router.push({ pathname: "/settlement/[id]", params: { id: asset.id, amount: String(total), qty: String(qty) } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Payment</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.buyLabel, { color: colors.mutedForeground }]}>
          You are buying {asset.name}
        </Text>

        <AtmosCard style={styles.assetSummary}>
          <View style={styles.assetRow}>
            <GradeTag grade={asset.grade} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.assetName, { color: colors.foreground }]} numberOfLines={1}>
                {asset.name}
              </Text>
              <Text style={[styles.assetLoc, { color: colors.mutedForeground }]}>{asset.location}</Text>
            </View>
          </View>
        </AtmosCard>

        <View style={styles.qtyRow}>
          <Text style={[styles.qtyLabel, { color: colors.mutedForeground }]}>Amount to pay</Text>
          <View style={[styles.qtyInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable onPress={() => setQuantity(String(Math.max(1, qty - 1)))}>
              <Feather name="minus" size={18} color={colors.foreground} />
            </Pressable>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              style={[styles.qtyText, { color: colors.foreground }]}
              textAlign="center"
            />
            <Pressable onPress={() => setQuantity(String(Math.min(asset.available, qty + 1)))}>
              <Feather name="plus" size={18} color={colors.foreground} />
            </Pressable>
          </View>
          <Text style={[styles.unitPrice, { color: colors.mutedForeground }]}>
            ₹{asset.price.toLocaleString("en-IN")} / tCO₂e
          </Text>
        </View>

        <AtmosCard style={styles.breakdown} padding={0}>
          {[
            { label: `${qty} × ₹${asset.price.toLocaleString("en-IN")}`, value: `₹${subtotal.toLocaleString("en-IN")}`, highlight: false },
            { label: "Platform fee (1.5%)", value: `₹${platformFee}`, highlight: false },
            { label: "Network fee (Solana)", value: `₹${networkFee}`, highlight: false },
          ].map((row) => (
            <View key={row.label} style={[styles.breakdownRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              <Text style={[styles.breakdownValue, { color: colors.foreground }]}>{row.value}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.primary }]}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>₹{total.toLocaleString("en-IN")}</Text>
          </View>
        </AtmosCard>

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
              <Feather name="smartphone" size={20} color={colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodLabel, { color: colors.foreground }]}>UPI / Bank Transfer</Text>
              <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>Pay via instant bank transfer</Text>
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
              <Feather name="dollar-sign" size={20} color={colors.secondary} />
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

        <View style={[styles.poweredBy, { borderColor: colors.border }]}>
          <Feather name="shield" size={14} color={colors.mutedForeground} />
          <Text style={[styles.poweredText, { color: colors.mutedForeground }]}>
            Secured by Dodo Payments
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
        <AtmosButton
          label={`Pay with Dodo  ₹${total.toLocaleString("en-IN")}`}
          onPress={handlePay}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  content: {
    padding: 20,
    gap: 14,
  },
  buyLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  assetSummary: {
    gap: 0,
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  assetName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  assetLoc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  qtyRow: {
    gap: 6,
  },
  qtyLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  qtyInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  qtyText: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    minWidth: 80,
  },
  unitPrice: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  breakdown: {
    overflow: "hidden",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  breakdownLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  breakdownValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  totalValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  methodSection: {
    gap: 10,
  },
  methodTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  methodLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  methodSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  poweredBy: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  poweredText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
