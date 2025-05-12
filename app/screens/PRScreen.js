import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Dimensions, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { useUnits } from '../../context/UnitsContext';
import { useTracking } from '../../context/TrackingContext';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { formatNumber, formatWeight, formatPercentage } from '../../utils/formatUtils';

const { width } = Dimensions.get('window');
const chartWidth = width * 0.8;

const PRScreen = () => {
  const { userProfile } = useUser();
  const { getWeightUnit, convertWeight, convertWeightBack } = useUnits();
  const { stats } = useTracking();
  const [prGoals, setPRGoals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  const [newPR, setNewPR] = useState({
    exercise: '',
    currentValue: '',
    targetValue: '',
    unit: getWeightUnit()
  });
  const [userId, setUserId] = useState(null);
  const [editingPR, setEditingPR] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const insets = useSafeAreaInsets();

  const progressAnimation = useSharedValue(0);

  // Conversion functions
  const kgToLbs = (kg) => kg * 2.20462;
  const lbsToKg = (lbs) => lbs / 2.20462;

  useEffect(() => {
    // Get the authenticated user's ID
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return;
      }
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    setNewPR(prev => ({
      ...prev,
      unit: getWeightUnit()
    }));
  }, [getWeightUnit]);

  const fetchPRGoals = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;

      const convertedData = data?.map(pr => ({
        id: pr.id,
        exercise: pr.exercise_name,
        current_value: parseFloat(pr.weight_current),
        target_value: parseFloat(pr.weight_target),
        unit: getWeightUnit(),
        created_at: pr.created_at
      })) || [];

      setPRGoals(convertedData);
    } catch (error) {
      console.error('Error fetching PR goals:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPRGoals();
    }
  }, [userId, userProfile]);

  const { incrementStat } = useTracking();

  const savePRGoal = async () => {
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    try {
      let currentValueInKg = parseFloat(newPR.currentValue);
      let targetValueInKg = parseFloat(newPR.targetValue);

      if (getWeightUnit() === 'lbs') {
        currentValueInKg = lbsToKg(currentValueInKg);
        targetValueInKg = lbsToKg(targetValueInKg);
      }

      const { data, error } = await supabase
        .from('personal_records')
        .insert([{
          user_id: userId,
          exercise_name: newPR.exercise,
          weight_current: currentValueInKg,
          weight_target: targetValueInKg,
          weight_unit: 'kg',
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setModalVisible(false);
      setNewPR({ 
        exercise: '', 
        currentValue: '', 
        targetValue: '', 
        unit: getWeightUnit() 
      });
      fetchPRGoals();
      
      // Increment PRs count
      incrementStat('prs_this_month');
    } catch (error) {
      console.error('Error saving PR goal:', error);
    }
  };

  const calculateProgress = (current, target) => {
    return Math.round((current / target) * 100);
  };

  const calculateETA = (current, target) => {
    if (!current || !target) return '~1 month';
    if (current >= target) return 'Target reached!';
    
    // Calculate monthly progress rate based on weight difference
    const difference = target - current;
    const percentDifference = (difference / current) * 100;
    
    // Adjust rate based on percentage difference
    // Smaller gaps = faster progress, larger gaps = slower progress
    let monthlyRate;
    if (percentDifference <= 5) monthlyRate = 0.05; // 5% per month for small gains
    else if (percentDifference <= 10) monthlyRate = 0.04; // 4% per month for moderate gains
    else if (percentDifference <= 20) monthlyRate = 0.03; // 3% per month for larger gains
    else monthlyRate = 0.02; // 2% per month for very large gains
    
    const monthsNeeded = Math.ceil(Math.log(target / current) / Math.log(1 + monthlyRate));
    
    if (monthsNeeded <= 1) return '~1 month';
    if (monthsNeeded <= 12) return `~${monthsNeeded} months`;
    return '1+ year';
  };

  const deletePR = async (prId) => {
    try {
      const { error } = await supabase
        .from('personal_records')
        .delete()
        .eq('id', prId);

      if (error) throw error;
      fetchPRGoals();
    } catch (error) {
      console.error('Error deleting PR:', error);
    }
  };

  const handleDeletePress = (pr) => {
    Alert.alert(
      'Delete PR Goal',
      `Are you sure you want to delete your ${pr.exercise} PR goal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deletePR(pr.id)
        }
      ]
    );
  };

  const startEditing = (pr) => {
    setEditingPR(pr);
    setIsEditMode(true);
    setNewPR({
      exercise: pr.exercise,
      currentValue: pr.current_value.toString(),
      targetValue: pr.target_value.toString(),
      unit: getWeightUnit()
    });
    setModalVisible(true);
  };

  const updatePR = async () => {
    if (!userId || !editingPR) return;

    try {
      let currentValueInKg = parseFloat(newPR.currentValue);
      let targetValueInKg = parseFloat(newPR.targetValue);

      if (getWeightUnit() === 'lbs') {
        currentValueInKg = lbsToKg(currentValueInKg);
        targetValueInKg = lbsToKg(targetValueInKg);
      }

      const { error } = await supabase
        .from('personal_records')
        .update({
          exercise_name: newPR.exercise,
          weight_current: currentValueInKg,
          weight_target: targetValueInKg,
          weight_unit: 'kg',
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPR.id);

      if (error) throw error;
      
      setModalVisible(false);
      setNewPR({ 
        exercise: '', 
        currentValue: '', 
        targetValue: '', 
        unit: getWeightUnit() 
      });
      setIsEditMode(false);
      setEditingPR(null);
      fetchPRGoals();
    } catch (error) {
      console.error('Error updating PR:', error);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setIsEditMode(false);
    setEditingPR(null);
    setNewPR({
      exercise: '',
      currentValue: '',
      targetValue: '',
      unit: getWeightUnit()
    });
  };

  const getChartData = (current, target) => {
    if (!current || !target) return null;

    // Calculate realistic progression based on strength training principles
    const calculateNextWeight = (currentWeight, targetWeight, progress) => {
      const remainingProgress = targetWeight - currentWeight;
      const progressFactor = Math.log10(progress + 1) / Math.log10(10);
      return currentWeight + (remainingProgress * progressFactor);
    };

    // Generate data points
    const labels = ['Start', 'Now', '+1m', '+2m', 'Target'];
    const data = [];

    // Start value (85% of current)
    data.push(Math.round(current * 0.85 * 10) / 10);
    
    // Current value
    data.push(current);
    
    // Future projections
    let projectedValue = current;
    for (let i = 1; i <= 2; i++) {
      projectedValue = calculateNextWeight(current, target, i / 2);
      data.push(Math.min(target, Math.round(projectedValue * 10) / 10));
    }
    
    // Target value
    data.push(target);

    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(0, 255, 255, ${opacity})`,
        strokeWidth: 3
      }],
      legend: ['Progress']
    };
  };

  const handleViewProgress = (pr) => {
    if (!pr) {
      console.error('No PR data provided to handleViewProgress');
      return;
    }
    
    console.log('Opening progress modal for PR:', pr);
    
    setSelectedPR({
      ...pr,
      current_value: parseFloat(pr.current_value),
      target_value: parseFloat(pr.target_value),
      unit: pr.unit || getWeightUnit()
    });
    setProgressModalVisible(true);
  };

  useEffect(() => {
    if (selectedPR) {
      progressAnimation.value = withSpring(
        calculateProgress(selectedPR.current_value, selectedPR.target_value) / 100,
        { damping: 15 }
      );
    }
  }, [selectedPR]);

  const progressCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: progressAnimation.value }],
    };
  });

  const renderProgressModal = () => {
    if (!selectedPR) return null;

    // Convert weights to the current unit
    const currentValue = getWeightUnit() === 'lbs' ? kgToLbs(selectedPR.current_value) : selectedPR.current_value;
    const targetValue = getWeightUnit() === 'lbs' ? kgToLbs(selectedPR.target_value) : selectedPR.target_value;
    const progress = calculateProgress(currentValue, targetValue);

    return (
      <Modal
        visible={progressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProgressModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.progressModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Progress Details</Text>
              <TouchableOpacity onPress={() => setProgressModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.progressContent}>
                <Text style={styles.exerciseTitle}>{selectedPR.exercise}</Text>
                
                <View style={styles.progressCircleContainer}>
                  <View style={styles.progressCircle}>
                    <LinearGradient
                      colors={['#00ffff', '#0088ff']}
                      style={styles.progressCircleGradient}
                    >
                      <Text style={styles.progressCircleText}>{progress}%</Text>
                    </LinearGradient>
                  </View>
                </View>

                <View style={styles.progressStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Current</Text>
                    <Text style={styles.statValue}>{formatWeight(currentValue, getWeightUnit())}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Target</Text>
                    <Text style={styles.statValue}>{formatWeight(targetValue, getWeightUnit())}</Text>
                  </View>
                </View>

                <View style={styles.chartSection}>
                  <Text style={styles.sectionTitle}>Progress Overview</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <LinearGradient
                        colors={['#00ffff', '#0088ff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${progress}%` }]}
                      />
                    </View>
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>Start</Text>
                    <Text style={styles.progressLabel}>Target</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderPRCard = (pr) => {
    // Convert weights to the current unit
    const currentValue = getWeightUnit() === 'lbs' ? kgToLbs(pr.current_value) : pr.current_value;
    const targetValue = getWeightUnit() === 'lbs' ? kgToLbs(pr.target_value) : pr.target_value;

    return (
      <View key={pr.id} style={styles.prCard}>
        <LinearGradient
          colors={['#111', '#000']}
          style={styles.prCardGradient}
        >
          <View style={styles.prContent}>
            <View style={styles.prHeader}>
              <Text style={styles.prExercise}>{pr.exercise}</Text>
              <View style={styles.prActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => startEditing(pr)}
                >
                  <Ionicons name="pencil" size={20} color="#00ffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeletePress(pr)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.prStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Current</Text>
                <Text style={styles.statValue}>
                  {formatWeight(currentValue, getWeightUnit())}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Target</Text>
                <Text style={styles.statValue}>
                  {formatWeight(targetValue, getWeightUnit())}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Progress</Text>
                <Text style={styles.statValue}>
                  {formatPercentage(calculateProgress(currentValue, targetValue))}
                </Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={['#00ffff', '#0088ff']}
                style={[
                  styles.progressFill,
                  { 
                    width: `${calculateProgress(currentValue, targetValue)}%`
                  }
                ]}
              />
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.estimatedTime}>
                Est. completion: {calculateETA(currentValue, targetValue)}
              </Text>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => handleViewProgress({
                  ...pr,
                  current_value: currentValue,
                  target_value: targetValue
                })}
              >
                <Text style={styles.detailsButtonText}>Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#00ffff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <LinearGradient
        colors={['#000', '#111', '#000']}
        style={styles.gradient}
      >
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#111', '#000']}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <Text style={styles.title}>Personal Records</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setIsEditMode(false);
                    setEditingPR(null);
                    setNewPR({
                      exercise: '',
                      currentValue: '',
                      targetValue: '',
                      unit: getWeightUnit()
                    });
                    setModalVisible(true);
                  }}
                  style={styles.addButton}
                >
                  <LinearGradient
                    colors={['#00ffff', '#0088ff']}
                    style={styles.addButtonGradient}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={prGoals.length === 0 ? styles.emptyStateContainer : styles.prList}
            showsVerticalScrollIndicator={false}
          >
            {prGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="fitness" size={48} color="#00ffff" />
                <Text style={styles.emptyStateText}>No PRs yet</Text>
                <Text style={styles.emptyStateSubtext}>Add your first PR to start tracking your progress</Text>
              </View>
            ) : (
              prGoals.map(renderPRCard)
            )}
          </ScrollView>

          {renderProgressModal()}

          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleModalClose}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <BlurView intensity={80} style={styles.modalBlur}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {isEditMode ? 'Edit PR Goal' : 'Add PR Goal'}
                    </Text>
                    <TouchableOpacity onPress={handleModalClose}>
                      <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView 
                    style={styles.modalScroll}
                    contentContainerStyle={styles.modalScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Exercise Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., Bench Press"
                        placeholderTextColor="#666"
                        value={newPR.exercise}
                        onChangeText={(text) => setNewPR({ ...newPR, exercise: text })}
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Current Value ({getWeightUnit()})</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={`Your current ${getWeightUnit()}`}
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={newPR.currentValue}
                        onChangeText={(text) => setNewPR({ ...newPR, currentValue: text })}
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Target Value ({getWeightUnit()})</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={`Your target ${getWeightUnit()}`}
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={newPR.targetValue}
                        onChangeText={(text) => setNewPR({ ...newPR, targetValue: text })}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={isEditMode ? updatePR : savePRGoal}
                    >
                      <LinearGradient
                        colors={['#00ffff', '#0088ff']}
                        style={styles.saveButtonGradient}
                      >
                        <Text style={styles.saveButtonText}>
                          {isEditMode ? 'Update Goal' : 'Save Goal'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </BlurView>
            </KeyboardAvoidingView>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerGradient: {
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  prList: {
    padding: 15,
    gap: 15,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  prCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  prCardGradient: {
    padding: 1,
    borderRadius: 15,
  },
  prContent: {
    backgroundColor: '#111',
    borderRadius: 15,
    padding: 15,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  prExercise: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  prActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#222',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 15,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  estimatedTime: {
    color: '#666',
    fontSize: 14,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  detailsButtonText: {
    color: '#00ffff',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalScroll: {
    width: '100%',
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 20,
  },
  saveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressModalContent: {
    backgroundColor: '#111',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  progressContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  progressCircleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleText: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  chartSection: {
    marginTop: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  progressBarBackground: {
    width: '100%',
    height: 20,
    backgroundColor: '#222',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  progressLabel: {
    color: '#666',
    fontSize: 14,
  },
});

export default PRScreen; 