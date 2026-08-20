import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Truck, User, History } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, SHADOW } from '../../components/Theme';
import { DeliveryTasksScreen } from './DeliveryTasks';
import { DeliveryHistoryScreen } from './DeliveryHistory';
import { DeliveryProfileScreen } from './DeliveryProfile';

type Tab = 'TASKS' | 'HISTORY' | 'PROFILE';

export const DeliveryPortal = () => {
  const [activeTab, setActiveTab] = useState<Tab>('TASKS');

  const renderScreen = () => {
    switch (activeTab) {
      case 'TASKS': return <DeliveryTasksScreen />;
      case 'HISTORY': return <DeliveryHistoryScreen />;
      case 'PROFILE': return <DeliveryProfileScreen />;
      default: return <DeliveryTasksScreen />;
    }
  };

  return (
    <ImageBackground source={require('../../../assets/bg.png')} style={styles.bgImage} resizeMode="cover">
      <View style={styles.root}>
        <View style={styles.content}>
          {renderScreen()}
        </View>
        <View style={styles.tabBar}>
          <TabButton
            icon={Truck}
            label="Tasks"
            isActive={activeTab === 'TASKS'}
            onPress={() => setActiveTab('TASKS')}
          />
          <TabButton
            icon={History}
            label="History"
            isActive={activeTab === 'HISTORY'}
            onPress={() => setActiveTab('HISTORY')}
          />
          <TabButton
            icon={User}
            label="Profile"
            isActive={activeTab === 'PROFILE'}
            onPress={() => setActiveTab('PROFILE')}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

const TabButton = ({ icon: Icon, label, isActive, onPress }: any) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={styles.tabButton}
  >
    <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
      <Icon size={22} color={isActive ? COLORS.primary : COLORS.outline} />
    </View>
    <Text style={[TYPO.labelSm, { color: isActive ? COLORS.primary : COLORS.outline, marginTop: 4, fontWeight: isActive ? '700' : '500' }]}>
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
    height: 64,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainer,
    paddingBottom: 4,
    paddingHorizontal: SPACING.md,
    ...SHADOW.ambient,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
});
