import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { X, Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { Button, SurfaceCard, Divider } from '../../components/UIPack';
import { useAppStore } from '../../store/useAppStore';

const XIcon = X as any;
const PlusIcon = Plus as any;
const Trash2Icon = Trash2 as any;
const Edit2Icon = Edit2 as any;
const ImageIconLucide = ImageIcon as any;

interface CategoryDetailsModalProps {
  visible: boolean;
  categoryId: string | null;
  onClose: () => void;
}

export const CategoryDetailsModal: React.FC<CategoryDetailsModalProps> = ({ visible, categoryId, onClose }) => {
  const { categories, items, addCatalogItem, deleteCatalogItem, updateCatalogItem, updateCategory, deleteCategory } = useAppStore();
  const category = categories.find(c => c._id === categoryId);
  const catItems = items.filter(i => i.categoryId === categoryId);

  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<'KG' | 'ITEM'>('KG');
  const [newItemImage, setNewItemImage] = useState('');

  // Category Edit State
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editCatName, setEditCatName] = useState('');
  const [editCatImage, setEditCatImage] = useState('');

  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 600,
      useNativeDriver: Platform.OS !== 'web',
      speed: 20,
      bounciness: 6,
    }).start();
  }, [visible]);

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) {
      Alert.alert('Required', 'Please enter a name and price');
      return;
    }
    const price = parseFloat(newItemPrice);
    if (isNaN(price)) {
      Alert.alert('Invalid', 'Price must be a number');
      return;
    }

    if (editingItemId) {
      updateCatalogItem(editingItemId, {
        name: newItemName.trim(),
        description: newItemDesc.trim(),
        image: newItemImage || undefined,
        ...(newItemUnit === 'KG' ? { pricePerKg: price, pricePerItem: undefined } : { pricePerItem: price, pricePerKg: undefined })
      });
      setEditingItemId(null);
    } else {
      addCatalogItem(categoryId!, newItemName.trim(), newItemDesc.trim(), price, newItemUnit, newItemImage || undefined);
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

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setEditCatImage(result.assets[0].uri);
    }
  };

  const handlePickItemImage = async () => {
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

  const saveCategoryEdit = () => {
    if (!editCatName.trim()) {
      Alert.alert('Required', 'Category name cannot be empty');
      return;
    }
    updateCategory(categoryId!, { name: editCatName.trim(), image: editCatImage });
    setIsEditingCategory(false);
  };

  const webBlurStyle: any = {
    backdropFilter: 'blur(30px) saturate(150%)',
    WebkitBackdropFilter: 'blur(30px) saturate(150%)',
  };

  if (!category && visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.sheetWrapper, { pointerEvents: 'box-none' as any }]}>
        <Animated.View style={[styles.sheet, webBlurStyle, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            {isEditingCategory ? (
              <View style={{ flex: 1, marginRight: SPACING.md }}>
                <TextInput
                  style={[styles.input, { marginBottom: SPACING.sm }]}
                  value={editCatName}
                  onChangeText={setEditCatName}
                  placeholder="Category Name"
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <Button label="Pick Image" variant="outline" onPress={handlePickImage} style={{ flex: 1 }} />
                  <Button label="Save" onPress={saveCategoryEdit} style={{ flex: 1 }} />
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPO.headlineMd, { color: COLORS.onSurface, fontWeight: '800' }]}>{category?.name}</Text>
                  <Text style={[TYPO.labelSm, { color: COLORS.outline, marginTop: 2 }]}>{catItems.length} items configured</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditCatName(category?.name || '');
                      setEditCatImage(category?.image || '');
                      setIsEditingCategory(true);
                    }}
                    style={styles.actionBtn}
                  >
                    <Edit2Icon size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Delete Category',
                        `Are you sure you want to delete ${category?.name}? All items inside will be lost.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Delete', 
                            style: 'destructive', 
                            onPress: () => {
                              deleteCategory(category!._id);
                              onClose();
                            } 
                          }
                        ]
                      );
                    }}
                    style={styles.deleteBtn}
                  >
                    <Trash2Icon size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {!isEditingCategory && (
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { marginLeft: SPACING.sm }]}>
                <XIcon size={18} color={COLORS.outline} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" style={styles.itemsScroll} showsVerticalScrollIndicator={false}>
            {catItems.length === 0 && !isAdding && (
              <View style={styles.emptyState}>
                <Text style={[TYPO.bodyMd, { color: COLORS.outline }]}>No items in this category yet.</Text>
              </View>
            )}

            {catItems.map((item, index) => (
              <View key={item._id}>
                <View style={styles.itemRow}>
                  {item.image && (
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPO.labelLg, { color: COLORS.onSurface, fontWeight: '700' }]}>{item.name}</Text>
                    {!!item.description && (
                      <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, fontSize: 13, marginTop: 2 }]}>{item.description}</Text>
                    )}
                    <Text style={[TYPO.labelSm, { color: COLORS.primary, marginTop: 6 }]}>
                      ₹{item.pricePerKg || item.pricePerItem} / {item.pricePerKg ? 'KG' : 'Item'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => startEditItem(item)} style={styles.actionBtn}>
                    <Edit2Icon size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCatalogItem(item._id)} style={styles.deleteBtn}>
                    <Trash2Icon size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
                {index < catItems.length - 1 && <Divider />}
              </View>
            ))}

            {isAdding ? (
              <SurfaceCard radius={RADIUS.lg} style={styles.addForm}>
                <Text style={[TYPO.labelLg, { color: COLORS.onSurface, marginBottom: SPACING.sm }]}>
                  {editingItemId ? 'Edit Service Item' : 'Add New Service Item'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Item Name (e.g. Blankets)"
                  placeholderTextColor={COLORS.outline}
                  value={newItemName}
                  onChangeText={setNewItemName}
                />
                <TextInput
                  style={[styles.input, { marginTop: SPACING.sm }]}
                  placeholder="Description (Optional)"
                  placeholderTextColor={COLORS.outline}
                  value={newItemDesc}
                  onChangeText={setNewItemDesc}
                />
                
                <View style={[styles.input, { marginTop: SPACING.sm, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }]}>
                  <TextInput
                    style={{ flex: 1, ...TYPO.bodyLg, color: COLORS.onSurface, outlineWidth: 0 }}
                    placeholder="Image URL or pick below"
                    placeholderTextColor={COLORS.outline}
                    value={newItemImage}
                    onChangeText={setNewItemImage}
                  />
                  <TouchableOpacity onPress={handlePickItemImage} style={styles.inlinePickBtn}>
                    <ImageIconLucide size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Price (₹)"
                    placeholderTextColor={COLORS.outline}
                    keyboardType="numeric"
                    value={newItemPrice}
                    onChangeText={setNewItemPrice}
                  />
                  <View style={styles.unitToggleGroup}>
                    <TouchableOpacity
                      style={[styles.unitToggle, newItemUnit === 'KG' && styles.unitToggleActive]}
                      onPress={() => setNewItemUnit('KG')}
                    >
                      <Text style={[TYPO.labelSm, { color: newItemUnit === 'KG' ? COLORS.primary : COLORS.outline }]}>/ KG</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.unitToggle, newItemUnit === 'ITEM' && styles.unitToggleActive]}
                      onPress={() => setNewItemUnit('ITEM')}
                    >
                      <Text style={[TYPO.labelSm, { color: newItemUnit === 'ITEM' ? COLORS.primary : COLORS.outline }]}>/ Item</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                  <Button label="Cancel" variant="outline" onPress={() => { setIsAdding(false); setEditingItemId(null); }} style={{ flex: 1 }} />
                  <Button label={editingItemId ? 'Update Item' : 'Save Item'} onPress={handleAddItem} style={{ flex: 1 }} />
                </View>
              </SurfaceCard>
            ) : (
              <TouchableOpacity style={styles.addCTA} onPress={() => {
                setEditingItemId(null);
                setNewItemName('');
                setNewItemDesc('');
                setNewItemPrice('');
                setNewItemImage('');
                setIsAdding(true);
              }} activeOpacity={0.7}>
                <PlusIcon size={18} color={COLORS.primary} />
                <Text style={[TYPO.labelLg, { color: COLORS.primary }]}>Add New Item</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(9, 9, 11, 0.50)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    maxHeight: '90%',
    minHeight: '60%',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    boxShadow: '0px -10px 40px rgba(0, 0, 0, 0.08)' as any,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.outlineVariant,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsScroll: {
    flexGrow: 0,
    backgroundColor: '#FAFAFA',
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainer,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.2)',
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  addForm: {
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    ...TYPO.bodyLg,
    color: COLORS.onSurface,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    outlineWidth: 0,
  } as any,
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: 4,
  },
  unitToggle: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  unitToggleActive: {
    backgroundColor: COLORS.surfaceContainerLowest,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' as any,
  },
  inlinePickBtn: {
    padding: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderRadius: RADIUS.md,
    marginLeft: 8,
  },
});
