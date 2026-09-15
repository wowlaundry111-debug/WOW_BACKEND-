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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Package, Clock, Phone, PhoneCall, MessageCircle, XCircle, User, Scale, AlertTriangle } from 'lucide-react-native';
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
  const { orders, currentUser, shops, fetchOrders, cancelOrder, isLoading } = useAppStore();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);
  const [cancelModalOrder, setCancelModalOrder] = React.useState<any>(null);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [cancelError, setCancelError] = React.useState('');
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getCleanPhone = (phone: any) => {
    if (!phone) return '';
    return String(phone).replace(/[^0-9]/g, '');
  };

  const getShopContact = (order: any) => {
    if (order.shopPhone) return order.shopPhone;
    const shop = (shops || []).find((s) => s && s._id === order.shopId);
    return shop?.contactNumber || '9999999999';
  };

  const getWaLink = (phone: any, orderId: any) => {
    const clean = getCleanPhone(phone);
    if (!clean) return '';
    const intlPhone = clean.length === 10 ? '91' + clean : clean;
    const idStr = String(orderId || '').slice(-6).toUpperCase();
    const msg = encodeURIComponent(`Hi, I need assistance regarding my WOW Laundry Order #${idStr}`);
    return `https://wa.me/${intlPhone}?text=${msg}`;
  };

  const getCancelTimeRemainingMs = (createdAt: any) => {
    if (!createdAt) return 0;
    const elapsed = now - new Date(createdAt).getTime();
    return Math.max(0, 15 * 60 * 1000 - elapsed);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    setIsCancelling(true);
    setCancelError('');
    const res = await cancelOrder(cancelModalOrder._id, 'Cancelled by customer within 15 minutes');
    setIsCancelling(false);
    if (res.success) {
      setCancelModalOrder(null);
    } else {
      setCancelError(res.message || 'Failed to cancel order');
    }
  };

  const myOrders = React.useMemo(() => {
    const map = new Map<string, (typeof orders)[0]>();
    (orders || [])
      .filter((o) => o && (o.customerId === currentUser?._id || !currentUser?._id))
      .forEach((o) => {
        if (o) {
          const id = String(o._id || (o as any).id || Math.random());
          map.set(id, o);
        }
      });
    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
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
              if (!order) return null;
              const activeStepIndex = getStepIdx(order.status || 'PLACED');
              const orderIdStr = String(order._id || (order as any).id || `ORD-${orderIdx}`);
              const displayId = orderIdStr.length >= 6 ? orderIdStr.slice(-6).toUpperCase() : orderIdStr.toUpperCase();

              const formattedDate = (() => {
                if (!order.createdAt) return new Date().toLocaleDateString();
                const d = new Date(order.createdAt);
                return isNaN(d.getTime()) ? new Date().toLocaleDateString() : d.toLocaleDateString();
              })();

              const formattedTime = (() => {
                if (!order.createdAt) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const d = new Date(order.createdAt);
                return isNaN(d.getTime()) ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              })();

              const safeItems = Array.isArray(order.items) ? order.items : [];

              return (
                <View key={`${orderIdStr}-${orderIdx}`} style={styles.orderCard}>
                  {/* Order Top Bar */}
                  <View style={styles.orderTopBar}>
                    <View style={{ gap: 4 }}>
                      <View style={styles.orderIdBadge}>
                        <Text style={styles.orderIdBadgeText}>
                          ORDER #{displayId}
                        </Text>
                      </View>
                      <Text style={styles.orderDateText}>
                        {formattedDate} at {formattedTime}
                      </Text>
                    </View>

                    <StatusBadge status={(order.status || 'PLACED') as any} />
                  </View>

                  {/* Items Summary - Split into Per-Item and Per-KG Categories */}
                  <View style={styles.orderBody}>
                    {(() => {
                      const isKgCheck = (it: any) =>
                        it &&
                        (it.unit === 'KG' ||
                          (typeof it.name === 'string' &&
                            (it.name.toLowerCase().includes('per kg') ||
                              it.name.toLowerCase().includes('/ kg') ||
                              it.name.toLowerCase().includes('per-kg'))) ||
                          Boolean(it.kgWeight && it.kgWeight > 0));

                      const perItemProducts = safeItems.filter((it) => it && !isKgCheck(it));
                      const perKgProducts = safeItems.filter((it) => it && isKgCheck(it));

                      return (
                        <View style={{ gap: 8 }}>
                          {perItemProducts.length > 0 && (
                            <View style={{ backgroundColor: '#F1F5F9', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                              <Text style={{ fontSize: 11, fontWeight: '900', color: '#334155', marginBottom: 2 }}>PER-ITEM ITEMS ({perItemProducts.length}):</Text>
                              <Text style={styles.itemsListText}>
                                {perItemProducts.map((i) => {
                                  const itemName = i.name || 'Item';
                                  const catBreadcrumb = (i.categoryName || i.subCategoryName) ? ` [${i.categoryName || ''}${i.subCategoryName ? ` › ${i.subCategoryName}` : ''}]` : '';
                                  const bucketTag = i.isBucket ? ' [Bucket]' : '';
                                  const qty = typeof i.quantity === 'number' ? i.quantity : 1;
                                  const price = typeof i.price === 'number' ? i.price : 0;
                                  return `${qty}× ${itemName}${bucketTag}${catBreadcrumb} (₹${price * qty})`;
                                }).join(' • ')}
                              </Text>
                            </View>
                          )}

                          {perKgProducts.length > 0 && (
                            <View style={{ backgroundColor: '#EFF6FF', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#BAE6FD' }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                <Text style={{ fontSize: 11, fontWeight: '900', color: '#0369A1' }}>PER-KG CLOTHES ({perKgProducts.length}):</Text>
                                <View style={{ backgroundColor: order.kgPriceUpdated ? '#B0FF49' : '#FEF08A', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: COLORS.black }}>
                                  <Text style={{ fontSize: 9, fontWeight: '900', color: COLORS.black }}>
                                    {order.kgPriceUpdated ? 'WEIGHED' : 'PENDING WEIGHING'}
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.itemsListText, { color: '#0369A1' }]}>
                                {perKgProducts.map((i) => {
                                  const itemName = i.name || 'Item';
                                  const catBreadcrumb = (i.categoryName || i.subCategoryName) ? ` [${i.categoryName || ''}${i.subCategoryName ? ` › ${i.subCategoryName}` : ''}]` : '';
                                  const bucketTag = i.isBucket ? ' [Bucket]' : '';
                                  const qty = typeof i.quantity === 'number' ? i.quantity : 1;
                                  return `${qty}× ${itemName}${bucketTag}${catBreadcrumb} ${i.kgWeight ? `(${i.kgWeight} KG = ₹${i.price || 0})` : '(Weight taken at pickup)'}`;
                                }).join(' • ')}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })()}

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
                        {(() => {
                          const isKgCheck = (it: any) =>
                            it &&
                            (it.unit === 'KG' ||
                              (typeof it.name === 'string' &&
                                (it.name.toLowerCase().includes('per kg') ||
                                  it.name.toLowerCase().includes('/ kg') ||
                                  it.name.toLowerCase().includes('per-kg'))) ||
                              Boolean(it.kgWeight && it.kgWeight > 0));
                          const hasKg = safeItems.some(isKgCheck);
                          const isPending = hasKg && !order.kgPriceUpdated;
                          return (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={styles.totalValue}>₹{order.totalAmount || 0}</Text>
                              {isPending ? (
                                <View style={{ backgroundColor: '#FEF08A', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: COLORS.black }}>
                                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#854D0E' }}>+ KG PENDING</Text>
                                </View>
                              ) : hasKg && order.kgPriceUpdated ? (
                                <View style={{ backgroundColor: '#B0FF49', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: COLORS.black }}>
                                  <Text style={{ fontSize: 9, fontWeight: '900', color: COLORS.black }}>KG CALCULATED</Text>
                                </View>
                              ) : null}
                            </View>
                          );
                        })()}
                      </View>
                      {order.paymentMode ? (
                        <View style={styles.paymentPill}>
                          <Text style={styles.paymentPillText}>
                            {order.paymentMode === 'COD' ? 'CASH (COD)' : order.paymentMode === 'UPI' ? 'UPI' : order.paymentMode}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Action & Contact Icons Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {/* 15-Minute Cancel Button */}
                      {(() => {
                        const cancelRemainingMs = getCancelTimeRemainingMs(order.createdAt);
                        const canCancel = ['PLACED', 'ACCEPTED', 'PICKUP_ASSIGNED'].includes(order.status) && cancelRemainingMs > 0;
                        const cancelMinsLeft = Math.ceil(cancelRemainingMs / 60000);

                        if (!canCancel) return null;
                        return (
                          <TouchableOpacity
                            style={styles.cancelOrderBtn}
                            activeOpacity={0.8}
                            onPress={() => setCancelModalOrder(order)}
                          >
                            <XCircle size={12} color="#991B1B" strokeWidth={2.5} />
                            <Text style={styles.cancelOrderBtnText}>CANCEL ({cancelMinsLeft}M)</Text>
                          </TouchableOpacity>
                        );
                      })()}

                      {/* Shop Help Contact Icons */}
                      <View style={styles.contactIconGroup}>
                        <Text style={styles.contactGroupTag}>SHOP:</Text>
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          activeOpacity={0.8}
                          onPress={() => {
                            const contact = getShopContact(order);
                            Linking.openURL(`tel:${contact}`);
                          }}
                        >
                          <Phone size={11} color={COLORS.black} strokeWidth={2.5} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionIconBtn, { backgroundColor: '#DCFCE7', borderColor: '#16A34A' }]}
                          activeOpacity={0.8}
                          onPress={() => {
                            const contact = getShopContact(order);
                            Linking.openURL(getWaLink(contact, order._id));
                          }}
                        >
                          <MessageCircle size={11} color="#166534" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>

                      {/* Delivery Rider Contact Icons */}
                      {(order.deliveryBoyName || order.deliveryBoyId) ? (
                        <View style={styles.contactIconGroup}>
                          <Text style={styles.contactGroupTag}>
                            DELIVERY:
                          </Text>
                          {order.deliveryBoyPhone ? (
                            <TouchableOpacity
                              style={styles.actionIconBtn}
                              activeOpacity={0.8}
                              onPress={() => Linking.openURL(`tel:${order.deliveryBoyPhone}`)}
                            >
                              <Phone size={11} color={COLORS.black} strokeWidth={2.5} />
                            </TouchableOpacity>
                          ) : null}
                          {order.deliveryBoyPhone ? (
                            <TouchableOpacity
                              style={[styles.actionIconBtn, { backgroundColor: '#DCFCE7', borderColor: '#16A34A' }]}
                              activeOpacity={0.8}
                              onPress={() => Linking.openURL(getWaLink(order.deliveryBoyPhone, order._id))}
                            >
                              <MessageCircle size={11} color="#166534" strokeWidth={2.5} />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </View>

                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        visible={!!cancelModalOrder}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCancelModalOrder(null);
          setCancelError('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AlertTriangle size={24} color="#DC2626" strokeWidth={2.5} />
              <Text style={styles.modalTitle}>CANCEL ORDER?</Text>
            </View>

            <Text style={styles.modalBody}>
              Are you sure you want to cancel order #{cancelModalOrder ? String(cancelModalOrder._id || '').slice(-6).toUpperCase() : ''}? You can cancel within 15 minutes of placing an order.
            </Text>

            {cancelError ? (
              <Text style={styles.modalErrorText}>{cancelError}</Text>
            ) : null}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                disabled={isCancelling}
                onPress={() => {
                  setCancelModalOrder(null);
                  setCancelError('');
                }}
              >
                <Text style={styles.modalCancelBtnText}>KEEP ORDER</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                disabled={isCancelling}
                onPress={handleConfirmCancel}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>CONFIRM CANCEL</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: COLORS.background,
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
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelOrderBtnText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#991B1B',
    letterSpacing: 0.3,
  },
  contactIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  contactGroupTag: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#374151',
    letterSpacing: 0.3,
    maxWidth: 60,
  },
  actionIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: 20,
    ...NEO_SHADOW.box4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  modalBody: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  modalErrorText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: RADIUS.sm,
    padding: 8,
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
    ...NEO_SHADOW.box2,
  },
  modalConfirmBtnText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
  },
});
