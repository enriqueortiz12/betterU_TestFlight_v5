import { Redirect } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  text: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
}); 