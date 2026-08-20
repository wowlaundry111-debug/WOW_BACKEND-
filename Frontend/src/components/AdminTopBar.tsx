import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, ChevronDown, Bell } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO } from './Theme';
import { NotificationBell } from './NotificationBell';

interface AdminTopBarProps {
  shopName?: string;
  adminInitials?: string;
  onAvatarPress?: () => void;
  onMenuPress?: () => void;
  onShopPress?: () => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  shopName = 'WOW Laundry',
  adminInitials = 'AD',
  onAvatarPress,
  onMenuPress,
  onShopPress,
}) => {
  const insets = useSafeAreaInsets();
  const webBlurStyle: any = {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  const ChevronDownIcon = ChevronDown as any;

  return (
    <View style={[styles.bar, webBlurStyle, { paddingTop: insets.top, height: 70 + insets.top }]}>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
        <View style={styles.avatar}>
          <Text style={[TYPO.labelLg, { color: COLORS.onPrimaryContainer, fontWeight: '800' }]}>
            {adminInitials}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shopNamePill} activeOpacity={0.7} onPress={onShopPress}>
        <Text style={[TYPO.labelLg, { color: COLORS.primary, fontWeight: '800' }]}>
          {shopName}
        </Text>
        <ChevronDownIcon size={16} color={COLORS.primary} strokeWidth={3} />
      </TouchableOpacity>

      <NotificationBell />
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.mobile,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
    boxShadow: '0px 10px 30px rgba(124, 58, 237, 0.05)' as any,
  },
  shopNamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' as any,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3269',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 6px 16px -4px ${COLORS.primary}40` as any,
  },
});
