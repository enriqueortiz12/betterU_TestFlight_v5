import { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext({
  settings: null,
  isLoading: true,
  updateSettings: () => {},
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from Supabase
  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (error) {
        console.error('Error loading settings:', error);
        
        // If settings don't exist, create them
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: createError } = await supabase
            .from('user_settings')
            .insert([{ profile_id: user.id }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating settings:', createError);
            setIsLoading(false);
            return;
          }

          setSettings(newSettings);
          await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
          setIsLoading(false);
          return;
        }
        
        setIsLoading(false);
        return;
      }

      if (data) {
        setSettings(data);
        // Also save to AsyncStorage for offline access
        await AsyncStorage.setItem('userSettings', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update settings in Supabase
  const updateSettings = async (newSettings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user logged in');
        return { success: false, error: 'No user logged in' };
      }

      console.log('Updating settings for user:', user.id);
      console.log('New settings:', newSettings);

      // If settings don't exist, create them first
      if (!settings) {
        console.log('Settings do not exist, creating new settings');
        const { data: createdSettings, error: createError } = await supabase
          .from('user_settings')
          .insert([{ profile_id: user.id, ...newSettings }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating settings:', createError);
          return { success: false, error: createError.message };
        }

        console.log('Created new settings:', createdSettings);
        setSettings(createdSettings);
        await AsyncStorage.setItem('userSettings', JSON.stringify(createdSettings));
        return { success: true };
      }

      console.log('Updating existing settings');
      const { data: updatedSettings, error: updateError } = await supabase
        .from('user_settings')
        .update(newSettings)
        .eq('profile_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating settings:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('Settings updated successfully:', updatedSettings);
      setSettings(updatedSettings);
      await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      return { success: true };
    } catch (error) {
      console.error('Error in updateSettings:', error);
      return { success: false, error: error.message };
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 