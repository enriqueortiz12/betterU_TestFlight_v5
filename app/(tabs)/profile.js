"use client";

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, Switch, Linking } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useUnits } from '../../context/UnitsContext';
import { useTracking } from '../../context/TrackingContext';
import { supabase } from '../../lib/supabase';

const ProfileScreen = () => {
  const { profile, refetchProfile, updateProfile } = useAuth();
  const { 
    convertWeight, 
    convertHeight, 
    getWeightUnit, 
    getHeightUnit, 
    useImperial, 
    toggleUnits,
    convertWeightBack,
    convertHeightBack 
  } = useUnits();
  const { calories, water, updateGoal } = useTracking();
  const [isLoading, setIsLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const router = useRouter();

  const GOALS = [
    { id: 'athleticism', label: 'Athleticism', description: 'Enhance overall athletic performance' },
    { id: 'strength', label: 'Strength', description: 'Build raw power and strength' },
    { id: 'muscle_growth', label: 'Muscle Growth', description: 'Focus on muscle hypertrophy' },
    { id: 'wellness', label: 'Wellness', description: 'Improve overall health and fitness' },
  ];

  const GENDERS = [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
    { id: 'non_binary', label: 'Non-Binary' },
    { id: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      await refetchProfile();
      setIsLoading(false);
    };
    loadProfile();
  }, []);

  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const formatValue = (value, type) => {
    if (!value) return '--';
    if (type === 'weight') {
      return `${convertWeight(value)} ${getWeightUnit()}`;
    }
    if (type === 'height') {
      return `${convertHeight(value)} ${getHeightUnit()}`;
    }
    return value;
  };

  const handleEdit = (field, value) => {
    setEditingField(field);
    if (field === 'weight' && value) {
      setEditValue(convertWeight(value));
    } else if (field === 'height' && value) {
      setEditValue(convertHeight(value));
    } else {
      setEditValue(value?.toString() || '');
    }
  };

  const handleOptionSelect = (value) => {
    setEditValue(value);
  };

  const handleSave = async () => {
    if (!editingField) return;

    try {
      let valueToSave = editValue;
      
      if (editingField === 'weight') {
        valueToSave = convertWeightBack(parseFloat(editValue));
      } else if (editingField === 'height') {
        valueToSave = convertHeightBack(parseFloat(editValue));
      }

      const updates = { [editingField]: valueToSave };
      const { error } = await updateProfile(updates);
      
      if (error) {
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      setEditingField(null);
      setEditValue('');
      await refetchProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const validateInput = (field, value) => {
    const numValue = parseFloat(value);
    switch (field) {
      case 'age':
        return !isNaN(numValue) && numValue >= 13 && numValue <= 120;
      case 'weight':
        if (useImperial) {
          return !isNaN(numValue) && numValue >= 66 && numValue <= 1100; // lbs
        }
        return !isNaN(numValue) && numValue >= 30 && numValue <= 500; // kg
      case 'height':
        if (useImperial) {
          return !isNaN(numValue) && numValue >= 39 && numValue <= 98; // inches
        }
        return !isNaN(numValue) && numValue >= 100 && numValue <= 250; // cm
      default:
        return true;
    }
  };

  const getDisplayValue = (field, value) => {
    if (!value) return '--';
    switch (field) {
      case 'weight':
        return useImperial 
          ? `${(value * 2.20462).toFixed(1)} lbs`
          : `${value} kg`;
      case 'height':
        return useImperial
          ? `${(value / 2.54).toFixed(1)} in`
          : `${value} cm`;
      default:
        return value;
    }
  };

  const handleEditProfile = () => {
    router.push('/(auth)/onboarding/age-weight');
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const settingsOptions = [
    {
      title: 'Units',
      icon: 'scale-outline',
      color: '#4CAF50',
      onPress: () => setShowUnitsModal(true),
    },
    {
      title: 'Language',
      icon: 'language-outline',
      color: '#2196F3',
      onPress: () => setShowLanguageModal(true),
    },
    {
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      color: '#9C27B0',
      onPress: () => Linking.openURL('https://betteruai.com/privacy'),
    },
    {
      title: 'Terms of Service',
      icon: 'document-text-outline',
      color: '#FF9800',
      onPress: () => Linking.openURL('https://betteruai.com/terms'),
    },
  ];

  const handleGoalEdit = async (type, value) => {
    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        Alert.alert('Invalid Value', 'Please enter a valid number greater than 0');
        return;
      }

      // First check if entry exists for today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingEntry } = await supabase
        .from(type === 'calories' ? 'calorie_tracking' : 'water_tracking')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('date', today)
        .single();

      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from(type === 'calories' ? 'calorie_tracking' : 'water_tracking')
          .update({
            goal: numValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEntry.id);

        if (error) throw error;
      } else {
        // Insert new entry
        const { error } = await supabase
          .from(type === 'calories' ? 'calorie_tracking' : 'water_tracking')
          .insert({
            user_id: profile.user_id,
            date: today,
            goal: numValue,
            consumed: type === 'calories' ? calories.consumed : water.consumed,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      await updateGoal(type, numValue);
      setEditingField(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  const renderGoalSettings = () => null;

  const renderEditContent = () => {
    if (editingField === 'calorie_goal' || editingField === 'water_goal') {
      return (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            value={editValue}
            onChangeText={setEditValue}
            keyboardType="numeric"
            placeholder={editingField === 'calorie_goal' ? 'Enter calorie goal' : 'Enter water goal'}
            placeholderTextColor="#666"
          />
          <View style={styles.editButtons}>
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={() => {
                setEditingField(null);
                setEditValue('');
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton]}
              onPress={() => handleGoalEdit(
                editingField === 'calorie_goal' ? 'calories' : 'water',
                editValue
              )}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (editingField === 'fitness_goal') {
      return (
        <View style={styles.optionsGrid}>
          {GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.optionCard,
                editValue === goal.id && styles.selectedOptionCard,
              ]}
              onPress={() => handleOptionSelect(goal.id)}
            >
              <Text style={[
                styles.optionLabel,
                editValue === goal.id && styles.selectedOptionLabel
              ]}>
                {goal.label}
              </Text>
              <Text style={[
                styles.optionDescription,
                editValue === goal.id && styles.selectedOptionDescription
              ]}>
                {goal.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (editingField === 'gender') {
      return (
        <View style={styles.optionsGrid}>
          {GENDERS.map((gender) => (
            <TouchableOpacity
              key={gender.id}
              style={[
                styles.optionCard,
                editValue === gender.id && styles.selectedOptionCard,
              ]}
              onPress={() => handleOptionSelect(gender.id)}
            >
              <Text style={[
                styles.optionLabel,
                editValue === gender.id && styles.selectedOptionLabel
              ]}>
                {gender.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <>
        {(editingField === 'weight' || editingField === 'height') && (
          <View style={styles.unitToggle}>
            <Text style={styles.unitText}>
              {editingField === 'weight' ? 'kg' : 'cm'}
            </Text>
            <Switch
              value={useImperial}
              onValueChange={toggleUnits}
              trackColor={{ false: '#333', true: '#00ffff50' }}
              thumbColor={useImperial ? '#00ffff' : '#666'}
            />
            <Text style={styles.unitText}>
              {editingField === 'weight' ? 'lbs' : 'in'}
            </Text>
          </View>
        )}

        <TextInput
          style={styles.modalInput}
          value={editValue}
          onChangeText={setEditValue}
          placeholder={`Enter your ${editingField?.replace('_', ' ')}`}
          placeholderTextColor="#666"
          keyboardType={['age', 'weight', 'height'].includes(editingField) ? 'numeric' : 'default'}
        />
      </>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#00ffff" />
      </View>
    );
  }

  const bmi = calculateBMI(profile?.weight, profile?.height);
  const bmiCategory = getBMICategory(bmi);

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#00ffff" />
          </View>
          <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statValue}>{formatValue(profile?.age)}</Text>
              <TouchableOpacity onPress={() => handleEdit('age', profile?.age)}>
                <Ionicons name="create-outline" size={16} color="#00ffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.statLabel}>Age</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statValue}>
                {formatValue(profile?.weight, 'weight')}
              </Text>
              <TouchableOpacity onPress={() => handleEdit('weight', profile?.weight)}>
                <Ionicons name="create-outline" size={16} color="#00ffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.statLabel}>Weight</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statValue}>
                {formatValue(profile?.height, 'height')}
              </Text>
              <TouchableOpacity onPress={() => handleEdit('height', profile?.height)}>
                <Ionicons name="create-outline" size={16} color="#00ffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.statLabel}>Height</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Profile</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="trophy-outline" size={24} color="#00ffff" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Fitness Goal</Text>
                <View style={styles.infoValueRow}>
                  <Text style={styles.infoValue}>
                    {profile?.fitness_goal?.replace(/_/g, ' ') || 'Not set'}
                  </Text>
                  <TouchableOpacity onPress={() => handleEdit('fitness_goal', profile?.fitness_goal)}>
                    <Ionicons name="create-outline" size={16} color="#00ffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={24} color="#00ffff" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Gender</Text>
                <View style={styles.infoValueRow}>
                  <Text style={styles.infoValue}>
                    {profile?.gender?.replace(/_/g, ' ') || 'Not set'}
                  </Text>
                  <TouchableOpacity onPress={() => handleEdit('gender', profile?.gender)}>
                    <Ionicons name="create-outline" size={16} color="#00ffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.infoRow, { marginBottom: 0 }]}>
              <Ionicons name="speedometer-outline" size={24} color="#00ffff" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>BMI</Text>
                <Text style={[styles.infoValue, { color: bmi ? '#00ffff' : '#fff' }]}>
                  {bmi ? (
                    <Text>
                      <Text style={styles.bmiValue}>{bmi}</Text>
                      <Text style={styles.bmiCategory}> ({bmiCategory})</Text>
                    </Text>
                  ) : 'Not available'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
          <Ionicons name="settings-outline" size={20} color="#fff" />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </ScrollView>

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
                {editingField === 'calorie_goal' ? 'Edit Calorie Goal' : 
                 editingField === 'water_goal' ? 'Edit Water Goal' : 
                 'Edit Profile'}
              </Text>
              {renderEditContent()}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setEditingField(null);
                    setEditValue('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
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
    paddingTop: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#888',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 255, 255, 0.03)',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.1)',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    minHeight: 90,
    justifyContent: 'center',
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(0, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 9,
    color: 'rgba(0, 255, 255, 0.7)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  editButton: {
    backgroundColor: '#00ffff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  modalContentWide: {
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  unitToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
  },
  unitText: {
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 18,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    backgroundColor: '#00ffff',
  },
  disabledButton: {
    backgroundColor: '#00ffff50',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  optionCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedOptionCard: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderColor: '#00ffff',
  },
  optionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedOptionLabel: {
    color: '#00ffff',
  },
  optionDescription: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedOptionDescription: {
    color: '#fff',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  bmiValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bmiCategory: {
    color: '#fff',
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  editContainer: {
    padding: 15,
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
});

export default ProfileScreen; 