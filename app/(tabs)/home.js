"use client";

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTracking } from '../../context/TrackingContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';

// Add more motivational quotes
const motivationalQuotes = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
  { text: "The body achieves what the mind believes.", author: "Napoleon Hill" },
  { text: "The difference between try and triumph is just a little umph!", author: "Marvin Phillips" },
  { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "What seems impossible today will one day become your warm-up.", author: "Unknown" },
  { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
  { text: "The only limits that exist are the ones you place on yourself.", author: "Unknown" },
  { text: "Progress is progress, no matter how small.", author: "Unknown" },
  { text: "Your future self is watching you right now through memories.", author: "Unknown" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { text: "Don't wish for it, work for it.", author: "Unknown" },
  { text: "You are stronger than you think.", author: "Unknown" },
  { text: "Small steps are better than no steps.", author: "Unknown" },
  { text: "Every rep counts, every set matters.", author: "Unknown" }
];

const HomeScreen = () => {
  const router = useRouter();
  const { profile } = useAuth();
  const { calories, water, mood, stats, addCalories, addWater, updateGoal } = useTracking();
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [calorieInput, setCalorieInput] = useState('');
  const [showCustomWaterModal, setShowCustomWaterModal] = useState(false);
  const [waterInput, setWaterInput] = useState('');
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showGoalModal, setShowGoalModal] = useState(null);
  const [goalInput, setGoalInput] = useState('');

  // Update quote rotation with smooth transitions
  useEffect(() => {
    const rotateQuote = () => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Change quote with true random selection
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * motivationalQuotes.length);
        } while (newIndex === motivationalQuotes.indexOf(currentQuote));
        
        setCurrentQuote(motivationalQuotes[newIndex]);
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    };

    const intervalId = setInterval(rotateQuote, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [currentQuote]);

  const handleAddCalories = () => {
    const amount = parseInt(calorieInput);
    if (!isNaN(amount) && amount > 0) {
      addCalories(amount);
      setCalorieInput('');
      setShowCalorieModal(false);
    }
  };

  const handleAddWater = (amount) => {
    if (amount === 'custom') {
      setShowCustomWaterModal(true);
    } else {
      addWater(amount);
    }
  };

  const handleAddCustomWater = () => {
    const amount = parseFloat(waterInput);
    if (!isNaN(amount) && amount > 0) {
      addWater(amount);
      setWaterInput('');
      setShowCustomWaterModal(false);
    }
  };

  const handleUpdateGoal = () => {
    const amount = showGoalModal === 'calories' ? parseInt(goalInput) : parseFloat(goalInput);
    if (!isNaN(amount) && amount > 0) {
      updateGoal(showGoalModal, amount);
      setShowGoalModal(null);
      setGoalInput('');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Good Afternoon</Text>
          <Text style={styles.nameText}>{profile?.full_name || 'User'}</Text>
        </View>
      </View>

      {/* Motivational Quote Card */}
      <Animated.View style={[styles.quoteCard, { opacity: fadeAnim }]}>
        <Text style={styles.quoteText}>"{currentQuote.text}"</Text>
        <Text style={styles.quoteAuthor}>- {currentQuote.author}</Text>
      </Animated.View>

      <View style={styles.streakContainer}>
        <View style={styles.streakContent}>
          <Ionicons name="flame" size={24} color="#ff6b6b" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>BetterU Streak</Text>
            <Text style={styles.streakValue}>{stats.streak || 0} days</Text>
          </View>
        </View>
        <View style={styles.activityStatus}>
          <View style={styles.activityItem}>
            <Ionicons 
              name={stats.today_workout_completed ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={stats.today_workout_completed ? "#00ffff" : "#666"} 
            />
            <Text style={[styles.activityText, stats.today_workout_completed && styles.activityCompleted]}>
              Workout
            </Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons 
              name={stats.today_mental_completed ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={stats.today_mental_completed ? "#00ffff" : "#666"} 
            />
            <Text style={[styles.activityText, stats.today_mental_completed && styles.activityCompleted]}>
              Mental Session
            </Text>
          </View>
        </View>
        <Text style={styles.streakDescription}>
          Complete both a workout and mental session daily to maintain your streak!
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { width: '48%' }]}>
            <Ionicons name="flame" size={24} color="#ff4444" />
            <Text style={styles.statValue}>{stats.workouts || 0}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={[styles.statsCard, { width: '48%' }]}>
            <Ionicons name="time" size={24} color="#4444ff" />
            <Text style={styles.statValue}>{stats.minutes || 0}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { width: '48%' }]}>
            <Ionicons name="leaf" size={24} color="#44ff44" />
            <Text style={styles.statValue}>{stats.mental_sessions || 0}</Text>
            <Text style={styles.statLabel}>Mental Sessions</Text>
          </View>
          <View style={[styles.statsCard, { width: '48%' }]}>
            <Ionicons name="trophy" size={24} color="#ffff44" />
            <Text style={styles.statValue}>{stats.prs_this_month || 0}</Text>
            <Text style={styles.statLabel}>PRs This Month</Text>
          </View>
        </View>
      </View>

      {/* Mental Wellness Check */}
      <View style={styles.wellnessCard}>
        <View style={styles.wellnessHeader}>
          <Ionicons name="sad" size={24} color="#ffb6c1" />
          <View style={styles.wellnessText}>
            <Text style={styles.wellnessTitle}>Mental Wellness Check</Text>
            <Text style={styles.wellnessSubtitle}>You're feeling {mood} today</Text>
          </View>
        </View>
        <Text style={styles.wellnessDescription}>
          Track your daily mood to monitor your mental wellness and identify patterns over time.
        </Text>
        <View style={styles.wellnessButtons}>
          <TouchableOpacity style={styles.wellnessButton} onPress={() => router.push('/(tabs)/mental')}>
            <Text style={styles.wellnessButtonText}>Update Mood</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.wellnessButton} onPress={() => router.push('/mood-history')}>
            <Text style={styles.wellnessButtonText}>View History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calorie Tracker */}
      <View style={styles.trackerCard}>
        <View style={styles.trackerHeader}>
          <Text style={styles.trackerTitle}>Calorie Tracker</Text>
          <TouchableOpacity onPress={() => setShowGoalModal('calories')}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.trackerProgress}>{calories.consumed} / {calories.goal} cal</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(calories.consumed / calories.goal) * 100}%` }]} />
        </View>
        <View style={styles.trackerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{calories.consumed}</Text>
            <Text style={styles.statLabel}>Consumed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{calories.goal - calories.consumed}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCalorieModal(true)}>
          <Text style={styles.addButtonText}>+ Add Calories</Text>
        </TouchableOpacity>
      </View>

      {/* Water Tracker */}
      <View style={styles.trackerCard}>
        <View style={styles.trackerHeader}>
          <Text style={styles.trackerTitle}>Water Tracker</Text>
          <TouchableOpacity onPress={() => setShowGoalModal('water')}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.trackerProgress}>{water.consumed}ml / {water.goal}L</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(water.consumed / (water.goal * 1000)) * 100}%` }]} />
        </View>
        <View style={styles.trackerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{water.consumed}ml</Text>
            <Text style={styles.statLabel}>Consumed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(water.goal * 1000) - water.consumed}ml</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
        <View style={styles.quickAddContainer}>
          <Text style={styles.quickAddLabel}>Quick Add:</Text>
          <View style={styles.quickAddButtons}>
            <TouchableOpacity style={styles.quickAddButton} onPress={() => handleAddWater(250)}>
              <Text style={styles.quickAddButtonText}>250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAddButton} onPress={() => handleAddWater(500)}>
              <Text style={styles.quickAddButtonText}>500ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAddButton} onPress={() => handleAddWater('custom')}>
              <Text style={styles.quickAddButtonText}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Goal Setting Modal */}
      <Modal
        visible={showGoalModal !== null}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Set Daily {showGoalModal === 'calories' ? 'Calorie' : 'Water'} Goal
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowGoalModal(null);
                  setGoalInput('');
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                value={goalInput}
                onChangeText={setGoalInput}
                placeholder={`Enter daily ${showGoalModal === 'calories' ? 'calorie' : 'water'} goal`}
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
              <Text style={styles.modalInputLabel}>
                {showGoalModal === 'calories' ? 'calories' : 'L'}
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowGoalModal(null);
                  setGoalInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButton]}
                onPress={handleUpdateGoal}
              >
                <Text style={styles.addButtonText}>Update Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calorie Input Modal */}
      <Modal
        visible={showCalorieModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Calories</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowCalorieModal(false);
                  setCalorieInput('');
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                value={calorieInput}
                onChangeText={setCalorieInput}
                placeholder="Enter calories"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
              <Text style={styles.modalInputLabel}>calories</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowCalorieModal(false);
                  setCalorieInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddCalories}
              >
                <Text style={styles.addButtonText}>Add Calories</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Water Input Modal */}
      <Modal
        visible={showCustomWaterModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Water</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowCustomWaterModal(false);
                  setWaterInput('');
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                value={waterInput}
                onChangeText={setWaterInput}
                placeholder="Enter amount"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
              <Text style={styles.modalInputLabel}>ml</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowCustomWaterModal(false);
                  setWaterInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddCustomWater}
              >
                <Text style={styles.addButtonText}>Add Water</Text>
              </TouchableOpacity>
            </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: '#666',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  trackerCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#222',
  },
  trackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  trackerProgress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ffff',
    borderRadius: 3,
  },
  trackerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
  },
  addButton: {
    backgroundColor: '#00ffff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickAddContainer: {
    marginTop: 10,
  },
  quickAddLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAddButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickAddButtonText: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  wellnessCard: {
    backgroundColor: 'rgba(255, 182, 193, 0.03)',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 193, 0.1)',
  },
  wellnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  wellnessText: {
    marginLeft: 15,
  },
  wellnessTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  wellnessSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  wellnessDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  wellnessButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  wellnessButton: {
    backgroundColor: '#222',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  wellnessButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  statsGrid: {
    padding: 20,
    paddingTop: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 120,
    justifyContent: 'center',
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
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalInput: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    paddingVertical: 15,
  },
  modalInputLabel: {
    color: '#666',
    fontSize: 18,
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quoteCard: {
    backgroundColor: 'rgba(0, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.1)',
  },
  quoteText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#666',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  streakContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  streakInfo: {
    marginLeft: 15,
  },
  streakLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  streakValue: {
    fontSize: 24,
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginTop: 4,
  },
  streakDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  activityStatus: {
    marginTop: 15,
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityText: {
    color: '#666',
    fontSize: 16,
  },
  activityCompleted: {
    color: '#00ffff',
  },
});

export default HomeScreen; 