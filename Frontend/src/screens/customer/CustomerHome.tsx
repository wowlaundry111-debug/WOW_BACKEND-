import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Keyboard, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Search, ChevronDown, Sparkles, Shirt, Snowflake, Bed, Package, Home as HomeIcon, Leaf } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW, GLASS, GRADIENTS } from '../../components/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBadge } from '../../components/UIPack';
import { useAppStore } from '../../store/useAppStore';
import { CategorySkeleton } from '../../components/SkeletonLoaders';
import { NotificationBell } from '../../components/NotificationBell';

const CATEGORY_STYLES_MAP: Record<string, { Icon: any; bg: string; color: string; badge: string; gradient: string[]; border: string }> = {
  'Men Wear':          { Icon: Shirt,            bg: 'rgba(59, 130, 246, 0.08)',  color: '#0284C7', badge: '50% OFF',  gradient: ['#EFF6FF', '#DBEAFE'], border: 'rgba(59, 130, 246, 0.15)' },
  'Women Wear':        { Icon: Sparkles,         bg: 'rgba(236, 72, 153, 0.08)', color: '#DB2777', badge: 'Sale',       gradient: ['#FDF2F8', '#FCE7F3'], border: 'rgba(236, 72, 153, 0.15)' },
  'Winter Wear':       { Icon: Snowflake,        bg: 'rgba(249, 115, 22, 0.08)',  color: '#D97706', badge: 'Save ₹99',  gradient: ['#FFF7ED', '#FFEDD5'], border: 'rgba(249, 115, 22, 0.15)' },
  'Bedsheets & Linen': { Icon: Bed,              bg: 'rgba(16, 185, 129, 0.08)',  color: '#059669', badge: 'Express',    gradient: ['#ECFDF5', '#D1FAE5'], border: 'rgba(16, 185, 129, 0.15)' },
  'Apparel Dryclean':  { Icon: Package,          bg: 'rgba(75, 85, 99, 0.08)',    color: '#4B5563', badge: 'Sanitized',  gradient: ['#EEF2F6', '#E2E8F0'], border: 'rgba(75, 85, 99, 0.15)' },
  'Home & Curtains':   { Icon: HomeIcon,         bg: 'rgba(124, 58, 237, 0.08)',  color: '#7C3AED', badge: 'Premium',    gradient: ['#F5F3FF', '#EDE9FE'], border: 'rgba(124, 58, 237, 0.15)' },
  'Eco Wash & Fold':   { Icon: Leaf,             bg: 'rgba(34, 197, 94, 0.08)',   color: '#16A34A', badge: 'Eco Safe',   gradient: ['#F0FDF4', '#DCFCE7'], border: 'rgba(34, 197, 94, 0.15)' },
};

const getCategoryStyle = (name: string) =>
  CATEGORY_STYLES_MAP[name] ?? {
    Icon: Shirt,
    bg: 'rgba(0, 168, 232, 0.08)',
    color: COLORS.primary,
    badge: 'Care+',
    gradient: ['#F3F4F6', '#E5E7EB'],
    border: 'rgba(0, 168, 232, 0.15)'
  };

interface CustomerHomeProps {
  onCategoryPress: (categoryId: string) => void;
  onOpenCart: () => void;
}

