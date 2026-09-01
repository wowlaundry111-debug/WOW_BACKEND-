import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Package, Clock, PhoneCall, User } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { StatusBadge } from '../../components/UIPack';
import { OrderSkeleton } from '../../components/SkeletonLoaders';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedView = Animated.View as any;

const ORDER_STEPS = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'WASHING', label: 'Wash' },
  { key: 'IRONING', label: 'Press' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out' },
  { key: 'DELIVERED', label: 'Done' },
];

const getStepIdx = (status: string) => {
  if (status === 'PICKUP_ASSIGNED' || status === 'PICKED_UP') return 1;
  const idx = ORDER_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
};

/**
 * Subtle Ambient Background Bubble
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

export const CustomerOrdersScreen = () => {
  const { orders, currentUser, shops, fetchOrders, isLoading } = useAppStore();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);
  const myOrders = React.useMemo(() => {
    const map = new Map<string, (typeof orders)[0]>();
    orders
      .filter((o) => o.customerId === currentUser?._id)
      .forEach((o) => map.set(o._id, o));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, currentUser?._id]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor="#002B2E" translucent />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor="#B0FF49" />}
      >
        {/* Top Overscroll Green Background Filler */}
        <View style={styles.topOverscrollFiller} />

        {/* ─── Seamless Emerald Green & Lime Neo-Brutalist Header ─── */}
        <LinearGradient
          colors={['#002B2E', '#023C41', '#045057', '#01353A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradientWrap, { paddingTop: (insets.top > 0 ? insets.top : 44) + 6 }]}
        >
          {/* Ambient Background Bubbles */}
          <AmbientBubble size={16} startX={28} startY={25} duration={4200} delay={0} />
          <AmbientBubble size={20} startX={SCREEN_WIDTH - 55} startY={45} duration={4800} delay={600} />

          <View style={styles.headerInner}>
            <View style={styles.headerTopRow}>
              {/* Lime Avatar */}
              <View style={styles.avatarBox}>
                {currentUser?.name ? (
                  <Text style={styles.avatarText}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </Text>
                ) : (
                  <User size={20} color={COLORS.black} strokeWidth={2.5} />
                )}
              </View>

              {/* Title & Subtitle */}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.greetingText}>TRACK & MANAGE</Text>
                <Text style={styles.headerTitleText} numberOfLines={1}>
                  My Orders
                </Text>
              </View>

              {/* Lime Neo-Brutalist Order Count Pill */}
              <View style={styles.orderCountPill}>
                <Text style={styles.orderCountText}>
                  {myOrders.length} {myOrders.length === 1 ? 'ORDER' : 'ORDERS'}
                </Text>
              </View>
            </View>
          </View>

          {/* ─── Seamless Edge-to-Edge Wave Curve Partition with Dark Neo-Brutalist Border ─── */}
          <View style={styles.wavePartitionWrap}>
            <Svg width={SCREEN_WIDTH} height={32} viewBox={`0 0 ${SCREEN_WIDTH} 32`} preserveAspectRatio="none">
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

        {/* ─── Orders List Content ─── */}
        <View style={styles.bodyContent}>
          {isLoading && myOrders.length === 0 ? (
            <>
              <OrderSkeleton />
              <OrderSkeleton />
              <OrderSkeleton />
            </>
          ) : myOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Package size={44} color={COLORS.white} strokeWidth={2.5} />
              </View>
              <Text style={styles.emptyTitle}>NO ORDERS YET</Text>
              <Text style={styles.emptySub}>Looks like you haven't placed any laundry orders yet.</Text>
            </View>
          ) : (
            myOrders.map((order, orderIdx) => {
              const activeStepIndex = getStepIdx(order.status);

              return (
                <View key={`${order._id}-${orderIdx}`} style={styles.orderCard}>
                  {/* Order Top Bar */}
                  <View style={styles.orderTopBar}>
                    <View style={{ gap: 4 }}>
                      <View style={styles.orderIdBadge}>
                        <Text style={styles.orderIdBadgeText}>
                          ORDER #{order._id.slice(-6).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.orderDateText}>
                        {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    <StatusBadge status={order.status as any} />
                  </View>

                  {/* Items Summary */}
                  <View style={styles.orderBody}>
                    <Text style={styles.itemsListText}>
                      {order.items.map((i) => `${i.quantity}× ${i.name}`).join(' • ')}
                    </Text>

                    {order.pickupTime ? (
                      <View style={styles.slotBadge}>
                        <Clock size={12} color={COLORS.black} strokeWidth={3} />
                        <Text style={styles.slotText}>{order.pickupTime}</Text>
                      </View>
                    ) : null}

                    {order.adminNotes ? (
                      <View style={styles.adminNoteBox}>
                        <Text style={styles.adminNoteTitle}>Branch Note</Text>
                        <Text style={styles.adminNoteText}>{order.adminNotes}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Progress Steps */}
                  <View style={styles.stepsContainer}>
                    <View style={styles.stepsRow}>
                      {ORDER_STEPS.map((step, idx) => {
                        const isCompleted = idx <= activeStepIndex;
                        const isActive = idx === activeStepIndex;

                        return (
                          <View key={step.key} style={styles.stepCell}>
                            <View
                              style={[
                                styles.stepDot,
                                isCompleted && { backgroundColor: COLORS.secondary },
                                isActive && { backgroundColor: COLORS.primary, transform: [{ scale: 1.2 }] },
                              ]}
                            />
                            <Text
                              style={[
                                styles.stepLabel,
                                isActive && { color: COLORS.black, fontWeight: '900' },
                              ]}
                            >
                              {step.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.orderFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View>
                        <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                        <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
                      </View>
                      {order.paymentMode ? (
                        <View style={styles.paymentPill}>
                          <Text style={styles.paymentPillText}>
                            {order.paymentMode === 'COD' ? 'CASH (COD)' : order.paymentMode === 'UPI' ? 'UPI' : order.paymentMode}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      style={styles.helpBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        const orderShop = shops.find((s) => s._id === order.shopId);
                        const contact = orderShop?.contactNumber || '9999999999';
                        Linking.openURL(`tel:${contact}`);
                      }}
                    >
                      <PhoneCall size={14} color={COLORS.black} strokeWidth={2.5} />
                      <Text style={styles.helpBtnText}>Need Help?</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#002B2E',
  },
  topOverscrollFiller: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: '#002B2E',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  headerGradientWrap: {
    width: '100%',
    backgroundColor: '#002B2E',
    position: 'relative',
    overflow: 'hidden',
  },
  headerInner: {
    paddingHorizontal: SPACING.mobile,
    paddingBottom: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: '#B0FF49',
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  greetingText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: '#82BDC0',
    letterSpacing: 0.5,
  },
  headerTitleText: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  orderCountPill: {
    backgroundColor: '#B0FF49',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    ...NEO_SHADOW.box2,
  },
  orderCountText: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  wavePartitionWrap: {
    width: SCREEN_WIDTH,
    marginTop: 8,
    overflow: 'hidden',
  },
  bodyContent: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    paddingHorizontal: SPACING.mobile,
    paddingTop: SPACING.md,
    gap: SPACING.md,
    minHeight: 600,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: 40,
    ...NEO_SHADOW.box8,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...NEO_SHADOW.box4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box6,
  },
  orderTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderIdBadge: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  orderIdBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  orderDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 2,
  },
  orderBody: {
    marginBottom: 12,
  },
  itemsListText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  adminNoteBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xs,
    padding: 8,
    marginTop: 8,
  },
  adminNoteTitle: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#92400E',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  adminNoteText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
  },
  stepsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stepCell: {
    alignItems: 'center',
    width: 44,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.primary,
  },
  paymentPill: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  paymentPillText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...NEO_SHADOW.box2,
  },
  helpBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
});
