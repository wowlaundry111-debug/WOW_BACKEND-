import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Package,
  Shirt,
  Sparkles,
  Leaf,
  AlertCircle,
  ShoppingBag,
  Plus,
  Minus,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { ItemSkeleton } from '../../components/SkeletonLoaders';
import { CategoryVectorIllustration } from '../../components/CategoryVectors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedView = Animated.View as any;

/**
 * Blinkit / iOS Style Bouncy Interactive Pressable with Spring Animation
 */
const BouncyCard: React.FC<{
  onPress?: () => void;
  style?: any;
  contentStyle?: any;
  children: React.ReactNode;
  activeScale?: number;
  disabled?: boolean;
}> = ({ onPress, style, contentStyle, children, activeScale = 0.96, disabled = false }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  return (
    <AnimatedView style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={contentStyle}
      >
        {children}
      </TouchableOpacity>
    </AnimatedView>
  );
};

/**
 * Subtle Ambient Background Floating Bubble
 */
const AmbientBubble: React.FC<{
  size: number;
  startX: number;
  startY: number;
  duration?: number;
  delay?: number;
}> = ({ size, startX, startY, duration = 4500, delay = 0 }) => {
  const animY = useRef(new Animated.Value(0)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const animScale = useRef(new Animated.Value(0.9)).current;
  const animOpacity = useRef(new Animated.Value(0.12)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(animY, {
            toValue: -16,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(animX, {
            toValue: 6,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(animScale, {
            toValue: 1.1,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animOpacity, {
            toValue: 0.22,
            duration: duration * 0.5,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(animY, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animX, {
            toValue: 0,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animScale, {
            toValue: 0.9,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animOpacity, {
            toValue: 0.12,
            duration: duration * 0.5,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [animY, animX, animScale, animOpacity, duration, delay]);

  return (
    <AnimatedView
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        transform: [{ translateY: animY }, { translateX: animX }, { scale: animScale }],
        opacity: animOpacity,
        zIndex: 0,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: size * 0.18,
          left: size * 0.18,
          width: size * 0.26,
          height: size * 0.26,
          borderRadius: size * 0.13,
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
        }}
      />
    </AnimatedView>
  );
};

interface CustomerShopProps {
  categoryId: string | null;
  onBack: () => void;
  onOpenCart: () => void;
  onSelectCategory?: (id: string) => void;
}

export const CustomerShopScreen: React.FC<CustomerShopProps> = ({
  categoryId,
  onBack,
  onOpenCart,
  onSelectCategory,
}) => {
  const insets = useSafeAreaInsets();
  const { categories, items, cart, addToCart, isLoading, currentTenantId, shops, fetchCatalog } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchCatalog();
    setRefreshing(false);
  }, [fetchCatalog]);

  const shop = shops.find((s) => s._id === currentTenantId);
  const isClosed = shop?.isOpen === false;

  const tenantCats = categories.filter((c) => c.shopId === currentTenantId);
  const category = tenantCats.find((c) => c._id === categoryId) || tenantCats[0];

  const catItems = items.filter(
    (i) =>
      (category ? i.categoryId === category._id : true) &&
      (searchQuery === '' || i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getQuantity = (itemId: string) => {
    return cart.find((c) => c.itemId === itemId)?.quantity || 0;
  };

  const handleAddToCart = (item: any, diff: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToCart(item, diff);
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor="#061E38" translucent />

      {/* Top Overscroll Blue Background Filler */}
      <View style={styles.topOverscrollFiller} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: cart.length > 0 ? 100 : 36 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.secondary]}
            tintColor="#B0FF49"
          />
        }
      >
        {/* ─── Hero Royal Blue Header with Ambient Bubbles & Wave Curve ─── */}
        <LinearGradient
          colors={['#061E38', '#0A2B4C', '#0E3A66', '#082340']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerHero, { paddingTop: (insets.top > 0 ? insets.top : 44) + 6 }]}
        >
          <AmbientBubble size={16} startX={26} startY={22} duration={4200} delay={0} />
          <AmbientBubble size={22} startX={SCREEN_WIDTH - 60} startY={38} duration={4800} delay={600} />

          <View style={styles.headerTopRow}>
            <BouncyCard onPress={onBack} contentStyle={styles.backBtn}>
              <ArrowLeft size={20} color={COLORS.black} strokeWidth={3} />
            </BouncyCard>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>
                  {catItems.length} {catItems.length === 1 ? 'ITEM' : 'ITEMS'}
                </Text>
              </View>
              <Text style={styles.headerTitleText} numberOfLines={1}>
                {category?.name || 'Laundry Catalog'}
              </Text>
            </View>

            <BouncyCard onPress={onOpenCart} contentStyle={styles.cartIconBtn}>
              <ShoppingBag size={18} color={COLORS.black} strokeWidth={2.5} />
              {cart.length > 0 && (
                <View style={styles.cartBadgeDot}>
                  <Text style={styles.cartBadgeDotText}>{cart.length}</Text>
                </View>
              )}
            </BouncyCard>
          </View>

          {/* Horizontal Category Filter Pills */}
          {tenantCats.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryPillsScroll}
              contentContainerStyle={styles.categoryPillsContent}
            >
              {tenantCats.map((cat) => {
                const isActive = cat._id === category?._id;
                return (
                  <BouncyCard
                    key={cat._id}
                    onPress={() => onSelectCategory?.(cat._id)}
                    contentStyle={[styles.catPill, isActive && styles.catPillActive]}
                  >
                    <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                      {cat.name}
                    </Text>
                  </BouncyCard>
                );
              })}
            </ScrollView>
          )}

          {/* ─── Wave Partition with 2.5px Dark Border ─── */}
          <View style={styles.wavePartitionWrap}>
            <Svg
              width={SCREEN_WIDTH}
              height={32}
              viewBox={`0 0 ${SCREEN_WIDTH} 32`}
              preserveAspectRatio="none"
            >
              <Path
                d={`M 0,0 Q ${SCREEN_WIDTH * 0.5} 32, ${SCREEN_WIDTH} 0 L ${SCREEN_WIDTH} 32 L 0 32 Z`}
                fill="#F8FAFC"
              />
              <Path
                d={`M 0,0 Q ${SCREEN_WIDTH * 0.5} 32, ${SCREEN_WIDTH} 0`}
                stroke="#000000"
                strokeWidth={2.5}
                fill="none"
              />
            </Svg>
          </View>
        </LinearGradient>

        {/* ─── Body Content ─── */}
        <View style={styles.bodyContent}>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={18} color="#6B7280" strokeWidth={2.5} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search in ${category?.name || 'items'}...`}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#6B7280" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {/* Closed Banner */}
          {isClosed && (
            <View style={styles.closedCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <AlertCircle size={18} color="#DC2626" strokeWidth={2.5} />
                <Text style={styles.closedTitle}>STORE CURRENTLY CLOSED</Text>
              </View>
              <Text style={styles.closedSub}>
                Orders placed now will be scheduled for the next operating shift.
              </Text>
            </View>
          )}

          {/* Items List */}
          {isLoading && catItems.length === 0 ? (
            <>
              <ItemSkeleton />
              <ItemSkeleton />
              <ItemSkeleton />
              <ItemSkeleton />
            </>
          ) : catItems.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingBag size={44} color={COLORS.black} strokeWidth={2} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>NO ITEMS FOUND</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? `No laundry items match "${searchQuery}".`
                  : 'No items currently available in this category.'}
              </Text>
            </View>
          ) : (
            catItems.map((item) => {
              const qty = getQuantity(item._id);
              const price = (item as any).pricePerKg || (item as any).pricePerItem || (item as any).price || 0;
              const unit = item.pricePerKg ? 'KG' : 'Item';

              return (
                <View key={item._id} style={styles.itemCard}>
                  {/* Illustration box */}
                  <View style={styles.itemImgBox}>
                    <CategoryVectorIllustration
                      itemName={item.name}
                      categoryName={category?.name}
                      customImage={item.image}
                      size={54}
                    />
                  </View>

                  {/* Details */}
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.description ? (
                      <Text style={styles.itemDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}

                    <View style={styles.priceRow}>
                      <Text style={styles.itemPrice}>₹{price}</Text>
                      <Text style={styles.itemUnit}>/{unit}</Text>
                    </View>
                  </View>

                  {/* Stepper / ADD CTA */}
                  <View style={styles.actionWrap}>
                    {qty > 0 ? (
                      <View style={styles.stepperWrap}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleAddToCart(item, -1)}
                          activeOpacity={0.7}
                        >
                          <Minus size={12} color={COLORS.black} strokeWidth={3} />
                        </TouchableOpacity>
                        <Text style={styles.stepperQty}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.stepperBtn, { backgroundColor: COLORS.secondary }]}
                          onPress={() => handleAddToCart(item, 1)}
                          activeOpacity={0.7}
                        >
                          <Plus size={12} color={COLORS.black} strokeWidth={3} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <BouncyCard
                        onPress={() => handleAddToCart(item, 1)}
                        contentStyle={styles.addBtn}
                      >
                        <Text style={styles.addBtnText}>ADD +</Text>
                      </BouncyCard>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Neo-Brutalist Cart */}
      {cart.length > 0 && (
        <View style={styles.floatingCartWrap}>
          <BouncyCard onPress={onOpenCart} contentStyle={styles.floatingCart}>
            <View>
              <Text style={styles.cartItemsCount}>
                {cart.length} ITEM{cart.length > 1 ? 'S' : ''} ADDED
              </Text>
              <Text style={styles.cartTotalPrice}>₹{cartTotal}</Text>
            </View>
            <View style={styles.cartCheckoutBtn}>
              <Text style={styles.cartCheckoutText}>Checkout</Text>
              <View style={styles.cartArrowCircle}>
                <ArrowRight size={18} color={COLORS.black} strokeWidth={3} />
              </View>
            </View>
          </BouncyCard>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topOverscrollFiller: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: '#061E38',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerHero: {
    paddingHorizontal: SPACING.mobile,
    paddingBottom: 52,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 1,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  itemCountBadge: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  itemCountText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.6,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  cartIconBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  cartBadgeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.black,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    borderRadius: RADIUS.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeDotText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
  },
  categoryPillsScroll: {
    marginHorizontal: -SPACING.mobile,
    marginBottom: 4,
    zIndex: 1,
  },
  categoryPillsContent: {
    paddingHorizontal: SPACING.mobile,
    gap: 8,
    paddingVertical: 4,
  },
  catPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  catPillActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.black,
    borderWidth: 2,
    ...NEO_SHADOW.box2,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  catPillTextActive: {
    color: COLORS.black,
  },
  wavePartitionWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
  },
  bodyContent: {
    paddingHorizontal: SPACING.mobile,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    ...NEO_SHADOW.box4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },
  closedCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  closedTitle: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  closedSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: 12,
    ...NEO_SHADOW.box4,
  },
  itemImgBox: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 15,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.primary,
  },
  itemUnit: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#6B7280',
  },
  actionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...NEO_SHADOW.box2,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 3,
    ...NEO_SHADOW.box2,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    minWidth: 16,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  floatingCartWrap: {
    position: 'absolute',
    bottom: 16,
    left: SPACING.mobile,
    right: SPACING.mobile + 6,
    zIndex: 50,
  },
  floatingCart: {
    backgroundColor: COLORS.black,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...NEO_SHADOW.boxLime6,
  },
  cartItemsCount: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cartTotalPrice: {
    fontSize: 20,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    marginTop: 2,
  },
  cartCheckoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartCheckoutText: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cartArrowCircle: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
