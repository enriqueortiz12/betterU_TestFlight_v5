import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

const trainingLevels = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'New to fitness or returning after a long break',
    icon: 'fitness-outline'
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Regular exercise experience, looking to improve',
    icon: 'barbell-outline'
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Experienced with consistent training history',
    icon: 'trophy-outline'
  }
];

export default function TrainingLevelScreen() {
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNext = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        router.replace('/(auth)/login');
        return;
      }

      console.log('Saving training level...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          training_level: selectedLevel
        })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Error saving training level:', updateError);
        setError('Failed to save training level. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('Training level saved successfully, navigating to age-weight...');
      // Use a direct navigation approach
      router.push('/(auth)/onboarding/age-weight');
    } catch (error) {
      console.error('Error in handleNext:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>What's your training experience?</Text>
          <Text style={styles.subtitle}>This helps us personalize your workout plan</Text>

          <View style={styles.optionsContainer}>
            {trainingLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.option,
                  selectedLevel === level.id && styles.selectedOption
                ]}
                onPress={() => setSelectedLevel(level.id)}
              >
                <View style={styles.optionContent}>
                  <Ionicons 
                    name={level.icon} 
                    size={32} 
                    color={selectedLevel === level.id ? '#000' : '#00ffff'} 
                  />
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionTitle,
                      selectedLevel === level.id && styles.selectedText
                    ]}>
                      {level.title}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      selectedLevel === level.id && styles.selectedText
                    ]}>
                      {level.description}
                    </Text>
                  </View>
                </View>
                {selectedLevel === level.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Saving...' : 'Continue'}</Text>
            {!isLoading && <Ionicons name="arrow-forward" size={20} color="#000" style={styles.buttonIcon} />}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#B3B3B3',
    marginBottom: 40,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 15,
    marginBottom: 30,
  },
  option: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedOption: {
    backgroundColor: '#00ffff',
    borderColor: '#00ffff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    color: '#B3B3B3',
  },
  selectedText: {
    color: '#000000',
  },
  error: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00ffff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
}); 