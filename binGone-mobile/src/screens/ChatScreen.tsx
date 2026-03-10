import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import AppHeader from '../components/AppHeader';
import SearchBar from '../components/SearchBar';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { NavigationProp } from '../types/navigation';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { ChatThread } from '../services/api';

interface ChatScreenProps {
  navigation: NavigationProp;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const { user } = useAuth();
  const { 
    threads, 
    loadingThreads, 
    isConnected, 
    refreshThreads
  } = useChat();

  // Refresh threads every time the screen is opened to ensure user sees only their chats
  useEffect(() => {
    console.log('🔄 ChatScreen mounted, refreshing threads to ensure proper filtering...');
    refreshThreads();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Note: Removed useFocusEffect to prevent infinite API calls
  // The useEffect above will handle initial load

  const filteredThreads = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return threads;
    
    return threads.filter(thread => {
      const donorName = thread.donor.name.toLowerCase();
      const receiverName = thread.receiver.name.toLowerCase();
      const listingTitle = thread.listing.title.toLowerCase();
      const lastMessage = thread.lastMessage?.content.toLowerCase() || '';
      
      return donorName.includes(trimmed) || 
             receiverName.includes(trimmed) || 
             listingTitle.includes(trimmed) ||
             lastMessage.includes(trimmed);
    });
  }, [threads, query]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getOtherUser = (thread: ChatThread) => {
    // Return the other user's info (not the current user)
    if (user?.name === thread.donor.name) {
      return thread.receiver;
    } else {
      return thread.donor;
    }
  };

  const isUserOnline = (thread: ChatThread) => {
    // Note: Online status check would go here
    // For now, we'll return false as user IDs aren't included in the response
    console.log('Checking online status for thread:', thread.id);
    return false;
  };

  const renderItem = ({ item }: { item: ChatThread }) => {
    const otherUser = getOtherUser(item);
    const isOnline = isUserOnline(item);
    
    // Check if the last message was sent by the current user
    const isLastMessageFromCurrentUser = item.lastMessage?.sender?.name === user?.name;
    
    // Debug logging for unread message display
    if (item.unreadCount > 0) {
      console.log('🎨 ChatScreen - Thread:', item.id, 'Unread:', item.unreadCount, 'Last sender:', item.lastMessage?.sender?.name, 'Show badge:', !isLastMessageFromCurrentUser);
    }
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ChatDetail', { 
          userName: otherUser.name,
          threadId: item.id,
          otherUserName: otherUser.name,
          listingTitle: item.listing?.title
        })}
      >
        <View style={styles.leftBlock}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                otherUser.profileImageUrl 
                  ? { uri: otherUser.profileImageUrl }
                  : require('../assets/images/profile_user.png')
              }
              style={styles.avatar}
            />
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.texts}>
            <Text numberOfLines={1} style={styles.name}>
              {otherUser.name}
            </Text>
            <Text numberOfLines={1} style={styles.listing}>
              Re: {item.listing?.title}
            </Text>
            <Text numberOfLines={1} style={styles.message}>
              {item.lastMessage?.content || 'No messages yet'}
            </Text>
          </View>
        </View>

        <View style={styles.rightBlock}>
          <Text style={styles.time}>
            {item.lastMessageAt ? formatTime(item.lastMessageAt) : ''}
          </Text>
          {item.unreadCount > 0 && !isLastMessageFromCurrentUser && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
          {!isConnected && (
            <View style={styles.offlineIndicator}>
              <Text style={styles.offlineText}>•</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const keyExtractor = (item: ChatThread) => item.id;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No conversations yet</Text>
      <Text style={styles.emptySubtext}>
        Start chatting by contacting donors or receivers about their listings
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.connectionStatus}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.primary : colors.gray.medium }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Connected' : 'Connecting...'}
        </Text>
      </View>
    </View>
  );

  if (loadingThreads) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          type="other"
          title="Chat"
          onBackPress={() => navigation.goBack()}
          showGpsButton={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        type="other"
        title="Chat"
        onBackPress={() => navigation.goBack()}
        showGpsButton={false}
      />
      
      {renderHeader()}
      
      <SearchBar
        placeholder="Search conversations..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      <FlatList
        data={filteredThreads}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          filteredThreads.length === 0 && styles.emptyListContent
        ]}
        showsVerticalScrollIndicator={false}
        onRefresh={refreshThreads}
        refreshing={loadingThreads}
      />
    </SafeAreaView>
  );
};

const AVATAR_SIZE = wp(12);

// Move ItemSeparator outside component to avoid re-renders
const ItemSeparator = () => <View style={separatorStyle} />;

const separatorStyle = {
  height: 1,
  backgroundColor: colors.gray.light,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  search: {
    marginTop: wp(2),
    marginBottom: wp(2),
  },
  headerContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: wp(2),
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    marginRight: wp(1.5),
  },
  statusText: {
    fontSize: wp(3),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  listContent: {
    paddingHorizontal: wp(5),
    paddingBottom: wp(4),
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: wp(3),
    fontSize: wp(4),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  emptyText: {
    fontSize: wp(4.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.text.black,
    textAlign: 'center',
    marginBottom: wp(2),
  },
  emptySubtext: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    textAlign: 'center',
    lineHeight: wp(5),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: wp(3.5),
  },
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginRight: wp(3.5),
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: wp(3.5),
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  texts: {
    flex: 1,
  },
  name: {
    fontSize: wp(4.4),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginBottom: wp(0.3),
  },
  listing: {
    fontSize: wp(3),
    color: colors.primary,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginBottom: wp(0.3),
  },
  message: {
    fontSize: wp(3.2),
    color: '#7B858C',
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  rightBlock: {
    alignItems: 'flex-end',
    marginLeft: wp(3),
  },
  time: {
    fontSize: wp(3),
    color: '#7B858C',
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  badge: {
    marginTop: wp(1.5),
    minWidth: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(1.5),
  },
  badgeText: {
    color: colors.white,
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  offlineIndicator: {
    marginTop: wp(1),
  },
  offlineText: {
    fontSize: wp(4),
    color: colors.gray.light,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray.light,
  },
});

export default ChatScreen;


