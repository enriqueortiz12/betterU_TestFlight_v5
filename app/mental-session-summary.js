"use client";

import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const MentalSessionSummary = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const sessionType = params.sessionType;
  const duration = params.duration;
  const [calmnessLevel, setCalmnessLevel] = useState(3);
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('mental_session_logs')
        .insert([
          {
            user_id: user.id,
            type: sessionType,
            duration: duration,
            calmness_level: calmnessLevel,
            notes: notes,
            completed_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;
      router.push('/mental');
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Summary</Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.sessionType}>
          {sessionType === 'meditation' ? 'Meditation' : 'Breathing Exercise'}
        </Text>
        <Text style={styles.duration}>Duration: {duration} minutes</Text>
        
        <View style={styles.calmnessSection}>
          <Text style={styles.calmnessLabel}>How calm do you feel?</Text>
          <View style={styles.calmnessButtons}>
            {[1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.calmnessButton,
                  calmnessLevel === level && styles.selectedCalmnessButton,
                ]}
                onPress={() => setCalmnessLevel(level)}
              >
                <Text style={[
                  styles.calmnessButtonText,
                  calmnessLevel === level && styles.selectedCalmnessButtonText,
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did you feel during the session?"
            placeholderTextColor="#666"
            multiline
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Session</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sessionType: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  duration: {
    color: '#00ffff',
    fontSize: 16,
    marginBottom: 20,
  },
  calmnessSection: {
    marginBottom: 20,
  },
  calmnessLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  calmnessButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calmnessButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCalmnessButton: {
    backgroundColor: '#00ffff',
  },
  calmnessButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedCalmnessButtonText: {
    color: '#000',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#00ffff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MentalSessionSummary; 