import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Store,
  CreditCard,
  Truck,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  User,
  Sparkles,
  Droplets,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Layers,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { ToggleSwitch } from '../../components/UIPack';
import { useAppStore } from '../../store/useAppStore';

const DEFAULT_PROMOS = [
  { id: '1', badge: 'PROMO', title: '50% OFF', subtitle: 'Winter Wear Deep Dryclean', type: 'promo' },
  { id: '2', badge: 'EXPRESS', title: 'EXPRESS DOORSTEP', subtitle: 'Fast scheduled pickup & delivery', type: 'express' },
];

const DEFAULT_WASH_PREFS = [
  { id: 'extra_softener', name: 'Extra Fabric Softener', description: 'Delicate lavender scent & plush softness', price: 20, enabled: true },
  { id: 'anti_bacterial', name: 'Anti-Bacterial Sanitization', description: 'Deep hygiene rinse eliminating 99.9% germs', price: 30, enabled: true },
  { id: 'eco_organic', name: 'Eco Organic Detergent', description: 'Hypoallergenic wash for sensitive skin', price: 25, enabled: false },
  { id: 'stain_booster', name: 'Stain Remover Booster', description: 'Spot treatment for tough grease & collar marks', price: 40, enabled: true },
];

type SectionId = 'store' | 'payment' | 'banners' | 'addons' | 'fleet';

interface SettingsMenuItem {
  id: SectionId;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: any;
  color: string;
}

const SETTINGS_SECTIONS: SettingsMenuItem[] = [
  {
    id: 'store',
    label: 'Store Operations',
    shortLabel: 'Store',
    subtitle: 'Open/close, min order, tax & fees',
    icon: Store,
    color: '#B0FF49',
  },
  {
    id: 'payment',
    label: 'Payment & Banking',
    shortLabel: 'Payment',
    subtitle: 'UPI ID, bank account & settlement',
    icon: CreditCard,
    color: '#0D8DE3',
  },
  {
    id: 'banners',
    label: 'Home Promo Banners',
    shortLabel: 'Banners',
    subtitle: 'Customer app hero promo cards',
    icon: Sparkles,
    color: '#FACC15',
  },
  {
    id: 'addons',
    label: 'Wash Add-Ons & Prefs',
    shortLabel: 'Wash Add-ons',
    subtitle: 'Fabric softeners, hygiene & wash options',
    icon: Droplets,
    color: '#C084FC',
  },
  {
    id: 'fleet',
    label: 'Delivery Fleet & Staff',
    shortLabel: 'Fleet',
    subtitle: 'Manage delivery personnel & drivers',
    icon: Truck,
    color: '#FB923C',
  },
];

