import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/navigation';
import { SplashScreen, AuthScreen } from './src/screens/auth';
import { useAuthStore } from './src/store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30000 } },
});

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  const isLoading  = useAuthStore(s => s.isLoading);
  const load       = useAuthStore(s => s.loadFromStorage);

  useEffect(() => {
    const initAuth = async () => {
      await load();
      // Small delay to show splash nicely
      await new Promise(r => setTimeout(r, 800));
      setShowSplash(false);
    };
    initAuth();
  }, [load]);

  if (showSplash || isLoading) return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen onDone={() => setShowSplash(false)} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  if (!isLoggedIn) return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <QueryClientProvider client={queryClient}>
          <AuthScreen onSuccess={() => {}} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <QueryClientProvider client={queryClient}>
          <AppNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
