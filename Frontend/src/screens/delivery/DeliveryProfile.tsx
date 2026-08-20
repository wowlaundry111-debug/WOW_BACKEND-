import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LogOut, User, Truck, IndianRupee, ShieldCheck } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';

export const DeliveryProfileScreen = () => {
  const { currentUser, setCurrentUser, orders } = useAppStore();

  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => o.deliveryBoyId === currentUser?._id && o.status === 'DELIVERED' && new Date(o.updatedAt).toDateString() === todayStr
  );
  const deliveriesDone = todayOrders.length;
  // Sum up the actual delivery fees from the orders
  const todaysEarnings = todayOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={styles.root} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <User size={32} color="#10B981" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, fontWeight: '800' }]}>{currentUser?.name}</Text>
          <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, marginTop: 2 }]}>{currentUser?.email}</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>Today's Earnings</Text>
          <Text style={[TYPO.headlineMd, { color: '#10B981', fontWeight: '800', marginTop: 4 }]}>₹ {todaysEarnings}</Text>
        </View>
        <View style={styles.dividerVertical} />
        <View style={styles.statCol}>
          <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>Deliveries Done</Text>
          <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, fontWeight: '800', marginTop: 4 }]}>{deliveriesDone}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => setCurrentUser(null)}>
        <LogOut size={20} color={COLORS.error} />
        <Text style={[TYPO.labelLg, { color: COLORS.error, marginLeft: 8, fontWeight: '700' }]}>Logout / End Shift</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingTop: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOW.ambient,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  listCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    ...SHADOW.ambient,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
    marginLeft: 48,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    marginBottom: 40,
  },
});
