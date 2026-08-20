import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../services/api';
import { useAppStore } from '../store/useAppStore';

import { useNotificationStore } from '../store/useNotificationStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  
  const currentUser = useAppStore((state: any) => state.currentUser); // To know if user is logged in

  useEffect(() => {
    registerForPushNotificationsAsync().then(pushToken => {
      setExpoPushToken(pushToken);
      
      // If we got a token and we are logged in, send it to the backend immediately
      if (pushToken && currentUser) {
        saveTokenToBackend(pushToken);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      // Add it to our persistent store!
      useNotificationStore.getState().addNotification({
        title: notification.request.content.title || 'New Notification',
        body: notification.request.content.body || '',
        data: notification.request.content.data,
      });
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Here you could handle deep linking or navigation based on response.notification.request.content.data
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [currentUser]); // Re-run if user logs in/out

  async function saveTokenToBackend(pushToken: string) {
    try {
      await api.put('/auth/users/push-token', { expoPushToken: pushToken });
      console.log('Successfully registered push token with backend');
    } catch (error) {
      console.error('Failed to save push token to backend:', error);
    }
  }

  return {
    expoPushToken,
    notification,
  };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'web') {
    console.log('Push notifications are not supported on web');
    return undefined;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return undefined;
    }
    
    // Get project ID required for Expo EAS Build
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
    if (!projectId) {
      console.warn('No EAS projectId found in app.json. Remote push notifications are disabled. Run `eas init` to set up.');
      return undefined;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.error('Error fetching Expo Push Token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
