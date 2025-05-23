import { getOpenAIApiKey } from "./apiConfig"
import { useUser } from "../context/UserContext"
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Generates an AI response using the OpenAI API
 * @param {string} userMessage - The user's message to generate a response for
 * @param {object} userData - The user's full data (profile, stats, history, PRs, goals, mood, etc)
 * @param {string} systemPrompt - The system prompt for the AI
 * @returns {Promise<{success: boolean, response?: string, error?: string}>} - The result object
 */
export const generateAIResponse = async (userMessage, userData = {}, systemPrompt = '') => {
  console.warn('=== AI TRAINER MESSAGE SENT: generateAIResponse CALLED ===');
  console.warn('[AI] generateAIResponse called');
  console.log("[AI] Generating AI response for:", userMessage)

  try {
    // Fallback responses for development/demo
    const fallbackResponses = [
      "I understand you want to know about fitness. Let me help you with that!",
      "That's a great question about health and wellness. Here's what I think...",
      "I can help you with your fitness journey. Let's work on that together!",
      "Thanks for asking! Here's my suggestion for your workout routine...",
      "I'm here to support your fitness goals. Let's break this down..."
    ];

    // Get a random fallback response
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    // Get the API key
    const key = await getOpenAIApiKey()
    console.log("[AI] API Key status:", key ? "Present" : "Missing", "Key:", key ? key.slice(0, 8) + '...' : '');

    if (!key) {
      console.log("[AI] No API key, using fallback response")
      return {
        success: true,
        response: fallbackResponse
      }
    }

    // Get conversation history from AsyncStorage
    let conversationHistory = [];
    try {
      const storedConversations = await AsyncStorage.getItem('trainerConversations');
      if (storedConversations) {
        conversationHistory = JSON.parse(storedConversations);
      }
    } catch (error) {
      console.error("[AI] Error loading conversation history:", error);
    }

    // Format conversation history for context
    const conversationMessages = conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message
    }));

    // Compose a context message with all user data
    const contextMessage = userData && Object.keys(userData).length > 0
      ? `User Data Context (for reference, use when relevant):\n${JSON.stringify(userData, null, 2)}`
      : '';

    // Prepare the request payload
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [
        systemPrompt ? { role: "system", content: systemPrompt } : { role: "system", content: "You are an AI fitness trainer assistant. You provide helpful, encouraging, and accurate advice about workouts, nutrition, and fitness goals. Keep your responses concise and focused on fitness advice. Always maintain context from previous messages in the conversation." },
        contextMessage ? { role: "system", content: contextMessage } : null,
        ...conversationMessages,
        { role: "user", content: userMessage },
      ].filter(Boolean),
      max_tokens: 500,
      temperature: 0.7,
    };
    console.log("[AI] OpenAI request payload:", JSON.stringify(payload, null, 2));

    // Create the request to OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    })

    console.log("[AI] OpenAI API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("[AI] OpenAI API error, using fallback. Error:", errorText);
      return {
        success: true,
        response: fallbackResponse
      }
    }

    const data = await response.json()
    console.log("[AI] OpenAI API raw response:", JSON.stringify(data, null, 2));
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.log("[AI] Invalid API response, using fallback")
      return {
        success: true,
        response: fallbackResponse
      }
    }

    return {
      success: true,
      response: data.choices[0].message.content
    }
  } catch (error) {
    console.error("[AI] Error in generateAIResponse:", error)
    // Always return a response, never fail
    return {
      success: true,
      response: "I'm here to help with your fitness journey! What would you like to know?"
    }
  }
};

/**
 * Generates a personalized workout using the OpenAI API
 * @param {object} userData - The user's profile data (training level, goals, etc)
 * @returns {Promise<{success: boolean, workout?: object, error?: string}>} - The result object
 */
export const generateWorkout = async (userData = {}) => {
  console.log("[AI] Generating workout for user:", userData);

  try {
    // Get the API key
    const key = await getOpenAIApiKey();
    if (!key) {
      console.log("[AI] No API key available for workout generation");
      return {
        success: false,
        error: "API key not available"
      };
    }

    // Create a system prompt for workout generation
    const systemPrompt = `You are an expert fitness trainer creating personalized workouts. 
    Create a workout based on the user's profile data and their specific request. 
    The workout should include:
    - A name
    - A list of 5-6 exercises
    - For each exercise: name, target muscles, instructions, and sets/reps
    - Format the response as a JSON object with this exact structure:
    {
      "name": "Workout Name",
      "exercises": [
        {
          "name": "Exercise Name",
          "target_muscles": "Target Muscles",
          "instructions": "Exercise Instructions",
          "sets": 3,
          "reps": "8-12"
        }
      ]
    }
    - Keep exercises appropriate for the user's training level
    - Focus on the user's fitness goals
    - Return ONLY the JSON object, no other text`;

    // Prepare the request payload
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a workout for this user profile: ${JSON.stringify(userData)}. The user specifically wants: ${userData.custom_prompt}` }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    };

    // Make the API call
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI] Workout generation failed:", errorText);
      return {
        success: false,
        error: "Failed to generate workout"
      };
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]?.message?.content) {
      return {
        success: false,
        error: "Invalid response from AI"
      };
    }

    // Parse the workout data from the response
    try {
      const workoutData = JSON.parse(data.choices[0].message.content);
      return {
        success: true,
        workout: workoutData
      };
    } catch (parseError) {
      console.error("[AI] Failed to parse workout data:", parseError);
      return {
        success: false,
        error: "Failed to parse workout data"
      };
    }
  } catch (error) {
    console.error("[AI] Error in generateWorkout:", error);
    return {
      success: false,
      error: error.message
    };
  }
};
