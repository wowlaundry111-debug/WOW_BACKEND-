import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void;
  markAllAsRead: () => void;
  clearOldNotifications: () => void;
  clearAll: () => void;
}

const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotif: AppNotification = {
          ...notification,
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          timestamp: Date.now(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      clearOldNotifications: () => {
        const now = Date.now();
        set((state) => ({
          notifications: state.notifications.filter(
            (n) => now - n.timestamp < FORTY_EIGHT_HOURS
          ),
        }));
      },

      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: 'wow-laundry-notifications', // unique name for storage key
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
