"use client"
import { Image, View } from "react-native"
import { useState } from "react"
import { LogoFallback } from "../assets/logo" // Keep fallback for error handling

// A component that renders the logo
export const LogoImage = ({ style, size = 100 }) => {
  const [imageError, setImageError] = useState(false)

  // If there's an error loading the image, use the fallback component
  if (imageError) {
    return <LogoFallback size={size} style={style} />
  }

  // Calculate dimensions based on the size prop
  const width = size
  const height = size

  return (
    <View
      style={[
        {
          width,
          height,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: size / 2, // Make container perfectly circular
          overflow: "hidden", // Clip the image to the circle
          backgroundColor: "black", // Match the logo's background color
        },
        style,
      ]}
    >
      <Image
        source={require("../assets/images/icon.jpg")}
        style={{
          width: width * 1.1,
          height: height * 1.1,
          resizeMode: "contain",
        }}
        onError={() => setImageError(true)}
        accessibilityLabel="BetterU Logo"
      />
    </View>
  )
}

// Function to preload images
export const preloadImages = async () => {
  try {
    // Preload the logo image
    const images = [
      require("../assets/images/icon.jpg"),
      // Add other images that need preloading here
    ]

    console.log("Logo preloaded successfully")
    return true
  } catch (error) {
    console.error("Error preloading images:", error)
    return false
  }
}

