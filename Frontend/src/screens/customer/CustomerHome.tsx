import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Platform,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import {
  Search,
  Mic,
  X,
  ChevronDown,
  ArrowRight,
  ClipboardList,
  CheckCircle,
  Droplets,
  Sparkles,
  Truck,
  Gift,
  User,
  Shirt,
  Zap,
  Flame,
  Package,
  Layers,
  Plus,
  Minus,
  ShoppingBag,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { CategorySkeleton } from '../../components/SkeletonLoaders';
import { NotificationBell } from '../../components/NotificationBell';
import { CategoryVectorIllustration, WinterWearVector } from '../../components/CategoryVectors';

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

const getCategoryIcon = (name: string) => {
  if (!name) return Package;
  const lower = name.toLowerCase();
  if (lower.includes('wash') || lower.includes('fold') || lower.includes('everyday') || lower.includes('casual') || lower.includes('daily')) {
    return Shirt;
  }
  if (lower.includes('dry') || lower.includes('clean') || lower.includes('suit') || lower.includes('formal') || lower.includes('jacket') || lower.includes('coat') || lower.includes('winter') || lower.includes('premium')) {
    return Sparkles;
  }
  if (lower.includes('iron') || lower.includes('press') || lower.includes('steam')) {
    return Flame;
  }
  if (lower.includes('express') || lower.includes('fast') || lower.includes('quick')) {
    return Zap;
  }
  if (lower.includes('bed') || lower.includes('linen') || lower.includes('curtain') || lower.includes('home') || lower.includes('blanket') || lower.includes('quilt') || lower.includes('sheet')) {
    return Layers;
  }
  if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('leather')) {
    return Droplets;
  }
  return Package;
};

const ORDER_STEPS = [
  { key: 'PLACED', label: 'Placed', icon: ClipboardList },
  { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle },
  { key: 'WASHING', label: 'Wash', icon: Droplets },
  { key: 'IRONING', label: 'Press', icon: Sparkles },
  { key: 'OUT_FOR_DELIVERY', label: 'Out', icon: Truck },
  { key: 'DELIVERED', label: 'Done', icon: Gift },
];

/**
 * Animated Floating Soap Bubble Element for Laundry Theme (Subtle Background)
 */
