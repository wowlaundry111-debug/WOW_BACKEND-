import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Linking, Modal, ActivityIndicator, Dimensions,
  Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { MapPin, Phone, QrCode, Banknote, Wifi, X, Smartphone, AlertTriangle, Truck, PackageCheck, Navigation, Clock, ShieldCheck, CheckCircle2, User, ChevronRight } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { Order } from '../../types';
import { DeliveryTaskSkeleton } from '../../components/SkeletonLoaders';

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

// ─── Verify Pickup Modal ─────────────────────────────────────────────────────

const VerifyOrderModal = ({
  visible,
  order,
  onClose,
  onVerify,
}: {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onVerify: (counts: Record<string, number>) => void;
}) => {
  const [counts, setCounts] = useState<Record<string, number>>({});

  React.useEffect(() => {
    if (order) {
      const initial: Record<string, number> = {};
      order.items.forEach((it) => (initial[it.itemId] = it.quantity));
      setCounts(initial);
    }
  }, [order]);

  if (!order || !visible) return null;

  const handleAdjust = (itemId: string, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalHeading}>VERIFY PICKED ITEMS</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 300 }}>
            {order.items.map((it) => (
              <View key={it.itemId} style={styles.verifyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.verifyItemName}>{it.name}</Text>
                  <Text style={styles.verifyItemQty}>Stated qty: {it.quantity}</Text>
                </View>
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    onPress={() => handleAdjust(it.itemId, -1)}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{counts[it.itemId] || 0}</Text>
                  <TouchableOpacity
                    onPress={() => handleAdjust(it.itemId, 1)}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.modalActionRow}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => {
                onVerify(counts);
                onClose();
              }}
            >
              <Text style={styles.modalConfirmText}>CONFIRM PICKUP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Payment Modal ───────────────────────────────────────────────────────────

const PaymentModal = ({
  visible,
  order,
  qrValue,
  onClose,
  onPay,
}: {
  visible: boolean;
  order: Order | null;
  qrValue: string | null;
  onClose: () => void;
  onPay: (mode: 'UPI' | 'COD') => Promise<void>;
}) => {
  const [paying, setPaying] = useState(false);

  if (!order || !visible) return null;

  // Build a dynamic UPI string with the exact amount
  const dynamicQr = qrValue
    ? `${qrValue}&am=${order.totalAmount.toFixed(2)}&tn=LaundryPayment`
    : null;

  const handlePay = async (mode: 'UPI' | 'COD') => {
    setPaying(true);
    await onPay(mode);
    setPaying(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: 48 }]}>
          {/* Header */}
          <View style={styles.payModalHeader}>
            <View>
              <Text style={styles.modalHeading}>COLLECT PAYMENT</Text>
              <Text style={styles.payOrderId}>
                Order #{order._id.slice(-6).toUpperCase()} · {order.customerName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={paying}>
              <X size={20} color={COLORS.black} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Amount Badge */}
          <View style={styles.amountBadge}>
            <Text style={styles.amountLabel}>AMOUNT DUE</Text>
            <Text style={styles.amountValue}>₹{order.totalAmount.toFixed(2)}</Text>
          </View>

          {/* QR Code Section */}
          {dynamicQr ? (
            <View style={styles.qrSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                <Smartphone size={18} color={COLORS.black} strokeWidth={2.5} />
                <Text style={styles.qrInstruction}>
                  Ask the customer to scan and pay via any UPI app
                </Text>
              </View>
              <View style={styles.qrBox}>
                <QRCode
                  value={dynamicQr}
                  size={200}
                  backgroundColor="white"
                  color={COLORS.black}
                />
              </View>
              <Text style={styles.qrHint}>UPI · Google Pay · PhonePe · Paytm</Text>
            </View>
          ) : (
            <View style={styles.noUpiBox}>
              <AlertTriangle size={24} color={COLORS.black} strokeWidth={2.5} style={{ marginBottom: 4 }} />
              <Text style={styles.noUpiText}>UPI not configured by admin</Text>
              <Text style={styles.noUpiSub}>Collect cash from the customer</Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>MARK PAYMENT AS</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Payment Action Buttons */}
          <View style={styles.payBtnsRow}>
            {/* Cash */}
            <TouchableOpacity
              style={[styles.payBtn, styles.payBtnCash]}
              onPress={() => handlePay('COD')}
              disabled={paying}
            >
              {paying ? (
                <ActivityIndicator color={COLORS.black} size="small" />
              ) : (
                <>
                  <Banknote size={22} color={COLORS.black} strokeWidth={2.5} />
                  <Text style={[styles.payBtnText, { color: COLORS.black }]}>
                    CASH{'\n'}COLLECTED
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Online / UPI */}
            <TouchableOpacity
              style={[styles.payBtn, styles.payBtnOnline]}
              onPress={() => handlePay('UPI')}
              disabled={paying || !dynamicQr}
            >
              {paying ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Wifi size={22} color={COLORS.white} strokeWidth={2.5} />
                  <Text style={[styles.payBtnText, { color: COLORS.white }]}>
                    ONLINE{'\n'}PAID
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const DeliveryTasksScreen = () => {
  const {
    orders, shops, currentUser,
    updateOrderStatus, verifyOrderItems, recordPayment, fetchOrders, initializeAppData, isLoading,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [refreshing, setRefreshing] = useState(false);
  const [verifyModalOrder, setVerifyModalOrder] = useState<Order | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);

  React.useEffect(() => {
    if (shops.length === 0) {
      initializeAppData();
    }
  }, [shops.length, initializeAppData]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(1), initializeAppData()]);
    setRefreshing(false);
  }, [fetchOrders, initializeAppData]);

  const pendingPickups = orders.filter(
    (o) =>
      (o.status === 'PICKUP_ASSIGNED' || (o.status === 'ACCEPTED' && o.deliveryBoyId === currentUser?._id)) &&
      (o.deliveryBoyId === currentUser?._id || (!o.deliveryBoyId && o.shopId === currentUser?.shopId))
  );
  const pendingDeliveries = orders.filter(
    (o) =>
      o.status === 'OUT_FOR_DELIVERY' &&
      (o.deliveryBoyId === currentUser?._id || (!o.deliveryBoyId && o.shopId === currentUser?.shopId))
  );

  const displayedOrders = activeTab === 'PICKUP' ? pendingPickups : pendingDeliveries;

  // Get the shop's UPI qrValue for the payment modal
  const getShopQrValue = (shopId: string): string | null => {
    const shop = shops.find((s) => s._id === shopId);
    if (shop?.paymentInfo?.qrValue) return shop.paymentInfo.qrValue;
    if (shop?.paymentInfo?.upiId && shop.paymentInfo.upiId !== 'na') {
      return `upi://pay?pa=${shop.paymentInfo.upiId}&pn=${encodeURIComponent(shop.name || 'Laundry')}&cu=INR`;
    }
    return null;
  };

  const insets = useSafeAreaInsets();

  const handlePayment = async (orderId: string, mode: 'UPI' | 'COD') => {
    await recordPayment(orderId, mode);
  };

  return (
    <View style={styles.root}>
      {/* Top overscroll filler for iOS pull-down */}
      <View style={styles.topOverscrollFiller} />

      {/* ─── Seamless Hero Emerald Green & Lime Neo-Brutalist Header ─── */}
      <LinearGradient
        colors={['#002B2E', '#023C41', '#045057', '#01353A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerHero, { paddingTop: (insets.top > 0 ? insets.top : 44) + 6 }]}
      >
        {/* Ambient Background Floating Bubbles */}
        <AmbientBubble size={16} startX={24} startY={20} duration={4200} delay={0} />
        <AmbientBubble size={22} startX={SCREEN_WIDTH - 60} startY={35} duration={4800} delay={600} />
        <AmbientBubble size={14} startX={SCREEN_WIDTH * 0.48} startY={12} duration={3600} delay={300} />

        <View style={styles.headerTopRow}>
          {/* Driver Avatar Box */}
          <View style={styles.driverAvatarBox}>
            {currentUser?.name ? (
              <Text style={styles.driverAvatarText}>
                {currentUser.name.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Truck size={22} color={COLORS.black} strokeWidth={2.5} />
            )}
          </View>

          {/* Driver Info */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.shiftBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.shiftBadgeText}>ONLINE · READY FOR TASKS</Text>
            </View>
            <Text style={styles.driverName} numberOfLines={1}>
              {currentUser?.name || 'Fleet Partner'}
            </Text>
          </View>

          {/* Shift Icon Pill */}
          <View style={styles.shiftPill}>
            <Truck size={14} color={COLORS.black} strokeWidth={2.5} />
            <Text style={styles.shiftPillText}>RIDER</Text>
          </View>
        </View>

        {/* Neo-Brutalist Floating Metric Chips */}
        <View style={styles.headerStatsRow}>
          <TouchableOpacity
            style={[styles.headerStatCard, activeTab === 'PICKUP' && styles.headerStatCardActivePickup]}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('PICKUP');
            }}
          >
            <View style={styles.statCardInner}>
              <View style={[styles.statIconCircle, { backgroundColor: '#B0FF49' }]}>
                <PackageCheck size={14} color={COLORS.black} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.statCountText}>{pendingPickups.length}</Text>
                <Text style={styles.statLabelText}>PICKUPS DUE</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerStatCard, activeTab === 'DELIVERY' && styles.headerStatCardActiveDelivery]}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('DELIVERY');
            }}
          >
            <View style={styles.statCardInner}>
              <View style={[styles.statIconCircle, { backgroundColor: '#38BDF8' }]}>
                <Truck size={14} color={COLORS.black} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.statCountText}>{pendingDeliveries.length}</Text>
                <Text style={styles.statLabelText}>DELIVERIES DUE</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Seamless Edge-to-Edge Wave Curve Partition with Dark Neo-Brutalist Border ─── */}
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

      {/* ─── Task Tabs ─── */}
      <View style={styles.tabsWrap}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PICKUP' && styles.tabBtnActive]}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('PICKUP');
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <PackageCheck
              size={15}
              color={activeTab === 'PICKUP' ? COLORS.black : '#4B5563'}
              strokeWidth={2.5}
            />
            <Text style={[styles.tabBtnText, activeTab === 'PICKUP' && styles.tabBtnTextActive]}>
              PICKUPS ({pendingPickups.length})
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'DELIVERY' && styles.tabBtnActive]}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('DELIVERY');
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Truck
              size={15}
              color={activeTab === 'DELIVERY' ? COLORS.black : '#4B5563'}
              strokeWidth={2.5}
            />
            <Text style={[styles.tabBtnText, activeTab === 'DELIVERY' && styles.tabBtnTextActive]}>
              DELIVERIES ({pendingDeliveries.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />}
      >
        {isLoading && displayedOrders.length === 0 ? (
          <>
            <DeliveryTaskSkeleton />
            <DeliveryTaskSkeleton />
            <DeliveryTaskSkeleton />
          </>
        ) : (
          displayedOrders.map((order, orderIdx) => {
          return (
            <View key={`${order._id}-${orderIdx}`} style={styles.taskCard}>
              <View style={styles.taskCardHeader}>
                <View style={styles.orderIdBadge}>
                  <Text style={styles.orderIdText}>#{order._id.slice(-6).toUpperCase()}</Text>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.orderAmount}>₹{order.totalAmount || 0}</Text>
                </View>
              </View>

              <Text style={styles.customerName}>{order.customerName || 'Customer'}</Text>

              {/* Items Breakdown */}
              {order.items && order.items.length > 0 && (
                <View style={styles.itemsRow}>
                  <Text style={styles.itemsSummaryText} numberOfLines={1}>
                    {order.items.map((it) => `${it.quantity}x ${it.name}`).join(' · ')}
                  </Text>
                </View>
              )}

              {/* Address Box */}
              <View style={styles.addressBox}>
                <MapPin size={16} color={COLORS.black} strokeWidth={2.5} />
                <Text style={styles.addressText} numberOfLines={2}>
                  {order.deliveryAddress || 'No address specified'}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {order.customerPhone ? (
                  <TouchableOpacity
                    style={styles.callBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL(`tel:${order.customerPhone}`);
                    }}
                  >
                    <Phone size={15} color={COLORS.black} strokeWidth={2.5} />
                    <Text style={styles.callBtnText}>CALL</Text>
                  </TouchableOpacity>
                ) : null}

                {activeTab === 'PICKUP' ? (
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      setVerifyModalOrder(order);
                    }}
                  >
                    <PackageCheck size={16} color={COLORS.black} strokeWidth={2.5} />
                    <Text style={styles.primaryActionBtnText}>VERIFY & PICK UP</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, styles.collectPayBtn]}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      setPaymentModalOrder(order);
                    }}
                  >
                    <QrCode size={16} color={COLORS.black} strokeWidth={2.5} />
                    <Text style={styles.primaryActionBtnText}>COLLECT PAYMENT</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}

      {!isLoading && displayedOrders.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <CheckCircle2 size={36} color={COLORS.black} strokeWidth={2.5} />
          </View>
          <Text style={styles.emptyTitle}>ALL CAUGHT UP!</Text>
          <Text style={styles.emptySub}>
            You have no pending {activeTab.toLowerCase()} tasks right now.
          </Text>
        </View>
      )}
    </ScrollView>

      {/* Verify Pickup Modal */}
      {verifyModalOrder && (
        <VerifyOrderModal
          visible={!!verifyModalOrder}
          order={verifyModalOrder}
          onClose={() => setVerifyModalOrder(null)}
          onVerify={async (counts) => {
            await verifyOrderItems(verifyModalOrder._id, counts);
          }}
        />
      )}

      {/* Payment Modal */}
      {paymentModalOrder && (
        <PaymentModal
          visible={!!paymentModalOrder}
          order={paymentModalOrder}
          qrValue={getShopQrValue(paymentModalOrder.shopId)}
          onClose={() => setPaymentModalOrder(null)}
          onPay={(mode) => handlePayment(paymentModalOrder._id, mode)}
        />
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    paddingHorizontal: SPACING.mobile,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    zIndex: 1,
  },
  driverAvatarBox: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  driverAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  shiftBadge: {
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
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B0FF49',
  },
  shiftBadgeText: {
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
  shiftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    ...NEO_SHADOW.box2,
  },
  shiftPillText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  headerStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    zIndex: 1,
  },
  headerStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: 10,
    ...NEO_SHADOW.box2,
  },
  headerStatCardActivePickup: {
    backgroundColor: '#F7FEE7',
    borderColor: COLORS.black,
  },
  headerStatCardActiveDelivery: {
    backgroundColor: '#F0F9FF',
    borderColor: COLORS.black,
  },
  statCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCountText: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    lineHeight: 18,
  },
  statLabelText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
  },
  tabsWrap: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.mobile,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
  },
  tabBtnActive: {
    backgroundColor: COLORS.secondary,
    ...NEO_SHADOW.box2,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  tabBtnTextActive: {
    color: COLORS.black,
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingBottom: 110,
    gap: SPACING.md,
  },
  taskCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderIdBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderIdText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  priceBadge: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: 4,
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
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 9,
    gap: 6,
    marginBottom: SPACING.md,
  },
  addressText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...NEO_SHADOW.box2,
  },
  callBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    ...NEO_SHADOW.box2,
  },
  collectPayBtn: {
    backgroundColor: '#38BDF8',
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  emptyState: {
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

  // ── Shared Modal Styles ───────────────────────────────────────────────────
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
    paddingBottom: 40,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: 2,
  },
  modalActionRow: {
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
  modalConfirmBtn: {
    flex: 1.5,
    padding: 14,
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    ...NEO_SHADOW.box2,
  },
  modalConfirmText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },

  // ── Verify Modal ──────────────────────────────────────────────────────────
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
  },
  verifyItemName: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  verifyItemQty: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.sm,
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
  },
  stepperValue: {
    fontSize: 13,
    fontWeight: '900',
    marginHorizontal: 8,
    color: COLORS.black,
  },

  // ── Payment Modal ─────────────────────────────────────────────────────────
  payModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  payOrderId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.sm,
  },
  amountBadge: {
    backgroundColor: '#002B2E',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...NEO_SHADOW.box2,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#B0FF49',
    letterSpacing: 1,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    marginTop: 2,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  qrInstruction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  qrBox: {
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 16,
    ...NEO_SHADOW.box4,
    marginBottom: 8,
  },
  qrHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  noUpiBox: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  noUpiText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#92400E',
  },
  noUpiSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  payBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  payBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderWidth: 2.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    ...NEO_SHADOW.box4,
  },
  payBtnCash: {
    backgroundColor: COLORS.secondary,
  },
  payBtnOnline: {
    backgroundColor: '#0D8DE3',
  },
  payBtnText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
