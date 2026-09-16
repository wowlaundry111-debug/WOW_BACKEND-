import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ArrowLeft, User, Phone, Mail, Lock, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { WowLogo } from '../../components/WowLogo';

interface RegisterScreenProps {
  onBack: () => void;
  onRegisterSuccess: (email: string) => void;
  initialEmail?: string;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBack, onRegisterSuccess, initialEmail = '' }) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountExists, setAccountExists] = useState(false);

  const otpInputRef = useRef<TextInput>(null);
  const { register, verifyOtp } = useAppStore();

  useEffect(() => {
    if (step === 'OTP') {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const isFormValid = name.trim().length >= 2 && phone.replace(/[^0-9]/g, '').length === 10 && email.includes('@');
  const isOtpValid = otp.trim().length === 6;

  const handleRegister = async () => {
    if (!isFormValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    setError('');
    setAccountExists(false);

    const res = await register(name.trim(), phone.trim(), email.trim().toLowerCase(), password ? password.trim() : undefined);
    setLoading(false);

    if (res.success) {
      if (res.requiresOtp) {
        setOtpMessage(res.message || `Verification code sent to ${email}`);
        setStep('OTP');
      } else {
        onRegisterSuccess(email);
      }
    } else {
      const isExists = (res.message || '').toLowerCase().includes('already exists');
      setAccountExists(isExists);
      setError(res.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isOtpValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    setError('');

    const res = await verifyOtp(email.trim().toLowerCase(), otp.trim());
    setLoading(false);

    if (res.success) {
      onRegisterSuccess(email);
    } else {
      setError(res.message || 'Invalid verification code');
    }
  };

  const handleResendOtp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError('');
    const res = await register(name.trim(), phone.trim(), email.trim().toLowerCase(), password ? password.trim() : undefined);
    setLoading(false);
    if (res.success) {
      const msg = res.message || 'Verification code resent to your email.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Code Resent', msg);
      }
    } else {
      setError(res.message || 'Failed to resend code');
    }
  };

  const handleHeaderBack = () => {
    if (step === 'OTP') {
      setStep('FORM');
      setError('');
      setOtp('');
    } else {
      onBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: (insets.top > 0 ? insets.top : 44) + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={handleHeaderBack} activeOpacity={0.8}>
          <ArrowLeft size={22} color={COLORS.black} strokeWidth={3} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <WowLogo width={260} height={95} />
        </View>

        {/* Neo-Brutalist Registration Card */}
        <View style={styles.card}>
          {step === 'FORM' ? (
            <>
              <Text style={styles.cardTitle}>CREATE ACCOUNT</Text>
              <Text style={styles.cardSubtitle}>Sign up to start your laundry orders</Text>

              {/* Full Name */}
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={styles.inputWrap}>
                <User size={18} color={COLORS.black} strokeWidth={2.5} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              {/* Phone */}
              <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.countryCode}>+91</Text>
                <View style={styles.vDivider} />
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  placeholderTextColor="#6B7280"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              {/* Email */}
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrap}>
                <Mail size={18} color={COLORS.black} strokeWidth={2.5} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password (Optional) */}
              <Text style={styles.inputLabel}>PASSWORD (OPTIONAL)</Text>
              <View style={styles.inputWrap}>
                <Lock size={18} color={COLORS.black} strokeWidth={2.5} />
                <TextInput
                  style={styles.input}
                  placeholder="Create password (optional)"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {/* Error Banner */}
              {error ? (
                <View style={accountExists ? styles.errorBoxExists : styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                  {accountExists && (
                    <TouchableOpacity
                      onPress={onBack}
                      style={styles.signInBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.signInBtnText}>Sign In Instead →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.btn, !isFormValid && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={!isFormValid || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.black} />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.btnText}>REGISTER & SEND OTP</Text>
                    <ArrowRight size={18} color={COLORS.black} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <TouchableOpacity onPress={onBack}>
                  <Text style={styles.loginLink}> SIGN IN</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>VERIFY EMAIL</Text>
              <Text style={styles.cardSubtitle}>
                {otpMessage || `We sent a 6-digit verification code to\n${email}`}
              </Text>

              {/* 6-Digit OTP Input Boxes */}
              <Text style={styles.inputLabel}>VERIFICATION CODE</Text>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => otpInputRef.current?.focus()}
                style={styles.otpContainer}
              >
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
                  ref={otpInputRef}
                  style={styles.hiddenOtpInput}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  autoFocus
                />
              </TouchableOpacity>

              {/* Error Banner */}
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.btn, !isOtpValid && styles.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={!isOtpValid || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.black} />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.btnText}>VERIFY & CREATE ACCOUNT</Text>
                    <ArrowRight size={18} color={COLORS.black} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Resend & Back Actions */}
              <View style={styles.otpActionRow}>
                <TouchableOpacity
                  onPress={() => { setStep('FORM'); setOtp(''); setError(''); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={13} color="#6B7280" strokeWidth={2.5} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B7280' }}>Edit details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={loading}
                >
                  <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.primary, textDecorationLine: 'underline' }}>
                    Resend Code
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
    ...NEO_SHADOW.box4,
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
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.8,
    marginBottom: 6,
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
  countryCode: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  vDivider: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.black,
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    marginLeft: 6,
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
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.8,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  loginText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
  },
  errorBoxExists: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  signInBtn: {
    marginTop: 6,
    backgroundColor: COLORS.black,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  signInBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
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
    zIndex: 10,
  },
  otpActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 4,
  },
});
