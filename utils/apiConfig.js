import AsyncStorage from "@react-native-async-storage/async-storage"
import config from './config';

// Function to securely get the OpenAI API key
export const getOpenAIApiKey = async () => {
  try {
    // Try to get the key from AsyncStorage first
    const storedKey = await AsyncStorage.getItem("openai_api_key");
    if (storedKey) {
      return storedKey;
    }

    // If no stored key, use the environment variable
    const envKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || config.OPENAI_API_KEY;
    if (!envKey) {
      console.error("No API key found in environment variables");
      return null;
    }

    // Store the key for future use
    await AsyncStorage.setItem("openai_api_key", envKey);
    return envKey;
  } catch (error) {
    console.error("Error getting API key:", error);
    return null;
  }
};

// Function to securely set the OpenAI API key
export const setOpenAIApiKey = async (apiKey) => {
  try {
    await AsyncStorage.setItem("openai_api_key", apiKey);
    return true;
  } catch (error) {
    console.error("Error storing API key:", error);
    return false;
  }
};

// Function to verify if the OpenAI API key is valid
export const verifyOpenAIApiKey = async (apiKey) => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message to verify my API key is working.",
          },
        ],
        max_tokens: 10,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("API key verification failed:", data.error);
      return {
        valid: false,
        error: data.error.message || "Invalid API key",
        details: data.error,
      };
    }

    if (data.choices && data.choices.length > 0) {
      return {
        valid: true,
        message: "API key is valid and working correctly",
      };
    }

    return {
      valid: false,
      error: "Unexpected response format",
      details: data,
    };
  } catch (error) {
    console.error("Error verifying API key:", error);
    return {
      valid: false,
      error: error.message || "Network error while verifying API key",
      details: error,
    };
  }
};
