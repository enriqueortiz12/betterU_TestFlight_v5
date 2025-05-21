import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, TextInput, Modal, Linking, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUnits } from '../../context/UnitsContext';
import { useTracking } from '../../context/TrackingContext';
import { useSettings } from '../../context/SettingsContext';
import { useUser } from '../../context/UserContext';
import PremiumFeature from '../components/PremiumFeature';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const STREAK_NOTIFICATION_ID_KEY = 'streakNotificationId';

const SettingsScreen = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { isPremium } = useUser();
  const { useImperial, toggleUnits } = useUnits();
  const { calories, water, updateGoal } = useTracking();
  const { settings, updateSettings, isLoading } = useSettings();
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(0, 0, 0, 8, 0)); // 8:00 am default
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [restTimeSeconds, setRestTimeSeconds] = useState(90); // default 1:30
  const [showRestPicker, setShowRestPicker] = useState(false);

  console.warn('[SettingsScreen] isPremium:', isPremium);

  // Load saved settings on mount
  useEffect(() => {
    if (settings) {
      console.log('Loading settings from Supabase:', settings);
      setNotificationsEnabled(settings.daily_reminders);
      setRestTimeSeconds(settings.rest_time_seconds || 90); // Default to 90 seconds if not set
    }
  }, [settings]);

  // Save settings when changed
  const handleSettingsChange = async (key, value) => {
    try {
      console.log('Updating setting:', key, value);
      const newSettings = { [key]: value };
      const { success, error } = await updateSettings(newSettings);
      if (!success) {
        console.error('Error updating settings:', error);
        Alert.alert('Error', 'Failed to update settings');
      } else {
        console.log('Settings updated successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  // Handle rest time change
  const handleRestTimeChange = async (seconds) => {
    setRestTimeSeconds(seconds);
    await handleSettingsChange('rest_time_seconds', seconds);
  };

  // Handle notifications toggle
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Enable notifications in your device settings.');
        return;
      }
      setNotificationsEnabled(true);
      await handleSettingsChange('daily_reminders', true);
      await scheduleStreakNotification();
    } else {
      setNotificationsEnabled(false);
      await handleSettingsChange('daily_reminders', false);
      // Cancel streak notification when disabling
      const existingId = await AsyncStorage.getItem(STREAK_NOTIFICATION_ID_KEY);
      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
      }
    }
  };

  // Handle units toggle
  const handleToggleUnits = async () => {
    const newValue = !useImperial;
    console.log('Toggling units to:', newValue);
    await handleSettingsChange('use_imperial', newValue);
    toggleUnits(newValue);
  };

  // Handle goal updates
  const handleGoalEdit = async (type, value) => {
    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        Alert.alert('Invalid Value', 'Please enter a valid number greater than 0');
        return;
      }

      if (type === 'calories') {
        await handleSettingsChange('calorie_goal', numValue);
      } else if (type === 'water') {
        await handleSettingsChange('water_goal_ml', numValue * 1000); // Convert L to ml
      }

      await updateGoal(type, numValue);
      setEditingField(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  // Helper to format rest time
  const formatRestTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Schedules a daily streak notification at 6pm
  const scheduleStreakNotification = async () => {
    try {
      // Cancel any existing streak notification
      const existingId = await AsyncStorage.getItem(STREAK_NOTIFICATION_ID_KEY);
      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
      }

      if (!notificationsEnabled) return;

      // Schedule for 6pm every day
      const trigger = {
        hour: 18,
        minute: 0,
        repeats: true,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'BetterU Streak Reminder',
          body: 'Don\'t forget to complete your daily workout and mental session to keep your streak alive!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });
      await AsyncStorage.setItem(STREAK_NOTIFICATION_ID_KEY, id);
      console.log('Scheduled streak notification with ID:', id);
    } catch (error) {
      console.error('Error scheduling streak notification:', error);
    }
  };

  const handleBackToProfile = () => {
    router.back();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#00ffff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackToProfile}
        >
          <Ionicons name="chevron-back" size={24} color="#00ffff" />
          <Text style={styles.backButtonText}>Back to Profile</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Go Premium button for free users */}
      {!isPremium && (
        <TouchableOpacity
          style={styles.premiumButton}
          onPress={() => router.push('/purchase-subscription')}
        >
          <Text style={styles.premiumButtonText}>Go Premium</Text>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Use Imperial Units</Text>
            <Switch
              value={useImperial}
              onValueChange={handleToggleUnits}
              trackColor={{ false: '#333', true: '#00ffff50' }}
              thumbColor={useImperial ? '#00ffff' : '#666'}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowWithBorder]}> 
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Calorie Goal</Text>
              <Text style={styles.settingValue}>{calories.goal} cal</Text>
            </View>
            <View style={styles.editButtonContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  if (isPremium) {
                    setEditingField('calorie_goal');
                    setEditValue(calories.goal.toString());
                  }
                }}
                disabled={!isPremium}
              >
                <Ionicons name="pencil" size={20} color="#00ffff" />
              </TouchableOpacity>
              {!isPremium && (
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={28} color="#fff" style={{ opacity: 0.85 }} />
                </View>
              )}
            </View>
          </View>

          <View style={[styles.settingRow, styles.settingRowWithBorder]}> 
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Water Goal</Text>
              <Text style={styles.settingValue}>{water.goal} L</Text>
            </View>
            <View style={styles.editButtonContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  if (isPremium) {
                    setEditingField('water_goal');
                    setEditValue(water.goal.toString());
                  }
                }}
                disabled={!isPremium}
              >
                <Ionicons name="pencil" size={20} color="#00ffff" />
              </TouchableOpacity>
              {!isPremium && (
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={28} color="#fff" style={{ opacity: 0.85 }} />
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminders</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Daily Workout & Mental Reminder</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#333', true: '#00ffff50' }}
              thumbColor={notificationsEnabled ? '#00ffff' : '#666'}
            />
          </View>
          {notificationsEnabled && (
            <>
              <TouchableOpacity
                style={{ marginTop: 10, alignItems: 'center' }}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ color: '#00ffff', fontWeight: 'bold', fontSize: 16 }}>
                  Reminder Time: {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: '#00ffff',
                  borderRadius: 8,
                  padding: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#00ffff',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                onPress={async () => {
                  const id = await Notifications.scheduleNotificationAsync({
                    content: {
                      title: 'Test Notification',
                      body: 'This is a test notification from BetterU!',
                      sound: true,
                    },
                    trigger: null,
                  });
                  console.log('Test notification scheduled with ID:', id);
                  Alert.alert('Notification Sent', 'Check your device notifications.');
                }}
              >
                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>Test Send Notification</Text>
              </TouchableOpacity>
            </>
          )}
          {showTimePicker && (
            <DateTimePicker
              value={reminderTime}
              mode="time"
              is24Hour={false}
              display="spinner"
              textColor="#fff"
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (event.type === 'set' && selectedDate) {
                  setReminderTime(selectedDate);
                }
              }}
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Preferences</Text>
        <View style={styles.card}>
          <View style={[styles.settingRow, { position: 'relative' }]}>
            <Text style={styles.settingLabel}>Rest Time Between Sets</Text>
            <TouchableOpacity 
              onPress={() => {
                if (!isPremium) {
                  Alert.alert(
                    'Premium Feature',
                    'Upgrade to Premium to customize your rest timer!',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                setShowRestPicker(true);
              }}
              disabled={!isPremium}
            >
              <Text style={{ color: '#00ffff', fontWeight: 'bold', fontSize: 16 }}>{formatRestTime(restTimeSeconds)}</Text>
            </TouchableOpacity>
            {!isPremium && (
              <View style={styles.lockOverlay}>
                <Ionicons name="lock-closed" size={28} color="#fff" style={{ opacity: 0.85 }} />
              </View>
            )}
          </View>
          <Text style={styles.settingValue}>
            {isPremium 
              ? "This rest time will be used for all workouts."
              : "Upgrade to Premium to customize your rest timer."
            }
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handleSignOut}
          >
            <Text style={styles.dangerText}>Sign Out</Text>
            <Ionicons name="log-out-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
          {/* Feedback Button */}
          <TouchableOpacity
            style={[styles.settingButton, { marginTop: 16, backgroundColor: '#00ffff20', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
            onPress={() => Linking.openURL('https://docs.google.com/forms/d/e/1FAIpQLScqC-Un8Nisy7W1iGYTIvjUmMr4iZyEMLJ-hfv53OsNvzHmfg/viewform?usp=dialog')}
          >
            <Ionicons name="chatbox-ellipses-outline" size={20} color="#00ffff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#00ffff', fontWeight: 'bold', fontSize: 16 }}>Send Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>

      {editingField && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setEditingField(null)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { alignItems: 'center', padding: 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingField === 'calorie_goal' ? 'Edit Calorie Goal' : 'Edit Water Goal'}
                </Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setEditingField(null)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={parseInt(editValue)}
                  onValueChange={(value) => setEditValue(value.toString())}
                  style={{ width: 200, color: '#fff', backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#222' }}
                  itemStyle={{ color: '#fff', fontSize: 22 }}
                >
                  {editingField === 'calorie_goal' ? (
                    // Calorie options from 1000 to 5000 in steps of 100
                    [...Array(41)].map((_, i) => {
                      const value = 1000 + (i * 100);
                      return <Picker.Item key={value} label={`${value} cal`} value={value} />;
                    })
                  ) : (
                    // Water options from 1L to 5L in steps of 0.5L
                    [...Array(9)].map((_, i) => {
                      const value = 1 + (i * 0.5);
                      return <Picker.Item key={value} label={`${value} L`} value={value} />;
                    })
                  )}
                </Picker>
              </View>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton, { marginTop: 20, width: '100%' }]} 
                onPress={() => {
                  handleGoalEdit(
                    editingField === 'calorie_goal' ? 'calories' : 'water',
                    editValue
                  );
                  setEditingField(null);
                }}
              >
                <Text style={[styles.buttonText, { color: '#000' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={showRestPicker} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { alignItems: 'center', padding: 20 }]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Rest Time</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowRestPicker(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={restTimeSeconds}
                onValueChange={handleRestTimeChange}
                style={{ width: 200, color: '#fff', backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#222' }}
                itemStyle={{ color: '#fff', fontSize: 22 }}
              >
                {[...Array(19)].map((_, i) => {
                  const val = 30 + i * 15;
                  return <Picker.Item key={val} label={formatRestTime(val)} value={val} />;
                })}
              </Picker>
            </View>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton, { marginTop: 20, width: '100%' }]} 
              onPress={() => setShowRestPicker(false)}
            >
              <Text style={[styles.buttonText, { color: '#000' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 60,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButtonText: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  premiumButton: {
    backgroundColor: '#00ffff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  premiumButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: 'rgba(0, 255, 255, 0.03)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.1)',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.3,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editButtonContainer: {
    position: 'relative',
    width: 35,
    height: 35,
  },
  editButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    pointerEvents: 'auto',
  },
  settingRowWithBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 10,
    paddingTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseButton: {
    padding: 5,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#00ffff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  dangerText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default SettingsScreen; 