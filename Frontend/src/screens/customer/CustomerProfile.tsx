import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Easing,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import {
  LogOut,
  MapPin,
  CreditCard,
  Clock,
  ChevronRight,
  User,
  Home,
  Briefcase,
  ShieldCheck,
  Package,
  Sparkles,
  Phone,
  Mail,
  Headphones,
  Edit3,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedView = Animated.View as any;

/**
 * Blinkit / iOS Style Bouncy Interactive Pressable with Spring Animation
 */
const BouncyCard: React.FC<{
  onPress?: () => void;
  style?: any;
  contentStyle?: any;
  children: React.ReactNode;
  activeScale?: number;
}> = ({ onPress, style, contentStyle, children, activeScale = 0.96 }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  return (
    <AnimatedView style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={contentStyle}
      >
        {children}
      </TouchableOpacity>
    </AnimatedView>
  );
};

/**
 * Subtle Ambient Background Floating Bubble
 */
const AmbientBubble: React.FC<{
  size: number;
  startX: number;
  startY: number;
  duration?: number;
  delay?: number;
}> = ({ size, startX, startY, duration = 4500, delay = 0 }) => {
  const animY = useRef(new Animated.Value(0)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const animScale = useRef(new Animated.Value(0.9)).current;
  const animOpacity = useRef(new Animated.Value(0.12)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(animY, {
            toValue: -18,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(animX, {
            toValue: 6,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(animScale, {
            toValue: 1.1,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animOpacity, {
            toValue: 0.25,
            duration: duration * 0.5,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(animY, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animX, {
            toValue: 0,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animScale, {
            toValue: 0.9,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animOpacity, {
            toValue: 0.12,
            duration: duration * 0.5,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [animY, animX, animScale, animOpacity, duration, delay]);

  return (
    <AnimatedView
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        transform: [{ translateY: animY }, { translateX: animX }, { scale: animScale }],
        opacity: animOpacity,
        zIndex: 0,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: size * 0.18,
          left: size * 0.18,
          width: size * 0.26,
          height: size * 0.26,
          borderRadius: size * 0.13,
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
        }}
      />
    </AnimatedView>
  );
};

export const CustomerProfileScreen = ({ onNavigateToOrders }: { onNavigateToOrders?: () => void }) => {
  const { currentUser, setCurrentUser, updateProfile, orders } = useAppStore();
  const insets = useSafeAreaInsets();

  const [isEditProfileVisible, setEditProfileVisible] = useState(false);
  const [isAddressVisible, setAddressVisible] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');

  // Structured Precise Address State (Food App Style)
  const [addressTag, setAddressTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [flatNo, setFlatNo] = useState('');
  const [area, setArea] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Customer Orders Count
  const myOrders = orders.filter((o) => o.customerId === currentUser?._id);

  useEffect(() => {
    if (isEditProfileVisible) {
      setEditName(currentUser?.name || '');
      setEditEmail(currentUser?.email || '');
    }
  }, [isEditProfileVisible, currentUser]);

  useEffect(() => {
    if (isAddressVisible) {
      const raw = currentUser?.address || '';
      if (raw) {
        if (raw.includes('(Work)')) setAddressTag('Work');
        else if (raw.includes('(Other)')) setAddressTag('Other');
        else setAddressTag('Home');

        const clean = raw.replace(/\((Home|Work|Other)\)/, '').trim();
        const parts = clean.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          setFlatNo(parts[0].replace(/^(Flat|House|Flat\/House|House\/Flat)\s*:?/i, '').trim());
          setArea(parts.slice(1).join(', '));
        } else {
          setArea(clean);
        }
      }
    }
  }, [isAddressVisible, currentUser]);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCurrentUser(null);
  };

  const handleSaveProfile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    const res = await updateProfile({ name: editName, email: editEmail });
    setIsSaving(false);
    if (res.success) setEditProfileVisible(false);
    else alert(res.message);
  };

  const getFormattedAddress = () => {
    const parts = [
      flatNo.trim() ? (flatNo.trim().toLowerCase().startsWith('flat') || flatNo.trim().toLowerCase().startsWith('house') ? flatNo.trim() : `Flat/House: ${flatNo.trim()}`) : '',
      area.trim() ? area.trim() : '',
    ].filter(Boolean);

    if (parts.length === 0) return '';
    return `${parts.join(', ')} (${addressTag})`;
  };

  const handleSaveAddress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const fullAddress = getFormattedAddress();
    if (!fullAddress.trim()) {
      alert('Please enter your address details.');
      return;
    }
    setIsSaving(true);
    const res = await updateProfile({ address: fullAddress });
    setIsSaving(false);
    if (res.success) setAddressVisible(false);
    else alert(res.message);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor="#061E38" translucent />

      {/* Top Overscroll Blue Background Filler */}
      <View style={styles.topOverscrollFiller} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Seamless Royal Blue Hero Header with Ambient Bubbles & Wave ─── */}
        <LinearGradient
          colors={['#061E38', '#0A2B4C', '#0E3A66', '#082340']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerHero, { paddingTop: (insets.top > 0 ? insets.top : 44) + 8 }]}
        >
          {/* Ambient Floating Bubbles */}
          <AmbientBubble size={16} startX={26} startY={22} duration={4200} delay={0} />
          <AmbientBubble size={22} startX={SCREEN_WIDTH - 60} startY={38} duration={4800} delay={600} />
          <AmbientBubble size={14} startX={SCREEN_WIDTH * 0.48} startY={14} duration={3600} delay={300} />
          <View style={styles.headerTopRow}>
            {/* Avatar with Neon Lime Background */}
            <View style={styles.avatarBox}>
              {currentUser?.name ? (
                <Text style={styles.avatarText}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <User size={26} color={COLORS.black} strokeWidth={2.5} />
              )}
            </View>

            {/* Profile Identity Details */}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {currentUser?.name || 'Customer'}
              </Text>
              <Text style={styles.userSub} numberOfLines={1}>
                {currentUser?.phone ? `+91 ${currentUser.phone}` : currentUser?.email || 'Logged In'}
              </Text>
              {currentUser?.email && currentUser?.phone ? (
                <Text style={styles.userEmailSub} numberOfLines={1}>
                  {currentUser.email}
                </Text>
              ) : null}
            </View>

            {/* Quick Edit Icon Button */}
            <BouncyCard
              activeScale={0.9}
              onPress={() => setEditProfileVisible(true)}
              contentStyle={styles.headerEditBtn}
            >
              <Edit3 size={16} color={COLORS.black} strokeWidth={2.5} />
            </BouncyCard>
          </View>

          {/* ─── Wave Partition with 2.5px Dark Border ─── */}
          <View style={styles.wavePartitionWrap}>
            <Svg
              width={SCREEN_WIDTH}
              height={32}
              viewBox={`0 0 ${SCREEN_WIDTH} 32`}
              preserveAspectRatio="none"
            >
              <Path
                d={`M 0,0 Q ${SCREEN_WIDTH * 0.5} 32, ${SCREEN_WIDTH} 0 L ${SCREEN_WIDTH} 32 L 0 32 Z`}
                fill="#F8FAFC"
              />
              <Path
                d={`M 0,0 Q ${SCREEN_WIDTH * 0.5} 32, ${SCREEN_WIDTH} 0`}
                stroke="#000000"
                strokeWidth={2.5}
                fill="none"
              />
            </Svg>
          </View>
        </LinearGradient>

        {/* ─── Body Content ─── */}
        <View style={styles.bodyContent}>
          {/* Primary Action Cards Grid */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: COLORS.white }]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAddressVisible(true);
              }}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#B0FF49' }]}>
                <MapPin size={20} color={COLORS.black} strokeWidth={2.5} />
              </View>
              <Text style={styles.actionCardLabel}>ADDRESS</Text>
              <Text style={styles.actionCardSub}>Saved Places</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: COLORS.white }]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNavigateToOrders?.();
              }}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#38BDF8' }]}>
                <Package size={20} color={COLORS.black} strokeWidth={2.5} />
              </View>
              <Text style={styles.actionCardLabel}>ORDERS</Text>
              <Text style={styles.actionCardSub}>{myOrders.length} Completed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: COLORS.white }]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditProfileVisible(true);
              }}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#FFE600' }]}>
                <User size={20} color={COLORS.black} strokeWidth={2.5} />
              </View>
              <Text style={styles.actionCardLabel}>PROFILE</Text>
              <Text style={styles.actionCardSub}>Edit Details</Text>
            </TouchableOpacity>
          </View>

          {/* Saved Address Preview Card */}
          <View style={styles.addressPreviewBox}>
            <View style={styles.addressPreviewHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPin size={16} color={COLORS.black} strokeWidth={2.5} />
                <Text style={styles.addressPreviewTitle}>DEFAULT DELIVERY ADDRESS</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAddressVisible(true);
                }}
                style={styles.changeAddressBtn}
              >
                <Text style={styles.changeAddressText}>CHANGE</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.addressPreviewBody} numberOfLines={2}>
              {currentUser?.address || 'No default delivery address set. Tap to add one.'}
            </Text>
          </View>

          {/* Account Settings List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT & PREFERENCES</Text>
            <View style={styles.listCard}>
              <ListRow
                icon={User}
                title="Personal Information"
                subtitle={currentUser?.email || 'Update your profile info'}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditProfileVisible(true);
                }}
              />
              <View style={styles.divider} />
              <ListRow
                icon={MapPin}
                title="Delivery Addresses"
                subtitle={currentUser?.address ? '1 Saved Address' : 'No address set'}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAddressVisible(true);
                }}
              />
              <View style={styles.divider} />
              <ListRow
                icon={Clock}
                title="My Order History"
                subtitle={`${myOrders.length} Total Laundry Orders`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onNavigateToOrders?.();
                }}
              />
            </View>
          </View>

          {/* Logout CTA Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.85}
            onPress={handleLogout}
          >
            <LogOut size={18} color="#DC2626" strokeWidth={2.5} />
            <Text style={styles.logoutBtnText}>LOG OUT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─── Edit Profile Modal ─── */}
      <Modal visible={isEditProfileVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>EDIT PROFILE</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Your email"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditProfileVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator color={COLORS.black} />
                ) : (
                  <Text style={styles.modalSaveText}>SAVE CHANGES</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Precise Structured Address Modal ─── */}
      <Modal visible={isAddressVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalHeading}>DELIVERY ADDRESS</Text>

              {/* Tag Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SAVE AS</Text>
                <View style={styles.tagSelectorRow}>
                  {([
                    { tag: 'Home', label: 'HOME', icon: Home },
                    { tag: 'Work', label: 'WORK', icon: Briefcase },
                    { tag: 'Other', label: 'OTHER', icon: MapPin },
                  ] as const).map(({ tag, label, icon: IconComponent }) => {
                    const isSelected = addressTag === tag;
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.tagPill, isSelected && styles.tagPillActive]}
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setAddressTag(tag);
                        }}
                      >
                        <IconComponent
                          size={14}
                          color={isSelected ? COLORS.black : '#4B5563'}
                          strokeWidth={2.5}
                        />
                        <Text style={[styles.tagPillText, isSelected && styles.tagPillTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Field 1: Flat / House No. & Building */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>HOUSE / FLAT / BUILDING</Text>
                <TextInput
                  style={styles.input}
                  value={flatNo}
                  onChangeText={setFlatNo}
                  placeholder="e.g. Flat 402, Palm Heights"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Field 2: Area / Street / City */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AREA, STREET & CITY</Text>
                <TextInput
                  style={styles.input}
                  value={area}
                  onChangeText={setArea}
                  placeholder="e.g. 100ft Road, Near Metro, Indiranagar"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setAddressVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveAddress}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  {isSaving ? (
                    <ActivityIndicator color={COLORS.black} />
                  ) : (
                    <Text style={styles.modalSaveText}>SAVE ADDRESS</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const ListRow = ({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.listRow} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.listIconBox}>
      <Icon size={18} color={COLORS.black} strokeWidth={2.5} />
    </View>
    <View style={{ flex: 1, marginLeft: SPACING.md }}>
      <Text style={styles.listTitle}>{title}</Text>
      {subtitle && (
        <Text style={styles.listSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
    <ChevronRight size={18} color={COLORS.black} strokeWidth={2.5} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topOverscrollFiller: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: '#061E38',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  headerHero: {
    paddingHorizontal: SPACING.mobile,
    paddingBottom: 52,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  avatarBox: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  userSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 2,
  },
  userEmailSub: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 1,
  },
  headerEditBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  wavePartitionWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
  },
  bodyContent: {
    paddingHorizontal: SPACING.mobile,
    paddingTop: SPACING.md,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  actionCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box4,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionCardLabel: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  actionCardSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 2,
  },
  addressPreviewBox: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  addressPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressPreviewTitle: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  changeAddressBtn: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  changeAddressText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  addressPreviewBody: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    lineHeight: 18,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  listCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    ...NEO_SHADOW.box4,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  listIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  listSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#E5E7EB',
    marginLeft: 56,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingVertical: 14,
    borderRadius: RADIUS.xl,
    marginTop: 4,
    ...NEO_SHADOW.box2,
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 3,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    paddingBottom: 36,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  modalSaveBtn: {
    flex: 1.5,
    padding: 14,
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    ...NEO_SHADOW.box2,
  },
  modalSaveText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  tagSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tagPill: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tagPillActive: {
    backgroundColor: COLORS.secondary,
    ...NEO_SHADOW.box2,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#4B5563',
  },
  tagPillTextActive: {
    color: COLORS.black,
  },
});
