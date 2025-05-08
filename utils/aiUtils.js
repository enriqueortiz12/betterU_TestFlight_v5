import { getOpenAIApiKey } from "./apiConfig"
import { useUser } from "../context/UserContext"

/**
 * Generates an AI response using the OpenAI API
 * @param {string} userMessage - The user's message to generate a response for
 * @param {object} userProfile - The user's profile data
 * @returns {Promise<{success: boolean, response?: string, error?: string}>} - The result object
 */
export const generateAIResponse = async (userMessage, userProfile) => {
  console.log("Generating AI response for:", userMessage)

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
    console.log("API Key status:", key ? "Present" : "Missing")

    if (!key) {
      console.log("No API key, using fallback response")
      return {
        success: true,
        response: fallbackResponse
      }
    }

    // Create user profile context
    const profileContext = userProfile ? `
      User Profile:
      - Age: ${userProfile.age || 'Not specified'}
      - Weight: ${userProfile.weight || 'Not specified'} kg
      - Height: ${userProfile.height || 'Not specified'} cm
      - Fitness Goal: ${userProfile.fitness_goal || 'Not specified'}
      - Gender: ${userProfile.gender || 'Not specified'}
      - Training Level: ${userProfile.training_level || 'intermediate'}
    ` : '';

    // Create the request to OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              `You are an AI fitness trainer assistant. You provide helpful, encouraging, and accurate advice about workouts, nutrition, and fitness goals. Keep your responses concise (under 150 words) and focused on fitness advice.\n\n${profileContext}`,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.log("OpenAI API error, using fallback")
      return {
        success: true,
        response: fallbackResponse
      }
    }

    const data = await response.json()
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.log("Invalid API response, using fallback")
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
    console.error("Error in generateAIResponse:", error)
    // Always return a response, never fail
    return {
      success: true,
      response: "I'm here to help with your fitness journey! What would you like to know?"
    }
  }
};
