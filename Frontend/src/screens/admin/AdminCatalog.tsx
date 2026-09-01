import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Search, Plus, X, ArrowLeft, Image as ImageIcon, Sparkles, Package } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { ToggleSwitch } from '../../components/UIPack';
import { useAppStore } from '../../store/useAppStore';
import { CategoryDetailsModal } from './CategoryDetailsModal';
import { CategoryVectorIllustration } from '../../components/CategoryVectors';
import { VectorPickerModal } from '../../components/VectorPickerModal';

export const AdminCatalogScreen: React.FC = () => {
  const { categories, items, currentTenantId, currentUser, fetchCatalog, addCategory, updateCategory } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [isAddCatVisible, setAddCatVisible] = useState(false);
  const [isVectorPickerOpen, setVectorPickerOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activeShopId = currentTenantId || currentUser?.shopId || '';
  const tenantCategories = activeShopId
    ? categories.filter((c) => c.shopId === activeShopId)
    : categories;

  const filteredCategories = tenantCategories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchCatalog(activeShopId);
    setRefreshing(false);
  }, [fetchCatalog, activeShopId]);

  const handleToggleCategory = async (catId: string, currentVal: boolean) => {
    try {
      await updateCategory(catId, { isActive: !currentVal });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update category');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert('Required', 'Please enter category name');
      return;
    }
    setIsCreating(true);
    try {
      await addCategory(newCatName.trim(), newCatImage.trim() || undefined, activeShopId);
      setNewCatName('');
      setNewCatImage('');
      setAddCatVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create category');
    } finally {
      setIsCreating(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewCatImage(result.assets[0].uri);
    }
  };

  const selectedCategory = categories.find((c) => c._id === selectedCatId) || null;

  return (
    <View style={styles.root}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>CATALOG MANAGER</Text>
          <Text style={styles.subHeading}>Manage services & pricing for your branch</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.85}
          onPress={() => setAddCatVisible(true)}
        >
          <Plus size={18} color={COLORS.black} strokeWidth={3} />
          <Text style={styles.addBtnText}>ADD CATEGORY</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Search size={18} color={COLORS.black} strokeWidth={2.5} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={18} color={COLORS.black} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Grid */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.grid}>
          {filteredCategories.map((cat) => {
            const catItems = items.filter((i) => i.categoryId === cat._id);
            const isEnabled = cat.isActive ?? true;

            return (
              <TouchableOpacity
                key={cat._id}
                style={[styles.catCard, !isEnabled && { opacity: 0.55 }]}
                activeOpacity={0.85}
                onPress={() => setSelectedCatId(cat._id)}
              >
                {/* Header: Illustration + Toggle */}
                <View style={styles.catCardTop}>
                  <View style={styles.catImgBox}>
                    <CategoryVectorIllustration
                      categoryName={cat.name}
                      customImage={cat.image}
                      size={44}
                    />
                  </View>
                  <ToggleSwitch
                    value={isEnabled}
                    onToggle={() => handleToggleCategory(cat._id, isEnabled)}
                  />
                </View>

                {/* Title and Services Count */}
                <View style={styles.catCardBottom}>
                  <Text style={styles.catName} numberOfLines={2}>
                    {cat.name}
                  </Text>
                  <View style={styles.servicesBadge}>
                    <Text style={styles.servicesBadgeText}>
                      {catItems.length} SERVICE{catItems.length === 1 ? '' : 'S'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Package size={40} color={COLORS.black} strokeWidth={2} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>NO CATEGORIES FOUND</Text>
            <Text style={styles.emptySub}>Tap "Add Category" above to create your first category.</Text>
          </View>
        )}
      </ScrollView>

      {/* Category Details Modal */}
      {selectedCategory && (
        <CategoryDetailsModal
          visible={!!selectedCategory}
          category={selectedCategory}
          onClose={() => setSelectedCatId(null)}
        />
      )}

      {/* Add Category Modal */}
      <Modal visible={isAddCatVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>CREATE NEW CATEGORY</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CATEGORY NAME</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Suits & Formals"
                placeholderTextColor="#6B7280"
                value={newCatName}
                onChangeText={setNewCatName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CATEGORY ICON / ILLUSTRATION</Text>
              
              {newCatImage ? (
                <View style={styles.selectedImgPreview}>
                  <Image
                    source={{ uri: newCatImage }}
                    style={{ width: 44, height: 44 }}
                    contentFit="contain"
                  />
                  <Text style={styles.selectedImgText} numberOfLines={1}>
                    Selected Icon Active
                  </Text>
                  <TouchableOpacity onPress={() => setNewCatImage('')}>
                    <X size={16} color={COLORS.black} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.imagePickerBtn, { flex: 1, backgroundColor: COLORS.secondary }]}
                  activeOpacity={0.8}
                  onPress={() => setVectorPickerOpen(true)}
                >
                  <Sparkles size={16} color={COLORS.black} strokeWidth={2.5} />
                  <Text style={styles.imagePickerText}>Pick Vector</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.imagePickerBtn, { flex: 1 }]}
                  activeOpacity={0.8}
                  onPress={pickImage}
                >
                  <ImageIcon size={16} color={COLORS.black} strokeWidth={2.5} />
                  <Text style={styles.imagePickerText}>Upload File</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAddCatVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCreateCategory}
                disabled={isCreating}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>
                  {isCreating ? 'CREATING...' : 'CREATE CATEGORY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Vector Picker Gallery Sheet */}
      <VectorPickerModal
        visible={isVectorPickerOpen}
        selectedUrl={newCatImage}
        onSelect={(url) => setNewCatImage(url)}
        onClose={() => setVectorPickerOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.mobile,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
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
    letterSpacing: 0.5,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.mobile,
    marginVertical: SPACING.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...NEO_SHADOW.box4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  scrollContent: {
    padding: SPACING.mobile,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  catCard: {
    width: '47.5%',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    justifyContent: 'space-between',
    minHeight: 175,
    ...NEO_SHADOW.box4,
  },
  catCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  catImgBox: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  catImg: {
    width: 48,
    height: 48,
  },
  catCardBottom: {
    marginTop: SPACING.md,
  },
  catName: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  servicesBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  servicesBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
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
  modalHeading: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.black,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  imagePickerText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
  },
  selectedImgPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 8,
    marginVertical: 4,
  },
  selectedImgText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  modalSaveBtn: {
    flex: 1.5,
    padding: 14,
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    ...NEO_SHADOW.box2,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
});
