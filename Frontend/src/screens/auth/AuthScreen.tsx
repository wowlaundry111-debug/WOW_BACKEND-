import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Mail, ShieldCheck, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { RegisterScreen } from './RegisterScreen';
import { WowLogo } from '../../components/WowLogo';

// ─── Main Auth Screen ─────────────────────────────────────────────────────────
export const AuthScreen = () => {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [step, setStep] = useState<'IDENTIFIER' | 'OTP'>('IDENTIFIER');
  const [identifier, setIdentifier] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [otpEmail, setOtpEmail] = useState(''); // email OTP was sent to
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const { sendLoginOtp, verifyLoginOtp } = useAppStore();

  // Step 1: request OTP or direct login for staff
  const handleRequestOtp = async () => {
    if (!identifier || identifier.trim().length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    const res = await sendLoginOtp(identifier.trim());
    setLoading(false);

    if (!res.success) {
      const msg = res.message || '';
      if (msg.toLowerCase().includes('register first') || msg.toLowerCase().includes('no account found')) {
        const emailToPass = identifier.trim();
        setRegisterEmail(emailToPass);
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined' && window.confirm(`No account found for "${emailToPass}".\n\nWould you like to open the Registration screen now?`)) {
            setScreen('REGISTER');
          }
        } else {
          Alert.alert(
            'Account Not Found',
            `No account found for "${emailToPass}". Would you like to register a new account?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Register Now', onPress: () => setScreen('REGISTER') },
            ]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          alert(msg);
        } else {
          Alert.alert('Sign In', msg);
        }
      }
      return;
    }

    if (res.requiresOtp) {
      // Customer OTP sent — move to step 2
      setOtpEmail(identifier.trim());
      setOtp('');
      setStep('OTP');
    }
  };

  // Step 2: verify OTP
  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    const res = await verifyLoginOtp(otpEmail, otp.trim());
    setLoading(false);

    if (!res.success) {
      if (Platform.OS === 'web') {
        alert(res.message);
      } else {
        Alert.alert('Verification Failed', res.message);
      }
    }
  };

  const isStep1Valid = identifier.trim().length >= 2;
  const isStep2Valid = otp.trim().length === 6;

  if (screen === 'REGISTER') {
    return (
      <RegisterScreen
        initialEmail={registerEmail || identifier}
        onBack={() => setScreen('LOGIN')}
        onRegisterSuccess={() => {
          // Registration already signs in directly and updates store state
        }}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: (insets.top > 0 ? insets.top : 44) + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <WowLogo width={260} height={95} />
        </View>

        {/* Neo-Brutalist Login Card */}
        <View style={styles.card}>

          {step === 'IDENTIFIER' ? (
            <>
              <Text style={styles.cardTitle}>SIGN IN</Text>
              <Text style={styles.cardSubtitle}>Enter your email address to sign in</Text>

              {/* Email Input */}
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrap}>
                <Mail size={20} color={COLORS.black} strokeWidth={2.5} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#6B7280"
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={COLORS.black}
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, !isStep1Valid && styles.btnDisabled]}
                onPress={handleRequestOtp}
                disabled={!isStep1Valid || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.black} />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.btnText}>SIGN IN</Text>
                    <ArrowRight size={18} color={COLORS.black} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>ENTER CODE</Text>
              <Text style={styles.cardSubtitle}>
                We sent a 6-digit verification code to{`\n`}{otpEmail}
              </Text>

              {/* 6-Digit OTP Input Boxes */}
              <Text style={styles.fieldLabel}>VERIFICATION CODE</Text>
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const digit = otp[idx] || '';
                  return (
                    <View
                      key={idx}
                      style={[styles.otpBox, digit ? styles.otpBoxActive : null]}
                    >
                      <Text style={styles.otpBoxText}>{digit}</Text>
                    </View>
                  );
                })}
                <TextInput
                  style={styles.hiddenOtpInput}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, !isStep2Valid && styles.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={!isStep2Valid || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.black} />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.btnText}>VERIFY & SIGN IN</Text>
                    <ArrowRight size={18} color={COLORS.black} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Resend / Back */}
              <TouchableOpacity
                onPress={() => { setStep('IDENTIFIER'); setOtp(''); }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}
              >
                <RefreshCw size={14} color='#6B7280' strokeWidth={2.5} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B7280' }}>Wrong email? Go back</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => setScreen('REGISTER')}>
              <Text style={styles.registerLink}> REGISTER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  kav: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  scrollContent: {
    padding: SPACING.mobile,
    alignItems: 'center',
    paddingBottom: 40,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...NEO_SHADOW.box8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  btn: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    ...NEO_SHADOW.box6,
  },
  btnDisabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#9CA3AF',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.8,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  registerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  otpContainer: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.sm,
    gap: 6,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  otpBoxActive: {
    backgroundColor: COLORS.secondary,
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  hiddenOtpInput: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.01,
  },
});
