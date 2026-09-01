import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from './Theme';
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
  onShopPress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top > 0 ? insets.top + 6 : 12 }]}>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{adminInitials}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shopNamePill} activeOpacity={0.8} onPress={onShopPress}>
        <Text style={styles.shopNameText} numberOfLines={1}>
          {shopName}
        </Text>
        <ChevronDown size={16} color={COLORS.black} strokeWidth={3} />
      </TouchableOpacity>

      <NotificationBell />
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.mobile,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  shopNamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    maxWidth: 220,
    ...NEO_SHADOW.box2,
  },
  shopNameText: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
});
