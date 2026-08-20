/**
 * WOW Laundry — Admin Order Management Screen
 * Premium UI/UX design:
 *  • Horizontal scrollable HSL-tinted capsule filters with live counters
 *  • Beautiful order cards with left-aligned thick colored status stripes
 *  • Nested service card featuring HSL-colored vector icons
 *  • Responsive, gradient-colored dynamic action buttons
 */
import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { User, Clock, CreditCard, ChevronRight, Truck, MapPin, Printer, X, Phone, MessageCircle, Download } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { Button, StatusBadge, SurfaceCard } from '../../components/UIPack';
import { Skeleton } from '../../components/SkeletonLoaders';
import { EmptyState } from '../../components/EmptyState';
import { useAppStore } from '../../store/useAppStore';
import { downloadOrdersCsv } from '../../utils/exportCsv';
import type { Order, OrderStatus } from '../../types';

const UserIcon = User as any;
const ClockIcon = Clock as any;
const CreditCardIcon = CreditCard as any;
const ChevronRightIcon = ChevronRight as any;
const TruckIcon = Truck as any;
const PhoneIcon = Phone as any;

const FILTERS: { key: 'new' | 'washing' | 'delivery' | 'history'; label: string; statuses: OrderStatus[] }[] = [
  { key: 'new',      label: 'New Orders',      statuses: ['PLACED', 'ACCEPTED'] },
  { key: 'washing',  label: 'In Wash Cycle',   statuses: ['PICKED_UP', 'WASHING', 'IRONING'] },
  { key: 'delivery', label: 'Out for Delivery', statuses: ['PICKUP_ASSIGNED', 'OUT_FOR_DELIVERY'] },
  { key: 'history',  label: 'History',         statuses: ['DELIVERED'] },
];

const SERVICE_LABEL_FOR_CATEGORY = (catName: string) => {
  if (catName?.toLowerCase().includes('dry')) return { label: 'Premium Dry Clean', icon: '🧺', bg: 'rgba(96, 74, 192, 0.08)', color: COLORS.primary };
  if (catName?.toLowerCase().includes('bed')) return { label: 'Linen & Bedding', icon: '🛏️', bg: 'rgba(8, 104, 120, 0.08)', color: COLORS.secondary };
  return { label: 'Standard Wash & Fold', icon: '🫧', bg: 'rgba(8, 104, 120, 0.08)', color: COLORS.secondary };
};

