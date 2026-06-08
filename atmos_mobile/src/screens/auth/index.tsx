import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Animated, Dimensions, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { Button, Input } from '../../components/common';
import { AtmosLogo } from '../../components/common/AtmosLogo';
import { AuthAPI, TokenStore } from '../../services/api';
import { useAuthStore } from '../../store';

const { width, height } = Dimensions.get('window');

// ─── Splash Screen ────────────────────────────────────
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.75)).current;
  const lineAnim   = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow continuous rotation
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
    // Entrance + line draw + hold
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      ]),
      Animated.timing(lineAnim, { toValue: 1, duration: 700, delay: 200, useNativeDriver: false }),
      Animated.delay(1200),
    ]).start(() => onDone());
  }, []);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <LinearGradient colors={['#030A05', '#071209', '#030A05']} style={styles.splash}>
      {/* Ambient glow */}
      <View style={styles.splashGlow} />

      <Animated.View style={{ alignItems: 'center', transform: [{ scale: scaleAnim }], opacity: fadeAnim }}>
        {/* Slowly rotating flower of life */}
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <AtmosLogo size={140} color="#22C55E" />
        </Animated.View>

        {/* Wordmark */}
        <Text style={{
          fontSize: 40, fontWeight: '700', color: '#E8F5EA',
          letterSpacing: 8, marginTop: Spacing.xl,
        }}>
          ATMOS
        </Text>
        <Text style={[Typography.labelSm, { color: Colors.primary, letterSpacing: 5, marginTop: 5 }]}>
          PROTOCOL
        </Text>

        {/* Animated separator */}
        <Animated.View style={{
          height: 1, backgroundColor: Colors.primary, marginTop: Spacing.xl,
          width: lineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
          opacity: 0.5,
        }} />

        <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: Spacing.lg, textAlign: 'center' }]}>
          Private. Verifiable. Instant. Global.
        </Text>
        <Text style={[Typography.bodySm, { color: Colors.textDim, marginTop: Spacing.xs, textAlign: 'center' }]}>
          Real-world climate action → Carbon assets in 24 hours
        </Text>
      </Animated.View>

      <Animated.View style={{ position: 'absolute', bottom: 56, alignItems: 'center', opacity: fadeAnim }}>
        <Text style={[Typography.bodyXs, { color: Colors.textDim, letterSpacing: 1 }]}>
          Powered by Solana · ZK Proofs · Dodo Payments
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

