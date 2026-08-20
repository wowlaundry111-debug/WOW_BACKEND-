import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { ChevronLeft, Save, Trash2, User, Truck, IndianRupee, Store, Edit2 } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  shopId: string;
  onBack: () => void;
}

export const SuperAdminShopDetail: React.FC<Props> = ({ shopId, onBack }) => {
  const { shops, users, orders, updateShop, updateUser, deleteUser, deleteShop } = useAppStore();
  const shop = shops.find(s => s._id === shopId);
  
  const [activeTab, setActiveTab] = useState<'details' | 'staff' | 'customers' | 'orders'>('details');

  // Edit Shop State
  const [shopName, setShopName] = useState(shop?.name || '');
  const [branchStr, setBranchStr] = useState(shop?.branches?.join(', ') || '');
  const [upiId, setUpiId] = useState(shop?.paymentInfo?.upiId || '');
  const [bankName, setBankName] = useState(shop?.paymentInfo?.bankName || '');
  const [accountNo, setAccountNo] = useState(shop?.paymentInfo?.accountNo || '');

  if (!shop) return null;

  const shopOrders = orders.filter(o => o.shopId === shopId);
  const shopStaff = users.filter(u => u.shopId === shopId && ['ShopAdmin', 'Delivery'].includes(u.role));
  
  // Customers who placed orders here
  const customerIds = new Set(shopOrders.map(o => o.customerId));
  const shopCustomers = users.filter(u => customerIds.has(u._id));

  const handleSaveShop = async () => {
    try {
      await updateShop(shopId, {
        name: shopName,
        branches: branchStr.split(',').map(s => s.trim()).filter(Boolean),
        paymentInfo: {
          upiId, bankName, accountNo, qrValue: `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&cu=INR`
        }
      });
      Alert.alert('Success', 'Shop details updated successfully.');
    } catch (err) {
      // handled in store
    }
  };

  const handleDeleteStaff = (userId: string, name: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete staff member ${name}?`)) deleteUser(userId);
    } else {
      Alert.alert('Delete Staff', `Remove ${name} from this shop?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteUser(userId) }
      ]);
    }
  };

  const renderTabHeader = () => (
    <View style={styles.tabContainer}>
      {(['details', 'staff', 'customers', 'orders'] as const).map(tab => (
        <TouchableOpacity 
          key={tab} 
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{shop.name}</Text>
          <Text style={styles.headerSubtitle}>ID: {shop._id}</Text>
        </View>
      </View>

      {renderTabHeader()}

      <ScrollView keyboardShouldPersistTaps="handled" style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Edit Shop Profile</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shop Name</Text>
              <TextInput style={styles.input} value={shopName} onChangeText={setShopName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Branches (comma separated)</Text>
              <TextInput style={styles.input} value={branchStr} onChangeText={setBranchStr} />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>UPI ID</Text>
                <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} autoCapitalize="none" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Bank Name</Text>
                <TextInput style={styles.input} value={bankName} onChangeText={setBankName} />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput style={styles.input} value={accountNo} onChangeText={setAccountNo} keyboardType="number-pad" />
            </View>
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveShop}>
              <Save size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Assigned Staff ({shopStaff.length})</Text>
            {shopStaff.length === 0 ? <Text style={styles.emptyText}>No staff assigned.</Text> : null}
            {shopStaff.map(u => (
              <View key={u._id} style={styles.userCard}>
                <View style={[styles.avatarBox, { backgroundColor: u.role === 'ShopAdmin' ? 'rgba(96, 74, 192, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                  {u.role === 'ShopAdmin' ? <Store size={20} color={COLORS.primary} /> : <Truck size={20} color="#10B981" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.name} <Text style={styles.roleBadge}>({u.role})</Text></Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  <Text style={styles.userEmail}>Phone: {u.phone}</Text>
                </View>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteStaff(u._id, u.name)}>
                  <Trash2 size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Customers ({shopCustomers.length})</Text>
            <Text style={styles.helperText}>Customers who have placed orders at this specific branch.</Text>
            {shopCustomers.length === 0 ? <Text style={styles.emptyText}>No customers yet.</Text> : null}
            {shopCustomers.map(u => (
              <View key={u._id} style={styles.userCard}>
                <View style={[styles.avatarBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <User size={20} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  <Text style={styles.userEmail}>Phone: {u.phone}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Shop Performance</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Total Orders</Text>
                <Text style={styles.statBoxValue}>{shopOrders.length}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Gross Revenue</Text>
                <Text style={[styles.statBoxValue, { color: COLORS.primary }]}>
                  ₹{shopOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Pending</Text>
                <Text style={[styles.statBoxValue, { color: '#F59E0B' }]}>
                  {shopOrders.filter(o => !['DELIVERED'].includes(o.status)).length}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Completed</Text>
                <Text style={[styles.statBoxValue, { color: '#10B981' }]}>
                  {shopOrders.filter(o => o.status === 'DELIVERED').length}
                </Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5'
  },
  backBtn: {
    padding: 8,
    marginRight: 16,
    marginLeft: -8,
    backgroundColor: '#F4F4F5',
    borderRadius: RADIUS.full
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#18181B'
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#71717A',
    fontFamily: 'Outfit_500Medium',
    marginTop: 2
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: COLORS.primary
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#71717A'
  },
  activeTabText: {
    color: COLORS.primary
  },
  content: {
    padding: 24
  },
  sectionCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    ...SHADOW.ambient
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#18181B',
    marginBottom: 20
  },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row', gap: 16 },
  label: { fontSize: 13, fontFamily: 'Outfit_500Medium', color: '#3F3F46', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E4E4E7', borderRadius: 8, padding: 12, fontSize: 14, fontFamily: 'Outfit_500Medium', color: '#18181B', outlineStyle: 'none'
  } as any,
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#18181B', padding: 14, borderRadius: 8, marginTop: 12
  },
  saveBtnText: { color: '#FFF', fontFamily: 'Outfit_600SemiBold', fontSize: 15 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: RADIUS.lg, marginBottom: 12, borderWidth: 1, borderColor: '#E4E4E7', ...SHADOW.ambient
  },
  avatarBox: { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  userName: { fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: '#18181B', marginBottom: 4 },
  roleBadge: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  userEmail: { fontSize: 13, color: '#71717A', fontFamily: 'Outfit_500Medium', marginBottom: 2 },
  iconBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
  emptyText: { color: '#A1A1AA', textAlign: 'center', padding: 32, fontFamily: 'Outfit_500Medium' },
  helperText: { color: '#71717A', marginBottom: 16, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#FAFAFA', padding: 16, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#F4F4F5' },
  statBoxLabel: { fontSize: 13, color: '#71717A', fontFamily: 'Outfit_500Medium', marginBottom: 4 },
  statBoxValue: { fontSize: 24, fontFamily: 'Outfit_700Bold', color: '#18181B' }
});
