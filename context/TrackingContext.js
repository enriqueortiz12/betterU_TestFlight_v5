import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Create context with default values
const TrackingContext = createContext({
  calories: { consumed: 0, goal: 2000 },
  water: { consumed: 0, goal: 2.0 },
  mood: 'neutral',
  stats: {
    workouts: 0,
    minutes: 0,
    mental_sessions: 0,
    prs_this_month: 0,
    streak: 0,
    today_workout_completed: false,
    today_mental_completed: false
  },
  addCalories: async () => {},
  addWater: async () => {},
  updateMood: async () => {},
  updateGoal: async () => {},
  updateStats: async () => {},
  incrementStat: async () => {},
  setMood: () => {}
});

export const TrackingProvider = ({ children }) => {
  const { user, profile } = useAuth();
  const [isMounted, setIsMounted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [calories, setCalories] = useState({
    consumed: 0,
    goal: 2000
  });
  
  const [water, setWater] = useState({
    consumed: 0,
    goal: 2.0
  });

  const [mood, setMood] = useState('neutral');
  const [stats, setStats] = useState({
    workouts: 0,
    minutes: 0,
    mental_sessions: 0,
    prs_this_month: 0,
    streak: 0,
    today_workout_completed: false,
    today_mental_completed: false
  });

  const [trackingData, setTrackingData] = useState({
    workouts: [],
    exercises: [],
    currentWorkout: null,
    currentExercise: null,
    workoutHistory: [],
    exerciseHistory: [],
    personalRecords: [],
    workoutStats: {},
    exerciseStats: {},
    isLoading: true,
    error: null
  });

  const [initializationError, setInitializationError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Add retry logic for network requests
  const fetchWithRetry = async (operation, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  // Load initial stats and streak on profile load
  useEffect(() => {
    const loadInitialStats = async () => {
      if (!profile?.profile_id) return;
      
      try {
        setIsLoading(true);
        console.log('[TrackingContext] Loading initial stats for profile:', profile.profile_id);

        // Fetch user_stats with retry
        const { data: statsData, error: statsError } = await fetchWithRetry(() => 
          supabase
            .from('user_stats')
            .select('*')
            .eq('profile_id', profile.profile_id)
            .maybeSingle()
        );

        if (statsError) {
          console.error('Error fetching user stats:', statsError);
          return;
        }

        if (statsData) {
          console.log('[TrackingContext] Loaded user stats:', statsData);
          setStats(prev => ({
            ...prev,
            ...statsData,
            streak: prev.streak // Keep current streak until we fetch it
          }));
        }

        // Fetch streak with retry
        const { data: streakData, error: streakError } = await fetchWithRetry(() => 
          supabase
            .from('betteru_streaks')
            .select('*')
            .eq('profile_id', profile.profile_id)
            .maybeSingle()
        );

        if (streakError) {
          console.error('Error fetching streak:', streakError);
          return;
        }

        if (streakData) {
          console.log('[TrackingContext] Loaded streak data:', streakData);
          setStats(prev => ({
            ...prev,
            streak: streakData.current_streak || 0
          }));
        }
      } catch (error) {
        console.error('Error loading initial stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialStats();
  }, [profile?.profile_id]);

  // Safe state update function
  const safeSetState = (setter, value) => {
    if (isMounted) {
      setter(value);
    }
  };

  // Safe AsyncStorage operations
  const safeAsyncStorage = async (operation) => {
    try {
      return await operation();
    } catch (error) {
      console.error('AsyncStorage operation failed:', error);
      return null;
    }
  };

  // Safe Supabase operations with retry
  const safeSupabase = async (operation) => {
    try {
      return await fetchWithRetry(operation);
    } catch (error) {
      console.error('Supabase operation failed:', error);
      return { data: null, error };
    }
  };

  // Helper to get profile_id for the current user
  const getProfileId = async () => {
    console.log('[getProfileId] profile from AuthContext:', profile);
    if (profile?.id) return profile.id;
    console.log('No profile found in AuthContext');
    return null;
  };

  // Safe database operation wrapper with retry
  const safeDbOperation = async (operation) => {
    const profileId = await getProfileId();
    if (!profileId) {
      console.log('No profile ID found, skipping database operation');
      return { data: null, error: null };
    }
    try {
      return await fetchWithRetry(() => operation(profileId));
    } catch (error) {
      console.error('Error in database operation:', error);
      return { data: null, error };
    }
  };

  // Load saved data on mount
  useEffect(() => {
    setIsMounted(true);
    let retryTimeout;

    const loadSavedData = async () => {
      if (!profile?.id) {
        console.log('[TrackingContext] Profile not loaded yet, skipping loadSavedData');
        return;
      }
      try {
        console.log('[TrackingContext] Starting to load data for profile:', profile.id);
        setIsLoading(true);

        // Get today's date in UTC
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        console.log('[TrackingContext] Loading data for date:', todayStr);

        // Load data from Supabase first
        console.log('[TrackingContext] Fetching calorie data from Supabase...');
        const { data: calorieData, error: calorieError } = await supabase
          .from('calorie_tracking')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('date', todayStr)
          .maybeSingle();

        if (calorieError) {
          console.error('[TrackingContext] Error loading calorie data:', calorieError);
        } else {
          console.log('[TrackingContext] Loaded calorie data:', calorieData);
          if (calorieData) {
            const newCalories = {
              consumed: calorieData.consumed || 0,
              goal: calorieData.goal || calories.goal || 2000 // Keep existing goal if available
            };
            console.log('[TrackingContext] Setting calories state to:', newCalories);
            setCalories(newCalories);
          } else {
            // Create new entry if none exists, but keep existing goal
            console.log('[TrackingContext] Creating new calorie tracking entry');
            const { error: insertError } = await supabase
              .from('calorie_tracking')
              .insert({
                profile_id: profile.id,
                date: todayStr,
                consumed: 0,
                goal: calories.goal || 2000, // Keep existing goal
                updated_at: new Date().toISOString()
              });
            if (insertError) {
              console.error('[TrackingContext] Error creating calorie tracking:', insertError);
            }
          }
        }

        console.log('[TrackingContext] Fetching water data from Supabase...');
        const { data: waterData, error: waterError } = await supabase
          .from('water_tracking')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('date', todayStr)
          .maybeSingle();

        if (waterError) {
          console.error('[TrackingContext] Error loading water data:', waterError);
        } else {
          console.log('[TrackingContext] Loaded water data:', waterData);
          if (waterData) {
            const newWater = {
              consumed: (waterData.glasses || 0) * 250, // Convert glasses to ml
              goal: waterData.goal || water.goal || 2.0 // Keep existing goal if available
            };
            console.log('[TrackingContext] Setting water state to:', newWater);
            setWater(newWater);
          } else {
            // Create new entry if none exists, but keep existing goal
            console.log('[TrackingContext] Creating new water tracking entry');
            const { error: insertError } = await supabase
              .from('water_tracking')
              .insert({
                profile_id: profile.id,
                date: todayStr,
                glasses: 0,
                goal: water.goal || 8, // Keep existing goal
                updated_at: new Date().toISOString()
              });
            if (insertError) {
              console.error('[TrackingContext] Error creating water tracking:', insertError);
            }
          }
        }

        // Check if we need to reset based on last reset date
        const lastResetDate = await safeAsyncStorage(() => 
          AsyncStorage.getItem('lastResetDate')
        );

        if (lastResetDate) {
          const lastReset = new Date(lastResetDate);
          lastReset.setUTCHours(0, 0, 0, 0);
          
          // If last reset was before today, reset everything except goals
          if (lastReset.getTime() < today.getTime()) {
            console.log('[TrackingContext] Resetting daily data for new day');
            
            // Reset completion status in Supabase
              const { error } = await supabase
                .from('profiles')
                .update({
                  today_workout_completed: false,
                  today_mental_completed: false,
                  daily_workouts_generated: 0,
                  last_reset_date: todayStr
                })
              .eq('profile_id', profile.id);

              if (error) {
                console.error('[TrackingContext] Error resetting completion status:', error);
            }

            // Save reset date
            await safeAsyncStorage(() => 
              AsyncStorage.setItem('lastResetDate', todayStr)
            );

            // Reset calories and water in Supabase, but keep goals
            const { error: calorieError } = await supabase
              .from('calorie_tracking')
              .upsert({
                profile_id: profile.id,
                date: todayStr,
                consumed: 0,
                goal: calories.goal || 2000, // Keep existing goal
                updated_at: new Date().toISOString()
              });

            if (calorieError) {
              console.error('[TrackingContext] Error resetting calories:', calorieError);
            }

            const { error: waterError } = await supabase
              .from('water_tracking')
              .upsert({
                profile_id: profile.id,
                date: todayStr,
                glasses: 0,
                goal: water.goal || 8, // Keep existing goal
                updated_at: new Date().toISOString()
              });

            if (waterError) {
              console.error('[TrackingContext] Error resetting water:', waterError);
            }

            // Reset local state but keep goals
            setCalories(prev => ({ ...prev, consumed: 0 }));
            setWater(prev => ({ ...prev, consumed: 0 }));
        }
        } else {
          // First time setup - save today as last reset date
          await safeAsyncStorage(() => 
            AsyncStorage.setItem('lastResetDate', todayStr)
          );
        }

        // Load mood from AsyncStorage
        const savedMood = await safeAsyncStorage(() => 
          AsyncStorage.getItem('mood')
        );
        if (savedMood) {
          setMood(savedMood);
        }

        // Load stats from AsyncStorage
        const savedStats = await safeAsyncStorage(() => 
          AsyncStorage.getItem('stats')
        );
        if (savedStats) {
          setStats(JSON.parse(savedStats));
        }

        console.log('[TrackingContext] Finished loading saved data for profile:', profile.id);
        setIsLoading(false);
      } catch (error) {
        console.error('[TrackingContext] Error loading saved data:', error);
        setIsLoading(false);
      }
    };

    loadSavedData();

    return () => {
      setIsMounted(false);
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [profile?.id]);

  // Update the checkMidnightReset function with better error handling
  useEffect(() => {
    if (!user?.id || !profile?.profile_id) {
      console.log('[TrackingContext] User or profile not loaded, skipping checkMidnightReset');
      return;
    }

    let interval;
    let retryTimeout;

    const checkMidnightReset = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const lastMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        // Fetch the last reset date with retry logic
        const { data: statsData, error: statsError } = await fetchWithRetry(async () => {
          const profileId = await getProfileId();
          if (!profileId) {
            throw new Error('No profile ID found');
          }
          return supabase
            .from('user_stats')
            .select('last_reset_date, today_workout_completed, today_mental_completed')
            .eq('profile_id', profileId)
            .maybeSingle();
        });

        if (statsError) {
          console.error('Error fetching last_reset_date:', statsError);
          return;
        }

        // Only reset if we haven't reset today
        if (statsData && statsData.last_reset_date === today) {
          return;
        }

        // Check if yesterday's activities were completed before resetting
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // If both activities were completed yesterday, maintain/increment streak
        let newStreak = 0;
        if (statsData && statsData.today_workout_completed && statsData.today_mental_completed) {
          // Get current streak with retry logic
          const { data: streakData, error: streakError } = await fetchWithRetry(async () => {
            const profileId = await getProfileId();
            if (!profileId) {
              throw new Error('No profile ID found');
            }
            return supabase
              .from('betteru_streaks')
              .select('current_streak, longest_streak')
              .eq('profile_id', profileId)
              .maybeSingle();
          });

          if (streakError) {
            console.error('Error fetching streak data:', streakError);
            return;
          }

          if (streakData) {
            newStreak = streakData.current_streak + 1;
            // Update streak in Supabase with retry logic
            const { error: updateError } = await fetchWithRetry(async () => {
              const profileId = await getProfileId();
              if (!profileId) {
                throw new Error('No profile ID found');
              }
              return supabase
                .from('betteru_streaks')
                .upsert({
                  profile_id: profileId,
                  current_streak: newStreak,
                  longest_streak: Math.max(newStreak, streakData.longest_streak),
                  last_completed_date: yesterdayStr,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'profile_id'
                });
            });

            if (updateError) {
              console.error('Error updating streak:', updateError);
              return;
            }
          }
        } else {
          // Reset streak if activities were not completed
          const { error: resetError } = await fetchWithRetry(async () => {
            const profileId = await getProfileId();
            if (!profileId) {
              throw new Error('No profile ID found');
            }
            return supabase
              .from('betteru_streaks')
              .upsert({
                profile_id: profileId,
                current_streak: 0,
                last_completed_date: null,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'profile_id'
              });
          });

          if (resetError) {
            console.error('Error resetting streak:', resetError);
            return;
          }
        }

        // Reset completion flags and update last reset date
        const { error: updateError } = await fetchWithRetry(async () => {
          const profileId = await getProfileId();
          if (!profileId) {
            throw new Error('No profile ID found');
          }
          return supabase
            .from('user_stats')
            .update({
              today_workout_completed: false,
              today_mental_completed: false,
              last_reset_date: today,
              updated_at: new Date().toISOString()
            })
            .eq('profile_id', profileId);
        });

        if (updateError) {
          console.error('Error updating stats:', updateError);
          return;
        }

        // Reset local storage
        await safeAsyncStorage(() => 
          AsyncStorage.setItem('calories', JSON.stringify({ consumed: 0, goal: calories.goal }))
        );
        await safeAsyncStorage(() => 
          AsyncStorage.setItem('water', JSON.stringify({ consumed: 0, goal: water.goal }))
        );

        // Update local state
        setCalories(prev => ({ ...prev, consumed: 0 }));
        setWater(prev => ({ ...prev, consumed: 0 }));
        setStats(prev => ({
          ...prev,
          today_workout_completed: false,
          today_mental_completed: false,
          streak: newStreak
        }));

      } catch (error) {
        console.error('Error in midnight reset:', error);
      }
    };

    // Check for reset every minute
    interval = setInterval(checkMidnightReset, 60000);
    checkMidnightReset(); // Initial check

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [user, profile?.profile_id, calories.goal, water.goal]);

  // Load tracking data from storage and then sync from Supabase
  useEffect(() => {
    setIsMounted(true);
    let retryTimeout;

    const loadTrackingData = async () => {
      if (!user?.id || !profile?.profile_id) {
        console.log('[TrackingContext] User or profile not loaded, skipping loadTrackingData');
        return;
      }
      try {
        // Load from AsyncStorage first
        const storedData = await safeAsyncStorage(() => 
          AsyncStorage.getItem('trackingData')
        );

        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            if (isMounted) {
              safeSetState(setTrackingData, prev => ({
                ...prev,
                ...parsedData,
                isLoading: true
              }));
            }
          } catch (parseError) {
            console.error('Error parsing tracking data:', parseError);
            await safeAsyncStorage(() => 
              AsyncStorage.removeItem('trackingData')
            );
          }
        }

        // If no user, just finish initialization
        if (!user?.id) {
          if (isMounted) {
            safeSetState(setTrackingData, prev => ({
              ...prev,
              isLoading: false,
              error: null
            }));
            safeSetState(setIsInitialized, true);
          }
          return;
        }

        // Load from Supabase with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        while (retryCount < maxRetries && isMounted) {
          try {
            // Load workouts
            const { data: workouts, error: workoutsError } = await safeDbOperation(async (profileId) =>
              supabase
                .from('workouts')
                .select('*')
                .eq('profile_id', profileId)
            );

            if (workoutsError) throw workoutsError;

            // Load exercises
            const { data: exercises, error: exercisesError } = await safeDbOperation(async (profileId) =>
              supabase
                .from('exercises')
                .select('*')
                .eq('profile_id', profileId)
            );

            if (exercisesError) throw exercisesError;

            // Load workout history
            const { data: workoutHistory, error: workoutError } = await safeDbOperation(async (profileId) =>
              supabase
                .from('user_workout_logs')
                .select('*')
                .eq('profile_id', profileId)
                .order('completed_at', { ascending: false })
            );

            if (workoutError) {
              console.error('Error loading workout history:', workoutError);
              return;
            }

            // Load mental session history
            const { data: mentalHistory, error: mentalError } = await safeDbOperation(async (profileId) => {
              console.log('[loadTrackingData] Fetching mental session logs for profile_id:', profileId);
              return supabase
                .from('mental_session_logs')
                .select('*')
                .eq('profile_id', profileId)
                .order('completed_at', { ascending: false });
            });

            if (mentalError) {
              console.error('Error loading mental session history:', mentalError);
              return;
            }
            console.log('[loadTrackingData] Mental session logs fetched:', mentalHistory);

            // Load calorie tracking for today
            const today = new Date().toISOString().split('T')[0];
            const { data: calorieData, error: calorieError } = await safeDbOperation(async (profileId) =>
              supabase
                .from('calorie_tracking')
                .select('*')
                .eq('profile_id', profileId)
                .eq('date', today)
                .maybeSingle()
            );

            if (calorieError) throw calorieError;

            // Load water tracking for today
            const { data: waterData, error: waterError } = await safeDbOperation(async (profileId) =>
              supabase
                .from('water_tracking')
                .select('*')
                .eq('profile_id', profileId)
                .eq('date', today)
                .maybeSingle()
            );

            if (waterError) throw waterError;

            // Load streak data
            const { data: streakData, error: streakError } = await safeDbOperation(async (profileId) =>
              supabase
                .from('betteru_streaks')
                .select('*')
                .eq('profile_id', profileId)
                .maybeSingle()
            );

            if (streakError) throw streakError;

            // Initialize tracking data if not exists
            if (!calorieData) {
              const { error: insertError } = await safeDbOperation(async (profileId) =>
                supabase
                  .from('calorie_tracking')
                  .insert({
                    profile_id: profileId,
                    date: today,
                    consumed: 0,
                    goal: 2000
                  })
              );
              if (insertError) throw insertError;
            }

            if (!waterData) {
              const { error: insertError } = await safeDbOperation(async (profileId) =>
                supabase
                  .from('water_tracking')
                  .insert({
                    profile_id: profileId,
                    date: today,
                    glasses: 0,
                    goal: 8
                  })
              );
              if (insertError) throw insertError;
            }

            if (!streakData) {
              const { error: insertError } = await safeDbOperation(async (profileId) =>
                supabase
                  .from('betteru_streaks')
                  .insert({
                    profile_id: profileId,
                    current_streak: 0,
                    longest_streak: 0
                  })
              );
              if (insertError) throw insertError;
            }

            if (isMounted) {
              safeSetState(setTrackingData, prev => ({
                ...prev,
                workouts: workouts || [],
                exercises: exercises || [],
                workoutHistory: workoutHistory || [],
                isLoading: false,
                error: null
              }));

              // Update local state with tracking data
              if (calorieData) {
                safeSetState(setCalories, {
                  consumed: calorieData.consumed || 0,
                  goal: calorieData.goal || 2000
                });
              }

              if (waterData) {
                safeSetState(setWater, {
                  consumed: waterData.glasses * 250, // Convert glasses to ml
                  goal: waterData.goal
                });
              }

              // Save to AsyncStorage
              await safeAsyncStorage(() => 
                AsyncStorage.setItem('trackingData', JSON.stringify({
                  workouts: workouts || [],
                  exercises: exercises || [],
                  workoutHistory: workoutHistory || []
                }))
              );
            }
            break;
          } catch (error) {
            console.error(`Error loading tracking data (attempt ${retryCount + 1}/${maxRetries}):`, error);
            retryCount++;
            if (retryCount === maxRetries) {
              if (isMounted) {
                safeSetState(setInitializationError, error);
                safeSetState(setTrackingData, prev => ({
                  ...prev,
                  isLoading: false,
                  error: error.message
                }));
              }
            } else {
              await new Promise(resolve => {
                retryTimeout = setTimeout(resolve, 1000 * retryCount);
              });
            }
          }
        }

        if (isMounted) {
          safeSetState(setIsInitialized, true);
        }
        console.log('[TrackingContext] Finished loading tracking data for profile:', profile.profile_id);
      } catch (error) {
        console.error('Error in loadTrackingData:', error);
        if (isMounted) {
          safeSetState(setInitializationError, error);
          safeSetState(setTrackingData, prev => ({
            ...prev,
            isLoading: false,
            error: error.message
          }));
          safeSetState(setIsInitialized, true);
        }
      }
    };

    loadTrackingData();

    return () => {
      setIsMounted(false);
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [user, profile?.profile_id]);

  const addCalories = async (amount) => {
    try {
      const newCalories = { ...calories, consumed: calories.consumed + amount };
      safeSetState(setCalories, newCalories);
      await safeAsyncStorage(() => 
        AsyncStorage.setItem('calories', JSON.stringify(newCalories))
      );

      if (user?.id) {
        const today = new Date().toISOString().split('T')[0];
        const profileId = await getProfileId();
        console.log('[addCalories] profile_id:', profileId, 'date:', today, 'consumed:', newCalories.consumed, 'goal:', newCalories.goal);

        // First check if entry exists
        const { data: existingEntry, error: fetchError } = await safeDbOperation(async (profileId) =>
          supabase
            .from('calorie_tracking')
            .select('*')
            .eq('profile_id', profileId)
            .eq('date', today)
            .maybeSingle()
        );

        if (fetchError) {
          console.error('Error fetching calorie tracking:', fetchError);
          return;
        }

        if (existingEntry) {
          // Update existing entry
          const { error: updateError } = await safeDbOperation(async (profileId) =>
            supabase
              .from('calorie_tracking')
              .update({
                consumed: newCalories.consumed,
                goal: newCalories.goal,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingEntry.id)
          );

          if (updateError) {
            console.error('Error updating calorie tracking:', updateError);
          }
        } else {
          // Insert new entry
          const { error: insertError } = await safeDbOperation(async (profileId) =>
            supabase
              .from('calorie_tracking')
              .insert({
                profile_id: profileId,
                date: today,
                consumed: newCalories.consumed,
                goal: newCalories.goal,
                updated_at: new Date().toISOString()
              })
          );

          if (insertError) {
            console.error('Error inserting calorie tracking:', insertError);
          }
        }
        // Fetch latest calorie data from Supabase
        const { data: calorieData, error: calorieError } = await safeDbOperation(async (profileId) =>
          supabase
            .from('calorie_tracking')
            .select('*')
            .eq('profile_id', profileId)
            .eq('date', today)
            .maybeSingle()
        );
        if (!calorieError && calorieData) {
          safeSetState(setCalories, {
            consumed: calorieData.consumed || 0,
            goal: calorieData.goal || 2000
          });
          console.log('[addCalories] Updated calories from Supabase:', calorieData);
        }
      }
    } catch (error) {
      console.error('Error adding calories:', error);
    }
  };

  const addWater = async (amount) => {
    try {
      const newWater = { ...water, consumed: water.consumed + amount };
      safeSetState(setWater, newWater);
      await safeAsyncStorage(() => 
        AsyncStorage.setItem('water', JSON.stringify(newWater))
      );

      if (user?.id) {
        const today = new Date().toISOString().split('T')[0];
        const profileId = await getProfileId();
        console.log('[addWater] profile_id:', profileId, 'date:', today, 'amount_ml:', newWater.consumed, 'goal:', newWater.goal);

        // First check if entry exists
        const { data: existingEntry, error: fetchError } = await safeDbOperation(async (profileId) =>
          supabase
            .from('water_tracking')
            .select('*')
            .eq('profile_id', profileId)
            .eq('date', today)
            .maybeSingle()
        );

        if (fetchError) {
          console.error('Error fetching water tracking:', fetchError);
          return;
        }

        if (existingEntry) {
          // Update existing entry
          const { error: updateError } = await safeDbOperation(async (profileId) =>
            supabase
              .from('water_tracking')
              .update({
                glasses: Math.floor(newWater.consumed / 250), // Convert ml to glasses
                goal: newWater.goal,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingEntry.id)
          );

          if (updateError) {
            console.error('Error updating water tracking:', updateError);
          }
        } else {
          // Insert new entry
          const { error: insertError } = await safeDbOperation(async (profileId) =>
            supabase
              .from('water_tracking')
              .insert({
                profile_id: profileId,
                date: today,
                glasses: Math.floor(newWater.consumed / 250), // Convert ml to glasses
                goal: newWater.goal,
                updated_at: new Date().toISOString()
              })
          );

          if (insertError) {
            console.error('Error inserting water tracking:', insertError);
          }
        }
        // Fetch latest water data from Supabase
        const { data: waterData, error: waterError } = await safeDbOperation(async (profileId) =>
          supabase
            .from('water_tracking')
            .select('*')
            .eq('profile_id', profileId)
            .eq('date', today)
            .maybeSingle()
        );
        if (!waterError && waterData) {
          safeSetState(setWater, {
            consumed: waterData.glasses * 250, // Convert glasses to ml
            goal: waterData.goal
          });
          console.log('[addWater] Updated water from Supabase:', waterData);
        }
      }
    } catch (error) {
      console.error('Error adding water:', error);
    }
  };

  const updateGoal = async (type, amount) => {
    try {
      if (type === 'calories') {
        const newCalories = { ...calories, goal: amount };
        setCalories(newCalories);
      } else if (type === 'water') {
        const newWater = { ...water, goal: amount };
        setWater(newWater);
        // Also save to AsyncStorage immediately
        await safeAsyncStorage(() => 
          AsyncStorage.setItem('water', JSON.stringify(newWater))
        );
      }

      if (user?.id) {
        const profileId = await getProfileId();
        
        // Update goal in user_settings table
        const { error: updateError } = await supabase
          .from('user_settings')
              .update({
            [type === 'calories' ? 'calorie_goal' : 'water_goal_ml']: type === 'water' ? amount * 1000 : amount, // Convert liters to ml for water
                updated_at: new Date().toISOString()
              })
          .eq('id', profileId);

          if (updateError) {
            console.error('Error updating goal:', updateError);
          // Revert the state if the update fails
          if (type === 'water') {
            setWater(water);
            await safeAsyncStorage(() => 
              AsyncStorage.setItem('water', JSON.stringify(water))
            );
          }
        }
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      // Revert the state if there's an error
      if (type === 'water') {
        setWater(water);
        await safeAsyncStorage(() => 
          AsyncStorage.setItem('water', JSON.stringify(water))
        );
      }
    }
  };

  const updateMood = async (newMood) => {
    try {
      setMood(newMood);
      await AsyncStorage.setItem('mood', newMood);

      // Update mental completion in stats
      await updateStats({
        today_mental_completed: true
      });

    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  const updateStats = async (updates) => {
    try {
      const profileId = await getProfileId();
      if (!profileId) {
        console.error('No profile ID found');
        return;
      }

      // First get current stats
      const { data: currentStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current stats:', fetchError);
        return;
      }

      // Prepare updates
      const newStats = {
        profile_id: profileId,
        ...currentStats,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('user_stats')
        .upsert(newStats, {
          onConflict: 'profile_id'
        });

      if (updateError) {
        console.error('Error updating stats:', updateError);
        return;
      }

      // Update local state
      setStats(prev => ({
        ...prev,
        ...updates
      }));

      // Also update AsyncStorage
      const currentLocalStats = await AsyncStorage.getItem('stats');
      const localStats = currentLocalStats ? JSON.parse(currentLocalStats) : {};
      const newLocalStats = {
        ...localStats,
        ...updates
      };
      await AsyncStorage.setItem('stats', JSON.stringify(newLocalStats));

    } catch (error) {
      console.error('Error in updateStats:', error);
    }
  };

  // Helper to get today's date string
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Fetch streak from Supabase and update state
  const fetchStreak = async () => {
    const profileId = await getProfileId();
    if (!profileId) return;
    const { data: streakData, error } = await supabase
      .from('betteru_streaks')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();
    if (!error && streakData) {
      safeSetState(setStats, prev => ({ ...prev, streak: streakData.current_streak || 0 }));
      console.log('[fetchStreak] Updated streak from Supabase:', streakData);
    } else if (error) {
      console.error('[fetchStreak] Error fetching streak:', error);
    }
  };

  // Call fetchStreak on mount and when profile changes
  useEffect(() => {
    if (profile?.profile_id) {
      fetchStreak();
    }
  }, [profile?.profile_id]);

  // Robust incrementStat for streak
  const incrementStat = async (statName, amount = 1) => {
    try {
      const currentStats = await AsyncStorage.getItem('stats');
      const stats = currentStats ? JSON.parse(currentStats) : {
        workouts: 0,
        minutes: 0,
        calories: 0,
        water: 0,
        today_workout_completed: false
      };

      stats[statName] = (stats[statName] || 0) + amount;
      await AsyncStorage.setItem('stats', JSON.stringify(stats));
      setStats(stats);
    } catch (error) {
      console.error('Error incrementing stat:', error);
    }
  };

  const finishWorkout = async (workoutId, duration) => {
    try {
      const userId = await getProfileId();
      if (!userId) {
        console.log('[finishWorkout] No user ID found');
        return { success: false, error: 'No user ID found' };
      }

      // Update workout_logs
      const { data: logData, error: logError } = await supabase
        .from('user_workout_logs')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', workoutId)
        .select()
        .single();

      if (logError) {
        console.error('[finishWorkout] Error updating workout log:', logError);
        throw logError;
      }

      // Update stats in Supabase
      await updateStats({
        workouts: (stats.workouts || 0) + 1,
        minutes: (stats.minutes || 0) + Math.floor(duration / 60),
        today_workout_completed: true
      });

      return { success: true, data: { log: logData } };
    } catch (error) {
      console.error('[finishWorkout] Error:', error);
      return { success: false, error };
    }
  };

  return (
    <TrackingContext.Provider value={{
      calories,
      water,
      mood,
      stats,
      addCalories,
      addWater,
      updateMood,
      updateGoal,
      updateStats,
      incrementStat,
      setMood,
      setCalories,
      setWater,
      setStats
    }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};

export const forceDailyReset = async (profile, calories, water, setCalories, setWater, setStats) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    const profileId = profile?.profile_id;
    console.log('[forceDailyReset] Forcing daily reset for profile:', profileId);

    // Reset completion status in user_stats
    if (profileId) {
      const { error: statsError } = await supabase
        .from('user_stats')
        .update({
          today_workout_completed: false,
          today_mental_completed: false,
          daily_workouts_generated: 0,
          last_reset_date: todayStr,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', profileId);

      if (statsError) {
        console.error('[forceDailyReset] Error resetting completion status:', statsError);
      }
    }

    // Reset calories in Supabase
    if (profileId) {
      const { error: calorieError } = await supabase
        .from('calorie_tracking')
        .upsert({
          profile_id: profileId,
          date: todayStr.split('T')[0],
          consumed: 0,
          goal: calories?.goal || 2000,
          updated_at: new Date().toISOString()
        }, { onConflict: 'profile_id,date' });

      if (calorieError) {
        console.error('[forceDailyReset] Error resetting calories:', calorieError);
      }
    }

    // Reset water in Supabase
    if (profileId) {
      const { error: waterError } = await supabase
        .from('water_tracking')
        .upsert({
          profile_id: profileId,
          date: todayStr.split('T')[0],
          glasses: 0,
          goal: water?.goal || 8,
          updated_at: new Date().toISOString()
        }, { onConflict: 'profile_id,date' });

      if (waterError) {
        console.error('[forceDailyReset] Error resetting water:', waterError);
      }
    }

    // Save reset date
    await AsyncStorage.setItem('lastResetDate', todayStr);

    // Reset calories and water in AsyncStorage
    const resetCalories = { consumed: 0, goal: calories?.goal || 2000 };
    const resetWater = { consumed: 0, goal: water?.goal || 2.0 };
    
    await AsyncStorage.setItem('calories', JSON.stringify(resetCalories));
    await AsyncStorage.setItem('water', JSON.stringify(resetWater));
    
    console.log('[forceDailyReset] Reset calories in AsyncStorage:', resetCalories);
    console.log('[forceDailyReset] Reset water in AsyncStorage:', resetWater);

    // Update local state
    if (typeof setCalories === 'function') setCalories(resetCalories);
    if (typeof setWater === 'function') setWater(resetWater);
    if (typeof setStats === 'function') setStats(prev => ({
      ...prev,
      today_workout_completed: false,
      today_mental_completed: false
    }));

    // Reload from Supabase and AsyncStorage to ensure UI is up to date
    if (profileId) {
      await reloadTrackingData(profileId, setCalories, setWater);
    }

    console.log('[forceDailyReset] Local state and AsyncStorage reset complete');
  } catch (error) {
    console.error('[forceDailyReset] Error:', error);
  }
};

const reloadTrackingData = async (profileId, setCalories, setWater) => {
  try {
    // Reload calories from Supabase
    const today = new Date().toISOString().split('T')[0];
    const { data: calorieData } = await supabase
      .from('calorie_tracking')
      .select('*')
      .eq('profile_id', profileId)
      .eq('date', today)
      .maybeSingle();
    if (calorieData) {
      setCalories({ consumed: calorieData.consumed || 0, goal: calorieData.goal || 2000 });
    }
    // Reload water from Supabase
    const { data: waterData } = await supabase
      .from('water_tracking')
      .select('*')
      .eq('profile_id', profileId)
      .eq('date', today)
      .maybeSingle();
    if (waterData) {
      setWater({ consumed: (waterData.glasses || 0) * 250, goal: waterData.goal || 2.0 });
    }
    // Reload from AsyncStorage as fallback
    const savedCalories = await AsyncStorage.getItem('calories');
    if (savedCalories) {
      const parsed = JSON.parse(savedCalories);
      setCalories(parsed);
    }
    const savedWater = await AsyncStorage.getItem('water');
    if (savedWater) {
      const parsed = JSON.parse(savedWater);
      setWater(parsed);
    }
  } catch (error) {
    console.error('[reloadTrackingData] Error:', error);
  }
};

export { reloadTrackingData }; 