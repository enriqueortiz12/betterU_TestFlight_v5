"use client"

import React, { useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { View, Text, StyleSheet, ActivityIndicator, Platform, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import 'expo-router/entry';

// Import context providers and hooks
import { AuthProvider, useAuth } from "./context/AuthContext"
import { UserProvider } from "./context/UserContext"
import { TrainerProvider } from "./context/TrainerContext"

// Import image utilities
import { LogoImage, preloadImages } from "./utils/imageUtils"

// Auth Screens
import LoginScreen from "./screens/LoginScreen"
import SignUpScreen from "./screens/SignUpScreen"
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen"
import ResetPasswordScreen from "./screens/ResetPasswordScreen"

// Onboarding Screens
import OnboardingScreen from "./screens/onboarding/OnboardingScreen"

// Main Screens
import HomeScreen from "./screens/HomeScreen"
import ProfileScreen from "./screens/ProfileScreen"
import WorkoutScreen from "./screens/WorkoutScreen"
import PRScreen from "./screens/PRScreen"
import GoalsScreen from "./screens/GoalsScreen"
import LoadingScreen from "./screens/LoadingScreen"

// Trainer Screens
import TrainerScreen from "./screens/TrainerScreen"
import WorkoutAnalysisScreen from "./screens/WorkoutAnalysisScreen"
import WorkoutRecommendationScreen from "./screens/WorkoutRecommendationScreen"

// New Screens
import ActiveWorkoutScreen from "./screens/ActiveWorkoutScreen"
import WorkoutLogScreen from "./screens/WorkoutLogScreen"
import FormAnalysisSelectionScreen from "./screens/FormAnalysisSelectionScreen"

// Add the import for MentalWellnessScreen at the top of the file with the other screen imports:
import MentalWellnessScreen from "./screens/MentalWellnessScreen"

// Add the import for SessionDetailScreen at the top of the file with the other screen imports:
import SessionDetailScreen from "./screens/SessionDetailScreen"

// Add the import for SettingsScreen at the top of the file with the other screen imports:
import SettingsScreen from "./screens/SettingsScreen"

// Add the import for TrainingPlansScreen
import TrainingPlansScreen from "./screens/TrainingPlansScreen"

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window")
const isIphoneX = Platform.OS === "ios" && (height >= 812 || width >= 812)

// Create the navigation stacks
const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Update the tab bar style to make it more compact and not push content up
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "help-circle-outline" // Default fallback

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "WorkoutTab") {
            iconName = focused ? "barbell" : "barbell-outline"
          } else if (route.name === "MentalTab") {
            iconName = focused ? "leaf" : "leaf-outline"
          } else if (route.name === "TrainerTab") {
            iconName = focused ? "fitness" : "fitness-outline"
          } else if (route.name === "PRTab") {
            iconName = focused ? "trophy" : "trophy-outline"
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline"
          }

          // Always return a valid component
          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#0099ff",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#121212",
          borderTopColor: "rgba(255, 255, 255, 0.1)",
          paddingTop: 5,
          paddingBottom: Platform.OS === "ios" ? (isIphoneX ? 25 : 5) : 5,
          height: Platform.OS === "ios" ? (isIphoneX ? 80 : 60) : 60,
          position: "absolute", // Make tab bar float over content
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === "ios" ? (isIphoneX ? 10 : 5) : 5,
        },
        headerShown: false,
        tabBarShowLabel: true,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="WorkoutTab" component={WorkoutScreen} options={{ tabBarLabel: "Workouts" }} />
      <Tab.Screen name="MentalTab" component={MentalWellnessScreen} options={{ tabBarLabel: "Mental" }} />
      <Tab.Screen name="TrainerTab" component={TrainerScreen} options={{ tabBarLabel: "AI Trainer" }} />
      <Tab.Screen name="PRTab" component={PRScreen} options={{ tabBarLabel: "PRs" }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  )
}

// Initial loading component
const InitialLoading = () => {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.logoContainer}>
        <LogoImage style={styles.logo} />
      </View>
      <ActivityIndicator size="large" color="#0099ff" />
      <Text style={styles.loadingText}>Loading BetterU...</Text>
    </View>
  )
}

// This component will be rendered inside NavigationContainer
const MainNavigator = () => {
  const { user, isLoading: authLoading } = useAuth()
  const [initialRoute, setInitialRoute] = useState(null)
  const [isReady, setIsReady] = useState(false)

  // Simplify the navigation logic
  React.useEffect(() => {
    console.log("MainNavigator: Determining initial route, auth loading:", authLoading)

    const setupNavigation = async () => {
      try {
        if (!user) {
          console.log("MainNavigator: No user, setting route to Login")
          setInitialRoute("Login")
        } else {
          console.log("MainNavigator: User found, setting route to Main")
          setInitialRoute("Main")
        }
      } catch (error) {
        console.error("MainNavigator: Error setting up navigation:", error)
        // Default to Main on error if user exists, Login otherwise
        setInitialRoute(user ? "Main" : "Login")
      } finally {
        setIsReady(true)
      }
    }

    if (!authLoading) {
      setupNavigation()
    }
  }, [user, authLoading])

  // Show loading screen until everything is ready
  if (authLoading || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" }}>
        <ActivityIndicator size="large" color="#0099ff" />
        <Text style={{ color: "white", marginTop: 10 }}>Loading...</Text>
      </View>
    )
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "black" },
        animation: "slide_from_right",
      }}
    >
      {user ? (
        // Authenticated routes
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Goals" component={GoalsScreen} />
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="FormAnalysisSelection" component={FormAnalysisSelectionScreen} />
          <Stack.Screen name="WorkoutAnalysis" component={WorkoutAnalysisScreen} />
          <Stack.Screen name="WorkoutRecommendation" component={WorkoutRecommendationScreen} />
          <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
          <Stack.Screen name="WorkoutLog" component={WorkoutLogScreen} />
          <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="TrainingPlans" component={TrainingPlansScreen} />
        </>
      ) : (
        // Unauthenticated routes
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

// Navigation component that handles auth state
const AppNavigator = () => {
  const [initialLoading, setInitialLoading] = React.useState(true)

  // Simulate initial app loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    // Preload images when the app starts
    preloadImages()
  }, [])

  if (initialLoading) {
    return <InitialLoading />
  }

  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  )
}

// Main App component
const App = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <TrainerProvider>
          <AppNavigator />
        </TrainerProvider>
      </UserProvider>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  logoContainer: {
    marginBottom: 20,
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#fff",
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    color: "#ff6b6b",
    textAlign: "center",
    paddingHorizontal: 20,
  },
})

export default App
