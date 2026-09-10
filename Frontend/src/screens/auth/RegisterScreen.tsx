import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ArrowLeft, User, Phone, Mail, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { WowLogo } from '../../components/WowLogo';

interface RegisterScreenProps {
  onBack: () => void;
  onRegisterSuccess: (email: string) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBack, onRegisterSuccess }) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountExists, setAccountExists] = useState(false);

  const isValid = name.trim().length >= 2 && phone.length === 10 && email.includes('@');
  const { register } = useAppStore();

  const handleRegister = async () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    setError('');
    setAccountExists(false);

    const res = await register(name, phone, email, password ? password.trim() : undefined);
    setLoading(false);

    if (res.success) {
      onRegisterSuccess(email);
    } else {
      // Check for 409 "account already exists" error from the backend
      const isExists = res.message.toLowerCase().includes('already exists');
      setAccountExists(isExists);
      setError(res.message);
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
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <ArrowLeft size={22} color={COLORS.black} strokeWidth={3} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <WowLogo width={260} height={95} />
        </View>

        {/* Neo-Brutalist Registration Card */}
        <View style={styles.card}>
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

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, !isValid && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.btnText}>REGISTER & SIGN IN</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  vDivider: {
    width: 2,
    height: 18,
    backgroundColor: COLORS.black,
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
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
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  errorBoxExists: {
    backgroundColor: '#FEF9C3',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  signInBtn: {
    backgroundColor: COLORS.black,
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  signInBtnText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
});
