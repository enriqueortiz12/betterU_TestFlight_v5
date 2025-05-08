import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const WorkoutLogsScreen = () => {
  const router = useRouter();

  // Example log data - in a real app, this would come from a database
  const workoutLogs = [
    {
      id: 1,
      date: 'Today',
      type: 'Push Day',
      duration: '45 min',
      exercises: [
        { name: 'Bench Press', sets: '4x8', weight: '185 lbs' },
        { name: 'Military Press', sets: '3x10', weight: '135 lbs' },
      ],
    },
    {
      id: 2,
      date: 'Yesterday',
      type: 'Pull Day',
      duration: '50 min',
      exercises: [
        { name: 'Barbell Row', sets: '4x8', weight: '165 lbs' },
        { name: 'Pull-ups', sets: '3x10', weight: 'Body weight' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Workout Logs</Text>
        <View style={styles.placeholder} />
      </View>

      {workoutLogs.map((log) => (
        <TouchableOpacity key={log.id} style={styles.logCard}>
          <View style={styles.logHeader}>
            <View>
              <Text style={styles.logDate}>{log.date}</Text>
              <Text style={styles.logType}>{log.type}</Text>
            </View>
            <View style={styles.logMeta}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.logDuration}>{log.duration}</Text>
            </View>
          </View>

          <View style={styles.exercisesList}>
            {log.exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.exerciseDetails}>
                  <Text style={styles.exerciseText}>{exercise.sets}</Text>
                  <Text style={styles.exerciseText}>•</Text>
                  <Text style={styles.exerciseText}>{exercise.weight}</Text>
                </View>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  logCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  logDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  logType: {
    fontSize: 14,
    color: '#666',
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logDuration: {
    fontSize: 14,
    color: '#666',
  },
  exercisesList: {
    gap: 10,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 14,
    color: '#fff',
  },
  exerciseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseText: {
    fontSize: 14,
    color: '#666',
  },
});

export default WorkoutLogsScreen; 