/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

async function displayNotification(remoteMessage) {
  const title = remoteMessage.notification?.title ?? 'Smart Home';
  const body = remoteMessage.notification?.body ?? 'New notification';

  await notifee.createChannel({
    id: 'alerts',
    name: 'Alerts',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'alerts',
      importance: AndroidImportance.HIGH,
      smallIcon: 'ic_stat_smart_home_custom',
      sound: 'default',
      pressAction: { id: 'default' },
    },
    ios: {
      sound: 'default',
    },
  });
}

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  await displayNotification(remoteMessage);
});

messaging().onMessage(async (remoteMessage) => {
  await displayNotification(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
