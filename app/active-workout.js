import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useTracking } from '../context/TrackingContext';
import { useAuth } from '../context/AuthContext';

const workoutData = {
  'Full Body Workout': {
    name: 'Full Body Workout',
    exercises: [
      {
        name: 'Squats',
        targetMuscles: 'Quads, Glutes, Core',
        instructions: [
          'Stand with feet shoulder-width apart, toes slightly turned out',
          'Keep chest up and core tight as you lower down',
          'Push through heels to return to starting position',
          'Keep knees in line with toes throughout movement'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Bench Press',
        targetMuscles: 'Chest, Shoulders, Triceps',
        instructions: [
          'Lie flat on bench with feet planted on ground',
          'Grip bar slightly wider than shoulder width',
          'Lower bar to mid-chest with control',
          'Press bar up to starting position'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Deadlifts',
        targetMuscles: 'Back, Hamstrings, Core',
        instructions: [
          'Stand with feet hip-width apart, bar over mid-foot',
          'Bend at hips and knees to grip bar',
          'Keep back straight as you lift bar by extending hips',
          'Lower bar with control, maintaining form'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Pull-ups',
        targetMuscles: 'Back, Biceps',
        instructions: [
          'Grip bar slightly wider than shoulder width',
          'Hang with arms fully extended',
          'Pull body up until chin clears bar',
          'Lower with control to starting position'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Shoulder Press',
        targetMuscles: 'Shoulders, Triceps',
        instructions: [
          'Hold weights at shoulder height',
          'Press weights overhead until arms are straight',
          'Lower weights with control to starting position',
          'Keep core tight throughout movement'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
    ],
  },
  'Push Day': {
    name: 'Push Day',
    exercises: [
      {
        name: 'Bench Press',
        targetMuscles: 'Chest, Shoulders, Triceps',
        instructions: [
          'Lie flat on bench with feet planted on ground',
          'Grip bar slightly wider than shoulder width',
          'Lower bar to mid-chest with control',
          'Press bar up to starting position'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Overhead Press',
        targetMuscles: 'Shoulders, Triceps',
        instructions: [
          'Hold weights at shoulder height',
          'Press weights overhead until arms are straight',
          'Lower weights with control to starting position',
          'Keep core tight throughout movement'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Incline Dumbbell Press',
        targetMuscles: 'Upper Chest, Shoulders',
        instructions: [
          'Set bench to 30-45 degree angle',
          'Hold dumbbells at shoulder level',
          'Press dumbbells up and together',
          'Lower with control to starting position'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Lateral Raises',
        targetMuscles: 'Shoulders',
        instructions: [
          'Stand with dumbbells at sides',
          'Raise arms to shoulder height',
          'Keep slight bend in elbows',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
        ],
      },
      {
        name: 'Tricep Pushdowns',
        targetMuscles: 'Triceps',
        instructions: [
          'Stand facing cable machine',
          'Keep elbows at sides',
          'Push bar down until arms are straight',
          'Return to starting position with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
        ],
      },
    ],
  },
  'Pull Day': {
    name: 'Pull Day',
    exercises: [
      {
        name: 'Deadlifts',
        targetMuscles: 'Back, Hamstrings, Core',
        instructions: [
          'Stand with feet hip-width apart, bar over mid-foot',
          'Bend at hips and knees to grip bar',
          'Keep back straight as you lift bar by extending hips',
          'Lower bar with control, maintaining form'
        ],
        sets: [
          { weight: '', reps: '6-8', completed: false },
          { weight: '', reps: '6-8', completed: false },
          { weight: '', reps: '6-8', completed: false },
        ],
      },
      {
        name: 'Pull-ups',
        targetMuscles: 'Back, Biceps',
        instructions: [
          'Grip bar slightly wider than shoulder width',
          'Hang with arms fully extended',
          'Pull body up until chin clears bar',
          'Lower with control to starting position'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Barbell Rows',
        targetMuscles: 'Back, Lats, Rear Delts, Biceps',
        instructions: [
          'Stand with feet hip-width apart, grip barbell with overhand grip',
          'Hinge at hips, keep back straight and chest up',
          'Pull barbell to lower chest, squeezing shoulder blades',
          'Lower bar with control, keeping core tight',
          'Repeat for reps'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Face Pulls',
        targetMuscles: 'Rear Delts, Upper Back',
        instructions: [
          'Set cable at face height',
          'Pull rope towards face',
          'Squeeze shoulder blades together',
          'Return with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
        ],
      },
      {
        name: 'Bicep Curls',
        targetMuscles: 'Biceps',
        instructions: [
          'Stand with dumbbells at sides',
          'Curl weights up to shoulders',
          'Keep elbows at sides',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
        ],
      },
    ],
  },
  'Leg Day': {
    name: 'Leg Day',
    exercises: [
      {
        name: 'Squats',
        targetMuscles: 'Quads, Glutes, Core',
        instructions: [
          'Stand with feet shoulder-width apart, toes slightly turned out',
          'Keep chest up and core tight as you lower down',
          'Push through heels to return to starting position',
          'Keep knees in line with toes throughout movement'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Romanian Deadlifts',
        targetMuscles: 'Hamstrings, Glutes',
        instructions: [
          'Stand with feet hip-width apart',
          'Hinge at hips, keeping back straight',
          'Lower bar along legs',
          'Return to standing by extending hips'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Leg Press',
        targetMuscles: 'Quads, Hamstrings, Glutes',
        instructions: [
          'Place feet shoulder-width apart on platform',
          'Lower weight with control',
          'Push through heels to extend legs',
          'Keep back flat against pad'
        ],
        sets: [
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
        ],
      },
      {
        name: 'Leg Curls',
        targetMuscles: 'Hamstrings',
        instructions: [
          'Lie face down on machine',
          'Curl legs up to glutes',
          'Squeeze hamstrings at top',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
        ],
      },
      {
        name: 'Calf Raises',
        targetMuscles: 'Calves',
        instructions: [
          'Stand on edge of step or platform',
          'Raise heels as high as possible',
          'Lower heels below step level',
          'Repeat with control'
        ],
        sets: [
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
        ],
      },
    ],
  },
  'Upper Body 1': {
    name: 'Upper Body 1',
    exercises: [
      {
        name: 'Bench Press',
        targetMuscles: 'Chest, Shoulders, Triceps',
        instructions: [
          'Lie flat on bench with feet planted on ground',
          'Grip bar slightly wider than shoulder width',
          'Lower bar to mid-chest with control',
          'Press bar up to starting position'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Military Press',
        targetMuscles: 'Shoulders, Triceps',
        instructions: [
          'Stand with feet shoulder-width apart',
          'Hold barbell at shoulder height',
          'Press bar overhead until arms are straight',
          'Lower with control to starting position'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Incline Dumbbell Press',
        targetMuscles: 'Upper Chest, Shoulders',
        instructions: [
          'Set bench to 30-45 degree angle',
          'Hold dumbbells at shoulder level',
          'Press dumbbells up and together',
          'Lower with control to starting position'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Lateral Raises',
        targetMuscles: 'Shoulders',
        instructions: [
          'Stand with dumbbells at sides',
          'Raise arms to shoulder height',
          'Keep slight bend in elbows',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
        ],
      },
      {
        name: 'Tricep Pushdowns',
        targetMuscles: 'Triceps',
        instructions: [
          'Stand facing cable machine',
          'Keep elbows at sides',
          'Push bar down until arms are straight',
          'Return to starting position with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
        ],
      },
    ],
  },
  'Lower Body 1': {
    name: 'Lower Body 1',
    exercises: [
      {
        name: 'Back Squats',
        targetMuscles: 'Quads, Glutes, Core',
        instructions: [
          'Stand with feet shoulder-width apart',
          'Bar across upper back',
          'Keep chest up as you squat down',
          'Drive through heels to stand'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Leg Press',
        targetMuscles: 'Quads, Hamstrings, Glutes',
        instructions: [
          'Place feet shoulder-width on platform',
          'Lower weight with control',
          'Push through heels to extend legs',
          'Keep back flat against pad'
        ],
        sets: [
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
        ],
      },
      {
        name: 'Bulgarian Split Squats',
        targetMuscles: 'Quads, Glutes, Balance',
        instructions: [
          'Back foot elevated on bench',
          'Front foot forward',
          'Lower until back knee nearly touches ground',
          'Push through front heel to stand'
        ],
        sets: [
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
        ],
      },
      {
        name: 'Leg Extensions',
        targetMuscles: 'Quads',
        instructions: [
          'Sit in machine with back against pad',
          'Hook feet under pad',
          'Extend legs fully',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
        ],
      },
      {
        name: 'Calf Raises',
        targetMuscles: 'Calves',
        instructions: [
          'Stand on edge of step',
          'Lower heels below platform',
          'Rise up onto toes',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
        ],
      },
    ],
  },
  'Upper Body 2': {
    name: 'Upper Body 2',
    exercises: [
      {
        name: 'Deadlifts',
        targetMuscles: 'Back, Hamstrings, Core',
        instructions: [
          'Stand with feet hip-width apart',
          'Bend at hips and knees to grip bar',
          'Keep back straight as you lift',
          'Lower bar with control'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Pull-ups',
        targetMuscles: 'Back, Biceps',
        instructions: [
          'Grip bar slightly wider than shoulders',
          'Hang with arms extended',
          'Pull up until chin over bar',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Barbell Rows',
        targetMuscles: 'Back, Lats, Rear Delts, Biceps',
        instructions: [
          'Stand with feet hip-width apart, grip barbell with overhand grip',
          'Hinge at hips, keep back straight and chest up',
          'Pull barbell to lower chest, squeezing shoulder blades',
          'Lower bar with control, keeping core tight',
          'Repeat for reps'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Face Pulls',
        targetMuscles: 'Rear Delts, Upper Back',
        instructions: [
          'Set cable at face height',
          'Pull rope to face, elbows high',
          'Squeeze shoulder blades',
          'Return with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
        ],
      },
      {
        name: 'Bicep Curls',
        targetMuscles: 'Biceps',
        instructions: [
          'Stand with dumbbells at sides',
          'Curl weights to shoulders',
          'Keep elbows at sides',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
        ],
      },
    ],
  },
  'Lower Body 2': {
    name: 'Lower Body 2',
    exercises: [
      {
        name: 'Romanian Deadlifts',
        targetMuscles: 'Hamstrings, Lower Back',
        instructions: [
          'Stand with feet hip-width',
          'Soft bend in knees',
          'Hinge at hips, bar close to legs',
          'Feel stretch in hamstrings'
        ],
        sets: [
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
          { weight: '', reps: '8-12', completed: false },
        ],
      },
      {
        name: 'Hip Thrusts',
        targetMuscles: 'Glutes, Hamstrings',
        instructions: [
          'Upper back on bench',
          'Bar across hips',
          'Drive hips up to full extension',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
        ],
      },
      {
        name: 'Leg Curls',
        targetMuscles: 'Hamstrings',
        instructions: [
          'Lie face down on machine',
          'Hook ankles under pad',
          'Curl legs toward glutes',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
        ],
      },
      {
        name: 'Glute Bridges',
        targetMuscles: 'Glutes, Lower Back',
        instructions: [
          'Lie on back, knees bent',
          'Feet flat on ground',
          'Drive hips up to ceiling',
          'Squeeze glutes at top'
        ],
        sets: [
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
        ],
      },
      {
        name: 'Calf Raises',
        targetMuscles: 'Calves',
        instructions: [
          'Stand on edge of step',
          'Lower heels below platform',
          'Rise up onto toes',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
        ],
      },
    ],
  },
  'Strength Day 1': {
    name: 'Strength Day 1',
    exercises: [
      {
        name: 'Squats',
        targetMuscles: 'Quads, Glutes, Core',
        instructions: [
          'Bar across upper back',
          'Feet shoulder-width apart',
          'Break at hips and knees',
          'Drive through heels'
        ],
        sets: [
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
        ],
      },
      {
        name: 'Bench Press',
        targetMuscles: 'Chest, Shoulders, Triceps',
        instructions: [
          'Arch back slightly',
          'Grip bar just outside shoulders',
          'Lower to mid-chest',
          'Press with explosive power'
        ],
        sets: [
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
        ],
      },
      {
        name: 'Overhead Press',
        targetMuscles: 'Shoulders, Triceps',
        instructions: [
          'Grip just outside shoulders',
          'Brace core tight',
          'Press bar overhead',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
        ],
      },
      {
        name: 'Barbell Rows',
        targetMuscles: 'Back, Lats, Rear Delts, Biceps',
        instructions: [
          'Stand with feet hip-width apart, grip barbell with overhand grip',
          'Hinge at hips, keep back straight and chest up',
          'Pull barbell to lower chest, squeezing shoulder blades',
          'Lower bar with control, keeping core tight',
          'Repeat for reps'
        ],
        sets: [
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
        ],
      },
      {
        name: 'Weighted Dips',
        targetMuscles: 'Chest, Triceps',
        instructions: [
          'Add weight via belt/vest',
          'Lower until shoulders stretched',
          'Press back to straight arms',
          'Keep core tight'
        ],
        sets: [
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
        ],
      },
    ],
  },
  'Strength Day 2': {
    name: 'Strength Day 2',
    exercises: [
      {
        name: 'Deadlifts',
        targetMuscles: 'Back, Hamstrings, Core',
        instructions: [
          'Bar over mid-foot',
          'Grip just outside legs',
          'Keep back flat',
          'Drive through floor'
        ],
        sets: [
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
        ],
      },
      {
        name: 'Power Cleans',
        targetMuscles: 'Full Body, Explosiveness',
        instructions: [
          'Start like deadlift',
          'Pull explosively',
          'Catch on shoulders',
          'Stand and reset'
        ],
        sets: [
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
        ],
      },
      {
        name: 'Front Squats',
        targetMuscles: 'Quads, Core',
        instructions: [
          'Bar on front shoulders',
          'Elbows high',
          'Keep torso upright',
          'Break at hips and knees'
        ],
        sets: [
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
        ],
      },
      {
        name: 'Pull-ups',
        targetMuscles: 'Back, Biceps',
        instructions: [
          'Wide grip on bar',
          'Pull chest to bar',
          'Lead with elbows',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
          { weight: '', reps: '5', completed: false },
        ],
      },
    ],
  },
  'Strength Day 3': {
    name: 'Strength Day 3',
    exercises: [
      {
        name: 'Incline Press',
        targetMuscles: 'Upper Chest, Shoulders',
        instructions: [
          'Bench at 30-45 degrees',
          'Grip slightly wider than shoulders',
          'Lower to upper chest',
          'Press with power'
        ],
        sets: [
          { weight: '', reps: '4', completed: false },
          { weight: '', reps: '4', completed: false },
          { weight: '', reps: '4', completed: false },
        ],
      },
      {
        name: 'Romanian Deadlifts',
        targetMuscles: 'Hamstrings, Lower Back',
        instructions: [
          'Soft knee bend',
          'Hinge at hips',
          'Bar close to legs',
          'Feel hamstring stretch'
        ],
        sets: [
          { weight: '', reps: '4', completed: false },
          { weight: '', reps: '4', completed: false },
          { weight: '', reps: '4', completed: false },
        ],
      },
      {
        name: 'Military Press',
        targetMuscles: 'Shoulders, Triceps',
        instructions: [
          'Strict form',
          'Press overhead',
          'Bar path straight',
          'Full lockout'
        ],
        sets: [
          { weight: '', reps: '4', completed: false },
          { weight: '', reps: '4', completed: false },
          { weight: '', reps: '4', completed: false },
        ],
      },
      {
        name: 'Weighted Chin-ups',
        targetMuscles: 'Back, Biceps',
        instructions: [
          'Add weight via belt',
          'Underhand grip',
          'Pull to upper chest',
          'Full range of motion'
        ],
        sets: [
          { weight: '', reps: '4', completed: false },
          { weight: '', reps: '4', completed: false },
          { weight: '', reps: '4', completed: false },
        ],
      },
    ],
  },
  'Upper Body Power': {
    name: 'Upper Body Power',
    exercises: [
      {
        name: 'Bench Press',
        targetMuscles: 'Chest, Shoulders, Triceps',
        instructions: [
          'Lie flat on bench with feet planted',
          'Grip bar slightly wider than shoulders',
          'Lower bar to mid-chest with control',
          'Press with explosive power'
        ],
        sets: [
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
        ],
      },
      {
        name: 'Weighted Pull-ups',
        targetMuscles: 'Back, Biceps',
        instructions: [
          'Add weight via belt or vest',
          'Grip bar slightly wider than shoulders',
          'Pull chest to bar with power',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
        ],
      },
      {
        name: 'Military Press',
        targetMuscles: 'Shoulders, Triceps',
        instructions: [
          'Stand with feet shoulder-width apart',
          'Press bar overhead with power',
          'Keep core tight throughout',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
        ],
      },
      {
        name: 'Barbell Rows',
        targetMuscles: 'Back, Lats, Rear Delts, Biceps',
        instructions: [
          'Stand with feet hip-width apart, grip barbell with overhand grip',
          'Hinge at hips, keep back straight and chest up',
          'Pull barbell to lower chest, squeezing shoulder blades',
          'Lower bar with control, keeping core tight',
          'Repeat for reps'
        ],
        sets: [
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
        ],
      },
    ],
  },
  'Lower Body Power': {
    name: 'Lower Body Power',
    exercises: [
      {
        name: 'Back Squats',
        targetMuscles: 'Quads, Glutes',
        instructions: [
          'Bar across upper back',
          'Feet shoulder-width apart',
          'Break at hips and knees',
          'Drive through heels explosively'
        ],
        sets: [
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
        ],
      },
      {
        name: 'Romanian Deadlifts',
        targetMuscles: 'Hamstrings, Lower Back',
        instructions: [
          'Stand with feet hip-width',
          'Hinge at hips with soft knees',
          'Lower bar along legs with power',
          'Drive hips forward explosively'
        ],
        sets: [
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
        ],
      },
      {
        name: 'Front Squats',
        targetMuscles: 'Quads, Core',
        instructions: [
          'Bar racked on front delts',
          'Elbows high, chest up',
          'Break at hips and knees',
          'Stand explosively'
        ],
        sets: [
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
        ],
      },
      {
        name: 'Leg Press',
        targetMuscles: 'Quads, Hamstrings, Glutes',
        instructions: [
          'Feet shoulder-width on platform',
          'Lower weight with control',
          'Drive through heels powerfully',
          'Stop just before lockout'
        ],
        sets: [
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
          { weight: '', reps: '4-6', completed: false },
        ],
      },
    ],
  },
  'HIIT Cardio': {
    name: 'HIIT Cardio',
    exercises: [
      {
        name: 'Burpees',
        targetMuscles: 'Full Body',
        instructions: [
          'Start standing, drop to plank',
          'Perform push-up',
          'Jump feet to hands',
          'Explosive jump with arms overhead'
        ],
        sets: [
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
        ],
      },
      {
        name: 'Mountain Climbers',
        targetMuscles: 'Core, Shoulders',
        instructions: [
          'Start in plank position',
          'Drive knees to chest alternately',
          'Keep hips level',
          'Maintain fast, controlled pace'
        ],
        sets: [
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
        ],
      },
      {
        name: 'Jump Squats',
        targetMuscles: 'Legs, Core',
        instructions: [
          'Start in squat stance',
          'Lower into squat',
          'Jump explosively',
          'Land softly and repeat'
        ],
        sets: [
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
        ],
      },
      {
        name: 'High Knees',
        targetMuscles: 'Core, Legs',
        instructions: [
          'Stand tall, arms at sides',
          'Drive knees up alternately',
          'Touch knees to palms',
          'Maintain quick rhythm'
        ],
        sets: [
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
          { weight: '', reps: '30s', completed: false },
        ],
      },
    ],
  },
  'Core & Abs': {
    name: 'Core & Abs',
    exercises: [
      {
        name: 'Planks',
        targetMuscles: 'Core, Shoulders',
        instructions: [
          'Start in forearm plank position',
          'Keep body in straight line',
          'Engage core and glutes',
          'Breathe steadily throughout'
        ],
        sets: [
          { weight: '', reps: '60s', completed: false },
          { weight: '', reps: '45s', completed: false },
          { weight: '', reps: '30s', completed: false },
        ],
      },
      {
        name: 'Russian Twists',
        targetMuscles: 'Obliques, Core',
        instructions: [
          'Sit with knees bent, feet off ground',
          'Lean back slightly, keeping back straight',
          'Rotate torso side to side',
          'Touch ground on each side'
        ],
        sets: [
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
        ],
      },
      {
        name: 'Leg Raises',
        targetMuscles: 'Lower Abs',
        instructions: [
          'Lie flat on back',
          'Keep legs straight',
          'Raise legs to 90 degrees',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
        ],
      },
      {
        name: 'Cable Crunches',
        targetMuscles: 'Upper Abs',
        instructions: [
          'Kneel facing cable machine',
          'Hold rope behind head',
          'Curl torso down and in',
          'Squeeze abs at bottom'
        ],
        sets: [
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
        ],
      },
    ],
  },
  'Mobility & Recovery': {
    name: 'Mobility & Recovery',
    exercises: [
      {
        name: 'Dynamic Stretching',
        targetMuscles: 'Full Body',
        instructions: [
          'Start with light cardio (jogging, jumping jacks) for 5 minutes',
          'Perform controlled movements through full range of motion',
          'Focus on major muscle groups: legs, hips, shoulders, and back',
          'Hold each stretch for 2-3 seconds, repeat 8-10 times per movement',
          'Keep movements smooth and controlled, avoid bouncing'
        ],
        sets: [
          { weight: '', reps: '60s', completed: false },
          { weight: '', reps: '60s', completed: false },
        ],
      },
      {
        name: 'Foam Rolling',
        targetMuscles: 'Back, Legs',
        instructions: [
          'Start with major muscle groups: quads, hamstrings, calves',
          'Roll slowly, pausing on tender spots for 20-30 seconds',
          'Maintain proper posture and core engagement',
          'Breathe deeply while rolling',
          'Avoid rolling directly over joints or bones'
        ],
        sets: [
          { weight: '', reps: '60s per area', completed: false },
          { weight: '', reps: '60s per area', completed: false },
        ],
      },
      {
        name: 'Yoga Poses',
        targetMuscles: 'Full Body',
        instructions: [
          'Start with basic poses: downward dog, child\'s pose, cat-cow',
          'Focus on proper breathing and alignment',
          'Hold each pose for 30-60 seconds',
          'Move mindfully between poses',
          'Listen to your body and modify as needed'
        ],
        sets: [
          { weight: '', reps: '30s each', completed: false },
          { weight: '', reps: '30s each', completed: false },
        ],
      },
      {
        name: 'Joint Mobility',
        targetMuscles: 'Ankles, Hips, Shoulders',
        instructions: [
          'Start with gentle circular movements',
          'Move through full range of motion',
          'Focus on controlled, smooth movements',
          'Perform 8-10 reps in each direction',
          'Stop if you feel any sharp pain'
        ],
        sets: [
          { weight: '', reps: '30s each', completed: false },
          { weight: '', reps: '30s each', completed: false },
        ],
      },
    ],
  },
  'Chest & Triceps': {
    name: 'Chest & Triceps',
    exercises: [
      {
        name: 'Incline Bench Press',
        targetMuscles: 'Upper Chest, Front Delts',
        instructions: [
          'Set bench to 30 degree angle',
          'Grip bar slightly wider than shoulders',
          'Lower bar to upper chest',
          'Press bar up to starting position'
        ],
        sets: [
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false }
        ]
      },
      {
        name: 'Flat Dumbbell Press',
        targetMuscles: 'Mid Chest, Front Delts',
        instructions: [
          'Lie flat on bench',
          'Hold dumbbells at chest level',
          'Press up with natural arc',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false }
        ]
      },
      {
        name: 'Cable Flyes',
        targetMuscles: 'Chest, Shoulders',
        instructions: [
          'Stand between cable machines',
          'Slight forward lean',
          'Keep arms slightly bent',
          'Bring hands together in arc'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      },
      {
        name: 'Tricep Pushdowns',
        targetMuscles: 'Triceps',
        instructions: [
          'Face cable machine',
          'Elbows at sides',
          'Extend arms fully',
          'Control the negative'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      },
      {
        name: 'Overhead Tricep Extensions',
        targetMuscles: 'Triceps (Long Head)',
        instructions: [
          'Hold dumbbell overhead',
          'Keep elbows close',
          'Lower behind head',
          'Extend arms fully'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      }
    ]
  },
  'Back & Biceps': {
    name: 'Back & Biceps',
    exercises: [
      {
        name: 'Pull-ups',
        targetMuscles: 'Back, Biceps',
        instructions: [
          'Wide grip on bar',
          'Pull chest to bar',
          'Focus on back contraction',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false }
        ]
      },
      {
        name: 'Barbell Rows',
        targetMuscles: 'Back, Lats, Rear Delts, Biceps',
        instructions: [
          'Stand with feet hip-width apart, grip barbell with overhand grip',
          'Hinge at hips, keep back straight and chest up',
          'Pull barbell to lower chest, squeezing shoulder blades',
          'Lower bar with control, keeping core tight',
          'Repeat for reps'
        ],
        sets: [
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false }
        ]
      },
      {
        name: 'Lat Pulldowns',
        targetMuscles: 'Lats, Biceps',
        instructions: [
          'Grip bar wide',
          'Lean back slightly',
          'Pull to upper chest',
          'Control the return'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      },
      {
        name: 'Bicep Curls',
        targetMuscles: 'Biceps',
        instructions: [
          'Stand with dumbbells',
          'Keep elbows at sides',
          'Curl with control',
          'Full range of motion'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      },
      {
        name: 'Hammer Curls',
        targetMuscles: 'Biceps, Forearms',
        instructions: [
          'Neutral grip',
          'Keep elbows still',
          'Curl to shoulders',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      }
    ]
  },
  'Legs': {
    name: 'Legs',
    exercises: [
      {
        name: 'Squats',
        targetMuscles: 'Quads, Glutes',
        instructions: [
          'Feet shoulder width',
          'Keep chest up',
          'Break at hips and knees',
          'Drive through heels'
        ],
        sets: [
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false }
        ]
      },
      {
        name: 'Romanian Deadlifts',
        targetMuscles: 'Hamstrings, Lower Back',
        instructions: [
          'Soft knee bend',
          'Hinge at hips',
          'Bar close to legs',
          'Feel hamstring stretch'
        ],
        sets: [
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false }
        ]
      },
      {
        name: 'Leg Press',
        targetMuscles: 'Quads, Hamstrings',
        instructions: [
          'Feet shoulder width',
          'Lower with control',
          'Do not lock knees',
          'Push through heels'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      },
      {
        name: 'Leg Curls',
        targetMuscles: 'Hamstrings',
        instructions: [
          'Lie face down',
          'Curl heels to glutes',
          'Hold peak contraction',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      },
      {
        name: 'Calf Raises',
        targetMuscles: 'Calves',
        instructions: [
          'Stand on edge',
          'Full range of motion',
          'Hold at top',
          'Slow negative'
        ],
        sets: [
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false },
          { weight: '', reps: '15-20', completed: false }
        ]
      }
    ]
  },
  'Shoulders & Arms': {
    name: 'Shoulders & Arms',
    exercises: [
      {
        name: 'Overhead Press',
        targetMuscles: 'Shoulders, Triceps',
        instructions: [
          'Stand with feet planted',
          'Press overhead',
          'Keep core tight',
          'Control the descent'
        ],
        sets: [
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false },
          { weight: '', reps: '10-12', completed: false }
        ]
      },
      {
        name: 'Lateral Raises',
        targetMuscles: 'Side Delts',
        instructions: [
          'Stand with dumbbells',
          'Slight bend in elbows',
          'Raise to shoulder level',
          'Lower with control'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      },
      {
        name: 'Face Pulls',
        targetMuscles: 'Rear Delts, Upper Back',
        instructions: [
          'Cable at head height',
          'Pull to face',
          'Lead with elbows',
          'Squeeze at back'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      },
      {
        name: 'Bicep Curls',
        targetMuscles: 'Biceps',
        instructions: [
          'Stand with dumbbells',
          'Keep elbows at sides',
          'Full range of motion',
          'Squeeze at top'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      },
      {
        name: 'Tricep Extensions',
        targetMuscles: 'Triceps',
        instructions: [
          'Lie on bench',
          'Hold dumbbells overhead',
          'Lower behind head',
          'Extend arms fully'
        ],
        sets: [
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false },
          { weight: '', reps: '12-15', completed: false }
        ]
      }
    ]
  },
};

const ActiveWorkoutScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { updateStats, stats, incrementStat } = useTracking();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [calories, setCalories] = useState(0);
  const [workout, setWorkout] = useState(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTime, setRestTime] = useState(90);
  const [currentRestTime, setCurrentRestTime] = useState(90);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showHowToModal, setShowHowToModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);

  // Initialize workout state based on params
  useEffect(() => {
    if (params.custom === 'true' && params.workout) {
      try {
        const parsed = JSON.parse(params.workout);
        setWorkout({
          name: parsed.name,
          exercises: parsed.exercises.map(ex => {
            let found = null;
            for (const workout of Object.values(workoutData)) {
              found = workout.exercises.find(e => e.name === ex.name);
              if (found) break;
            }
            return {
              name: ex.name,
              targetMuscles: ex.targetMuscles || found?.targetMuscles || '',
              instructions: ex.instructions || found?.instructions || [],
              sets: Array.from({ length: parseInt(ex.sets) || 3 }, () => ({
                weight: '',
                reps: ex.reps || found?.sets?.[0]?.reps || '8-12',
                completed: false
              })),
            };
          }),
        });
      } catch (e) {
        setWorkout(workoutData['Full Body Workout']);
      }
    } else {
      setWorkout(workoutData[params.type] || workoutData['Full Body Workout']);
    }
  }, [params.custom, params.workout, params.type]);

  // Load saved rest time
  useEffect(() => {
    const loadRestTime = async () => {
      try {
        const savedRestTime = await AsyncStorage.getItem('restTime');
        if (savedRestTime) {
          setRestTime(parseInt(savedRestTime));
          setCurrentRestTime(parseInt(savedRestTime));
        }
      } catch (error) {
        console.error('Error loading rest time:', error);
      }
    };
    loadRestTime();
  }, []);

  // Timer for workout duration
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      // Rough estimate of calories burned (can be made more accurate)
      setCalories(prev => prev + 0.1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Rest timer countdown
  useEffect(() => {
    let timer;
    if (restTimerActive && currentRestTime > 0) {
      timer = setInterval(() => {
        setCurrentRestTime(prev => prev - 1);
      }, 1000);
    } else if (currentRestTime === 0) {
      setRestTimerActive(false);
      setShowRestTimer(false);
    }

    return () => clearInterval(timer);
  }, [restTimerActive, currentRestTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetComplete = (exerciseIndex, setIndex) => {
    const newWorkout = { ...workout };
    newWorkout.exercises[exerciseIndex].sets[setIndex].completed = true;
    setWorkout(newWorkout);
    
    setCurrentRestTime(restTime);
    setShowRestTimer(true);
    setRestTimerActive(true);
  };

  const resetWorkout = () => {
    const resetWorkoutData = { ...workout };
    resetWorkoutData.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        set.completed = false;
      });
    });
    setWorkout(resetWorkoutData);
    setElapsedTime(0);
    setCalories(0);
  };

  const saveWorkoutLog = async () => {
    if (!user) {
        console.error('No user found');
        return;
    }

    try {
        // Calculate completed sets and total weight
        let completedSets = 0;
        let totalWeight = 0;
        let exerciseNames = [];
        let exerciseCount = 0;

        // Process each exercise
        const exerciseData = workout.exercises.map(exercise => {
            exerciseCount++;
            exerciseNames.push(exercise.name);
            
            const sets = exercise.sets.map(set => {
                if (set.completed) {
                    completedSets++;
                    totalWeight += (set.weight || 0) * (set.reps || 0);
                }
                return {
                    weight: set.weight || 0,
                    reps: set.reps || 0,
                    completed: set.completed || false
                };
            });

            return {
                name: exercise.name,
                targetMuscles: exercise.targetMuscles || [],
                sets: sets
            };
        });

        // Save to Supabase
        const { error } = await supabase
            .from('workout_logs')
            .insert({
                user_id: user.id,
                workout_name: workout.name,
                exercises: exerciseData,
                completed_sets: completedSets,
                exercise_count: exerciseCount,
                exercise_names: exerciseNames,
                total_weight: totalWeight,
                duration: workout.duration || 0,
                completed_at: new Date().toISOString()
            });

        if (error) throw error;

        // Show success message
        Alert.alert(
            'Workout Completed',
            'Your workout has been saved successfully!',
            [{ text: 'OK', onPress: () => router.back() }]
        );
    } catch (error) {
        console.error('Error saving workout:', error);
        Alert.alert(
            'Error',
            'Failed to save your workout. Please try again.'
        );
    }
};

  const handleFinish = async () => {
    setShowFinishConfirmation(true);
  };

  const confirmFinish = async () => {
    try {
        // Calculate stats
        let completedSets = 0;
        let totalWeight = 0;
        workout.exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
                if (set.completed) {
                    completedSets++;
                    if (set.weight) {
                        const reps = parseInt(set.reps.split('-')[0]) || 0;
                        const weight = parseFloat(set.weight) || 0;
                        totalWeight += weight * reps;
                    }
                }
            });
        });

        // Save to Supabase
        const { error } = await supabase
            .from('workout_logs')
            .insert({
                user_id: user.id,
                workout_name: workout.name,
                exercises: workout.exercises.map(exercise => ({
                    name: exercise.name,
                    targetMuscles: exercise.targetMuscles || [],
                    sets: exercise.sets.map(set => ({
                        weight: set.weight || 0,
                        reps: set.reps || 0,
                        completed: set.completed || false
                    }))
                })),
                completed_sets: completedSets,
                exercise_count: workout.exercises.length,
                exercise_names: workout.exercises.map(ex => ex.name),
                total_weight: Math.round(totalWeight),
                duration: elapsedTime,
                completed_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error saving workout:', error);
            Alert.alert('Error', 'Failed to save workout log');
            return;
        }

        // Update tracking stats
        const minutesWorked = Math.floor(elapsedTime / 60);
        await incrementStat('workouts', 1);
        await incrementStat('minutes', minutesWorked);

        // Reset workout and hide confirmation
        resetWorkout();
        setShowFinishConfirmation(false);

        // Navigate to summary with stats
        router.push({
            pathname: '/(tabs)/workout-summary',
            params: {
                duration: elapsedTime,
                exerciseCount: workout.exercises.length,
                completedSets,
                totalWeight: Math.round(totalWeight),
                workoutName: workout.name,
                justCompleted: true
            }
        });
    } catch (error) {
        console.error('Error finishing workout:', error);
        Alert.alert('Error', 'Failed to complete workout');
        setShowFinishConfirmation(false);
    }
};

  const handleExit = () => {
    setShowExitConfirmation(true);
  };

  const confirmExit = () => {
    resetWorkout();
    router.back();
  };

  const skipRest = () => {
    setShowRestTimer(false);
    setRestTimerActive(false);
  };

  const toggleRestTimer = () => {
    setRestTimerActive(prev => !prev);
  };

  const handleWeightChange = (exerciseIndex, setIndex, weight) => {
    const newWorkout = { ...workout };
    newWorkout.exercises[exerciseIndex].sets[setIndex].weight = weight;
    setWorkout(newWorkout);
  };

  const handleHowToPress = (exercise) => {
    setCurrentExercise(exercise);
    setShowHowToModal(true);
  };

  // Add loading state at the top of the component
  if (!workout) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000'}}>
        <Text style={{color: '#00ffff', fontSize: 18}}>Loading workout...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleExit}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{workout?.name}</Text>
        <TouchableOpacity 
          style={styles.finishButton}
          onPress={handleFinish}
        >
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={20} color="#00ffff" />
          <Text style={styles.statText}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flame-outline" size={20} color="#00ffff" />
          <Text style={styles.statText}>{Math.round(calories)} cal</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {workout?.exercises.map((exercise, exerciseIndex) => (
          <View key={exerciseIndex} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <TouchableOpacity 
                  style={styles.howToButton}
                  onPress={() => handleHowToPress(exercise)}
                >
                  <Text style={styles.howToText}>How-To</Text>
                  <Text style={styles.targetMuscles}>{exercise.targetMuscles || 'No target muscles info'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {exercise.sets.map((set, setIndex) => (
              <View key={setIndex} style={styles.setRow}>
                <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
                <View style={styles.setInputs}>
                  <View style={styles.weightInput}>
                    <TextInput
                      style={[
                        styles.input,
                        set.completed && styles.inputCompleted
                      ]}
                      placeholder="0"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={set.weight}
                      onChangeText={(text) => handleWeightChange(exerciseIndex, setIndex, text)}
                      editable={!set.completed}
                    />
                    <Text style={styles.inputLabel}>Weight (lbs)</Text>
                  </View>
                  <View style={styles.repsInput}>
                    <Text style={[
                      styles.repsText,
                      set.completed && styles.repsTextCompleted
                    ]}>{set.reps}</Text>
                    <Text style={styles.inputLabel}>Reps</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.checkButton,
                    set.completed && styles.checkButtonCompleted
                  ]}
                  onPress={() => !set.completed && handleSetComplete(exerciseIndex, setIndex)}
                >
                  <Ionicons 
                    name={set.completed ? "checkmark" : "ellipse-outline"} 
                    size={24} 
                    color={set.completed ? "#000" : "#00ffff"} 
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Rest Timer Modal */}
      <Modal
        visible={showRestTimer}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.restTitle}>Rest Time</Text>
            <Text style={styles.timerText}>{formatTime(currentRestTime)}</Text>
            <View style={styles.restControls}>
              <TouchableOpacity onPress={toggleRestTimer}>
                <Ionicons 
                  name={restTimerActive ? "pause" : "play"} 
                  size={32} 
                  color="#00ffff" 
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={skipRest}
            >
              <Text style={styles.skipButtonText}>Skip Rest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning-outline" size={40} color="#ff4444" />
            </View>
            <Text style={styles.modalTitle}>Exit Workout?</Text>
            <Text style={styles.modalText}>
              Your progress will be lost if you exit now.{'\n'}
              Are you sure you want to leave?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowExitConfirmation(false)}
              >
                <Text style={styles.cancelButtonText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmExit}
              >
                <Text style={styles.confirmButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Finish Confirmation Modal */}
      <Modal
        visible={showFinishConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#00ffff" />
            </View>
            <Text style={styles.modalTitle}>Finish Workout?</Text>
            <Text style={styles.modalText}>
              Great job! Ready to complete this workout?{'\n'}
              Your progress will be saved.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFinishConfirmation(false)}
              >
                <Text style={styles.cancelButtonText}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmFinish}
              >
                <Text style={styles.confirmButtonText}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* How To Modal */}
      <Modal
        visible={showHowToModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.howToModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{currentExercise?.name}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowHowToModal(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.instructionsContainer}>
              <Text style={styles.targetMusclesTitle}>Target Muscles:</Text>
              <Text style={styles.targetMusclesText}>{currentExercise?.targetMuscles}</Text>
              
              <Text style={styles.instructionsTitle}>Instructions:</Text>
              {(currentExercise?.instructions && currentExercise.instructions.length > 0)
                ? currentExercise.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>{index + 1}.</Text>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
                  ))
                : <Text style={styles.instructionText}>No instructions available.</Text>
              }
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  closeButton: {
    padding: 8,
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  finishButton: {
    backgroundColor: '#00ffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 5,
  },
  finishButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseHeader: {
    marginBottom: 20,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  howToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  howToText: {
    color: '#00ffff',
    fontSize: 14,
  },
  targetMuscles: {
    color: '#666',
    fontSize: 14,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  setNumber: {
    width: 60,
    color: '#fff',
    fontSize: 14,
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 15,
  },
  weightInput: {
    flex: 1,
  },
  repsInput: {
    flex: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  inputCompleted: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    color: '#00ffff',
  },
  repsText: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    color: '#fff',
    textAlign: 'center',
  },
  repsTextCompleted: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    color: '#00ffff',
  },
  inputLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00ffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  checkButtonCompleted: {
    backgroundColor: '#00ffff',
  },
  restTimer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  restTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  restControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginBottom: 20,
  },
  skipButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  skipButtonText: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.1)',
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButton: {
    backgroundColor: '#00ffff',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  howToModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  instructionsContainer: {
    marginTop: 20,
  },
  targetMusclesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  targetMusclesText: {
    fontSize: 14,
    color: '#00ffff',
    marginBottom: 15,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumber: {
    fontSize: 14,
    color: '#00ffff',
    marginRight: 5,
    minWidth: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ffff',
    marginVertical: 20,
  },
});

export default ActiveWorkoutScreen; 