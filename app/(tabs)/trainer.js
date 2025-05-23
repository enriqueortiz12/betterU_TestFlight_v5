"use client";

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, SafeAreaView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { useTrainer } from '../../context/TrainerContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTracking } from '../../context/TrackingContext';

const TrainerScreen = () => {
  const router = useRouter();
  const { isPremium } = useUser();
  console.warn('[TrainerScreen] isPremium:', isPremium);
  const { userProfile } = useUser();
  const { conversations, sendMessage, clearConversations, isLoading, messageCount } = useTrainer();
  const { stats, trackingData, mood } = useTracking();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || loading || isLoading) return;

    setLoading(true);
    try {
      const result = await sendMessage(input.trim(), { stats, trackingData, mood });
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to send message');
      }
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearMessages = async () => {
    try {
      // Show confirmation dialog
      Alert.alert(
        "Clear Conversations",
        "Are you sure you want to clear all conversations? This cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Clear",
            style: "destructive",
            onPress: async () => {
              const result = await clearConversations();
              if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to clear messages');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error clearing messages:', error);
      Alert.alert('Error', 'Failed to clear messages');
    }
  };

  const renderMessage = ({ item }) => (
    <Animated.View 
      style={[
        styles.message,
        item.sender === 'user' ? styles.userMessage : styles.aiMessage,
      ]}
    >
      {item.sender === 'trainer' && (
        <View style={styles.aiAvatarContainer}>
          <LinearGradient
            colors={['#00ffff', '#0088ff']}
            style={styles.aiAvatar}
          >
            <Ionicons name="fitness" size={16} color="#fff" />
          </LinearGradient>
        </View>
      )}
      <View style={[
        styles.messageContent,
        item.sender === 'user' ? styles.userMessageContent : styles.aiMessageContent
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'user' ? styles.userMessageText : styles.aiMessageText
        ]}>
          {item.message}
        </Text>
      </View>
    </Animated.View>
  );

  const MAX_DAILY_MESSAGES = isPremium ? 100 : 15;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <LinearGradient
        colors={['#00131a', '#00334d', '#000']}
        style={styles.gradient}
      >
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <BlurView intensity={90} tint="dark" style={styles.headerBlur}>
              <LinearGradient
                colors={['rgba(0, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.8)']}
                style={styles.headerGradient}
              >
                <View style={[styles.headerContent, { paddingVertical: 24 }]}>
                  <View style={styles.headerLeft}>
                    <View style={styles.profileAvatar}>
                      <LinearGradient
                        colors={['#00ffff', '#0088ff']}
                        style={styles.avatarGradient}
                      >
                        <Ionicons name="fitness" size={24} color="#fff" />
                      </LinearGradient>
                    </View>
                    <View style={styles.headerText}>
                      <Text style={styles.title}>AI Trainer</Text>
                      <Text style={styles.subtitle}>Your Personalized Fitness Coach</Text>
                    </View>
                  </View>
                  <View style={styles.headerRight}>
                    <View style={[styles.statsContainer, { marginLeft: 16 }]}>
                      <Text style={[
                        styles.messageCount,
                        messageCount >= MAX_DAILY_MESSAGES && styles.messageCountLimit
                      ]}>
                        {`${messageCount}/${MAX_DAILY_MESSAGES}`}
                      </Text>
                      <TouchableOpacity 
                        onPress={clearMessages} 
                        style={styles.clearButton}
                      >
                        <Ionicons name="trash-outline" size={22} color="#00ffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </Animated.View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00ffff" />
              <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={conversations}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.chatContainer}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No messages yet</Text>
                </View>
              }
            />
          )}

          {loading && (
            <BlurView intensity={90} tint="dark" style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#00ffff" />
              <Text style={styles.uploadingText}>Thinking...</Text>
            </BlurView>
          )}

          <BlurView intensity={40} tint="dark" style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={(text) => {
                  if (text.length <= 100) {
                    setInput(text);
                  }
                }}
                placeholder="Ask your AI trainer... (100 chars max)"
                placeholderTextColor="#00ffff99"
                editable={!loading && !isLoading && messageCount < MAX_DAILY_MESSAGES}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                multiline
                maxLength={100}
                maxHeight={100}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={!input.trim() || loading || isLoading || messageCount >= MAX_DAILY_MESSAGES}
              >
                <LinearGradient
                  colors={
                    !input.trim() || loading || isLoading || messageCount >= MAX_DAILY_MESSAGES
                      ? ['#333', '#222']
                      : ['#00ffff', '#0088ff']
                  }
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={26} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 255, 0.1)',
  },
  headerBlur: {
    overflow: 'hidden',
  },
  headerGradient: {
    paddingBottom: 15,
  },
  headerContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#00ffff',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  messageCount: {
    color: '#00ffff',
    fontWeight: 'bold',
    marginRight: 10,
    fontSize: 14,
  },
  messageCountLimit: {
    color: '#ff4444',
  },
  clearButton: {
    padding: 5,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  message: {
    flexDirection: 'row',
    marginVertical: 10,
    paddingHorizontal: 8,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    padding: 14,
    borderRadius: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userMessageContent: {
    backgroundColor: '#00ffff',
    borderRadius: 22,
    borderTopRightRadius: 8,
    padding: 18,
    marginBottom: 2,
  },
  aiMessageContent: {
    backgroundColor: 'rgba(34, 34, 34, 0.85)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#00ffff55',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    padding: 18,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#000',
    fontWeight: '500',
  },
  aiMessageText: {
    color: '#fff',
  },
  aiAvatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  uploadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.1)',
    overflow: 'hidden',
    paddingBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    maxHeight: 120,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sendButton: {
    width: 50,
    height: 50,
  },
  sendButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default TrainerScreen; 