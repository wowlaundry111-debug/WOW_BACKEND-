import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Search, Sparkles, Leaf, Shirt, Package } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { ItemSkeleton } from '../../components/SkeletonLoaders';

interface CustomerShopProps {
  categoryId: string | null;
  onBack: () => void;
  onOpenCart: () => void;
  onSelectCategory?: (id: string) => void;
}

export const CustomerShopScreen: React.FC<CustomerShopProps> = ({ categoryId, onBack, onOpenCart, onSelectCategory }) => {
  const insets = useSafeAreaInsets();
  const { categories, items, cart, addToCart, isLoading, currentTenantId, shops, fetchCatalog } = useAppStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchCatalog();
    setRefreshing(false);
  }, [fetchCatalog]);
  
  const shop = shops.find(s => s._id === currentTenantId);
  const isClosed = shop?.isOpen === false;
  
  const tenantCats = categories.filter(c => c.shopId === currentTenantId);
  const category = tenantCats.find(c => c._id === categoryId);
  
  // Filter by category and search
  const catItems = items.filter(i => 
    i.categoryId === categoryId && 
    (searchQuery === '' || i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getQuantity = (itemId: string) => {
    return cart.find(c => c.itemId === itemId)?.quantity || 0;
  };

  const handleAddToCart = (item: any, diff: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart(item, diff);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : SPACING.md }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, flex: 1, textAlign: 'center', fontWeight: '800', marginRight: 40 }]}>
          {category?.name || 'Shop'}
        </Text>
      </View>

      {isClosed && (
        <View style={styles.closedBanner}>
          <Text style={[TYPO.labelMd, { color: COLORS.onErrorContainer, fontWeight: '700', textAlign: 'center' }]}>
            ⚠️ Operational Notice: This branch is currently CLOSED. Checkouts are disabled.
          </Text>
        </View>
      )}

      {/* Sticky Category Tabs */}
      <View style={{ backgroundColor: COLORS.surfaceContainerLowest, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainer }}>
        <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.mobile, paddingVertical: SPACING.sm, gap: SPACING.sm }}>
          {tenantCats.map(cat => {
            const isActive = cat._id === categoryId;
            return (
              <TouchableOpacity 
                key={cat._id} 
                onPress={() => onSelectCategory?.(cat._id)}
                style={[styles.catTab, isActive && styles.catTabActive]}
              >
                <Text style={[TYPO.labelLg, { color: isActive ? COLORS.onPrimary : COLORS.onSurfaceVariant, fontWeight: isActive ? '800' : '600' }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <Search size={18} color={COLORS.outline} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search items in this category..."
            placeholderTextColor={COLORS.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {isLoading ? (
          <>
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
          </>
        ) : (
          catItems.map(item => {
            const qty = getQuantity(item._id);
            const price = item.pricePerKg || item.pricePerItem || 0;
            const unit = item.pricePerKg ? 'KG' : 'Item';

            return (
              <View key={item._id} style={styles.itemCard}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, { backgroundColor: 'rgba(0, 168, 232, 0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0, 168, 232, 0.12)' }]}>
                    {category?.name?.includes('Dry') ? (
                      <Package size={26} color={COLORS.primary} fill="rgba(0, 168, 232, 0.12)" />
                    ) : (
                      <Shirt size={26} color={COLORS.primary} fill="rgba(0, 168, 232, 0.12)" />
                    )}
                  </View>
                )}
                
                <View style={styles.itemInfo}>
                  <Text style={[TYPO.titleLg, { color: COLORS.onSurface, fontWeight: '800' }]}>{item.name}</Text>
                  {item.description && (
                    <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, fontSize: 12, marginTop: 2 }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  
                  {/* Premium Micro Tags */}
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <View style={[styles.microTag, { backgroundColor: 'rgba(8, 104, 120, 0.05)' }]}>
                      <Sparkles size={10} color={COLORS.secondary} />
                      <Text style={[styles.microTagText, { color: COLORS.secondary }]}>Gentle Care</Text>
                    </View>
                    <View style={[styles.microTag, { backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                      <Leaf size={10} color="#10B981" />
                      <Text style={[styles.microTagText, { color: '#10B981' }]}>Eco Safe</Text>
                    </View>
                  </View>

                  <Text style={[TYPO.labelLg, { color: COLORS.primary, marginTop: 8, fontWeight: '800' }]}>
                    ₹{price} / {unit}
                  </Text>
                </View>

                <View style={styles.actionWrap}>
                  {qty > 0 ? (
                    <View style={styles.counterBox}>
                      <TouchableOpacity style={styles.counterBtn} onPress={() => handleAddToCart(item, -1)}>
                        <Text style={styles.counterBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={[TYPO.labelLg, { color: COLORS.onPrimary, fontWeight: '900', marginHorizontal: 8 }]}>{qty}</Text>
                      <TouchableOpacity style={styles.counterBtn} onPress={() => handleAddToCart(item, 1)}>
                        <Text style={styles.counterBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(item, 1)} activeOpacity={0.8}>
                      <Text style={styles.addBtnText}>ADD</Text>
                      <Text style={styles.addBtnPlus}>+</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <View style={styles.floatingCartWrap}>
          <TouchableOpacity style={styles.floatingCart} activeOpacity={0.9} onPress={onOpenCart}>
            <View>
              <Text style={[TYPO.labelSm, { color: 'rgba(255,255,255,0.8)' }]}>{cart.length} ITEM{cart.length > 1 ? 'S' : ''}</Text>
              <Text style={[TYPO.headlineMd, { color: COLORS.onPrimary, fontWeight: '800' }]}>
                ₹{cart.reduce((sum, c) => sum + c.price * c.quantity, 0)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[TYPO.labelLg, { color: COLORS.onPrimary, marginRight: 8, fontWeight: '700' }]}>View Cart</Text>
              <View style={styles.cartChevronBox}>
                <ChevronDown size={16} color={COLORS.primary} style={{ transform: [{ rotate: '-90deg' }] }} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.mobile,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingBottom: 120,
  },
  catTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOW.glow(COLORS.primary),
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.mobile,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPO.bodyLg,
    color: COLORS.onSurface,
    outlineWidth: 0,
  } as any,
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    ...SHADOW.ambient,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    marginRight: SPACING.md,
  },
  itemInfo: {
    flex: 1,
  },
  richTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(8, 104, 120, 0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  actionWrap: {
    width: 80,
    alignItems: 'center',
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...SHADOW.glow(COLORS.primary),
  },
  addBtnText: {
    ...TYPO.labelLg,
    color: COLORS.primary,
    fontWeight: '900',
  },
  addBtnPlus: {
    ...TYPO.labelSm,
    color: COLORS.primary,
    fontWeight: '900',
    position: 'absolute',
    top: 2,
    right: 4,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 6,
    paddingVertical: 5,
    ...SHADOW.glow(COLORS.primary),
  },
  microTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  microTagText: {
    ...TYPO.labelXs,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 3,
  },
  counterBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: COLORS.onPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  floatingCartWrap: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.mobile,
    right: SPACING.mobile,
  },
  floatingCart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOW.glow(COLORS.primary),
  },
  cartChevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBanner: {
    backgroundColor: COLORS.errorContainer,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.mobile,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 38, 38, 0.15)',
  },
});
