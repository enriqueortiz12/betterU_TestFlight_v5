import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const TrackingContext = createContext();

export const TrackingProvider = ({ children }) => {
  const { user } = useAuth();
  const [calories, setCalories] = useState({
    consumed: 0,
    goal: 2000
  });
  
  const [water, setWater] = useState({
    consumed: 0,
    goal: 2.0 // in liters
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

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Load calories and water from AsyncStorage
        const savedCalories = await AsyncStorage.getItem('calories');
        const savedWater = await AsyncStorage.getItem('water');

        if (savedCalories) {
          setCalories(JSON.parse(savedCalories));
        }
        if (savedWater) {
          setWater(JSON.parse(savedWater));
        }

        // Initialize or load user stats from Supabase
          if (user) {
          // Get stats from user_stats table
          const { data: statsData } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

          // Get streak data from profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('streak, longest_streak, last_streak_update')
            .eq('id', user.id)
            .single();

          if (statsData) {
            setStats(prev => ({
              ...prev,
              ...statsData,
              today_workout_completed: statsData.today_workout_completed || false,
              today_mental_completed: statsData.today_mental_completed || false,
              streak: profileData?.streak || 0
            }));
          } else {
            // Initialize stats with default values
            const initialStats = {
                user_id: user.id,
              workouts: 0,
              minutes: 0,
              mental_sessions: 0,
              prs_this_month: 0,
              streak: profileData?.streak || 0,
              today_workout_completed: false,
              today_mental_completed: false,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
              .from('user_stats')
              .upsert([initialStats], {
                onConflict: 'user_id',
                ignoreDuplicates: false
              });

            if (error) {
              console.error('Error initializing stats:', error);
            } else {
              setStats(prev => ({
                ...prev,
                ...initialStats
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, [user]);

  // Check for midnight reset and streak update
  useEffect(() => {
    const checkMidnightReset = async () => {
      try {
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const lastMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        // Fetch the last reset date from the database
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('last_reset_date, today_workout_completed, today_mental_completed')
          .eq('user_id', user.id)
          .single();

        if (statsError) {
          console.error('Error fetching last_reset_date:', statsError);
          return;
        }

        // Only reset if we haven't reset today
        if (statsData && statsData.last_reset_date === today) {
          // Already reset today, do nothing
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
          const { data: streakData } = await supabase
            .from('betteru_streaks')
            .select('current_streak, longest_streak')
            .eq('user_id', user.id)
            .single();

          if (streakData) {
            newStreak = streakData.current_streak + 1;
            // Update streak in Supabase
          await supabase
              .from('betteru_streaks')
              .upsert({
              user_id: user.id,
                current_streak: newStreak,
                longest_streak: Math.max(newStreak, streakData.longest_streak),
                last_completed_date: yesterdayStr,
              updated_at: new Date().toISOString()
            });
          }
        } else {
          // Reset streak if activities were not completed
          await supabase
            .from('betteru_streaks')
            .upsert({
              user_id: user.id,
              current_streak: 0,
              last_completed_date: null,
              updated_at: new Date().toISOString()
            });
        }

        // Reset completion flags and update last reset date
        await supabase
          .from('user_stats')
          .update({
            today_workout_completed: false,
            today_mental_completed: false,
            last_reset_date: today,
            updated_at: new Date().toISOString(),
            streak: newStreak
          })
          .eq('user_id', user.id);

        // Reset local storage
        await AsyncStorage.setItem('calories', JSON.stringify({ consumed: 0, goal: calories.goal }));
        await AsyncStorage.setItem('water', JSON.stringify({ consumed: 0, goal: water.goal }));

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
    const interval = setInterval(checkMidnightReset, 60000);
    checkMidnightReset(); // Initial check

    return () => clearInterval(interval);
  }, [user, calories.goal, water.goal]);

  const addCalories = async (amount) => {
    try {
      const newCalories = { ...calories, consumed: calories.consumed + amount };
      setCalories(newCalories);
      await AsyncStorage.setItem('calories', JSON.stringify(newCalories));

      if (user) {
      const today = new Date().toISOString().split('T')[0];

        // First check if entry exists
        const { data: existingEntry } = await supabase
        .from('calorie_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

        if (existingEntry) {
          // Update existing entry
          const { error } = await supabase
          .from('calorie_tracking')
            .update({
              consumed: newCalories.consumed,
              goal: newCalories.goal,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingEntry.id);

          if (error) {
            console.error('Error updating calorie tracking:', error);
        }
      } else {
          // Insert new entry
          const { error } = await supabase
            .from('calorie_tracking')
          .insert({
            user_id: user.id,
            date: today,
              consumed: newCalories.consumed,
              goal: newCalories.goal,
          updated_at: new Date().toISOString()
        });

          if (error) {
            console.error('Error inserting calorie tracking:', error);
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
      setWater(newWater);
      await AsyncStorage.setItem('water', JSON.stringify(newWater));

      if (user) {
        const today = new Date().toISOString().split('T')[0];
        
        // First check if entry exists
        const { data: existingEntry } = await supabase
          .from('water_tracking')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();

        if (existingEntry) {
          // Update existing entry
          const { error } = await supabase
            .from('water_tracking')
            .update({
              consumed: newWater.consumed,
              goal: newWater.goal,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingEntry.id);

          if (error) {
            console.error('Error updating water tracking:', error);
          }
        } else {
          // Insert new entry
      const { error } = await supabase
        .from('water_tracking')
            .insert({
          user_id: user.id,
            date: today,
              consumed: newWater.consumed,
              goal: newWater.goal,
          updated_at: new Date().toISOString()
        });

          if (error) {
            console.error('Error inserting water tracking:', error);
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
        setCalories(newCalories);
        await AsyncStorage.setItem('calories', JSON.stringify(newCalories));
        await AsyncStorage.setItem('calorieGoal', amount.toString());
      } else if (type === 'water') {
        const newWater = { ...water, goal: amount };
        setWater(newWater);
        await AsyncStorage.setItem('water', JSON.stringify(newWater));
        await AsyncStorage.setItem('waterGoal', amount.toString());
      }

        if (user) {
          const today = new Date().toISOString().split('T')[0];
        
        // First check if entry exists
        const { data: existingEntry } = await supabase
          .from(type === 'calories' ? 'calorie_tracking' : 'water_tracking')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();

        if (existingEntry) {
          // Update existing entry
          const { error } = await supabase
            .from(type === 'calories' ? 'calorie_tracking' : 'water_tracking')
            .update({
              goal: amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingEntry.id);

          if (error) {
            console.error('Error updating goal:', error);
          }
        } else {
          // Insert new entry
          const { error } = await supabase
            .from(type === 'calories' ? 'calorie_tracking' : 'water_tracking')
            .insert({
            user_id: user.id,
              date: today,
              goal: amount,
              consumed: type === 'calories' ? calories.consumed : water.consumed,
            updated_at: new Date().toISOString()
          });

          if (error) {
            console.error('Error inserting goal:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const updateMood = async (newMood) => {
    try {
      setMood(newMood);
      await AsyncStorage.setItem('mood', newMood);

      if (user) {
        const today = new Date().toISOString().split('T')[0];
        
        // Always create a new entry for today's mood
        const { error } = await supabase
          .from('mood_tracking')
          .insert({
            user_id: user.id,
            date: today,
            mood: newMood,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error inserting mood:', error);
        }
      }
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  const updateStats = async (newStats) => {
    try {
      setStats(newStats);
      await AsyncStorage.setItem('stats', JSON.stringify(newStats));

      if (user) {
      const { error } = await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
            ...newStats,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating stats:', error);
        }
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const incrementStat = async (statName, amount = 1) => {
    try {
      if (!user) return;

      // Get current stats
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

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

        const { error } = await supabase
          .from('user_stats')
          .insert([initialStats]);

        if (error) throw error;
        setStats(initialStats);
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

      // Only check streak if we haven't updated it today
      if ((statName === 'workouts' || statName === 'mental_sessions')) {
        const today = new Date().toISOString().split('T')[0];
        const lastStreakUpdate = await AsyncStorage.getItem('lastStreakUpdate');
        if (lastStreakUpdate !== today) {
          // Check if both activities are completed today
          const { data: workoutData } = await supabase
            .from('workout_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

          const { data: mentalData } = await supabase
            .from('mental_session_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('completed_at', today)
            .single();

          // If both activities are completed, increment streak
          if (workoutData && mentalData) {
            const { data: streakData } = await supabase
              .from('betteru_streaks')
              .select('*')
              .eq('user_id', user.id)
              .single();

            let currentStreak = streakData?.current_streak || 0;
            let longestStreak = streakData?.longest_streak || 0;

            currentStreak += 1;
            if (currentStreak > longestStreak) {
              longestStreak = currentStreak;
            }

            // Update streak in Supabase
            await supabase
              .from('betteru_streaks')
              .upsert({
                user_id: user.id,
                current_streak: currentStreak,
                longest_streak: longestStreak,
                last_completed_date: today,
                updated_at: new Date().toISOString()
              });

            // Update local state with new streak
            setStats(prev => ({ ...prev, streak: currentStreak }));
            
            // Mark streak as updated for today
            await AsyncStorage.setItem('lastStreakUpdate', today);
          }
        }
      }

      // Update the stats in Supabase with completion flags
        const { error } = await supabase
          .from('user_stats')
        .update(updateData)
          .eq('user_id', user.id);

      if (error) throw error;

      // Only fetch and set latest stats from Supabase
      const { data: latestStats, error: fetchError } = await supabase
          .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!fetchError && latestStats) {
        setStats({ ...latestStats });
      }

    } catch (error) {
      console.error('Error incrementing stat:', error);
    }
  };

  // The resetCompletionFlags function is now a no-op
  const resetCompletionFlags = async () => {};

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