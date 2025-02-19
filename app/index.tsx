import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Link } from 'expo-router';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import welcomeAnimation from '../assets/animations/welcome.json';

export default function Welcome() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#000'] : ['#fff', '#f0f0f0']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        <LottieView
          source={welcomeAnimation}
          autoPlay
          loop
          style={styles.animation}
        />
        
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Welcome to NotiAlarm
        </Text>
        
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
          Set smart alarms with interactive notifications and custom messages
        </Text>

        <Link href="/setup" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Set Your First Alarm</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  animation: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000',
  },
  titleDark: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
    lineHeight: 24,
  },
  subtitleDark: {
    color: '#999',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});