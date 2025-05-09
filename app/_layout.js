import { Slot } from 'expo-router';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';
import { UserProvider } from '../context/UserContext';
import { UnitsProvider } from '../context/UnitsContext';
import { TrackingProvider } from '../context/TrackingContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { preloadImages } from '../utils/imageUtils';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Preload images
        await preloadImages();
        
        // Give more time for contexts to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
    backgroundColor: '#ffffff'
  }
}); 