/**
 * WOW Laundry — Admin Shop & Profile Screen
 * Premium UI/UX design:
 *  • Frosted profile header with circular avatar, edit badge, and branch indicators
 *  • Glassmorphic SettingsItem rows featuring Lucide vector icons on HSL boxes
 *  • High-fidelity visual UPI QR modal showing bordered QR visual blocks
 *  • Clean branch manager modal with glass tiles
 *  • Danger Log Out button with confirmation alert
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { MapPin, CreditCard, QrCode, Truck, LogOut, Edit2, Plus, X, CheckCircle2, ChevronRight, Building2, Store, Clock, Droplets, StoreIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, GLASS, SHADOW } from '../../components/Theme';
import { GlassCard, Button, ToggleSwitch } from '../../components/UIPack';
import { Skeleton, ItemSkeleton } from '../../components/SkeletonLoaders';
import { EmptyState } from '../../components/EmptyState';
import { useAppStore } from '../../store/useAppStore';

const MapPinIcon = MapPin as any;
const CreditCardIcon = CreditCard as any;
const QrCodeIcon = QrCode as any;
const TruckIcon = Truck as any;
const ChevronRightIcon = ChevronRight as any;
const LogOutIcon = LogOut as any;
const Edit2Icon = Edit2 as any;
const PlusIcon = Plus as any;
const XIcon = X as any;
const ClockIcon = Clock as any;
const DropletsIcon = Droplets as any;

// ─── Settings Row Component ───────────────────────────────────────────────────
interface SettingsItemProps {
  Icon: any;
  bg: string;
  color: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ Icon, bg, color, title, subtitle, onPress }) => (
  <GlassCard onPress={onPress} radius={RADIUS.xxl} style={styles.settingsCard}>
    <View style={styles.settingsCardInner}>
      <View style={styles.settingsLeft}>
        <View style={[styles.settingsIconBox, { backgroundColor: bg }]}>
          <Icon size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>{title}</Text>
          <Text style={[TYPO.bodyMd, { color: COLORS.outline, marginTop: 2, fontSize: 13 }]}>{subtitle}</Text>
        </View>
      </View>
      <ChevronRightIcon size={18} color={COLORS.outlineVariant} />
    </View>
  </GlassCard>
);

// ─── QR Modal (Visual UPI Mock QR Canvas) ─────────────────────────────────────
interface QrModalProps {
  visible: boolean;
  qrValue: string;
  shopName: string;
  onClose: () => void;
}

const QrModal: React.FC<QrModalProps> = ({ visible, qrValue, shopName, onClose }) => {
  const webBlurStyle: any = {
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.qrOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.qrSheet, webBlurStyle]}>
          <View style={styles.sheetHandle} />
          
          <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, textAlign: 'center', fontWeight: '700' }]}>
            UPI Payment QR Code
          </Text>
          <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, textAlign: 'center', marginTop: 4, marginBottom: SPACING.lg }]}>
            {shopName}
          </Text>

          {/* QR visual placeholder with realistic bordered boxes */}
          <View style={styles.qrBox}>
            <View style={styles.qrGrid}>
              {Array.from({ length: 9 }).map((_, row) =>
                Array.from({ length: 9 }).map((_, col) => {
                  const cornerCell =
                    (row < 3 && col < 3) || (row < 3 && col > 5) || (row > 5 && col < 3);
                  return (
                    <View
                      key={`${row}-${col}`}
                      style={[
                        styles.qrCell,
                        {
                          backgroundColor: cornerCell
                            ? COLORS.primary
                            : Math.random() > 0.45
                            ? COLORS.onSurface
                            : 'transparent',
                        },
                      ]}
                    />
                  );
                })
              )}
            </View>
            <View style={styles.qrCornerTL} />
            <View style={styles.qrCornerTR} />
            <View style={styles.qrCornerBL} />
            <View style={styles.qrCenterLogo}>
              <Text style={{ fontSize: 11 }}>🫧</Text>
            </View>
          </View>

          <Text style={[TYPO.labelLg, { color: COLORS.primary, textAlign: 'center', marginTop: SPACING.lg, fontWeight: '700' }]}>
            {qrValue.split('pa=')[1]?.split('&')[0] ?? 'wowexpress@upi'}
          </Text>
          <Text style={[TYPO.bodyMd, { color: COLORS.outline, textAlign: 'center', marginTop: 2, marginBottom: SPACING.xl, fontSize: 13 }]}>
            Scan to pay · Powered by dynamic UPI QR
          </Text>

          <Button label="Close Scanner" onPress={onClose} variant="outline" fullWidth />
        </View>
      </View>
    </Modal>
  );
};

