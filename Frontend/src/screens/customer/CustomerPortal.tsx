import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, ListOrdered, User } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
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
    <View style={styles.root}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      {currentTenantId && activeTab !== 'CART' && (
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
  );
};

const TabButton = ({ icon: Icon, label, isActive, onPress }: any) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={styles.tabButton}
  >
    <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
      <Icon 
        size={20} 
        color={isActive ? COLORS.black : '#6B7280'} 
        strokeWidth={isActive ? 3 : 2.2}
      />
      <Text style={[styles.tabLabel, { color: isActive ? COLORS.black : '#6B7280' }]}>
        {label}
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 68,
    backgroundColor: COLORS.white,
    borderTopWidth: 2,
    borderTopColor: COLORS.black,
    paddingBottom: 4,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  iconContainerActive: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...NEO_SHADOW.box2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
