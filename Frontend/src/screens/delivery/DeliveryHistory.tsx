import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Clock, CheckCircle2, History, MapPin, Banknote, Wifi, Package, Calendar } from 'lucide-react-native';
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

export const DeliveryHistoryScreen = () => {
  const { orders, users, currentUser } = useAppStore();
  const insets = useSafeAreaInsets();

  // Filter for completed (DELIVERED) orders assigned to this delivery boy
  const completedOrders = orders.filter(
    (o) => o.status === 'DELIVERED' && o.deliveryBoyId === currentUser?._id
  );

  const totalDeliveredValue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

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
        <AmbientBubble size={16} startX={26} startY={22} duration={4200} delay={0} />
        <AmbientBubble size={20} startX={SCREEN_WIDTH - 60} startY={38} duration={4800} delay={600} />

        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.historyBadge}>
              <History size={12} color="#B0FF49" strokeWidth={2.5} />
              <Text style={styles.historyBadgeText}>COMPLETED DELIVERIES</Text>
            </View>
            <Text style={styles.screenHeading}>PAST ORDERS</Text>
            <Text style={styles.screenSub}>
              {completedOrders.length} orders delivered successfully
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL REVENUE</Text>
            <Text style={styles.summaryValue}>₹{totalDeliveredValue}</Text>
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {completedOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <History size={36} color={COLORS.black} strokeWidth={2.5} />
            </View>
            <Text style={styles.emptyTitle}>NO COMPLETED DELIVERIES</Text>
            <Text style={styles.emptySub}>
              Orders you complete and deliver will be listed here.
            </Text>
          </View>
        ) : (
          completedOrders.map((order) => {
            const customer = users.find((u) => u._id === order.customerId);
            const customerName = customer?.name || order.customerName || 'Customer';
            const totalItemsCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

            return (
              <View key={order._id} style={styles.historyCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>{customerName}</Text>
                    <Text style={styles.orderIdText}>#{order._id.slice(-6).toUpperCase()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={styles.deliveredBadge}>
                      <CheckCircle2 size={12} color="#15803D" strokeWidth={3} />
                      <Text style={styles.deliveredBadgeText}>DELIVERED</Text>
                    </View>
                    {order.paymentMode ? (
                      <View style={styles.paymentPill}>
                        <Text style={styles.paymentPillText}>
                          {order.paymentMode === 'COD' ? 'CASH (COD)' : order.paymentMode === 'UPI' ? 'UPI (ONLINE)' : order.paymentMode}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Address Box */}
                <View style={styles.addressBox}>
                  <MapPin size={14} color={COLORS.black} strokeWidth={2.5} />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {order.deliveryAddress || customer?.address || 'No Address Provided'}
                  </Text>
                </View>

                {/* Items preview if available */}
                {order.items && order.items.length > 0 && (
                  <View style={styles.itemsRow}>
                    <Text style={styles.itemsSummaryText} numberOfLines={1}>
                      {order.items.map((it) => `${it.quantity}x ${it.name}`).join(' · ')}
                    </Text>
                  </View>
                )}

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Package size={14} color="#6B7280" />
                    <Text style={styles.footerCountText}>
                      {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                  <Text style={styles.footerAmount}>₹{order.totalAmount || 0}</Text>
                </View>
              </View>
            );
          })
        )}
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
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(176, 255, 73, 0.15)',
    borderWidth: 1,
    borderColor: '#B0FF49',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  historyBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#B0FF49',
    letterSpacing: 0.5,
  },
  screenHeading: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  screenSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    ...NEO_SHADOW.box2,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginTop: 2,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingTop: SPACING.md,
    paddingBottom: 110,
    gap: SPACING.md,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  orderIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 2,
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#16A34A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  deliveredBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  paymentPill: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: COLORS.black,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  paymentPillText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 8,
    gap: 6,
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  itemsRow: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  itemsSummaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 2,
  },
  footerCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
  },
  footerAmount: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    marginTop: 20,
    ...NEO_SHADOW.box4,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
