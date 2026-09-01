import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { X, Plus, Trash2, Edit2, Image as ImageIcon, ArrowLeft, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';
import { CategoryVectorIllustration } from '../../components/CategoryVectors';
import { VectorPickerModal } from '../../components/VectorPickerModal';

interface CategoryDetailsModalProps {
  visible: boolean;
  category?: any;
  categoryId?: string | null;
  onClose: () => void;
}

export const CategoryDetailsModal: React.FC<CategoryDetailsModalProps> = ({
  visible,
  category: passedCategory,
  categoryId,
  onClose,
}) => {
  const {
    categories,
    items,
    addCatalogItem,
    deleteCatalogItem,
    updateCatalogItem,
    updateCategory,
    deleteCategory,
  } = useAppStore();

  const category = passedCategory || categories.find((c) => c._id === categoryId);
  const catId = category?._id || categoryId;
  const catItems = items.filter((i) => i.categoryId === catId);

  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<'KG' | 'ITEM'>('ITEM');
  const [newItemImage, setNewItemImage] = useState('');
  const [isVectorPickerOpen, setVectorPickerOpen] = useState(false);
  const [vectorTarget, setVectorTarget] = useState<'item' | 'category'>('item');

  // Category Edit State
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editCatName, setEditCatName] = useState(category?.name || '');
  const [editCatImage, setEditCatImage] = useState(category?.image || '');

  if (!category) return null;

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) {
      Alert.alert('Required', 'Please enter a name and price');
      return;
    }
    const price = parseFloat(newItemPrice);
    if (isNaN(price)) {
      Alert.alert('Invalid', 'Price must be a valid number');
      return;
    }

    if (editingItemId) {
      updateCatalogItem(editingItemId, {
        name: newItemName.trim(),
        description: newItemDesc.trim(),
        image: newItemImage || undefined,
        ...(newItemUnit === 'KG'
          ? { pricePerKg: price, pricePerItem: undefined }
          : { pricePerItem: price, pricePerKg: undefined }),
      });
      setEditingItemId(null);
    } else {
      addCatalogItem(
        catId!,
        newItemName.trim(),
        newItemDesc.trim(),
        price,
        newItemUnit,
        newItemImage || undefined
      );
    }

    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('');
    setNewItemImage('');
    setIsAdding(false);
  };

  const startEditItem = (item: any) => {
    setEditingItemId(item._id);
    setNewItemName(item.name);
    setNewItemDesc(item.description || '');
    setNewItemImage(item.image || '');
    setNewItemPrice(String(item.pricePerKg || item.pricePerItem || ''));
    setNewItemUnit(item.pricePerKg ? 'KG' : 'ITEM');
    setIsAdding(true);
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert('Delete Service', 'Are you sure you want to delete this service?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCatalogItem(itemId) },
    ]);
  };

  const handleSaveCategoryEdit = () => {
    if (!editCatName.trim()) return Alert.alert('Required', 'Category name cannot be empty');
    updateCategory(catId!, { name: editCatName.trim(), image: editCatImage || undefined });
    setIsEditingCategory(false);
  };

  const handleDeleteCategory = () => {
    Alert.alert(
      'Delete Category',
      `Delete "${category.name}" and all its services?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Category',
          style: 'destructive',
          onPress: () => {
            deleteCategory(catId!);
            onClose();
          },
        },
      ]
    );
  };

  const pickItemImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewItemImage(result.assets[0].uri);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBody}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.closeCircle} onPress={onClose} activeOpacity={0.8}>
              <ArrowLeft size={20} color={COLORS.black} strokeWidth={3} />
            </TouchableOpacity>

            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {category.name}
              </Text>
              <Text style={styles.headerSubtitle}>{catItems.length} SERVICES AVAILABLE</Text>
            </View>

            <TouchableOpacity
              style={styles.editCatBtn}
              onPress={() => {
                setEditCatName(category.name);
                setEditCatImage(category.image || '');
                setIsEditingCategory(true);
              }}
            >
              <Edit2 size={16} color={COLORS.black} strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteCatBtn} onPress={handleDeleteCategory}>
              <Trash2 size={16} color="#DC2626" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
            {/* Category Edit Banner if active */}
            {isEditingCategory && (
              <View style={styles.editCatBox}>
                <Text style={styles.editCatBoxTitle}>EDIT CATEGORY</Text>
                <TextInput
                  style={styles.input}
                  value={editCatName}
                  onChangeText={setEditCatName}
                  placeholder="Category Name"
                />

                {/* Category Vector Icon Picker */}
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.inputLabel}>CATEGORY ICON</Text>
                  {editCatImage ? (
                    <View style={styles.selectedImgPreview}>
                      <Image source={{ uri: editCatImage }} style={{ width: 36, height: 36 }} contentFit="contain" />
                      <Text style={styles.selectedImgText} numberOfLines={1}>Selected Icon</Text>
                      <TouchableOpacity onPress={() => setEditCatImage('')}>
                        <X size={16} color={COLORS.black} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.imagePickerBtn, { backgroundColor: COLORS.secondary, marginTop: 4 }]}
                    onPress={() => {
                      setVectorTarget('category');
                      setVectorPickerOpen(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={16} color={COLORS.black} strokeWidth={2.5} />
                    <Text style={styles.imagePickerText}>Choose From Vector Gallery</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={styles.cancelSmallBtn}
                    onPress={() => setIsEditingCategory(false)}
                  >
                    <Text style={styles.cancelSmallText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveSmallBtn} onPress={handleSaveCategoryEdit}>
                    <Text style={styles.saveSmallText}>SAVE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Add Service Section / Button */}
            {!isAdding ? (
              <TouchableOpacity
                style={styles.addServiceCTA}
                activeOpacity={0.85}
                onPress={() => {
                  setEditingItemId(null);
                  setNewItemName('');
                  setNewItemDesc('');
                  setNewItemPrice('');
                  setNewItemImage('');
                  setIsAdding(true);
                }}
              >
                <Plus size={20} color={COLORS.black} strokeWidth={3} />
                <Text style={styles.addServiceCTAText}>ADD NEW SERVICE</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.addFormBox}>
                <Text style={styles.formHeading}>
                  {editingItemId ? 'EDIT SERVICE' : 'NEW SERVICE'}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SERVICE NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Denim Jeans Wash"
                    placeholderTextColor="#6B7280"
                    value={newItemName}
                    onChangeText={setNewItemName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DESCRIPTION</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Wash & Steam Iron"
                    placeholderTextColor="#6B7280"
                    value={newItemDesc}
                    onChangeText={setNewItemDesc}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>PRICE (₹)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 50"
                      placeholderTextColor="#6B7280"
                      value={newItemPrice}
                      onChangeText={setNewItemPrice}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={{ width: 120 }}>
                    <Text style={styles.inputLabel}>UNIT</Text>
                    <View style={styles.unitToggleWrap}>
                      <TouchableOpacity
                        style={[
                          styles.unitBtn,
                          newItemUnit === 'ITEM' && styles.unitBtnActive,
                        ]}
                        onPress={() => setNewItemUnit('ITEM')}
                      >
                        <Text
                          style={[
                            styles.unitBtnText,
                            newItemUnit === 'ITEM' && { color: COLORS.black },
                          ]}
                        >
                          ITEM
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.unitBtn,
                          newItemUnit === 'KG' && styles.unitBtnActive,
                        ]}
                        onPress={() => setNewItemUnit('KG')}
                      >
                        <Text
                          style={[
                            styles.unitBtnText,
                            newItemUnit === 'KG' && { color: COLORS.black },
                          ]}
                        >
                          KG
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Service Vector Icon Picker */}
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.inputLabel}>SERVICE ICON</Text>
                  {newItemImage ? (
                    <View style={styles.selectedImgPreview}>
                      <Image source={{ uri: newItemImage }} style={{ width: 36, height: 36 }} contentFit="contain" />
                      <Text style={styles.selectedImgText} numberOfLines={1}>Selected Icon</Text>
                      <TouchableOpacity onPress={() => setNewItemImage('')}>
                        <X size={16} color={COLORS.black} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.imagePickerBtn, { backgroundColor: COLORS.secondary, marginTop: 4 }]}
                    onPress={() => {
                      setVectorTarget('item');
                      setVectorPickerOpen(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={16} color={COLORS.black} strokeWidth={2.5} />
                    <Text style={styles.imagePickerText}>Choose From Vector Gallery</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={styles.cancelSmallBtn}
                    onPress={() => setIsAdding(false)}
                  >
                    <Text style={styles.cancelSmallText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveSmallBtn} onPress={handleAddItem}>
                    <Text style={styles.saveSmallText}>
                      {editingItemId ? 'UPDATE SERVICE' : 'ADD SERVICE'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* List of services in this category */}
            <Text style={styles.servicesSectionTitle}>SERVICES ({catItems.length})</Text>

            {catItems.map((item) => {
              const price = item.pricePerKg || item.pricePerItem || 0;
              const unit = item.pricePerKg ? 'KG' : 'Item';

              return (
                <View key={item._id} style={styles.itemCard}>
                  <View style={styles.itemImgBox}>
                    <CategoryVectorIllustration
                      itemName={item.name}
                      categoryName={category.name}
                      customImage={item.image}
                      size={44}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.description ? (
                      <Text style={styles.itemDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                    ) : null}
                    <Text style={styles.itemPriceText}>
                      ₹{price} <Text style={styles.itemPriceUnit}>/ {unit}</Text>
                    </Text>
                  </View>

                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => startEditItem(item)}
                    >
                      <Edit2 size={16} color={COLORS.black} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: '#FEE2E2' }]}
                      onPress={() => handleDeleteItem(item._id)}
                    >
                      <Trash2 size={16} color="#DC2626" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {catItems.length === 0 && (
              <View style={styles.emptyItemsBox}>
                <Text style={styles.emptyItemsText}>No services added to this category yet.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
      <VectorPickerModal
        visible={isVectorPickerOpen}
        selectedUrl={vectorTarget === 'item' ? newItemImage : editCatImage}
        onSelect={(url) => {
          if (vectorTarget === 'item') {
            setNewItemImage(url);
          } else {
            setEditCatImage(url);
          }
        }}
        onClose={() => setVectorPickerOpen(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBody: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 3,
    borderColor: COLORS.black,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
  },
  closeCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEO_SHADOW.box2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  editCatBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  deleteCatBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  editCatBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...NEO_SHADOW.box2,
  },
  editCatBoxTitle: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: 6,
  },
  addServiceCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    marginBottom: SPACING.lg,
    gap: 8,
    ...NEO_SHADOW.box4,
  },
  addServiceCTAText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  addFormBox: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...NEO_SHADOW.box4,
  },
  formHeading: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
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
    letterSpacing: 0.5,
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
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.sm,
  },
  unitToggleWrap: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    height: 42,
  },
  unitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  unitBtnActive: {
    backgroundColor: COLORS.secondary,
  },
  unitBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#6B7280',
  },
  cancelSmallBtn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
  },
  cancelSmallText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  saveSmallBtn: {
    flex: 1.5,
    padding: 10,
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    ...NEO_SHADOW.box2,
  },
  saveSmallText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  servicesSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    marginBottom: SPACING.sm,
    letterSpacing: 0.8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    ...NEO_SHADOW.box2,
  },
  itemImgBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImg: {
    width: 36,
    height: 36,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
  },
  itemDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 1,
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.primary,
    marginTop: 2,
  },
  itemPriceUnit: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.black,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyItemsBox: {
    alignItems: 'center',
    padding: SPACING.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
  },
  emptyItemsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    padding: 10,
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
});
