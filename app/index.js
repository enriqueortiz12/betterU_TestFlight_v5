import { Redirect } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          
          // Check onboarding status if we have a session
          if (initialSession?.user?.id) {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', initialSession.user.id)
              .single();
            
            if (!error && profile) {
              setOnboardingCompleted(profile.onboarding_completed);
            }
          }
          
          setIsLoading(false);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (mounted) {
            setSession(session);
            
            // Check onboarding status on auth change
            if (session?.user?.id) {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', session.user.id)
                .single();
              
              if (!error && profile) {
                setOnboardingCompleted(profile.onboarding_completed);
              }
            } else {
              setOnboardingCompleted(null);
            }
            
            setIsLoading(false);
          }
        });

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00ffff" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  // If we have a session but onboarding is not completed, redirect to onboarding
  if (session && onboardingCompleted === false) {
    return <Redirect href="/(auth)/onboarding/welcome" />;
  }

  // If we have a session and onboarding is completed, redirect to the main app
  if (session && onboardingCompleted === true) {
    return <Redirect href="/(tabs)/home" />;
  }

  // If no session, redirect to login
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#00ffff',
    marginTop: 10,
  },
}); 