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

const MAX_DAILY_MESSAGES = 20;

const TrainerScreen = () => {
  const router = useRouter();
  const { userProfile } = useUser();
  const { conversations, sendMessage, clearConversations, isLoading, messageCount } = useTrainer();
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
      const result = await sendMessage(input.trim());
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

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <LinearGradient
        colors={['#000', '#222', '#000']}
        style={styles.gradient}
      >
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#111', '#000']}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <Text style={styles.title}>AI Trainer</Text>
                <View style={styles.statsContainer}>
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
                    <Ionicons name="trash-outline" size={20} color="#00ffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>

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
            <BlurView intensity={80} style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#00ffff" />
              <Text style={styles.uploadingText}>Thinking...</Text>
            </BlurView>
          )}

          <BlurView intensity={30} style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask your AI trainer..."
                placeholderTextColor="#666"
                editable={!loading && !isLoading && messageCount < MAX_DAILY_MESSAGES}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                multiline
                maxHeight={100}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={!input.trim() || loading || isLoading || messageCount >= MAX_DAILY_MESSAGES}
              >
                <LinearGradient
                  colors={!input.trim() || loading || isLoading || messageCount >= MAX_DAILY_MESSAGES ? ['#333', '#222'] : ['#00ffff', '#0088ff']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={24} color="#fff" />
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
    borderBottomColor: '#222',
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  messageCount: {
    color: '#00ffff',
    fontWeight: 'bold',
    marginRight: 10,
  },
  messageCountLimit: {
    color: '#ff4444',
  },
  clearButton: {
    padding: 5,
  },
  chatContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  message: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  userMessageContent: {
    backgroundColor: '#0099ff',
    borderTopRightRadius: 4,
  },
  aiMessageContent: {
    backgroundColor: '#333',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#ffffff',
  },
  aiMessageText: {
    color: '#ffffff',
  },
  aiAvatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderColor: '#222',
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
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 8,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  sendButton: {
    width: 45,
    height: 45,
  },
  sendButtonGradient: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TrainerScreen; 