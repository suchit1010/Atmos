import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Linking } from "react-native";
import * as LinkingExpo from "expo-linking";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AtmosProvider } from "@/context/AtmosContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/(auth)/" as any);
      }
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="project/create" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="project/capture" options={{ headerShown: false }} />
      <Stack.Screen name="verify/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="zk/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="asset/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="payment/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="settlement/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="kyc" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const handleUrlEvent = (event: { url?: string } | string | null) => {
      const url = typeof event === "string" ? event : event?.url;
      if (!url) return;
      try {
        const parsed = LinkingExpo.parse(url);
        const path = parsed.path ?? "";
        const params: any = parsed.queryParams ?? {};
        if (path.startsWith("payment") || path === "payment/status" || path === "payment-result") {
          const paymentId = params.paymentId || params.id || params.payment || "";
          if (paymentId) {
            router.push(`/payment/status?paymentId=${encodeURIComponent(paymentId)}`);
          } else {
            router.push(`/payment/status`);
          }
        }
      } catch (err) {
        console.warn("Failed to parse deep link:", err);
      }
    };

    // Handle initial URL on cold start
    (async () => {
      try {
        const initial = await Linking.getInitialURL();
        if (initial) handleUrlEvent(initial);
      } catch (err) {
        console.warn("Error getting initial URL", err);
      }
    })();

    const sub = Linking.addEventListener("url", (evt) => handleUrlEvent(evt));
    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AtmosProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AtmosProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
