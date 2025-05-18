"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage"
import { generateAIResponse } from "../utils/aiUtils"
import { useUser } from '../context/UserContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const TrainerContext = createContext();

export const TrainerProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const { userProfile } = useUser();
  const { isPremium } = useUser();
  console.warn('[TrainerProvider] isPremium:', isPremium);

  // Set message limits
  const MAX_DAILY_MESSAGES = isPremium ? 100 : 15;

  // Helper to get today's date string
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Function to check if we need to reset message count
  const checkAndResetMessageCount = async () => {
    try {
      const lastResetDate = await AsyncStorage.getItem("lastMessageCountReset");
      const today = new Date().toDateString();
      
      if (lastResetDate !== today) {
        // Reset message count and update last reset date
        await AsyncStorage.setItem("messageCount", "0");
        await AsyncStorage.setItem("lastMessageCountReset", today);
        setMessageCount(0);
      } else {
        // Load existing message count
        const count = await AsyncStorage.getItem("messageCount");
        const parsedCount = parseInt(count || "0");
        setMessageCount(parsedCount);
        console.log("Loaded message count:", parsedCount); // Debug log
      }
    } catch (error) {
      console.error("Error checking/resetting message count:", error);
    }
  };

  // Load today's conversations from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 5000);

    const initConversations = async () => {
      try {
        await checkAndResetMessageCount();
        // Fetch today's messages from Supabase
        const userId = userProfile?.user_id || userProfile?.id;
        if (userId) {
          const { data, error } = await supabase
            .from('trainer_messages')
            .select('*')
            .eq('user_id', userId)
            .eq('date', getTodayString())
            .order('created_at', { ascending: true });
          if (!error && data && data.length > 0) {
            const formatted = data.map(msg => ({
              id: msg.id,
              sender: msg.is_user ? 'user' : 'trainer',
              message: msg.message,
              timestamp: msg.created_at,
            }));
            setConversations(formatted);
            await AsyncStorage.setItem('trainerConversations', JSON.stringify(formatted));
          } else if (isMounted) {
            // Fallback to initial message
            const initialMessage = {
              id: Date.now().toString(),
              sender: 'trainer',
              message: "Hello! I'm your AI trainer. How can I help you today?",
              timestamp: new Date().toISOString(),
            };
            setConversations([initialMessage]);
            await AsyncStorage.setItem('trainerConversations', JSON.stringify([initialMessage]));
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    initConversations();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [userProfile?.user_id, userProfile?.id]);

  const sendMessage = async (message, { stats = {}, trackingData = {}, mood = '' } = {}) => {
    console.warn('=== AI TRAINER MESSAGE SENT: sendMessage CALLED ===');
    console.warn('[TrainerProvider] sendMessage isPremium:', isPremium);
    try {
      await checkAndResetMessageCount();
      if (messageCount >= MAX_DAILY_MESSAGES) {
        if (!isPremium) {
          const aiMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'trainer',
            message: "You've reached your daily limit of 15 messages. Upgrade to Premium for 100 messages per day!",
            timestamp: new Date().toISOString(),
          };
          const finalConversations = [...conversations, aiMessage];
          setConversations(finalConversations);
          await AsyncStorage.setItem('trainerConversations', JSON.stringify(finalConversations));
        }
        return { success: false, error: 'Message limit reached' };
      }
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        sender: 'user',
        message: message,
        timestamp: new Date().toISOString(),
      };
      const updatedConversations = [...conversations, userMessage];
      setConversations(updatedConversations);
      await AsyncStorage.setItem('trainerConversations', JSON.stringify(updatedConversations));
      // Save user message to Supabase
      const userId = userProfile?.user_id || userProfile?.id;
      if (userId) {
        await supabase.from('trainer_messages').insert({
          user_id: userId,
          message: message,
          is_user: true,
          date: getTodayString(),
        });
      }
      // Get AI response with all user data
      let aiResponse;
      console.warn('=== ENTERING AI RESPONSE TRY BLOCK ===');
      try {
        // Compose a system prompt for the AI
        const systemPrompt = `You are a fitness and wellness AI coach. The user data you have access to includes their profile, all-time workout and mental session history, personal records (PRs), fitness goals, and current mood. Always reference these data points when relevant in your responses. For example, if the user asks about progress, reference their PRs and history. If they ask for motivation, reference their goals and mood. Be specific and personalized.`;
        // Add log before calling generateAIResponse
        console.warn('=== ABOUT TO CALL generateAIResponse ===');
        const aiResult = await generateAIResponse(
          message,
          {
            profile: userProfile,
            stats,
            allTimeWorkoutHistory: trackingData.workoutHistory,
            allTimeMentalHistory: trackingData.mentalHistory,
            prs: trackingData.personalRecords,
            goals: userProfile?.fitness_goal || stats?.goal || '',
            mood,
          },
          systemPrompt
        );
        aiResponse = aiResult.response || "I'm here to help with your fitness journey!";
      } catch (aiError) {
        console.error('=== ERROR IN AI RESPONSE TRY BLOCK ===', aiError);
        aiResponse = "I'm here to help! What would you like to know about fitness?";
      }
      // Add AI message
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'trainer',
        message: aiResponse,
        timestamp: new Date().toISOString(),
      };
      const finalConversations = [...updatedConversations, aiMessage];
      setConversations(finalConversations);
      await AsyncStorage.setItem('trainerConversations', JSON.stringify(finalConversations));
      // Save AI message to Supabase
      if (userId) {
        await supabase.from('trainer_messages').insert({
          user_id: userId,
          message: aiResponse,
          is_user: false,
          date: getTodayString(),
        });
      }
      // Update message count
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      await AsyncStorage.setItem('messageCount', newCount.toString());
      return { success: true, response: aiResponse };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const clearConversations = async () => {
    try {
      const initialMessage = {
        id: Date.now().toString(),
        sender: 'trainer',
        message: "Hello! I'm your AI trainer. How can I help you today?",
        timestamp: new Date().toISOString(),
      };
      setConversations([initialMessage]);
      await AsyncStorage.setItem('trainerConversations', JSON.stringify([initialMessage]));
      // Delete today's messages from Supabase
      const userId = userProfile?.user_id || userProfile?.id;
      if (userId) {
        await supabase.from('trainer_messages')
          .delete()
          .eq('user_id', userId)
          .eq('date', getTodayString());
        // Insert the initial message
        await supabase.from('trainer_messages').insert({
          user_id: userId,
          message: initialMessage.message,
          is_user: false,
          date: getTodayString(),
        });
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    conversations,
    setConversations,
    sendMessage,
    clearConversations,
    isLoading,
    messageCount,
  };

  return <TrainerContext.Provider value={value}>{children}</TrainerContext.Provider>;
};

export const useTrainer = () => {
  const context = useContext(TrainerContext);
  if (!context) {
    throw new Error('useTrainer must be used within a TrainerProvider');
  }
  return context;
};

