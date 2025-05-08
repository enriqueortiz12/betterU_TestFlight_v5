"use client";

import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';
import { supabase } from '../lib/supabase';

const ActiveMentalSession = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { incrementStat } = useTracking();
  const params = useLocalSearchParams();
  const [timeLeft, setTimeLeft] = useState(params.duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  const session = {
    id: params.id,
    title: params.title,
    duration: parseInt(params.duration),
    description: params.description,
    steps: JSON.parse(params.steps),
    type: params.type
  };

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          const newTime = time - 1;
          // Update progress animation
          Animated.timing(progressAnimation, {
            toValue: 1 - (newTime / (session.duration * 60)),
            duration: 1000,
            useNativeDriver: true
          }).start();
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Rotate through steps
  useEffect(() => {
    if (isActive) {
      const stepInterval = setInterval(() => {
        // Fade out current step
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start(() => {
          // Update step index
          setCurrentStepIndex(current => (current + 1) % session.steps.length);
          // Fade in new step
          Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }).start();
        });
      }, 4000);
      return () => clearInterval(stepInterval);
    }
  }, [isActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Save session to Supabase (new table)
  const handleSessionComplete = async () => {
    try {
      if (!user) return;
      setIsActive(false);
      const { error } = await supabase
        .from('mental_session_logs')
        .insert({
          user_id: user.id,
          session_type: session.id,
          type: session.type,
          duration: session.duration,
          completed_at: new Date().toISOString(),
        });
      if (error) throw error;
      await incrementStat('mentalSessions');
      Alert.alert(
        'Session Complete',
        'Great job completing your mental wellness session!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session');
    }
  };

  // Save and go to summary
  const handleFinishSession = async () => {
    try {
      if (!user) return;
      setIsActive(false);
      const { error } = await supabase
        .from('mental_session_logs')
        .insert({
          user_id: user.id,
          session_type: session.id,
          type: session.type,
          duration: session.duration,
          completed_at: new Date().toISOString(),
        });
      if (error) throw error;
      await incrementStat('mentalSessions');
      router.push({
        pathname: '/mental-session-summary',
        params: {
          sessionType: session.type,
          duration: session.duration,
        },
      });
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            if (isActive) {
              Alert.alert(
                'End Session',
                'Are you sure you want to end this session early?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'End Session', style: 'destructive', onPress: () => router.back() }
                ]
              );
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{session.title}</Text>
      </View>

      {/* Timer Circle */}
      <View style={styles.timerContainer}>
        <View style={styles.timerCircle}>
          <Animated.View 
            style={[
              styles.progressCircle,
              {
                transform: [{
                  rotateZ: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }
            ]}
          />
          <View style={styles.timerContent}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <TouchableOpacity
              style={[styles.timerButton, isActive && styles.timerButtonActive]}
              onPress={() => setIsActive(!isActive)}
            >
              <Ionicons 
                name={isActive ? "pause" : "play"} 
                size={30} 
                color={isActive ? "#000" : "#00ffff"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Current Step */}
      <Animated.View 
        style={[
          styles.stepContainer, 
          { 
            opacity: fadeAnimation,
            transform: [{
              translateY: fadeAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}
      >
        <Text style={styles.stepNumber}>Step {currentStepIndex + 1}/{session.steps.length}</Text>
        <Text style={styles.stepText}>{session.steps[currentStepIndex]}</Text>
      </Animated.View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>{session.description}</Text>
      </View>

      {/* Finish Button (always visible) */}
      <TouchableOpacity
        style={[styles.finishButton, { marginTop: 30 }]}
        onPress={handleFinishSession}
      >
        <Text style={styles.finishButtonText}>Finish Session</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  timerCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  progressCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 5,
    borderColor: '#00ffff',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
    transform: [{ rotate: '-90deg' }],
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  timerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  timerButtonActive: {
    backgroundColor: '#00ffff',
  },
  stepContainer: {
    padding: 25,
    marginTop: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  stepNumber: {
    fontSize: 18,
    color: '#00ffff',
    marginBottom: 12,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '500',
  },
  descriptionContainer: {
    padding: 25,
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  descriptionText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  finishButton: {
    backgroundColor: '#00ffff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default ActiveMentalSession; 