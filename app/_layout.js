import { Slot } from 'expo-router';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';
import { UserProvider } from '../context/UserContext';
import { UnitsProvider } from '../context/UnitsContext';
import { TrackingProvider } from '../context/TrackingContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { preloadImages } from '../utils/imageUtils';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Initializing...');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initial delay to ensure basic setup
        setLoadingStep('Starting up...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Preload images
        setLoadingStep('Loading assets...');
        await preloadImages();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Give more time for contexts to initialize
        setLoadingStep('Preparing data...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Still set ready to true to prevent infinite loading
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00ffff" />
        <Text style={styles.loadingText}>{loadingStep}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AuthProvider>
        <UserProvider>
          <UnitsProvider>
            <TrackingProvider>
              <Slot />
            </TrackingProvider>
          </UnitsProvider>
        </UserProvider>
      </AuthProvider>
    </NavigationContainer>
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
  }
}); 