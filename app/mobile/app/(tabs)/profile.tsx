import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Clipboard,
  Linking,
  Modal,
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
import { useAuth } from "@/context/AuthContext";
import { useAtmos } from "@/context/AtmosContext";
import { AtmosCard } from "@/components/AtmosCard";

const KYC_STATUS_COLORS: Record<string, string> = {
  verified: "#2ECC71",
  pending: "#F39C12",
  not_started: "#E74C3C",
  rejected: "#E74C3C",
};
const KYC_STATUS_LABELS: Record<string, string> = {
  verified: "Verified",
  pending: "Pending",
  not_started: "Not Started",
  rejected: "Rejected",
};

type ActiveModal = "account" | "wallet" | "privacy" | "support" | "refer" | null;

const FAQ_ITEMS = [
  { q: "What is a carbon credit?", a: "A carbon credit represents one tonne of CO₂ equivalent reduced or removed from the atmosphere. Each credit is verified, tokenized, and recorded on Solana." },
  { q: "How does AI verification work?", a: "ATMOS uses satellite imagery (Sentinel-2) combined with our Anthropic AI model to verify your reported data against real-world land use and activity patterns." },
  { q: "What is a ZK Proof?", a: "Zero-Knowledge Proofs let you prove your carbon data is valid without revealing sensitive raw data — like GPS coordinates or financial details — to buyers or third parties." },
  { q: "How are prices determined?", a: "Prices are based on the grade (S/A/B/C/D) assigned during AI verification. Grade S assets command the highest prices (~₹2,100/t), Grade D the lowest (~₹300/t)." },
  { q: "When do I receive payment?", a: "Payments are processed instantly via Dodo Payments (UPI/USDC). USDC settlements reflect on Solana Devnet within seconds; UPI within 2-3 minutes." },
  { q: "How do I improve my grade?", a: "Provide complete, accurate data and upload high-quality photos. Projects with more historical data and consistent satellite readings score higher confidence." },
  { q: "Is my data private?", a: "Yes. Only aggregated carbon metrics are recorded on-chain. Raw coordinates, financial data, and personal details are protected by ZK proofs and never exposed." },
  { q: "What blockchains are supported?", a: "ATMOS currently runs on Solana Devnet for testing. Mainnet support is coming soon with full SPL token integration." },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const { projects, assets, totalCO2 } = useAtmos();

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editEmail, setEditEmail] = useState(user?.email ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const initials = (user?.name ?? "MG")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom + 72;

  const kycItems = [
    { key: "aadhaar", label: "Aadhaar Card", icon: "credit-card" as const, status: user?.kyc?.aadhaar?.status ?? "not_started", route: "/kyc/aadhaar" },
    { key: "pan", label: "PAN Card", icon: "file-text" as const, status: user?.kyc?.pan?.status ?? "not_started", route: "/kyc/pan" },
    { key: "farmDoc", label: "Farm Documents", icon: "map" as const, status: user?.kyc?.farmDoc?.status ?? "not_started", route: "/kyc/farm-doc" },
  ];

  const allVerified = kycItems.every((k) => k.status === "verified");
  const anyPending = kycItems.some((k) => k.status === "pending");
  const overallStatus = allVerified ? "verified" : anyPending ? "pending" : "not_started";

  const userProjects = projects.filter((p) => p.status === "minted" || p.status === "verified");
  const userAssets = assets.filter((a) => a.seller === "Self");
  const referralCode = "ATMOS-" + (user?.id ?? "USR001").replace("usr_", "").toUpperCase().slice(0, 6);

  function handleCopy(text: string, label: string) {
    if (Platform.OS === "web") {
      navigator.clipboard?.writeText(text);
    } else {
      Clipboard.setString(text);
    }
    Alert.alert("Copied", `${label} copied to clipboard`);
  }

  function handleSaveAccount() {
    updateUser({ name: editName, email: editEmail, phone: editPhone });
    setActiveModal(null);
  }

  const SETTINGS_GROUPS = [
    {
      title: "Account",
      items: [
        { icon: "user" as const, label: "Account Settings", sub: "Name, email, phone", modal: "account" as ActiveModal },
        { icon: "credit-card" as const, label: "Wallet & Payments", sub: (user?.walletAddress ?? "Not connected").slice(0, 16) + "...", modal: "wallet" as ActiveModal },
        { icon: "shield" as const, label: "Privacy & Security", sub: "ZK proof settings", modal: "privacy" as ActiveModal },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "help-circle" as const, label: "Support & FAQ", sub: "Help center · 8 articles", modal: "support" as ActiveModal },
        { icon: "share-2" as const, label: "Refer & Earn", sub: "Share to earn rewards", modal: "refer" as ActiveModal },
      ],
    },
  ];

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Profile & Settings</Text>

        <AtmosCard style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.foreground }]}>{user?.name ?? "ATMOS User"}</Text>
              {user?.email ? <Text style={[styles.contact, { color: colors.mutedForeground }]}>{user.email}</Text> : null}
              {user?.phone ? <Text style={[styles.contact, { color: colors.mutedForeground }]}>{user.phone}</Text> : null}
              {user?.authMethod === "google" && (
                <View style={[styles.authBadge, { backgroundColor: colors.secondary + "22" }]}>
                  <Feather name="mail" size={10} color={colors.secondary} />
                  <Text style={[styles.authBadgeText, { color: colors.secondary }]}>Google Account</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => { setEditName(user?.name ?? ""); setEditEmail(user?.email ?? ""); setEditPhone(user?.phone ?? ""); setActiveModal("account"); }}
              style={[styles.editBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name="edit-2" size={14} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={[styles.kycBadgeRow, { borderTopColor: colors.border }]}>
            <View style={[styles.kycBadge, { backgroundColor: KYC_STATUS_COLORS[overallStatus] + "22", borderColor: KYC_STATUS_COLORS[overallStatus] }]}>
              <Feather name={overallStatus === "verified" ? "check-circle" : "alert-circle"} size={13} color={KYC_STATUS_COLORS[overallStatus]} />
              <Text style={[styles.kycBadgeText, { color: KYC_STATUS_COLORS[overallStatus] }]}>KYC {KYC_STATUS_LABELS[overallStatus]}</Text>
            </View>
            <Pressable style={[styles.walletChip, { backgroundColor: colors.muted }]} onPress={() => handleCopy(user?.walletAddress ?? "", "Wallet address")}>
              <Feather name="link" size={11} color={colors.mutedForeground} />
              <Text style={[styles.walletText, { color: colors.mutedForeground }]}>{user?.walletAddress ?? "—"}</Text>
              <Feather name="copy" size={11} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </AtmosCard>

        <AtmosCard style={styles.statsCard} padding={14}>
          {[
            { label: "Projects", value: String(userProjects.length + 3) },
            { label: "Assets", value: String(userAssets.length + 3) },
            { label: "CO₂ Offset", value: totalCO2.toFixed(2) + "t" },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={[styles.statDiv, { backgroundColor: colors.border }]} />}
            </React.Fragment>
          ))}
        </AtmosCard>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>KYC VERIFICATION</Text>
          <AtmosCard padding={0}>
            {kycItems.map((item, i) => {
              const statusColor = KYC_STATUS_COLORS[item.status];
              return (
                <Pressable
                  key={item.key}
                  onPress={() => router.push(item.route as any)}
                  style={({ pressed }) => [styles.listItem, { borderBottomWidth: i < kycItems.length - 1 ? 1 : 0, borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={[styles.itemIcon, { backgroundColor: statusColor + "22" }]}>
                    <Feather name={item.icon} size={16} color={statusColor} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[styles.itemSub, { color: statusColor }]}>{KYC_STATUS_LABELS[item.status]}</Text>
                  </View>
                  <Feather name={item.status === "verified" ? "check-circle" : "chevron-right"} size={16} color={item.status === "verified" ? colors.primary : colors.mutedForeground} />
                </Pressable>
              );
            })}
          </AtmosCard>
        </View>

        {SETTINGS_GROUPS.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{group.title.toUpperCase()}</Text>
            <AtmosCard padding={0}>
              {group.items.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={() => setActiveModal(item.modal)}
                  style={({ pressed }) => [styles.listItem, { borderBottomWidth: i < group.items.length - 1 ? 1 : 0, borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={[styles.itemIcon, { backgroundColor: colors.muted }]}>
                    <Feather name={item.icon} size={16} color={colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </AtmosCard>
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, { borderColor: colors.destructive, opacity: pressed ? 0.7 : 1 }]}
          onPress={logout}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={activeModal === "account"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <ModalHeader title="Account Settings" onClose={() => setActiveModal(null)} colors={colors} />
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>Update your personal information</Text>
              <LabeledInput label="Full Name" value={editName} onChange={setEditName} placeholder="Your name" colors={colors} />
              <LabeledInput label="Email Address" value={editEmail} onChange={setEditEmail} placeholder="email@example.com" keyboardType="email-address" colors={colors} />
              <LabeledInput label="Phone Number" value={editPhone} onChange={setEditPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" colors={colors} />
              <View style={[styles.infoRow, { backgroundColor: colors.muted, borderRadius: 10, padding: 12 }]}>
                <Feather name="info" size={13} color={colors.secondary} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>Your wallet address is derived from your auth session and cannot be changed here.</Text>
              </View>
              <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleSaveAccount}>
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Save Changes</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === "wallet"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <ModalHeader title="Wallet & Payments" onClose={() => setActiveModal(null)} colors={colors} />
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <InfoCard
                title="Solana Wallet"
                icon="link"
                color={colors.primary}
                colors={colors}
              >
                <Text style={[styles.walletAddr, { color: colors.foreground }]}>{user?.walletAddress ?? "Not connected"}</Text>
                <Text style={[styles.walletNetwork, { color: colors.mutedForeground }]}>Network: Solana Devnet</Text>
                <Pressable style={[styles.copyBtn, { backgroundColor: colors.muted }]} onPress={() => handleCopy(user?.walletAddress ?? "", "Wallet address")}>
                  <Feather name="copy" size={14} color={colors.primary} />
                  <Text style={[styles.copyBtnText, { color: colors.primary }]}>Copy Address</Text>
                </Pressable>
              </InfoCard>

              <InfoCard title="Payment Methods" icon="credit-card" color={colors.secondary} colors={colors}>
                <WalletRow icon="smartphone" label="UPI / Bank Transfer" sub="Pay using Indian bank account" color={colors.primary} colors={colors} />
                <WalletRow icon="dollar-sign" label="USDC (Solana)" sub="Stablecoin for international buyers" color={colors.secondary} colors={colors} />
                <WalletRow icon="zap" label="Dodo Payments" sub="Secured by Dodo Payments gateway" color="#FFD700" colors={colors} />
              </InfoCard>

              <InfoCard title="Transaction History" icon="clock" color={colors.mutedForeground} colors={colors}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Your completed transactions will appear in the Portfolio tab under History.</Text>
                <Pressable style={[styles.linkBtn, { borderColor: colors.border }]} onPress={() => { setActiveModal(null); router.push("/(tabs)/portfolio" as any); }}>
                  <Text style={[styles.linkBtnText, { color: colors.primary }]}>View Portfolio →</Text>
                </Pressable>
              </InfoCard>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === "privacy"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <ModalHeader title="Privacy & Security" onClose={() => setActiveModal(null)} colors={colors} />
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <InfoCard title="Zero-Knowledge Proofs" icon="lock" color={colors.primary} colors={colors}>
                <Text style={[styles.infoBody, { color: colors.mutedForeground }]}>
                  All your carbon data is protected by Groth16 / Halo2 ZK proofs. Only the verified CO₂ amount is published — your raw coordinates, financial details, and sensor data are never exposed on-chain.
                </Text>
              </InfoCard>

              <InfoCard title="What is NOT exposed" icon="eye-off" color={colors.secondary} colors={colors}>
                {["GPS coordinates of your project", "Exact biomass / production quantities", "Bank account or payment details", "Personal ID numbers"].map((item) => (
                  <View key={item} style={styles.privacyRow}>
                    <Feather name="check" size={13} color={colors.primary} />
                    <Text style={[styles.privacyText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))}
              </InfoCard>

              <InfoCard title="What IS published on Solana" icon="globe" color="#FFD700" colors={colors}>
                {["CO₂ amount (tonnes)", "Asset grade (S/A/B/C/D)", "Geographic region (not exact location)", "ZK proof hash (verifiable)"].map((item) => (
                  <View key={item} style={styles.privacyRow}>
                    <Feather name="check" size={13} color="#FFD700" />
                    <Text style={[styles.privacyText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))}
              </InfoCard>

              <InfoCard title="Data Retention" icon="trash-2" color={colors.mutedForeground} colors={colors}>
                <Text style={[styles.infoBody, { color: colors.mutedForeground }]}>
                  Raw sensor data and images are retained for 7 years for regulatory compliance, encrypted at rest. You may request deletion via support.
                </Text>
                <Pressable style={[styles.linkBtn, { borderColor: colors.destructive }]} onPress={() => { setActiveModal("support"); }}>
                  <Text style={[styles.linkBtnText, { color: colors.destructive }]}>Request Data Deletion</Text>
                </Pressable>
              </InfoCard>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === "support"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <ModalHeader title="Support & FAQ" onClose={() => setActiveModal(null)} colors={colors} />
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <View style={[styles.supportBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="message-circle" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.supportBannerTitle, { color: colors.foreground }]}>Contact Support</Text>
                  <Text style={[styles.supportBannerSub, { color: colors.mutedForeground }]}>Avg. response time: 2 hours</Text>
                </View>
                <Pressable
                  style={[styles.smallBtn, { backgroundColor: colors.primary }]}
                  onPress={() => Linking.openURL("mailto:support@atmos.protocol?subject=ATMOS Support Request")}
                >
                  <Text style={[styles.smallBtnText, { color: colors.primaryForeground }]}>Email Us</Text>
                </Pressable>
              </View>

              <Text style={[styles.faqTitle, { color: colors.mutedForeground }]}>FREQUENTLY ASKED QUESTIONS</Text>

              {FAQ_ITEMS.map((item, i) => (
                <Pressable
                  key={i}
                  onPress={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                  style={[styles.faqItem, { backgroundColor: colors.card, borderColor: expandedFAQ === i ? colors.primary : colors.border }]}
                >
                  <View style={styles.faqHeader}>
                    <Text style={[styles.faqQ, { color: colors.foreground }]}>{item.q}</Text>
                    <Feather name={expandedFAQ === i ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                  </View>
                  {expandedFAQ === i && (
                    <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{item.a}</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === "refer"} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <ModalHeader title="Refer & Earn" onClose={() => setActiveModal(null)} colors={colors} />
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <View style={[styles.referBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                <Feather name="gift" size={32} color={colors.primary} />
                <Text style={[styles.referTitle, { color: colors.primary }]}>Earn ₹500 per Referral</Text>
                <Text style={[styles.referSub, { color: colors.mutedForeground }]}>Invite a project developer. When they mint their first carbon asset, you both earn ₹500 in platform credits.</Text>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>YOUR REFERRAL CODE</Text>
              <View style={[styles.codeBox, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <Text style={[styles.codeText, { color: colors.primary }]}>{referralCode}</Text>
                <Pressable style={[styles.copyBtnSmall, { backgroundColor: colors.primary }]} onPress={() => handleCopy(referralCode, "Referral code")}>
                  <Feather name="copy" size={14} color={colors.primaryForeground} />
                </Pressable>
              </View>

              <InfoCard title="How it works" icon="info" color={colors.secondary} colors={colors}>
                {[
                  "Share your referral code with a farmer or project developer",
                  "They sign up and create their first project",
                  "After they mint their first carbon asset, you both get ₹500 credits",
                  "Credits can be used to offset listing fees on ATMOS",
                ].map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.stepNumText, { color: colors.primaryForeground }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
                  </View>
                ))}
              </InfoCard>

              <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {[
                  { label: "Referred", value: "0" },
                  { label: "Pending", value: "0" },
                  { label: "Credits Earned", value: "₹0" },
                ].map((s, i, arr) => (
                  <React.Fragment key={s.label}>
                    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
                      <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={[styles.statDiv, { backgroundColor: colors.border, height: 28 }]} />}
                  </React.Fragment>
                ))}
              </View>

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  const msg = `Join ATMOS — turn your farm / solar / EV data into verified carbon assets on Solana!\n\nUse my referral code: ${referralCode}\n\nhttps://atmos.protocol/join`;
                  try {
                    const { Share } = await import("react-native");
                    await Share.share({ message: msg, title: "Refer a friend to ATMOS" });
                  } catch {}
                }}
              >
                <Feather name="share-2" size={16} color={colors.primaryForeground} />
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Share Referral Link</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ModalHeader({ title, onClose, colors }: { title: string; onClose: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
      <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
      <Pressable onPress={onClose} style={styles.closeBtn}>
        <Feather name="x" size={22} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

function LabeledInput({ label, value, onChange, placeholder, keyboardType, colors }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; keyboardType?: any; colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.fieldGap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.fieldBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.fieldInput, { color: colors.foreground }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType ?? "default"}
        />
      </View>
    </View>
  );
}

function InfoCard({ title, icon, color, colors, children }: { title: string; icon: any; color: string; colors: ReturnType<typeof useColors>; children: React.ReactNode }) {
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.infoCardHeader}>
        <Feather name={icon} size={15} color={color} />
        <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function WalletRow({ icon, label, sub, color, colors }: { icon: any; label: string; sub: string; color: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.walletRow}>
      <View style={[styles.walletRowIcon, { backgroundColor: color + "22" }]}>
        <Feather name={icon} size={14} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 14 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  profileCard: { gap: 12 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 22 },
  profileInfo: { flex: 1, gap: 2 },
  name: { fontFamily: "Inter_700Bold", fontSize: 17 },
  contact: { fontFamily: "Inter_400Regular", fontSize: 12 },
  authBadge: { flexDirection: "row", gap: 4, alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, marginTop: 2 },
  authBadgeText: { fontFamily: "Inter_500Medium", fontSize: 10 },
  editBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  kycBadgeRow: { flexDirection: "row", gap: 8, borderTopWidth: 1, paddingTop: 12, flexWrap: "wrap" },
  kycBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  kycBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  walletChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  walletText: { fontFamily: "Inter_400Regular", fontSize: 11, maxWidth: 120 },
  statsCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  statDiv: { width: 1 },
  section: { gap: 8 },
  sectionTitle: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.5 },
  listItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  itemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemInfo: { flex: 1 },
  itemLabel: { fontFamily: "Inter_500Medium", fontSize: 14 },
  itemSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginTop: 4 },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  sheetContent: { padding: 20, gap: 14, paddingBottom: 40 },
  sheetSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 4 },
  fieldGap: { gap: 6 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  fieldBox: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  fieldInput: { fontFamily: "Inter_400Regular", fontSize: 15 },
  infoRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 17 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  primaryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  infoCardHeader: { flexDirection: "row", gap: 8, alignItems: "center" },
  infoCardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  walletAddr: { fontFamily: "Inter_500Medium", fontSize: 15, letterSpacing: 0.5 },
  walletNetwork: { fontFamily: "Inter_400Regular", fontSize: 12 },
  copyBtn: { flexDirection: "row", gap: 6, alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  copyBtnText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  walletRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  walletRowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  linkBtn: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, marginTop: 4 },
  linkBtnText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  privacyRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  privacyText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  infoBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  supportBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  supportBannerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  supportBannerSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  faqTitle: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.5 },
  faqItem: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  faqQ: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  faqA: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  referBanner: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  referTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  referSub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 18 },
  codeBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: 2, paddingVertical: 14, paddingHorizontal: 18 },
  codeText: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: 2 },
  copyBtnSmall: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stepRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1 },
  stepNumText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  stepText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 18 },
  statsRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14 },
});
