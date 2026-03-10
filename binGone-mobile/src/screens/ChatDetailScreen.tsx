import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { NavigationProp, RootStackParamList } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../services/api';

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

interface ChatDetailScreenProps {
  navigation: NavigationProp;
  route: ChatDetailRouteProp;
}

const ChatDetailScreen: React.FC<ChatDetailScreenProps> = ({ navigation, route }) => {
  const { threadId, userName, userAvatar } = route.params;
  const { user } = useAuth();
  const { 
    sendMessage, 
    messages, 
    joinThread, 
    leaveCurrentThread,
    typingUsers,
    loadThreads
  } = useChat();
  const [input, setInput] = useState('');
  const [_isLoading, _setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Get typing status for current thread
  const otherUserTyping = threadId ? (typingUsers[threadId] || []).some(userId => userId !== user?.id) : false;

  // Join thread when component mounts
  useEffect(() => {
    if (threadId) {
      console.log('🔄 Joining thread:', threadId);
      joinThread(threadId);
    }

    return () => {
      leaveCurrentThread();
    };
  }, [threadId]); // Only depend on threadId

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const scrollToBottom = () => {
        flatListRef.current?.scrollToEnd({ animated: true });
      };
      
      // Multiple scroll attempts to ensure it works
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
      setTimeout(scrollToBottom, 600);
    }
  }, [messages.length]); // Scroll when messages count changes

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !threadId || !user?.id) {
      console.log('❌ Cannot send message - missing requirements:', { 
        hasInput: !!input.trim(), 
        hasThreadId: !!threadId, 
        hasUserId: !!user?.id 
      });
      return;
    }

    const messageContent = input.trim();
    setInput('');

    try {
      console.log('📤 Attempting to send message:', messageContent);
      
      // Send message via WebSocket
      await sendMessage(messageContent, 'text');
      
      console.log('✅ Message sent successfully');

      // Scroll to bottom after message is sent - multiple attempts to ensure it works
      const scrollToBottom = () => {
        flatListRef.current?.scrollToEnd({ animated: true });
      };
      
      // Immediate scroll
      scrollToBottom();
      
      // Delayed scrolls to catch the message when it appears
      setTimeout(scrollToBottom, 200);
      setTimeout(scrollToBottom, 500);
      setTimeout(scrollToBottom, 1000);

    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  }, [input, threadId, user?.id, sendMessage]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isSent = item.sender.name === user?.name;
    const isRead = item.status === 'read';
    
    return (
      <View style={[styles.messageRow, isSent ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, isSent ? styles.bubbleRight : styles.bubbleLeft]}>
          <Text style={[styles.messageText, isSent ? styles.textRight : styles.textLeft]}>
            {item.content}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            {isSent && isRead ? <Text style={styles.tick}>✓✓</Text> : isSent ? <Text style={styles.tick}>✓</Text> : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader type="other" title="Chat" onBackPress={() => navigation.goBack()} showGpsButton={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={wp(20)}
      >
        {/* Conversation Header */}
        <View style={styles.conversationHeader}>
          <Image 
            source={
              userAvatar 
                ? { uri: userAvatar }
                : require('../assets/images/profile_user.png')
            } 
            style={styles.avatar} 
          />
          <View style={styles.headerTexts}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.lastSeen}>
              {otherUserTyping ? 'Typing...' : 'Last seen today at 6:10 PM'}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            // Auto-scroll when content size changes (new messages)
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          onLayout={() => {
            // Auto-scroll when layout changes
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={colors.gray.medium}
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              !input.trim() && styles.sendButtonDisabled
            ]} 
            activeOpacity={0.8}
            onPress={handleSendMessage}
            disabled={!input.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const AVATAR = wp(10.5);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, marginRight: wp(3) },
  headerTexts: { flex: 1 },
  userName: { fontSize: wp(4.3), color: colors.black, fontFamily: Fonts.MONTSERRAT_BOLD },
  lastSeen: { fontSize: wp(3), color: colors.gray.medium, marginTop: wp(0.5), fontFamily: Fonts.POPPINS_REGULAR },

  list: { flex: 1 },
  listContent: { paddingHorizontal: wp(5), paddingVertical: wp(3) },
  messageRow: { marginVertical: wp(1.2), flexDirection: 'row' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    borderRadius: wp(3),
    paddingVertical: wp(2.5),
    paddingHorizontal: wp(3),
  },
  bubbleLeft: { backgroundColor: '#CFE5E1' },
  bubbleRight: { backgroundColor: '#FFEDC7' },
  messageText: { fontSize: wp(3.6), lineHeight: wp(5), fontFamily: Fonts.POPPINS_REGULAR },
  textLeft: { color: colors.text.black },
  textRight: { color: colors.text.black },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: wp(1.2) },
  time: { fontSize: wp(2.8), color: colors.gray.medium, marginRight: wp(1.2) },
  tick: { fontSize: wp(3.2), color: colors.gray.medium },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: wp(2.2),
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
  },
  input: {
    flex: 1,
    height: wp(13),
    borderWidth: 1,
    borderColor: colors.gray.borderGray,
    borderRadius: wp(5),
    paddingHorizontal: wp(4),
    backgroundColor: colors.white,
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.black,
  },
  sendButton: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(3),
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray.medium,
  },
  sendIcon: { color: colors.white, fontSize: wp(5) },
});

export default ChatDetailScreen;