export const CustomerHomeScreen: React.FC<CustomerHomeProps> = ({ onCategoryPress, onOpenCart }) => {
  const insets = useSafeAreaInsets();
  const { categories, items, currentTenantId, cart, isLoading, currentUser, orders, fetchCatalog, fetchOrders } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCatalog(), fetchOrders()]);
    setRefreshing(false);
  }, [fetchCatalog, fetchOrders]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const tenantCats = categories.filter(c => {
    if (c.shopId !== currentTenantId) return false;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    if (c.name.toLowerCase().includes(query)) return true;
    
    // Check if any item in this category matches the search query
    const hasMatchingItem = items.some(
      item => item.categoryId === c._id && item.name.toLowerCase().includes(query)
    );
    return hasMatchingItem;
  });

  const activeOrder = orders.find(o => o.customerId === currentUser?._id && o.status !== 'DELIVERED');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const ORDER_STEPS = [
    { key: 'PLACED', label: 'Placed', icon: '📝' },
    { key: 'ACCEPTED', label: 'Accepted', icon: '👍' },
    { key: 'WASHING', label: 'Wash', icon: '🫧' },
    { key: 'IRONING', label: 'Press', icon: '💨' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out', icon: '🛵' },
    { key: 'DELIVERED', label: 'Done', icon: '🎁' }
  ];

  const activeStepIndex = activeOrder ? ORDER_STEPS.findIndex(s => s.key === activeOrder.status) : -1;

  return (
    <View style={styles.root}>
      {/* Frosted Elite Header */}
      <View style={[styles.header, { paddingTop: (insets.top > 0 ? insets.top : 47) + 12 }]}>
        <View style={styles.locationBlock}>
          <View style={styles.profileAvatar}>
            <LinearGradient
              colors={GRADIENTS.primary as any}
              style={StyleSheet.absoluteFill}
            />
            <Text style={{ fontSize: 16, color: '#FFF', fontWeight: '800' }}>
              {currentUser?.name?.charAt(0).toUpperCase() ?? '👤'}
            </Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[TYPO.labelSm, { color: COLORS.outline, fontWeight: '700', letterSpacing: 0.5 }]}>
              {getGreeting().toUpperCase()}
            </Text>
            <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, fontWeight: '800', marginTop: 2 }]}>
              {currentUser?.name || 'Guest'} 👋
            </Text>
          </View>

          <View style={{ marginLeft: 8 }}>
            <NotificationBell />
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clothes, dry cleaning, pressing..."
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
        
        {/* Active Order Live Tracking Widget (Blinkit style step tracker) */}
        {activeOrder && (
          <View style={styles.activeOrderWidget}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.pulsingDot} />
                <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '800', marginLeft: 8 }]}>
                  Order Live Tracking
                </Text>
              </View>
              <Text style={[TYPO.labelSm, { color: COLORS.primary, fontWeight: '700' }]}>
                ID: #{activeOrder._id.slice(-6).toUpperCase()}
              </Text>
            </View>

            {/* Visual Step-by-Step progress */}
            <View style={styles.trackerProgressContainer}>
              <View style={styles.trackerStepRow}>
                {ORDER_STEPS.map((step, idx) => {
                  const isCompleted = idx <= activeStepIndex;
                  const isActive = idx === activeStepIndex;
                  return (
                    <React.Fragment key={step.key}>
                      <View style={styles.trackerStepCell}>
                        <View style={[
                          styles.trackerStepIconBox,
                          isCompleted && styles.trackerStepIconBoxDone,
                          isActive && styles.trackerStepIconBoxActive
                        ]}>
                          <Text style={{ fontSize: 13 }}>{step.icon}</Text>
                        </View>
                        <Text style={[
                          styles.trackerStepLabel,
                          isCompleted && { color: COLORS.primary, fontWeight: '800' }
                        ]}>
                          {step.label}
                        </Text>
                      </View>
                      {idx < ORDER_STEPS.length - 1 && (
                        <View style={[
                          styles.trackerStepConnector,
                          idx < activeStepIndex && styles.trackerStepConnectorDone
                        ]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Promotional Banner Carousel (Edge-to-Edge scrolling with zero left/right clipping) */}
        <ScrollView keyboardShouldPersistTaps="handled" 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ marginHorizontal: -SPACING.mobile }}
          contentContainerStyle={{ paddingHorizontal: SPACING.mobile, gap: SPACING.md, marginBottom: SPACING.xl }}
        >
          <LinearGradient
            colors={GRADIENTS.primary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoBanner}
          >
            <View style={{ flex: 1 }}>
              <Text style={[TYPO.headlineLg, { color: COLORS.onPrimary, fontWeight: '900' }]}>50% OFF</Text>
              <Text style={[TYPO.bodyMd, { color: 'rgba(255,255,255,0.95)', marginTop: 4, fontWeight: '600' }]}>
                Winter Wear Deep Dryclean
              </Text>
            </View>
            <Text style={{ fontSize: 44, opacity: 0.9 }}>🧥</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={GRADIENTS.secondary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoBanner}
          >
            <View style={{ flex: 1 }}>
              <Text style={[TYPO.headlineLg, { color: COLORS.onPrimary, fontWeight: '900' }]}>FREE DELIVERY</Text>
              <Text style={[TYPO.bodyMd, { color: 'rgba(255,255,255,0.95)', marginTop: 4, fontWeight: '600' }]}>
                Zero delivery fee this week
              </Text>
            </View>
            <Text style={{ fontSize: 44, opacity: 0.9 }}>⚡</Text>
          </LinearGradient>
        </ScrollView>

        {/* Category Grid (Bento style) */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 26, marginRight: 10 }}>✨</Text>
            <Text style={[TYPO.headlineLg, { color: COLORS.primary, fontWeight: '900', letterSpacing: -0.5 }]}>
              Start Washing
            </Text>
          </View>
          <Text style={[TYPO.bodyMd, { color: COLORS.outline, marginLeft: 38, fontWeight: '500' }]}>
            Pick a category to begin your order
          </Text>
        </View>

        <View style={styles.grid}>
          {isLoading ? (
            <>
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
            </>
          ) : (
            tenantCats.map((cat, index) => {
              const style = getCategoryStyle(cat.name);
              const IconComponent = style.Icon;
              return (
                <TouchableOpacity 
                  key={cat._id} 
                  style={[styles.catCard, { backgroundColor: style.gradient[0], borderColor: style.border }]} 
                  activeOpacity={0.85} 
                  onPress={() => onCategoryPress(cat._id)}
                >
                  <View style={styles.catCardTop}>
                    <View style={[styles.catIconBox, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: style.border }]}>
                      <IconComponent size={22} color={style.color} />
                    </View>
                    <View style={[styles.microBadge, { backgroundColor: style.color + '15', borderWidth: 0.5, borderColor: style.border }]}>
                      <Text style={[styles.microBadgeText, { color: style.color }]}>{style.badge}</Text>
                    </View>
                  </View>
                  <Text style={[TYPO.titleLg, { color: COLORS.onSurface, marginTop: SPACING.sm, fontWeight: '800' }]}>
                    {cat.name}
                  </Text>
                  <Text style={[TYPO.labelSm, { color: COLORS.onSurfaceVariant, fontSize: 11, marginTop: 4 }]}>
                    {cat.name.includes('Wear') ? 'Clean & Fresh Care' : 'Deep Fabric Clean'}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Dynamic Floating Cart Footer */}
      {!isKeyboardVisible && cart.length > 0 && (
        <View style={styles.floatingCartWrap}>
          <TouchableOpacity style={styles.floatingCart} activeOpacity={0.9} onPress={onOpenCart}>
            <View>
              <Text style={[TYPO.labelSm, { color: 'rgba(255,255,255,0.85)', fontWeight: '700' }]}>
                {cart.length} ITEM{cart.length > 1 ? 'S' : ''} ADDED
              </Text>
              <Text style={[TYPO.headlineMd, { color: COLORS.onPrimary, fontWeight: '900' }]}>
                ₹{cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[TYPO.labelLg, { color: COLORS.onPrimary, marginRight: 8, fontWeight: '800' }]}>
                View Basket
              </Text>
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
    backgroundColor: COLORS.surfaceContainerLowest, // Pure white for customer app feel
  },
  header: {
    paddingHorizontal: SPACING.mobile,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    ...SHADOW.ambient,
    zIndex: 10,
  },
  locationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...SHADOW.ambient,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  premiumBadgeText: {
    ...TYPO.labelXs,
    color: '#D97706',
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
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
  scrollContent: {
    padding: SPACING.mobile,
    paddingBottom: 140, // Space for floating cart
  },
  activeOrderWidget: {
    backgroundColor: 'rgba(124, 58, 237, 0.04)',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.12)',
    ...SHADOW.ambient,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    ...SHADOW.glow('#10B981'),
  },
  trackerProgressContainer: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
  },
  trackerStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  trackerStepCell: {
    alignItems: 'center',
    flex: 1,
    zIndex: 2,
  },
  trackerStepIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trackerStepIconBoxDone: {
    backgroundColor: 'rgba(0, 168, 232, 0.08)',
    borderColor: COLORS.primary,
  },
  trackerStepIconBoxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOW.glow(COLORS.primary),
  },
  trackerStepLabel: {
    ...TYPO.labelXs,
    fontSize: 9,
    color: COLORS.outline,
    marginTop: 4,
    textAlign: 'center',
  },
  trackerStepConnector: {
    height: 3,
    backgroundColor: COLORS.surfaceContainerHigh,
    flex: 1,
    marginHorizontal: -16,
    marginTop: -16,
    zIndex: 1,
  },
  trackerStepConnectorDone: {
    backgroundColor: COLORS.primary,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    width: 290,
    ...SHADOW.ambient,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  catCard: {
    width: '48.5%', // Premium 2 columns Bento style
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceContainer,
    ...SHADOW.ambient,
  },
  catCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  catIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: RADIUS.sm,
  },
  microBadgeText: {
    ...TYPO.labelXs,
    fontSize: 9,
    fontWeight: '800',
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
    paddingVertical: SPACING.md + 2,
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
});
