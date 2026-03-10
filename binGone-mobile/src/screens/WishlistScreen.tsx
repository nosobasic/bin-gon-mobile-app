import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { NavigationProp, WishlistItem } from '../types/navigation';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import AppHeader from '../components/AppHeader';
import { getWishlist, removeFromWishlist, WishlistItemApi } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

interface WishlistScreenProps {
  navigation: NavigationProp;
}

// Helper function to transform API data to local WishlistItem format
const transformApiItemToLocal = (apiItem: WishlistItemApi): WishlistItem => {
  const userId = typeof apiItem.userId === 'string' 
    ? apiItem.userId 
    : (apiItem.userId as { _id: string; name: string; email: string; accountType: string })?._id || '';
    
  return {
    id: apiItem._id,
    userId: userId,
    itemName: apiItem.name,
    name: apiItem.name,
    type: apiItem.type || '',
    size: apiItem.size || '',
    priority: apiItem.priority ? apiItem.priority.charAt(0).toUpperCase() + apiItem.priority.slice(1) as 'Low' | 'Medium' | 'High' : 'Medium',
    location: apiItem.location || '',
    coordinates: undefined, // Not provided in new API structure
    notes: apiItem.notes || '',
    createdAt: apiItem.createdAt,
    updatedAt: apiItem.updatedAt,
  };
};

const WishlistScreen: React.FC<WishlistScreenProps> = ({ navigation }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemMenu, setSelectedItemMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch wishlist items from API
  const fetchWishlistItems = async (pageNum = 1, isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getWishlist(pageNum, 10);
      
      const transformedItems = response.items.map(transformApiItemToLocal);
      
      if (pageNum === 1) {
        setWishlistItems(transformedItems);
      } else {
        setWishlistItems(prev => [...prev, ...transformedItems]);
      }
      
      setTotalItems(response.pagination.total);
      setHasMore(pageNum < response.pagination.pages);
      setPage(pageNum);
      
    } catch (error: any) {
      console.error('Error fetching wishlist:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load wishlist items. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWishlistItems(1);
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchWishlistItems(1, true);
    }, [])
  );

  const handleRefresh = () => {
    fetchWishlistItems(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchWishlistItems(page + 1);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      Alert.alert(
        'Delete Item',
        'Are you sure you want to remove this item from your wishlist?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setSelectedItemMenu(null),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setSelectedItemMenu(null);
              // Optimistically update UI
              setWishlistItems(prev => prev.filter(item => item.id !== itemId));
              
              try {
                await removeFromWishlist(itemId);
                // Refresh to get updated counts
                fetchWishlistItems(1, true);
              } catch (error: any) {
                console.error('Error deleting wishlist item:', error);
                // Revert on error
                fetchWishlistItems(page);
                Alert.alert(
                  'Error',
                  error.response?.data?.message || 'Failed to delete item. Please try again.'
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error showing delete alert:', error);
    }
  };

  const handleEditItem = (item: WishlistItem) => {
    setSelectedItemMenu(null);
    navigation.navigate('CreateWishlistItem', { editItem: item });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#FF3B30';
      case 'Medium':
        return '#FF9500';
      case 'Low':
        return '#34C759';
      default:
        return colors.gray.medium;
    }
  };

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#FF3B30';
      case 'Medium':
        return '#FF9500';
      case 'Low':
        return '#34C759';
      default:
        return colors.gray.medium;
    }
  };

  const filteredItems = wishlistItems.filter(item =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.cardTopRow}>
        <View style={[styles.priorityBadge, { borderColor: getPriorityBorderColor(item.priority) }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSelectedItemMenu(selectedItemMenu === item.id ? null : item.id)}
        >
          <Icon name="ellipsis-vertical" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {selectedItemMenu === item.id && (
        <View style={styles.actionMenu}>
          <TouchableOpacity
            style={styles.actionMenuItem}
            onPress={() => handleEditItem(item)}
          >
            <Icon name="pencil-outline" size={18} color="#666" />
            <Text style={styles.actionMenuText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionMenuItem}
            onPress={() => handleDeleteItem(item.id)}
          >
            <Icon name="trash-outline" size={18} color="#666" />
            <Text style={styles.actionMenuText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.itemName}>{item.name || item.itemName}</Text>

      <View style={styles.itemDetails}>
        {item.type && (
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Type</Text>: {item.type}
          </Text>
        )}
        {item.size && (
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Size</Text>: {item.size}
          </Text>
        )}
      </View>

      {item.notes && (
        <Text style={styles.notesText}>"{item.notes}"</Text>
      )}

      {item.location && (
        <View style={styles.locationRow}>
          <Icon name="location-outline" size={16} color="#999" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        type="other"
        title="Outfit Wishlist"
        onBackPress={() => navigation.goBack()}
        showGpsButton={true}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search here..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content */}
      {loading && wishlistItems.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="heart-outline" size={wp(20)} color={colors.gray.medium} />
          <Text style={styles.emptyText}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtext}>Add items you're interested in to your wishlist</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderWishlistItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && wishlistItems.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateWishlistItem')}
        activeOpacity={0.8}
      >
        <Icon name="add" size={wp(7)} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: wp(4),
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  emptyText: {
    marginTop: wp(4),
    fontSize: wp(4.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: wp(2),
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: wp(4),
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(5),
    marginTop: wp(4),
    marginBottom: wp(5),
    paddingHorizontal: wp(4),
    height: wp(13),
    backgroundColor: '#F5F5F5',
    borderRadius: wp(6.5),
  },
  searchIcon: {
    marginRight: wp(2),
  },
  searchInput: {
    flex: 1,
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
  },
  listContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: wp(5),
  },
  itemCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: wp(4),
    padding: wp(5),
    marginBottom: wp(4),
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: wp(3),
  },
  priorityBadge: {
    paddingHorizontal: wp(3.5),
    paddingVertical: wp(1.3),
    borderRadius: wp(5),
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  priorityText: {
    fontSize: wp(2.6),
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  menuButton: {
    padding: wp(1),
  },
  actionMenu: {
    position: 'absolute',
    right: wp(5),
    top: wp(12.5),
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    paddingVertical: wp(2),
    paddingHorizontal: wp(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.15,
    shadowRadius: wp(2),
    elevation: 5,
    zIndex: 1000,
    minWidth: wp(30),
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: wp(2.5),
    paddingHorizontal: wp(3),
  },
  actionMenuText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: '#666',
    marginLeft: wp(3),
  },
  itemName: {
    fontSize: wp(3.7),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(2),
  },
  itemDetails: {
    marginBottom: wp(2),
  },
  detailText: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: '#666',
    marginBottom: wp(1),
  },
  detailLabel: {
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
  },
  notesText: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: '#666',
    marginBottom: wp(3),
    lineHeight: wp(4.8),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: wp(1),
  },
  locationText: {
    fontSize: wp(2.9),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: '#999',
    marginLeft: wp(1),
  },
  fab: {
    position: 'absolute',
    bottom: wp(6),
    right: wp(6),
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: wp(1) },
    shadowOpacity: 0.3,
    shadowRadius: wp(2),
    elevation: 8,
  },
});

export default WishlistScreen;

