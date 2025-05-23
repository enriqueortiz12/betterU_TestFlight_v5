import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Dimensions } from 'react-native';
import { TrainerProvider } from '../../context/TrainerContext';

const { height, width } = Dimensions.get('window');
const isIphoneX = Platform.OS === 'ios' && (height >= 812 || width >= 812);

export default function TabLayout() {
  return (
    <TrainerProvider>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = 'help-circle-outline';

            if (route.name === 'home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'workout') {
              iconName = focused ? 'barbell' : 'barbell-outline';
            } else if (route.name === 'mental') {
              iconName = focused ? 'leaf' : 'leaf-outline';
            } else if (route.name === 'trainer') {
              iconName = focused ? 'fitness' : 'fitness-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#00ffff',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopColor: 'rgba(255, 255, 255, 0.05)',
            paddingTop: 5,
            paddingBottom: Platform.OS === 'ios' ? (isIphoneX ? 25 : 5) : 5,
            height: Platform.OS === 'ios' ? (isIphoneX ? 80 : 60) : 60,
            position: 'absolute',
            elevation: 8,
            shadowColor: '#000',
          },
          headerShown: false,
        })}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="workout" options={{ title: 'Workout' }} />
        <Tabs.Screen name="mental" options={{ title: 'Mental' }} />
        <Tabs.Screen name="trainer" options={{ title: 'Trainer' }} />
        <Tabs.Screen
          name="active-workout"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="workout-summary"
          options={{
              href: null,
            }}
          />
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
            presentation: 'modal',
        }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="pr"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </TrainerProvider>
  );
} 