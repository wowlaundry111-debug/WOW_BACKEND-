import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Building, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';

interface CustomerShopSelectProps {
  onShopSelect: (shopId: string) => void;
}

export const CustomerShopSelectScreen: React.FC<CustomerShopSelectProps> = ({ onShopSelect }) => {
  const insets = useSafeAreaInsets();
  const { shops, currentUser } = useAppStore();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 16 : SPACING.lg }]}>
        <View style={styles.profileAvatar}>
          <Text style={{ fontSize: 16 }}>👤</Text>
        </View>
        <Text style={[TYPO.headlineLg, { color: COLORS.onSurface, fontWeight: '800', marginTop: SPACING.md }]}>
          Welcome, {currentUser?.name?.split(' ')[0] || 'Guest'} 👋
        </Text>
        <Text style={[TYPO.bodyLg, { color: COLORS.onSurfaceVariant, marginTop: 4 }]}>
          Please select a branch to continue
        </Text>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {shops.map((shop) => (
          <TouchableOpacity 
            key={shop._id} 
            style={styles.shopCard} 
            activeOpacity={0.85} 
            onPress={() => onShopSelect(shop._id)}
          >
            <View style={styles.shopIconContainer}>
              <LinearGradient
                colors={['#E0F2FE', '#BAE6FD']}
                style={StyleSheet.absoluteFill}
              />
              <Building size={22} color={COLORS.primary} fill="rgba(0, 168, 232, 0.2)" />
            </View>
            
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={[TYPO.titleLg, { color: COLORS.onSurface, fontWeight: '800' }]}>{shop.name}</Text>
                
                <View style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: (shop.isOpen ?? true) ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    borderColor: (shop.isOpen ?? true) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                  }
                ]}>
                  <View style={[styles.statusDot, { backgroundColor: (shop.isOpen ?? true) ? '#10B981' : '#EF4444' }]} />
                  <Text style={[styles.statusBadgeText, { color: (shop.isOpen ?? true) ? '#10B981' : '#EF4444' }]}>
                    {(shop.isOpen ?? true) ? 'ACTIVE' : 'CLOSED'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <MapPin size={13} color={COLORS.outline} />
                <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, marginLeft: 4, fontSize: 13 }]} numberOfLines={1}>
                  {shop.branches.join(' · ')}
                </Text>
              </View>
            </View>

            <ChevronRight size={20} color={COLORS.outline} />
          </TouchableOpacity>
        ))}

        {shops.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={[TYPO.bodyLg, { color: COLORS.outline }]}>No shops available right now.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  header: {
    paddingHorizontal: SPACING.mobile,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingBottom: 40,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    ...SHADOW.ambient,
  },
  shopIconContainer: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    ...TYPO.labelXs,
    fontSize: 9,
    fontWeight: '800',
  },
});
