import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { log } from './logger';

const expo = new Expo();

export const sendPushNotification = async (
  pushTokens: string[],
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> => {
  const brandedTitle = title.toLowerCase().startsWith('wow') ? title : `WoW Laundry — ${title}`;

  const messages: ExpoPushMessage[] = pushTokens
    .filter(token => {
      if (!Expo.isExpoPushToken(token)) {
        log.warn('Invalid Expo push token', { token });
        return false;
      }
      return true;
    })
    .map(to => ({
      to,
      sound: 'default' as const,
      title: brandedTitle,
      body,
      data,
      channelId: 'wow_laundry_channel',
      priority: 'high' as const,
    }));

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);

  Promise.allSettled(
    chunks.map(chunk => expo.sendPushNotificationsAsync(chunk))
  ).then(results => {
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        log.error(`Push notification chunk ${i} failed`, { error: result.reason?.message || result.reason });
      } else {
        const tickets = result.value;
        for (const ticket of tickets) {
          if (ticket.status === 'error') {
            log.error('Expo push ticket reported error', {
              message: ticket.message,
              details: (ticket as any).details,
            });
          }
        }
      }
    });
  }).catch(err => {
    log.error('Push notification dispatch error', { error: err?.message || err });
  });
  // Returns immediately — caller is never blocked
};
