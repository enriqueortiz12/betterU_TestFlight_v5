import { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const GOALS = [
  { 
    id: 'athleticism', 
    label: 'Athleticism',
    description: 'Improve overall athletic performance, agility, and coordination'
  },
  { 
    id: 'strength', 
    label: 'Strength',
    description: 'Build raw power and increase maximum lifting capacity'
  },
  { 
    id: 'muscle_growth', 
    label: 'Muscle Growth',
    description: 'Increase muscle size and definition through hypertrophy training'
  },
  { 
    id: 'wellness', 
    label: 'Wellness',
    description: 'Focus on overall health, mobility, and sustainable fitness'
  },
];

const GENDERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

export default function GoalGenderScreen() {
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleNext = async () => {
    if (!selectedGoal || !selectedGender) {
      setError('Please select both your goal and gender');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        router.replace('/(auth)/login');
        return;
      }

      const { error: storageError } = await supabase
        .from('onboarding_data')
        .update({
          fitness_goal: selectedGoal,
          gender: selectedGender,
        })
        .eq('id', session.user.id);

      if (storageError) {
        setError('Failed to save data. Please try again.');
        return;
      }

      router.push('/(auth)/onboarding/height');
    } catch (error) {
      console.error('Error in handleNext:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>Fitness Goals & Gender</Text>
            <Text style={styles.subtitle}>This helps us tailor your workout experience</Text>

            <View style={styles.section}>
              <View style={styles.optionsContainer}>
                {GOALS.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.option,
                      selectedGoal === goal.id && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedGoal(goal.id)}
                  >
                    <Ionicons 
                      name={selectedGoal === goal.id ? "checkmark-circle" : "ellipse-outline"} 
                      size={24} 
                      color={selectedGoal === goal.id ? "#00ffff" : "#666"} 
                      style={styles.optionIcon}
                    />
                    <View style={styles.optionContent}>
                      <Text style={[
                        styles.optionText,
                        selectedGoal === goal.id && styles.selectedOptionText,
                      ]}>
                        {goal.label}
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        selectedGoal === goal.id && styles.selectedOptionDescription,
                      ]}>
                        {goal.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.optionsContainer}>
                {GENDERS.map((gender) => (
                  <TouchableOpacity
                    key={gender.id}
                    style={[
                      styles.option,
                      selectedGender === gender.id && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedGender(gender.id)}
                  >
                    <Ionicons 
                      name={selectedGender === gender.id ? "checkmark-circle" : "ellipse-outline"} 
                      size={24} 
                      color={selectedGender === gender.id ? "#00ffff" : "#666"} 
                      style={styles.optionIcon}
                    />
                    <Text style={[
                      styles.optionText,
                      selectedGender === gender.id && styles.selectedOptionText,
                    ]}>
                      {gender.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(0, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.1)',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  section: {
    marginBottom: 25,
  },
  optionsContainer: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderColor: '#00ffff',
  },
  optionIcon: {
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedOptionText: {
    color: '#00ffff',
  },
  optionDescription: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  selectedOptionDescription: {
    color: '#00ffff',
  },
  error: {
    color: '#ff4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#00ffff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
}); 