import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

const popularExercises = [
  // Chest
  'Bench Press', 'Incline Bench Press', 'Dumbbell Flyes', 'Push-Up', 'Chest Press Machine',
  // Back
  'Pull-Up', 'Chin-Up', 'Barbell Row', 'Dumbbell Row', 'Lat Pulldown', 'Seated Cable Row',
  // Shoulders
  'Shoulder Press', 'Overhead Press', 'Lateral Raise', 'Front Raise', 'Rear Delt Fly',
  // Arms
  'Bicep Curl', 'Hammer Curl', 'Tricep Dip', 'Tricep Pushdown', 'Skullcrusher', 'Preacher Curl',
  // Legs
  'Squat', 'Front Squat', 'Deadlift', 'Romanian Deadlift', 'Leg Press', 'Lunge', 'Leg Extension', 'Leg Curl', 'Calf Raise', 'Bulgarian Split Squat',
  // Core
  'Plank', 'Russian Twist', 'Leg Raise', 'Cable Crunch', 'Bicycle Crunch', 'Mountain Climber',
  // Glutes
  'Hip Thrust', 'Glute Bridge',
  // Cardio/HIIT
  'Burpees', 'Jump Squat', 'High Knees', 'Box Jump', 'Battle Ropes',
];

const CreateWorkoutScreen = () => {
  const router = useRouter();
  const [workoutName, setWorkoutName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleExercise = (exercise) => {
    if (selectedExercises.some(e => e.name === exercise)) {
      setSelectedExercises(selectedExercises.filter(e => e.name !== exercise));
    } else {
      setSelectedExercises([...selectedExercises, { name: exercise, sets: '3', reps: '10' }]);
    }
  };

  const updateExerciseField = (exercise, field, value) => {
    setSelectedExercises(selectedExercises.map(e =>
      e.name === exercise ? { ...e, [field]: value } : e
    ));
  };

  const handleSave = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Please enter a workout name.');
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert('Please select at least one exercise.');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      const { error } = await supabase
        .from('workouts')
        .insert([
          {
            user_id: user.id,
            name: workoutName,
            exercises: selectedExercises,
          },
        ]);
      if (error) throw error;
      Alert.alert('Workout saved!');
      router.replace('/(tabs)/workout');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save workout.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Exit Button */}
      <TouchableOpacity style={styles.exitButton} onPress={() => router.replace('/(tabs)/workout')}>
        <Ionicons name="close" size={28} color="#00ffff" />
      </TouchableOpacity>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Workout</Text>
        <TextInput
          style={styles.input}
          placeholder="Workout Name"
          placeholderTextColor="#888"
          value={workoutName}
          onChangeText={setWorkoutName}
        />
        <Text style={styles.sectionTitle}>Select Exercises</Text>
        {popularExercises.map((exercise) => {
          const selected = selectedExercises.some(e => e.name === exercise);
          const exerciseObj = selectedExercises.find(e => e.name === exercise);
          return (
            <View key={exercise} style={styles.exerciseRow}>
              <TouchableOpacity
                style={[styles.checkbox, selected && styles.checkboxSelected]}
                onPress={() => toggleExercise(exercise)}
              >
                {selected && <Ionicons name="checkmark" size={18} color="#fff" />}
              </TouchableOpacity>
              <Text style={styles.exerciseName}>{exercise}</Text>
              {selected && (
                <>
                  <TextInput
                    style={styles.setsInput}
                    value={exerciseObj.sets}
                    onChangeText={val => updateExerciseField(exercise, 'sets', val)}
                    keyboardType="numeric"
                    placeholder="Sets"
                    placeholderTextColor="#888"
                  />
                  <Text style={styles.xText}>x</Text>
                  <TextInput
                    style={styles.repsInput}
                    value={exerciseObj.reps}
                    onChangeText={val => updateExerciseField(exercise, 'reps', val)}
                    keyboardType="numeric"
                    placeholder="Reps"
                    placeholderTextColor="#888"
                  />
                </>
              )}
            </View>
          );
        })}
        {/* Save Workout button styled like original Training Plans button */}
        <TouchableOpacity
          style={styles.trainingPlansButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="save" size={20} color="#00ffff" style={{marginRight: 6}} />
          <Text style={styles.trainingPlansButtonText}>{saving ? 'Saving...' : 'Save Workout'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  exitButton: {
    position: 'absolute',
    top: 48,
    left: 18,
    zIndex: 10,
    backgroundColor: 'rgba(0,255,255,0.08)',
    borderRadius: 20,
    padding: 6,
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#00ffff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00cccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0,255,255,0.05)',
  },
  checkboxSelected: {
    backgroundColor: '#00cccc',
    borderColor: '#00ffff',
  },
  exerciseName: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  setsInput: {
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#fff',
    borderRadius: 6,
    padding: 6,
    fontSize: 14,
    marginLeft: 8,
    textAlign: 'center',
  },
  xText: {
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 4,
  },
  repsInput: {
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#fff',
    borderRadius: 6,
    padding: 6,
    fontSize: 14,
    marginLeft: 4,
    textAlign: 'center',
  },
  // Modern button styles
  trainingPlansButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#00ffff',
  },
  trainingPlansButtonText: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CreateWorkoutScreen; 