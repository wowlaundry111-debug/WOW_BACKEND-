import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Building, ChevronRight, Store } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
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
      <View style={[styles.header, { paddingTop: (insets.top > 0 ? insets.top : 44) + 12 }]}>
        <View style={styles.avatarBox}>
          <Store size={22} color={COLORS.black} strokeWidth={2.5} />
        </View>
        <Text style={styles.welcomeText}>
          Welcome, {currentUser?.name?.split(' ')[0] || 'Guest'}
        </Text>
        <Text style={styles.subText}>Select a laundry branch to start ordering</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {shops.map((shop) => {
          const isOpen = shop.isOpen ?? true;
          return (
            <TouchableOpacity
              key={shop._id}
              style={styles.shopCard}
              activeOpacity={0.85}
              onPress={() => onShopSelect(shop._id)}
            >
              <View style={styles.shopIconBox}>
                <Building size={24} color={COLORS.black} strokeWidth={2.5} />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={styles.shopName}>{shop.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: isOpen ? COLORS.secondary : '#FEE2E2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isOpen ? COLORS.black : '#DC2626' },
                      ]}
                    >
                      {isOpen ? 'OPEN' : 'CLOSED'}
                    </Text>
                  </View>
                </View>

                {shop.branches && shop.branches.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <MapPin size={13} color="#4B5563" />
                    <Text style={styles.branchText} numberOfLines={1}>
                      {shop.branches.join(' · ')}
                    </Text>
                  </View>
                )}
              </View>

              <ChevronRight size={22} color={COLORS.black} strokeWidth={3} />
            </TouchableOpacity>
          );
        })}

        {shops.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No branches available at the moment.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: SPACING.mobile,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box4,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingBottom: 40,
    gap: SPACING.md,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box6,
  },
  shopIconBox: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  statusBadge: {
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
  },
  branchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 40,
    padding: SPACING.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
});
