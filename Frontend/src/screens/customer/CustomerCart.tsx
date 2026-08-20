import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, MapPin, Receipt, CheckCircle2, ShoppingBag, Navigation, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { EmptyState } from '../../components/EmptyState';

interface CustomerCartProps {
  onBack: () => void;
  onCheckoutSuccess: () => void;
}

export const CustomerCartScreen: React.FC<CustomerCartProps> = ({ onBack, onCheckoutSuccess }) => {
  const { cart, addToCart, placeOrder, currentUser, currentTenantId, shops, activeCoupon } = useAppStore();
  const insets = useSafeAreaInsets();

  const shop = shops.find(s => s._id === currentTenantId);
  const isClosed = shop?.isOpen === false;

  const [selectedPrefs, setSelectedPrefs] = React.useState<string[]>([]);
  const activeWashPreferences = shop?.washPreferences?.filter(wp => selectedPrefs.includes(wp.id)) || [];
  const washPrefsCost = activeWashPreferences.reduce((sum, wp) => sum + wp.price, 0);

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const taxPercent = shop?.taxPercent || 0;
  const deliveryFee = shop?.deliveryFee || 0;
  const tax = (subtotal * taxPercent) / 100;
  const discount = activeCoupon
    ? Math.min((subtotal * activeCoupon.discountPercent) / 100, activeCoupon.maxDiscount)
    : 0;
  const total = subtotal + tax + deliveryFee + washPrefsCost - discount;

  const [deliveryAddress, setDeliveryAddress] = React.useState(currentUser?.address || '');
  const [isDetectingLoc, setIsDetectingLoc] = React.useState(false);
  const DAYS = ['Today'];
  const [selectedDay, setSelectedDay] = React.useState('Today');
  const TIME_SLOTS = shop?.pickupTimings && shop.pickupTimings.length > 0 ? shop.pickupTimings : ['08:00 AM - 10:00 AM', '10:00 AM - 12:00 PM'];
  const INSTRUCTIONS = ['Leave at door', 'Ring bell', 'Call before arriving'];
  const [selectedSlot, setSelectedSlot] = React.useState(TIME_SLOTS[0] || '');
  const [instruction, setInstruction] = React.useState('');

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
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const data = await res.json();
              if (data && data.display_name) {
                setDeliveryAddress(data.display_name);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                alert('Could not resolve address from coordinates.');
              }
            } catch (err) {
              alert('Failed to fetch address. Please enter manually.');
            } finally {
              setIsDetectingLoc(false);
            }
          },
          (error) => {
            setIsDetectingLoc(false);
            alert('Failed to get location. Please allow location permissions or enter manually.');
          },
          { timeout: 8000, maximumAge: 60000 }
        );
      } else {
        // Native Location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access location was denied. Please enable it in settings.');
          setIsDetectingLoc(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          const addressString = [place.name, place.street, place.subregion, place.city, place.region, place.postalCode, place.country]
            .filter(Boolean)
            .join(', ');
          setDeliveryAddress(addressString);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          alert('Could not resolve your physical address.');
        }
        setIsDetectingLoc(false);
      }
    } catch (error) {
      setIsDetectingLoc(false);
      alert('An error occurred while fetching your location.');
    }
  };

  const handleCheckout = async () => {
    if (isClosed) {
      alert('This branch is currently closed and not accepting orders.');
      return;
    }
    if (!deliveryAddress.trim()) {
      alert('Please enter a delivery address');
      return;
    }
    const minOrderValue = shop?.minOrderValue || 0;
    if (subtotal < minOrderValue) {
      alert(`Minimum order value for this branch is ₹${minOrderValue}. Please add more items.`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const mappedPrefs = activeWashPreferences.map(wp => ({ name: wp.name, price: wp.price }));
    const result = await placeOrder(deliveryAddress, `${selectedDay} | ${selectedSlot}`, mappedPrefs);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCheckoutSuccess();
    } else {
      alert(result.message || 'Checkout failed');
    }
  };

  if (cart.length === 0) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top + SPACING.sm, SPACING.xl) }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
          <Text style={[TYPO.titleLg, { color: COLORS.onSurface }]}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        <EmptyState 
          icon={ShoppingBag} 
          title="Your cart is empty" 
          subtitle="Looks like you haven't added any laundry items yet." 
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + SPACING.sm, SPACING.xl) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, flex: 1, textAlign: 'center', fontWeight: '800', marginRight: 40 }]}>
          Checkout
        </Text>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isClosed && (
          <View style={styles.closedWarningCard}>
            <View style={styles.closedWarningHeader}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>🚨</Text>
              <Text style={[TYPO.titleLg, { color: COLORS.error, fontWeight: '800' }]}>Branch is Currently Closed</Text>
            </View>
            <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, marginTop: 4, lineHeight: 20 }]}>
              This branch ("{shop?.name || 'WOW Express'}") is temporarily closed. You cannot place new orders until this branch re-opens.
            </Text>
          </View>
        )}

        {shop?.instructions ? (
          <View style={styles.card}>
            <View style={[styles.cardRow, { alignItems: 'flex-start' }]}>
              <MessageSquare size={20} color={COLORS.secondary} style={{ marginTop: 12 }} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '700', marginBottom: 4 }]}>Shop Instructions</Text>
                <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, lineHeight: 20 }]}>{shop.instructions}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Delivery Details */}
        <View style={styles.card}>
          <View style={[styles.cardRow, { alignItems: 'flex-start' }]}>
            <MapPin size={20} color={COLORS.primary} style={{ marginTop: 12 }} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '700' }]}>Delivery Address</Text>
                <TouchableOpacity onPress={handleAutoDetect} disabled={isDetectingLoc} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(96, 74, 192, 0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm }}>
                  {isDetectingLoc ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ transform: [{ scale: 0.7 }] }} />
                  ) : (
                    <Navigation size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[TYPO.labelSm, { color: COLORS.primary, fontWeight: '700' }]}>
                    {isDetectingLoc ? 'Detecting...' : 'Auto Detect'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.addressInput}
                placeholder="Enter your complete address manually..."
                placeholderTextColor={COLORS.outline}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Clock size={20} color="#10B981" style={{ marginTop: 12 }} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '700', marginBottom: 8 }]}>Pickup Date</Text>
              <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {DAYS.map(day => (
                  <TouchableOpacity 
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.chip, 
                      selectedDay === day && styles.chipActive
                    ]}
                  >
                    <Text style={[TYPO.labelSm, { color: selectedDay === day ? COLORS.onPrimary : COLORS.onSurfaceVariant }]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '700', marginTop: 16, marginBottom: 8 }]}>Pickup Time Slot</Text>
              <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {TIME_SLOTS.map(slot => (
                  <TouchableOpacity 
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    style={[
                      styles.chip, 
                      selectedSlot === slot && styles.chipActive
                    ]}
                  >
                    <Text style={[TYPO.labelSm, { color: selectedSlot === slot ? COLORS.onPrimary : COLORS.onSurfaceVariant }]}>{slot}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={[styles.cardRow, { alignItems: 'flex-start' }]}>
            <MessageSquare size={20} color={COLORS.tertiary} style={{ marginTop: 12 }} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '700', marginBottom: 8 }]}>Delivery Instructions</Text>
              <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {INSTRUCTIONS.map(inst => (
                  <TouchableOpacity 
                    key={inst}
                    onPress={() => setInstruction(inst)}
                    style={[
                      styles.chip, 
                      instruction === inst && { backgroundColor: COLORS.tertiary, borderColor: COLORS.tertiary }
                    ]}
                  >
                    <Text style={[TYPO.labelSm, { color: instruction === inst ? COLORS.onPrimary : COLORS.onSurfaceVariant }]}>{inst}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '800', marginBottom: SPACING.md }]}>Item Summary</Text>
          {cart.map((item, index) => (
            <View key={item.itemId} style={[styles.itemRow, index > 0 && { marginTop: SPACING.md }]}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🧺</Text>
              <View style={{ flex: 1 }}>
                <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>{item.name}</Text>
                <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>₹{item.price} / {item.unit}</Text>
              </View>
              <View style={styles.counterBox}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => addToCart({ _id: item.itemId } as any, -1)}>
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={[TYPO.labelLg, { color: COLORS.primary, fontWeight: '800', marginHorizontal: 8 }]}>{item.quantity}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => addToCart({ _id: item.itemId, pricePerKg: item.unit === 'KG' ? item.price : undefined, pricePerItem: item.unit === 'ITEM' ? item.price : undefined } as any, 1)}>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={[TYPO.labelLg, { color: COLORS.onSurface, width: 60, textAlign: 'right', fontWeight: '700' }]}>
                ₹{item.price * item.quantity}
              </Text>
            </View>
          ))}
        </View>

        {/* Wash Preferences */}
        {shop?.washPreferences && shop.washPreferences.length > 0 && (
          <View style={styles.card}>
            <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '800', marginBottom: SPACING.md }]}>Wash Preferences</Text>
            {shop.washPreferences.map(wp => {
              const isActive = selectedPrefs.includes(wp.id);
              return (
                <TouchableOpacity 
                  key={wp.id} 
                  style={[styles.prefOption, isActive && styles.prefOptionActive]}
                  onPress={() => {
                    if (isActive) {
                      setSelectedPrefs(prev => prev.filter(id => id !== wp.id));
                    } else {
                      setSelectedPrefs(prev => [...prev, wp.id]);
                    }
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPO.labelLg, { color: isActive ? COLORS.primary : COLORS.onSurface }]}>{wp.name}</Text>
                    {wp.description ? <Text style={[TYPO.labelSm, { color: COLORS.outline, marginTop: 4 }]}>{wp.description}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>+₹{wp.price}</Text>
                    {isActive && <CheckCircle2 size={16} color={COLORS.primary} style={{ marginTop: 4 }} />}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Bill Details */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
            <Receipt size={20} color={COLORS.onSurface} />
            <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '800', marginLeft: 8 }]}>Bill Details</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>Item Total</Text>
            <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>₹{subtotal}</Text>
          </View>
          {deliveryFee > 0 && (
            <View style={styles.billRow}>
              <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>Delivery Fee</Text>
              <Text style={[TYPO.labelMd, { color: COLORS.onSurface }]}>₹{deliveryFee}</Text>
            </View>
          )}
          {activeWashPreferences.map(wp => (
            <View key={wp.id} style={styles.billRow}>
              <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>{wp.name}</Text>
              <Text style={[TYPO.labelMd, { color: COLORS.onSurface }]}>₹{wp.price.toFixed(2)}</Text>
            </View>
          ))}
          {taxPercent > 0 && (
            <View style={styles.billRow}>
              <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant }]}>Taxes & Charges ({taxPercent}%)</Text>
              <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>₹{tax.toFixed(2)}</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={styles.billRow}>
              <Text style={[TYPO.labelMd, { color: '#10B981', fontWeight: '700' }]}>
                {activeCoupon?.code ? `Promo (${activeCoupon.code})` : 'Promo Applied'}
              </Text>
              <Text style={[TYPO.labelLg, { color: '#10B981' }]}>- ₹{discount.toFixed(2)}</Text>
            </View>
          )}

          <View style={[styles.divider, { marginVertical: SPACING.sm }]} />
          <View style={styles.billRow}>
            <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '800' }]}>Grand Total</Text>
            <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, fontWeight: '800' }]}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={[TYPO.labelSm, { color: COLORS.primary }]}>Pay via UPI / Cash</Text>
          <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, fontWeight: '800' }]}>₹{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.checkoutBtn, 
            (!deliveryAddress.trim() || isClosed) && { backgroundColor: COLORS.surfaceContainerHighest, opacity: 0.7 }
          ]} 
          onPress={handleCheckout} 
          activeOpacity={0.9}
          disabled={!deliveryAddress.trim() || isClosed || (subtotal < (shop?.minOrderValue || 0))}
        >
          <Text style={[
            TYPO.labelLg, 
            { 
              color: isClosed ? COLORS.onSurfaceVariant : COLORS.onPrimary, 
              fontWeight: '800', 
              marginRight: 8 
            }
          ]}>
            {isClosed ? 'Shop Closed' : 'Place Order'}
          </Text>
          <CheckCircle2 size={20} color={isClosed ? COLORS.onSurfaceVariant : COLORS.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Slightly gray background to make cards pop
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.mobile,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    ...SHADOW.ambient,
    zIndex: 10,
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
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.ambient,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceContainerHighest,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOW.glow(COLORS.primary),
  },
  prefOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
    backgroundColor: COLORS.surfaceContainerLowest,
    marginBottom: SPACING.sm,
  },
  prefOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  divider: {
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: COLORS.surfaceContainerHighest,
    marginVertical: 12,
    height: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  counterBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: SPACING.mobile,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainer,
    ...SHADOW.ambient,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    ...SHADOW.glow(COLORS.primary),
  },
  addBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  addressInput: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    color: COLORS.onSurface,
    ...TYPO.bodyMd,
    minHeight: 60,
    textAlignVertical: 'top',
    outlineWidth: 0,
  } as any,
  closedWarningCard: {
    backgroundColor: COLORS.errorContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    ...SHADOW.ambient,
  },
  closedWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});
