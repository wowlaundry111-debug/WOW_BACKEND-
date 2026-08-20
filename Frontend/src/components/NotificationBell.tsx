import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNotificationStore } from '../store/useNotificationStore';
import { COLORS, TYPO, SPACING, RADIUS, SHADOW } from './Theme';
import { NotificationsModal } from './NotificationsModal';

export const NotificationBell = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const notifications = useNotificationStore((state) => state.notifications);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <TouchableOpacity 
        style={styles.container} 
        onPress={() => setModalVisible(true)}
      >
        <Bell color={COLORS.onSurface} size={24} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      <NotificationsModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'relative',
    marginRight: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: COLORS.onError,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Outfit_700Bold',
  },
});
