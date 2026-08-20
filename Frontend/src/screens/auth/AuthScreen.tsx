import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ImageBackground, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ShieldCheck, Clock, Mail } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { WowLogo } from '../../components/WowLogo';
import { RegisterScreen } from './RegisterScreen';
import api from '../../services/api';

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
      setTimer(t => (t > 0 ? t - 1 : 0));
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
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top > 0 ? insets.top + 16 : 24 }]} keyboardShouldPersistTaps="handled">
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <WowLogo width={340} height={136} />
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Shield Icon */}
          <View style={styles.shieldWrap}>
            <ShieldCheck size={28} color="#008CE5" strokeWidth={1.8} />
          </View>

          <Text style={styles.otpTitle}>Enter OTP</Text>
          <Text style={styles.otpSubtitle}>We've sent a 4-digit OTP to</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.phoneNumber}>{email}</Text>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.changeText}> Change</Text>
            </TouchableOpacity>
          </View>

          {/* 4 OTP Boxes */}
          <View style={styles.otpBoxRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={el => { refs.current[i] = el; }}
                style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
                value={d}
                onChangeText={t => handleDigit(t, i)}
                onKeyPress={e => handleKey(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectionColor="#008CE5"
                autoFocus={i === 0}
              />
            ))}
          </View>

          {/* Resend timer */}
          <View style={styles.timerRow}>
            <Clock size={14} color="#9CA3AF" />
            <Text style={styles.timerText}>
              {' '}Resend OTP in{' '}
              <Text style={styles.timerCount}>00:{String(timer).padStart(2, '0')}</Text>
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.btn, !canVerify && styles.btnDisabled]}
            onPress={() => onVerify(otp)}
            disabled={!canVerify || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={styles.btnText}>Verify & Login</Text>
                  <ArrowRight size={18} color="#fff" />
                </>
            }
          </TouchableOpacity>

          {/* Resend link */}
          <TouchableOpacity
            style={styles.resendBtn}
            disabled={timer > 0}
            onPress={() => setTimer(59)}
          >
            <Text style={[styles.resendText, timer > 0 && { color: '#D1D5DB' }]}>
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
      const response = await api.post('/auth/send-otp', { email });
      
      if (response.data.autoLogin) {
        await handleVerifyOTP(response.data.mockOtp);
      } else {
        setLoading(false);
        setScreen('OTP');
        if (response.data.mockOtp) {
          alert(`[Dev Mode] SMTP OTP: ${response.data.mockOtp}`);
        }
      }
    } catch (err: any) {
      setLoading(false);
      alert(err.response?.data?.error || 'Failed to send OTP. Please check your email.');
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    const res = await login(email, otp);
    setLoading(false);
    if (!res.success) alert(res.message);
  };

  const isEmailValid = email.trim().length >= 3;

  return (
    <ImageBackground
      source={require('../../../assets/bg.png')}
      style={styles.bgImage}
      resizeMode="stretch"
    >
      {screen === 'REGISTER' ? (
        <RegisterScreen 
          onBack={() => setScreen('EMAIL')} 
          onRegisterSuccess={(registeredEmail) => {
            setEmail(registeredEmail);
            setScreen('OTP');
          }}
        />
      ) : screen === 'OTP' ? (
        <OTPScreen
          email={email}
          onBack={() => setScreen('EMAIL')}
          onVerify={handleVerifyOTP}
          loading={loading}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top > 0 ? insets.top + 16 : 24 }]} keyboardShouldPersistTaps="handled">
            {/* Logo */}
            <View style={styles.logoWrap}>
              <WowLogo width={340} height={136} />
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>User ID or Email</Text>
              <View style={styles.inputRow}>
                <Mail size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your ID or email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, !isEmailValid && styles.btnDisabled]}
                onPress={handleSendOTP}
                disabled={!isEmailValid || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Text style={styles.btnText}>Continue</Text>
                      <ArrowRight size={18} color="#fff" />
                    </>
                }
              </TouchableOpacity>

              <View style={styles.safeRow}>
                <ShieldCheck size={13} color="#93C5FD" strokeWidth={2} />
                <Text style={styles.safeText}> Your data is safe with us</Text>
              </View>
            </View>

            {/* Register link — below card */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => setScreen('REGISTER')}>
                <Text style={styles.registerLink}> Register</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </ImageBackground>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: (Platform.OS === 'web' ? '100vh' : '100%') as any,
    position: (Platform.OS === 'web' ? 'fixed' : 'relative') as any,
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  kav: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'flex-start',
  },

  // Logo
  logoWrap: { alignItems: 'center', marginBottom: 16 },

  // Welcome text (login screen, outside card)
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Outfit_800ExtraBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  // Back button
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },

  // White card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 16px rgba(0,0,0,0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      }
    }),
    elevation: 4,
  },

  // Form label
  fieldLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
  },

  // Input row (+91 | text)
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
  },
  countryCode: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
  },
  countryChevron: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 3,
    marginTop: 1,
  },
  vDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Outfit_500Medium',
    outlineStyle: 'none',
    outlineWidth: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  } as any,

  // Primary button
  btn: {
    backgroundColor: '#0D8DE3',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(13, 141, 227, 0.3)',
      },
      default: {
        shadowColor: '#0D8DE3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }
    }),
  } as any,
  btnDisabled: { opacity: 0.4 },
  btnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
  },

  // Safe row
  safeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  safeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
  },

  // Register link (login screen)
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Outfit_400Regular',
  },
  registerLink: {
    fontSize: 13,
    color: '#0D8DE3',
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },

  // OTP screen
  shieldWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  otpTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Outfit_800ExtraBold',
    textAlign: 'center',
    marginBottom: 6,
  },
  otpSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Outfit_400Regular',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  changeText: {
    fontSize: 14,
    color: '#0D8DE3',
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },

  // 4-digit OTP boxes
  otpBoxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  otpBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'Outfit_700Bold',
  },
  otpBoxFilled: {
    borderColor: '#0D8DE3',
    backgroundColor: '#EFF6FF',
  },

  // Timer
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Outfit_400Regular',
  },
  timerCount: {
    color: '#0D8DE3',
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },

  // Resend link
  resendBtn: {
    alignItems: 'center',
    marginTop: 14,
    padding: 6,
  },
  resendText: {
    fontSize: 14,
    color: '#0D8DE3',
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
});
