import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import {
  ArrowLeft,
  Trash2,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  Tag,
  AlertTriangle,
  Home,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Plus,
  Minus,
  Check,
  ArrowRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';

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

interface CustomerCartProps {
  onBack: () => void;
  onCheckoutSuccess: () => void;
}

export const CustomerCartScreen: React.FC<CustomerCartProps> = ({ onBack, onCheckoutSuccess }) => {
  const insets = useSafeAreaInsets();
  const {
    cart,
    addToCart,
    clearCart,
    placeOrder,
    currentUser,
    currentTenantId,
    shops,
    activeCoupon,
    applyCoupon,
    removeCoupon,
  } = useAppStore();

  const shop = shops.find((s) => s._id === currentTenantId);
  const isClosed = shop?.isOpen === false;

  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  
  const defaultWashPrefs = [
    { id: 'extra_softener', name: 'Extra Fabric Softener', description: 'Delicate lavender scent & plush softness', price: 20, enabled: true },
    { id: 'anti_bacterial', name: 'Anti-Bacterial Sanitization', description: 'Deep hygiene rinse eliminating 99.9% germs', price: 30, enabled: true },
    { id: 'stain_booster', name: 'Stain Remover Booster', description: 'Spot treatment for tough grease & collar marks', price: 40, enabled: true }
  ];
  const availableWashPrefs = (shop?.washPreferences && shop.washPreferences.length > 0 ? shop.washPreferences : defaultWashPrefs).filter(p => p.enabled !== false);
  const activeWashPreferences = availableWashPrefs.filter((wp) => selectedPrefs.includes(wp.id));
  const washPrefsCost = activeWashPreferences.reduce((sum, wp) => sum + wp.price, 0);

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const taxPercent = shop?.taxPercent || 5;
  const deliveryFee = subtotal > 500 ? 0 : (shop?.deliveryFee || 50);
  const tax = (subtotal * taxPercent) / 100;
  const discount = activeCoupon
    ? Math.min((subtotal * activeCoupon.discountPercent) / 100, activeCoupon.maxDiscount)
    : 0;
  const total = subtotal + tax + deliveryFee + washPrefsCost - discount;

  // Structured Precise Delivery Address
  const [addrTag, setAddrTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [flatNo, setFlatNo] = useState('');
  const [area, setArea] = useState('');
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);

  useEffect(() => {
    if (currentUser?.address) {
      const raw = currentUser.address;
      if (raw.includes('(Work)')) setAddrTag('Work');
      else if (raw.includes('(Other)')) setAddrTag('Other');
      else setAddrTag('Home');

      const clean = raw.replace(/\((Home|Work|Other)\)/, '').trim();
      const parts = clean.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        setFlatNo(parts[0].replace(/^(Flat|House|Flat\/House|House\/Flat)\s*:?/i, '').trim());
        setArea(parts.slice(1).join(', '));
      } else {
        setArea(clean);
      }
    }
  }, [currentUser]);

  const getComputedAddress = () => {
    const parts = [
      flatNo.trim() ? (flatNo.trim().toLowerCase().startsWith('flat') || flatNo.trim().toLowerCase().startsWith('house') ? flatNo.trim() : `Flat/House: ${flatNo.trim()}`) : '',
      area.trim() ? area.trim() : '',
    ].filter(Boolean);

    if (parts.length === 0) return '';
    return `${parts.join(', ')} (${addrTag})`;
  };

  const [selectedDay, setSelectedDay] = useState('Today');
  const TIME_SLOTS =
    shop?.pickupTimings && shop.pickupTimings.length > 0
      ? shop.pickupTimings
      : ['08:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '02:00 PM - 04:00 PM', '06:00 PM - 08:00 PM'];
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0] || '08:00 AM - 10:00 AM');
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleAutoDetect = async () => {
    setIsDetectingLoc(true);
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser');
          setIsDetectingLoc(false);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await res.json();
              if (data && data.address) {
                const addr = data.address;
                setArea(addr.suburb || addr.neighbourhood || addr.road || data.display_name.slice(0, 40));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else if (data && data.display_name) {
                setArea(data.display_name);
              }
            } catch {
              alert('Failed to resolve address. Please enter details manually.');
            } finally {
              setIsDetectingLoc(false);
            }
          },
          () => {
            setIsDetectingLoc(false);
            alert('Location permission denied.');
          }
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setIsDetectingLoc(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo) {
        const parts = [geo.name, geo.street, geo.district, geo.city].filter(Boolean);
        setArea(parts.join(', '));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      alert('Unable to fetch GPS address.');
    } finally {
      setIsDetectingLoc(false);
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const res = applyCoupon(couponCode.trim().toUpperCase());
    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCouponMsg({ type: 'success', text: res.message });
      setCouponCode('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCouponMsg({ type: 'error', text: res.message });
    }
  };

  const togglePreference = (prefId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPrefs((prev) =>
      prev.includes(prefId) ? prev.filter((p) => p !== prefId) : [...prev, prefId]
    );
  };

  const handlePlaceOrder = async () => {
    if (isClosed) {
      alert('This laundry branch is currently closed and not accepting new orders.');
      return;
    }

    const finalAddress = getComputedAddress();
    if (!finalAddress.trim()) {
      alert('Please enter your precise delivery address before proceeding.');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const mappedPrefs = activeWashPreferences.map((wp) => ({ name: wp.name, price: wp.price }));
    const pickupSlot = `${selectedDay} | ${selectedSlot}`;
    const result = await placeOrder(finalAddress, pickupSlot, mappedPrefs);
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCheckoutSuccess();
    } else {
      alert(result.message || 'Checkout failed');
    }
  };

  // ─── Empty Cart Screen ───────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" backgroundColor="#061E38" translucent />
        <LinearGradient
          colors={['#061E38', '#0A2B4C', '#0E3A66', '#082340']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerHero, { paddingTop: (insets.top > 0 ? insets.top : 44) + 6 }]}
        >
          <View style={styles.headerTopRow}>
            <BouncyCard onPress={onBack} contentStyle={styles.backBtn}>
              <ArrowLeft size={20} color={COLORS.black} strokeWidth={3} />
            </BouncyCard>
            <Text style={styles.headerTitleText}>CHECKOUT</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Trash2 size={48} color={COLORS.black} strokeWidth={2.5} />
          </View>
          <Text style={styles.emptyTitle}>YOUR CART IS EMPTY</Text>
          <Text style={styles.emptySub}>
            Looks like you haven't added any laundry items to your cart yet.
          </Text>
          <BouncyCard onPress={onBack} contentStyle={styles.startShoppingBtn}>
            <Text style={styles.startShoppingBtnText}>START SHOPPING</Text>
          </BouncyCard>
        </View>
      </View>
    );
  }

  // ─── Filled Cart / Checkout Screen ───────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor="#061E38" translucent />

      {/* Top Overscroll Blue Background Filler */}
      <View style={styles.topOverscrollFiller} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
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
              <Text style={styles.greetingText}>ORDER REVIEW</Text>
              <Text style={styles.headerTitleText}>Checkout</Text>
            </View>

            <BouncyCard onPress={clearCart} contentStyle={styles.clearBtn}>
              <Text style={styles.clearBtnText}>CLEAR ALL</Text>
            </BouncyCard>
          </View>

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
          {isClosed && (
            <View style={styles.closedCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <AlertTriangle size={20} color={COLORS.black} strokeWidth={2.5} />
                <Text style={styles.closedCardTitle}>BRANCH CLOSED</Text>
              </View>
              <Text style={styles.closedCardSub}>
                This branch ("{shop?.name || 'WOW Express'}") is currently closed. New orders cannot be placed.
              </Text>
            </View>
          )}

          {/* 1. Precise Delivery Address Card */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPin size={18} color={COLORS.black} strokeWidth={2.5} />
                <Text style={styles.cardHeading}>DELIVERY ADDRESS</Text>
              </View>
              <BouncyCard
                onPress={handleAutoDetect}
                disabled={isDetectingLoc}
                contentStyle={styles.detectBtn}
              >
                {isDetectingLoc ? (
                  <ActivityIndicator size="small" color={COLORS.black} />
                ) : (
                  <>
                    <Navigation size={12} color={COLORS.black} strokeWidth={2.5} />
                    <Text style={styles.detectBtnText}>AUTODETECT</Text>
                  </>
                )}
              </BouncyCard>
            </View>

            {/* Address Tag Selector */}
            <View style={styles.tagSelectorRow}>
              {([
                { tag: 'Home', label: 'HOME', icon: Home },
                { tag: 'Work', label: 'WORK', icon: Briefcase },
                { tag: 'Other', label: 'OTHER', icon: MapPin },
              ] as const).map(({ tag, label, icon: IconComponent }) => {
                const isSelected = addrTag === tag;
                return (
                  <BouncyCard
                    key={tag}
                    style={{ flex: 1 }}
                    contentStyle={[styles.tagPill, isSelected && styles.tagPillActive]}
                    onPress={() => setAddrTag(tag)}
                  >
                    <IconComponent
                      size={12}
                      color={isSelected ? COLORS.black : '#6B7280'}
                      strokeWidth={2.5}
                    />
                    <Text style={[styles.tagPillText, isSelected && styles.tagPillTextActive]}>
                      {label}
                    </Text>
                  </BouncyCard>
                );
              })}
            </View>

            {/* Field 1: Flat / House No / Building */}
            <View style={styles.cartInputGroup}>
              <Text style={styles.cartInputLabel}>HOUSE / FLAT / BUILDING</Text>
              <TextInput
                style={styles.cartInput}
                placeholder="e.g. Flat 402, Palm Heights"
                placeholderTextColor="#9CA3AF"
                value={flatNo}
                onChangeText={setFlatNo}
              />
            </View>

            {/* Field 2: Area / Street / Landmark */}
            <View style={[styles.cartInputGroup, { marginBottom: 0 }]}>
              <Text style={styles.cartInputLabel}>AREA, STREET & CITY</Text>
              <TextInput
                style={styles.cartInput}
                placeholder="e.g. 100ft Road, Near Metro, Indiranagar"
                placeholderTextColor="#9CA3AF"
                value={area}
                onChangeText={setArea}
              />
            </View>
          </View>

          {/* 2. Pickup Slot Selector */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={18} color={COLORS.black} strokeWidth={2.5} />
                <Text style={styles.cardHeading}>PICKUP SLOT</Text>
              </View>
            </View>

            <View style={styles.timeSlotGrid}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <BouncyCard
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    contentStyle={[styles.slotPill, isSelected && styles.slotPillActive]}
                  >
                    <Text style={[styles.slotPillText, isSelected && styles.slotPillTextActive]}>
                      {slot}
                    </Text>
                  </BouncyCard>
                );
              })}
            </View>
          </View>

          {/* 3. Wash Add-ons & Preferences */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeading}>WASH ADD-ONS & CARE</Text>
            <Text style={styles.cardSubheading}>Optional premium wash care for your clothes</Text>

            <View style={{ gap: 8, marginTop: 10 }}>
              {availableWashPrefs.map((pref) => {
                const isSelected = selectedPrefs.includes(pref.id);
                return (
                  <BouncyCard
                    key={pref.id}
                    onPress={() => togglePreference(pref.id)}
                    contentStyle={[styles.addonRow, isSelected && styles.addonRowActive]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addonTitle}>{pref.name}</Text>
                      <Text style={styles.addonDesc}>{pref.description}</Text>
                    </View>
                    <View style={[styles.addonPriceBadge, isSelected && styles.addonPriceBadgeActive]}>
                      <Text style={[styles.addonPriceText, isSelected && styles.addonPriceTextActive]}>
                        {isSelected ? '✓ ADDED' : `+₹${pref.price}`}
                      </Text>
                    </View>
                  </BouncyCard>
                );
              })}
            </View>
          </View>

          {/* 4. Cart Items Breakdown */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeading}>ORDER ITEMS ({cart.length})</Text>

            <View style={{ marginTop: 10 }}>
              {cart.map((item, idx) => (
                <View key={item.itemId}>
                  <View style={styles.cartItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemRate}>₹{item.price} per unit</Text>
                    </View>

                    <View style={styles.cartStepper}>
                      <TouchableOpacity
                        style={styles.cartStepperBtn}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          addToCart(
                            {
                              _id: item.itemId,
                              name: item.name,
                              pricePerItem: item.price,
                              shopId: currentTenantId || '',
                              categoryId: '',
                            } as any,
                            -1
                          );
                        }}
                      >
                        <Minus size={12} color={COLORS.black} strokeWidth={3} />
                      </TouchableOpacity>
                      <Text style={styles.cartStepperQty}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[styles.cartStepperBtn, { backgroundColor: COLORS.secondary }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          addToCart(
                            {
                              _id: item.itemId,
                              name: item.name,
                              pricePerItem: item.price,
                              shopId: currentTenantId || '',
                              categoryId: '',
                            } as any,
                            1
                          );
                        }}
                      >
                        <Plus size={12} color={COLORS.black} strokeWidth={3} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.cartItemTotal}>₹{item.price * item.quantity}</Text>
                  </View>
                  {idx < cart.length - 1 && <View style={styles.itemDivider} />}
                </View>
              ))}
            </View>
          </View>

          {/* 5. Promo Code & Bill Summary */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeading}>PROMO CODE</Text>
            <View style={styles.couponRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="ENTER COUPON CODE"
                placeholderTextColor="#9CA3AF"
                value={couponCode}
                onChangeText={(t) => setCouponCode(t.toUpperCase())}
                autoCapitalize="characters"
              />
              <BouncyCard onPress={handleApplyCoupon} contentStyle={styles.applyCouponBtn}>
                <Text style={styles.applyCouponText}>APPLY</Text>
              </BouncyCard>
            </View>
            {couponMsg.text ? (
              <Text
                style={[
                  styles.couponFeedback,
                  { color: couponMsg.type === 'success' ? '#16A34A' : '#DC2626' },
                ]}
              >
                {couponMsg.text}
              </Text>
            ) : null}

            <View style={styles.billDivider} />

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Items Subtotal</Text>
              <Text style={styles.billVal}>₹{subtotal}</Text>
            </View>
            {washPrefsCost > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Wash Add-ons</Text>
                <Text style={styles.billVal}>+₹{washPrefsCost}</Text>
              </View>
            )}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billVal}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxes & Fees</Text>
              <Text style={styles.billVal}>₹{tax.toFixed(0)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#16A34A' }]}>Discount</Text>
                <Text style={[styles.billVal, { color: '#16A34A' }]}>-₹{discount.toFixed(0)}</Text>
              </View>
            )}

            <View style={styles.grandTotalDivider} />

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TO PAY</Text>
              <Text style={styles.grandTotalVal}>₹{total.toFixed(0)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Place Order Action Bar */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        <BouncyCard
          onPress={handlePlaceOrder}
          disabled={loading || isClosed}
          contentStyle={[styles.placeOrderBtn, isClosed && { backgroundColor: '#9CA3AF' }]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.black} size="small" />
          ) : (
            <>
              <View>
                <Text style={styles.placeOrderMainText}>
                  {isClosed ? 'BRANCH CLOSED' : 'PLACE ORDER'}
                </Text>
                <Text style={styles.placeOrderSubText}>
                  {cart.length} Item{cart.length > 1 ? 's' : ''} · Standard Delivery
                </Text>
              </View>
              <View style={styles.totalPill}>
                <Text style={styles.totalPillText}>₹{total.toFixed(0)} →</Text>
              </View>
            </>
          )}
        </BouncyCard>
      </View>
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
    paddingBottom: 120,
  },
  headerHero: {
    paddingHorizontal: SPACING.mobile,
    paddingBottom: 54,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  greetingText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#90CAF9',
    letterSpacing: 0.8,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  clearBtn: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    ...NEO_SHADOW.box2,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
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
  closedCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  closedCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  closedCardSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeading: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.6,
  },
  cardSubheading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 2,
  },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  detectBtnText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  tagSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tagPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  tagPillActive: {
    backgroundColor: COLORS.secondary,
    ...NEO_SHADOW.box2,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#6B7280',
  },
  tagPillTextActive: {
    color: COLORS.black,
  },
  cartInputGroup: {
    marginBottom: 10,
  },
  cartInputLabel: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cartInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  slotPill: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slotPillActive: {
    backgroundColor: COLORS.secondary,
    ...NEO_SHADOW.box2,
  },
  slotPillText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#4B5563',
  },
  slotPillTextActive: {
    color: COLORS.black,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.lg,
    padding: 10,
  },
  addonRowActive: {
    borderColor: COLORS.black,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    ...NEO_SHADOW.box2,
  },
  addonTitle: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  addonDesc: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  addonPriceBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  addonPriceBadgeActive: {
    backgroundColor: COLORS.secondary,
  },
  addonPriceText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  addonPriceTextActive: {
    color: COLORS.black,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  cartItemRate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 1,
  },
  cartStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F3F4F6',
    padding: 2,
  },
  cartStepperBtn: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartStepperQty: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    minWidth: 14,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    minWidth: 45,
    textAlign: 'right',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  applyCouponBtn: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  applyCouponText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  couponFeedback: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  billDivider: {
    height: 1.5,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  billVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
  },
  grandTotalDivider: {
    height: 2,
    backgroundColor: COLORS.black,
    marginVertical: 8,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 2,
    borderTopColor: COLORS.black,
    paddingHorizontal: SPACING.mobile,
    paddingTop: 10,
    zIndex: 100,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.black,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    ...NEO_SHADOW.boxLime4,
  },
  placeOrderMainText: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.6,
  },
  placeOrderSubText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 2,
  },
  totalPill: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  totalPillText: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...NEO_SHADOW.box4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  startShoppingBtn: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.xl,
    ...NEO_SHADOW.box4,
  },
  startShoppingBtnText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
});
