import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, TextInput, Modal, Linking, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUnits } from '../../context/UnitsContext';
import { useTracking } from '../../context/TrackingContext';
import PremiumFeature from '../components/PremiumFeature';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../../context/UserContext';
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
  const { calories, water, updateGoal, stats } = useTracking();
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(0, 0, 0, 8, 0)); // 8:00 am default
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [restTimeSeconds, setRestTimeSeconds] = useState(90); // default 1:30
  const [showRestPicker, setShowRestPicker] = useState(false);

  console.warn('[SettingsScreen] isPremium:', isPremium);

  // Save rest time when changed
  useEffect(() => {
    const saveRestTime = async () => {
      try {
        await AsyncStorage.setItem('restTimeSeconds', String(restTimeSeconds));
        if (__DEV__) console.log('Saved rest time:', restTimeSeconds);
      } catch (error) {
        if (__DEV__) console.error('Error saving rest time:', error);
      }
    };
    saveRestTime();
  }, [restTimeSeconds]);

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const enabled = await AsyncStorage.getItem('notificationsEnabled');
        const time = await AsyncStorage.getItem('reminderTime');
        const savedRest = await AsyncStorage.getItem('restTimeSeconds');
        
        setNotificationsEnabled(enabled === 'true');
        if (time) setReminderTime(new Date(time));
        if (savedRest) {
          const parsedRest = Number(savedRest);
          setRestTimeSeconds(parsedRest);
          console.log('Loaded rest time:', parsedRest);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Single effect to handle notification scheduling
  useEffect(() => {
    const updateNotifications = async () => {
      if (notificationsEnabled) {
        await scheduleDailyNotification(reminderTime);
        await AsyncStorage.setItem('reminderTime', reminderTime.toISOString());
      } else {
        await cancelAllNotifications();
      }
      await AsyncStorage.setItem('notificationsEnabled', notificationsEnabled ? 'true' : 'false');
    };

    updateNotifications();
  }, [notificationsEnabled, reminderTime]);

  const scheduleDailyNotification = async (time) => {
    try {
      // First cancel any existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Only schedule if notifications are enabled
      if (!notificationsEnabled) return;

      // Calculate trigger time
      const trigger = new Date();
      trigger.setHours(time.getHours());
      trigger.setMinutes(time.getMinutes());
      trigger.setSeconds(0);
      
      // If the time has already passed today, schedule for tomorrow
      if (trigger < new Date()) {
        trigger.setDate(trigger.getDate() + 1);
      }

      // Schedule the notification
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'BetterU Reminder',
          body: 'Time for your daily workout and mental session!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          hour: trigger.getHours(),
          minute: trigger.getMinutes(),
          repeats: false, // Only send once
        },
      });

      console.log('Scheduled notification with ID:', id);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  };

  // Only schedule/cancel streak notification when toggling notifications
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Enable notifications in your device settings.');
        return;
      }
      setNotificationsEnabled(true);
      await scheduleStreakNotification();
    } else {
      setNotificationsEnabled(false);
      // Cancel streak notification when disabling
      const existingId = await AsyncStorage.getItem(STREAK_NOTIFICATION_ID_KEY);
      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
      }
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

  const handleGoalEdit = async (type, value) => {
    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        Alert.alert('Invalid Value', 'Please enter a valid number greater than 0');
        return;
      }

      await updateGoal(type, numValue);
      setEditingField(null);
      setEditValue('');
    } catch (error) {
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
              onValueChange={toggleUnits}
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
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Rest Time Between Sets</Text>
            <TouchableOpacity onPress={() => setShowRestPicker(true)}>
              <Text style={{ color: '#00ffff', fontWeight: 'bold', fontSize: 16 }}>{formatRestTime(restTimeSeconds)}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.settingValue}>This rest time will be used for all workouts.</Text>
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
          animationType="slide"
          onRequestClose={() => setEditingField(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingField === 'calorie_goal' ? 'Edit Calorie Goal' : 'Edit Water Goal'}
              </Text>
              <TextInput
                style={styles.input}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                placeholder={editingField === 'calorie_goal' ? 'Enter calorie goal' : 'Enter water goal'}
                placeholderTextColor="#666"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setEditingField(null);
                    setEditValue('');
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={() => handleGoalEdit(
                    editingField === 'calorie_goal' ? 'calories' : 'water',
                    editValue
                  )}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={showRestPicker} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}> 
            <Text style={styles.modalTitle}>Select Rest Time</Text>
            <Picker
              selectedValue={restTimeSeconds}
              onValueChange={setRestTimeSeconds}
              style={{ width: 200, color: '#fff', backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#222' }}
              itemStyle={{ color: '#fff', fontSize: 22 }}
            >
              {[...Array(19)].map((_, i) => {
                const val = 30 + i * 15;
                return <Picker.Item key={val} label={formatRestTime(val)} value={val} />;
              })}
            </Picker>
            <TouchableOpacity style={[styles.editButton, { marginTop: 20 }]} onPress={() => setShowRestPicker(false)}>
              <Text style={styles.buttonText}>Done</Text>
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
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  dangerText: {
    fontSize: 16,
    color: '#ff4444',
    letterSpacing: 0.3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  saveButton: {
    backgroundColor: '#00ffff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRowWithBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 10,
    paddingTop: 20,
  },
});

export default SettingsScreen; 