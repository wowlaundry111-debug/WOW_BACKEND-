/**
 * WOW Laundry — Admin Portal Wrapper
 * Wires all 4 admin screens under the shared top bar and bottom nav.
 */
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminTopBar } from '../../components/AdminTopBar';
import { AdminNavBar } from '../../components/AdminNavBar';
import { AdminDashboardScreen } from './AdminDashboard';
import { AdminOrdersScreen } from './AdminOrders';
import { AdminCatalogScreen } from './AdminCatalog';
import { AdminShopScreen } from './AdminShop';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { useAppStore } from '../../store/useAppStore';
import { AdminTab, COLORS, TYPO, SPACING, RADIUS } from '../../components/Theme';

export const AdminPortal: React.FC = () => {
  const { currentUser, shops, currentTenantId, orders, setCurrentTenantId } = useAppStore();
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  const [activeTab, setActiveTab] = useState<AdminTab>(isSuperAdmin && !currentTenantId ? 'global' : (isSuperAdmin ? 'global' : 'dashboard'));
  const [showShopSwitcher, setShowShopSwitcher] = useState(false);

  React.useEffect(() => {
    if (isSuperAdmin && !currentTenantId) {
      setActiveTab('global');
    }
  }, [isSuperAdmin, currentTenantId]);

  const shop = shops.find(s => s._id === currentTenantId);
  const newOrdersCount = orders.filter(
    o => o.shopId === currentTenantId && ['PLACED', 'ACCEPTED'].includes(o.status)
  ).length;

  const initials = (currentUser?.name ?? 'Admin')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const renderScreen = () => {
    switch (activeTab) {
      case 'global':    return (isSuperAdmin && currentTenantId) ? <AdminDashboardScreen /> : <SuperAdminDashboard />;
      case 'dashboard': return <AdminDashboardScreen />;
      case 'catalog':   return <AdminCatalogScreen />;
      case 'orders':    return <AdminOrdersScreen />;
      case 'shop':      return <AdminShopScreen />;
    }
  };

  const allowedTabs: AdminTab[] = isSuperAdmin 
    ? ['global', 'catalog', 'orders', 'shop']
    : ['dashboard', 'catalog', 'orders', 'shop'];

  return (
    <View style={styles.root}>
      <AdminTopBar
        shopName={isSuperAdmin && !currentTenantId ? '👑 Super Admin (All Shops)' : (shop?.name ?? 'WOW Laundry')}
        adminInitials={initials}
        onAvatarPress={() => setActiveTab('shop')}
        onShopPress={() => isSuperAdmin ? setShowShopSwitcher(true) : null}
      />
      
      {showShopSwitcher && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[TYPO.headlineMd, { marginBottom: SPACING.md }]}>Switch Shop Context</Text>
            {shops.map(s => (
              <TouchableOpacity
                key={s._id}
                style={[styles.shopSelectBtn, s._id === currentTenantId && styles.shopSelectBtnActive]}
                onPress={() => {
                  setCurrentTenantId(s._id);
                  setShowShopSwitcher(false);
                }}
              >
                <Text style={[TYPO.labelLg, s._id === currentTenantId && { color: COLORS.primary }]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={[styles.shopSelectBtn, { marginTop: SPACING.md, alignItems: 'center', backgroundColor: '#18181B' }]} 
              onPress={() => {
                setCurrentTenantId('');
                setActiveTab('global');
                setShowShopSwitcher(false);
              }}
            >
              <Text style={[TYPO.labelLg, { color: '#FFFFFF' }]}>Return to Global View</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.shopSelectBtn, { marginTop: SPACING.sm, alignItems: 'center', backgroundColor: COLORS.surfaceContainerHighest }]} 
              onPress={() => setShowShopSwitcher(false)}
            >
              <Text style={TYPO.labelLg}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.content}>
        {renderScreen()}
      </View>
      <AdminNavBar
        active={activeTab}
        onSelect={setActiveTab}
        ordersBadge={newOrdersCount}
        allowedTabs={allowedTabs}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    width: '100%',
    maxWidth: 400,
  },
  shopSelectBtn: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  shopSelectBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
});
