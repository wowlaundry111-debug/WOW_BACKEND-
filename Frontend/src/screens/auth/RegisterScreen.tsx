import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, User, Phone, Mail } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { WowLogo } from '../../components/WowLogo';
import { useAppStore } from '../../store/useAppStore';

interface RegisterScreenProps {
  onBack: () => void;
  onRegisterSuccess: (email: string) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBack, onRegisterSuccess }) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length >= 2 && phone.length === 10 && email.includes('@');

  const { register } = useAppStore();

  const handleRegister = async () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    
    const res = await register(name, phone, email);
    setLoading(false);
    
    if (res.success) {
      if (res.message.includes('mockOtp')) {
         // Optionally handle dev mode alert here if we parsed it from response, but store returns generic message
      }
      onRegisterSuccess(email);
    } else {
      alert(res.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top > 0 ? insets.top + 16 : 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <WowLogo width={340} height={136} />
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputRow}>
            <User size={16} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Mobile Number */}
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputRow}>
            <Text style={styles.countryCode}>+91</Text>
            <Text style={styles.chevron}>▾</Text>
            <View style={styles.vDivider} />
            <TextInput
              style={styles.input}
              placeholder="Enter mobile number"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {/* Email Address */}
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputRow}>
            <Mail size={16} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.btn, !isValid && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={styles.btnText}>Register</Text>
                  <ArrowRight size={18} color="#fff" />
                </>
            }
          </TouchableOpacity>

          {/* Already have account */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.loginLink}> Login</Text>
            </TouchableOpacity>
          </View>

        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
  logoWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Outfit_800ExtraBold',
    textAlign: 'center',
    marginBottom: 6,
  },
  pageSub: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginBottom: 18,
  },
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
  label: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    gap: 8,
  },
  countryCode: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
  },
  chevron: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  vDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E5E7EB',
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
  btn: {
    backgroundColor: '#0D8DE3',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
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
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  loginText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Outfit_400Regular',
  },
  loginLink: {
    fontSize: 13,
    color: '#0D8DE3',
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
});
