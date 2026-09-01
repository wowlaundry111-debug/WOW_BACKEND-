import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ShieldCheck, Clock, Mail, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { RegisterScreen } from './RegisterScreen';
import { WowLogo } from '../../components/WowLogo';
import api, { setAuthToken } from '../../services/api';

// ─── OTP Screen ───────────────────────────────────────────────────────────────
interface OTPScreenProps {
  email: string;
  onBack: () => void;
  onVerify: (otp: string) => Promise<void>;
  loading: boolean;
}

const OTPScreen: React.FC<OTPScreenProps> = ({ email, onBack, onVerify, loading }) => {
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(59);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDigit = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 3) refs.current[index + 1]?.focus();
  };

  const handleKey = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const otp = digits.join('');
  const canVerify = otp.length === 4;

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: (insets.top > 0 ? insets.top : 44) + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <ArrowLeft size={22} color={COLORS.black} strokeWidth={3} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <WowLogo width={260} height={95} />
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ENTER OTP</Text>
          <Text style={styles.cardSubtitle}>We've sent a 4-digit code to</Text>
          <View style={styles.emailBadge}>
            <Text style={styles.emailBadgeText}>{email}</Text>
          </View>

          {/* 4 OTP Boxes */}
          <View style={styles.otpBoxRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
                value={d}
                onChangeText={(t) => handleDigit(t, i)}
                onKeyPress={(e) => handleKey(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectionColor={COLORS.black}
                autoFocus={i === 0}
              />
            ))}
          </View>

          {/* Resend Timer */}
          <View style={styles.timerRow}>
            <Clock size={14} color="#4B5563" strokeWidth={2.5} />
            <Text style={styles.timerText}>
              Resend in <Text style={styles.timerCount}>00:{String(timer).padStart(2, '0')}</Text>
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.btn, !canVerify && styles.btnDisabled]}
            onPress={() => onVerify(otp)}
            disabled={!canVerify || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.btnText}>VERIFY & LOGIN</Text>
                <ArrowRight size={18} color={COLORS.black} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>

          {/* Resend link */}
          <TouchableOpacity
            style={styles.resendBtn}
            disabled={timer > 0}
            onPress={() => setTimer(59)}
          >
            <Text style={[styles.resendText, timer > 0 && { color: '#9CA3AF' }]}>
              Resend OTP
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Main Auth Screen ─────────────────────────────────────────────────────────
export const AuthScreen = () => {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<'EMAIL' | 'OTP' | 'REGISTER'>('EMAIL');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAppStore();

  const handleSendOTP = async () => {
    if (!email || email.trim().length < 3) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const response = await api.post('/auth/send-otp', { email: email.trim().toLowerCase() });
      const data = response.data;

      if (data.directLogin && data.token && data.user) {
        await setAuthToken(data.token);
        useAppStore.setState({
          currentUser: data.user,
          currentRole: data.user.role,
          currentTenantId: data.user.role === 'SuperAdmin' ? '' : data.user.shopId || '',
        });
        useAppStore.getState().fetchCatalog();
        useAppStore.getState().fetchOrders();
        if (['SuperAdmin', 'ShopAdmin'].includes(data.user.role)) {
          useAppStore.getState().fetchUsers();
        }
        setLoading(false);
        return;
      }

      if (data.autoLogin) {
        await handleVerifyOTP(data.mockOtp);
      } else {
        setLoading(false);
        setScreen('OTP');
      }
    } catch (err: any) {
      setLoading(false);
      alert(err.response?.data?.error || 'Failed to authenticate. Please check your email.');
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    const res = await login(email.trim().toLowerCase(), otp);
    setLoading(false);
    if (!res.success) alert(res.message);
  };

  const isEmailValid = email.trim().length >= 3;

  if (screen === 'REGISTER') {
    return (
      <RegisterScreen
        onBack={() => setScreen('EMAIL')}
        onRegisterSuccess={(registeredEmail) => {
          setEmail(registeredEmail);
          setScreen('OTP');
        }}
      />
    );
  }

  if (screen === 'OTP') {
    return (
      <OTPScreen
        email={email}
        onBack={() => setScreen('EMAIL')}
        onVerify={handleVerifyOTP}
        loading={loading}
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
          <Text style={styles.cardTitle}>SIGN IN</Text>
          <Text style={styles.cardSubtitle}>Enter your email to receive OTP</Text>

          <View style={styles.inputWrap}>
            <Mail size={20} color={COLORS.black} strokeWidth={2.5} />
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              selectionColor={COLORS.black}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, !isEmailValid && styles.btnDisabled]}
            onPress={handleSendOTP}
            disabled={!isEmailValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.btnText}>CONTINUE</Text>
                <ArrowRight size={18} color={COLORS.black} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>

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
  logoImg: {
    width: 220,
    height: 90,
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
  emailBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 8,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emailBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
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
    marginBottom: SPACING.lg,
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
  otpBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  otpBox: {
    width: 60,
    height: 60,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    ...NEO_SHADOW.box4,
  },
  otpBoxFilled: {
    backgroundColor: COLORS.secondary,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: SPACING.lg,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  timerCount: {
    fontWeight: '900',
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
  resendBtn: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: 4,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textDecorationLine: 'underline',
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
});
