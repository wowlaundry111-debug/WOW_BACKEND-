import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Linking,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  User,
  Clock,
  ChevronRight,
  Truck,
  MapPin,
  X,
  Phone,
  MessageCircle,
  Download,
  CheckCircle,
  ClipboardList,
  Filter,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { StatusBadge } from '../../components/UIPack';
import { useAppStore } from '../../store/useAppStore';
import { downloadOrdersCsv } from '../../utils/exportCsv';
import type { Order, OrderStatus } from '../../types';

const FILTERS: {
  key: 'new' | 'washing' | 'delivery' | 'history';
  label: string;
  statuses: OrderStatus[];
}[] = [
  { key: 'new', label: 'New Orders', statuses: ['PLACED', 'ACCEPTED'] },
  { key: 'washing', label: 'In Wash Cycle', statuses: ['PICKED_UP', 'WASHING', 'IRONING'] },
  {
    key: 'delivery',
    label: 'Out for Delivery',
    statuses: ['PICKUP_ASSIGNED', 'OUT_FOR_DELIVERY'],
  },
  { key: 'history', label: 'History', statuses: ['DELIVERED'] },
];

export const AdminOrdersScreen: React.FC = () => {
  const {
    orders,
    users,
    shops,
    currentTenantId,
    currentUser,
    updateOrderStatus,
    assignDeliveryBoy,
    updateOrderAdminDetails,
    fetchOrders,
  } = useAppStore();

  const [activeFilter, setActiveFilter] = useState<'new' | 'washing' | 'delivery' | 'history'>('new');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignModalOrder, setAssignModalOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [editPrice, setEditPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const activeShopId = currentTenantId || currentUser?.shopId || '';
  const tenantOrders = activeShopId
    ? orders.filter((o) => o.shopId === activeShopId)
    : orders;

  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_high' | 'price_low' | 'customer'>('newest');

  const currentFilterConfig = FILTERS.find((f) => f.key === activeFilter) || FILTERS[0];
  const filteredOrders = tenantOrders.filter((o) =>
    currentFilterConfig.statuses.includes(o.status)
  );

  const sortedOrders = useMemo(() => {
    const list = [...filteredOrders];
    if (sortBy === 'newest') {
      return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    if (sortBy === 'oldest') {
      return list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    }
    if (sortBy === 'price_high') {
      return list.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    }
    if (sortBy === 'price_low') {
      return list.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    }
    if (sortBy === 'customer') {
      return list.sort((a, b) => {
        const nameA = (users.find(u => u._id === a.customerId)?.name || a.customerName || '').toLowerCase();
        const nameB = (users.find(u => u._id === b.customerId)?.name || b.customerName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
    return list;
  }, [filteredOrders, sortBy, users]);

  const deliveryBoys = users.filter(
    (u) => u.role === 'Delivery' && (!activeShopId || !u.shopId || u.shopId === activeShopId)
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(1);
    setRefreshing(false);
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await updateOrderStatus(orderId, status);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update order status');
    }
  };

  const handleOpenOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setEditPrice(order.totalAmount ? String(order.totalAmount) : '');
    setEditNotes(order.adminNotes || '');
  };

  const handleSaveDetails = async () => {
    if (!selectedOrder) return;
    const priceNum = parseFloat(editPrice);
    await updateOrderAdminDetails(selectedOrder._id, {
      totalAmount: isNaN(priceNum) ? undefined : priceNum,
      adminNotes: editNotes,
    });
    setSelectedOrder(null);
  };

  const handleAssignBoy = async (orderId: string, boyId: string) => {
    try {
      await assignDeliveryBoy(orderId, boyId);
      setAssignModalOrder(null);
      Alert.alert('Assigned', 'Delivery staff assigned successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to assign delivery staff');
    }
  };

  const handleExport = () => {
    downloadOrdersCsv(tenantOrders, 'All_Time', users);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>ORDER BOARD</Text>
          <Text style={styles.subHeading}>{tenantOrders.length} TOTAL ORDERS</Text>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.85}>
          <Download size={16} color={COLORS.black} strokeWidth={3} />
          <Text style={styles.exportBtnText}>EXPORT</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsWrap}
        >
          {FILTERS.map((f) => {
            const count = tenantOrders.filter((o) => f.statuses.includes(o.status)).length;
            const isActive = activeFilter === f.key;

            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
                <View style={[styles.filterCountBadge, isActive && styles.filterCountBadgeActive]}>
                  <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort Pills Selector Bar (Only shown in History panel) */}
      {activeFilter === 'history' && (
        <View style={styles.sortBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortBarContent}
          >
            <View style={styles.sortLabelBox}>
              <Filter size={13} color={COLORS.black} strokeWidth={2.5} />
              <Text style={styles.sortLabelText}>SORT BY:</Text>
            </View>
            {[
              { id: 'newest', label: 'Latest' },
              { id: 'oldest', label: 'Oldest' },
              { id: 'price_high', label: 'Price High' },
              { id: 'price_low', label: 'Price Low' },
              { id: 'customer', label: 'Customer A-Z' },
            ].map((s) => {
              const isActive = sortBy === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSortBy(s.id as any);
                  }}
                  activeOpacity={0.8}
                  style={[styles.sortPill, isActive && styles.sortPillActive]}
                >
                  <Text style={[styles.sortPillText, isActive && styles.sortPillTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Orders List */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {sortedOrders.map((order) => {
          const customer = users.find((u) => u._id === order.customerId);
          const customerName = customer?.name || order.customerName || 'Customer';
          const customerPhone = customer?.phone || order.customerPhone || '';
          const assignedBoy = users.find((u) => u._id === order.deliveryBoyId);

          return (
            <TouchableOpacity
              key={order._id}
              style={styles.orderCard}
              activeOpacity={0.9}
              onPress={() => handleOpenOrderModal(order)}
            >
              {/* Top Row: Order ID + Status */}
              <View style={styles.orderCardTop}>
                <View style={styles.orderIdBadge}>
                  <Text style={styles.orderIdText}>
                    #{order._id.slice(-6).toUpperCase()}
                  </Text>
                </View>
                <StatusBadge status={order.status} />
              </View>

              {/* Customer Row */}
              <View style={styles.customerRow}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {customerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.customerName}>{customerName}</Text>
                  {customerPhone ? (
                    <Text style={styles.customerPhone}>+91 {customerPhone}</Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.orderTotal}>₹{order.totalAmount || 0}</Text>
                  {order.paymentMode ? (
                    <View style={{ backgroundColor: order.paymentMode === 'COD' ? COLORS.secondary : COLORS.primary, borderWidth: 1, borderColor: COLORS.black, paddingHorizontal: 5, paddingVertical: 1, borderRadius: RADIUS.sm, marginTop: 2 }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: COLORS.black }}>
                        {order.paymentMode === 'COD' ? 'CASH' : order.paymentMode === 'UPI' ? 'UPI' : order.paymentMode}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Items Summary */}
              <View style={styles.itemsBox}>
                <Text style={styles.itemsSummaryText} numberOfLines={2}>
                  {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(' · ') ||
                    'Standard Laundry'}
                </Text>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.cardActionsRow}>
                {order.status === 'PLACED' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
                    onPress={() => handleStatusChange(order._id, 'ACCEPTED')}
                  >
                    <Text style={styles.actionBtnText}>ACCEPT ORDER</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'ACCEPTED' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                    onPress={() => setAssignModalOrder(order)}
                  >
                    <Text style={[styles.actionBtnText, { color: COLORS.white }]}>
                      {assignedBoy ? `REASSIGN (${assignedBoy.name.split(' ')[0]})` : 'ASSIGN PICKUP'}
                    </Text>
                  </TouchableOpacity>
                )}

                {order.status === 'PICKED_UP' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#FDE047' }]}
                    onPress={() => handleStatusChange(order._id, 'WASHING')}
                  >
                    <Text style={styles.actionBtnText}>START WASHING</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'WASHING' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#BAE6FD' }]}
                    onPress={() => handleStatusChange(order._id, 'IRONING')}
                  >
                    <Text style={styles.actionBtnText}>PRESSING / IRON</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'IRONING' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
                    onPress={() => setAssignModalOrder(order)}
                  >
                    <Text style={styles.actionBtnText}>OUT FOR DELIVERY</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'OUT_FOR_DELIVERY' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => handleStatusChange(order._id, 'DELIVERED')}
                  >
                    <Text style={[styles.actionBtnText, { color: COLORS.white }]}>
                      MARK DELIVERED
                    </Text>
                  </TouchableOpacity>
                )}

                {order.status === 'DELIVERED' && (
                  <View style={styles.deliveredTag}>
                    <CheckCircle size={16} color="#10B981" strokeWidth={3} />
                    <Text style={styles.deliveredTagText}>COMPLETED</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        {filteredOrders.length === 0 && (
          <View style={styles.emptyWrap}>
            <ClipboardList size={40} color={COLORS.black} strokeWidth={2} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>NO ORDERS IN THIS STAGE</Text>
            <Text style={styles.emptySub}>All orders in this tab have been processed.</Text>
          </View>
        )}
      </ScrollView>

      {/* Order Details & Edit Modal */}
      <Modal visible={!!selectedOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>
                ORDER #{selectedOrder?._id.slice(-6).toUpperCase()}
              </Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <X size={24} color={COLORS.black} strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TOTAL AMOUNT (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ADMIN NOTES</Text>
                <TextInput
                  style={[styles.modalInput, { height: 70 }]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Special instructions or notes"
                  multiline
                />
              </View>

              {selectedOrder?.customerPhone && (
                <View style={styles.contactRow}>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => Linking.openURL(`tel:${selectedOrder.customerPhone}`)}
                  >
                    <Phone size={16} color={COLORS.black} strokeWidth={2.5} />
                    <Text style={styles.contactBtnText}>CALL CUSTOMER</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: '#25D366' }]}
                    onPress={() =>
                      Linking.openURL(
                        `https://wa.me/${selectedOrder.customerPhone?.replace(/[^0-9]/g, '')}`
                      )
                    }
                  >
                    <MessageCircle size={16} color={COLORS.white} strokeWidth={2.5} />
                    <Text style={[styles.contactBtnText, { color: COLORS.white }]}>
                      WHATSAPP
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.saveOrderBtn}
              onPress={handleSaveDetails}
              activeOpacity={0.85}
            >
              <Text style={styles.saveOrderBtnText}>SAVE DETAILS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Assign Delivery Boy Modal */}
      <Modal visible={!!assignModalOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>ASSIGN DELIVERY STAFF</Text>
              <TouchableOpacity onPress={() => setAssignModalOrder(null)}>
                <X size={24} color={COLORS.black} strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {deliveryBoys.map((boy) => (
                <TouchableOpacity
                  key={boy._id}
                  style={styles.boySelectCard}
                  onPress={() => handleAssignBoy(assignModalOrder!._id, boy._id)}
                >
                  <View style={styles.boyAvatar}>
                    <Truck size={18} color={COLORS.black} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.boyName}>{boy.name}</Text>
                    <Text style={styles.boyPhone}>{boy.phone || boy.email}</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.black} strokeWidth={3} />
                </TouchableOpacity>
              ))}

              {deliveryBoys.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={styles.emptySub}>
                    No delivery personnel added yet. Go to Shop Settings to add delivery staff.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.mobile,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  subHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...NEO_SHADOW.box2,
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  filterTabsContainer: {
    height: 48,
    marginVertical: 4,
  },
  filterTabsWrap: {
    paddingHorizontal: SPACING.mobile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 38,
    ...NEO_SHADOW.box2,
  },
  filterPillActive: {
    backgroundColor: COLORS.black,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  filterPillTextActive: {
    color: COLORS.white,
  },
  filterCountBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountBadgeActive: {
    backgroundColor: COLORS.secondary,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  filterCountTextActive: {
    color: COLORS.black,
  },
  sortBarContainer: {
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
  },
  sortBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.mobile,
    gap: 8,
  },
  sortLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 2,
  },
  sortLabelText: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.3,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
    ...NEO_SHADOW.box2,
  },
  sortPillActive: {
    backgroundColor: COLORS.secondary,
  },
  sortPillText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: COLORS.black,
  },
  sortPillTextActive: {
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingBottom: 100,
    gap: SPACING.md,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderIdBadge: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ rotate: '-2deg' }],
  },
  orderIdText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  customerPhone: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.primary,
  },
  itemsBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 8,
    marginBottom: SPACING.sm,
  },
  itemsSummaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  cardActionsRow: {
    marginTop: 4,
  },
  actionBtn: {
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  deliveredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  deliveredTagText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  emptyWrap: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
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
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  callBtn: {
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
  contactBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  saveOrderBtn: {
    backgroundColor: COLORS.black,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    ...NEO_SHADOW.box4,
  },
  saveOrderBtnText: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.8,
  },
  boySelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: 10,
    marginBottom: 8,
    ...NEO_SHADOW.box2,
  },
  boyAvatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boyName: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  boyPhone: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
});
