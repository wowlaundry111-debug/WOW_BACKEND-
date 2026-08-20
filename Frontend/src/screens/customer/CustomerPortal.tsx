import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, ListOrdered, User } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { CustomerHomeScreen } from './CustomerHome';
import { CustomerOrdersScreen } from './CustomerOrders';
import { CustomerShopScreen } from './CustomerShop';
import { CustomerCartScreen } from './CustomerCart';
import { CustomerProfileScreen } from './CustomerProfile';
import { CustomerShopSelectScreen } from './CustomerShopSelect';
import { useAppStore } from '../../store/useAppStore';

type Tab = 'HOME' | 'SHOP' | 'CART' | 'ORDERS' | 'PROFILE';

export const CustomerPortal = () => {
  const { currentTenantId, setCurrentTenantId } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('HOME');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const navigateToShop = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setActiveTab('SHOP');
  };

  const renderScreen = () => {
    if (!currentTenantId) {
      return <CustomerShopSelectScreen onShopSelect={setCurrentTenantId} />;
    }
    switch (activeTab) {
      case 'HOME': return <CustomerHomeScreen onCategoryPress={navigateToShop} onOpenCart={() => setActiveTab('CART')} />;
      case 'SHOP': return <CustomerShopScreen categoryId={selectedCategoryId} onSelectCategory={setSelectedCategoryId} onBack={() => setActiveTab('HOME')} onOpenCart={() => setActiveTab('CART')} />;
      case 'CART': return <CustomerCartScreen onBack={() => setActiveTab('HOME')} onCheckoutSuccess={() => setActiveTab('ORDERS')} />;
      case 'ORDERS': return <CustomerOrdersScreen />;
      case 'PROFILE': return <CustomerProfileScreen onNavigateToOrders={() => setActiveTab('ORDERS')} />;
      default: return <CustomerHomeScreen onCategoryPress={navigateToShop} onOpenCart={() => setActiveTab('CART')} />;
    }
  };

  return (
    <ImageBackground source={require('../../../assets/bg.png')} style={styles.bgImage} resizeMode="cover">
      <View style={styles.root}>
        <View style={styles.content}>
          {renderScreen()}
        </View>
        {currentTenantId && (
          <View style={styles.tabBar}>
            <TabButton
              icon={Home}
              label="Home"
              isActive={activeTab === 'HOME'}
              onPress={() => setActiveTab('HOME')}
            />
            <TabButton
              icon={ListOrdered}
              label="Orders"
              isActive={activeTab === 'ORDERS'}
              onPress={() => setActiveTab('ORDERS')}
            />
            <TabButton
              icon={User}
              label="Profile"
              isActive={activeTab === 'PROFILE'}
              onPress={() => setActiveTab('PROFILE')}
            />
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const TabButton = ({ icon: Icon, label, isActive, onPress }: any) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={styles.tabButton}
  >
    <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
      <Icon 
        size={22} 
        color={isActive ? COLORS.primary : COLORS.outline} 
        fill={isActive ? COLORS.primary + '20' : 'none'} 
      />
    </View>
    <Text style={[TYPO.labelSm, { color: isActive ? COLORS.primary : COLORS.outline, marginTop: 4, fontWeight: isActive ? '800' : '600' }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    paddingBottom: 8,
    paddingHorizontal: SPACING.md,
    ...SHADOW.ambient,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(0, 168, 232, 0.06)',
    borderColor: 'rgba(0, 168, 232, 0.12)',
    ...SHADOW.glow(COLORS.primary),
  },
});
