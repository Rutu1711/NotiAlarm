import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  useColorScheme,
  Alert,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import successAnimation from '../assets/animations/success.json';
import alarmAnimation from '../assets/animations/alarm.json';

const { width } = Dimensions.get('window');

const ALARM_TONES = [
  { 
    id: 1, 
    name: 'Morning Bliss', 
    file: require('../assets/sounds/morning-bliss.mp3'),
    icon: 'sunny' as const
  },
  { 
    id: 2, 
    name: 'Beep Fest', 
    file: require('../assets/sounds/beep-fest.mp3'),
    icon: 'notifications' as const
  },
];

const REPEAT_OPTIONS = [
  { id: 'once', label: 'Once' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
];

type NotificationTrigger = {
  hour: number;
  minute: number;
  second: number;
  repeats: boolean;
  weekday?: number;
};

export default function AlarmSetup() {
  const [date, setDate] = useState(new Date());
  const [message, setMessage] = useState('Amount Credited!');
  const [selectedTone, setSelectedTone] = useState(ALARM_TONES[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [repeatOption, setRepeatOption] = useState('once');
  const [vibrate, setVibrate] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const sound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return sound.current
      ? () => {
          sound.current?.unloadAsync();
        }
      : undefined;
  }, []);

  const playTone = async (toneFile: number) => {
    try {
      if (sound.current) {
        await sound.current.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        toneFile,
        { shouldPlay: true }
      );
      sound.current = newSound;
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert('Error', 'Could not play the selected tone');
    }
  };

  const scheduleAlarm = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications to set alarms',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const notifications = [];
      
      // Get the current time and the target time
      const now = new Date();
      const targetTime = new Date(date);
      
      // If the selected time is earlier than now, set it for tomorrow
      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      // Schedule notifications for 1 minute at 1-second intervals
      for (let i = 0; i < 60; i++) {
        const notificationTime = new Date(targetTime);
        notificationTime.setSeconds(notificationTime.getSeconds() + i);

        let trigger;
        
        if (repeatOption === 'once') {
          trigger = notificationTime;
        } else {
          // For repeating alarms
          trigger = {
            hour: targetTime.getHours(),
            minute: targetTime.getMinutes(),
            second: i, // Spread notifications across 60 seconds
            repeats: true,
          };

          if (repeatOption === 'weekdays') {
            trigger.weekdays = [2, 3, 4, 5, 6]; // Monday to Friday
          } else if (repeatOption === 'weekends') {
            trigger.weekdays = [1, 7]; // Sunday and Saturday
          }
        }

        notifications.push(
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Alarm',
              body: message,
              sound: 'default',
              vibrate: vibrate ? [0, 250, 250, 250] : undefined,
              data: { 
                selectedToneId: selectedTone.id,
                repeatOption,
                isFirst: i === 0,
                alarmTime: targetTime.toISOString(),
              },
            },
            trigger,
          })
        );
      }
      
      await Promise.all(notifications);
      setShowSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      Alert.alert('Error', 'Could not schedule the alarm');
    }
  };

  const renderTimePickerContent = () => {
    if (Platform.OS === 'ios') {
      return (
        <View style={styles.timeContainer}>
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour={true}
            onChange={(event, selectedDate) => {
              setDate(selectedDate || date);
            }}
            style={styles.timePicker}
          />
        </View>
      );
    }

    return (
      <Pressable
        style={styles.timeDisplay}
        onPress={() => {
          DateTimePicker.open({
            value: date,
            mode: 'time',
            is24Hour: true,
            onChange: (event, selectedDate) => {
              setDate(selectedDate || date);
            },
          });
        }}>
        <Text style={[styles.timeText, isDark && styles.textDark]}>
          {format(date, 'hh:mm a')}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#000'] : ['#fff', '#f8f9fa']}
        style={StyleSheet.absoluteFill}
      />
      
      {showSuccess ? (
        <View style={styles.successContainer}>
          <LottieView
            source={successAnimation}
            autoPlay
            loop={false}
            style={styles.successAnimation}
          />
          <Text style={[styles.successText, isDark && styles.textDark]}>
            Alarm Set Successfully!
          </Text>
        </View>
      ) : (
        <>
          <Animated.View entering={FadeInUp.delay(200)}>
            <Text style={[styles.title, isDark && styles.textDark]}>Set Your Alarm</Text>
            {renderTimePickerContent()}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)} style={styles.inputContainer}>
            <Text style={[styles.label, isDark && styles.textDark]}>Notification Message</Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter notification message"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)} style={styles.repeatContainer}>
            <Text style={[styles.label, isDark && styles.textDark]}>Repeat</Text>
            <View style={styles.repeatOptions}>
              {REPEAT_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.repeatOption,
                    repeatOption === option.id && styles.selectedRepeatOption,
                    isDark && styles.repeatOptionDark,
                  ]}
                  onPress={() => setRepeatOption(option.id)}
                >
                  <Text
                    style={[
                      styles.repeatOptionText,
                      repeatOption === option.id && styles.selectedRepeatOptionText,
                      isDark && styles.textDark,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(800)} style={styles.tonesContainer}>
            <Text style={[styles.label, isDark && styles.textDark]}>Select Tone</Text>
            {ALARM_TONES.map((tone) => (
              <Pressable
                key={tone.id}
                style={[
                  styles.toneButton,
                  selectedTone.id === tone.id && styles.selectedTone,
                  isDark && styles.toneButtonDark,
                ]}
                onPress={() => setSelectedTone(tone)}
              >
                <View style={styles.toneInfo}>
                  <Ionicons
                    name={tone.icon}
                    size={24}
                    color={isDark ? '#fff' : '#007AFF'}
                    style={styles.toneIcon}
                  />
                  <Text style={[styles.toneName, isDark && styles.textDark]}>
                    {tone.name}
                  </Text>
                </View>
                <Pressable
                  style={styles.playButton}
                  onPress={() => playTone(tone.file)}
                >
                  <Ionicons
                    name="play-circle"
                    size={24}
                    color={isDark ? '#fff' : '#007AFF'}
                  />
                </Pressable>
              </Pressable>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1000)} style={styles.optionsContainer}>
            <Pressable
              style={[styles.optionButton, isDark && styles.optionButtonDark]}
              onPress={() => setVibrate(!vibrate)}
            >
              <Text style={[styles.optionText, isDark && styles.textDark]}>Vibration</Text>
              <Ionicons
                name={vibrate ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={24}
                color={isDark ? '#fff' : '#007AFF'}
              />
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1200)}>
            <Pressable
              style={[styles.setButton, isDark && styles.setButtonDark]}
              onPress={scheduleAlarm}
            >
              <Text style={styles.setButtonText}>Set Alarm</Text>
            </Pressable>
          </Animated.View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#000',
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
  },
  timePicker: {
    width: 200,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  inputDark: {
    borderColor: '#333',
    color: '#fff',
    backgroundColor: '#1a1a1a',
  },
  repeatContainer: {
    marginBottom: 30,
  },
  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repeatOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  repeatOptionDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  selectedRepeatOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  repeatOptionText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedRepeatOptionText: {
    color: '#fff',
  },
  tonesContainer: {
    marginBottom: 30,
  },
  toneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toneButtonDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  selectedTone: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  toneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toneIcon: {
    marginRight: 12,
  },
  toneName: {
    fontSize: 16,
    color: '#000',
  },
  playButton: {
    padding: 5,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionButtonDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  setButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  setButtonDark: {
    backgroundColor: '#0A84FF',
  },
  setButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  successAnimation: {
    width: 200,
    height: 200,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#000',
  },
  textDark: {
    color: '#fff',
  },
});