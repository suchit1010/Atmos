import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAtmos } from "@/context/AtmosContext";
import { fetchSettlementById, fetchSettlementByDodo, subscribeToSettlement, Settlement } from "@/server/settlement";

export default function PaymentStatusScreen() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const { payments, updatePayment } = useAtmos();
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const payment = payments.find((p) => p.id === paymentId || p.dodoPaymentId === paymentId);

  // If the URL contains a payment identifier, try to resolve to internal payment id.
  useEffect(() => {
    if (!payment && typeof paymentId === "string") {
      const local = payments.find((p) => p.dodoPaymentId === paymentId || p.id === paymentId);
      if (local && local.id !== paymentId) {
        router.replace(`/payment/status?paymentId=${encodeURIComponent(local.id)}`);
        return;
      }

      (async () => {
        setLoading(true);
        try {
          const s = await fetchSettlementByDodo(paymentId);
          setSettlement(s as Settlement);
          setError(null);
        } catch (err: any) {
          try {
            const fallback = await fetchSettlementById(paymentId);
            setSettlement(fallback as Settlement);
            setError(null);
          } catch {
            setError(err?.message ?? "Settlement not found");
          }
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [payment, paymentId, payments]);

  useEffect(() => {
    if (!payment?.settlementId) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const loadSettlement = async () => {
      try {
        const data = await fetchSettlementById(payment.settlementId!);
        setSettlement(data);
        setError(null);

        // Update payment status if settlement status changed
        if (data.status === "credit_received" && payment.settlementStatus !== "credit_received") {
          updatePayment(payment.id, {
            settlementStatus: "credit_received",
            status: "processing",
          });
        } else if ((data.status === "minted" || data.status === "settled") && payment.status !== "completed") {
          updatePayment(payment.id, {
            settlementStatus: data.status,
            status: "completed",
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settlement");
      } finally {
        setLoading(false);
      }
    };

    loadSettlement();

    // Subscribe to updates
    if (payment.settlementId) {
      unsubscribe = subscribeToSettlement(payment.settlementId, (updated) => {
        setSettlement(updated);
        if (updated.status === "credit_received" && payment.settlementStatus !== "credit_received") {
          updatePayment(payment.id, {
            settlementStatus: "credit_received",
            status: "processing",
          });
        } else if ((updated.status === "minted" || updated.status === "settled") && payment.status !== "completed") {
          updatePayment(payment.id, {
            settlementStatus: updated.status,
            status: "completed",
          });
        }
      });
    }

    return () => unsubscribe?.();
  }, [payment?.settlementId, payment?.id]);

  // Poll for settlement by dodoPaymentId if payment exists but has no settlementId
  useEffect(() => {
    if (!payment || payment.settlementId || !payment.dodoPaymentId) return;

    let mounted = true;
    const interval = setInterval(async () => {
      try {
        const s = await fetchSettlementByDodo(payment.dodoPaymentId!);
        if (s && mounted) {
          setSettlement(s as Settlement);
          updatePayment(payment.id, { 
            settlementId: s.id, 
            settlementStatus: s.status,
            status: s.status === "processing" ? "processing" : (s.status === "credit_received" ? "processing" : (s.status === "minted" || s.status === "settled" ? "completed" : "processing"))
          });
        }
      } catch (err) {
        // ignore not found
      }
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [payment?.id, payment?.dodoPaymentId]);

  if (!payment) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Payment not found</Text>
      </View>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
      case "settled":
      case "credit_received":
        return "#10b981";
      case "processing":
      case "pending":
        return "#f59e0b";
      case "failed":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "credit_received":
        return "💳 Credit Received";
      case "minted":
        return "🪙 Asset Minted";
      case "settled":
        return "✅ Settled";
      case "pending":
        return "⏳ Pending";
      case "processing":
        return "⚙️ Processing";
      case "failed":
        return "❌ Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Status</Text>
        <Text style={styles.timestamp}>
          {new Date(payment.createdAt).toLocaleString()}
        </Text>
      </View>

      {/* Payment Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>
            ₹{payment.amount.toLocaleString()} {payment.currency}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Asset</Text>
          <Text style={styles.value}>{payment.assetName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Quantity</Text>
          <Text style={styles.value}>{payment.quantity} unit(s)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment ID</Text>
          <Text style={[styles.value, styles.mono]}>
            {payment.dodoPaymentId?.substring(0, 16)}...
          </Text>
        </View>
      </View>

      {/* Payment Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Status</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(payment.status) + "20", borderColor: getStatusColor(payment.status) },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
            {getStatusLabel(payment.status)}
          </Text>
        </View>
      </View>

      {/* Settlement Status */}
      {payment.settlementId && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settlement Status</Text>
          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Fetching settlement details...</Text>
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : settlement ? (
            <>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      getStatusColor(settlement.status) + "20",
                    borderColor: getStatusColor(settlement.status),
                  },
                ]}
              >
                <Text style={[styles.statusText, { color: getStatusColor(settlement.status) }]}>
                  {getStatusLabel(settlement.status)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Settlement ID</Text>
                <Text style={[styles.value, styles.mono]}>
                  {settlement.id.substring(0, 16)}...
                </Text>
              </View>

              {settlement.grantId && (
                <View style={styles.row}>
                  <Text style={styles.label}>Grant ID</Text>
                  <Text style={[styles.value, styles.mono]}>{settlement.grantId}</Text>
                </View>
              )}

              {settlement.creditAmount && (
                <View style={styles.row}>
                  <Text style={styles.label}>Credit Amount</Text>
                  <Text style={styles.value}>₹{settlement.creditAmount.toLocaleString()}</Text>
                </View>
              )}

              {settlement.solanaSignature && (
                <View style={styles.row}>
                  <Text style={styles.label}>Solana TX</Text>
                  <Text style={[styles.value, styles.mono]}>
                    {settlement.solanaSignature.substring(0, 16)}...
                  </Text>
                </View>
              )}

              <View style={styles.row}>
                <Text style={styles.label}>Updated</Text>
                <Text style={styles.value}>
                  {new Date(settlement.updatedAt * 1000).toLocaleString()}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      )}

      {/* Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timeline</Text>
        <View style={styles.timeline}>
          <TimelineItem
            label="Payment Created"
            timestamp={payment.createdAt}
            completed={true}
          />
          <TimelineItem
            label="Dodo Payment Processed"
            timestamp={payment.updatedAt}
            completed={payment.status !== "pending"}
          />
          <TimelineItem
            label="Credit Received"
            completed={settlement?.status === "credit_received" || settlement?.status === "minted" || settlement?.status === "settled"}
          />
          <TimelineItem
            label="Asset Minted"
            completed={settlement?.status === "minted" || settlement?.status === "settled"}
          />
          <TimelineItem
            label="Settlement Complete"
            completed={settlement?.status === "settled"}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function TimelineItem({
  label,
  timestamp,
  completed,
}: {
  label: string;
  timestamp?: string;
  completed?: boolean;
}) {
  return (
    <View style={styles.timelineItem}>
      <View
        style={[
          styles.timelineDot,
          { backgroundColor: completed ? "#10b981" : "#d1d5db" },
        ]}
      />
      <View style={styles.timelineContent}>
        <Text style={styles.timelineLabel}>{label}</Text>
        {timestamp && (
          <Text style={styles.timelineTime}>
            {new Date(timestamp).toLocaleString()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 14,
    color: "#6b7280",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  mono: {
    fontFamily: "Courier New",
    fontSize: 12,
  },
  statusBadge: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  error: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
  },
  timeline: {
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  timelineTime: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
});
