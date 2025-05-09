"use client"

import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "../lib/supabase"

// Create user context
const UserContext = createContext({})

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    goal: "",
    trainingLevel: "intermediate",
    fitness_goal: "",
    gender: ""
  })

  const [personalRecords, setPersonalRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Sync profile from Supabase to context and AsyncStorage
  const syncProfileFromSupabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) {
        console.error('Error fetching profile from Supabase:', error);
        return;
      }
      if (data) {
        console.log("Profile data from Supabase:", data); // Debug log
        setUserProfile(data);
        await AsyncStorage.setItem('userProfile', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error in syncProfileFromSupabase:', err);
    }
  };

  // Load user data from storage and then sync from Supabase
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        // Load profile from AsyncStorage
        const profileData = await AsyncStorage.getItem('userProfile');
        if (profileData) {
          try {
            const parsedProfile = JSON.parse(profileData);
            console.log("Profile data from AsyncStorage:", parsedProfile); // Debug log
            setUserProfile(parsedProfile);
          } catch (parseError) {
            console.error('Error parsing profile data:', parseError);
            // If parsing fails, clear the corrupted data
            await AsyncStorage.removeItem('userProfile');
          }
        }

        // Load PRs from Supabase with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        while (retryCount < maxRetries) {
          try {
            await loadPersonalRecordsFromSupabase();
            break;
          } catch (error) {
            console.error(`Error loading PRs (attempt ${retryCount + 1}/${maxRetries}):`, error);
            retryCount++;
            if (retryCount === maxRetries) {
              setPersonalRecords([]);
            } else {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }

        // Sync profile from Supabase with retry logic
        retryCount = 0;
        while (retryCount < maxRetries) {
          try {
            await syncProfileFromSupabase();
            break;
          } catch (error) {
            console.error(`Error syncing profile (attempt ${retryCount + 1}/${maxRetries}):`, error);
            retryCount++;
            if (retryCount === maxRetries) {
              // Keep existing profile data if sync fails
              console.log('Keeping existing profile data after failed sync');
            } else {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setPersonalRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Update the loadPersonalRecordsFromSupabase function to properly handle RLS
  const loadPersonalRecordsFromSupabase = async () => {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("No authenticated user found, using empty PR array")
        setPersonalRecords([])
        return
      }

      // Fetch PRs from Supabase - make sure we're using the authenticated client
      const { data, error } = await supabase
        .from("personal_records")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching PRs from Supabase:", error)
        // Fall back to empty array
        setPersonalRecords([])
        return
      }

      if (data && data.length > 0) {
        console.log("Loaded PRs from Supabase:", data.length)

        // Check if we have any local PRs in AsyncStorage
        const localPRsJson = await AsyncStorage.getItem("personalRecords")
        let localPRs = []

        if (localPRsJson) {
          try {
            localPRs = JSON.parse(localPRsJson)
          } catch (e) {
            console.error("Error parsing local PRs:", e)
          }
        }

        // If we have local PRs, we need to map the IDs
        if (Array.isArray(localPRs) && localPRs.length > 0) {
          console.log("Found local PRs, mapping IDs...")

          // Create a map of exercise names to Supabase UUIDs
          const exerciseToUUIDMap = {}
          data.forEach((pr) => {
            exerciseToUUIDMap[pr.exercise] = pr.id
          })

          // Update local PRs with Supabase UUIDs where possible
          const updatedLocalPRs = localPRs.map((localPR) => {
            if (exerciseToUUIDMap[localPR.exercise]) {
              return {
                ...localPR,
                id: exerciseToUUIDMap[localPR.exercise],
              }
            }
            return localPR
          })

          // Save the updated local PRs back to AsyncStorage
          await AsyncStorage.setItem("personalRecords", JSON.stringify(updatedLocalPRs))
        }

        setPersonalRecords(data)
      } else {
        console.log("No PRs found in Supabase, initializing with empty array")
        // If no PRs exist yet, initialize with empty array instead of defaults
        setPersonalRecords([])
      }
    } catch (error) {
      console.error("Error in loadPersonalRecordsFromSupabase:", error)
      setPersonalRecords([])
    }
  }

  // Initialize default PRs in Supabase - MODIFIED to not add default PRs
  const initializeDefaultPRs = async (userId) => {
    try {
      // Instead of adding default PRs, we'll just set an empty array
      console.log("Initializing with empty PR array for user:", userId)
      setPersonalRecords([])
      return { success: true }
    } catch (error) {
      console.error("Error in initializeDefaultPRs:", error)
      setPersonalRecords([])
      return { success: false, error: error.message }
    }
  }

  // Save profile changes
  const updateProfile = async (newProfile) => {
    try {
      const updatedProfile = { ...userProfile, ...newProfile }
      setUserProfile(updatedProfile)
      await AsyncStorage.setItem("userProfile", JSON.stringify(updatedProfile))
      return { success: true }
    } catch (error) {
      console.error("Error updating profile:", error)
      return { success: false, error: error.message }
    }
  }

  // Add a new PR - Updated to use Supabase
  const addPersonalRecord = async (newPR) => {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { success: false, error: "No authenticated user found" }
      }

      // Prepare PR data with user_id
      const prData = {
        ...newPR,
        user_id: user.id,
        date: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
      }

      // Insert into Supabase
      const { data, error } = await supabase.from("personal_records").insert(prData).select()

      if (error) {
        console.error("Error adding PR to Supabase:", error)
        return { success: false, error: error.message }
      }

      // Update local state
      const newRecord = data[0]
      setPersonalRecords((prevRecords) => [newRecord, ...prevRecords])

      return { success: true, data: newRecord }
    } catch (error) {
      console.error("Error in addPersonalRecord:", error)
      return { success: false, error: error.message }
    }
  }

  // Update an existing PR - Updated to use Supabase
  const updatePersonalRecord = async (prId, updatedData) => {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { success: false, error: "No authenticated user found" }
      }

      // Check if the ID is a UUID or a simple ID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prId)

      if (!isUUID) {
        console.log("Non-UUID ID detected:", prId)

        // For non-UUID IDs, we need to find the record by exercise name instead
        // First, get the current PR to find its exercise name
        const prToUpdate = personalRecords.find((pr) => pr.id === prId)

        if (!prToUpdate) {
          return { success: false, error: "PR record not found" }
        }

        // Try to find the record in Supabase by exercise name
        const { data: existingRecords, error: fetchError } = await supabase
          .from("personal_records")
          .select("*")
          .eq("user_id", user.id)
          .eq("exercise", prToUpdate.exercise)

        if (fetchError) {
          console.error("Error fetching PR by exercise:", fetchError)
          return { success: false, error: fetchError.message }
        }

        if (existingRecords && existingRecords.length > 0) {
          // Update the existing record
          const { data, error } = await supabase
            .from("personal_records")
            .update(updatedData)
            .eq("id", existingRecords[0].id)
            .eq("user_id", user.id)
            .select()

          if (error) {
            console.error("Error updating PR in Supabase:", error)
            return { success: false, error: error.message }
          }

          // Update local state with the new data
          setPersonalRecords((prevRecords) =>
            prevRecords.map((pr) => (pr.id === prId ? { ...pr, ...updatedData, id: existingRecords[0].id } : pr)),
          )

          return { success: true, data: data[0] }
        } else {
          // If no record found, create a new one
          const newPrData = {
            ...prToUpdate,
            ...updatedData,
            user_id: user.id,
            date: new Date().toISOString().split("T")[0],
          }

          // Remove the old ID to let Supabase generate a new UUID
          delete newPrData.id

          const { data, error } = await supabase.from("personal_records").insert(newPrData).select()

          if (error) {
            console.error("Error creating new PR in Supabase:", error)
            return { success: false, error: error.message }
          }

          // Update local state
          setPersonalRecords((prevRecords) => prevRecords.map((pr) => (pr.id === prId ? data[0] : pr)))

          return { success: true, data: data[0] }
        }
      }

      // For UUID IDs, proceed with normal update
      const { data, error } = await supabase
        .from("personal_records")
        .update(updatedData)
        .eq("id", prId)
        .eq("user_id", user.id)
        .select()

      if (error) {
        console.error("Error updating PR in Supabase:", error)
        return { success: false, error: error.message }
      }

      // Update local state
      setPersonalRecords((prevRecords) => prevRecords.map((pr) => (pr.id === prId ? data[0] : pr)))

      return { success: true, data: data[0] }
    } catch (error) {
      console.error("Error in updatePersonalRecord:", error)
      return { success: false, error: error.message }
    }
  }

  // Delete a PR - Updated to use Supabase
  const deletePersonalRecord = async (prId) => {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { success: false, error: "No authenticated user found" }
      }

      // Check if the ID is a UUID or a simple ID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prId)

      if (!isUUID) {
        console.log("Non-UUID ID detected for deletion:", prId)

        // For non-UUID IDs, we need to find the record by exercise name instead
        const prToDelete = personalRecords.find((pr) => pr.id === prId)

        if (!prToDelete) {
          return { success: false, error: "PR record not found" }
        }

        // Try to find the record in Supabase by exercise name
        const { data: existingRecords, error: fetchError } = await supabase
          .from("personal_records")
          .select("*")
          .eq("user_id", user.id)
          .eq("exercise", prToDelete.exercise)

        if (fetchError) {
          console.error("Error fetching PR by exercise for deletion:", fetchError)
          return { success: false, error: fetchError.message }
        }

        if (existingRecords && existingRecords.length > 0) {
          // Delete the existing record
          const { error } = await supabase
            .from("personal_records")
            .delete()
            .eq("id", existingRecords[0].id)
            .eq("user_id", user.id)

          if (error) {
            console.error("Error deleting PR from Supabase:", error)
            return { success: false, error: error.message }
          }
        }

        // Update local state regardless of whether we found it in Supabase
        setPersonalRecords((prevRecords) => prevRecords.filter((pr) => pr.id !== prId))

        return { success: true }
      }

      // For UUID IDs, proceed with normal delete
      const { error } = await supabase.from("personal_records").delete().eq("id", prId).eq("user_id", user.id)

      if (error) {
        console.error("Error deleting PR from Supabase:", error)
        return { success: false, error: error.message }
      }

      // Update local state
      setPersonalRecords((prevRecords) => prevRecords.filter((pr) => pr.id !== prId))

      return { success: true }
    } catch (error) {
      console.error("Error in deletePersonalRecord:", error)
      return { success: false, error: error.message }
    }
  }

  // Reset PRs to initial data (for debugging) - Updated to use Supabase
  const resetPersonalRecords = async () => {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { success: false, error: "No authenticated user found" }
      }

      // First delete all existing records
      const { error: deleteError } = await supabase.from("personal_records").delete().eq("user_id", user.id)

      if (deleteError) {
        console.error("Error deleting existing PRs:", deleteError)
        return { success: false, error: deleteError.message }
      }

      // Set to empty array instead of initializing with default PRs
      setPersonalRecords([])

      return { success: true }
    } catch (error) {
      console.error("Error in resetPersonalRecords:", error)
      return { success: false, error: error.message }
    }
  }

  // Add this debug function to the UserContext
  const debugPRData = async () => {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("No authenticated user found")
        return { success: false, error: "No authenticated user found" }
      }

      // Fetch PRs from Supabase
      const { data, error } = await supabase.from("personal_records").select("*").eq("user_id", user.id)

      if (error) {
        console.error("Error fetching PRs from Supabase:", error)
        return { success: false, error: error.message }
      }

      // Get local PRs
      const localPRsJson = await AsyncStorage.getItem("personalRecords")
      let localPRs = []

      if (localPRsJson) {
        try {
          localPRs = JSON.parse(localPRsJson)
        } catch (e) {
          console.error("Error parsing local PRs:", e)
        }
      }

      return {
        success: true,
        data: {
          supabasePRs: data,
          localPRs: localPRs,
          currentState: personalRecords,
        },
      }
    } catch (error) {
      console.error("Error in debugPRData:", error)
      return { success: false, error: error.message }
    }
  }

  // Add debugPRData to the context value
  const contextValue = {
    userProfile,
    setUserProfile,
    personalRecords,
    setPersonalRecords,
    isLoading,
    syncProfileFromSupabase,
    debugPRData,
  }

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default { UserProvider, useUser }

