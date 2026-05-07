import { Stack } from "expo-router";

export default function KYCLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="aadhaar" />
      <Stack.Screen name="pan" />
      <Stack.Screen name="farm-doc" />
    </Stack>
  );
}