const stripeColor = (s: OrderStatus) => {
  if (['PLACED', 'ACCEPTED'].includes(s)) return '#EF4444'; // Bright Red
  if (['PICKUP_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(s)) return COLORS.primary; // Violet
  if (['PICKED_UP', 'WASHING', 'IRONING'].includes(s)) return COLORS.secondary; // Cyan
  if (s === 'DELIVERED') return '#10B981'; // Green
  return COLORS.outline;
};

// ─── Order Card ───────────────────────────────────────────────────────────────
interface OrderCardProps {
  order: Order;
  deliveryBoys: { _id: string; name: string }[];
  onAssign: (orderId: string) => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onPress: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, deliveryBoys, onAssign, onStatusUpdate, onPress }) => {
  const { users } = useAppStore();
  const customer = users.find(u => u._id === order.customerId);
  const customerName = customer?.name || order.customerName || 'Unknown Customer';
  const customerPhone = customer?.phone || order.customerPhone || 'N/A';

  const serviceInfo = SERVICE_LABEL_FOR_CATEGORY(order.items[0]?.name ?? '');
  const itemSummary = `${order.items.length} item${order.items.length > 1 ? 's' : ''} · ${order.items.map(i => i.name).join(', ').substring(0, 32)}`;

  const handleStatusUpdate = (orderId: string, status: OrderStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStatusUpdate(orderId, status);
  };

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={styles.orderCard}>
      {/* Left status stripe */}
      <View style={[styles.stripe, { backgroundColor: stripeColor(order.status) }]} />

      <View style={styles.orderCardContent}>
        {/* Header row */}
        <View style={styles.orderCardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitials}>
                {customerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[TYPO.labelSm, { color: COLORS.outline, letterSpacing: 0.5, fontWeight: '700' }]}>
                ORDER #{order._id.slice(-6).toUpperCase()}
              </Text>
              <Text style={[TYPO.headlineSm, { color: COLORS.onSurface, marginTop: 2, fontWeight: '800' }]}>
                {customerName}
              </Text>
            </View>
          </View>
          <StatusBadge status={order.status} showDot />
        </View>

        {/* Nest Service card */}
        <View style={styles.serviceCard}>
          <View style={[styles.serviceIconBox, { backgroundColor: serviceInfo.bg }]}>
            <Text style={{ fontSize: 20 }}>{serviceInfo.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>{serviceInfo.label}</Text>
            <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, fontSize: 13, marginTop: 2 }]}>{itemSummary}</Text>
          </View>
        </View>

        {/* Customer details row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailsCell}>
            <ClockIcon size={14} color={COLORS.outline} />
            <Text style={styles.detailsText}>
              {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.detailsCell}>
            <CreditCardIcon size={14} color={COLORS.outline} />
            <Text style={styles.detailsText}>
              ₹{(order.totalAmount).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.detailsCell}>
            <PhoneIcon size={14} color={COLORS.outline} />
            <Text style={styles.detailsText}>{customerPhone}</Text>
          </View>
        </View>

        {/* Actions dynamic block */}
        <View style={styles.orderActions}>
          {order.status === 'PLACED' || order.status === 'ACCEPTED' ? (
            <>
              <Button
                label="Assign Delivery"
                onPress={() => onAssign(order._id)}
                size="md"
                style={{ flex: 1 }}
                icon={<TruckIcon size={16} color={COLORS.onPrimary} />}
              />
              <TouchableOpacity style={styles.overflowBtn} activeOpacity={0.7}>
                <Text style={{ fontSize: 20, color: COLORS.onSurfaceVariant, fontWeight: '700' }}>⋮</Text>
              </TouchableOpacity>
            </>
          ) : order.status === 'PICKED_UP' || order.status === 'WASHING' ? (
            <Button
              label="Move to Ironing"
              onPress={() => handleStatusUpdate(order._id, 'IRONING')}
              size="md"
              variant="outline"
              style={{ flex: 1 }}
            />
          ) : order.status === 'IRONING' ? (
            <Button
              label="Out for Delivery"
              onPress={() => handleStatusUpdate(order._id, 'OUT_FOR_DELIVERY')}
              size="md"
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const AdminOrdersScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'new' | 'washing' | 'delivery' | 'history'>('new');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<string | null>(null);
  
  const [editPrice, setEditPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportMonth, setSelectedExportMonth] = useState('All Time');
  
  const { 
    orders, currentTenantId, updateOrderStatus, updateOrderAdminDetails, 
    assignDeliveryBoy, users, isLoading, currentUser, fetchOrders, fetchUsers,
    storageStatus, checkStorageStatus, archiveDeliveredOrders
  } = useAppStore();

  React.useEffect(() => {
    if (currentUser?.role === 'SuperAdmin') {
      checkStorageStatus();
    }
  }, [currentUser?.role, checkStorageStatus]);

  React.useEffect(() => {
    // Live update polling for new orders
    const interval = setInterval(() => {
      fetchOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOrders(),
      fetchUsers?.()
    ]);
    setRefreshing(false);
  }, [fetchOrders, fetchUsers]);

  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  const tenantOrders = orders.filter(o => o.shopId === currentTenantId || isSuperAdmin);
  const deliveryBoys = users.filter(u => u.role === 'Delivery' && (u.shopId === currentTenantId || isSuperAdmin));

  const displayFilters = isSuperAdmin ? FILTERS.filter(f => f.key === 'history') : FILTERS;
  const currentFilter = displayFilters.find(f => f.key === activeFilter) || displayFilters[0];
  const filtered = tenantOrders.filter(o => currentFilter.statuses.includes(o.status));

  const newCount = tenantOrders.filter(o => ['PLACED', 'ACCEPTED'].includes(o.status)).length;
  const washCount = tenantOrders.filter(o => ['PICKED_UP', 'WASHING', 'IRONING'].includes(o.status)).length;
  const delCount  = tenantOrders.filter(o => ['PICKUP_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
  const histCount = tenantOrders.filter(o => ['DELIVERED'].includes(o.status)).length;

  const counts: Record<string, number> = { new: newCount, washing: washCount, delivery: delCount, history: histCount };

  const handleAssign = useCallback((orderId: string) => {
    setOrderToAssign(orderId);
    setAssignModalOpen(true);
  }, []);

  const confirmAssign = (boyId: string) => {
    if (orderToAssign) {
      assignDeliveryBoy(orderToAssign, boyId);
      setAssignModalOpen(false);
      setOrderToAssign(null);
    }
  };

  const activeTotal = tenantOrders.filter(o => o.status !== 'DELIVERED').length;

  const selectedCustomer = selectedOrder ? users.find(u => u._id === selectedOrder.customerId) : null;
  const modalCustomerName = selectedCustomer?.name || selectedOrder?.customerName || 'Unknown Customer';
  const modalCustomerPhone = selectedCustomer?.phone || selectedOrder?.customerPhone || 'N/A';
  const modalPickupAddr = selectedOrder?.pickupAddress || selectedCustomer?.address || 'N/A';
  const modalDeliveryAddr = selectedOrder?.deliveryAddress || selectedCustomer?.address || 'N/A';

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setEditPrice(order.totalAmount ? String(order.totalAmount) : '');
    setEditNotes(order.adminNotes || '');
  };

  const handleSaveAdminDetails = async () => {
    if (!selectedOrder) return;
    setIsSavingDetails(true);
    await updateOrderAdminDetails(selectedOrder._id, {
      totalAmount: editPrice ? Number(editPrice) : selectedOrder.totalAmount,
      adminNotes: editNotes
    });
    // Update local selected order state for immediate feedback
    setSelectedOrder({
      ...selectedOrder,
      totalAmount: editPrice ? Number(editPrice) : selectedOrder.totalAmount,
      adminNotes: editNotes
    });
    setIsSavingDetails(false);
  };

  const handleContactCustomer = (phone: string, method: 'call' | 'whatsapp') => {
    // Basic phone number cleaning
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (method === 'call') {
      Linking.openURL(`tel:${cleanPhone}`).catch(() => alert('Failed to open dialer'));
    } else {
      const message = `Hi ${modalCustomerName}, regarding your order #${selectedOrder?._id.toUpperCase()} with us...`;
      // For whatsapp deep link
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`).catch(() => alert('Failed to open WhatsApp. Make sure it is installed.'));
    }
  };

  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      months.add(`${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`);
    });
    return ['All Time', ...Array.from(months)];
  }, [orders]);

  const handleExport = async () => {
    let ordersToExport = orders;
    if (selectedExportMonth !== 'All Time') {
      ordersToExport = orders.filter(o => {
        const d = new Date(o.createdAt);
        return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}` === selectedExportMonth;
      });
    }
    await downloadOrdersCsv(ordersToExport, selectedExportMonth, users);
    setExportModalOpen(false);
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled"
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Header Block */}
      <View style={styles.headerBlock}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={[TYPO.headlineLg, { color: COLORS.onSurface }]}>Order Console</Text>
            <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, marginTop: 4 }]}>
              {isSuperAdmin
                ? `System-wide historical data.`
                : `Managing ${activeTotal} active orders.`}
            </Text>
          </View>
          {isSuperAdmin && (
            <TouchableOpacity 
              style={{ padding: 12, backgroundColor: COLORS.primaryContainer, borderRadius: RADIUS.full }}
              onPress={() => setExportModalOpen(true)}
            >
              <Download size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Storage Alert Banner */}
      {storageStatus?.isNearLimit && isSuperAdmin && (
        <View style={{ backgroundColor: '#FEF2F2', padding: SPACING.md, borderRadius: RADIUS.md, marginHorizontal: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#FCA5A5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[TYPO.headlineSm, { color: '#B91C1C' }]}>Storage Near Limit</Text>
              <Text style={[TYPO.bodyMd, { color: '#991B1B' }]}>
                Database contains {storageStatus.totalOrders} orders. Please download a backup and clear delivered orders to free up space.
              </Text>
            </View>
          </View>
          <Button 
            label="Download Backup & Auto-Clear DB"
            onPress={async () => {
               const ordersToExport = orders.filter(o => o.status === 'DELIVERED');
               await downloadOrdersCsv(ordersToExport, 'All Time Delivered', users);
               const result = await archiveDeliveredOrders();
               if (result.success) {
                 alert(`Successfully archived ${result.archivedCount} orders! Storage cleared.`);
               } else {
                 alert(result.message);
               }
            }}
            style={{ backgroundColor: '#DC2626' }}
          />
        </View>
      )}

      {/* Elegant scroll filter capsules */}
      <ScrollView keyboardShouldPersistTaps="handled"
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ marginBottom: SPACING.lg }}
      >
        {displayFilters.map((f) => {
          const isActive = f.key === currentFilter.key;
          const count = counts[f.key];
          
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[
                styles.filterPill,
                isActive && styles.filterPillActive,
                !isActive && count > 0 && { backgroundColor: 'rgba(96, 74, 192, 0.04)' },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  TYPO.labelLg,
                  { color: isActive ? COLORS.onPrimary : COLORS.onSurfaceVariant },
                  isActive && { fontWeight: '700' },
                ]}
              >
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[styles.countBadge, { backgroundColor: isActive ? COLORS.onPrimary : COLORS.primaryContainer }]}>
                  <Text style={[TYPO.labelXs, { color: isActive ? COLORS.primary : COLORS.onPrimaryContainer, fontWeight: '700' }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Orders List */}
      <View style={styles.ordersList}>
        {isLoading ? (
          <>
             <Skeleton width="100%" height={150} borderRadius={RADIUS.xl} style={{ marginBottom: SPACING.md }} />
             <Skeleton width="100%" height={150} borderRadius={RADIUS.xl} style={{ marginBottom: SPACING.md }} />
             <Skeleton width="100%" height={150} borderRadius={RADIUS.xl} />
          </>
        ) : filtered.length > 0 ? (
          filtered.map(order => (
            <OrderCard
              key={order._id}
              order={order}
              deliveryBoys={deliveryBoys}
              onAssign={handleAssign}
              onStatusUpdate={updateOrderStatus}
              onPress={() => handleOpenModal(order)}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 44 }}>🎉</Text>
            <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, marginTop: SPACING.md }]}>
              Queue is Clear
            </Text>
            <Text style={[TYPO.bodyMd, { color: COLORS.outline, textAlign: 'center', marginTop: 4 }]}>
              There are no orders currently pending in this filter channel.
            </Text>
          </View>
        )}
      </View>

      {/* Order Details Modal */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[TYPO.headlineMd, { color: COLORS.onSurface }]}>Order Details</Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <TouchableOpacity onPress={() => {
                  if (Platform.OS === 'web') {
                    window.print();
                  }
                }}>
                  <Printer size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                  <X size={24} color={COLORS.outline} />
                </TouchableOpacity>
              </View>
            </View>
            
            {selectedOrder && (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}>
                {/* Header info */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg }}>
                  <View>
                    <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>Order ID</Text>
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurface, fontWeight: '700' }]}>{selectedOrder._id}</Text>
                    
                    <Text style={[TYPO.labelSm, { color: COLORS.outline, marginTop: 12 }]}>Date & Time</Text>
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>
                      {new Date(selectedOrder.createdAt).toLocaleDateString()} at {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>

                    {selectedOrder.pickupTime && (
                      <>
                        <Text style={[TYPO.labelSm, { color: COLORS.outline, marginTop: 12 }]}>Pickup Slot</Text>
                        <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>{selectedOrder.pickupTime}</Text>
                      </>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>Status</Text>
                    <Text style={[TYPO.bodyMd, { color: stripeColor(selectedOrder.status), fontWeight: '800' }]}>{selectedOrder.status}</Text>
                  </View>
                </View>
                
                {/* Customer info */}
                <View style={styles.modalSection}>
                  <Text style={[TYPO.labelLg, { color: COLORS.onSurface, marginBottom: SPACING.sm }]}>Customer Info</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <User color={COLORS.outline} size={16} />
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, marginLeft: 8 }]}>{modalCustomerName}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Phone color={COLORS.outline} size={16} />
                      <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, marginLeft: 8 }]}>{modalCustomerPhone}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity 
                        style={[styles.contactBtn, { backgroundColor: '#25D366' }]} 
                        onPress={() => handleContactCustomer(modalCustomerPhone, 'whatsapp')}
                      >
                        <MessageCircle size={14} color="#FFF" />
                        <Text style={[TYPO.labelSm, { color: '#FFF', marginLeft: 4 }]}>WhatsApp</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.contactBtn, { backgroundColor: COLORS.primary }]} 
                        onPress={() => handleContactCustomer(modalCustomerPhone, 'call')}
                      >
                        <Phone size={14} color="#FFF" />
                        <Text style={[TYPO.labelSm, { color: '#FFF', marginLeft: 4 }]}>Call</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Addresses */}
                <View style={styles.modalSection}>
                  <Text style={[TYPO.labelLg, { color: COLORS.onSurface, marginBottom: SPACING.sm }]}>Addresses</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                    <MapPin color={COLORS.primary} size={16} style={{ marginTop: 2 }} />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>Pickup Address</Text>
                      <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>{modalPickupAddr}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <MapPin color={COLORS.secondary} size={16} style={{ marginTop: 2 }} />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>Delivery Address</Text>
                      <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>{modalDeliveryAddr}</Text>
                    </View>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.modalSection}>
                  <Text style={[TYPO.labelLg, { color: COLORS.onSurface, marginBottom: SPACING.sm }]}>Items ({selectedOrder.items.length})</Text>
                  {selectedOrder.items.map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, flex: 1 }]}>{item.quantity}x {item.name}</Text>
                      <Text style={[TYPO.bodyMd, { color: COLORS.onSurface, fontWeight: '600' }]}>₹{item.price * item.quantity}</Text>
                    </View>
                  ))}
                  
                  {selectedOrder.washPreferences && selectedOrder.washPreferences.length > 0 && (
                    <View style={{ marginTop: SPACING.sm }}>
                      <Text style={[TYPO.labelSm, { color: COLORS.outline, marginBottom: 4 }]}>Wash Preferences</Text>
                      {selectedOrder.washPreferences.map((wp: any, idx: number) => (
                        <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>{wp.name}</Text>
                          <Text style={[TYPO.bodyMd, { color: COLORS.onSurface, fontWeight: '600' }]}>₹{wp.price}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={{ height: 1, backgroundColor: COLORS.surfaceContainerHigh, marginVertical: SPACING.sm }} />
                  
                  {/* Bill Breakdown */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>Item Subtotal</Text>
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurface }]}>₹{selectedOrder.items.reduce((s: any, i: any) => s + i.price * i.quantity, 0)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>Taxes</Text>
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurface }]}>₹{selectedOrder.taxAmount !== undefined ? selectedOrder.taxAmount.toFixed(2) : (selectedOrder.items.reduce((s: any, i: any) => s + i.price * i.quantity, 0) * 0.05).toFixed(2)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>Delivery Fee</Text>
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurface }]}>₹{selectedOrder.deliveryFee !== undefined ? selectedOrder.deliveryFee : 49}</Text>
                  </View>
                  {(selectedOrder as any).discountAmount ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={[TYPO.bodyMd, { color: '#10B981' }]}>Discount Applied</Text>
                      <Text style={[TYPO.bodyMd, { color: '#10B981' }]}>- ₹{(selectedOrder as any).discountAmount}</Text>
                    </View>
                  ) : null}

                  <View style={{ height: 1, backgroundColor: COLORS.surfaceContainerHigh, marginVertical: SPACING.sm }} />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>Total Amount</Text>
                    <Text style={[TYPO.headlineSm, { color: COLORS.primary }]}>₹{selectedOrder.totalAmount.toFixed(2)}</Text>
                  </View>
                  {selectedOrder.paymentMode && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm }}>
                      <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>Payment Mode</Text>
                      <Text style={[TYPO.labelLg, { color: COLORS.primary, fontWeight: '700' }]}>{selectedOrder.paymentMode}</Text>
                    </View>
                  )}
                </View>

                {/* Wash Cycle Editing */}
                {(selectedOrder.status === 'WASHING' || selectedOrder.status === 'PICKED_UP' || selectedOrder.status === 'IRONING') && (
                  <View style={styles.modalSection}>
                    <Text style={[TYPO.labelLg, { color: COLORS.onSurface, marginBottom: SPACING.sm }]}>Update Details (In Wash)</Text>
                    <Text style={[TYPO.bodyMd, { color: COLORS.outline, marginBottom: SPACING.md }]}>
                      Adjust the final price or add administrative notes while the order is in process.
                    </Text>
                    
                    <View style={{ marginBottom: SPACING.md }}>
                      <Text style={[TYPO.labelSm, { color: COLORS.onSurfaceVariant, marginBottom: 4 }]}>Total Amount (₹)</Text>
                      <TextInput
                        style={styles.input}
                        value={editPrice}
                        onChangeText={setEditPrice}
                        keyboardType="numeric"
                        placeholder="Enter new price"
                        placeholderTextColor={COLORS.outlineVariant}
                      />
                    </View>

                    <View style={{ marginBottom: SPACING.lg }}>
                      <Text style={[TYPO.labelSm, { color: COLORS.onSurfaceVariant, marginBottom: 4 }]}>Admin Notes / Description</Text>
                      <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        value={editNotes}
                        onChangeText={setEditNotes}
                        multiline
                        placeholder="Additional details..."
                        placeholderTextColor={COLORS.outlineVariant}
                      />
                    </View>

                    <Button 
                      label={isSavingDetails ? "Saving..." : "Save Details"} 
                      onPress={handleSaveAdminDetails} 
                      disabled={isSavingDetails}
                    />
                  </View>
                )}
                
                {/* Readonly Admin Notes for other statuses */}
                {(selectedOrder.status === 'OUT_FOR_DELIVERY' || selectedOrder.status === 'DELIVERED') && selectedOrder.adminNotes ? (
                  <View style={styles.modalSection}>
                    <Text style={[TYPO.labelLg, { color: COLORS.onSurface, marginBottom: SPACING.sm }]}>Admin Notes</Text>
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>{selectedOrder.adminNotes}</Text>
                  </View>
                ) : null}

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Assign Delivery Boy Modal */}
      <Modal visible={assignModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: 'auto', maxHeight: '70%', paddingBottom: SPACING.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={[TYPO.headlineMd, { color: COLORS.onSurface }]}>Select Delivery Boy</Text>
              <TouchableOpacity onPress={() => setAssignModalOpen(false)}>
                <X size={24} color={COLORS.outline} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.lg }}>
              {deliveryBoys.length > 0 ? (
                deliveryBoys.map((boy) => (
                  <TouchableOpacity
                    key={boy._id}
                    onPress={() => confirmAssign(boy._id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: SPACING.md,
                      backgroundColor: COLORS.surfaceContainerLow,
                      borderRadius: RADIUS.md,
                      marginBottom: SPACING.sm,
                      borderWidth: 1,
                      borderColor: COLORS.surfaceContainerHigh
                    }}
                  >
                    <TruckIcon size={20} color={COLORS.primary} style={{ marginRight: SPACING.md }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>{boy.name}</Text>
                      <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>{boy.email}</Text>
                    </View>
                    <ChevronRightIcon size={16} color={COLORS.outline} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[TYPO.bodyMd, { color: COLORS.outline, textAlign: 'center', padding: SPACING.lg }]}>
                  No delivery boys found for this shop. Please add them in Shop Settings.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Export CSV Modal */}
      <Modal visible={exportModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[TYPO.headlineSm, { color: COLORS.onSurface }]}>Export Orders (CSV)</Text>
              <TouchableOpacity onPress={() => setExportModalOpen(false)}>
                <X size={24} color={COLORS.outline} />
              </TouchableOpacity>
            </View>
            
            <Text style={[TYPO.bodyMd, { color: COLORS.outline, marginBottom: SPACING.md }]}>
              Select the month of data you want to download.
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {availableMonths.map(month => (
                <TouchableOpacity 
                  key={month} 
                  onPress={() => setSelectedExportMonth(month)}
                  style={{
                    padding: SPACING.md,
                    borderRadius: RADIUS.md,
                    backgroundColor: selectedExportMonth === month ? COLORS.primaryContainer : COLORS.surfaceContainerLowest,
                    marginBottom: SPACING.sm,
                    borderWidth: 1,
                    borderColor: selectedExportMonth === month ? COLORS.primary : COLORS.surfaceContainer
                  }}
                >
                  <Text style={[TYPO.labelLg, { color: selectedExportMonth === month ? COLORS.primary : COLORS.onSurface, fontWeight: selectedExportMonth === month ? '800' : '600' }]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button
              label={`Download ${selectedExportMonth}`}
              onPress={handleExport}
              style={{ marginTop: SPACING.lg }}
              variant="primary"
            />
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingTop: SPACING.lg,
    paddingBottom: 140,
  },
  headerBlock: {
    marginBottom: SPACING.lg,
  },
  filterRow: {
    gap: SPACING.xs,
    paddingRight: SPACING.mobile,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    gap: 8,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOW.glow(COLORS.primary),
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordersList: {
    gap: SPACING.gutter,
  },
  orderCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  stripe: {
    width: 6,
  },
  orderCardContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    marginBottom: SPACING.md,
  },
  serviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.ambient,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingHorizontal: 2,
  },
  detailsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsText: {
    ...TYPO.labelSm,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  orderActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  overflowBtn: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: SPACING.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height: '80%',
    ...SHADOW.ambient,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },
  modalSection: {
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    ...SHADOW.ambient,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    color: COLORS.onSurface,
    ...TYPO.bodyMd,
  },
});
