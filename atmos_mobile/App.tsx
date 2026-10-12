import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/store';

// ─── Web Mobile Container ─────────────────────────────
// Constrains the app to a mobile viewport width when running in browser
function WebMobileContainer({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;

  return (
    <View style={webStyles.outerContainer}>
      <View style={webStyles.phoneFrame}>
        {children}
      </View>
    </View>
  );
}

const MAX_MOBILE_WIDTH = 430;

const webStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: MAX_MOBILE_WIDTH,
    flex: 1,
    backgroundColor: '#030A05',
    overflow: 'hidden' as any,
    // Subtle device frame aesthetics
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(34, 197, 94, 0.15)',
    // Shadow glow on sides for premium look
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
  },
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30000 } },
});

import { AuthScreen } from './src/screens/auth';
import { AppNavigator } from './src/navigation';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  const isLoading  = useAuthStore(s => s.isLoading);
  const load       = useAuthStore(s => s.loadFromStorage);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await load();
        await new Promise(r => setTimeout(r, 500));
        setShowSplash(false);
      } catch (err) {
        console.error('[App] initAuth error:', String(err));
        setError(String(err));
        setShowSplash(false);
      }
    };
    initAuth();
  }, [load]);

  // Show error state
  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#030A05', padding: 20 }}>
        <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Error Loading App
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 14, textAlign: 'center' }}>
          {error}
        </Text>
      </View>
    );
  }

  // Loading state
  if (showSplash || isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <WebMobileContainer>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#030A05' }}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={{ color: '#22C55E', marginTop: 20, fontSize: 24, fontWeight: '700', letterSpacing: 4 }}>
                ATMOS
              </Text>
              <Text style={{ color: '#6B9B74', marginTop: 8, fontSize: 12 }}>
                Loading...
              </Text>
            </View>
          </SafeAreaProvider>
        </WebMobileContainer>
      </GestureHandlerRootView>
    );
  }

  // Not logged in - show auth screen
  if (!isLoggedIn) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <WebMobileContainer>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <QueryClientProvider client={queryClient}>
              <AuthScreen onSuccess={() => {}} />
            </QueryClientProvider>
          </SafeAreaProvider>
        </WebMobileContainer>
      </GestureHandlerRootView>
    );
  }

  // Logged in - show main app
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WebMobileContainer>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <QueryClientProvider client={queryClient}>
            <AppNavigator />
          </QueryClientProvider>
        </SafeAreaProvider>
      </WebMobileContainer>
    </GestureHandlerRootView>
  );
}
