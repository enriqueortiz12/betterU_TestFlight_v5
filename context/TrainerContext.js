"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage"
import { generateAIResponse } from "../utils/aiUtils"
import { useUser } from '../context/UserContext';
import { useAuth } from './AuthContext';

const TrainerContext = createContext();

export const TrainerProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const { userProfile } = useUser();
  const { isPremium } = useAuth();

  // Set message limits
  const MAX_DAILY_MESSAGES = isPremium ? 100 : 15;

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

  // Initialize with a timeout to prevent infinite loading
  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted) {
      setIsLoading(false);
      }
    }, 5000); // 5 second timeout

    const initConversations = async () => {
      try {
        // Check if we need to reset message count
        await checkAndResetMessageCount();

        const savedConversations = await AsyncStorage.getItem("trainerConversations");
        if (savedConversations && isMounted) {
          setConversations(JSON.parse(savedConversations));
        } else if (isMounted) {
          const initialMessage = {
            id: Date.now().toString(),
            sender: "trainer",
            message: "Hello! I'm your AI trainer. How can I help you today?",
            timestamp: new Date().toISOString(),
          };
          setConversations([initialMessage]);
          await AsyncStorage.setItem("trainerConversations", JSON.stringify([initialMessage]));
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        if (isMounted) {
        const initialMessage = {
          id: Date.now().toString(),
          sender: "trainer",
          message: "Hello! I'm your AI trainer. How can I help you today?",
          timestamp: new Date().toISOString(),
        };
        setConversations([initialMessage]);
        }
      } finally {
        if (isMounted) {
        setIsLoading(false);
        }
      }
    };

    initConversations();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const sendMessage = async (message) => {
    try {
      // Check if we need to reset message count
      await checkAndResetMessageCount();

      // Enforce message limit
      if (messageCount >= MAX_DAILY_MESSAGES) {
        if (!isPremium) {
          // Show upsell message for free users
          const aiMessage = {
            id: (Date.now() + 1).toString(),
            sender: "trainer",
            message: "You've reached your daily limit of 15 messages. Upgrade to Premium for 100 messages per day!",
            timestamp: new Date().toISOString(),
          };
          const finalConversations = [...conversations, aiMessage];
          setConversations(finalConversations);
          await AsyncStorage.setItem("trainerConversations", JSON.stringify(finalConversations));
        }
        return { success: false, error: "Message limit reached" };
      }

      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        sender: "user",
        message: message,
        timestamp: new Date().toISOString(),
      };

      const updatedConversations = [...conversations, userMessage];
      setConversations(updatedConversations);
      await AsyncStorage.setItem("trainerConversations", JSON.stringify(updatedConversations));

      // Get AI response with user profile
      let aiResponse;
      try {
        console.log("Sending profile to AI:", userProfile); // Debug log
        const aiResult = await generateAIResponse(message, userProfile);
        aiResponse = aiResult.response || "I'm here to help with your fitness journey!";
      } catch (aiError) {
        console.error("AI response error:", aiError);
        aiResponse = "I'm here to help! What would you like to know about fitness?";
      }

      // Add AI message
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: "trainer",
        message: aiResponse,
        timestamp: new Date().toISOString(),
      };

      const finalConversations = [...updatedConversations, aiMessage];
      setConversations(finalConversations);
      await AsyncStorage.setItem("trainerConversations", JSON.stringify(finalConversations));

      // Update message count
      const newCount = messageCount + 1;
      console.log("Updating message count to:", newCount); // Debug log
      setMessageCount(newCount);
      await AsyncStorage.setItem("messageCount", newCount.toString());

      return { success: true, response: aiResponse };
    } catch (error) {
      console.error("Error in sendMessage:", error);
      return { success: false, error: error.message };
    }
  };

  const clearConversations = async () => {
    try {
      const initialMessage = {
        id: Date.now().toString(),
        sender: "trainer",
        message: "Hello! I'm your AI trainer. How can I help you today?",
        timestamp: new Date().toISOString(),
      };

      // Only update conversations, don't touch message count
      setConversations([initialMessage]);
      await AsyncStorage.setItem("trainerConversations", JSON.stringify([initialMessage]));

      return { success: true };
    } catch (error) {
      console.error("Error clearing conversations:", error);
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

