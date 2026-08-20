/**
 * WOW Laundry — Admin Manage Categories (Catalog) Screen
 * Premium UI/UX design:
 *  • Focus-ring active Search bar
 *  • 2-col bento category grid with low-opacity soft colors & vector icons
 *  • Dash-bordered premium CTA card
 *  • Glowing violet FAB (spring active rotate animation)
 *  • Glass-frosted bottom sheet for catalog additions
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Shirt, Sparkles, Snowflake, Bed, Home, Leaf, Package, Search, Plus, X, Image as ImageIcon, Store, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW, GLASS } from '../../components/Theme';
import { ToggleSwitch, Button } from '../../components/UIPack';
import { Skeleton } from '../../components/SkeletonLoaders';
import { useAppStore } from '../../store/useAppStore';
import { CategoryDetailsModal } from './CategoryDetailsModal';

const XIcon = X as any;
const PlusIcon = Plus as any;
const SearchIcon = Search as any;


// Map of category names to beautiful vector icons & custom HSL colors
const CATEGORY_STYLES: Record<string, { Icon: any; bg: string; color: string; gradient: string[]; border: string }> = {
  'Men Wear':          { Icon: Shirt as any,     bg: 'rgba(59, 130, 246, 0.08)',  color: '#0284C7', gradient: ['#EFF6FF', '#DBEAFE'], border: 'rgba(59, 130, 246, 0.15)' },
  'Women Wear':        { Icon: Sparkles as any,  bg: 'rgba(236, 72, 153, 0.08)', color: '#DB2777', gradient: ['#FDF2F8', '#FCE7F3'], border: 'rgba(236, 72, 153, 0.15)' },
  'Winter Wear':       { Icon: Snowflake as any, bg: 'rgba(249, 115, 22, 0.08)',  color: '#D97706', gradient: ['#FFF7ED', '#FFEDD5'], border: 'rgba(249, 115, 22, 0.15)' },
  'Bedsheets & Linen': { Icon: Bed as any,       bg: 'rgba(16, 185, 129, 0.08)',  color: '#059669', gradient: ['#ECFDF5', '#D1FAE5'], border: 'rgba(16, 185, 129, 0.15)' },
  'Apparel Dryclean':  { Icon: Package as any,   bg: 'rgba(75, 85, 99, 0.08)',    color: '#4B5563', gradient: ['#EEF2F6', '#E2E8F0'], border: 'rgba(75, 85, 99, 0.15)' },
  'Home & Curtains':   { Icon: Home as any,      bg: 'rgba(124, 58, 237, 0.08)',  color: '#7C3AED', gradient: ['#F5F3FF', '#EDE9FE'], border: 'rgba(124, 58, 237, 0.15)' },
  'Eco Wash & Fold':   { Icon: Leaf as any,      bg: 'rgba(34, 197, 94, 0.08)',   color: '#16A34A', gradient: ['#F0FDF4', '#DCFCE7'], border: 'rgba(34, 197, 94, 0.15)' },
};

const getCategoryStyle = (name: string) =>
  CATEGORY_STYLES[name] ?? {
    Icon: Package as any,
    bg: 'rgba(0, 168, 232, 0.08)',
    color: COLORS.primary,
    gradient: ['#F3F4F6', '#E5E7EB'],
    border: 'rgba(0, 168, 232, 0.15)'
  };

// ─── Category Card ────────────────────────────────────────────────────────────
interface CategoryCardProps {
  id: string;
  name: string;
  image?: string;
  itemCount: number;
  enabled: boolean;
  onToggle: (val: boolean) => void;
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ name, image, itemCount, enabled, onToggle, onPress }) => {
  const style = getCategoryStyle(name);
  const IconComponent = style.Icon;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.catCard,
        { backgroundColor: style.gradient[0], borderColor: style.border },
        !enabled && { opacity: 0.55 }
      ]}
    >
      {/* Icon + Toggle header */}
      <View style={styles.catCardHeader}>
        {image ? (
          <Image source={{ uri: image }} style={styles.catIconBox} />
        ) : (
          <View style={[styles.catIconBox, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: style.border }]}>
            <IconComponent size={22} color={style.color} />
          </View>
        )}
        <ToggleSwitch value={enabled} onToggle={onToggle} />
      </View>

      {/* Name + count badge */}
      <View style={{ marginTop: SPACING.md }}>
        <Text style={[TYPO.labelLg, { color: COLORS.onSurface, marginBottom: 6 }]}>{name}</Text>
        <View style={styles.countBadge}>
          <Text style={[TYPO.labelSm, { color: COLORS.onSurfaceVariant, fontSize: 11 }]}>{itemCount} Services</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Add Category Sheet (Glass bottom sheet modal) ───────────────────────────
