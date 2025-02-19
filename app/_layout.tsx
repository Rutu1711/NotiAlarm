import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar, Alert } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Audio } from 'expo-av';

// Create a sound reference
let alarmSound: Audio.Sound | null = null;
let activeAlarmTimeout: NodeJS.Timeout | null = null;
let notificationListener: any = null;
let responseListener: any = null;

// Add this function to handle stopping the alarm
const stopAlarm = async () => {
  if (alarmSound) {
    await alarmSound.unloadAsync();
    alarmSound = null;
  }
  if (activeAlarmTimeout) {
    clearTimeout(activeAlarmTimeout);
    activeAlarmTimeout = null;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Update the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permissions function
async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications to use the alarm feature'
      );
      return false;
    }
    return true;
  }
  return false;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Add notification listeners
    notificationListener = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const data = notification.request.content.data;
        const isFirst = data?.isFirst;
        const selectedToneId = data?.selectedToneId;
        
        try {
          if (isFirst) {
            if (alarmSound) {
              await alarmSound.unloadAsync();
            }
            
            const { sound } = await Audio.Sound.createAsync(
              selectedToneId === 1
                ? require('../assets/sounds/morning-bliss.mp3')
                : require('../assets/sounds/beep-fest.mp3'),
              { 
                shouldPlay: true,
                isLooping: true,
                volume: 1.0,
              }
            );
            
            alarmSound = sound;
            
            // Stop the alarm after 1 minute
            activeAlarmTimeout = setTimeout(stopAlarm, 60000);
          }
        } catch (error) {
          console.error('Error playing alarm sound:', error);
        }
      }
    );

    responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        Alert.alert(
          'Stop Alarm',
          'Do you want to stop the alarm notifications?',
          [
            { text: 'Keep Running', style: 'cancel' },
            { 
              text: 'Stop Alarm', 
              style: 'destructive',
              onPress: stopAlarm,
            },
          ]
        );
      }
    );

    // Cleanup
    return () => {
      if (notificationListener) {
        Notifications.removeNotificationSubscription(notificationListener);
      }
      if (responseListener) {
        Notifications.removeNotificationSubscription(responseListener);
      }
      if (alarmSound) {
        alarmSound.unloadAsync();
      }
    };
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen 
          name="setup" 
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}