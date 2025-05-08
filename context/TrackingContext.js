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
    mentalSessions: 0,
    prsThisMonth: 0
  });

  // Load saved data on mount and check for midnight reset
  useEffect(() => {
    const loadDataAndCheckReset = async () => {
      try {
        // Get the last reset date
        const lastResetDate = await AsyncStorage.getItem('lastResetDate');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        // Load saved data
        const savedCalories = await AsyncStorage.getItem('calories');
        const savedWater = await AsyncStorage.getItem('water');
        const savedMood = await AsyncStorage.getItem('mood');
        const savedStats = await AsyncStorage.getItem('stats');

        // Parse saved data
        let parsedCalories = savedCalories ? JSON.parse(savedCalories) : calories;
        let parsedWater = savedWater ? JSON.parse(savedWater) : water;

        // Check if we need to reset daily values
        if (lastResetDate !== today) {
          console.log('Resetting daily values - New day detected');
          
          // Reset only consumed values
          parsedCalories = { ...parsedCalories, consumed: 0 };
          parsedWater = { ...parsedWater, consumed: 0 };
          
          // Save the new reset date
          await AsyncStorage.setItem('lastResetDate', today);

          // If user is logged in, update Supabase
          if (user) {
            const { error: calorieError } = await supabase
              .from('calorie_tracking')
              .upsert({
                user_id: user.id,
                date: today,
                consumed: 0,
                goal: parsedCalories.goal,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,date',
                ignoreDuplicates: false
              });

            if (calorieError) {
              console.error('Error resetting calorie tracking:', calorieError);
            }

            const { error: waterError } = await supabase
              .from('water_tracking')
              .upsert({
                user_id: user.id,
                date: today,
                consumed: 0,
                goal: parsedWater.goal,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,date',
                ignoreDuplicates: false
              });

            if (waterError) {
              console.error('Error resetting water tracking:', waterError);
            }
          }
        }

        // Set the states
        setCalories(parsedCalories);
        setWater(parsedWater);
        if (savedMood) setMood(savedMood);
        if (savedStats) setStats(JSON.parse(savedStats));

      } catch (error) {
        console.error('Error in loadDataAndCheckReset:', error);
      }
    };

    loadDataAndCheckReset();

    // Set up interval to check for midnight reset
    const interval = setInterval(async () => {
      const lastResetDate = await AsyncStorage.getItem('lastResetDate');
      const today = new Date().toISOString().split('T')[0];

      if (lastResetDate !== today) {
        console.log('Midnight reset detected - Reloading data');
        loadDataAndCheckReset();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Save data whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('calories', JSON.stringify(calories));
        await AsyncStorage.setItem('water', JSON.stringify(water));
        await AsyncStorage.setItem('mood', mood);
        await AsyncStorage.setItem('stats', JSON.stringify(stats));

        // If user is logged in, update Supabase
        if (user) {
          await supabase
            .from('calorie_tracking')
            .insert({
              user_id: user.id,
              consumed: calories.consumed,
              goal: calories.goal,
              updated_at: new Date().toISOString()
            });

          await supabase
            .from('water_tracking')
            .insert({
              user_id: user.id,
              consumed: water.consumed,
              goal: water.goal,
              updated_at: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error('Error saving tracking data:', error);
      }
    };

    saveData();
  }, [calories, water, mood, stats, user]);

  // Load tracking data when user changes
  useEffect(() => {
    if (user) {
      loadTrackingData();
    } else {
      // Reset all states when user logs out
      resetStates();
    }
  }, [user]);

  const resetStates = () => {
      setStats({
        workouts: 0,
        minutes: 0,
        mentalSessions: 0,
        prsThisMonth: 0
      });
      setCalories({
        consumed: 0,
        goal: 2000
      });
      setWater({
        consumed: 0,
        goal: 2.0
      });
      setMood('neutral');
  };

  const loadTrackingData = async () => {
    try {
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Load today's calorie tracking
      const { data: calorieData, error: calorieError } = await supabase
        .from('calorie_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (calorieError && calorieError.code !== 'PGRST116') {
        console.error('Error loading calorie data:', calorieError);
      } else if (!calorieData) {
        // Create new tracking entry for today
        const { data: newCalorieData } = await supabase
          .from('calorie_tracking')
          .insert({
            user_id: user.id,
            date: today,
            consumed: 0,
            goal: calories.goal
          })
          .select()
          .single();

        if (newCalorieData) {
          setCalories({
            consumed: newCalorieData.consumed,
            goal: newCalorieData.goal
          });
        }
      } else {
        setCalories({
          consumed: calorieData.consumed,
          goal: calorieData.goal
        });
      }

      // Load today's water tracking
      const { data: waterData, error: waterError } = await supabase
        .from('water_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (waterError && waterError.code !== 'PGRST116') {
        console.error('Error loading water data:', waterError);
      } else if (!waterData) {
        // Create new tracking entry for today
        const { data: newWaterData } = await supabase
          .from('water_tracking')
          .insert({
            user_id: user.id,
            date: today,
            consumed: 0,
            goal: water.goal
          })
          .select()
          .single();

        if (newWaterData) {
          setWater({
            consumed: newWaterData.consumed,
            goal: newWaterData.goal
          });
        }
      } else {
        setWater({
          consumed: waterData.consumed,
          goal: waterData.goal
        });
      }

      // Get current month's stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      // Load workout logs for current month
      const { data: workoutLogs, error: logsError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (logsError) {
        console.error('Error loading workout logs:', logsError);
        return;
      }

      // Load PRs for current month
      const { data: prs, error: prsError } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      if (prsError) {
        console.error('Error loading PRs:', prsError);
        return;
      }

      // Get other stats from user_stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error loading stats:', statsError);
        return;
      }

      // Update stats with current month's workout count and PRs
      const monthlyWorkouts = workoutLogs ? workoutLogs.length : 0;
      const monthlyPRs = prs ? prs.length : 0;
      const newStats = {
        workouts: monthlyWorkouts,
        minutes: statsData?.minutes || 0,
        mentalSessions: statsData?.mental_sessions || 0,
        prsThisMonth: monthlyPRs
      };

      // Update Supabase with new stats
      const { error: updateError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          workouts: newStats.workouts,
          minutes: newStats.minutes,
          mental_sessions: newStats.mentalSessions,
          prs_this_month: newStats.prsThisMonth,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('Error updating stats:', updateError);
        return;
      }

      setStats(newStats);

    } catch (error) {
      console.error('Error in loadTrackingData:', error);
    }
  };

  const addCalories = async (amount) => {
    try {
      const newConsumed = calories.consumed + amount;
      setCalories(prev => ({ ...prev, consumed: newConsumed }));

      if (user) {
        const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('calorie_tracking')
          .upsert({
          user_id: user.id,
            date: today,
            consumed: newConsumed,
            goal: calories.goal,
          updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,date',
            ignoreDuplicates: false
        });

        if (error) throw error;
      }

      await AsyncStorage.setItem('calories', JSON.stringify({ ...calories, consumed: newConsumed }));
      return true;
    } catch (error) {
      console.error('Error adding calories:', error);
      return false;
    }
  };

  const addWater = async (amount) => {
    try {
      const newConsumed = water.consumed + amount;
      setWater(prev => ({ ...prev, consumed: newConsumed }));

      if (user) {
        const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('water_tracking')
          .upsert({
          user_id: user.id,
            date: today,
            consumed: newConsumed,
            goal: water.goal,
          updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,date',
            ignoreDuplicates: false
        });

        if (error) throw error;
      }

      await AsyncStorage.setItem('water', JSON.stringify({ ...water, consumed: newConsumed }));
      return true;
    } catch (error) {
      console.error('Error adding water:', error);
      return false;
    }
  };

  const updateGoal = async (type, newGoal) => {
    try {
      if (type === 'calories') {
        setCalories(prev => ({ ...prev, goal: newGoal }));
        if (user) {
          const today = new Date().toISOString().split('T')[0];
          await supabase
          .from('calorie_tracking')
            .upsert({
            user_id: user.id,
              date: today,
            consumed: calories.consumed,
            goal: newGoal,
            updated_at: new Date().toISOString()
          });
        }
        await AsyncStorage.setItem('calories', JSON.stringify({ ...calories, goal: newGoal }));
      } else if (type === 'water') {
        setWater(prev => ({ ...prev, goal: newGoal }));
        if (user) {
          const today = new Date().toISOString().split('T')[0];
          await supabase
          .from('water_tracking')
            .upsert({
            user_id: user.id,
              date: today,
            consumed: water.consumed,
            goal: newGoal,
            updated_at: new Date().toISOString()
          });
        }
        await AsyncStorage.setItem('water', JSON.stringify({ ...water, goal: newGoal }));
      }
      return true;
    } catch (error) {
      console.error('Error updating goal:', error);
      return false;
    }
  };

  const updateMood = async (newMood) => {
    try {
      await AsyncStorage.setItem('mood', newMood);
      setMood(newMood);
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  // Update stats functions
  const updateStats = async (type, value) => {
    try {
      if (!user) return;

      let newStats = { ...stats };

      switch (type) {
        case 'workouts':
          newStats.workouts = value;
          break;
        case 'minutes':
          newStats.minutes = value;
          break;
        case 'mentalSessions':
          newStats.mentalSessions = value;
          break;
        case 'prsThisMonth':
          newStats.prsThisMonth = value;
          break;
        default:
          return;
      }

      // Update Supabase
      const { error } = await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          workouts: newStats.workouts,
          minutes: newStats.minutes,
          mental_sessions: newStats.mentalSessions,
          prs_this_month: newStats.prsThisMonth,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating stats:', error);
        return;
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error in updateStats:', error);
    }
  };

  // Increment stats functions
  const incrementStat = async (type) => {
    try {
      if (!user) return;

      // First check if record exists
      const { data: existingStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching stats:', fetchError);
        return;
      }

      let newStats = { ...stats };

      switch (type) {
        case 'workouts':
          newStats.workouts += 1;
          break;
        case 'minutes':
          newStats.minutes += 1;
          break;
        case 'mentalSessions':
          newStats.mentalSessions += 1;
          break;
        case 'prsThisMonth':
          // Get current month's start and end dates
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

          // Count PRs for current month
          const { data: prs, error: prsError } = await supabase
            .from('personal_records')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth);

          if (prsError) {
            console.error('Error counting PRs:', prsError);
            return;
          }

          newStats.prsThisMonth = prs ? prs.length : 0;
          break;
        default:
          return;
      }

      // Update Supabase
      if (existingStats) {
        const { error } = await supabase
          .from('user_stats')
          .update({
            workouts: newStats.workouts,
            minutes: newStats.minutes,
            mental_sessions: newStats.mentalSessions,
            prs_this_month: newStats.prsThisMonth,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating stats:', error);
          return;
        }
      } else {
        const { error } = await supabase
          .from('user_stats')
          .insert({
            user_id: user.id,
            workouts: newStats.workouts,
            minutes: newStats.minutes,
            mental_sessions: newStats.mentalSessions,
            prs_this_month: newStats.prsThisMonth,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating stats:', error);
          return;
        }
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error in incrementStat:', error);
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