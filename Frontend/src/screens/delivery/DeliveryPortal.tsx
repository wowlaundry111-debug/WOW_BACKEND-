import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Truck, User, History } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { DeliveryTasksScreen } from './DeliveryTasks';
import { DeliveryHistoryScreen } from './DeliveryHistory';
import { DeliveryProfileScreen } from './DeliveryProfile';

type Tab = 'TASKS' | 'HISTORY' | 'PROFILE';

export const DeliveryPortal = () => {
  const [activeTab, setActiveTab] = useState<Tab>('TASKS');
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab: Tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'TASKS': return <DeliveryTasksScreen />;
      case 'HISTORY': return <DeliveryHistoryScreen />;
      case 'PROFILE': return <DeliveryProfileScreen />;
      default: return <DeliveryTasksScreen />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor="#002B2E" translucent />
      <View style={styles.content}>
        {renderScreen()}
      </View>
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TabButton
          icon={Truck}
          label="TASKS"
          isActive={activeTab === 'TASKS'}
          onPress={() => handleTabPress('TASKS')}
        />
        <TabButton
          icon={History}
          label="HISTORY"
          isActive={activeTab === 'HISTORY'}
          onPress={() => handleTabPress('HISTORY')}
        />
        <TabButton
          icon={User}
          label="PROFILE"
          isActive={activeTab === 'PROFILE'}
          onPress={() => handleTabPress('PROFILE')}
        />
      </View>
    </View>
  );
};

const TabButton = ({ icon: Icon, label, isActive, onPress }: any) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={styles.tabButton}
  >
    <View style={[styles.tabPill, isActive && styles.tabPillActive]}>
      <Icon
        size={18}
        color={isActive ? COLORS.black : '#6B7280'}
        strokeWidth={isActive ? 3 : 2}
      />
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#002B2E',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 2,
    borderTopColor: COLORS.black,
    paddingTop: 8,
    paddingHorizontal: SPACING.md,
    ...NEO_SHADOW.box4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  tabPillActive: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...NEO_SHADOW.box2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: COLORS.black,
  },
});