const FloatingLaundryBubble: React.FC<{
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
            toValue: -20,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(animX, {
            toValue: 8,
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
            toValue: 0.28,
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
      {/* Soft gloss highlight reflection */}
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

/**
 * 3 subtle ambient background bubbles
 */
const LaundryBubblesGroup: React.FC = () => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <FloatingLaundryBubble size={16} startX={28} startY={35} duration={4200} delay={0} />
    <FloatingLaundryBubble size={20} startX={SCREEN_WIDTH - 55} startY={60} duration={4800} delay={500} />
    <FloatingLaundryBubble size={14} startX={SCREEN_WIDTH / 2 + 65} startY={160} duration={4000} delay={800} />
  </View>
);

/**
 * Floral Mandala SVG Vector Ornamentation for Left Banner
 */
const FloralMandalaVector: React.FC = () => (
  <Svg width={90} height={120} viewBox="0 0 90 120" fill="none" style={StyleSheet.absoluteFill}>
    <Path
      d="M -10 60 C 20 40, 20 80, -10 60 Z"
      stroke="#60A5FA"
      strokeWidth={1}
      opacity={0.35}
    />
    <Path
      d="M 5 30 C 25 35, 30 55, 10 65"
      stroke="#D4AF37"
      strokeWidth={1.2}
      strokeDasharray="2,2"
      opacity={0.6}
    />
    <Path
      d="M 15 15 C 35 25, 45 45, 25 75 C 10 95, -5 105, 5 115"
      stroke="#60A5FA"
      strokeWidth={1.5}
      opacity={0.5}
    />
    <Circle cx="25" cy="75" r="3" fill="#FDE047" opacity={0.7} />
    <Circle cx="12" cy="40" r="2.5" fill="#93C5FD" opacity={0.6} />
    <Circle cx="32" cy="48" r="2" fill="#FDE047" opacity={0.7} />
    <Path
      d="M 0 50 C 15 45, 18 55, 0 60 C -5 55, -5 50, 0 50 Z"
      fill="#F472B6"
      opacity={0.7}
      stroke="#D4AF37"
      strokeWidth={1}
    />
  </Svg>
);

/**
 * 3D Orange Gift Jacket Emblem with Green Plus Tag
 */
const GiftJacketEmblem: React.FC<{ size?: number }> = ({ size = 68 }) => (
  <View style={[styles.emblemContainer, { width: size, height: size, borderRadius: size / 2 }]}>
    <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <Circle cx="40" cy="40" r="38" stroke="#D4AF37" strokeWidth="2.5" fill="#FFFFFF" />
      <Circle cx="40" cy="40" r="35" stroke="#FDE047" strokeWidth="1" opacity={0.7} />

      <G transform="translate(14, 16) scale(0.65)">
        <Path
          d="M 22 18 L 40 10 L 58 18 L 74 38 L 64 48 L 62 76 L 18 76 L 16 48 L 6 38 Z"
          fill="#F97316"
          stroke="#000000"
          strokeWidth="3.5"
        />
        <Path d="M 18 36 L 62 36" stroke="#000000" strokeWidth="3" />
        <Path d="M 18 48 L 62 48" stroke="#000000" strokeWidth="3" />
        <Path d="M 18 62 L 62 62" stroke="#000000" strokeWidth="3" />
        <Path
          d="M 26 16 C 24 8, 36 8, 40 14 C 44 8, 56 8, 54 16 C 58 24, 46 26, 40 20 C 34 26, 22 24, 26 16 Z"
          fill="#FDE047"
          stroke="#000000"
          strokeWidth="3"
        />
        <Path d="M 40 20 L 40 76" stroke="#000000" strokeWidth="3.5" />
        <Rect x="22" y="52" width="10" height="10" rx="2" fill="#EA580C" stroke="#000000" strokeWidth="2" />
        <Rect x="48" y="52" width="10" height="10" rx="2" fill="#EA580C" stroke="#000000" strokeWidth="2" />
      </G>

      <Circle cx="60" cy="22" r="8" fill="#22C55E" stroke="#000000" strokeWidth="1.8" />
      <Path d="M 60 18 L 60 26 M 56 22 L 64 22" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  </View>
);

interface CustomerHomeProps {
  onCategoryPress: (categoryId: string) => void;
  onOpenCart: () => void;
}

export const CustomerHomeScreen: React.FC<CustomerHomeProps> = ({ onCategoryPress, onOpenCart }) => {
  const insets = useSafeAreaInsets();
  const {
    categories,
    items,
    currentTenantId,
    cart,
    addToCart,
    isLoading,
    currentUser,
    orders,
    shops,
    fetchCatalog,
    fetchOrders,
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const currentShop = shops.find((s) => s._id === currentTenantId) || shops[0];
  const promo1 = currentShop?.promoBanners?.[0] || { badge: 'PROMO', title: '50% OFF', subtitle: 'Winter Wear Deep Dryclean' };
  const promo2 = currentShop?.promoBanners?.[1] || { badge: 'EXPRESS', title: 'EXPRESS DOORSTEP', subtitle: 'Fast doorstep delivery' };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCatalog(), fetchOrders()]);
    setRefreshing(false);
  }, [fetchCatalog, fetchOrders]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Filter categories for current shop
  const shopCategories = categories.filter((c) => !currentTenantId || c.shopId === currentTenantId);

  // Dynamic Tabs: ONLY express gets 'New' badge, NEVER winter jackets or coats
  const dynamicTabs = [
    { id: 'all', label: 'All', icon: Package, hasNew: false },
    ...shopCategories.map((c) => {
      const lower = c.name.toLowerCase();
      const isExpress = lower === 'express' || lower.includes('fast') || lower.includes('speed');
      const isWinter = lower.includes('winter') || lower.includes('jacket') || lower.includes('coat');
      return {
        id: c._id,
        label: c.name,
        icon: getCategoryIcon(c.name),
        hasNew: isExpress && !isWinter,
      };
    }),
  ];

  const isSearching = searchQuery.trim().length > 0;
  const cleanQuery = searchQuery.toLowerCase().trim();

  // Search matching items across all categories for this shop
  const matchingItems = items.filter((item) => {
    if (item.shopId && currentTenantId && item.shopId !== currentTenantId) return false;
    if (!isSearching) return false;
    return (
      item.name.toLowerCase().includes(cleanQuery) ||
      (item.description && item.description.toLowerCase().includes(cleanQuery))
    );
  });

  const tenantCats = shopCategories.filter((c) => {
    if (!isSearching && selectedCategoryTab !== 'all' && c._id !== selectedCategoryTab) {
      return false;
    }

    if (!isSearching) return true;

    return (
      c.name.toLowerCase().includes(cleanQuery) ||
      matchingItems.some((item) => item.categoryId === c._id)
    );
  });

  const activeOrder = orders.find((o) => o.customerId === currentUser?._id && o.status !== 'DELIVERED');
  const activeStepIndex = activeOrder ? ORDER_STEPS.findIndex((s) => s.key === activeOrder.status) : -1;
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleTabPress = (tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategoryTab(tabId);
    if (isSearching) {
      setSearchQuery('');
    }
  };

  const getQuantity = (itemId: string) => {
    return cart.find((c) => c.itemId === itemId)?.quantity || 0;
  };

  const handleAddToCart = (item: any, diff: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart(item, diff);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor="#061E38" translucent />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor="#90CAF9" />}
      >
        {/* Top Overscroll Blue Background Filler */}
        <View style={styles.topOverscrollFiller} />

        {/* ─── Seamless Royal Blue Header Wrap with Floating Bubbles & Wave Partition ─── */}
        <LinearGradient
          colors={['#061E38', '#0A2E54', '#0E3E6E', '#092547']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradientWrap, { paddingTop: (insets.top > 0 ? insets.top : 44) + 6 }]}
        >
          {/* Animated Floating Soap Bubbles */}
          <LaundryBubblesGroup />

          {/* Inner Padded Content */}
          <View style={styles.headerInner}>
            {/* Top User & Notification Row */}
            <View style={styles.headerTopRow}>
              {/* Lime Avatar */}
              <View style={styles.avatarBox}>
                {currentUser?.name ? (
                  <Text style={styles.avatarText}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </Text>
                ) : (
                  <User size={20} color={COLORS.black} strokeWidth={2.5} />
                )}
              </View>

              {/* Greeting & Name */}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {currentUser?.name || 'Guest'}
                </Text>
              </View>

              {/* Circular Dark Glass Bell */}
              <View style={styles.bellWrap}>
                <NotificationBell color={COLORS.white} />
              </View>
            </View>

            {/* Search Bar Capsule with divider & Mic */}
            <View style={styles.searchBar}>
              <Search size={18} color="#90CAF9" strokeWidth={2.5} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search clothes, dry cleaning, pressing..."
                placeholderTextColor="#79A8D9"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {isSearching ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.clearSearchBtn}
                  onPress={() => setSearchQuery('')}
                >
                  <X size={16} color={COLORS.white} strokeWidth={3} />
                </TouchableOpacity>
              ) : (
                <View style={styles.searchMicWrap}>
                  <View style={styles.searchDivider} />
                  <TouchableOpacity activeOpacity={0.7} style={styles.micBtn}>
                    <Mic size={18} color="#90CAF9" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Dynamic Service / Category Tabs Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.serviceTabsScroll}
              contentContainerStyle={styles.serviceTabsContent}
            >
              {dynamicTabs.map((tab) => {
                const isActive = !isSearching && selectedCategoryTab === tab.id;
                const IconComponent = tab.icon;

                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={styles.serviceTabItem}
                    activeOpacity={0.8}
                    onPress={() => handleTabPress(tab.id)}
                  >
                    <View
                      style={[
                        styles.serviceIconWrap,
                        isActive && styles.serviceIconWrapActive,
                      ]}
                    >
                      <IconComponent
                        size={20}
                        color={isActive ? COLORS.white : '#90CAF9'}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {tab.hasNew && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>New</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.serviceTabLabel,
                        isActive ? styles.serviceTabLabelActive : styles.serviceTabLabelInactive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {isActive ? (
                      <View style={styles.activeUnderline} />
                    ) : (
                      <View style={styles.inactiveUnderlinePlaceholder} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Horizontal Separator Line */}
            <View style={styles.headerSeparatorLine} />

            {/* ─── Hero Promo Banners (Embedded on dark teal background) ─── */}
            {!isSearching && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -SPACING.mobile }}
                contentContainerStyle={styles.promoCarousel}
              >
                {/* Promo Card 1: Dark Teal Card with Golden Flourishes & Mandala */}
                <View style={styles.luxuryPromoCard}>
                  <FloralMandalaVector />

                  {/* Inner Ornamental Golden Border */}
                  <View style={styles.goldCornerBox} />

                  {/* Corner Flourish Accents */}
                  <View style={[styles.cornerFlourish, { top: 6, left: 6 }]} />
                  <View style={[styles.cornerFlourish, { top: 6, right: 6 }]} />
                  <View style={[styles.cornerFlourish, { bottom: 6, left: 6 }]} />
                  <View style={[styles.cornerFlourish, { bottom: 6, right: 6 }]} />

                  {/* Promo Text Content */}
                  <View style={{ flex: 1, paddingLeft: 10, paddingRight: 6, zIndex: 2 }}>
                    <View style={styles.promoBadgeGold}>
                      <Text style={styles.promoBadgeGoldText}>{promo1.badge || 'PROMO'}</Text>
                    </View>
                    <Text style={styles.luxuryPromoTitle}>{promo1.title}</Text>
                    <Text style={styles.luxuryPromoSub}>{promo1.subtitle}</Text>
                  </View>

                  {/* 3D Orange Gift Jacket Emblem with Green '+' */}
                  <GiftJacketEmblem size={68} />
                </View>

                {/* Promo Card 2: Matching Electric Blue Delivery Card in Same Palette */}
                <LinearGradient
                  colors={['#0284C7', '#0284C7', '#0369A1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.expressPromoCard}
                >
                  {/* Subtle Inner Highlight Border */}
                  <View style={styles.expressInnerBorder} />

                  <View style={{ flex: 1, paddingRight: 8, zIndex: 2 }}>
                    <View style={styles.promoBadgeExpress}>
                      <Text style={styles.promoBadgeExpressText}>{promo2.badge || 'EXPRESS'}</Text>
                    </View>
                    <Text style={styles.expressPromoTitle}>{promo2.title}</Text>
                    <Text style={styles.expressPromoSub}>{promo2.subtitle}</Text>
                  </View>

                  <View style={styles.expressPromoCircle}>
                    <Truck size={30} color="#0284C7" strokeWidth={2.5} />
                  </View>
                </LinearGradient>
              </ScrollView>
            )}
          </View>

          {/* ─── Seamless Edge-to-Edge Wave Curve Partition with Dark Neo-Brutalist Border ─── */}
          <View style={styles.wavePartitionWrap}>
            <Svg width={SCREEN_WIDTH} height={32} viewBox={`0 0 ${SCREEN_WIDTH} 32`} preserveAspectRatio="none">
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

        {/* ─── Page Body Content (Below the Wave) ─── */}
        <View style={styles.bodyContent}>
          {/* Live Order Tracker Banner (Only when not searching) */}
          {!isSearching && activeOrder && activeStepIndex !== -1 && (
            <View style={styles.liveTrackingCard}>
              <View style={styles.liveTrackingHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.pulsingDot} />
                  <Text style={styles.liveTrackingTitle}>Live Tracking</Text>
                </View>
                <View style={styles.orderIdBadge}>
                  <Text style={styles.orderIdText}>#{activeOrder._id.slice(-6).toUpperCase()}</Text>
                </View>
              </View>

              {/* Steps Container */}
              <View style={styles.trackerContainer}>
                <View style={styles.trackerRow}>
                  {ORDER_STEPS.map((step, idx) => {
                    const isCompleted = idx <= activeStepIndex;
                    const isActive = idx === activeStepIndex;
                    const StepIcon = step.icon;

                    return (
                      <View key={step.key} style={styles.trackerStep}>
                        <View
                          style={[
                            styles.stepIconBox,
                            isCompleted && { backgroundColor: COLORS.secondary },
                            isActive && { backgroundColor: COLORS.primary, transform: [{ scale: 1.15 }] },
                          ]}
                        >
                          <StepIcon size={16} color={COLORS.black} strokeWidth={2.5} />
                        </View>
                        <Text
                          style={[
                            styles.stepLabel,
                            isActive && { color: COLORS.black, fontWeight: '900' },
                          ]}
                        >
                          {step.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ─── SEARCH RESULTS: MATCHING ITEMS ─── */}
          {isSearching && matchingItems.length > 0 && (
            <View style={styles.searchSectionWrap}>
              <View style={styles.sectionHeaderWrap}>
                <Text style={styles.sectionHeading}>MATCHING ITEMS</Text>
                <Text style={styles.sectionSubheading}>
                  {matchingItems.length} ITEM{matchingItems.length > 1 ? 'S' : ''} FOUND
                </Text>
              </View>

              <View style={styles.matchingItemsList}>
                {matchingItems.map((item) => {
                  const qty = getQuantity(item._id);
                  const itemCat = categories.find((c) => c._id === item.categoryId);

                  return (
                    <View key={item._id} style={styles.searchItemCard}>
                      {/* Item Image / Icon */}
                      <View style={styles.searchItemImgBox}>
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={styles.searchItemImg} contentFit="cover" />
                        ) : (
                          <CategoryVectorIllustration categoryName={itemCat?.name || item.name} size={42} />
                        )}
                      </View>

                      {/* Item Details */}
                      <View style={styles.searchItemInfo}>
                        <Text style={styles.searchItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {itemCat && (
                          <View style={styles.searchItemCatBadge}>
                            <Text style={styles.searchItemCatText}>{itemCat.name.toUpperCase()}</Text>
                          </View>
                        )}
                        <Text style={styles.searchItemPrice}>
                          ₹{item.pricePerItem ?? item.pricePerKg ?? 0}
                          {item.pricePerKg && !item.pricePerItem ? '/kg' : ''}
                        </Text>
                      </View>

                      {/* Instant Cart Controls */}
                      <View style={styles.searchItemAction}>
                        {qty === 0 ? (
                          <TouchableOpacity
                            style={styles.searchAddBtn}
                            activeOpacity={0.8}
                            onPress={() => handleAddToCart(item, 1)}
                          >
                            <Plus size={16} color={COLORS.black} strokeWidth={3} />
                            <Text style={styles.searchAddText}>ADD</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.searchQtyBox}>
                            <TouchableOpacity
                              style={styles.searchQtyBtn}
                              activeOpacity={0.7}
                              onPress={() => handleAddToCart(item, -1)}
                            >
                              <Minus size={14} color={COLORS.black} strokeWidth={3} />
                            </TouchableOpacity>
                            <Text style={styles.searchQtyText}>{qty}</Text>
                            <TouchableOpacity
                              style={styles.searchQtyBtn}
                              activeOpacity={0.7}
                              onPress={() => handleAddToCart(item, 1)}
                            >
                              <Plus size={14} color={COLORS.black} strokeWidth={3} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ─── CATEGORIES SECTION ─── */}
          {tenantCats.length > 0 && (
            <View style={isSearching && matchingItems.length > 0 ? { marginTop: SPACING.lg } : undefined}>
              <View style={styles.sectionHeaderWrap}>
                <Text style={styles.sectionHeading}>
                  {isSearching ? 'MATCHING CATEGORIES' : 'START WASHING'}
                </Text>
                <Text style={styles.sectionSubheading}>
                  {isSearching ? `${tenantCats.length} CATEGORIES` : 'PICK A CATEGORY'}
                </Text>
              </View>

              {/* 2-Column Grid */}
              <View style={styles.grid}>
                {isLoading ? (
                  <>
                    <CategorySkeleton />
                    <CategorySkeleton />
                    <CategorySkeleton />
                    <CategorySkeleton />
                  </>
                ) : (
                  tenantCats.map((cat) => {
                    const badgeText = getCategoryBadge(cat.name);
                    return (
                      <TouchableOpacity
                        key={cat._id}
                        style={styles.catCard}
                        activeOpacity={0.88}
                        onPress={() => onCategoryPress(cat._id)}
                      >
                        {/* Black Pill Badge in Top-Left */}
                        <View style={styles.badgeWrap}>
                          <View style={styles.catBadge}>
                            <Text style={styles.catBadgeText}>{badgeText}</Text>
                          </View>
                        </View>

                        {/* 3D Vector SVG Illustration */}
                        <View style={styles.catImgWrap}>
                          <CategoryVectorIllustration
                            categoryName={cat.name}
                            customImage={cat.image}
                            size={80}
                          />
                        </View>

                        {/* Bottom Divider Line & Title */}
                        <View style={styles.catFooter}>
                          <Text style={styles.catName} numberOfLines={2}>
                            {cat.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          )}

          {/* No Results Found */}
          {isSearching && matchingItems.length === 0 && tenantCats.length === 0 && (
            <View style={styles.emptySearchWrap}>
              <ShoppingBag size={48} color={COLORS.black} strokeWidth={2} style={{ marginBottom: 12 }} />
              <Text style={styles.emptySearchTitle}>No Results Found</Text>
              <Text style={styles.emptySearchSub}>
                We couldn't find any items or categories matching "{searchQuery}".
              </Text>
              <TouchableOpacity
                style={styles.clearSearchBtnFull}
                activeOpacity={0.8}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchBtnText}>CLEAR SEARCH</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isSearching && tenantCats.length === 0 && !isLoading && (
            <View style={styles.emptyStateWrap}>
              <Text style={styles.emptyStateText}>No categories found.</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Floating Neo-Brutalist Cart Footer */}
      {!isKeyboardVisible && cart.length > 0 && (
        <View style={styles.floatingCartWrap}>
          <TouchableOpacity style={styles.floatingCart} activeOpacity={0.9} onPress={onOpenCart}>
            <View>
              <Text style={styles.cartItemsCount}>
                {cart.length} ITEM{cart.length > 1 ? 'S' : ''} ADDED
              </Text>
              <Text style={styles.cartTotalPrice}>₹{cartTotal}</Text>
            </View>
            <View style={styles.cartCheckoutBtn}>
              <Text style={styles.cartCheckoutText}>Checkout</Text>
              <View style={styles.cartArrowCircle}>
                <ArrowRight size={20} color={COLORS.black} strokeWidth={3} />
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
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradientWrap: {
    width: '100%',
    backgroundColor: '#061E38',
    position: 'relative',
    overflow: 'hidden',
  },
  headerInner: {
    paddingHorizontal: SPACING.mobile,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: '#B0FF49',
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  greetingText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: '#90CAF9',
    letterSpacing: 0.2,
  },
  userNameText: {
    fontSize: 20,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  bellWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1.5,
    borderColor: '#194B7E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderWidth: 1.5,
    borderColor: '#194B7E',
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: COLORS.white,
  },
  searchMicWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  micBtn: {
    padding: 2,
  },
  clearSearchBtn: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: RADIUS.full,
  },
  serviceTabsScroll: {
    marginHorizontal: -SPACING.mobile,
    marginTop: 4,
  },
  serviceTabsContent: {
    paddingHorizontal: SPACING.mobile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 2,
  },
  serviceTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
    paddingVertical: 4,
  },
  serviceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 3,
  },
  serviceIconWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  newBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  newBadgeText: {
    fontSize: 8,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  serviceTabLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  serviceTabLabelActive: {
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
  },
  serviceTabLabelInactive: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#90CAF9',
  },
  activeUnderline: {
    width: 28,
    height: 3,
    backgroundColor: COLORS.white,
    borderRadius: 2,
    marginTop: 4,
  },
  inactiveUnderlinePlaceholder: {
    width: 28,
    height: 3,
    marginTop: 4,
  },
  headerSeparatorLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 6,
    marginBottom: 10,
  },
  promoCarousel: {
    paddingHorizontal: SPACING.mobile,
    gap: SPACING.md,
    marginBottom: 4,
  },
  luxuryPromoCard: {
    width: 290,
    backgroundColor: '#0A3158',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: RADIUS.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    ...NEO_SHADOW.box4,
  },
  goldCornerBox: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    borderRadius: RADIUS.xl - 3,
  },
  cornerFlourish: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: '#D4AF37',
    borderWidth: 1.5,
    borderRadius: 2,
  },
  promoBadgeGold: {
    backgroundColor: '#EAB308',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  promoBadgeGoldText: {
    color: COLORS.black,
    fontSize: 9,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.3,
  },
  luxuryPromoTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    fontStyle: 'italic',
  },
  luxuryPromoSub: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#DBEAFE',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  expressPromoCard: {
    width: 290,
    borderRadius: RADIUS.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7DD3FC',
    ...NEO_SHADOW.box4,
  },
  expressInnerBorder: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: RADIUS.xl - 3,
  },
  promoBadgeExpress: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  promoBadgeExpressText: {
    color: '#0284C7',
    fontSize: 9,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.3,
  },
  expressPromoTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
  },
  expressPromoSub: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#E0F2FE',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  expressPromoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.white,
    borderWidth: 2.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  wavePartitionWrap: {
    width: SCREEN_WIDTH,
    marginTop: 8,
    overflow: 'hidden',
  },
  bodyContent: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    paddingHorizontal: SPACING.mobile,
    paddingTop: 4,
    paddingBottom: 24,
  },
  liveTrackingCard: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...NEO_SHADOW.box6,
  },
  liveTrackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.black,
  },
  liveTrackingTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  orderIdBadge: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.black,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  trackerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingVertical: SPACING.md,
    paddingHorizontal: 4,
    ...NEO_SHADOW.box4,
  },
  trackerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  trackerStep: {
    alignItems: 'center',
    width: 50,
  },
  stepIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.black,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#4B5563',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  sectionHeaderWrap: {
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  sectionSubheading: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  catCard: {
    width: '47.5%',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    padding: 12,
    ...NEO_SHADOW.box4,
    justifyContent: 'space-between',
    minHeight: 184,
  },
  badgeWrap: {
    alignItems: 'flex-start',
  },
  catBadge: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  catBadgeText: {
    fontSize: 9,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  catImgWrap: {
    height: 90,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xs,
  },
  catFooter: {
    borderTopWidth: 1.5,
    borderTopColor: COLORS.black,
    paddingTop: 8,
    marginTop: 4,
  },
  catName: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  searchSectionWrap: {
    marginBottom: SPACING.md,
  },
  matchingItemsList: {
    gap: 10,
  },
  searchItemCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...NEO_SHADOW.box2,
  },
  searchItemImgBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  searchItemImg: {
    width: '100%',
    height: '100%',
  },
  searchItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchItemName: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
  searchItemCatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  searchItemCatText: {
    fontSize: 8,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  searchItemPrice: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.primary,
    marginTop: 2,
  },
  searchItemAction: {
    marginLeft: 8,
  },
  searchAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...NEO_SHADOW.box2,
  },
  searchAddText: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  searchQtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.black,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  searchQtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchQtyText: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    minWidth: 14,
    textAlign: 'center',
  },
  emptySearchWrap: {
    padding: SPACING.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
  emptySearchSub: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  clearSearchBtnFull: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    ...NEO_SHADOW.box2,
  },
  clearSearchBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  emptyStateWrap: {
    padding: SPACING.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  emptyStateText: {
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
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
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cartArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
