import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Animated, Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { COLORS, SPACING, RADIUS, TYPO } from '../../components/Theme';
import { Building2, IndianRupee, Users, ChevronRight, Plus, X, Trash2 } from 'lucide-react-native';
import { SuperAdminShopDetail } from './SuperAdminShopDetail';

export const SuperAdminDashboard: React.FC = () => {
  const { shops, orders, users, createShop, deleteShop } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  
  const formHeight = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  // Form State
  const [shopName, setShopName] = useState('');
  const [branchLocation, setBranchLocation] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const totalCustomers = users.filter(u => u.role === 'Customer').length;
  const totalBranches = shops.reduce((sum, shop) => sum + (shop.branches?.length || 1), 0);

  const toggleForm = (show: boolean) => {
    setIsCreating(show);
    Animated.parallel([
      Animated.timing(formHeight, {
        toValue: show ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(formOpacity, {
        toValue: show ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      })
    ]).start();
  };

  const handleCreateShop = async () => {
    if (!shopName || !branchLocation || !adminEmail) {
      Alert.alert('Required Fields', 'Please enter a shop name, location, and admin email.');
      return;
    }
    await createShop(shopName, [branchLocation], upiId, bankName, accountNo, adminEmail);
    toggleForm(false);
    setShopName('');
    setBranchLocation('');
    setUpiId('');
    setBankName('');
    setAccountNo('');
    setAdminEmail('');
  };

  const handleDeleteShop = (shopId: string, shopName: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to permanently delete "${shopName}"? This action cannot be undone.`);
      if (confirmed) {
        deleteShop(shopId);
      }
    } else {
      Alert.alert(
        'Delete Branch',
        `Are you sure you want to permanently delete "${shopName}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteShop(shopId) }
        ]
      );
    }
  };

  if (selectedShopId) {
    return <SuperAdminShopDetail shopId={selectedShopId} onBack={() => setSelectedShopId(null)} />;
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Overview</Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        {/* Highlighted Revenue Card */}
        <View style={[styles.statCard, styles.revenueCard]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.9)' }]}>Gross Revenue</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: RADIUS.full }}>
              <IndianRupee size={16} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[styles.statValue, { color: '#FFFFFF', fontSize: 36, letterSpacing: -1, marginTop: 4 }]} numberOfLines={1} adjustsFontSizeToFit>
            ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.rowStats}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Total Branches</Text>
              <View style={{ backgroundColor: COLORS.surfaceContainer, padding: 6, borderRadius: RADIUS.full }}>
                <Building2 size={16} color={COLORS.primary} />
              </View>
            </View>
            <Text style={styles.statValue}>{totalBranches}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Total Customers</Text>
              <View style={{ backgroundColor: COLORS.surfaceContainer, padding: 6, borderRadius: RADIUS.full }}>
                <Users size={16} color={COLORS.secondary} />
              </View>
            </View>
            <Text style={styles.statValue}>{totalCustomers.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Branches Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Branches</Text>
          {!isCreating && (
            <TouchableOpacity onPress={() => toggleForm(true)} style={styles.actionBtn}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>New Branch</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Inline Create Form */}
        <Animated.View style={[
          styles.formWrapper,
          { 
            maxHeight: formHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 600] }),
            opacity: formOpacity,
            overflow: 'hidden',
          }
        ]}>
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Add a new branch</Text>
              <TouchableOpacity onPress={() => toggleForm(false)}>
                <X size={20} color="#71717A" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shop Name</Text>
                <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder="WOW Laundry (Downtown)" placeholderTextColor="#A1A1AA" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location / Address</Text>
                <TextInput style={styles.input} value={branchLocation} onChangeText={setBranchLocation} placeholder="123 Main St, City" placeholderTextColor="#A1A1AA" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shop Admin Email (OTP Bypass)</Text>
                <TextInput style={styles.input} value={adminEmail} onChangeText={setAdminEmail} placeholder="admin@shop.com" placeholderTextColor="#A1A1AA" autoCapitalize="none" keyboardType="email-address" />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>UPI ID</Text>
                  <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} placeholder="shop@upi" placeholderTextColor="#A1A1AA" />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Bank Name</Text>
                  <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="HDFC" placeholderTextColor="#A1A1AA" />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Number</Text>
                <TextInput style={styles.input} value={accountNo} onChangeText={setAccountNo} placeholder="0000 0000 0000" placeholderTextColor="#A1A1AA" keyboardType="number-pad" />
              </View>
            </View>

            <View style={styles.formFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => toggleForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateShop}>
                <Text style={styles.submitBtnText}>Create Branch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Branch List */}
        <View style={styles.listContainer}>
          {shops.map((shop, index) => {
            const shortId = shop._id.includes('_') ? shop._id.split('_').pop() : shop._id.slice(-6).toUpperCase();
            return (
            <TouchableOpacity key={shop._id} style={styles.branchCard} onPress={() => setSelectedShopId(shop._id)}>
              <View style={styles.branchIconBox}>
                <Building2 size={24} color={COLORS.primary} />
              </View>
              <View style={styles.branchInfo}>
                <Text style={styles.branchTitle} numberOfLines={1}>{shop.name}</Text>
                <Text style={styles.branchSubtitle} numberOfLines={1}>{shop.branches.join(', ')}</Text>
              </View>
              <View style={styles.branchActions}>
                <View style={styles.branchIdBadge}>
                  <Text style={styles.branchIdText}>{shortId}</Text>
                </View>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDeleteShop(shop._id, shop.name); }} style={styles.deleteBtn}>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Outfit_600SemiBold',
    color: '#18181B',
    letterSpacing: -0.5,
  },
  statsContainer: {
    gap: 16,
    marginBottom: 36,
  },
  rowStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: RADIUS.xl,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.03)' as any,
  },
  revenueCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    boxShadow: '0px 8px 24px rgba(124, 58, 237, 0.25)' as any,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#71717A',
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    color: '#18181B',
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#18181B',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B', // Solid black for primary actions
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
  },
  formWrapper: {
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 8,
    overflow: 'hidden',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  formTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#18181B',
  },
  formContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: '#3F3F46',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#18181B',
    backgroundColor: '#FFFFFF',
    outlineStyle: 'none',
  } as any,
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#3F3F46',
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#18181B',
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 12,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.02)' as any,
  },
  branchIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  branchInfo: {
    flex: 1,
  },
  branchTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#18181B',
    marginBottom: 4,
  },
  branchSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#71717A',
  },
  branchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  branchIdBadge: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  branchIdText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#71717A',
    textTransform: 'uppercase',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
