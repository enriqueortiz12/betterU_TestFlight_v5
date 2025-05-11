import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUnits } from '../context/UnitsContext';
import { useTracking } from '../context/TrackingContext';

const SettingsScreen = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { useImperial, toggleUnits } = useUnits();
  const { calories, water, updateGoal } = useTracking();
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleBackToProfile = () => {
    router.replace('/(tabs)/profile');
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

  return (
    <View style={styles.container}>
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
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setEditingField('calorie_goal');
                setEditValue(calories.goal.toString());
              }}
            >
              <Ionicons name="pencil" size={20} color="#00ffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Water Goal</Text>
              <Text style={styles.settingValue}>{water.goal} L</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setEditingField('water_goal');
                setEditValue(water.goal.toString());
              }}
            >
              <Ionicons name="pencil" size={20} color="#00ffff" />
            </TouchableOpacity>
          </View>
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
    </View>
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
  editButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
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