"use client"

import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "../lib/supabase"

// Create user context with proper type
const UserContext = createContext({
  userProfile: null,
  isLoading: true,
  initializationError: null,
  updateProfile: () => {},
  personalRecords: [],
  fetchPersonalRecords: () => {},
  addPersonalRecord: () => {},
  isPremium: false,
  checkSubscriptionStatus: () => {},
});

export const UserProvider = ({ children, onReady }) => {
  const [userProfile, setUserProfile] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    goal: "",
    trainingLevel: "intermediate",
    fitness_goal: "",
    gender: ""
  })

  const [isLoading, setIsLoading] = useState(true)
  const [initializationError, setInitializationError] = useState(null)
  const [personalRecords, setPersonalRecords] = useState([]);
  const [isPremium, setIsPremium] = useState(false);

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      console.log('[UserContext] Checking subscription status...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[UserContext] No user found, setting isPremium to false');
        setIsPremium(false);
        return;
      }

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[UserContext] No active subscription found');
          setIsPremium(false);
          return;
        }
        console.error('[UserContext] Error checking subscription:', error);
        setIsPremium(false);
        return;
      }

      if (subscription) {
        const endDate = new Date(subscription.end_date);
        const isActive = endDate > new Date();
        console.log('[UserContext] Subscription found, isActive:', isActive);
        setIsPremium(isActive);
      } else {
        console.log('[UserContext] No active subscription found');
        setIsPremium(false);
      }
    } catch (error) {
      console.error('[UserContext] Error in checkSubscriptionStatus:', error);
      setIsPremium(false);
    }
  };

  // Sync profile from Supabase to context and AsyncStorage
  const syncProfileFromSupabase = async () => {
    try {
      console.log('[UserContext] syncProfileFromSupabase called');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[UserContext] No user found during profile sync');
        // Clear AsyncStorage when no user is found
        await AsyncStorage.removeItem('userProfile');
        setIsLoading(false);
        return;
      }

      // Fetch profile using id instead of user_id
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[UserContext] Error fetching profile from Supabase:', error);
        // Clear AsyncStorage on error
        await AsyncStorage.removeItem('userProfile');
        setIsLoading(false);
        return;
      }

      if (data) {
        console.log('[UserContext] Profile data from Supabase:', data);
        // Only update AsyncStorage if we have valid data
        await AsyncStorage.setItem('userProfile', JSON.stringify(data));
        setUserProfile(data);
      } else {
        // No profile found, set empty profile and clear AsyncStorage
        console.log('[UserContext] No profile found, setting empty profile');
        const emptyProfile = {
          id: user.id,
          full_name: '',
          email: user.email,
          age: null,
          weight: null,
          height: null,
          goal: '',
          training_level: 'intermediate',
          fitness_goal: '',
          gender: '',
          onboarding_completed: false
        };
        setUserProfile(emptyProfile);
        await AsyncStorage.removeItem('userProfile');
      }
    } catch (err) {
      console.error('[UserContext] Error in syncProfileFromSupabase:', err);
      setInitializationError(err);
      // Clear AsyncStorage on error
      await AsyncStorage.removeItem('userProfile');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user data from storage and then sync from Supabase
  useEffect(() => {
    let isMounted = true;
    let retryTimeout;
    let loadingTimeout;

    const loadUserData = async () => {
      try {
        console.log('[UserContext] loadUserData called');
        setIsLoading(true);
        setInitializationError(null);

        // Load profile from AsyncStorage
        const profileData = await AsyncStorage.getItem('userProfile');
        if (profileData) {
          try {
            const parsedProfile = JSON.parse(profileData);
            if (isMounted) {
              setUserProfile(parsedProfile);
              console.log('[UserContext] Loaded profile from AsyncStorage:', parsedProfile);
            }
          } catch (parseError) {
            await AsyncStorage.removeItem('userProfile');
          }
        }

        // Check subscription status first
        await checkSubscriptionStatus();

        // Sync profile from Supabase with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        while (retryCount < maxRetries && isMounted) {
          try {
            await syncProfileFromSupabase();
            break;
          } catch (error) {
            retryCount++;
            if (retryCount === maxRetries) {
              console.log('[UserContext] Keeping existing profile data after failed sync');
            } else {
              await new Promise(resolve => {
                retryTimeout = setTimeout(resolve, 1000 * retryCount);
              });
            }
          }
        }

        if (isMounted) {
          setIsLoading(false);
          onReady?.();
          console.log('[UserContext] Finished loading user data, setIsLoading(false)');
        }
      } catch (error) {
        if (isMounted) {
          setInitializationError(error);
          setIsLoading(false);
          onReady?.();
          console.log('[UserContext] Error loading user data, setIsLoading(false)');
        }
      }
    };

    loadUserData();

    // Fallback: force isLoading to false after 5 seconds
    loadingTimeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
        console.log('[UserContext] Timeout fallback: setIsLoading(false)');
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [onReady]);

  // Save profile changes to Supabase and local state
  const updateProfile = async (newProfile) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }
      // Update Supabase
      const { error } = await supabase
        .from('profiles')
        .update(newProfile)
        .eq('id', user.id);
      if (error) {
        console.error('[UserContext] Error updating profile:', error);
        return { success: false, error: error.message };
      }
      // Update local state and AsyncStorage
      const updatedProfile = { ...userProfile, ...newProfile };
      setUserProfile(updatedProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      return { success: true };
    } catch (error) {
      console.error('[UserContext] Error in updateProfile:', error);
      return { success: false, error: error.message };
    }
  };

  // Fetch personal records from Supabase
  const fetchPersonalRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching PRs from Supabase:', error);
        setPersonalRecords([]);
        return;
      }
      setPersonalRecords(data || []);
    } catch (error) {
      console.error('Error fetching PRs:', error);
      setPersonalRecords([]);
    }
  };

  // Optionally, call fetchPersonalRecords in useEffect after profile loads
  useEffect(() => {
    if (!isLoading && userProfile && userProfile.email) {
      fetchPersonalRecords();
    }
  }, [isLoading, userProfile]);

  // Add a method to update PRs
  const addPersonalRecord = async (record) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'No user' };
      const { data, error } = await supabase
        .from('personal_records')
        .insert([{ ...record, profile_id: user.id }])
        .select();
      if (error) return { error };
      setPersonalRecords((prev) => [data[0], ...prev]);
      return { success: true };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    userProfile,
    isLoading,
    initializationError,
    updateProfile,
    personalRecords,
    fetchPersonalRecords,
    addPersonalRecord,
    isPremium,
    checkSubscriptionStatus,
  };

  console.log('[UserContext] Current isPremium value:', isPremium);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

export default { UserProvider, useUser }

