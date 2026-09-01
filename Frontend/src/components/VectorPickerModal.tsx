import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { X, Search, Sparkles, Check } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from './Theme';
import { VECTOR_GALLERY, VectorItem } from '../utils/vectorGallery';

interface VectorPickerModalProps {
  visible: boolean;
  selectedUrl?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

const CATEGORIES = ['ALL', 'EVERYDAY', 'FORMALS', 'WINTER', 'BEDDING', 'FOOTWEAR', 'ACCESSORIES'];

export const VectorPickerModal: React.FC<VectorPickerModalProps> = ({
  visible,
  selectedUrl,
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('ALL');

  const filtered = VECTOR_GALLERY.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (activeCat === 'ALL') return true;
    if (activeCat === 'EVERYDAY' && item.category.toLowerCase().includes('everyday')) return true;
    if (activeCat === 'FORMALS' && item.category.toLowerCase().includes('formal')) return true;
    if (activeCat === 'WINTER' && item.category.toLowerCase().includes('winter')) return true;
    if (activeCat === 'BEDDING' && (item.category.toLowerCase().includes('bedding') || item.category.toLowerCase().includes('home'))) return true;
    if (activeCat === 'FOOTWEAR' && item.category.toLowerCase().includes('footwear')) return true;
    if (activeCat === 'ACCESSORIES' && (item.category.toLowerCase().includes('accessories') || item.category.toLowerCase().includes('bag'))) return true;

    return false;
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={20} color={COLORS.black} strokeWidth={2.5} />
              <Text style={styles.title}>VECTOR ASSET GALLERY</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={20} color={COLORS.black} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBox}>
            <Search size={16} color="#6B7280" strokeWidth={2.5} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search t-shirt, suit, shoes, blanket..."
              placeholderTextColor="#6B7280"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCat === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tabChip, isActive && styles.activeTabChip]}
                  onPress={() => setActiveCat(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, isActive && styles.activeTabText]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Grid of 30 Vectors */}
          <ScrollView style={styles.gridScroll} contentContainerStyle={styles.gridContainer}>
            {filtered.map((item) => {
              const isSelected = selectedUrl === item.url;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.vectorCard, isSelected && styles.selectedVectorCard]}
                  onPress={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Check size={12} color={COLORS.black} strokeWidth={3} />
                    </View>
                  )}
                  <View style={styles.imageBox}>
                    <ExpoImage
                      source={{ uri: item.url }}
                      style={styles.vectorImage}
                      contentFit="contain"
                      priority="high"
                    />
                  </View>
                  <Text style={styles.vectorName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.vectorCat} numberOfLines={1}>
                    {item.category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderWidth: 2,
    borderColor: COLORS.black,
    maxHeight: '85%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.full,
    backgroundColor: '#F3F4F6',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },
  tabScroll: {
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    maxHeight: 38,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  activeTabChip: {
    backgroundColor: COLORS.black,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: COLORS.secondary,
  },
  gridScroll: {
    paddingHorizontal: SPACING.lg,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 20,
  },
  vectorCard: {
    width: '30%',
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.lg,
    padding: 8,
    alignItems: 'center',
    position: 'relative',
  },
  selectedVectorCard: {
    borderColor: COLORS.black,
    backgroundColor: '#F0FDF4',
    ...NEO_SHADOW.box2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  imageBox: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  vectorImage: {
    width: '100%',
    height: '100%',
  },
  vectorName: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
    width: '100%',
  },
  vectorCat: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
});
