import { Slot } from 'expo-router';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';
import { UserProvider } from '../context/UserContext';
import { UnitsProvider } from '../context/UnitsContext';
import { TrackingProvider } from '../context/TrackingContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate some initialization time
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
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
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 