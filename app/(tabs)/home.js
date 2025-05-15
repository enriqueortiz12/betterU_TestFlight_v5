"use client";

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTracking } from '../../context/TrackingContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import PremiumFeature from '../components/PremiumFeature';
import { supabase } from '../../lib/supabase';

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
  { text: "Every rep counts, every set matters.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { text: "The harder you work, the luckier you get.", author: "Gary Player" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Marilyn Monroe" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Unknown" },
  { text: "Little by little, a little becomes a lot.", author: "Tanzanian Proverb" },
  { text: "If it doesn't challenge you, it won't change you.", author: "Fred DeVito" },
  { text: "Don't limit your challenges. Challenge your limits.", author: "Jerry Dunn" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "I can do all things through Christ who strengthens me.", author: "Philippians 4:13" },
  { text: "For God gave us a spirit not of fear but of power and love and self-control.", author: "2 Timothy 1:7" },
  { text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", author: "Isaiah 40:31" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", author: "Joshua 1:9" },
  { text: "Commit to the Lord whatever you do, and he will establish your plans.", author: "Proverbs 16:3" },
  // --- 60 more motivational quotes and Bible verses ---
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "With God all things are possible.", author: "Matthew 19:26" },
  { text: "Let all that you do be done in love.", author: "1 Corinthians 16:14" },
  { text: "He gives strength to the weary and increases the power of the weak.", author: "Isaiah 40:29" },
  { text: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.", author: "Psalm 28:7" },
  { text: "When you go through deep waters, I will be with you.", author: "Isaiah 43:2" },
  { text: "Cast all your anxiety on him because he cares for you.", author: "1 Peter 5:7" },
  { text: "The best way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Difficult roads often lead to beautiful destinations.", author: "Unknown" },
  { text: "God is within her, she will not fall.", author: "Psalm 46:5" },
  { text: "Be still, and know that I am God.", author: "Psalm 46:10" },
  { text: "The Lord will fight for you; you need only to be still.", author: "Exodus 14:14" },
  { text: "Let your light shine before others.", author: "Matthew 5:16" },
  { text: "Faith does not make things easy, it makes them possible.", author: "Luke 1:37" },
  { text: "God has not given us a spirit of fear, but of power and of love and of a sound mind.", author: "2 Timothy 1:7" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "The only way to achieve the impossible is to believe it is possible.", author: "Charles Kingsleigh" },
  { text: "God is our refuge and strength, an ever-present help in trouble.", author: "Psalm 46:1" },
  { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", author: "Jeremiah 29:11" },
  { text: "Be strong and take heart, all you who hope in the Lord.", author: "Psalm 31:24" },
  { text: "The Lord is my shepherd; I shall not want.", author: "Psalm 23:1" },
  { text: "Trust in the Lord with all your heart and lean not on your own understanding.", author: "Proverbs 3:5" },
  { text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.", author: "Galatians 6:9" },
  { text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.", author: "Colossians 3:23" },
  { text: "The Lord is my light and my salvation—whom shall I fear?", author: "Psalm 27:1" },
  { text: "I sought the Lord, and he answered me; he delivered me from all my fears.", author: "Psalm 34:4" },
  { text: "My flesh and my heart may fail, but God is the strength of my heart and my portion forever.", author: "Psalm 73:26" },
  { text: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning.", author: "Lamentations 3:22-23" },
  { text: "He will cover you with his feathers, and under his wings you will find refuge.", author: "Psalm 91:4" },
  { text: "The Lord is good, a refuge in times of trouble. He cares for those who trust in him.", author: "Nahum 1:7" },
  { text: "For we live by faith, not by sight.", author: "2 Corinthians 5:7" },
  { text: "The Lord your God is with you, the Mighty Warrior who saves.", author: "Zephaniah 3:17" },
  { text: "He gives power to the weak and strength to the powerless.", author: "Isaiah 40:29" },
  { text: "The Lord is near to all who call on him.", author: "Psalm 145:18" },
  { text: "I will instruct you and teach you in the way you should go.", author: "Psalm 32:8" },
  { text: "The Lord will keep you from all harm—he will watch over your life.", author: "Psalm 121:7" },
  { text: "The Lord is my rock, my fortress and my deliverer.", author: "Psalm 18:2" },
  { text: "He who dwells in the shelter of the Most High will rest in the shadow of the Almighty.", author: "Psalm 91:1" },
  { text: "The Lord is compassionate and gracious, slow to anger, abounding in love.", author: "Psalm 103:8" },
  { text: "The Lord is righteous in all his ways and faithful in all he does.", author: "Psalm 145:17" },
  { text: "The Lord is my strength and my song; he has given me victory.", author: "Exodus 15:2" },
  { text: "The Lord is my helper; I will not be afraid.", author: "Hebrews 13:6" },
  { text: "The Lord is my portion, says my soul, therefore I will hope in him.", author: "Lamentations 3:24" },
  { text: "The Lord is my refuge and my fortress, my God, in whom I trust.", author: "Psalm 91:2" },
  { text: "The Lord is my deliverer.", author: "Psalm 18:2" },
  { text: "The Lord is my shield.", author: "Psalm 28:7" },
  { text: "The Lord is my salvation.", author: "Psalm 27:1" },
  { text: "The Lord is my rock.", author: "Psalm 18:2" },
  { text: "The Lord is my shepherd.", author: "Psalm 23:1" },
  { text: "The Lord is my light.", author: "Psalm 27:1" },
  { text: "The Lord is my strength.", author: "Psalm 28:7" },
  { text: "The Lord is my song.", author: "Exodus 15:2" },
  { text: "The Lord is my hope.", author: "Lamentations 3:24" },
  { text: "The Lord is my peace.", author: "Ephesians 2:14" },
  { text: "The Lord is my joy.", author: "Nehemiah 8:10" },
  { text: "The Lord is my healer.", author: "Exodus 15:26" },
  { text: "The Lord is my provider.", author: "Genesis 22:14" },
  { text: "The Lord is my redeemer.", author: "Isaiah 47:4" },
  { text: "The Lord is my comforter.", author: "2 Corinthians 1:3-4" },
  { text: "The Lord is my friend.", author: "John 15:15" },
  { text: "The Lord is my guide.", author: "Psalm 48:14" },
  { text: "The Lord is my teacher.", author: "Psalm 32:8" },
  { text: "The Lord is my counselor.", author: "Psalm 16:7" },
  { text: "The Lord is my protector.", author: "Psalm 121:7" },
  { text: "The Lord is my sustainer.", author: "Psalm 54:4" },
  { text: "The Lord is my restorer.", author: "Psalm 23:3" },
  { text: "The Lord is my avenger.", author: "Romans 12:19" },
];

const HomeScreen = () => {
  const router = useRouter();
  const { profile, isPremium } = useAuth();
  const { calories, water, mood, stats, addCalories, addWater, updateGoal, incrementStat } = useTracking();
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [calorieInput, setCalorieInput] = useState('');
  const [showCustomWaterModal, setShowCustomWaterModal] = useState(false);
  const [waterInput, setWaterInput] = useState('');
  const [currentQuote, setCurrentQuote] = useState(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    return motivationalQuotes[randomIndex];
  });
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showGoalModal, setShowGoalModal] = useState(null);
  const [goalInput, setGoalInput] = useState('');
  const [streakUpdatedToday, setStreakUpdatedToday] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(stats.today_workout_completed);
  const [mentalCompleted, setMentalCompleted] = useState(stats.today_mental_completed);

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

  useEffect(() => {
    const checkMidnightReset = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const timeUntilMidnight = midnight - now;

      if (timeUntilMidnight <= 0) {
        // Reset trackers at midnight
        addCalories(-calories.consumed);
        addWater(-water.consumed);
        // Reset streak update flag
        setStreakUpdatedToday(false);
      }
    };

    const intervalId = setInterval(checkMidnightReset, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [calories.consumed, water.consumed]);

  useEffect(() => {
    setWorkoutCompleted(stats.today_workout_completed);
    setMentalCompleted(stats.today_mental_completed);
  }, [stats.today_workout_completed, stats.today_mental_completed]);

  // Add a useEffect to fetch and sync state on login
  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) {
        console.log('Profile not loaded yet');
        return;
      }

      console.log('Fetching stats for user:', profile.id);
      // Get stats from profiles table
      let { data, error } = await supabase
        .from('profiles')
        .select('today_workout_completed, today_mental_completed, last_streak_update')
        .eq('id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      console.log('Fetched stats:', data);
      setWorkoutCompleted(data.today_workout_completed);
      setMentalCompleted(data.today_mental_completed);
      const today = new Date().toISOString().split('T')[0];
      setStreakUpdatedToday(data.last_streak_update === today);
    };
    fetchStats();
  }, [profile]);

  // Add a useEffect to check for daily reset
  useEffect(() => {
    const checkDailyReset = async () => {
      if (!profile?.id) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('profiles')
        .select('last_streak_update')
        .eq('id', profile.id)
        .single();

      if (error) {
        console.error('Error checking daily reset:', error);
        return;
      }

      // If last_streak_update is not today, reset the streak update flag
      if (data.last_streak_update !== today) {
        setStreakUpdatedToday(false);
      }
    };

    // Check every minute
    const interval = setInterval(checkDailyReset, 60000);
    checkDailyReset(); // Initial check

    return () => clearInterval(interval);
  }, [profile]);

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

  // Update the updateStreak function to use profiles table
  const updateStreak = async () => {
    if (!profile || !profile.id) return;

    try {
      // Get today's date in UTC
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      // Check if streak was already updated today
      const { data: streakData } = await supabase
        .from('betteru_streaks')
        .select('last_completed_date')
        .eq('user_id', profile.id)
        .single();

      if (streakData?.last_completed_date) {
        const lastUpdate = new Date(streakData.last_completed_date);
        lastUpdate.setUTCHours(0, 0, 0, 0);
        
        // If streak was already updated today, don't update again
        if (lastUpdate.getTime() === today.getTime()) {
          return;
        }
      }

      // Get today's workout and mental session logs
      const { data: workoutLogs } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', profile.id)
        .gte('completed_at', todayStr)
        .lt('completed_at', new Date(today.getTime() + 86400000).toISOString());

      const { data: mentalLogs } = await supabase
        .from('mental_session_logs')
        .select('completed_at')
        .eq('user_id', profile.id)
        .gte('completed_at', todayStr)
        .lt('completed_at', new Date(today.getTime() + 86400000).toISOString());

      const hasWorkout = workoutLogs && workoutLogs.length > 0;
      const hasMental = mentalLogs && mentalLogs.length > 0;

      if (hasWorkout && hasMental) {
        // Get current streak data
        const { data: currentStreak } = await supabase
          .from('betteru_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', profile.id)
          .single();

        const newStreak = (currentStreak?.current_streak || 0) + 1;
        const newLongestStreak = Math.max(newStreak, currentStreak?.longest_streak || 0);

        // Update streak
        const { error } = await supabase
          .from('betteru_streaks')
          .upsert({
            user_id: profile.id,
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            last_completed_date: todayStr,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        // Update local state
        incrementStat('streak', 1);
        setStreakUpdatedToday(true);
        setWorkoutCompleted(false);
        setMentalCompleted(false);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
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
        {!streakUpdatedToday && (
          <TouchableOpacity 
            style={styles.updateStreakButton}
            onPress={updateStreak}
          >
            <Text style={styles.updateStreakButtonText}>
              Update Streak
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.activityStatus}>
          <View style={styles.activityItem}>
            <Ionicons 
              name={workoutCompleted ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={workoutCompleted ? "#ff0000" : "#666"} 
            />
            <Text style={[styles.activityText, workoutCompleted && styles.activityCompleted]}>
              Workout
            </Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons 
              name={mentalCompleted ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={mentalCompleted ? "#ff0000" : "#666"} 
            />
            <Text style={[styles.activityText, mentalCompleted && styles.activityCompleted]}>
              Mental Session
            </Text>
          </View>
        </View>
        <Text style={styles.streakDescription}>
          {streakUpdatedToday
            ? 'Come back tomorrow to update your streak again!'
            : 'Complete both a workout and mental session daily to maintain your streak!'}
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
    backgroundColor: 'rgba(0, 200, 255, 0.10)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 255, 0.20)',
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
    color: '#00e0ff',
    fontWeight: 'bold',
    marginTop: 4,
    textShadowColor: '#00bfff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  streakDescription: {
    fontSize: 14,
    color: '#00bfff',
    marginTop: 8,
    fontWeight: '500',
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
  updateStreakButton: {
    backgroundColor: '#00ffff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  updateStreakButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 