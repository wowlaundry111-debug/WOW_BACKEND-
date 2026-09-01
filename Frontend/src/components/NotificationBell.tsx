import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNotificationStore } from '../store/useNotificationStore';
import { COLORS, TYPO, SPACING, RADIUS, SHADOW } from './Theme';
import { NotificationsModal } from './NotificationsModal';

interface NotificationBellProps {
  color?: string;
  buttonStyle?: any;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ color = COLORS.onSurface, buttonStyle }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const notifications = useNotificationStore((state) => state.notifications);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <TouchableOpacity 
        style={[styles.container, buttonStyle]} 
        onPress={() => setModalVisible(true)}
      >
        <Bell color={color} size={22} strokeWidth={2.5} />
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
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -5,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: COLORS.onError,
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Outfit_700Bold',
  },
});
