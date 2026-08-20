import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export const sendPushNotification = async (
  pushTokens: string[],
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> => {
  const messages: ExpoPushMessage[] = pushTokens
    .filter(token => {
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Invalid Expo push token: ${token}`);
        return false;
      }
      return true;
    })
    .map(to => ({ to, sound: 'default' as const, title, body, data }));

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);

  // Send all chunks in parallel — do NOT await sequentially
  Promise.allSettled(
    chunks.map(chunk => expo.sendPushNotificationsAsync(chunk))
  ).then(results => {
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`Push notification chunk ${i} failed:`, result.reason);
      }
    });
  }).catch(err => {
    console.error('Push notification dispatch error:', err);
  });
  // Returns immediately — caller is never blocked
};
