import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { Building2, Users, ChevronRight, Plus, X, Trash2, Store } from 'lucide-react-native';
import { SuperAdminShopDetail } from './SuperAdminShopDetail';

export const SuperAdminDashboard: React.FC = () => {
  const { shops, orders, users, createShop, deleteShop, setCurrentTenantId, initializeAppData, fetchOrders, fetchUsers, fetchCatalog } = useAppStore();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeAppData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeAppData();
    setRefreshing(false);
  }, [initializeAppData]);

  // Form State
  const [name, setName] = useState('');
  const [branchLocation, setBranchLocation] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCustomers = users.filter((u) => u.role === 'Customer').length;
  const totalBranches = shops.reduce((sum, s) => sum + (s.branches?.length || 1), 0);
  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED').length;

  const handleCreate = async () => {
    if (!name.trim() || !branchLocation.trim() || !adminEmail.trim()) {
      Alert.alert('Required', 'Shop name, branch location, and admin email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createShop(
        name.trim(),
        [branchLocation.trim()],
        upiId.trim(),
        bankName.trim(),
        accountNo.trim(),
        adminEmail.trim()
      );
      setName('');
      setBranchLocation('');
      setAdminEmail('');
      setUpiId('');
      setBankName('');
      setAccountNo('');
      setIsAddModalOpen(false);
      Alert.alert('Success', `Branch "${name}" created successfully!`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (shopId: string, shopName: string) => {
    Alert.alert('Delete Branch', `Are you sure you want to permanently delete "${shopName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteShop(shopId),
      },
    ]);
  };

  if (selectedShopId) {
    return (
      <SuperAdminShopDetail
        shopId={selectedShopId}
        onBack={() => setSelectedShopId(null)}
      />
    );
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>SUPER ADMIN</Text>
          <Text style={styles.subHeading}>Enterprise monitoring across all branches</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.85}
          onPress={() => setIsAddModalOpen(true)}
        >
          <Plus size={16} color={COLORS.black} strokeWidth={3} />
          <Text style={styles.addBtnText}>ADD BRANCH</Text>
        </TouchableOpacity>
      </View>

      {/* Global Bento Grid */}
      <View style={styles.bentoGrid}>
        <View style={[styles.bentoCard, { backgroundColor: COLORS.secondary }]}>
          <Text style={styles.bentoLabel}>GROSS REVENUE</Text>
          <Text style={styles.bentoValue}>
            ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.bentoTag}>Across {shops.length} shops</Text>
        </View>

        <View style={[styles.bentoCard, { backgroundColor: COLORS.primary }]}>
          <Text style={[styles.bentoLabel, { color: COLORS.white }]}>ACTIVE ORDERS</Text>
          <Text style={[styles.bentoValue, { color: COLORS.white }]}>{activeOrders}</Text>
          <Text style={[styles.bentoTag, { color: COLORS.white }]}>In processing</Text>
        </View>

        <View style={styles.bentoCard}>
          <Text style={styles.bentoLabel}>TOTAL CUSTOMERS</Text>
          <Text style={styles.bentoValue}>{totalCustomers}</Text>
          <Text style={styles.bentoTag}>Registered users</Text>
        </View>

        <View style={styles.bentoCard}>
          <Text style={styles.bentoLabel}>TOTAL BRANCHES</Text>
          <Text style={styles.bentoValue}>{totalBranches}</Text>
          <Text style={styles.bentoTag}>Active outlets</Text>
        </View>
      </View>

      {/* Branches List */}
      <Text style={styles.sectionHeading}>ALL BRANCHES ({shops.length})</Text>

      {shops.map((shop) => {
        const shopOrders = orders.filter((o) => o.shopId === shop._id);
        const shopRevenue = shopOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const isOpen = shop.isOpen ?? true;

        return (
          <TouchableOpacity
            key={shop._id}
            style={styles.shopCard}
            activeOpacity={0.85}
            onPress={() => setSelectedShopId(shop._id)}
          >
            <View style={styles.shopIconBox}>
              <Store size={22} color={COLORS.black} strokeWidth={2.5} />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.shopName}>{shop.name}</Text>
                <View
                  style={[
                    styles.openBadge,
                    { backgroundColor: isOpen ? COLORS.secondary : '#FEE2E2' },
                  ]}
                >
                  <Text style={[styles.openBadgeText, { color: isOpen ? COLORS.black : '#DC2626' }]}>
                    {isOpen ? 'OPEN' : 'CLOSED'}
                  </Text>
                </View>
              </View>

              <Text style={styles.shopBranches} numberOfLines={1}>
                {shop.branches?.join(' · ') || 'Main Branch'}
              </Text>

              <Text style={styles.shopRevenue}>
                ₹{shopRevenue.toLocaleString('en-IN')} · {shopOrders.length} orders
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteShopBtn}
              onPress={() => handleDelete(shop._id, shop.name)}
            >
              <Trash2 size={16} color="#DC2626" strokeWidth={2.5} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}

      {/* Add Branch Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>CREATE NEW BRANCH</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={22} color={COLORS.black} strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BRANCH NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. WOW Laundry Sector 14"
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>LOCATION / AREA</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sector 14, Gurugram"
                  placeholderTextColor="#6B7280"
                  value={branchLocation}
                  onChangeText={setBranchLocation}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ADMIN EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="admin.sector14@wow.com"
                  placeholderTextColor="#6B7280"
                  value={adminEmail}
                  onChangeText={setAdminEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>UPI ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="sector14@upi"
                  placeholderTextColor="#6B7280"
                  value={upiId}
                  onChangeText={setUpiId}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BANK NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. HDFC Bank"
                  placeholderTextColor="#6B7280"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ACCOUNT NUMBER</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0000000000"
                  placeholderTextColor="#6B7280"
                  value={accountNo}
                  onChangeText={setAccountNo}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleCreate}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.createBtnText}>
                {isSubmitting ? 'CREATING...' : 'CREATE BRANCH'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingBottom: 100,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  subHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...NEO_SHADOW.box2,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  bentoGrid: {
    gap: SPACING.sm,
  },
  bentoCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  bentoLabel: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.8,
  },
  bentoValue: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginVertical: 4,
  },
  bentoTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.8,
    marginTop: SPACING.sm,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  shopIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  openBadge: {
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  openBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
  },
  shopBranches: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
  },
  shopRevenue: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  deleteShopBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 3,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  inputGroup: {
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.black,
  },
  createBtn: {
    backgroundColor: COLORS.black,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...NEO_SHADOW.box4,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.8,
  },
});
