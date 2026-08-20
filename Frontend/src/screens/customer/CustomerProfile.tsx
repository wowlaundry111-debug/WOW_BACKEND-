import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut, MapPin, CreditCard, Clock, ChevronRight, User, Settings, Droplets } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';

export const CustomerProfileScreen = ({ onNavigateToOrders }: { onNavigateToOrders?: () => void }) => {
  const { currentUser, setCurrentUser, updateProfile, shops, currentTenantId } = useAppStore();
  const insets = useSafeAreaInsets();
  
  const currentShop = shops.find(s => s._id === currentTenantId);
  const shopWashPrefs = currentShop?.washPreferences || [];
  
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(currentUser?.selectedWashPreferences || []);

  // Modals state
  const [isEditProfileVisible, setEditProfileVisible] = useState(false);
  const [isAddressVisible, setAddressVisible] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editAddress, setEditAddress] = useState(currentUser?.address || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync prefs when currentUser changes (e.g. after profile update)
  useEffect(() => {
    setSelectedPrefs(currentUser?.selectedWashPreferences || []);
  }, [currentUser]);

  // Reset modal inputs to latest values whenever modals open
  useEffect(() => {
    if (isEditProfileVisible) {
      setEditName(currentUser?.name || '');
      setEditEmail(currentUser?.email || '');
    }
  }, [isEditProfileVisible]);

  useEffect(() => {
    if (isAddressVisible) {
      setEditAddress(currentUser?.address || '');
    }
  }, [isAddressVisible]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const res = await updateProfile({ name: editName, email: editEmail });
    setIsSaving(false);
    if (res.success) setEditProfileVisible(false);
    else alert(res.message);
  };

  const handleSaveAddress = async () => {
    setIsSaving(true);
    const res = await updateProfile({ address: editAddress });
    setIsSaving(false);
    if (res.success) setAddressVisible(false);
    else alert(res.message);
  };

  const handleTogglePref = async (prefId: string, value: boolean) => {
    const newPrefs = value ? [...selectedPrefs, prefId] : selectedPrefs.filter(id => id !== prefId);
    setSelectedPrefs(newPrefs);
    await updateProfile({ selectedWashPreferences: newPrefs });
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" 
      style={styles.root} 
      contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + SPACING.sm, SPACING.xl) }]}
    >
      {/* Header Profile Info */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <User size={32} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, fontWeight: '800' }]}>{currentUser?.name}</Text>
          <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, marginTop: 2 }]}>+91 {currentUser?.phone}</Text>
        </View>
      </View>

      {/* Primary Action Buttons */}
      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => setAddressVisible(true)}>
          <MapPin size={24} color={COLORS.primary} />
          <Text style={[TYPO.labelMd, { color: COLORS.onSurface, marginTop: SPACING.sm }]}>Addresses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <CreditCard size={24} color={COLORS.secondary} />
          <Text style={[TYPO.labelMd, { color: COLORS.onSurface, marginTop: SPACING.sm }]}>Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToOrders}>
          <Clock size={24} color="#F59E0B" />
          <Text style={[TYPO.labelMd, { color: COLORS.onSurface, marginTop: SPACING.sm }]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Settings List */}
      <View style={styles.section}>
        <Text style={[TYPO.labelLg, { color: COLORS.outline, textTransform: 'uppercase', marginBottom: SPACING.sm, paddingHorizontal: SPACING.sm }]}>
          Preferences & Settings
        </Text>
        <View style={styles.listCard}>
          <ListRow icon={User} title="Edit Profile" onPress={() => setEditProfileVisible(true)} />
          <View style={styles.divider} />
          <ListRow icon={MapPin} title="Saved Addresses" subtitle={currentUser?.address || 'None'} onPress={() => setAddressVisible(true)} />
          <View style={styles.divider} />
          <ListRow icon={CreditCard} title="Payment Methods" />
        </View>
      </View>



      <View style={styles.section}>
        <Text style={[TYPO.labelLg, { color: COLORS.outline, textTransform: 'uppercase', marginBottom: SPACING.sm, paddingHorizontal: SPACING.sm }]}>
          Support
        </Text>
        <View style={styles.listCard}>
          <ListRow icon={Clock} title="Help Center" />
          <View style={styles.divider} />
          <ListRow icon={Clock} title="Terms & Conditions" />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={20} color={COLORS.error} />
        <Text style={[TYPO.labelLg, { color: COLORS.error, marginLeft: 8, fontWeight: '700' }]}>Logout</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={isEditProfileVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <Text style={[TYPO.headlineMd, { marginBottom: SPACING.lg, fontWeight: '800' }]}>Edit Profile</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[TYPO.labelSm, { color: COLORS.outline, marginBottom: 4 }]}>Name</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Your name" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[TYPO.labelSm, { color: COLORS.outline, marginBottom: 4 }]}>Email</Text>
              <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} placeholder="Your email" keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[TYPO.labelSm, { color: COLORS.outline, marginBottom: 4 }]}>Phone Number (Read-only)</Text>
              <TextInput style={[styles.input, { backgroundColor: COLORS.surfaceContainer }]} value={currentUser?.phone} editable={false} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditProfileVisible(false)}>
                <Text style={[TYPO.labelLg, { color: COLORS.onSurfaceVariant }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={[TYPO.labelLg, { color: '#fff', fontWeight: 'bold' }]}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Address Modal */}
      <Modal visible={isAddressVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <Text style={[TYPO.headlineMd, { marginBottom: SPACING.lg, fontWeight: '800' }]}>Saved Address</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[TYPO.labelSm, { color: COLORS.outline, marginBottom: 4 }]}>Delivery Address</Text>
              <TextInput 
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                value={editAddress} 
                onChangeText={setEditAddress} 
                placeholder="Enter your full address" 
                multiline 
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAddressVisible(false)}>
                <Text style={[TYPO.labelLg, { color: COLORS.onSurfaceVariant }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveAddress} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={[TYPO.labelLg, { color: '#fff', fontWeight: 'bold' }]}>Save Address</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const ListRow = ({ icon: Icon, title, subtitle, onPress }: { icon: any, title: string, subtitle?: string, onPress?: () => void }) => (
  <TouchableOpacity style={styles.listRow} onPress={onPress}>
    <Icon size={20} color={COLORS.onSurfaceVariant} />
    <View style={{ flex: 1, marginLeft: SPACING.md }}>
      <Text style={[TYPO.labelLg, { color: COLORS.onSurface }]}>{title}</Text>
      {subtitle && <Text style={[TYPO.labelSm, { color: COLORS.onSurfaceVariant, marginTop: 2 }]} numberOfLines={1}>{subtitle}</Text>}
    </View>
    <ChevronRight size={20} color={COLORS.outline} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: 4,
    ...SHADOW.ambient,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  listCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    ...SHADOW.ambient,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
    marginLeft: 48,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2', // Light red
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    marginBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...TYPO.bodyMd,
    color: COLORS.onSurface,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
  },
  modalCancelBtn: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
  },
  modalSaveBtn: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
});
