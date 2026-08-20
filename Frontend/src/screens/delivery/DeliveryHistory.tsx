import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Clock, CheckCircle2, History } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { EmptyState } from '../../components/EmptyState';

export const DeliveryHistoryScreen = () => {
  const { orders, users, currentUser } = useAppStore();

  // Filter for completed (DELIVERED) orders assigned to this delivery boy
  const completedOrders = orders.filter(
    o => o.status === 'DELIVERED' && o.deliveryBoyId === currentUser?._id
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, fontWeight: '800' }]}>
          Past Orders
        </Text>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {completedOrders.length === 0 ? (
          <EmptyState 
            icon={History} 
            title="No History Yet" 
            subtitle="Your completed deliveries will appear here." 
          />
        ) : (
          completedOrders.map(order => {
            const customer = users.find(u => u._id === order.customerId);
            const customerName = customer?.name || order.customerName || 'Unknown Customer';

            return (
              <View key={order._id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '700' }]}>{customerName}</Text>
                    <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>Order #{order._id.split('_')[1]}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 4 }} />
                    <Text style={[TYPO.labelSm, { color: '#10B981', fontWeight: '800' }]}>DELIVERED</Text>
                  </View>
                </View>

                <View style={styles.addressBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPO.labelSm, { color: COLORS.outline, marginBottom: 2 }]}>Delivered to</Text>
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]} numberOfLines={2}>
                      {order.deliveryAddress || customer?.address || 'No Address Provided'}
                    </Text>
                  </View>
                </View>

                <View style={styles.footer}>
                  <Text style={[TYPO.labelSm, { color: COLORS.onSurfaceVariant }]}>
                    {order.items.reduce((sum, i) => sum + i.quantity, 0)} items delivered
                  </Text>
                  <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '800' }]}>
                    ₹{order.totalAmount}
                  </Text>
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
    backgroundColor: '#F3F4F6',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainer,
    paddingTop: SPACING.sm,
  },
});
