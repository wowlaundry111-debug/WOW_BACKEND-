import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { LogOut, User, Truck, IndianRupee, ShieldCheck, Phone, Mail, Award, CheckCircle2, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedView = Animated.View as any;

const AmbientBubble = ({
  size,
  startX,
  startY,
  duration = 4000,
  delay = 0,
}: {
  size: number;
  startX: number;
  startY: number;
  duration?: number;
  delay?: number;
}) => {
  const animY = useRef(new Animated.Value(0)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const animScale = useRef(new Animated.Value(1)).current;
  const animOpacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(animY, {
            toValue: -14,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animX, {
            toValue: 8,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animScale, {
            toValue: 1.15,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animOpacity, {
            toValue: 0.35,
            duration: duration * 0.5,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(animY, {
            toValue: 0,
            duration: duration * 0.5,
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
            toValue: 0.15,
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

export const DeliveryProfileScreen = () => {
  const { currentUser, setCurrentUser, orders } = useAppStore();
  const insets = useSafeAreaInsets();

  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => o.deliveryBoyId === currentUser?._id && o.status === 'DELIVERED' && new Date(o.updatedAt).toDateString() === todayStr
  );
  const deliveriesDone = todayOrders.length;
  const todaysEarnings = todayOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const totalDeliveredAllTime = orders.filter(
    (o) => o.deliveryBoyId === currentUser?._id && o.status === 'DELIVERED'
  ).length;

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCurrentUser(null);
  };

  return (
    <View style={styles.root}>
      {/* Top overscroll filler */}
      <View style={styles.topOverscrollFiller} />

      {/* ─── Hero Emerald Header with Wave ─── */}
      <LinearGradient
        colors={['#002B2E', '#023C41', '#045057', '#01353A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerHero, { paddingTop: (insets.top > 0 ? insets.top : 44) + 6 }]}
      >
        {/* Ambient Bubbles */}
        <AmbientBubble size={16} startX={22} startY={20} duration={4200} delay={0} />
        <AmbientBubble size={20} startX={SCREEN_WIDTH - 60} startY={36} duration={4800} delay={600} />

        <View style={styles.headerTopRow}>
          <View style={styles.avatarWrap}>
            <Truck size={30} color={COLORS.black} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{currentUser?.name || 'Delivery Partner'}</Text>
            <Text style={styles.driverEmail}>{currentUser?.email || 'driver@wow.com'}</Text>
          </View>
        </View>

        {/* SVG Wave Partition with 2.5px Dark Border */}
        <View style={styles.waveContainer}>
          <Svg
            width={SCREEN_WIDTH}
            height={32}
            viewBox={`0 0 ${SCREEN_WIDTH} 32`}
            preserveAspectRatio="none"
          >
            <Path
              d={`M 0,0 Q ${SCREEN_WIDTH * 0.5} 32, ${SCREEN_WIDTH} 0 L ${SCREEN_WIDTH} 32 L 0 32 Z`}
              fill="#F9FAFB"
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

      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Performance Metrics Row */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <IndianRupee size={18} color={COLORS.black} strokeWidth={2.5} />
            </View>
            <Text style={styles.metricNumber}>₹{todaysEarnings}</Text>
            <Text style={styles.metricLabel}>TODAY'S EARNINGS</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#38BDF8' }]}>
              <CheckCircle2 size={18} color={COLORS.black} strokeWidth={2.5} />
            </View>
            <Text style={styles.metricNumber}>{deliveriesDone}</Text>
            <Text style={styles.metricLabel}>TODAY'S ORDERS</Text>
          </View>
        </View>

        {/* Driver Account Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>ACCOUNT DETAILS</Text>
          <View style={styles.infoRow}>
            <Mail size={16} color={COLORS.black} strokeWidth={2.5} />
            <Text style={styles.infoText}>{currentUser?.email || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Phone size={16} color={COLORS.black} strokeWidth={2.5} />
            <Text style={styles.infoText}>{currentUser?.phone ? `+91 ${currentUser.phone}` : 'Registered Phone'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Award size={16} color={COLORS.black} strokeWidth={2.5} />
            <Text style={styles.infoText}>Partner ID: #{currentUser?._id?.slice(-6).toUpperCase() || 'DRV-01'}</Text>
          </View>
        </View>

        {/* Logout / End Shift Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <LogOut size={18} color="#DC2626" strokeWidth={2.5} />
          <Text style={styles.logoutText}>END SHIFT / LOG OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  topOverscrollFiller: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: '#002B2E',
  },
  headerHero: {
    backgroundColor: '#002B2E',
    paddingHorizontal: SPACING.mobile,
    paddingBottom: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    borderWidth: 2.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(176, 255, 73, 0.15)',
    borderWidth: 1,
    borderColor: '#B0FF49',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#B0FF49',
    letterSpacing: 0.5,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  driverEmail: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 2,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingTop: SPACING.md,
    paddingBottom: 110,
    gap: SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statRowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  statRowValue: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    marginTop: 6,
    ...NEO_SHADOW.box2,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
});
