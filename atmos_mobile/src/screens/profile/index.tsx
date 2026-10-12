import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card, StatusBadge, GradeBadge } from '../../components/common';
import { useAuthStore } from '../../store';

export function ProfileScreen({ navigation }: any) {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const updateUser = useAuthStore(s => s.updateUser);
  
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.organisation || '');

  const handleSave = () => {
    updateUser({
      name: editName || null,
      organisation: editEmail || null,
    });
    setEditing(false);
    Alert.alert('Success', 'Profile updated');
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await logout();
          navigation?.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
        style: 'destructive',
      },
    ]);
  };

  const kycStatusColor = {
    pending: Colors.warning,
    verified: Colors.success,
    rejected: Colors.error,
  }[user?.kycStatus as string] || Colors.textMuted;

  const roleEmoji = {
    producer: '🌱',
    buyer: '🛍️',
    auditor: '🔍',
    admin: '👨‍💼',
  }[user?.role as string] || '👤';

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[Typography.displayMd, { color: Colors.text }]}>
              Account Settings
            </Text>
            <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>
              Manage your profile & preferences
            </Text>
          </View>

          {/* Profile Card */}
          <Card style={{ marginBottom: Spacing.lg }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 56 }}>{roleEmoji}</Text>
              </View>
              <Text style={[Typography.labelMd, { color: Colors.text, marginTop: Spacing.md }]}>
                {user?.name || 'No name set'}
              </Text>
              <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>
                {user?.phone || 'Unknown'}
              </Text>
            </View>

            <View style={styles.separator} />

            {/* Edit Mode */}
            {editing ? (
              <View style={{ gap: Spacing.md }}>
                <View>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.xs }]}>
                    Full Name
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={Colors.textDim}
                    value={editName}
                    onChangeText={setEditName}
                  />
                </View>

                <View>
                  <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.xs }]}>
                    Organization / Company
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your organization"
                    placeholderTextColor={Colors.textDim}
                    value={editEmail}
                    onChangeText={setEditEmail}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: Colors.border }]} onPress={() => setEditing(false)}>
                    <Text style={[Typography.labelMd, { color: Colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: Colors.primary }]} onPress={handleSave}>
                    <Text style={[Typography.labelMd, { color: Colors.textInverse }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={{ gap: Spacing.md }}>
                  <View style={styles.infoRow}>
                    <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>Full Name</Text>
                    <Text style={[Typography.labelMd, { color: Colors.text }]}>{user?.name || '—'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>Organization</Text>
                    <Text style={[Typography.labelMd, { color: Colors.text }]}>{user?.organisation || '—'}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.button, { marginTop: Spacing.md }]} onPress={() => setEditing(true)}>
                  <Text style={[Typography.labelMd, { color: Colors.primary }]}>✎ Edit Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </Card>

          {/* Account Status */}
          <Card style={{ marginBottom: Spacing.lg }}>
            <Text style={[Typography.labelMd, { color: Colors.textMuted, marginBottom: Spacing.md }]}>
              Account Status
            </Text>

            <View style={[styles.statusRow, { borderBottomColor: Colors.border, borderBottomWidth: 1, paddingBottom: Spacing.md, marginBottom: Spacing.md }]}>
              <View>
                <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>KYC Verification</Text>
                <Text style={[Typography.bodySm, { color: Colors.textDim, marginTop: 2 }]}>
                  Required for selling credits
                </Text>
              </View>
              <StatusBadge status={user?.kycStatus as string} />
            </View>

            <View style={styles.statusRow}>
              <View>
                <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>Account Role</Text>
                <Text style={[Typography.bodySm, { color: Colors.textDim, marginTop: 2 }]}>
                  {user?.role?.toUpperCase()}
                </Text>
              </View>
              <Text style={{ fontSize: 20 }}>{roleEmoji}</Text>
            </View>

            {user?.kycStatus === 'pending' && (
              <TouchableOpacity
                style={[styles.button, { marginTop: Spacing.md, backgroundColor: Colors.warning }]}
                onPress={async () => {
                  updateUser({ kycStatus: 'verified' });
                  Alert.alert('KYC', 'KYC marked verified (demo)');
                }}
              >
                <Text style={[Typography.labelMd, { color: Colors.textInverse }]}>→ Start KYC Verification</Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* Wallet Section */}
          <Card style={{ marginBottom: Spacing.lg }}>
            <Text style={[Typography.labelMd, { color: Colors.textMuted, marginBottom: Spacing.md }]}>
              Wallet
            </Text>

            <View style={styles.walletBox}>
              <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>Solana Address</Text>
              <Text style={[Typography.monoSm, { color: Colors.primary, marginTop: Spacing.xs }]}>
                {user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : '—'}
              </Text>
            </View>

            {!user?.walletAddress && (
              <TouchableOpacity
                style={[styles.button, { marginTop: Spacing.md }]}
                onPress={async () => {
                  const demoAddr = 'DemoWalletPubkey11111111111111111111111';
                  updateUser({ walletAddress: demoAddr });
                  Alert.alert('Wallet', 'Demo Solana wallet connected');
                }}
              >
                <Text style={[Typography.labelMd, { color: Colors.primary }]}>+ Connect Wallet</Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* Support */}
          <Card style={{ marginBottom: Spacing.lg }}>
            <Text style={[Typography.labelMd, { color: Colors.textMuted, marginBottom: Spacing.md }]}>
              Support & Resources
            </Text>

            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://docs.atmos.app')}>
              <Text style={[Typography.bodySm, { color: Colors.text }]}>📖 Documentation</Text>
              <Text style={{ fontSize: 14 }}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('mailto:support@atmos.app')}>
              <Text style={[Typography.bodySm, { color: Colors.text }]}>📧 Support Email</Text>
              <Text style={{ fontSize: 14 }}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://discord.gg/atmos')}>
              <Text style={[Typography.bodySm, { color: Colors.text }]}>💬 Discord Community</Text>
              <Text style={{ fontSize: 14 }}>→</Text>
            </TouchableOpacity>
          </Card>

          {/* App Info */}
          <Card style={{ marginBottom: Spacing.lg, backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: Colors.primary, borderWidth: 1 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[Typography.labelMd, { color: Colors.primary }]}>ATMOS Protocol</Text>
              <Text style={[Typography.bodySm, { color: Colors.textMuted, marginTop: Spacing.xs }]}>v1.0.0</Text>
              <Text style={[Typography.bodyXs, { color: Colors.textDim, marginTop: Spacing.xs, textAlign: 'center' }]}>
                Private. Verifiable. Instant.{'\n'}Powered by Solana & ZK Proofs
              </Text>
            </View>
          </Card>

          {/* Logout */}
          <TouchableOpacity style={[styles.button, { backgroundColor: Colors.error, marginBottom: Spacing['2xl'] }]} onPress={handleLogout}>
            <Text style={[Typography.labelMd, { color: '#fff' }]}>🚪 Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.bgCard,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
});
