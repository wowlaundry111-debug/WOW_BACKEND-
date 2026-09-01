import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Layers, ClipboardList, Store, Globe } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../components/Theme';
import { ADMIN_TABS, AdminTab } from '../components/Theme';

const TAB_ICONS: Record<AdminTab, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
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
  const tabsToRender = allowedTabs 
    ? ADMIN_TABS.filter(t => allowedTabs.includes(t.key)) 
    : ADMIN_TABS;

  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {tabsToRender.map((tab) => {
        const isActive = tab.key === active;
        const IconComponent = TAB_ICONS[tab.key];
        const iconColor = isActive ? COLORS.black : '#6B7280';
        
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={styles.tab}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
              <IconComponent size={20} color={iconColor} strokeWidth={isActive ? 3 : 2.2} />
              {tab.key === 'orders' && !!ordersBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{ordersBadge}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive ? { color: COLORS.black, fontWeight: '900' } : { color: '#6B7280' },
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingTop: 8,
    paddingHorizontal: SPACING.mobile,
    borderTopWidth: 2,
    borderTopColor: COLORS.black,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...NEO_SHADOW.box2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.white,
  },
});