interface AddCatSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string, image?: string) => void;
}

const AddCatSheet: React.FC<AddCatSheetProps> = ({ visible, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 300,
      useNativeDriver: Platform.OS !== 'web',
      speed: 20,
      bounciness: 6,
    }).start();
  }, [visible]);

  const handleConfirm = () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter a category name'); return; }
    onConfirm(name.trim(), image.trim() || undefined);
    setName('');
    setImage('');
    onClose();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const webBlurStyle: any = {
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.sheetWrapper, { pointerEvents: 'box-none' as any }]}
      >
        <Animated.View style={[styles.sheet, webBlurStyle, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={[TYPO.headlineMd, { color: COLORS.onSurface }]}>Add New Category</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <XIcon size={18} color={COLORS.outline} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.sheetInput}
            placeholder="e.g. Bed Linen & Sheets"
            placeholderTextColor={COLORS.outline}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <TextInput
            style={[styles.sheetInput, { marginTop: SPACING.md }]}
            placeholder="Category Image URL (Optional)"
            placeholderTextColor={COLORS.outline}
            value={image}
            onChangeText={setImage}
          />
          <TouchableOpacity onPress={pickImage} style={styles.pickImageBtn}>
            <ImageIcon size={16} color={COLORS.primary} />
            <Text style={[TYPO.labelLg, { color: COLORS.primary }]}>Upload from Device</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg }}>
            <Button label="Cancel" onPress={onClose} variant="outline" style={{ flex: 1 }} />
            <Button label="Add Category" onPress={handleConfirm} style={{ flex: 1 }} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── FAB with Rotate Micro-Animation ──────────────────────────────────────────