// ─── Instructions & Timings Modal ─────────────────────────────────────────────
const BusinessSettingsModal: React.FC<{
  visible: boolean;
  shop: any;
  onSave: (data: any) => void;
  onClose: () => void;
}> = ({ visible, shop, onSave, onClose }) => {
  const [instructions, setInstructions] = useState('');
  const [timings, setTimings] = useState<string[]>([]);
  const [newTiming, setNewTiming] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [taxPercent, setTaxPercent] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const PREDEFINED_SLOTS = [
    '08:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
    '06:00 PM - 08:00 PM',
    '08:00 PM - 10:00 PM'
  ];

  useEffect(() => {
    if (visible && shop) {
      setInstructions(shop.instructions || '');
      setTimings(shop.pickupTimings || []);
      setContactNumber(shop.contactNumber || '');
      setMinOrderValue(shop.minOrderValue?.toString() || '');
      setTaxPercent(shop.taxPercent?.toString() || '');
      setDeliveryFee(shop.deliveryFee?.toString() || '');
    }
  }, [visible, shop]);

  const toggleTiming = (t: string) => {
    if (timings.includes(t)) {
      setTimings(timings.filter(item => item !== t));
    } else {
      setTimings([...timings, t]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
        <View style={[styles.modalContent, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: '85%' }]}>
          <View style={styles.modalHeader}>
            <Text style={TYPO.headlineSm}>Settings & Info</Text>
            <TouchableOpacity onPress={onClose}>
              <XIcon size={24} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shop Contact Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 9876543210"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg }}>
              <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Min Order (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 200"
                  value={minOrderValue}
                  onChangeText={setMinOrderValue}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Tax (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5"
                  value={taxPercent}
                  onChangeText={setTaxPercent}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Delivery (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 49"
                  value={deliveryFee}
                  onChangeText={setDeliveryFee}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Instructions for Customers</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="e.g. Please separate dark and light clothes before pickup..."
                value={instructions}
                onChangeText={setInstructions}
                multiline
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Available Pickup Timings</Text>
              <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, marginBottom: SPACING.sm }]}>Select the time slots you want to offer to customers.</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {PREDEFINED_SLOTS.map((t, idx) => {
                  const isSelected = timings.includes(t);
                  return (
                    <TouchableOpacity 
                      key={idx} 
                      onPress={() => toggleTiming(t)}
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        backgroundColor: isSelected ? COLORS.primary : COLORS.surfaceContainerHigh, 
                        paddingHorizontal: 12, 
                        paddingVertical: 8, 
                        borderRadius: RADIUS.md,
                        borderWidth: 1,
                        borderColor: isSelected ? COLORS.primary : COLORS.outlineVariant
                      }}
                    >
                      <Text style={[TYPO.labelSm, { color: isSelected ? COLORS.onPrimary : COLORS.onSurface }]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
                {/* Render custom timings that aren't in the predefined list */}
                {timings.filter(t => !PREDEFINED_SLOTS.includes(t)).map((t, idx) => (
                  <View key={`custom-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary }}>
                    <Text style={[TYPO.labelSm, { color: COLORS.onPrimary, marginRight: 6 }]}>{t}</Text>
                    <TouchableOpacity onPress={() => toggleTiming(t)}>
                      <XIcon size={14} color={COLORS.onPrimary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={[TYPO.labelSm, { color: COLORS.onSurfaceVariant, marginTop: SPACING.md, marginBottom: 4 }]}>Or add a custom time range:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="e.g. 09:00 AM - 12:00 PM"
                  value={newTiming}
                  onChangeText={setNewTiming}
                />
                <Button 
                  label="Add Custom" 
                  onPress={() => {
                    if (newTiming.trim() && !timings.includes(newTiming.trim())) {
                      setTimings([...timings, newTiming.trim()]);
                      setNewTiming('');
                    }
                  }} 
                  variant="primary" 
                />
              </View>
            </View>
            
            <Button
              label="Save Details"
              onPress={() => onSave({ 
                instructions, 
                pickupTimings: timings, 
                contactNumber,
                minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
                taxPercent: taxPercent ? parseFloat(taxPercent) : 0,
                deliveryFee: deliveryFee ? parseFloat(deliveryFee) : 0
              })}
              variant="primary"
              style={{ marginTop: SPACING.lg }}
              fullWidth
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};


// ─── Payment/Selection Modals ─────────────────────────────────────────────────────
const PaymentModal = ({ visible, paymentInfo, onSave, onClose }: any) => {
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');

  useEffect(() => {
    if (visible) {
      setUpiId(paymentInfo?.upiId || '');
      setBankName(paymentInfo?.bankName || '');
      setAccountNo(paymentInfo?.accountNo || '');
    }
  }, [visible, paymentInfo]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={TYPO.headlineSm}>Bank & Payment Details</Text>
            <TouchableOpacity onPress={onClose}>
              <XIcon size={24} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <Text style={[TYPO.bodyMd, { color: COLORS.outline, marginBottom: SPACING.md }]}>Configure the payment options to receive money directly to your bank account.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>UPI ID</Text>
            <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} placeholder="merchant@upi" placeholderTextColor={COLORS.outlineVariant} autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="e.g. HDFC Bank" placeholderTextColor={COLORS.outlineVariant} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput style={styles.input} value={accountNo} onChangeText={setAccountNo} placeholder="Enter account number" placeholderTextColor={COLORS.outlineVariant} keyboardType="number-pad" />
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              onSave({
                upiId,
                bankName,
                accountNo,
                qrValue: upiId ? `upi://pay?pa=${upiId}&pn=WOW%20Laundry&cu=INR` : ''
              });
            }}
          >
            <Text style={styles.primaryBtnText}>Save Payment Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ShopSelectionModal = ({ visible, shops, onSelect, onClose }: any) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
        <View style={[styles.modalContent, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={TYPO.headlineSm}>Select Shop</Text>
            <TouchableOpacity onPress={onClose}>
              <XIcon size={24} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <Text style={[TYPO.bodyMd, { color: COLORS.outline, marginBottom: SPACING.md }]}>Choose a shop to configure its payment settings.</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {shops.map((shop: any) => (
              <TouchableOpacity key={shop._id} style={styles.shopSelectRow} onPress={() => onSelect(shop)}>
                <View style={styles.shopSelectIcon}>
                  <StoreIcon size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '600' }]}>{shop.name}</Text>
                  <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>{shop.branches.join(', ') || 'No branches'}</Text>
                </View>
                <ChevronRightIcon size={20} color={COLORS.outline} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Delivery Personnel Modal ─────────────────────────────────────────────────
const DeliveryModal = ({ visible, shopId, onClose }: any) => {
  const { users, addDeliveryBoy } = useAppStore();
  const [email, setEmail] = useState('');
  
  const shopDeliveryBoys = users.filter(u => u.role === 'Delivery' && u.shopId === shopId);

  const handleAdd = async () => {
    if (!email.trim() || !email.includes('@')) return alert('Please enter a valid email');
    await addDeliveryBoy(email, shopId);
    setEmail('');
    alert('Delivery staff added successfully! They can log in using their email and OTP.');
  };

  const webBlurStyle: any = {
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
        <View style={[styles.modalContent, webBlurStyle, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: '85%' }]}>
          <View style={styles.modalHeader}>
            <Text style={TYPO.headlineSm}>Delivery Personnel</Text>
            <TouchableOpacity onPress={onClose}>
              <XIcon size={24} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Add New Staff Email</Text>
              <TextInput
                style={styles.input}
                placeholder="delivery.name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <Button
              label="Add Delivery Staff"
              onPress={handleAdd}
              variant="primary"
              style={{ marginTop: SPACING.md, marginBottom: SPACING.xl }}
            />

            <Text style={[TYPO.headlineSm, { color: COLORS.onSurface, marginBottom: SPACING.md, fontWeight: '700' }]}>
              Current Staff ({shopDeliveryBoys.length})
            </Text>

            {shopDeliveryBoys.length === 0 ? (
              <EmptyState icon={TruckIcon} title="No Delivery Staff" subtitle="Add staff members to assign deliveries." />
            ) : (
              shopDeliveryBoys.map(staff => (
                <View key={staff._id} style={[styles.catalogItemCard, { marginBottom: SPACING.sm }]}>
                  <View style={[styles.catalogItemIcon, { backgroundColor: 'rgba(234, 88, 12, 0.1)' }]}>
                    <TruckIcon size={20} color="#ea580c" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '600' }]}>{staff.name}</Text>
                    <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>{staff.email}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const AdminShopScreen: React.FC = () => {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [washPreferencesOpen, setWashPreferencesOpen] = useState(false);
  const [shopSelectOpen, setShopSelectOpen] = useState(false);
  const [selectedShopIdForPayment, setSelectedShopIdForPayment] = useState<string | null>(null);
  const [shopSelectMode, setShopSelectMode] = useState<'payment' | 'delivery' | 'instructions' | 'wash'>('payment');

  const { shops, currentTenantId, currentUser, setCurrentRole, setCurrentUser, updateShop } = useAppStore();
  const shop = shops.find(s => s._id === currentTenantId);

  const handleToggleShopStatus = async () => {
    if (!shop) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextStatus = !(shop.isOpen ?? true);
    await updateShop(shop._id, { isOpen: nextStatus });
  };

  const handlePaymentClick = () => {
    if (!currentTenantId) {
      setShopSelectMode('payment');
      setShopSelectOpen(true);
    } else {
      setSelectedShopIdForPayment(currentTenantId);
      setPaymentOpen(true);
    }
  };

  const handleDeliveryClick = () => {
    if (!currentTenantId) {
      setShopSelectMode('delivery');
      setShopSelectOpen(true);
    } else {
      setSelectedShopIdForPayment(currentTenantId);
      setDeliveryOpen(true);
    }
  };

  const handleInstructionsClick = () => {
    if (!currentTenantId) {
      setShopSelectMode('instructions');
      setShopSelectOpen(true);
    } else {
      setSelectedShopIdForPayment(currentTenantId);
      setInstructionsOpen(true);
    }
  };

  const handleWashPreferencesClick = () => {
    if (!currentTenantId) {
      setShopSelectMode('wash');
      setShopSelectOpen(true);
    } else {
      setSelectedShopIdForPayment(currentTenantId);
      setWashPreferencesOpen(true);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out from WOW Laundry?')) {
        setCurrentUser(null);
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out from WOW Laundry?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            setCurrentUser(null);
          },
        },
      ]);
    }
  };

  return (
    <>
      <ScrollView keyboardShouldPersistTaps="handled"
        style={styles.root}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <LinearGradient
                colors={['#E6DEFF', '#CABEFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.avatarText}>
                {currentUser?.name?.charAt(0).toUpperCase() ?? 'A'}
              </Text>
            </View>
            <TouchableOpacity style={styles.avatarEdit} activeOpacity={0.8}>
              <Edit2Icon size={12} color={COLORS.onPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={[TYPO.headlineLgMob, { color: COLORS.onSurface, fontWeight: '700', textAlign: 'center' }]}>
            {currentUser?.name ?? 'Shop Admin'}
          </Text>
          <Text style={[TYPO.bodyMd, { color: COLORS.outline, marginTop: 2, textAlign: 'center' }]}>
            {shop?.name ?? 'WOW Laundry'}
          </Text>
          
          {shop && (
            <View style={styles.branchPills}>
              {shop.branches.map((b: string, i: number) => (
                <View key={i} style={styles.branchPill}>
                  <MapPinIcon size={10} color={COLORS.primary} style={{ marginRight: 2 }} />
                  <Text style={[TYPO.labelSm, { color: COLORS.onPrimaryFixed, fontSize: 10, fontWeight: '600' }]}>{b}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {shop && (
          <GlassCard radius={RADIUS.xl} style={styles.statusCard}>
            <View style={styles.statusCardInner}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, { backgroundColor: (shop.isOpen ?? true) ? '#10B981' : '#EF4444' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '700' }]}>
                    Shop Status: {(shop.isOpen ?? true) ? 'OPEN' : 'CLOSED'}
                  </Text>
                  <Text style={[TYPO.bodyMd, { color: COLORS.outline, fontSize: 12, marginTop: 2 }]}>
                    {(shop.isOpen ?? true) ? 'Customers can place orders normally' : 'Orders are temporarily blocked'}
                  </Text>
                </View>
              </View>
              <ToggleSwitch
                value={shop.isOpen ?? true}
                onToggle={handleToggleShopStatus}
              />
            </View>
          </GlassCard>
        )}

        <View style={styles.settingsSection}>
          <SettingsItem
            Icon={CreditCard}
            bg="rgba(8, 104, 120, 0.08)"
            color={COLORS.secondary}
            title="Bank & Payment Details"
            subtitle={!currentTenantId ? "Select a shop to configure" : `UPI: ${shop?.paymentInfo?.upiId ?? 'Not set'}`}
            onPress={handlePaymentClick}
          />
          <View style={{ height: SPACING.md }} />
          <SettingsItem
            Icon={ClockIcon}
            bg="rgba(16, 185, 129, 0.08)"
            color="#10B981"
            title="Settings & Info"
            subtitle="Instructions, Timings & Contact"
            onPress={handleInstructionsClick}
          />
          <View style={{ height: SPACING.md }} />
          <SettingsItem
            Icon={DropletsIcon}
            bg="rgba(59, 130, 246, 0.08)"
            color="#3b82f6"
            title="Wash Preferences"
            subtitle="Configure extra wash options & pricing"
            onPress={handleWashPreferencesClick}
          />
          <View style={{ height: SPACING.md }} />
          <SettingsItem
            Icon={TruckIcon}
            bg="rgba(234, 88, 12, 0.08)"
            color="#ea580c"
            title="Delivery Personnel"
            subtitle="Manage delivery staff"
            onPress={handleDeliveryClick}
          />
        </View>

        {shop && (
          <View style={styles.statStrip}>
            <View style={styles.statItem}>
              <Text style={[TYPO.headlineMd, { color: COLORS.primary, fontWeight: '800' }]}>
                {shop.branches.length}
              </Text>
              <Text style={[TYPO.labelSm, { color: COLORS.outline, fontSize: 11 }]}>Branches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[TYPO.headlineMd, { color: (shop.isOpen ?? true) ? '#10B981' : '#EF4444', fontWeight: '800' }]}>
                {(shop.isOpen ?? true) ? 'Open' : 'Closed'}
              </Text>
              <Text style={[TYPO.labelSm, { color: COLORS.outline, fontSize: 11 }]}>Shop Status</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[TYPO.headlineMd, { color: COLORS.primary, fontWeight: '800' }]}>
                {shop.paymentInfo?.bankName?.split(' ')[0] ?? 'N/A'}
              </Text>
              <Text style={[TYPO.labelSm, { color: COLORS.outline, fontSize: 11 }]}>Channel</Text>
            </View>
          </View>
        )}

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.75}>
          <LogOutIcon size={16} color={COLORS.error} />
          <Text style={[TYPO.labelLg, { color: COLORS.error, fontWeight: '700' }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <PaymentModal
        visible={paymentOpen}
        paymentInfo={shops.find((s: any) => s._id === selectedShopIdForPayment)?.paymentInfo}
        onSave={(info: any) => { 
          if (selectedShopIdForPayment) {
            updateShop(selectedShopIdForPayment, { paymentInfo: info }); 
          }
          setPaymentOpen(false); 
        }}
        onClose={() => setPaymentOpen(false)}
      />

      <DeliveryModal
        visible={deliveryOpen}
        shopId={selectedShopIdForPayment}
        onClose={() => setDeliveryOpen(false)}
      />

      <BusinessSettingsModal
        visible={instructionsOpen}
        shop={shops.find((s: any) => s._id === selectedShopIdForPayment)}
        onSave={(data: any) => { 
          if (selectedShopIdForPayment) {
            updateShop(selectedShopIdForPayment, data); 
          }
          setInstructionsOpen(false); 
        }}
        onClose={() => setInstructionsOpen(false)}
      />

      <WashPreferencesModal
        visible={washPreferencesOpen}
        shop={shops.find((s: any) => s._id === selectedShopIdForPayment)}
        onSave={(prefs: any) => {
          if (selectedShopIdForPayment) {
            updateShop(selectedShopIdForPayment, { washPreferences: prefs });
          }
          setWashPreferencesOpen(false);
        }}
        onClose={() => setWashPreferencesOpen(false)}
      />

      <ShopSelectionModal
        visible={shopSelectOpen}
        shops={shops}
        onSelect={(selectedShop: any) => {
          setSelectedShopIdForPayment(selectedShop._id);
          setShopSelectOpen(false);
          setTimeout(() => {
            if (shopSelectMode === 'payment') setPaymentOpen(true);
            else if (shopSelectMode === 'delivery') setDeliveryOpen(true);
            else if (shopSelectMode === 'instructions') setInstructionsOpen(true);
            else if (shopSelectMode === 'wash') setWashPreferencesOpen(true);
          }, 300);
        }}
        onClose={() => setShopSelectOpen(false)}
      />
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: SPACING.xl,
    paddingBottom: 140,
  },
  profileHeader: {
    alignItems: 'center',
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.mobile,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.surfaceContainerLowest,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOW.ambient,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.primary,
    zIndex: 1,
  } as any,
  avatarEdit: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.surfaceContainerLowest,
    ...SHADOW.ambient,
  },
  catalogItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOW.ambient,
  },
  catalogItemIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  branchPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    justifyContent: 'center',
  },
  branchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 74, 192, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(96, 74, 192, 0.1)',
  },
  settingsSection: {
    paddingHorizontal: SPACING.mobile,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  settingsCard: {
    padding: 0,
  },
  settingsCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingsIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statStrip: {
    marginHorizontal: SPACING.mobile,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: SPACING.md + 2,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    ...SHADOW.ambient,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
  },
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  qrSheet: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
    paddingBottom: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  branchSheet: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
    paddingBottom: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    width: '100%',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchScroll: {
    width: '100%',
    maxHeight: 200,
    marginBottom: SPACING.md,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
  },
  branchActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  addBranchForm: {
    width: '100%',
  },
  qrBox: {
    width: 210,
    height: 210,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOW.ambient,
  },
  qrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 154,
    height: 154,
    gap: 3,
  },
  qrCell: {
    width: 14,
    height: 14,
    borderRadius: 1.5,
  },
  qrCornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 48,
    height: 48,
    borderWidth: 5,
    borderColor: COLORS.primary,
    borderRadius: 6,
  },
  qrCornerTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 48,
    height: 48,
    borderWidth: 5,
    borderColor: COLORS.primary,
    borderRadius: 6,
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 48,
    height: 48,
    borderWidth: 5,
    borderColor: COLORS.primary,
    borderRadius: 6,
  },
  qrCenterLogo: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.outlineVariant,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  sheetInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
    ...TYPO.bodyLg,
    color: COLORS.onSurface,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    outlineWidth: 0,
  } as any,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.mobile,
  },
  modalContent: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.ambient,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    ...TYPO.labelSm,
    color: COLORS.onSurface,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
    ...TYPO.bodyLg,
    color: COLORS.onSurface,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    outlineWidth: 0,
  } as any,
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  primaryBtnText: {
    ...TYPO.labelLg,
    color: COLORS.onPrimary,
    fontWeight: '700',
  },
  shopSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },
  shopSelectIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  statusCard: {
    marginHorizontal: SPACING.mobile,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 168, 232, 0.15)',
    ...SHADOW.ambient,
  },
  statusCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

// ─── Wash Preferences Modal ─────────────────────────────────────
const WashPreferencesModal: React.FC<{
  visible: boolean;
  shop: any;
  onSave: (prefs: any) => void;
  onClose: () => void;
}> = ({ visible, shop, onSave, onClose }) => {
  const [prefs, setPrefs] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  React.useEffect(() => {
    if (visible && shop?.washPreferences) {
      setPrefs([...shop.washPreferences]);
    } else if (visible) {
      setPrefs([]);
    }
  }, [visible, shop]);

  const handleAdd = () => {
    if (!name.trim() || !price.trim()) return alert('Name and Price are required');
    const newPref = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price)
    };
    setPrefs([...prefs, newPref]);
    setName('');
    setDescription('');
    setPrice('');
  };

  const handleRemove = (id: string) => {
    setPrefs(prefs.filter(p => p.id !== id));
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={[TYPO.titleLg, { color: COLORS.onSurface, marginBottom: SPACING.md }]}>Wash Preferences</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200, marginBottom: SPACING.md }}>
            {prefs.map(p => (
              <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: COLORS.surfaceContainer }}>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>{p.name}</Text>
                  <Text style={[TYPO.labelSm, { color: COLORS.outline }]}>{p.description}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[TYPO.labelLg, { color: COLORS.primary, marginRight: SPACING.md }]}>₹{p.price}</Text>
                  <TouchableOpacity onPress={() => handleRemove(p.id)}>
                    <Text style={{ color: COLORS.error, fontWeight: 'bold' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{ backgroundColor: COLORS.surfaceContainerLowest, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg }}>
            <Text style={[TYPO.labelMd, { color: COLORS.outline, marginBottom: SPACING.sm }]}>Add New Preference</Text>
            <TextInput style={[styles.input, { marginBottom: SPACING.sm }]} placeholder="Name (e.g. Fabric Softener)" value={name} onChangeText={setName} />
            <TextInput style={[styles.input, { marginBottom: SPACING.sm }]} placeholder="Description" value={description} onChangeText={setDescription} />
            <TextInput style={[styles.input, { marginBottom: SPACING.sm }]} placeholder="Extra Price (e.g. 20)" value={price} onChangeText={setPrice} keyboardType="numeric" />
            <TouchableOpacity onPress={handleAdd} style={{ backgroundColor: COLORS.secondary, padding: 10, borderRadius: RADIUS.md, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add to List</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={onClose} style={[{ padding: 12, borderRadius: RADIUS.md, alignItems: 'center' }, { backgroundColor: COLORS.surfaceContainer, marginRight: SPACING.sm }]}>
              <Text style={[TYPO.labelLg, { color: COLORS.onSurfaceVariant }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(prefs)} style={[{ padding: 12, borderRadius: RADIUS.md, alignItems: 'center' }, { backgroundColor: COLORS.primary }]}>
              <Text style={[TYPO.labelLg, { color: COLORS.onPrimary }]}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
