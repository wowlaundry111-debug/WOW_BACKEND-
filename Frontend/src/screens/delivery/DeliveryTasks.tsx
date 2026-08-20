import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { MapPin, Phone, CheckCircle2, Navigation, PartyPopper, QrCode } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { EmptyState } from '../../components/EmptyState';
import { NotificationBell } from '../../components/NotificationBell';
import { Order } from '../../types';

const VerifyOrderModal = ({ visible, order, onClose, onVerify }: { visible: boolean, order: Order | null, onClose: () => void, onVerify: (counts: Record<string, number>) => void }) => {
  const [counts, setCounts] = useState<Record<string, number>>({});

  React.useEffect(() => {
    if (order) {
      const initial: Record<string, number> = {};
      order.items.forEach(it => initial[it.itemId] = it.quantity);
      setCounts(initial);
    }
  }, [order]);

  if (!order) return null;

  const handleAdjust = (itemId: string, delta: number) => {
    setCounts(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
    }));
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: COLORS.surfaceContainerLowest, padding: SPACING.lg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl }}>
          <Text style={[TYPO.headlineSm, { fontWeight: '800', marginBottom: SPACING.md }]}>Verify Picked Items</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 300 }}>
            {order.items.map(it => (
              <View key={it.itemId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>{it.name}</Text>
                  <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>Customer stated: {it.quantity}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.md, padding: 4 }}>
                  <TouchableOpacity onPress={() => handleAdjust(it.itemId, -1)} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 18, color: COLORS.primary, fontWeight: '800' }}>-</Text>
                  </TouchableOpacity>
                  <Text style={[TYPO.labelLg, { marginHorizontal: 12, width: 24, textAlign: 'center' }]}>{counts[it.itemId]}</Text>
                  <TouchableOpacity onPress={() => handleAdjust(it.itemId, 1)} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 18, color: COLORS.primary, fontWeight: '800' }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', marginTop: SPACING.lg }}>
            <TouchableOpacity style={{ flex: 1, padding: 16, alignItems: 'center' }} onPress={onClose}>
              <Text style={[TYPO.labelLg, { color: COLORS.outline }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 16, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, alignItems: 'center' }} onPress={() => { onVerify(counts); onClose(); }}>
              <Text style={[TYPO.labelLg, { color: COLORS.onPrimary, fontWeight: '800' }]}>Confirm & Pick Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const PaymentCollectionModal = ({ visible, order, shop, onClose, onConfirm }: { visible: boolean, order: Order | null, shop: any, onClose: () => void, onConfirm: (mode: 'COD' | 'UPI' | 'CARD' | 'WALLET') => void }) => {
  if (!order || !shop) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }}>
        <View style={{ backgroundColor: COLORS.surfaceContainerLowest, padding: SPACING.xl, borderRadius: RADIUS.xl, width: '100%', alignItems: 'center' }}>
          <Text style={[TYPO.headlineMd, { fontWeight: '800', marginBottom: SPACING.sm }]}>Collect Payment</Text>
          <Text style={[TYPO.bodyMd, { color: COLORS.outline, marginBottom: SPACING.lg }]}>Total Amount: ₹{order.totalAmount}</Text>

          {shop.paymentInfo?.qrValue ? (
            <View style={{ padding: SPACING.md, backgroundColor: '#fff', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.outlineVariant, marginBottom: SPACING.lg, alignItems: 'center' }}>
              <Image 
                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shop.paymentInfo.qrValue)}` }} 
                style={{ width: 160, height: 160, borderRadius: RADIUS.md }} 
                resizeMode="contain"
              />
              <Text style={[TYPO.labelLg, { color: COLORS.primary, textAlign: 'center', marginTop: SPACING.md, fontWeight: '700' }]}>
                {shop.paymentInfo.upiId}
              </Text>
            </View>
          ) : (
            <Text style={[TYPO.bodyLg, { color: COLORS.error, marginBottom: SPACING.lg }]}>No UPI ID configured.</Text>
          )}

          <View style={{ flexDirection: 'row', width: '100%', gap: SPACING.sm }}>
            <TouchableOpacity style={{ flex: 1, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.outline, borderRadius: RADIUS.md }} onPress={onClose}>
              <Text style={[TYPO.labelLg, { color: COLORS.outline }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 16, backgroundColor: '#10B981', borderRadius: RADIUS.md, alignItems: 'center' }} onPress={() => onConfirm('COD')}>
              <Text style={[TYPO.labelLg, { color: '#fff', fontWeight: '800' }]}>Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 16, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, alignItems: 'center' }} onPress={() => onConfirm('UPI')}>
              <Text style={[TYPO.labelLg, { color: '#fff', fontWeight: '800' }]}>Online</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export const DeliveryTasksScreen = () => {
  const { orders, users, shops, currentUser, updateOrderStatus, verifyOrderItems, fetchOrders, fetchUsers } = useAppStore();
  const [activeTab, setActiveTab] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOrders(),
      fetchUsers?.()
    ]);
    setRefreshing(false);
  }, [fetchOrders, fetchUsers]);

  const [verifyModalOrder, setVerifyModalOrder] = useState<Order | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);

  // Filter orders that need pickup or delivery and are assigned to this delivery boy
  const pendingPickups = orders.filter(o => o.status === 'PICKUP_ASSIGNED' && o.deliveryBoyId === currentUser?._id);
  const pendingDeliveries = orders.filter(o => o.status === 'OUT_FOR_DELIVERY' && o.deliveryBoyId === currentUser?._id);

  const displayOrders = activeTab === 'PICKUP' ? pendingPickups : pendingDeliveries;

  const handleAction = (orderId: string) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    
    if (activeTab === 'PICKUP') {
      setVerifyModalOrder(order);
    } else {
      setPaymentModalOrder(order);
    }
  };

  const handleVerify = (counts: Record<string, number>) => {
    if (verifyModalOrder) {
      verifyOrderItems(verifyModalOrder._id, counts);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
          <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, fontWeight: '800' }]}>
            Tasks
          </Text>
          <NotificationBell />
        </View>
        
        {/* Toggle Tabs */}
        <View style={styles.segmentControl}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'PICKUP' && styles.segmentActive]}
            onPress={() => setActiveTab('PICKUP')}
          >
            <Text style={[TYPO.labelLg, { color: activeTab === 'PICKUP' ? COLORS.onPrimary : COLORS.outline }]}>
              Pickups ({pendingPickups.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'DELIVERY' && styles.segmentActive]}
            onPress={() => setActiveTab('DELIVERY')}
          >
            <Text style={[TYPO.labelLg, { color: activeTab === 'DELIVERY' ? COLORS.onPrimary : COLORS.outline }]}>
              Deliveries ({pendingDeliveries.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {displayOrders.length === 0 ? (
          <EmptyState 
            icon={PartyPopper} 
            title="All Caught Up!" 
            subtitle={`No pending ${activeTab === 'PICKUP' ? 'pickups' : 'deliveries'} at the moment.`} 
          />
        ) : (
          displayOrders.map(order => {
            const customer = users.find(u => u._id === order.customerId);
            const customerName = customer?.name || order.customerName || 'Unknown Customer';
            const customerPhone = customer?.phone || order.customerPhone || 'N/A';
            const displayAddress = (activeTab === 'PICKUP' ? order.pickupAddress : order.deliveryAddress) || customer?.address || 'No Address Provided';

            return (
              <View key={order._id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '700' }]}>{customerName}</Text>
                    <Text style={[TYPO.labelSm, { color: COLORS.outline, marginBottom: 2 }]}>Order #{order._id.split('_')[1]}</Text>
                    <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {order.pickupTime && activeTab === 'PICKUP' && (
                      <Text style={[TYPO.labelSm, { color: COLORS.primary, marginTop: 2, fontWeight: '600' }]}>
                        Pickup: {order.pickupTime}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.callBtn} onPress={() => alert(`Calling ${customerPhone}...`)}>
                    <Phone size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.addressBox}>
                  <MapPin size={18} color={COLORS.primary} style={{ marginTop: 2 }} />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]} numberOfLines={2}>
                      {displayAddress}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.navBtn}>
                    <Navigation size={18} color="#10B981" />
                  </TouchableOpacity>
                </View>

                <View style={styles.itemSummary}>
                  <Text style={[TYPO.labelSm, { color: COLORS.onSurfaceVariant }]}>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items to {activeTab === 'PICKUP' ? 'collect' : 'deliver'}
                  </Text>
                </View>

                <View style={styles.actionFooter}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction(order._id)}>
                    <Text style={[TYPO.labelLg, { color: COLORS.onPrimary, fontWeight: '800' }]}>
                      Mark {activeTab === 'PICKUP' ? 'Picked Up' : 'Delivered'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {verifyModalOrder && (
        <VerifyOrderModal
          visible={!!verifyModalOrder}
          order={verifyModalOrder}
          onClose={() => setVerifyModalOrder(null)}
          onVerify={handleVerify}
        />
      )}

      {paymentModalOrder && (
        <PaymentCollectionModal
          visible={!!paymentModalOrder}
          order={paymentModalOrder}
          shop={shops.find(s => s._id === paymentModalOrder.shopId)}
          onClose={() => setPaymentModalOrder(null)}
          onConfirm={(mode) => {
            updateOrderStatus(paymentModalOrder._id, 'DELIVERED', mode, 'SUCCESS');
            setPaymentModalOrder(null);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Subtle gray background
  },
  header: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.mobile,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    ...SHADOW.ambient,
    zIndex: 10,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.mobile,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.ambient,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSummary: {
    marginBottom: SPACING.md,
  },
  actionFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainer,
    paddingTop: SPACING.md,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
});
