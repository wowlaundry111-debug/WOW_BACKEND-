import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Layers, ClipboardList, Store, Globe } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO } from '../components/Theme';
import { ADMIN_TABS, AdminTab } from '../components/Theme';

// Map of tab keys to Lucide icon components
const TAB_ICONS: Record<AdminTab, React.ComponentType<{ size: number; color: string }>> = {
  dashboard: LayoutDashboard,
  catalog:   Layers,
  orders:    ClipboardList,
  shop:      Store,
  global:    Globe,
};

interface AdminNavBarProps {
  active: AdminTab;
  onSelect: (tab: AdminTab) => void;
  ordersBadge?: number;
  allowedTabs?: AdminTab[];
}

export const AdminNavBar: React.FC<AdminNavBarProps> = ({ active, onSelect, ordersBadge, allowedTabs }) => {
  const insets = useSafeAreaInsets();
  const webBlurStyle: any = {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  const tabsToRender = allowedTabs 
    ? ADMIN_TABS.filter(t => allowedTabs.includes(t.key)) 
    : ADMIN_TABS;

  const bottomPadding = insets.bottom > 0 ? insets.bottom : 10;

  return (
    <View style={[styles.container, webBlurStyle, { paddingBottom: bottomPadding }]}>
      {tabsToRender.map((tab) => {
        const isActive = tab.key === active;
        const IconComponent = TAB_ICONS[tab.key];
        const iconColor = isActive ? COLORS.primary : COLORS.outline;
        
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              {isActive && (
                <View style={[styles.activeGlow, { backgroundColor: COLORS.primary }]} />
              )}
              <IconComponent size={24} color={iconColor} />
              {tab.key === 'orders' && !!ordersBadge && (
                <View style={styles.badge} />
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive ? { color: COLORS.primary, fontWeight: '700' } : { color: COLORS.outline },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingHorizontal: SPACING.mobile,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    boxShadow: '0px -10px 30px rgba(0, 0, 0, 0.04)' as any,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // smooth transition on Web
  } as any,
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.15,
    filter: 'blur(8px)' as any,
  },
  tabLabel: {
    ...TYPO.labelSm,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
