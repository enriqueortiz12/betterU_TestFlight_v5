import { Slot } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { UserProvider } from '../context/UserContext';
import { UnitsProvider } from '../context/UnitsContext';
import { TrackingProvider } from '../context/TrackingContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { preloadImages } from '../utils/imageUtils';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from '../context/SettingsContext';
import TypingAnimation from './components/TypingAnimation';
import IntroScreen from './components/IntroScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Initializing...');
  const [error, setError] = useState(null);
  const [contextsReady, setContextsReady] = useState(false);
  const [showTyping, setShowTyping] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const checkIntroStatus = async () => {
      try {
        const hasSeenIntro = await AsyncStorage.getItem('hasSeenIntro');
        if (hasSeenIntro === 'true') {
          setShowIntro(false);
        }
      } catch (error) {
        console.error('Error checking intro status:', error);
      }
    };
    checkIntroStatus();
  }, []);

  const handleIntroComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenIntro', 'true');
      setShowIntro(false);
    } catch (error) {
      console.error('Error saving intro status:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const initializeApp = async () => {
      try {
        // Initial delay to ensure basic setup
        if (!isMounted) return;
        setLoadingStep('Starting up...');
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, 1000);
        });
        
        // Preload images with timeout
        if (!isMounted) return;
        setLoadingStep('Loading assets...');
        const imageLoadPromise = preloadImages();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Image loading timeout')), 10000)
        );
        await Promise.race([imageLoadPromise, timeoutPromise]);
        
        // Give more time for contexts to initialize
        if (!isMounted) return;
        setLoadingStep('Preparing data...');
        
        // Set a maximum wait time for contexts
        const maxWaitTime = 5000; // 5 seconds
        const startTime = Date.now();
        
        // Wait for contexts to be ready with a timeout
        await new Promise((resolve) => {
          const checkContexts = () => {
            if (contextsReady || Date.now() - startTime > maxWaitTime) {
              resolve();
            } else {
              timeoutId = setTimeout(checkContexts, 500);
            }
          };
          checkContexts();
        });
        
        if (isMounted) {
          setIsReady(true);
          setError(null);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        if (isMounted) {
          setError(error.message);
          // Still set ready to true to prevent infinite loading
          setIsReady(true);
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [contextsReady]);

  if (showIntro) {
    return (
      <SafeAreaProvider>
        <IntroScreen onComplete={handleIntroComplete} />
      </SafeAreaProvider>
    );
  }
  
  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#00ffff" />
          {showTyping ? (
            <TypingAnimation 
              text="BetterU"
              onComplete={() => setShowTyping(false)}
            />
          ) : (
            <Text style={styles.loadingText}>{loadingStep}</Text>
          )}
          {error && (
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProvider onReady={() => {
          console.log('UserProvider ready callback called');
          setContextsReady(true);
        }}>
          <SettingsProvider>
            <UnitsProvider>
              <TrackingProvider>
                <Slot />
              </TrackingProvider>
            </UnitsProvider>
          </SettingsProvider>
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
    paddingHorizontal: 20
  }
});