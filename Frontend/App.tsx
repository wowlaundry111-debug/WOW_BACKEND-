/**
 * WOW Laundry — App Entry Point
 * Bootstraps Zustand store, renders the correct portal based on current role.
 * Includes a floating Role-Switcher FAB for development previewing.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { useAppStore } from './src/store/useAppStore';
import { AdminPortal } from './src/screens/admin/AdminPortal';
import { CustomerPortal } from './src/screens/customer/CustomerPortal';
import { DeliveryPortal } from './src/screens/delivery/DeliveryPortal';
import { AuthScreen } from './src/screens/auth/AuthScreen';
import { SplashScreen } from './src/screens/auth/SplashScreen';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from './src/components/Theme';
import type { Role } from './src/components/Theme';

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLES: { key: Role; emoji: string; label: string; desc: string; color: string }[] = [
  { key: 'ShopAdmin',   emoji: '🏪', label: 'Shop Admin',    desc: 'Manage your laundry shop',   color: COLORS.primary },
  { key: 'Customer',    emoji: '👕', label: 'Customer',      desc: 'Browse & place orders',      color: COLORS.secondary },
  { key: 'Delivery',    emoji: '🚚', label: 'Delivery Boy',  desc: 'Manage deliveries',          color: '#10B981' },
  { key: 'SuperAdmin',  emoji: '👑', label: 'Super Admin',   desc: 'Platform oversight',         color: '#F59E0B' },
];

// ─── Switcher Modal ───────────────────────────────────────────────────────────
interface SwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

const SwitcherModal: React.FC<SwitcherModalProps> = ({ visible, onClose }) => {
  const { currentRole, currentTenantId, setCurrentRole, setCurrentTenantId, shops } = useAppStore();

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.switcherOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.switcherSheet}>
        {/* Handle */}
        <View style={styles.sheetHandle} />
        <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, marginBottom: 4 }]}>
          🧪 Dev Role Switcher
        </Text>
        <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, marginBottom: SPACING.lg }]}>
          Preview any role and tenant instantly
        </Text>

        {/* Role options */}
        <Text style={[TYPO.labelSm, { color: COLORS.outline, textTransform: 'uppercase', marginBottom: SPACING.sm }]}>
          User Role
        </Text>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.switcherRow, currentRole === r.key && { backgroundColor: `${r.color}18` }]}
            onPress={() => { setCurrentRole(r.key); }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>{r.label}</Text>
              <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>{r.desc}</Text>
            </View>
            {currentRole === r.key && (
              <View style={[styles.activeDot, { backgroundColor: r.color }]} />
            )}
          </TouchableOpacity>
        ))}

        {/* Tenant options */}
        <Text style={[TYPO.labelSm, { color: COLORS.outline, textTransform: 'uppercase', marginTop: SPACING.md, marginBottom: SPACING.sm }]}>
          Active Tenant (Shop)
        </Text>
        {shops.map((s) => (
          <TouchableOpacity
            key={s._id}
            style={[styles.switcherRow, currentTenantId === s._id && { backgroundColor: `${COLORS.primary}12` }]}
            onPress={() => setCurrentTenantId(s._id)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>🏬</Text>
            <Text style={[TYPO.labelLg, { color: COLORS.onSurface, flex: 1 }]}>{s.name}</Text>
            {currentTenantId === s._id && (
              <View style={[styles.activeDot, { backgroundColor: COLORS.primary }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
};

import { usePushNotifications } from './src/hooks/usePushNotifications';
import { useNotificationStore } from './src/store/useNotificationStore';
import { SocketManager } from './src/components/SocketManager';

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const { currentRole, currentUser, initializeAppData, isLoading } = useAppStore();

  usePushNotifications(); // Automatically registers for push notifications if logged in

  useEffect(() => {
    initializeAppData();
    // Purge any notifications older than 48 hours
    useNotificationStore.getState().clearOldNotifications();
  }, [initializeAppData]);

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  // Show animated splash until fonts are loaded AND splash animation has played
  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  const renderCurrentPortal = () => {
    if (!currentUser) {
      return <AuthScreen />;
    }

    switch (currentRole) {
      case 'ShopAdmin':  return <AdminPortal />;
      case 'SuperAdmin': return <AdminPortal />; // Will show super-admin variant later
      case 'Customer':   return <CustomerPortal />;
      case 'Delivery':   return <DeliveryPortal />;
    }
  };

  return (
    <SafeAreaProvider>
      <SocketManager />
      <View style={styles.root}>
        <ExpoStatusBar style="dark" />
        {renderCurrentPortal()}

        {/* Dev Role Switcher FAB - Hidden for production UI */}
        {/* <TouchableOpacity style={styles.devFab} onPress={() => setSwitcherOpen(true)} activeOpacity={0.85}>
          <Text style={styles.devFabText}>⇄</Text>
        </TouchableOpacity>
        <SwitcherModal visible={switcherOpen} onClose={() => setSwitcherOpen(false)} /> */}
      </View>
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.mobile,
  },
  devFab: {
    position: 'absolute',
    bottom: 88,
    left: SPACING.mobile,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.inverseSurface,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.80,
    boxShadow: '0px 4px 8px rgba(0,0,0,0.2)' as any,
    elevation: 8,
  },
  devFabText: {
    fontSize: 20,
    color: COLORS.inverseOnSurface,
  },
  switcherOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  switcherSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
    paddingBottom: 48,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.outlineVariant,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  switcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
