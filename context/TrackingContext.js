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
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(true);
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

  // Safe Supabase operations
  const safeSupabase = async (operation) => {
    try {
      return await operation();
    } catch (error) {
      console.error('Supabase operation failed:', error);
      return { data: null, error };
    }
  };

  // Load saved data on mount
  useEffect(() => {
    setIsMounted(true);
    let retryTimeout;

    const loadSavedData = async () => {
      try {
        // Load calories and water from AsyncStorage
        const savedCalories = await safeAsyncStorage(() => 
          AsyncStorage.getItem('calories')
        );
        const savedWater = await safeAsyncStorage(() => 
          AsyncStorage.getItem('water')
        );

        if (savedCalories) {
          try {
            const parsedCalories = JSON.parse(savedCalories);
            safeSetState(setCalories, parsedCalories);
          } catch (parseError) {
            console.error('Error parsing calories data:', parseError);
            await safeAsyncStorage(() => 
              AsyncStorage.removeItem('calories')
            );
          }
        }

        if (savedWater) {
          try {
            const parsedWater = JSON.parse(savedWater);
            safeSetState(setWater, parsedWater);
          } catch (parseError) {
            console.error('Error parsing water data:', parseError);
            await safeAsyncStorage(() => 
              AsyncStorage.removeItem('water')
            );
          }
        }

        // Initialize or load user stats from Supabase only if user exists
        if (user?.id) {
          // Get stats from user_stats table
          const { data: statsData, error: statsError } = await safeSupabase(() =>
            supabase
              .from('user_stats')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle()
          );

          if (statsError) {
            console.error('Error fetching stats:', statsError);
            return;
          }

          // Get streak data from betteru_streaks table
          const { data: streakData, error: streakError } = await safeSupabase(() =>
            supabase
              .from('betteru_streaks')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle()
          );

          if (streakError) {
            console.error('Error fetching streak data:', streakError);
            return;
          }

          // Initialize streak if it doesn't exist
          if (!streakData) {
            const { error: insertError } = await safeSupabase(() =>
              supabase
                .from('betteru_streaks')
                .upsert({
                  user_id: user.id,
                  current_streak: 0,
                  longest_streak: 0,
                  last_completed_date: null,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id'
                })
            );

            if (insertError) {
              console.error('Error initializing streak:', insertError);
              return;
            }
          }

          // Initialize stats if they don't exist
          if (!statsData) {
            const initialStats = {
              user_id: user.id,
              workouts: 0,
              minutes: 0,
              mental_sessions: 0,
              prs_this_month: 0,
              streak: streakData?.current_streak || 0,
              today_workout_completed: false,
              today_mental_completed: false,
              updated_at: new Date().toISOString()
            };

            const { error: insertError } = await safeSupabase(() =>
              supabase
                .from('user_stats')
                .insert([initialStats])
            );

            if (insertError) {
              console.error('Error initializing stats:', insertError);
              return;
            }

            safeSetState(setStats, initialStats);
            return;
          }

          // Update local state with fetched data
          safeSetState(setStats, prev => ({
            ...prev,
            ...statsData,
            today_workout_completed: statsData.today_workout_completed || false,
            today_mental_completed: statsData.today_mental_completed || false,
            streak: streakData?.current_streak || 0
          }));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
        safeSetState(setInitializationError, error);
      }
    };

    loadSavedData();

    return () => {
      setIsMounted(false);
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [user]);

  // Check for midnight reset and streak update
  useEffect(() => {
    if (!user?.id) return;

    let interval;
    let retryTimeout;

    const checkMidnightReset = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const lastMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        // Fetch the last reset date from the database
        const { data: statsData, error: statsError } = await safeSupabase(() =>
          supabase
            .from('user_stats')
            .select('last_reset_date, today_workout_completed, today_mental_completed')
            .eq('user_id', user.id)
            .single()
        );

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
          // Fetch current streak
          const { data: streakData, error: streakError } = await safeSupabase(() =>
            supabase
              .from('betteru_streaks')
              .select('current_streak, longest_streak')
              .eq('user_id', user.id)
              .single()
          );

          if (streakError) {
            console.error('Error fetching streak data:', streakError);
            return;
          }

          if (streakData) {
            newStreak = streakData.current_streak + 1;
            // Update streak in Supabase
            const { error: updateError } = await safeSupabase(() =>
              supabase
                .from('betteru_streaks')
                .upsert({
              user_id: user.id,
                  current_streak: newStreak,
                  longest_streak: Math.max(newStreak, streakData.longest_streak),
                  last_completed_date: yesterdayStr,
              updated_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id'
                })
            );

            if (updateError) {
              console.error('Error updating streak:', updateError);
              return;
            }
          }
        } else {
          // Reset streak if activities were not completed
          const { error: resetError } = await safeSupabase(() =>
            supabase
              .from('betteru_streaks')
              .upsert({
              user_id: user.id,
                current_streak: 0,
                last_completed_date: null,
              updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              })
          );

          if (resetError) {
            console.error('Error resetting streak:', resetError);
            return;
          }
        }

        // Reset completion flags and update last reset date
        const { error: updateError } = await safeSupabase(() =>
          supabase
            .from('user_stats')
            .update({
              today_workout_completed: false,
              today_mental_completed: false,
              last_reset_date: today,
              updated_at: new Date().toISOString(),
              streak: newStreak
            })
            .eq('user_id', user.id)
        );

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
        safeSetState(setCalories, prev => ({ ...prev, consumed: 0 }));
        safeSetState(setWater, prev => ({ ...prev, consumed: 0 }));
        safeSetState(setStats, prev => ({
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
  }, [user, calories.goal, water.goal]);

  // Load tracking data from storage and then sync from Supabase
  useEffect(() => {
    setIsMounted(true);
    let retryTimeout;

    const loadTrackingData = async () => {
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
            const { data: workouts, error: workoutsError } = await safeSupabase(() =>
              supabase
                .from('workouts')
                .select('*')
                .eq('user_id', user.id)
            );

            if (workoutsError) throw workoutsError;

            // Load exercises
            const { data: exercises, error: exercisesError } = await safeSupabase(() =>
              supabase
                .from('exercises')
                .select('*')
                .eq('user_id', user.id)
            );

            if (exercisesError) throw exercisesError;

            // Load workout history
            const { data: workoutHistory, error: workoutError } = await safeSupabase(() =>
              supabase
                .from('workout_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('completed_at', { ascending: false })
            );

            if (workoutError) {
              console.error('Error loading workout history:', workoutError);
              return;
            }

            // Load mental session history
            const { data: mentalHistory, error: mentalError } = await safeSupabase(() =>
              supabase
                .from('mental_session_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('completed_at', { ascending: false })
            );

            if (mentalError) {
              console.error('Error loading mental session history:', mentalError);
              return;
            }

            // Load calorie tracking for today
            const today = new Date().toISOString().split('T')[0];
            const { data: calorieData, error: calorieError } = await safeSupabase(() =>
              supabase
                .from('calorie_tracking')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle()
            );

            if (calorieError) throw calorieError;

            // Load water tracking for today
            const { data: waterData, error: waterError } = await safeSupabase(() =>
              supabase
                .from('water_tracking')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle()
            );

            if (waterError) throw waterError;

            // Load streak data
            const { data: streakData, error: streakError } = await safeSupabase(() =>
              supabase
                .from('betteru_streaks')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle()
            );

            if (streakError) throw streakError;

            // Initialize tracking data if not exists
            if (!calorieData) {
              const { error: insertError } = await safeSupabase(() =>
                supabase
                  .from('calorie_tracking')
                  .insert({
                    user_id: user.id,
                    date: today,
                    consumed: 0,
                    goal: 2000
                  })
              );
              if (insertError) throw insertError;
            }

            if (!waterData) {
              const { error: insertError } = await safeSupabase(() =>
                supabase
                  .from('water_tracking')
                  .insert({
                    user_id: user.id,
                    date: today,
                    glasses: 0,
                    goal: 8
                  })
              );
              if (insertError) throw insertError;
            }

            if (!streakData) {
              const { error: insertError } = await safeSupabase(() =>
                supabase
                  .from('betteru_streaks')
                  .insert({
                    user_id: user.id,
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
  }, [user]);

  const addCalories = async (amount) => {
    try {
      const newCalories = { ...calories, consumed: calories.consumed + amount };
      safeSetState(setCalories, newCalories);
      await safeAsyncStorage(() => 
        AsyncStorage.setItem('calories', JSON.stringify(newCalories))
      );

      if (user?.id) {
        const today = new Date().toISOString().split('T')[0];

        // First check if entry exists
        const { data: existingEntry, error: fetchError } = await safeSupabase(() =>
          supabase
            .from('calorie_tracking')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single()
        );

        if (fetchError) {
          console.error('Error fetching calorie tracking:', fetchError);
          return;
        }

        if (existingEntry) {
          // Update existing entry
          const { error: updateError } = await safeSupabase(() =>
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
          const { error: insertError } = await safeSupabase(() =>
            supabase
              .from('calorie_tracking')
              .insert({
                user_id: user.id,
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
        
        // First check if entry exists
        const { data: existingEntry, error: fetchError } = await safeSupabase(() =>
          supabase
            .from('water_tracking')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single()
        );

        if (fetchError) {
          console.error('Error fetching water tracking:', fetchError);
          return;
        }

        if (existingEntry) {
          // Update existing entry
          const { error: updateError } = await safeSupabase(() =>
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
          const { error: insertError } = await safeSupabase(() =>
            supabase
              .from('water_tracking')
              .insert({
                user_id: user.id,
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
      }
    } catch (error) {
      console.error('Error adding water:', error);
    }
  };

  const updateGoal = async (type, amount) => {
    try {
      if (type === 'calories') {
        const newCalories = { ...calories, goal: amount };
        safeSetState(setCalories, newCalories);
        await safeAsyncStorage(() => 
          AsyncStorage.setItem('calories', JSON.stringify(newCalories))
        );
        await safeAsyncStorage(() => 
          AsyncStorage.setItem('calorieGoal', amount.toString())
        );
      } else if (type === 'water') {
        const newWater = { ...water, goal: amount };
        safeSetState(setWater, newWater);
        await safeAsyncStorage(() => 
          AsyncStorage.setItem('water', JSON.stringify(newWater))
        );
        await safeAsyncStorage(() => 
          AsyncStorage.setItem('waterGoal', amount.toString())
        );
      }

      if (user?.id) {
          const today = new Date().toISOString().split('T')[0];
        
        // First check if entry exists
        const { data: existingEntry, error: fetchError } = await safeSupabase(() =>
          supabase
            .from(type === 'calories' ? 'calorie_tracking' : 'water_tracking')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single()
        );

        if (fetchError) {
          console.error('Error fetching tracking data:', fetchError);
          return;
        }

        if (existingEntry) {
          // Update existing entry
          const { error: updateError } = await safeSupabase(() =>
            supabase
              .from(type === 'calories' ? 'calorie_tracking' : 'water_tracking')
              .update({
                goal: amount,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingEntry.id)
          );

          if (updateError) {
            console.error('Error updating goal:', updateError);
          }
        } else {
          // Insert new entry
          const { error: insertError } = await safeSupabase(() =>
            supabase
              .from(type === 'calories' ? 'calorie_tracking' : 'water_tracking')
              .insert({
            user_id: user.id,
              date: today,
                goal: amount,
                consumed: type === 'calories' ? calories.consumed : water.consumed,
            updated_at: new Date().toISOString()
              })
          );

          if (insertError) {
            console.error('Error inserting goal:', insertError);
          }
        }
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const updateMood = async (newMood) => {
    try {
      safeSetState(setMood, newMood);
      await safeAsyncStorage(() => 
        AsyncStorage.setItem('mood', newMood)
      );

      if (user?.id) {
        const today = new Date().toISOString().split('T')[0];
        
        // Always create a new entry for today's mood
        const { error: insertError } = await safeSupabase(() =>
          supabase
            .from('mood_tracking')
            .insert({
              user_id: user.id,
              date: today,
              mood: newMood,
              created_at: new Date().toISOString()
            })
        );

        if (insertError) {
          console.error('Error inserting mood:', insertError);
        }
      }
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  const updateStats = async (newStats) => {
    try {
      safeSetState(setStats, newStats);
      await safeAsyncStorage(() => 
        AsyncStorage.setItem('stats', JSON.stringify(newStats))
      );

      if (user?.id) {
        const { error: updateError } = await safeSupabase(() =>
          supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
              ...newStats,
          updated_at: new Date().toISOString()
            })
        );

        if (updateError) {
          console.error('Error updating stats:', updateError);
        }
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const incrementStat = async (statName, amount = 1) => {
    try {
      if (!user?.id) return;

      // Get current stats
      const { data: currentStats, error: fetchError } = await safeSupabase(() =>
        supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()
      );

      if (fetchError) {
        console.error('Error fetching current stats:', fetchError);
        return;
      }

      if (!currentStats) {
        // Initialize stats if they don't exist
        const initialStats = {
          user_id: user.id,
          workouts: statName === 'workouts' ? amount : 0,
          minutes: statName === 'minutes' ? amount : 0,
          mental_sessions: statName === 'mental_sessions' ? amount : 0,
          prs_this_month: statName === 'prs_this_month' ? amount : 0,
          streak: 0,
          today_workout_completed: statName === 'workouts',
          today_mental_completed: statName === 'mental_sessions',
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await safeSupabase(() =>
          supabase
            .from('user_stats')
            .insert([initialStats])
        );

        if (insertError) {
          console.error('Error initializing stats:', insertError);
          return;
        }

        safeSetState(setStats, initialStats);
        return;
      }

      // Update the specific stat
      const newValue = (currentStats[statName] || 0) + amount;

      // Always preserve the current value of the flags unless setting to true
      const updateData = {
        [statName]: newValue,
        today_workout_completed: statName === 'workouts' ? true : currentStats.today_workout_completed,
        today_mental_completed: statName === 'mental_sessions' ? true : currentStats.today_mental_completed,
        updated_at: new Date().toISOString()
      };

      // Only check streak if both activities are completed and we haven't updated it today
      if (updateData.today_workout_completed && updateData.today_mental_completed) {
        const today = new Date().toISOString().split('T')[0];
        const lastStreakUpdate = await safeAsyncStorage(() => 
          AsyncStorage.getItem('lastStreakUpdate')
        );

        if (lastStreakUpdate !== today) {
          // Get existing streak data
          const { data: existingStreak, error: streakFetchError } = await safeSupabase(() =>
            supabase
              .from('betteru_streaks')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle()
          );

          if (streakFetchError) {
            console.error('Error fetching streak data:', streakFetchError);
            return;
          }

          let currentStreak = existingStreak?.current_streak || 0;
          let longestStreak = existingStreak?.longest_streak || 0;

          currentStreak += 1;
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
          }

          // Use upsert for streak update
          const { error: streakError } = await safeSupabase(() =>
            supabase
              .from('betteru_streaks')
              .upsert({
                user_id: user.id,
                current_streak: currentStreak,
                longest_streak: longestStreak,
                last_completed_date: today,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              })
          );

          if (streakError) {
            console.error('Error updating streak:', streakError);
            return;
          }

          // Update local state with new streak
          safeSetState(setStats, prev => ({ ...prev, streak: currentStreak }));
          
          // Mark streak as updated for today
          await safeAsyncStorage(() => 
            AsyncStorage.setItem('lastStreakUpdate', today)
          );
        }
      }

      // Update the stats in Supabase
      const { error: updateError } = await safeSupabase(() =>
        supabase
          .from('user_stats')
          .update(updateData)
          .eq('user_id', user.id)
      );

      if (updateError) {
        console.error('Error updating stats:', updateError);
        return;
      }

      // Only fetch and set latest stats from Supabase
      const { data: latestStats, error: latestFetchError } = await safeSupabase(() =>
        supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()
      );

      if (!latestFetchError && latestStats) {
        safeSetState(setStats, { ...latestStats });
      }

    } catch (error) {
      console.error('Error incrementing stat:', error);
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
      setMood
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