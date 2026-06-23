import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../theme';
import { Home, FolderKey, LineChart, User, Plus } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

// Screens
import { DashboardScreen }   from '../screens/dashboard';
import { MarketplaceScreen } from '../screens/marketplace';
import { PortfolioScreen }   from '../screens/portfolio';
import { ProfileScreen }     from '../screens/profile';
import {
  SelectProjectTypeScreen,
  CaptureDataScreen,
} from '../screens/project';
import { ProjectDetailScreen } from '../screens/project/detail';
import {
  VerificationScreen,
  ZKProofScreen,
  AssetCreatedScreen,
} from '../screens/verification';
import { PaymentScreen, SettlementScreen } from '../screens/payment';

// API & Components
import { ProjectsAPI } from '../services/api';
import { Card, StatusBadge, GradeBadge } from '../components/common';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const SCREEN_OPTIONS = { headerShown: false, animationEnabled: true };

// ─── Custom tab bar ───────────────────────────────────
function ATMOSTabBar({ state, descriptors, navigation }: any) {
  const TABS = [
    { key: 'Home',       label: 'Home' },
    { key: 'Projects',   label: 'Projects' },
    { key: 'NewProject', label: '' },
    { key: 'Market',     label: 'Market' },
    { key: 'Profile',    label: 'Profile' },
  ];

  const TAB_ICONS: Record<string, any> = {
    Home:     Home,
    Projects: FolderKey,
    Market:   LineChart,
    Profile:  User,
  };

  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tabBarInner}>
        {state.routes.map((route: any, i: number) => {
          const isFocused = state.index === i;
          const tab       = TABS[i];
          const isCenter  = tab?.key === 'NewProject';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (isCenter) {
            return (
              <TouchableOpacity key={route.key} onPress={onPress} style={styles.centerBtn} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  style={styles.centerBtnInner}
                >
                  <Plus color="#040C06" size={28} strokeWidth={3} />
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          const IconComponent = TAB_ICONS[tab?.key] || Home;

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem} activeOpacity={0.6}>
              <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
                <IconComponent 
                  size={24} 
                  color={isFocused ? Colors.primary : Colors.textDim} 
                  strokeWidth={isFocused ? 2.5 : 2} 
                />
              </View>
              <Text style={[
                Typography.bodyXs,
                { color: isFocused ? Colors.primary : Colors.textDim, marginTop: 4, fontWeight: isFocused ? '700' : '400', fontSize: 10 },
              ]}>
                {tab?.label}
              </Text>
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main tab navigator ───────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <ATMOSTabBar {...props} />}
      screenOptions={SCREEN_OPTIONS}
    >
      <Tab.Screen name="Home"       component={DashboardScreen} />
      <Tab.Screen name="Projects"   component={ProjectsListScreen} />
      <Tab.Screen name="NewProject" component={SelectProjectTypeScreen} />
      <Tab.Screen name="Market"     component={MarketplaceScreen} />
      <Tab.Screen name="Profile"    component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Simple projects list (reuses dashboard data) ─────
function ProjectsListScreen({ navigation }: any) {
  const [refresh, setRefresh] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn:  () => ProjectsAPI.list({ limit: 50 }).then((r: any) => r.data),
  });

  const projects = data?.projects || [];

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: Spacing.lg }}>
          <Text style={[Typography.displaySm, { color: Colors.text }]}>My Projects</Text>
        </View>
        <FlatList
          data={projects}
          keyExtractor={(p: any) => p.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingTop: 0, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refresh}
              onRefresh={async () => { setRefresh(true); await refetch(); setRefresh(false); }}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }: any) => (
            <Card style={{ marginBottom: Spacing.sm }} onPress={() => navigation.navigate('Verification', { projectId: item.id })}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginRight: Spacing.md }}>
                  {{ biochar: '🌾', agroforestry: '🌳', solar_energy: '☀️', ev_fleet: '⚡', building: '🏢' }[item.entity_type as string] || '🌿'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.labelMd, { color: Colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[Typography.bodyXs, { color: Colors.textMuted }]}>
                    {item.co2e_estimated ? `${parseFloat(item.co2e_estimated).toFixed(2)} tCO₂e` : 'Pending analysis'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <StatusBadge status={item.status} />
                  {item.grade && <GradeBadge grade={item.grade} size="sm" />}
                </View>
              </View>
            </Card>
          )}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ fontSize: 48 }}>🌱</Text>
              <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: 12, textAlign: 'center' }]}>
                No projects yet. Tap + to create one.
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Root stack ───────────────────────────────────────
export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
        <Stack.Screen name="Main"          component={MainTabs} />
        <Stack.Screen name="CreateProject" component={SelectProjectTypeScreen} />
        <Stack.Screen name="CaptureData"   component={CaptureDataScreen} />
        <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
        <Stack.Screen name="Verification"  component={VerificationScreen} />
        <Stack.Screen name="ZKProof"       component={ZKProofScreen} />
        <Stack.Screen name="AssetCreated"  component={AssetCreatedScreen} />
        <Stack.Screen name="Marketplace"   component={MarketplaceScreen} />
        <Stack.Screen name="Portfolio"     component={PortfolioScreen} />
        <Stack.Screen name="Payment"       component={PaymentScreen} />
        <Stack.Screen name="Settlement"    component={SettlementScreen} />
        <Stack.Screen name="Profile"       component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 197, 94, 0.2)',
    overflow: 'hidden',
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 12,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(5, 12, 8, 0.6)',
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative'
  },
  tabIconWrap: {
    width: 48, height: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: 16,
    marginBottom: 2,
  },
  tabIconWrapActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  activeDot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary,
    position: 'absolute', bottom: -8,
  },
  tabLabel:      { ...Typography.bodyXs, color: Colors.textDim, marginTop: 2 },
  tabLabelActive:{ ...Typography.bodyXs, color: Colors.primary, marginTop: 2 },
  centerBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -30,
  },
  centerBtnInner: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