const FloatingAddBtn: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const rot = useRef(new Animated.Value(0)).current;
  const [open, setOpen] = useState(false);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    Animated.spring(rot, { toValue: next ? 1 : 0, useNativeDriver: Platform.OS !== 'web', speed: 20, bounciness: 8 }).start();
    onPress();
  };

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <TouchableOpacity style={styles.fab} onPress={toggle} activeOpacity={0.85}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <PlusIcon size={24} color={COLORS.onPrimary} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const AdminCatalogScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [disabledCats, setDisabledCats] = useState<Set<string>>(new Set());
  const [searchFocused, setSearchFocused] = useState(false);

  const [inspectedShopId, setInspectedShopId] = useState<string | null>(null);

  const { categories, items, currentTenantId, setCurrentTenantId, addCategory, fetchCatalog, isLoading, shops, currentUser } = useAppStore();
  
  const activeShopId = (currentUser?.role === 'SuperAdmin' && !currentTenantId) ? inspectedShopId : currentTenantId;
  const isGlobalSuperAdmin = currentUser?.role === 'SuperAdmin' && !currentTenantId && !inspectedShopId;
  const inspectedShop = shops.find(s => s._id === inspectedShopId);

  const tenantCats = categories.filter(c => c.shopId === activeShopId);
  const tenantItems = items.filter(i => i.shopId === activeShopId);

  const handleShopSelect = async (shopId: string) => {
    setInspectedShopId(shopId);
    await fetchCatalog(shopId);
  };

  const filtered = tenantCats.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  const itemCount = (catId: string) => tenantItems.filter(i => i.categoryId === catId).length;

  const toggleCat = (id: string, val: boolean) => {
    setDisabledCats(prev => {
      const next = new Set(prev);
      val ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Title block */}
        <View style={styles.headerBlock}>
          {inspectedShopId && (
            <TouchableOpacity onPress={() => setInspectedShopId(null)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
              <ArrowLeft size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={[TYPO.labelLg, { color: COLORS.primary }]}>Back to Branches</Text>
            </TouchableOpacity>
          )}
          <Text style={[TYPO.headlineLg, { color: COLORS.onSurface }]}>
            {isGlobalSuperAdmin 
              ? 'Select Branch' 
              : inspectedShop 
                ? `${inspectedShop.name} Catalog`
                : 'Category Catalog'}
          </Text>
          <Text style={[TYPO.bodyMd, { color: COLORS.onSurfaceVariant, marginTop: 4 }]}>
            {isGlobalSuperAdmin 
              ? 'Choose a branch below to manage its specific services and catalog.'
              : inspectedShop 
                ? `Managing services and pricing for ${inspectedShop.name}.`
                : 'Configure services, active channels, and catalog listings.'}
          </Text>
        </View>

        {/* Search bar with glowing focus border */}
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <SearchIcon size={18} color={searchFocused ? COLORS.primary : COLORS.outline} />
          <TextInput
            placeholder="Search categories..."
            placeholderTextColor={COLORS.outline}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={styles.searchInput}
          />
        </View>

        {/* Bento Grid */}
        <View style={styles.grid}>
          {isLoading ? (
            <>
              <View style={styles.gridItem}>
                <Skeleton width="100%" height={165} borderRadius={RADIUS.lg} />
              </View>
              <View style={styles.gridItem}>
                <Skeleton width="100%" height={165} borderRadius={RADIUS.lg} />
              </View>
            </>
          ) : isGlobalSuperAdmin ? (
            shops.map(shop => (
              <View key={shop._id} style={styles.gridItem}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleShopSelect(shop._id)}
                  style={[styles.catCard, { justifyContent: 'center', alignItems: 'center' }]}
                >
                  <View style={[styles.catIconBox, { backgroundColor: 'rgba(124, 58, 237, 0.08)', marginBottom: SPACING.md }]}>
                    <Store size={26} color={COLORS.primary} />
                  </View>
                  <Text style={[TYPO.labelLg, { color: COLORS.onSurface, textAlign: 'center' }]}>{shop.name}</Text>
                  <Text style={[TYPO.labelSm, { color: COLORS.outline, marginTop: 4, textAlign: 'center' }]}>{shop.branches.join(', ')}</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <>
              {filtered.map(cat => (
                <View key={cat._id} style={styles.gridItem}>
                  <CategoryCard
                    id={cat._id}
                    name={cat.name}
                    image={cat.image}
                    itemCount={itemCount(cat._id)}
                    enabled={!disabledCats.has(cat._id)}
                    onToggle={(val) => toggleCat(cat._id, val)}
                    onPress={() => setActiveCategoryId(cat._id)}
                  />
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      {!isGlobalSuperAdmin && <FloatingAddBtn onPress={() => setSheetOpen(true)} />}

      {/* Slide Modal */}
      <AddCatSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onConfirm={(name, image) => addCategory(name, image, inspectedShopId || undefined)}
      />

      <CategoryDetailsModal
        visible={!!activeCategoryId}
        categoryId={activeCategoryId}
        onClose={() => setActiveCategoryId(null)}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.mobile,
    paddingTop: SPACING.lg,
    paddingBottom: 140,
  },
  headerBlock: {
    marginBottom: SPACING.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm - 2,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...SHADOW.ambient,
  },
  searchBarFocused: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  searchInput: {
    flex: 1,
    ...TYPO.bodyLg,
    fontSize: 14,
    color: COLORS.onSurface,
    borderWidth: 0,
    outlineWidth: 0, // Web support to remove default input outline
  } as any,
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.gutter,
  },
  gridItem: {
    width: '47%',
  },
  catCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 2,
    minHeight: 165,
    justifyContent: 'space-between',
    ...SHADOW.ambient,
  },
  catCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  addCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    minHeight: 165,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: SPACING.mobile,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.glow(COLORS.primary),
  },
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
    paddingBottom: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.outlineVariant,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  sheetInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
    ...TYPO.bodyLg,
    color: COLORS.onSurface,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    outlineWidth: 0,
  } as any,
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
});
