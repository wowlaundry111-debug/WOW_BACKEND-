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
  Sparkles,
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

const getCategoryBadge = (name: string) => {
  if (!name) return 'Care+';
  const lowerName = name.toLowerCase();

  if (lowerName.includes('formal') || lowerName.includes('interview') || lowerName.includes('suit')) return 'Eco Safe';
  if (lowerName.includes('curtain')) return 'Express';
  if (lowerName.includes('rug')) return 'Care+';
  if (lowerName.includes('bedding') || lowerName.includes('bedsheet') || lowerName.includes('home') || lowerName.includes('linen')) return 'Express';
  if (lowerName.includes('winter') || lowerName.includes('coat') || lowerName.includes('leather') || lowerName.includes('jacket')) return 'SAVE ₹99';
  if (lowerName.includes('dryclean') || lowerName.includes('premium')) return 'SANITIZED';
  if (lowerName.includes('everyday') || lowerName.includes('normal') || lowerName.includes('wash') || lowerName.includes('daily')) return '50% OFF';

  return 'Care+';
};

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
  const topLevelCats = tenantCats.filter((c) => !c.parentCategoryId);
  const activeTopCategory = topLevelCats.find((c) => c._id === categoryId) || topLevelCats[0] || tenantCats[0];
  const category = activeTopCategory;

  const subCategories = (activeTopCategory?.subCategories && activeTopCategory.subCategories.length > 0)
    ? activeTopCategory.subCategories
    : tenantCats.filter((c) => c.parentCategoryId === activeTopCategory?._id);
  const [selectedSubCatId, setSelectedSubCatId] = useState<string>('ALL');

  useEffect(() => {
    setSelectedSubCatId('ALL');
  }, [activeTopCategory?._id]);

  const subCategoryIds = subCategories.map((s) => s._id);
  const catItems = items.filter((i) => {
    if (!activeTopCategory) return true;
    let matchCat = false;
    if (selectedSubCatId === 'ALL') {
      matchCat = i.categoryId === activeTopCategory._id || subCategoryIds.includes(i.categoryId);
    } else {
      matchCat = i.categoryId === selectedSubCatId;
    }
    const matchSearch = searchQuery === '' || i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getQuantity = (itemId: string) => {
    return cart.find((c) => c.itemId === itemId)?.quantity || 0;
  };

  const handleAddToCart = (item: any, diff: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToCart(item, diff);
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const mainScrollRef = React.useRef<ScrollView>(null);

  const handleBack = () => {
    if (selectedSubCatId !== 'ALL' && subCategories.length > 0) {
      setSelectedSubCatId('ALL');
    } else {
      onBack();
    }
  };

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [categoryId, activeTopCategory?._id, selectedSubCatId]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor="#061E38" translucent />

      {/* Top Overscroll Blue Background Filler */}
      <View style={styles.topOverscrollFiller} />

      <ScrollView
        ref={mainScrollRef}
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
            <BouncyCard onPress={handleBack} contentStyle={styles.backBtn}>
              <ArrowLeft size={20} color={COLORS.black} strokeWidth={3} />
            </BouncyCard>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>
                  {subCategories.length > 0 && selectedSubCatId === 'ALL' && !searchQuery
                    ? `${subCategories.length} ${subCategories.length === 1 ? 'WASH PREFERENCE' : 'WASH PREFERENCES'}`
                    : `${catItems.length} ${catItems.length === 1 ? 'ITEM' : 'ITEMS'}`}
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

          {/* Horizontal Top-Level Category Filter Pills */}
          {topLevelCats.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryPillsScroll}
              contentContainerStyle={styles.categoryPillsContent}
            >
              {topLevelCats.map((cat) => {
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

          {/* Wash Preference Cards Grid (when on ALL and subcategories exist) */}
          {subCategories.length > 0 && selectedSubCatId === 'ALL' && !searchQuery ? (
            <View style={{ marginBottom: 20 }}>
              <View style={{ borderBottomWidth: 3, borderBottomColor: COLORS.black, paddingBottom: 10, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ backgroundColor: '#F0FDF4', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.black, marginBottom: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#16A34A', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      WASH PREFERENCE
                    </Text>
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.black, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Select a Wash Preference
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginTop: 2 }}>
                    Choose a wash preference to view available buckets and items
                  </Text>
                </View>
                <View style={{ backgroundColor: COLORS.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 2, borderColor: COLORS.black }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.black }}>
                    {subCategories.length} {subCategories.length === 1 ? 'OPTION' : 'OPTIONS'}
                  </Text>
                </View>
              </View>

              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: subCategories.length === 1 ? 'flex-start' : 'space-between',
                rowGap: 14,
              }}>
                {subCategories.map((sub) => {
                  const badgeText = getCategoryBadge(sub.name);
                  const subItems = items.filter((i) => i.categoryId === sub._id);
                  const isSingle = subCategories.length === 1;

                  return (
                    <TouchableOpacity
                      key={sub._id}
                      activeOpacity={0.88}
                      onPress={() => setSelectedSubCatId(sub._id)}
                      style={{
                        width: isSingle ? '100%' : '48%',
                        backgroundColor: COLORS.white,
                        borderWidth: 2.5,
                        borderColor: COLORS.black,
                        borderRadius: 18,
                        padding: 14,
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 4,
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Top Badges Row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ backgroundColor: COLORS.black, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.black }}>
                          <Text style={{ fontSize: 9, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            {badgeText}
                          </Text>
                        </View>
                        {isSingle && (
                          <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
                              {subItems.length} {subItems.length === 1 ? 'Item Available' : 'Items Available'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Vector Illustration selected by Admin */}
                      <View style={{ height: isSingle ? 92 : 80, alignItems: 'center', justifyContent: 'center', marginVertical: 6 }}>
                        <CategoryVectorIllustration
                          categoryName={sub.name}
                          customImage={sub.image}
                          size={isSingle ? 82 : 72}
                        />
                      </View>

                      {/* Footer */}
                      <View style={{ borderTopWidth: 2, borderTopColor: COLORS.black, paddingTop: 10, marginTop: 4 }}>
                        <Text style={{ fontSize: isSingle ? 16 : 13, fontWeight: '900', color: COLORS.black, textTransform: 'uppercase' }} numberOfLines={1}>
                          {sub.name}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>
                            {subItems.length} {subItems.length === 1 ? 'Item' : 'Items'}
                          </Text>
                          <View style={{
                            backgroundColor: COLORS.secondary,
                            paddingHorizontal: isSingle ? 10 : 7,
                            paddingVertical: isSingle ? 5 : 3,
                            borderRadius: 6,
                            borderWidth: 1.5,
                            borderColor: COLORS.black,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            shadowColor: '#000',
                            shadowOffset: { width: 1.5, height: 1.5 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                            elevation: 2,
                          }}>
                            <Text style={{ fontSize: 9, fontWeight: '900', color: COLORS.black }}>
                              {isSingle ? 'SELECT SERVICE' : 'SELECT'}
                            </Text>
                            <ArrowRight size={11} color={COLORS.black} strokeWidth={3} />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View>
              {/* Active Sub-Category Header Banner */}
              {subCategories.length > 0 && selectedSubCatId !== 'ALL' && (
                <View style={{
                  backgroundColor: COLORS.white,
                  borderWidth: 2.5,
                  borderColor: COLORS.black,
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 4, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                  elevation: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
                        {category?.name}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B' }}>›</Text>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#0D8DE3', textTransform: 'uppercase' }}>
                        {subCategories.find(s => s._id === selectedSubCatId)?.name}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.black, textTransform: 'uppercase' }}>
                      {subCategories.find(s => s._id === selectedSubCatId)?.name}
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginTop: 1 }}>
                      Select your clothes or bucket below
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelectedSubCatId('ALL')}
                    style={{
                      backgroundColor: COLORS.secondary,
                      borderWidth: 2,
                      borderColor: COLORS.black,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 10,
                      shadowColor: '#000',
                      shadowOffset: { width: 2, height: 2 },
                      shadowOpacity: 1,
                      shadowRadius: 0,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.black, textTransform: 'uppercase' }}>
                      ← CHANGE PREFERENCE
                    </Text>
                  </TouchableOpacity>
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
              const isKg = Boolean(item.pricePerKg && item.pricePerKg > 0) || 
                item.unit === 'KG' || 
                (typeof item.name === 'string' && (item.name.toLowerCase().includes('per kg') || item.name.toLowerCase().includes('/ kg') || item.name.toLowerCase().includes('per-kg')));
              const isBucket = Boolean(item.isBucket);

              // ── BUCKET ITEM: Large tappable card to increase clothes count ──
              if (isBucket) {
                return (
                  <TouchableOpacity
                    key={item._id}
                    activeOpacity={0.88}
                    onPress={() => handleAddToCart(item, 1)}
                    style={styles.bucketCard}
                  >
                    <View style={styles.bucketCardInner}>
                      <View style={styles.bucketImgWrap}>
                        <Image
                          source={require('../../../assets/final-bucket-cropped.png')}
                          style={styles.bucketImg}
                          contentFit="contain"
                        />
                        <View style={styles.bucketTapBadge}>
                          <Text style={styles.bucketTapBadgeText}>TAP TO ADD</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.bucketTitle}>{item.name}</Text>
                          <View style={styles.bucketKgBadge}>
                            <Text style={styles.bucketKgBadgeText}>PER KG</Text>
                          </View>
                        </View>

                        <Text style={styles.bucketDesc} numberOfLines={2}>
                          {item.description || 'Tap bucket to count clothes. Weighed & priced upon delivery.'}
                        </Text>

                        <View style={styles.bucketCountRow}>
                          <View style={styles.bucketCountPill}>
                            <Text style={styles.bucketCountPillText}>{qty} CLOTHES</Text>
                          </View>

                          {qty > 0 && (
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                handleAddToCart(item, -1);
                              }}
                              style={styles.bucketMinusBtn}
                            >
                              <Minus size={14} color={COLORS.black} strokeWidth={3} />
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item, 1);
                            }}
                            style={styles.bucketAddBtn}
                          >
                            <Text style={styles.bucketAddBtnText}>+ ADD ({qty})</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }

              const price = item.pricePerItem || item.price || 0;

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

                    {isKg ? (
                      <View style={{ marginTop: 4 }}>
                        <View style={{ backgroundColor: '#0284C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' }}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>PER KG</Text>
                        </View>
                        <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '800', marginTop: 2 }}>Priced at delivery</Text>
                      </View>
                    ) : (
                      <View style={styles.priceRow}>
                        <Text style={styles.itemPrice}>₹{price}</Text>
                        <Text style={styles.itemUnit}>/Item</Text>
                      </View>
                    )}
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
              {(() => {
                const isKgCheck = (c: any) => c.unit === 'KG' || Boolean(c.pricePerKg && c.pricePerKg > 0) || (typeof c.name === 'string' && (c.name.toLowerCase().includes('per kg') || c.name.toLowerCase().includes('/ kg')));
                const hasKg = cart.some(isKgCheck);
                const perItemTotal = cart.filter(c => !isKgCheck(c)).reduce((s, c) => s + (c.price || 0) * c.quantity, 0);
                return hasKg ? (
                  <Text style={styles.cartTotalPrice}>
                    {perItemTotal > 0 ? `₹${perItemTotal} + KG Pending` : 'Pending Weighing'}
                  </Text>
                ) : (
                  <Text style={styles.cartTotalPrice}>₹{cartTotal}</Text>
                );
              })()}
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
  bucketCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: 14,
    marginBottom: 12,
    ...NEO_SHADOW.box4,
  },
  bucketCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bucketImgWrap: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
  },
  bucketImg: {
    width: '100%',
    height: '100%',
  },
  bucketTapBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  bucketTapBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.black,
  },
  bucketTitle: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
  bucketKgBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  bucketKgBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
  },
  bucketDesc: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 2,
  },
  bucketCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  bucketCountPill: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bucketCountPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
  bucketMinusBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketAddBtn: {
    backgroundColor: COLORS.black,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bucketAddBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
});
