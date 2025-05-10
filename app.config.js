export default {
  expo: {
    name: "BetterU",
    slug: "betterU_TestFlight_v5",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.jpg",
    userInterfaceStyle: "light",
    scheme: "betteru",
    splash: {
      image: "./assets/images/splash-icon.jpg",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.enriqueortiz.betteru",
      buildNumber: "7",
      deploymentTarget: "16.0",
      useFrameworks: "static",
      buildConfiguration: "Release",
      otherCplusplusFlags: "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to let you take profile pictures.",
        NSPhotoLibraryUsageDescription: "This app uses the photo library to let you select profile pictures.",
        NSPhotoLibraryAddUsageDescription: "This app uses the photo library to save workout progress images.",
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["remote-notification"],
        CFBundleAllowMixedLocalizations: true
      }
    },
    android: {
      package: "com.enriqueortiz.betteru",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.jpg",
        backgroundColor: "#ffffff"
      }
    },
    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "16.0",
            "useFrameworks": "static",
            "buildConfiguration": "Release",
            "otherCplusplusFlags": "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
            "clangCxxLanguageStandard": "c++17",
            "clangCxxLibrary": "libc++"
          }
        }
      ],
      "expo-image-picker",
      "expo-splash-screen"
    ],
    experiments: {
      tsconfigPaths: true
    },
    extra: {
      eas: {
        projectId: "66752963-da67-4c91-a146-db94dab08773"
      },
      openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY
    },
    owner: "enrique_ortiz22",
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/66752963-da67-4c91-a146-db94dab08773"
    }
  }
}; 