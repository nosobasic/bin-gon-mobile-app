import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { NavigationProp, WishlistItem } from '../types/navigation';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import AppHeader from '../components/AppHeader';
import { getAdminWishlists, updateAdminWishlistItem, deleteAdminWishlistItem, getWishlist, updateWishlistItem, removeFromWishlist, WishlistItemApi } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

interface AdminWishlistScreenProps {
  navigation: NavigationProp;
}

// Helper function to transform API data to local WishlistItem format
const transformApiItemToLocal = (apiItem: WishlistItemApi): WishlistItem => {
  const userId = typeof apiItem.userId === 'string' 
    ? apiItem.userId 
    : (apiItem.userId as { _id: string; name: string; email: string; accountType: string })?._id || '';
  
  const userName = typeof apiItem.userId === 'string' 
    ? 'Unknown User' 
    : (apiItem.userId as { _id: string; name: string; email: string; accountType: string })?.name || 'Unknown User';
    
  return {
    id: apiItem._id,
    userId: userId,
    userName: userName, // Add user name to the item
    itemName: apiItem.name,
    name: apiItem.name,
    type: apiItem.type || '',
    size: apiItem.size || '',
    priority: apiItem.priority ? apiItem.priority.charAt(0).toUpperCase() + apiItem.priority.slice(1) as 'Low' | 'Medium' | 'High' : 'Medium',
    location: apiItem.location || '',
    coordinates: undefined,
    notes: apiItem.notes || '',
    createdAt: apiItem.createdAt,
    updatedAt: apiItem.updatedAt,
  };
};

const AdminWishlistScreen: React.FC<AdminWishlistScreenProps> = ({ navigation }) => {
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

      let response;
      try {
        response = await getAdminWishlists({
          page: pageNum,
          limit: 10,
          search: searchQuery || undefined,
        });
        console.log('Admin wishlists response:', response);
      } catch (adminError) {
        console.log('Admin wishlist API failed, trying regular wishlist API:', adminError);
        // Fallback to regular wishlist API
        const regularResponse = await getWishlist(pageNum, 10);
        response = {
          wishlists: regularResponse.items,
          pagination: regularResponse.pagination
        };
        console.log('Regular wishlist response:', response);
      }
      
      // Handle different possible response structures
      let wishlists: WishlistItemApi[] = [];
      let pagination = { total: 0, totalPages: 0 };
      
      if (response && (response as any).wishlists && Array.isArray((response as any).wishlists)) {
        // Admin endpoint response structure
        wishlists = (response as any).wishlists;
        const responsePagination = (response as any).pagination;
        pagination = {
          total: responsePagination?.total || wishlists.length,
          totalPages: responsePagination?.totalPages || responsePagination?.pages || 1
        };
      } else if (response && (response as any).items && Array.isArray((response as any).items)) {
        // Regular wishlist endpoint response structure
        wishlists = (response as any).items;
        const responsePagination = (response as any).pagination;
        pagination = {
          total: responsePagination?.total || wishlists.length,
          totalPages: responsePagination?.totalPages || responsePagination?.pages || 1
        };
      } else if (response && Array.isArray(response)) {
        // If response is directly an array
        wishlists = response as WishlistItemApi[];
        pagination = { total: wishlists.length, totalPages: 1 };
      } else if (response && (response as any).data && Array.isArray((response as any).data)) {
        // If response has data property
        wishlists = (response as any).data;
        const responsePagination = (response as any).pagination;
        pagination = {
          total: responsePagination?.total || wishlists.length,
          totalPages: responsePagination?.totalPages || responsePagination?.pages || 1
        };
      } else {
        console.warn('Unexpected response structure:', response);
        wishlists = [];
        pagination = { total: 0, totalPages: 0 };
      }
      
      const transformedItems = wishlists.map(transformApiItemToLocal);
      
      if (pageNum === 1) {
        setWishlistItems(transformedItems);
      } else {
        setWishlistItems(prev => [...prev, ...transformedItems]);
      }
      
      setTotalItems(pagination.total);
      setHasMore(pageNum < pagination.totalPages);
      setPage(pageNum);
      
    } catch (error: any) {
      console.error('Error fetching admin wishlists:', error);
      console.error('Error details:', error.response?.data);
      
      // Set empty state on error
      if (pageNum === 1) {
        setWishlistItems([]);
        setTotalItems(0);
      }
      
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
        'Are you sure you want to delete this wishlist item?',
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
                try {
                  await deleteAdminWishlistItem(itemId);
                } catch (adminError) {
                  console.log('Admin delete failed, trying regular delete:', adminError);
                  await removeFromWishlist(itemId);
                }
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
    navigation.navigate('EditWishlistItem', { item });
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

  const filteredItems = wishlistItems.filter(item => {
    return item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.userName || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

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
      
      <Text style={styles.userIdText}>User: {item.userName || 'Unknown User'}</Text>

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

      <Text style={styles.dateText}>
        Created: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        type="other"
        title="Wishlist Management"
        onBackPress={() => navigation.goBack()}
        showGpsButton={false}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search wishlists..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Total Items: {totalItems}</Text>
      </View>

      {/* Content */}
      {loading && wishlistItems.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading wishlists...</Text>
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="heart-outline" size={wp(20)} color={colors.gray.medium} />
          <Text style={styles.emptyText}>No wishlist items found</Text>
          <Text style={styles.emptySubtext}>Wishlist items will appear here when users add them</Text>
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
    marginBottom: wp(3),
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
  statsContainer: {
    marginHorizontal: wp(5),
    marginBottom: wp(3),
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    backgroundColor: colors.primary,
    borderRadius: wp(3),
  },
  statsText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.white,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: wp(15),
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
    marginBottom: wp(1),
  },
  userIdText: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.primary,
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
  dateText: {
    fontSize: wp(2.6),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: '#999',
    marginTop: wp(2),
  },
});

export default AdminWishlistScreen;