// ─── Auth Screen ──────────────────────────────────────
export function AuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep]               = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone]             = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [loading, setLoading]         = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const login   = useAuthStore(s => s.login);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [step]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (phone.length < 7) return Alert.alert('Enter a valid phone number');
    setLoading(true);
    try {
      const { data } = await AuthAPI.sendOTP(phone, countryCode);
      setStep('otp');
      setResendTimer(30);
      fadeAnim.setValue(0);

      if (data.devOtp) {
        const otpDigits = data.devOtp.split('').slice(0, 6);
        setOtp([...otpDigits, ...Array(6 - otpDigits.length).fill('')]);
        await new Promise(resolve => setTimeout(resolve, 250));
        await handleVerifyOTP(data.devOtp);
        return;
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (overrideOtp?: string) => {
    const otpStr = overrideOtp || otp.join('');
    if (otpStr.length < 6) return Alert.alert('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const fingerprint = `mobile-${Platform.OS}-${Date.now()}`;
      const { data }    = await AuthAPI.verifyOTP(phone, countryCode, otpStr, fingerprint);
      await login(data.user, data.accessToken, data.refreshToken);
      onSuccess();
    } catch (e: any) {
      Alert.alert('Invalid OTP', e.response?.data?.message || 'Please check and retry');
    } finally { setLoading(false); }
  };

  const handleOTPChange = (val: string, idx: number) => {
    if (val.length > 1) {
      // Paste handling
      const digits = val.replace(/\D/g, '').split('').slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (i < 6) newOtp[i] = d; });
      setOtp(newOtp);
      otpRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[idx]  = val;
    setOtp(newOtp);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    else if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const COUNTRIES = [
    { code: '91', flag: '🇮🇳', name: 'India' },
    { code: '1',  flag: '🇺🇸', name: 'USA' },
    { code: '44', flag: '🇬🇧', name: 'UK' },
    { code: '971',flag: '🇦🇪', name: 'UAE' },
  ];
  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">

            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: Spacing['3xl'] }}>
              <AtmosLogo size={72} color="#22C55E" />
              <Text style={{
                fontSize: 26, fontWeight: '700', color: Colors.text,
                letterSpacing: 5, marginTop: Spacing.md,
              }}>
                ATMOS
              </Text>
              <Text style={[Typography.bodyMd, { color: Colors.textMuted, marginTop: Spacing.xs, textAlign: 'center' }]}>
                {step === 'phone' ? 'Sign in to continue your climate journey' : `OTP sent to +${countryCode} ${phone}`}
              </Text>
            </View>

            <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
              {step === 'phone' ? (
                <View>
                  {/* Country + Phone */}
                  <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.xs }]}>
                    Phone Number
                  </Text>
                  <View style={styles.phoneRow}>
                    <TouchableOpacity style={styles.countryBtn}>
                      <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
                      <Text style={[Typography.bodyMd, { color: Colors.text, marginLeft: 6 }]}>
                        +{countryCode}
                      </Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.phoneInput}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="98765 43210"
                      placeholderTextColor={Colors.textDim}
                      keyboardType="phone-pad"
                      maxLength={12}
                    />
                  </View>

                  <Button
                    label="Send OTP"
                    onPress={handleSendOTP}
                    loading={loading}
                    style={{ marginTop: Spacing.xl }}
                  />

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={[Typography.bodyXs, { color: Colors.textDim, marginHorizontal: 12 }]}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={[styles.socialBtn, { flex: 1 }]}>
                      <Text style={{ fontSize: 18 }}>🔵</Text>
                      <Text style={[Typography.labelSm, { color: Colors.text, marginLeft: 8 }]}>Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.socialBtn, { flex: 1 }]}>
                      <Text style={{ fontSize: 18 }}>⚫</Text>
                      <Text style={[Typography.labelSm, { color: Colors.text, marginLeft: 8 }]}>Apple</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[Typography.bodyXs, { color: Colors.textDim, textAlign: 'center', marginTop: Spacing.xl }]}>
                    No passwords. No KYC friction. Privacy by design.
                  </Text>
                </View>
              ) : (
                <View>
                  {/* OTP boxes */}
                  <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.md, textAlign: 'center' }]}>
                    Enter OTP
                  </Text>
                  <View style={styles.otpRow}>
                    {otp.map((digit, i) => (
                      <TextInput
                        key={i}
                        ref={r => { otpRefs.current[i] = r; }}
                        style={[styles.otpBox, digit ? styles.otpBoxFilled : {}]}
                        value={digit}
                        onChangeText={v => handleOTPChange(v, i)}
                        keyboardType="number-pad"
                        maxLength={6}
                        textAlign="center"
                        selectionColor={Colors.primary}
                      />
                    ))}
                  </View>

                  <Button
                    label="Verify OTP"
                    onPress={handleVerifyOTP}
                    loading={loading}
                    style={{ marginTop: Spacing.xl }}
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg }}>
                    <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>
                      Didn't receive?{' '}
                    </Text>
                    {resendTimer > 0 ? (
                      <Text style={[Typography.bodySm, { color: Colors.textDim }]}>
                        Resend in {resendTimer}s
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendOTP}>
                        <Text style={[Typography.bodySm, { color: Colors.primary }]}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity onPress={() => setStep('phone')} style={{ alignItems: 'center', marginTop: Spacing.md }}>
                    <Text style={[Typography.bodySm, { color: Colors.textMuted }]}>← Change number</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashGlow: {
    position: 'absolute', top: height * 0.2,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(34,197,94,0.06)',
  },
  logoContainer: {
    width: 80, height: 80, borderRadius: 22,
    overflow: 'hidden', ...Shadow.green,
  },
  logoGradient: {
    flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 22,
  },
  authContainer: {
    flexGrow: 1, padding: Spacing['2xl'], justifyContent: 'center',
  },
  phoneRow: {
    flexDirection: 'row', gap: Spacing.sm,
    backgroundColor: Colors.bgInput, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingRight: Spacing.md,
  },
  countryBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderRightWidth: 1, borderColor: Colors.border,
  },
  phoneInput: {
    flex: 1, height: 50,
    ...Typography.bodyMd,
    color: Colors.text,
    paddingLeft: Spacing.md,
  },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  otpBox: {
    width: 48, height: 56, borderRadius: Radius.md,
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border,
    ...Typography.displaySm, color: Colors.text, textAlign: 'center',
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgInput, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
});
