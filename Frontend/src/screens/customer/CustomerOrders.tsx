import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PackageOpen, Clock, CheckCircle2, FileX } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { EmptyState } from '../../components/EmptyState';
import { OrderStatus } from '../../types';

const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PLACED', label: 'Order Placed' },
  { status: 'PICKED_UP', label: 'Items Picked Up' },
  { status: 'WASHING', label: 'In Wash Cycle' },
  { status: 'IRONING', label: 'Ironing & Packing' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { status: 'DELIVERED', label: 'Delivered' }
];

const getStepIndex = (status: OrderStatus) => {
  if (status === 'ACCEPTED') return 0;
  if (status === 'PICKUP_ASSIGNED') return 1;
  return ORDER_STEPS.findIndex(s => s.status === status);
};

export const CustomerOrdersScreen = () => {
  const { orders, currentUser, shops, fetchOrders } = useAppStore();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);
  const myOrders = orders.filter(o => o.customerId === currentUser?._id);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + SPACING.sm, SPACING.xl) }]}>
        <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, fontWeight: '800' }]}>My Orders</Text>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {myOrders.length === 0 ? (
          <EmptyState 
            icon={FileX} 
            title="No orders yet" 
            subtitle="When you place orders, they will appear here." 
          />
        ) : (
          myOrders.map(order => {
            const currentStepIdx = getStepIndex(order.status);
            
            return (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '700' }]}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                    <Text style={[TYPO.labelSm, { color: COLORS.outline, marginTop: 2 }]}>
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, order.status === 'DELIVERED' ? styles.statusBadgeDelivered : {}]}>
                    {order.status === 'DELIVERED' ? <CheckCircle2 size={14} color="#10B981" /> : <Clock size={14} color={COLORS.primary} />}
                    <Text style={[TYPO.labelSm, { color: order.status === 'DELIVERED' ? '#10B981' : COLORS.primary, marginLeft: 4, fontWeight: '700' }]}>
                      {order.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                {/* Items Summary */}
                <View style={styles.orderBody}>
                  <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]} numberOfLines={2}>
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </Text>
                  {order.washPreferences && order.washPreferences.length > 0 && (
                    <Text style={[TYPO.labelSm, { color: COLORS.secondary, marginTop: 4, fontWeight: '600' }]}>
                      Preferences: {order.washPreferences.map(wp => wp.name).join(', ')}
                    </Text>
                  )}
                  {order.pickupTime ? (
                    <Text style={[TYPO.labelSm, { color: COLORS.primary, marginTop: 4, fontWeight: '600' }]}>
                      Pickup slot: {order.pickupTime}
                    </Text>
                  ) : null}
                  {order.adminNotes ? (
                    <View style={{ marginTop: 8, padding: 8, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                      <Text style={[TYPO.labelSm, { color: '#D97706', fontWeight: '700', marginBottom: 2 }]}>Update / Note</Text>
                      <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>{order.adminNotes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Vertical Timeline */}
                <View style={styles.timelineBox}>
                  {ORDER_STEPS.map((step, idx) => {
                    const isCompleted = currentStepIdx >= idx;
                    const isLast = idx === ORDER_STEPS.length - 1;
                    return (
                      <View key={step.status} style={styles.timelineRow}>
                        <View style={styles.timelineNodeBox}>
                          <View style={[styles.timelineDot, isCompleted && styles.timelineDotActive]} />
                          {!isLast && <View style={[styles.timelineLine, isCompleted && styles.timelineLineActive]} />}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={[TYPO.labelMd, { color: isCompleted ? COLORS.onSurface : COLORS.outline, fontWeight: isCompleted ? '700' : '400' }]}>
                            {step.label}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Footer */}
                <View style={styles.orderFooter}>
                  <View>
                    <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>Total Amount</Text>
                    <Text style={[TYPO.headlineMd, { color: COLORS.primary, fontWeight: '800' }]}>₹{order.totalAmount}</Text>
                  </View>
                  {order.status === 'DELIVERED' ? (
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={[TYPO.labelMd, { color: COLORS.primary, fontWeight: '700' }]}>Reorder</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.actionBtn, { borderColor: COLORS.outlineVariant }]}
                      onPress={() => {
                        const orderShop = shops.find(s => s._id === order.shopId);
                        const contact = orderShop?.contactNumber || '9999999999';
                        Linking.openURL(`tel:${contact}`);
                      }}
                    >
                      <Text style={[TYPO.labelMd, { color: COLORS.onSurfaceVariant, fontWeight: '600' }]}>Need Help?</Text>
                    </TouchableOpacity>
                  )}
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
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.mobile,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    ...SHADOW.ambient,
    zIndex: 10,
  },
  scrollContent: {
    padding: SPACING.mobile,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    ...SHADOW.ambient,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusBadgeDelivered: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  orderBody: {
    marginBottom: SPACING.md,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainer,
  },
  timelineBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineNodeBox: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceContainerHigh,
    marginTop: 4,
  },
  timelineDotActive: {
    backgroundColor: COLORS.primary,
    ...SHADOW.glow(COLORS.primary),
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  timelineLineActive: {
    backgroundColor: COLORS.primary,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
});