export const AdminShopScreen: React.FC = () => {
  const {
    shops,
    currentTenantId,
    currentUser,
    users,
    setCurrentUser,
    updateShop,
    addDeliveryBoy,
    deleteUser,
  } = useAppStore();

  const activeShopId = currentTenantId || currentUser?.shopId || '';
  const currentShop = shops.find((s) => s._id === activeShopId);

  // Active Category View
  const [activeTab, setActiveTab] = useState<'all' | SectionId>('all');
  const [expandedSections, setExpandedSections] = useState<Record<SectionId, boolean>>({
    store: true,
    payment: true,
    banners: true,
    addons: true,
    fleet: true,
  });

  const [isOpen, setIsOpen] = useState(currentShop?.isOpen ?? true);
  const [minOrder, setMinOrder] = useState(String(currentShop?.minOrderValue || 0));
  const [taxPercent, setTaxPercent] = useState(String(currentShop?.taxPercent || 0));
  const [deliveryFee, setDeliveryFee] = useState(String(currentShop?.deliveryFee || 0));
  const [upiId, setUpiId] = useState(currentShop?.paymentInfo?.upiId || '');
  const [bankName, setBankName] = useState(currentShop?.paymentInfo?.bankName || '');
  const [accountNo, setAccountNo] = useState(currentShop?.paymentInfo?.accountNo || '');
  const [contactNumber, setContactNumber] = useState(currentShop?.contactNumber || '');
  const [instructions, setInstructions] = useState(currentShop?.instructions || '');

  // Promo Banners & Wash Preferences
  const [promoBanners, setPromoBanners] = useState(
    currentShop?.promoBanners && currentShop.promoBanners.length >= 2
      ? currentShop.promoBanners
      : DEFAULT_PROMOS
  );
  const [washPreferences, setWashPreferences] = useState(
    currentShop?.washPreferences && currentShop.washPreferences.length > 0
      ? currentShop.washPreferences.map((p) => ({ ...p, enabled: p.enabled !== false }))
      : DEFAULT_WASH_PREFS
  );

  // Add Delivery Staff Form State
  const [delivName, setDelivName] = useState('');
  const [delivPhone, setDelivPhone] = useState('');
  const [delivEmail, setDelivEmail] = useState('');
  const [isAddingDeliv, setIsAddingDeliv] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentShop) {
      setIsOpen(currentShop.isOpen ?? true);
      setMinOrder(String(currentShop.minOrderValue || 0));
      setTaxPercent(String(currentShop.taxPercent || 0));
      setDeliveryFee(String(currentShop.deliveryFee || 0));
      setUpiId(currentShop.paymentInfo?.upiId || '');
      setBankName(currentShop.paymentInfo?.bankName || '');
      setAccountNo(currentShop.paymentInfo?.accountNo || '');
      setContactNumber(currentShop.contactNumber || '');
      setInstructions(currentShop.instructions || '');
      setPromoBanners(
        currentShop.promoBanners && currentShop.promoBanners.length >= 2
          ? currentShop.promoBanners
          : DEFAULT_PROMOS
      );
      setWashPreferences(
        currentShop.washPreferences && currentShop.washPreferences.length > 0
          ? currentShop.washPreferences.map((p) => ({ ...p, enabled: p.enabled !== false }))
          : DEFAULT_WASH_PREFS
      );
    }
  }, [currentShop]);

  const deliveryBoys = users.filter(
    (u) => u.role === 'Delivery' && (!activeShopId || !u.shopId || u.shopId === activeShopId)
  );

  const toggleSection = (id: SectionId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectTab = (tab: 'all' | SectionId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    if (tab !== 'all') {
      setExpandedSections((prev) => ({ ...prev, [tab]: true }));
    }
  };

  const handleSaveSettings = async () => {
    if (!currentShop) return;
    setIsSaving(true);
    try {
      await updateShop(currentShop._id, {
        isOpen,
        minOrderValue: Number(minOrder) || 0,
        taxPercent: Number(taxPercent) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        contactNumber,
        instructions,
        promoBanners,
        washPreferences,
        paymentInfo: {
          upiId,
          bankName,
          accountNo,
          qrValue: upiId ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(currentShop.name)}&cu=INR` : '',
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Shop configuration updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWashPref = () => {
    const newPref = {
      id: `pref_${Date.now()}`,
      name: 'New Wash Add-on',
      description: 'Custom wash preference description',
      price: 20,
      enabled: true,
    };
    setWashPreferences([...washPreferences, newPref]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleWashPref = (idx: number) => {
    const updated = [...washPreferences];
    updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
    setWashPreferences(updated);
  };

  const handleDeleteWashPref = (idx: number) => {
    const updated = washPreferences.filter((_, i) => i !== idx);
    setWashPreferences(updated);
  };

  const handleUpdateWashPref = (idx: number, field: string, val: any) => {
    const updated = [...washPreferences];
    updated[idx] = { ...updated[idx], [field]: val };
    setWashPreferences(updated);
  };

  const handleUpdatePromo = (idx: number, field: string, val: string) => {
    const updated = [...promoBanners];
    updated[idx] = { ...updated[idx], [field]: val };
    setPromoBanners(updated);
  };

  const handleAddDelivery = async () => {
    if (!delivEmail || !delivEmail.includes('@')) {
      Alert.alert('Required', 'Please enter a valid email address');
      return;
    }
    setIsAddingDeliv(true);
    try {
      await addDeliveryBoy(delivEmail.trim(), activeShopId, delivName.trim(), delivPhone.trim());
      setDelivName('');
      setDelivPhone('');
      setDelivEmail('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Delivery staff added successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add delivery staff');
    } finally {
      setIsAddingDeliv(false);
    }
  };

  const handleDeleteStaff = (userId: string, name: string) => {
    Alert.alert('Remove Staff', `Remove "${name}" from delivery fleet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteUser(userId),
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => setCurrentUser(null),
      },
    ]);
  };

  const shouldShowSection = (id: SectionId) => activeTab === 'all' || activeTab === id;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>SHOP SETTINGS</Text>
          <Text style={styles.subHeading}>Configure operations for {currentShop?.name || 'Branch'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.globalSaveBtn, isSaving && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSaveSettings}
          disabled={isSaving}
        >
          <Text style={styles.globalSaveBtnText}>{isSaving ? 'SAVING...' : 'SAVE'}</Text>
        </TouchableOpacity>
      </View>

      {/* List Type Option Category Selector */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryBarContent}
        >
          <TouchableOpacity
            style={[styles.categoryPill, activeTab === 'all' && styles.categoryPillActive]}
            activeOpacity={0.8}
            onPress={() => handleSelectTab('all')}
          >
            <Layers size={13} color={activeTab === 'all' ? COLORS.white : COLORS.black} strokeWidth={2.5} />
            <Text style={[styles.categoryPillText, activeTab === 'all' && styles.categoryPillTextActive]}>
              All Options
            </Text>
          </TouchableOpacity>

          {SETTINGS_SECTIONS.map((sec) => {
            const isActive = activeTab === sec.id;
            const Icon = sec.icon;
            return (
              <TouchableOpacity
                key={sec.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                activeOpacity={0.8}
                onPress={() => handleSelectTab(sec.id)}
              >
                <View
                  style={[
                    styles.pillColorDot,
                    { backgroundColor: sec.color },
                    isActive && { borderColor: COLORS.white },
                  ]}
                />
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                  {sec.shortLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Settings List */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. STORE OPERATIONS ─── */}
        {shouldShowSection('store') && (
          <View style={styles.optionCard}>
            <TouchableOpacity
              style={styles.optionHeader}
              activeOpacity={0.85}
              onPress={() => toggleSection('store')}
            >
              <View style={[styles.optionIconBox, { backgroundColor: '#B0FF49' }]}>
                <Store size={18} color={COLORS.black} strokeWidth={2.5} />
              </View>
              <View style={styles.optionHeaderTextWrap}>
                <Text style={styles.optionTitle}>STORE OPERATIONS</Text>
                <Text style={styles.optionSubtitle}>Open/close status, min order & taxes</Text>
              </View>
              {expandedSections.store ? (
                <ChevronUp size={20} color={COLORS.black} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={20} color={COLORS.black} strokeWidth={2.5} />
              )}
            </TouchableOpacity>

            {expandedSections.store && (
              <View style={styles.optionBody}>
                {/* Store status row */}
                <View style={styles.statusToggleRow}>
                  <View>
                    <Text style={styles.inputLabel}>STORE STATUS</Text>
                    <Text style={styles.statusSubtext}>
                      {isOpen ? 'Store is open & accepting orders' : 'Store is closed to customers'}
                    </Text>
                  </View>
                  <View style={styles.toggleRow}>
                    <Text style={[styles.toggleLabel, isOpen ? { color: '#16A34A' } : { color: '#DC2626' }]}>
                      {isOpen ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                    <ToggleSwitch value={isOpen} onToggle={() => setIsOpen(!isOpen)} />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>MIN ORDER (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={minOrder}
                      onChangeText={setMinOrder}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>TAX (%)</Text>
                    <TextInput
                      style={styles.input}
                      value={taxPercent}
                      onChangeText={setTaxPercent}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>DELIVERY FEE (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={deliveryFee}
                      onChangeText={setDeliveryFee}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>CONTACT PHONE</Text>
                    <TextInput
                      style={styles.input}
                      value={contactNumber}
                      onChangeText={setContactNumber}
                      placeholder="Support phone"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>STORE INSTRUCTIONS / NOTICE</Text>
                  <TextInput
                    style={styles.input}
                    value={instructions}
                    onChangeText={setInstructions}
                    placeholder="e.g. Please leave clothes in laundry bag"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* ─── 2. PAYMENT & BANKING ─── */}
        {shouldShowSection('payment') && (
          <View style={styles.optionCard}>
            <TouchableOpacity
              style={styles.optionHeader}
              activeOpacity={0.85}
              onPress={() => toggleSection('payment')}
            >
              <View style={[styles.optionIconBox, { backgroundColor: '#0D8DE3' }]}>
                <CreditCard size={18} color={COLORS.white} strokeWidth={2.5} />
              </View>
              <View style={styles.optionHeaderTextWrap}>
                <Text style={styles.optionTitle}>PAYMENT & BANKING</Text>
                <Text style={styles.optionSubtitle}>UPI ID, bank account & settlement info</Text>
              </View>
              {expandedSections.payment ? (
                <ChevronUp size={20} color={COLORS.black} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={20} color={COLORS.black} strokeWidth={2.5} />
              )}
            </TouchableOpacity>

            {expandedSections.payment && (
              <View style={styles.optionBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>UPI ID FOR INSTANT PAY</Text>
                  <TextInput
                    style={styles.input}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="merchant@upi"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>BANK NAME</Text>
                    <TextInput
                      style={styles.input}
                      value={bankName}
                      onChangeText={setBankName}
                      placeholder="e.g. HDFC Bank"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>ACCOUNT NUMBER</Text>
                    <TextInput
                      style={styles.input}
                      value={accountNo}
                      onChangeText={setAccountNo}
                      placeholder="0000000000"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ─── 3. HOME PROMO BANNERS ─── */}
        {shouldShowSection('banners') && (
          <View style={styles.optionCard}>
            <TouchableOpacity
              style={styles.optionHeader}
              activeOpacity={0.85}
              onPress={() => toggleSection('banners')}
            >
              <View style={[styles.optionIconBox, { backgroundColor: '#FACC15' }]}>
                <Sparkles size={18} color={COLORS.black} strokeWidth={2.5} />
              </View>
              <View style={styles.optionHeaderTextWrap}>
                <Text style={styles.optionTitle}>HOME PROMO BANNERS</Text>
                <Text style={styles.optionSubtitle}>Customer app promotional hero cards</Text>
              </View>
              {expandedSections.banners ? (
                <ChevronUp size={20} color={COLORS.black} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={20} color={COLORS.black} strokeWidth={2.5} />
              )}
            </TouchableOpacity>

            {expandedSections.banners && (
              <View style={styles.optionBody}>
                {/* Lime Promo Card (Banner 1) */}
                <View style={styles.limeBannerCard}>
                  <View style={styles.bannerBadgeLime}>
                    <Text style={styles.bannerBadgeLimeText}>LIME PROMO CARD (BANNER 1)</Text>
                  </View>

                  <View style={styles.formRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>BADGE TAG</Text>
                      <TextInput
                        style={styles.inputWhite}
                        value={promoBanners[0]?.badge || 'PROMO'}
                        onChangeText={(t) => handleUpdatePromo(0, 'badge', t)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>MAIN TITLE</Text>
                      <TextInput
                        style={styles.inputWhite}
                        value={promoBanners[0]?.title || '50% OFF'}
                        onChangeText={(t) => handleUpdatePromo(0, 'title', t)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>SUB TITLE</Text>
                    <TextInput
                      style={styles.inputWhite}
                      value={promoBanners[0]?.subtitle || 'Winter Wear Deep Dryclean'}
                      onChangeText={(t) => handleUpdatePromo(0, 'subtitle', t)}
                    />
                  </View>
                </View>

                {/* Blue Delivery Card (Banner 2) */}
                <View style={styles.blueBannerCard}>
                  <View style={styles.bannerBadgeBlue}>
                    <Text style={styles.bannerBadgeBlueText}>BLUE DELIVERY CARD (BANNER 2)</Text>
                  </View>

                  <View style={styles.formRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>BADGE TAG</Text>
                      <TextInput
                        style={styles.inputWhite}
                        value={promoBanners[1]?.badge || 'EXPRESS'}
                        onChangeText={(t) => handleUpdatePromo(1, 'badge', t)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>MAIN TITLE</Text>
                      <TextInput
                        style={styles.inputWhite}
                        value={promoBanners[1]?.title || 'EXPRESS DOORSTEP'}
                        onChangeText={(t) => handleUpdatePromo(1, 'title', t)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>SUB TITLE</Text>
                    <TextInput
                      style={styles.inputWhite}
                      value={promoBanners[1]?.subtitle || 'Fast scheduled pickup & delivery'}
                      onChangeText={(t) => handleUpdatePromo(1, 'subtitle', t)}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ─── 4. WASH ADD-ONS & PREFERENCES ─── */}
        {shouldShowSection('addons') && (
          <View style={styles.optionCard}>
            <TouchableOpacity
              style={styles.optionHeader}
              activeOpacity={0.85}
              onPress={() => toggleSection('addons')}
            >
              <View style={[styles.optionIconBox, { backgroundColor: '#C084FC' }]}>
                <Droplets size={18} color={COLORS.black} strokeWidth={2.5} />
              </View>
              <View style={styles.optionHeaderTextWrap}>
                <Text style={styles.optionTitle}>WASH ADD-ONS & PREFS</Text>
                <Text style={styles.optionSubtitle}>Checkout wash customizations & pricing</Text>
              </View>
              {expandedSections.addons ? (
                <ChevronUp size={20} color={COLORS.black} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={20} color={COLORS.black} strokeWidth={2.5} />
              )}
            </TouchableOpacity>

            {expandedSections.addons && (
              <View style={styles.optionBody}>
                <View style={styles.addPrefHeaderRow}>
                  <Text style={styles.listSectionCount}>
                    {washPreferences.length} CUSTOMIZATIONS CONFIGURED
                  </Text>
                  <TouchableOpacity
                    style={styles.addPrefBtn}
                    activeOpacity={0.85}
                    onPress={handleAddWashPref}
                  >
                    <Plus size={14} color={COLORS.black} strokeWidth={3} />
                    <Text style={styles.addPrefBtnText}>ADD ADD-ON</Text>
                  </TouchableOpacity>
                </View>

                {washPreferences.map((pref, idx) => (
                  <View key={pref.id || idx} style={styles.prefCard}>
                    <View style={styles.prefCardTopRow}>
                      <View style={styles.toggleRow}>
                        <ToggleSwitch
                          value={pref.enabled}
                          onToggle={() => handleToggleWashPref(idx)}
                        />
                        <Text
                          style={[
                            styles.toggleLabel,
                            pref.enabled ? { color: '#16A34A' } : { color: '#6B7280' },
                          ]}
                        >
                          {pref.enabled ? 'ACTIVE' : 'DISABLED'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.trashBtn}
                        onPress={() => handleDeleteWashPref(idx)}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={15} color="#DC2626" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.formRow}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.inputLabel}>PREFERENCE NAME</Text>
                        <TextInput
                          style={styles.input}
                          value={pref.name}
                          onChangeText={(t) => handleUpdateWashPref(idx, 'name', t)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>PRICE (₹)</Text>
                        <TextInput
                          style={styles.input}
                          value={String(pref.price ?? 0)}
                          onChangeText={(t) => handleUpdateWashPref(idx, 'price', Number(t) || 0)}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>SHORT DESCRIPTION</Text>
                      <TextInput
                        style={styles.input}
                        value={pref.description || ''}
                        onChangeText={(t) => handleUpdateWashPref(idx, 'description', t)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ─── 5. DELIVERY FLEET & STAFF ─── */}
        {shouldShowSection('fleet') && (
          <View style={styles.optionCard}>
            <TouchableOpacity
              style={styles.optionHeader}
              activeOpacity={0.85}
              onPress={() => toggleSection('fleet')}
            >
              <View style={[styles.optionIconBox, { backgroundColor: '#FB923C' }]}>
                <Truck size={18} color={COLORS.black} strokeWidth={2.5} />
              </View>
              <View style={styles.optionHeaderTextWrap}>
                <Text style={styles.optionTitle}>DELIVERY FLEET ({deliveryBoys.length})</Text>
                <Text style={styles.optionSubtitle}>Add & manage delivery personnel</Text>
              </View>
              {expandedSections.fleet ? (
                <ChevronUp size={20} color={COLORS.black} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={20} color={COLORS.black} strokeWidth={2.5} />
              )}
            </TouchableOpacity>

            {expandedSections.fleet && (
              <View style={styles.optionBody}>
                {/* Add Fleet Form */}
                <View style={styles.addFleetBox}>
                  <Text style={styles.addFleetBoxTitle}>+ ADD NEW DELIVERY STAFF</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>STAFF NAME</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Rahul Sharma"
                      placeholderTextColor="#9CA3AF"
                      value={delivName}
                      onChangeText={setDelivName}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="9876543210"
                        placeholderTextColor="#9CA3AF"
                        value={delivPhone}
                        onChangeText={setDelivPhone}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="staff@wow.com"
                        placeholderTextColor="#9CA3AF"
                        value={delivEmail}
                        onChangeText={setDelivEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addFleetBtn}
                    activeOpacity={0.85}
                    onPress={handleAddDelivery}
                    disabled={isAddingDeliv}
                  >
                    <Plus size={16} color={COLORS.black} strokeWidth={3} />
                    <Text style={styles.addFleetBtnText}>
                      {isAddingDeliv ? 'ADDING...' : 'ADD DELIVERY STAFF'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Existing Fleet List */}
                <Text style={styles.fleetListTitle}>ACTIVE FLEET PERSONNEL</Text>

                {deliveryBoys.map((boy) => (
                  <View key={boy._id} style={styles.fleetRow}>
                    <View style={styles.fleetAvatar}>
                      <Truck size={16} color={COLORS.black} strokeWidth={2.5} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.fleetName}>{boy.name}</Text>
                      <Text style={styles.fleetDetails}>{boy.phone || boy.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeFleetBtn}
                      onPress={() => handleDeleteStaff(boy._id, boy.name)}
                    >
                      <Trash2 size={15} color="#DC2626" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                ))}

                {deliveryBoys.length === 0 && (
                  <View style={styles.emptyFleetBox}>
                    <Text style={styles.emptyFleetText}>No delivery staff assigned yet.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Global Save Button at Bottom */}
        <TouchableOpacity
          style={[styles.bottomSaveBtn, isSaving && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSaveSettings}
          disabled={isSaving}
        >
          <Text style={styles.bottomSaveBtnText}>
            {isSaving ? 'SAVING CHANGES...' : 'SAVE ALL CONFIGURATIONS'}
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={handleLogout}>
          <LogOut size={16} color={COLORS.white} strokeWidth={3} />
          <Text style={styles.logoutBtnText}>LOGOUT OF ADMIN PANEL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.mobile,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  heading: {
    fontSize: 20,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.2,
  },
  subHeading: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 1,
    letterSpacing: 0.3,
  },
  globalSaveBtn: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 7,
    ...NEO_SHADOW.box2,
  },
  globalSaveBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.4,
  },
  categoryBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  categoryBarContent: {
    paddingHorizontal: SPACING.mobile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...NEO_SHADOW.box2,
  },
  categoryPillActive: {
    backgroundColor: COLORS.black,
  },
  pillColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  categoryPillText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: COLORS.black,
  },
  categoryPillTextActive: {
    color: COLORS.white,
    fontFamily: 'Outfit_800ExtraBold',
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingBottom: 100,
    gap: SPACING.md,
  },
  optionCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...NEO_SHADOW.box4,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  optionHeaderTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.3,
  },
  optionSubtitle: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: '#64748B',
    marginTop: 2,
  },
  optionBody: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1.5,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  statusToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statusSubtext: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: '#64748B',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.2,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: COLORS.black,
  },
  inputWhite: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    color: COLORS.black,
  },
  limeBannerCard: {
    backgroundColor: '#F2FCE2',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...NEO_SHADOW.box2,
  },
  bannerBadgeLime: {
    backgroundColor: '#B0FF49',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  bannerBadgeLimeText: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.3,
  },
  blueBannerCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...NEO_SHADOW.box2,
  },
  bannerBadgeBlue: {
    backgroundColor: '#0D8DE3',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  bannerBadgeBlueText: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  addPrefHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 8,
  },
  listSectionCount: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  addPrefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#B0FF49',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    ...NEO_SHADOW.box2,
  },
  addPrefBtnText: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.3,
  },
  prefCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...NEO_SHADOW.box2,
  },
  prefCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  trashBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFleetBox: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  addFleetBoxTitle: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  addFleetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    marginTop: 4,
    ...NEO_SHADOW.box2,
  },
  addFleetBtnText: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.3,
  },
  fleetListTitle: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  fleetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 6,
  },
  fleetAvatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fleetName: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  fleetDetails: {
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
    color: '#64748B',
  },
  removeFleetBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFleetBox: {
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    borderRadius: RADIUS.md,
  },
  emptyFleetText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    color: '#64748B',
  },
  bottomSaveBtn: {
    backgroundColor: COLORS.black,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    alignItems: 'center',
    ...NEO_SHADOW.box4,
  },
  bottomSaveBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    paddingVertical: 13,
    ...NEO_SHADOW.box4,
  },
  logoutBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});
