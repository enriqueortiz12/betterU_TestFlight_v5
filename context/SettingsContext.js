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
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading settings:', error);
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

      // Always try to update first
      const { data: updatedSettings, error: updateError } = await supabase
        .from('user_settings')
        .update(newSettings)
        .eq('id', user.id)
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

  // Load settings when the component mounts
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