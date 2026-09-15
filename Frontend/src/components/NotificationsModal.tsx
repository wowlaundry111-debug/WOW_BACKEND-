import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Animated } from 'react-native';
import { X, Trash2, BellRing } from 'lucide-react-native';
import { useNotificationStore, AppNotification } from '../store/useNotificationStore';
import { COLORS, TYPO, SPACING, RADIUS, SHADOW } from './Theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<Props> = ({ visible, onClose }) => {
  const { notifications, markAllAsRead, clearAll } = useNotificationStore();

  useEffect(() => {
    if (visible) {
      // Mark all as read when opening the modal
      markAllAsRead();
    }
  }, [visible, markAllAsRead]);

  const renderItem = ({ item }: { item: AppNotification }) => {
    const timeString = new Date(item.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', minute: '2-digit' 
    });
    const dateString = new Date(item.timestamp).toLocaleDateString();

    return (
      <View style={[styles.notifCard, !item.read && styles.unreadCard]}>
        <View style={styles.notifHeader}>
          <Text style={[TYPO.labelLg, styles.title]} numberOfLines={1}>{item.title}</Text>
          <Text style={[TYPO.labelSm, styles.time]}>{dateString} {timeString}</Text>
        </View>
        <Text style={[TYPO.bodyMd, styles.body]}>{item.body}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BellRing color={COLORS.onSurface} size={22} />
              <Text style={TYPO.titleLg}>Notifications</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {notifications.length > 0 && (
                <TouchableOpacity onPress={clearAll}>
                  <Trash2 color={COLORS.error} size={22} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <X color={COLORS.onSurfaceVariant} size={24} />
              </TouchableOpacity>
            </View>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <BellRing color={COLORS.surfaceVariant} size={48} style={{ marginBottom: 16 }} />
              <Text style={[TYPO.headlineSm, { color: COLORS.onSurfaceVariant }]}>No Notifications Yet</Text>
              <Text style={[TYPO.bodyMd, { color: COLORS.outline, textAlign: 'center', marginTop: 8 }]}>
                We'll let you know when your order status updates or a delivery boy is assigned!
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height: '80%',
    paddingTop: SPACING.lg,
    ...SHADOW.ambient,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.mobile,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerHighest,
  },
  list: {
    padding: SPACING.mobile,
    gap: SPACING.sm,
  },
  notifCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  unreadCard: {
    backgroundColor: `${COLORS.primary}10`, // Light tint of primary color
    borderColor: `${COLORS.primary}40`,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    color: COLORS.onSurface,
    marginRight: 8,
  },
  time: {
    color: COLORS.outline,
  },
  body: {
    color: COLORS.onSurfaceVariant,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});
