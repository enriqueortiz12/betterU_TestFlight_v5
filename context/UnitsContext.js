import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatNumber } from '../utils/formatUtils';
import { supabase } from '../lib/supabase';
import { useSettings } from './SettingsContext';

const UnitsContext = createContext();

export const UnitsProvider = ({ children }) => {
  const [useImperial, setUseImperial] = useState(false);
  const { settings, updateSettings } = useSettings();

  // Load saved preference on app start
  useEffect(() => {
    loadUnitsPreference();
  }, []);

  // Sync with settings from Supabase
  useEffect(() => {
    if (settings?.use_imperial !== undefined) {
      console.log('Syncing units with Supabase settings:', settings.use_imperial);
      setUseImperial(settings.use_imperial);
      // Also update AsyncStorage to keep it in sync
      AsyncStorage.setItem('useImperial', JSON.stringify(settings.use_imperial));
    }
  }, [settings]);

  const loadUnitsPreference = async () => {
    try {
      // First try to get from Supabase
      if (settings?.use_imperial !== undefined) {
        console.log('Loading units from Supabase:', settings.use_imperial);
        setUseImperial(settings.use_imperial);
        return;
      }

      // Fallback to AsyncStorage if Supabase settings not available
      const savedPreference = await AsyncStorage.getItem('useImperial');
      if (savedPreference !== null) {
        console.log('Loading units from AsyncStorage:', savedPreference);
        const value = JSON.parse(savedPreference);
        setUseImperial(value);
        // Update Supabase with the saved preference
        await updateSettings({ use_imperial: value });
      }
    } catch (error) {
      console.error('Error loading units preference:', error);
    }
  };

  const toggleUnits = async (value) => {
    try {
      console.log('Toggling units to:', value);
      // Update Supabase first
      const { success, error } = await updateSettings({ use_imperial: value });
      if (!success) {
        console.error('Error updating units in Supabase:', error);
        return;
      }
      
      // Then update local state and AsyncStorage
      setUseImperial(value);
      await AsyncStorage.setItem('useImperial', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving units preference:', error);
    }
  };

  // Conversion functions
  const convertWeight = (kg) => {
    if (!kg) return null;
    return useImperial ? formatNumber(kg * 2.20462) : formatNumber(kg);
  };

  const convertHeight = (cm) => {
    if (!cm) return null;
    return useImperial ? formatNumber(cm / 2.54) : formatNumber(cm);
  };

  const convertWeightBack = (value) => {
    if (!value) return null;
    return useImperial ? formatNumber(parseFloat(value) / 2.20462) : formatNumber(value);
  };

  const convertHeightBack = (value) => {
    if (!value) return null;
    return useImperial ? formatNumber(parseFloat(value) * 2.54) : formatNumber(value);
  };

  const getWeightUnit = () => useImperial ? 'lbs' : 'kg';
  const getHeightUnit = () => useImperial ? 'in' : 'cm';

  return (
    <UnitsContext.Provider value={{
      useImperial,
      setUseImperial,
      toggleUnits,
      convertWeight,
      convertHeight,
      convertWeightBack,
      convertHeightBack,
      getWeightUnit,
      getHeightUnit
    }}>
      {children}
    </UnitsContext.Provider>
  );
};

export const useUnits = () => {
  const context = useContext(UnitsContext);
  if (context === undefined) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
};

const updateSettings = async (newSettings) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return { success: false, error: 'No user session' };

      console.log('Updating settings for user:', session.user.id);
      console.log('New settings:', newSettings);

      // First check if settings exist
      const { data: existingSettings, error: checkError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', session.user.id)
        .single();

      let result;
      if (checkError && checkError.code === 'PGRST116') {
        // Settings don't exist, create them
        result = await supabase
          .from('user_settings')
          .insert({
            id: session.user.id,
            use_imperial: newSettings.use_imperial ?? false,
            calorie_goal: 2000,
            water_goal_ml: 2000,
            daily_reminders: true,
            rest_time_seconds: 90
          })
          .select()
          .single();
      } else {
        // Settings exist, update them
        result = await supabase
          .from('user_settings')
          .update(newSettings)
          .eq('id', session.user.id)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error updating settings:', result.error);
        return { success: false, error: result.error };
      }

      // Update local state with the returned data
      setSettings(result.data);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error updating units in Supabase:', error);
      return { success: false, error };
    }
  }; 