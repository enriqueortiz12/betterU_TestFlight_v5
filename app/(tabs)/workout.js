"use client";

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const WorkoutScreen = () => {
  const router = useRouter();
  const [showLogs, setShowLogs] = useState(false);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [monthlyWorkouts, setMonthlyWorkouts] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const fetchWorkoutLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current month's start and end dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkoutLogs(data || []);
      setMonthlyWorkouts(data ? data.length : 0);
    } catch (error) {
      console.error('Error fetching workout logs:', error);
    }
  };

  const deleteAllWorkoutLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setWorkoutLogs([]);
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error('Error deleting workout logs:', error);
      Alert.alert('Error', 'Failed to delete workout logs');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkoutLogs();
    }, [])
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderWorkoutLog = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>{item.training_style}</Text>
        <Text style={styles.logDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.logStats}>
        <View style={styles.logStat}>
          <Ionicons name="time-outline" size={20} color="#00ffff" />
          <Text style={styles.logStatValue}>{formatTime(parseInt(item.duration))}</Text>
        </View>
        <View style={styles.logStat}>
          <Ionicons name="barbell-outline" size={20} color="#00ffff" />
          <Text style={styles.logStatValue}>{item.exercise_count} exercises</Text>
        </View>
        <View style={styles.logStat}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#00ffff" />
          <Text style={styles.logStatValue}>{item.completed_sets} sets</Text>
        </View>
      </View>
      <View style={styles.logDetails}>
        <Text style={styles.logDetailTitle}>Exercises:</Text>
        {item.exercise_names && item.exercise_names.map((exercise, index) => (
          <Text key={index} style={styles.logDetailText}>• {exercise}</Text>
        ))}
        {item.total_weight > 0 && (
          <Text style={styles.logDetailText}>Total Weight: {item.total_weight} lbs</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.logButton}
            onPress={() => setShowLogs(true)}
          >
            <Text style={styles.logButtonText}>Logs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.trainingPlansButton}
        onPress={() => router.push('/training-plans')}
      >
        <Text style={styles.trainingPlansButtonText}>Training Plans</Text>
      </TouchableOpacity>

      {/* Workout Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Types</Text>
        
        {/* Full Body Workout */}
        <TouchableOpacity 
          style={styles.workoutCard}
          onPress={() => router.push('/active-workout')}
        >
          <View>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle}>Full Body Workout</Text>
              <View style={styles.repRange}>
                <Text style={styles.repRangeText}>8-12 reps</Text>
              </View>
            </View>
            <Text style={styles.workoutDescription}>
              Complete full body workout targeting all major muscle groups
            </Text>
            <View style={styles.workoutMeta}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.metaText}>60 min</Text>
              <Ionicons name="flame-outline" size={20} color="#666" />
              <Text style={styles.metaText}>High Intensity</Text>
            </View>
            <View style={styles.exercises}>
              <Text style={styles.exercisesTitle}>Exercises:</Text>
              <Text style={styles.exercisesList}>• Squats</Text>
              <Text style={styles.exercisesList}>• Bench Press</Text>
              <Text style={styles.exercisesList}>• Deadlifts</Text>
              <Text style={styles.exercisesList}>• Pull-ups</Text>
              <Text style={styles.exercisesList}>• Shoulder Press</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push({
              pathname: '/active-workout',
              params: { type: 'Full Body Workout' }
            })}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Upper Body Power */}
        <TouchableOpacity 
          style={styles.workoutCard}
          onPress={() => router.push('/active-workout')}
        >
          <View>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle}>Upper Body Power</Text>
              <View style={styles.repRange}>
                <Text style={styles.repRangeText}>4-6 reps</Text>
              </View>
            </View>
            <Text style={styles.workoutDescription}>
              Heavy upper body focused workout for strength gains
            </Text>
            <View style={styles.workoutMeta}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.metaText}>45 min</Text>
              <Ionicons name="flame-outline" size={20} color="#666" />
              <Text style={styles.metaText}>High Intensity</Text>
            </View>
            <View style={styles.exercises}>
              <Text style={styles.exercisesTitle}>Exercises:</Text>
              <Text style={styles.exercisesList}>• Bench Press</Text>
              <Text style={styles.exercisesList}>• Weighted Pull-ups</Text>
              <Text style={styles.exercisesList}>• Military Press</Text>
              <Text style={styles.exercisesList}>• Barbell Rows</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push({
              pathname: '/active-workout',
              params: { type: 'Upper Body Power' }
            })}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Lower Body Power */}
        <TouchableOpacity 
          style={styles.workoutCard}
          onPress={() => router.push('/active-workout')}
        >
          <View>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle}>Lower Body Power</Text>
              <View style={styles.repRange}>
                <Text style={styles.repRangeText}>4-6 reps</Text>
              </View>
            </View>
            <Text style={styles.workoutDescription}>
              Heavy lower body focused workout for strength gains
            </Text>
            <View style={styles.workoutMeta}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.metaText}>45 min</Text>
              <Ionicons name="flame-outline" size={20} color="#666" />
              <Text style={styles.metaText}>High Intensity</Text>
            </View>
            <View style={styles.exercises}>
              <Text style={styles.exercisesTitle}>Exercises:</Text>
              <Text style={styles.exercisesList}>• Back Squats</Text>
              <Text style={styles.exercisesList}>• Romanian Deadlifts</Text>
              <Text style={styles.exercisesList}>• Front Squats</Text>
              <Text style={styles.exercisesList}>• Leg Press</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push({
              pathname: '/active-workout',
              params: { type: 'Lower Body Power' }
            })}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* HIIT Cardio */}
        <TouchableOpacity 
          style={styles.workoutCard}
          onPress={() => router.push('/active-workout')}
        >
          <View>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle}>HIIT Cardio</Text>
              <View style={styles.repRange}>
                <Text style={styles.repRangeText}>30s work/30s rest</Text>
              </View>
            </View>
            <Text style={styles.workoutDescription}>
              High-intensity interval training for maximum calorie burn
            </Text>
            <View style={styles.workoutMeta}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.metaText}>30 min</Text>
              <Ionicons name="flame-outline" size={20} color="#666" />
              <Text style={styles.metaText}>Very High Intensity</Text>
            </View>
            <View style={styles.exercises}>
              <Text style={styles.exercisesTitle}>Exercises:</Text>
              <Text style={styles.exercisesList}>• Burpees</Text>
              <Text style={styles.exercisesList}>• Mountain Climbers</Text>
              <Text style={styles.exercisesList}>• Jump Squats</Text>
              <Text style={styles.exercisesList}>• High Knees</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push({
              pathname: '/active-workout',
              params: { type: 'HIIT Cardio' }
            })}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Core & Abs */}
        <TouchableOpacity 
          style={styles.workoutCard}
          onPress={() => router.push('/active-workout')}
        >
          <View>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle}>Core & Abs</Text>
              <View style={styles.repRange}>
                <Text style={styles.repRangeText}>15-20 reps</Text>
              </View>
            </View>
            <Text style={styles.workoutDescription}>
              Focused core workout for strength and definition
            </Text>
            <View style={styles.workoutMeta}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.metaText}>30 min</Text>
              <Ionicons name="flame-outline" size={20} color="#666" />
              <Text style={styles.metaText}>Medium Intensity</Text>
            </View>
            <View style={styles.exercises}>
              <Text style={styles.exercisesTitle}>Exercises:</Text>
              <Text style={styles.exercisesList}>• Planks</Text>
              <Text style={styles.exercisesList}>• Russian Twists</Text>
              <Text style={styles.exercisesList}>• Leg Raises</Text>
              <Text style={styles.exercisesList}>• Cable Crunches</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push({
              pathname: '/active-workout',
              params: { type: 'Core & Abs' }
            })}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Mobility & Recovery */}
        <TouchableOpacity 
          style={styles.workoutCard}
          onPress={() => router.push('/active-workout')}
        >
          <View>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle}>Mobility & Recovery</Text>
              <View style={styles.repRange}>
                <Text style={styles.repRangeText}>30-60s holds</Text>
              </View>
            </View>
            <Text style={styles.workoutDescription}>
              Stretching and mobility work for better flexibility and recovery
            </Text>
            <View style={styles.workoutMeta}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.metaText}>40 min</Text>
              <Ionicons name="flame-outline" size={20} color="#666" />
              <Text style={styles.metaText}>Low Intensity</Text>
            </View>
            <View style={styles.exercises}>
              <Text style={styles.exercisesTitle}>Exercises:</Text>
              <Text style={styles.exercisesList}>• Dynamic Stretching</Text>
              <Text style={styles.exercisesList}>• Foam Rolling</Text>
              <Text style={styles.exercisesList}>• Yoga Poses</Text>
              <Text style={styles.exercisesList}>• Joint Mobility</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push({
              pathname: '/active-workout',
              params: { type: 'Mobility & Recovery' }
            })}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </TouchableOpacity>
    </View>

    {/* Workout Logs Modal */}
    <Modal
      visible={showLogs}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Workout History</Text>
              <Text style={styles.modalSubtitle}>{monthlyWorkouts} workouts this month</Text>
            </View>
            <View style={styles.modalHeaderButtons}>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => setShowDeleteConfirmation(true)}
              >
                <Ionicons name="trash-outline" size={24} color="#ff4444" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowLogs(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <FlatList
            data={workoutLogs}
            renderItem={renderWorkoutLog}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.logsList}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>No workout history yet</Text>
            )}
            onRefresh={fetchWorkoutLogs}
            refreshing={false}
          />
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Delete All Workout Logs?</Text>
            <Text style={styles.confirmationText}>This action cannot be undone. All your workout history will be permanently deleted.</Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={[styles.confirmationButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirmation(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmationButton, styles.deleteButton]}
                onPress={deleteAllWorkoutLogs}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logButtonText: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterButton: {
    padding: 5,
  },
  trainingPlansButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  trainingPlansButtonText: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  workoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  repRange: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  repRangeText: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: '600',
  },
  workoutDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  metaText: {
    color: '#666',
    fontSize: 14,
    marginRight: 15,
  },
  exercises: {
    marginBottom: 15,
  },
  exercisesTitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  exercisesList: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  startButton: {
    backgroundColor: '#00ffff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'transparent',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'transparent',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logsList: {
    padding: 20,
  },
  logCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  logDate: {
    fontSize: 14,
    color: '#666',
  },
  logStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logStatValue: {
    color: '#00ffff',
    fontSize: 14,
  },
  logDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  logDetailTitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  logDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    marginBottom: 2,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  confirmationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmationButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default WorkoutScreen; 