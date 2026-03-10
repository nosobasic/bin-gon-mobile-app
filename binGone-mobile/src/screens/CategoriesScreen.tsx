import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { SearchBar } from '../components';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface CategoriesScreenProps {
  navigation: NavigationProp;
  selectedCategoryId?: string;
}

interface ItemCard {
  id: string; // Changed from number to string to match listing IDs
  title: string;
  description: string;
  category?: string; // Added optional category property
  location: string;
  distance: string;
  image: any; // You can replace with actual image imports
  images?: string[]; // Array of image URLs for gallery
  isFavorite: boolean;
  coordinates?: [number, number]; // Add coordinates
  address?: string; // Add address
  status?: 'available' | 'claimed' | 'removed'; // Add status field
  donorName?: string;
  ownerId?: string; // Add ownerId field in case it exists in the actual data
}

interface MenuPosition {
  x: number;
  y: number;
}

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation, selectedCategoryId }) => {
  const { categories, loadingCategories, listings, loadingListings, fetchListings, deleteListing, updateListing } = useData();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const menuButtonRefs = useRef<{ [key: string]: View | null }>({});

  useEffect(() => {
    // Set initial category - either from props or first category
    if (categories.length > 0 && !hasInitialized) {
      const initialCategory = selectedCategoryId || categories[0].id;
      console.log('🎯 Setting initial category:', initialCategory);
      setSelectedCategory(initialCategory);
      setHasInitialized(true);
    }
  }, [categories, hasInitialized, selectedCategoryId]);

  // Handle selectedCategoryId changes from navigation
  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== selectedCategory) {
      console.log('🎯 Updating category from navigation:', selectedCategoryId);
      setSelectedCategory(selectedCategoryId);
      setHasInitialized(true); // Ensure we're initialized when navigation changes
      setSearchQuery(''); // Clear search when navigation changes category
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    // Fetch listings when category or search changes
    if (selectedCategory && categories.length > 0 && hasInitialized) {
      const statusFilter = user?.roleId === 1 ? ['available', 'claimed'] : 'available';
      
      fetchListings({
        categoryId: selectedCategory,
        q: searchQuery,
        status: statusFilter
      });
    }
  }, [selectedCategory, searchQuery, hasInitialized, categories.length, fetchListings, user?.roleId]);

  // Get category icon from category data or fallback to default
  const getCategoryIcon = (category: any) => {
    const iconMap: { [key: string]: any } = {
      'Education': require('../assets/images/education.png'),
      'Food': require('../assets/images/food.png'),
      'Clothes': require('../assets/images/clothes.png'),
      'Medical': require('../assets/images/medical.png'),
      'Stationery': require('../assets/images/stationery.png'),
      'Athletic': require('../assets/images/athletic.png'),
      'Book': require('../assets/images/book.png'),
      'Category': require('../assets/images/category.png'),
    };
    return iconMap[category.icon] || iconMap[category.name] || require('../assets/images/category.png');
  };

  const handleCategorySelect = (categoryId: string) => {
    console.log('🎯 Category selected:', categoryId);
    setSelectedCategory(categoryId);
    // Clear search when changing categories
    setSearchQuery('');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedCategory) {
      const statusFilter = user?.roleId === 1 ? ['available', 'claimed'] : 'available';
      
      await fetchListings({
        categoryId: selectedCategory,
        q: searchQuery,
        status: statusFilter
      });
    }
    setRefreshing(false);
  }, [selectedCategory, searchQuery, fetchListings, user?.roleId]);

  useFocusEffect(
    useCallback(() => {
      if (selectedCategory && categories.length > 0) {
        const statusFilter = user?.roleId === 1 ? ['available', 'claimed'] : 'available';
        
        fetchListings({
          categoryId: selectedCategory,
          q: searchQuery,
          status: statusFilter
        });
      }
    }, [selectedCategory, categories.length, searchQuery, fetchListings, user?.roleId])
  );

  if (loadingCategories || categories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader type="other" title="Categories" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const items = listings
    .filter(listing => {
      return listing && listing.id && typeof listing.id === 'string';
    }) // Filter out any undefined, null, or invalid listings
    .map(listing => {
      return {
        id: listing.id,
        title: listing.title || 'Untitled',
        description: listing.description || 'No description available',
        category: listing.category?.name || 'General', // Add category from listing data
        location: listing.address || 'Location not specified', // Use address as location string
        distance: '2.5 km', // You can calculate this based on user location
        image: listing.images && listing.images[0] ? { uri: listing.images[0] } : require('../assets/images/profile_user.png'),
        images: listing.images || [], // Include all images for gallery
        isFavorite: false,
        coordinates: listing.location?.coordinates, // Add coordinates from listing.location.coordinates
        address: listing.address, // Add address from listing
        status: listing.status, // Add status from listing
        donorName: listing.donorName, // Include donor name
        ownerId: (listing as any).ownerId // Include ownerId if it exists
      };
    });



  const toggleFavorite = (itemId: string) => {
    // Handle favorite toggle logic
    console.log('Toggle favorite for item:', itemId);
  };

  const handleMenuPress = (itemId: string) => {
    const buttonRef = menuButtonRefs.current[itemId];
    if (buttonRef) {
      buttonRef.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuPosition({
          x: x + width - wp(35), // Align right edge of menu with right edge of button
          y: y + height // Position below the button with small gap
        });
        setSelectedItem(itemId);
        setShowMenu(true);
      });
    }
  };

  const handleMenuClose = () => {
    setShowMenu(false);
    setSelectedItem(null);
  };

  const getCurrentItem = () => {
    if (!selectedItem) return null;
    return items.find(item => item.id === selectedItem);
  };

  const handleMenuAction = async (action: string) => {
    if (!selectedItem) return;
    try {
      switch (action) {
        case 'edit':
          const currentItem = getCurrentItem();
          if (currentItem) {
            const originalListing = listings.find(listing => listing.id === selectedItem);
            if (originalListing) {
              navigation.navigate('EditDonation', { donation: originalListing });
            } else {
              console.error('Original listing not found for edit');
            }
          }
          break;
        case 'delete':
          // Delete the listing
          await deleteListing(selectedItem);
          console.log('Deleted item:', selectedItem);
          break;
        case 'collected':
          try {
            const currentItem = getCurrentItem();
            const newStatus = currentItem?.status === 'claimed' ? 'available' : 'claimed';
            
            await updateListing(selectedItem, { status: newStatus });
            
            if (selectedCategory) {
              const statusFilter = user?.roleId === 1 ? ['available', 'claimed'] : 'available';
              
              await fetchListings({
                categoryId: selectedCategory,
                q: searchQuery,
                status: statusFilter
              });
            }
          } catch (error) {
            console.error('Error updating status:', error);
          }
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
    
    handleMenuClose();
  };

  const isOwner = (item: ItemCard) => {
    if (!user) return false;
    
    if (item.ownerId) {
      return user.id === item.ownerId;
    }
    
    return false;
  };

  const renderItemCard = ({ item }: { item: ItemCard }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => {
        // Convert ItemCard to ProductCard format and navigate
        const productCard = {
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category || 'General', // Provide default category
          location: item.location.split(',')[0], // Get just the area name
          distance: item.distance,
          image: item.image,
          images: item.images || [], // Include all images for gallery
          isFavorite: item.isFavorite,
          coordinates: item.coordinates, // Pass coordinates to ProductDetailScreen
          address: item.address, // Pass address to ProductDetailScreen
          donorName: item.donorName || 'Community Donor', // Use donorName from item
        };
        navigation.navigate('ProductDetail', { product: productCard });
      }}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.itemImage} />
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.id)}
        >
          <Text style={styles.favoriteIcon}>♡</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {isOwner(item) && (
            <TouchableOpacity 
              ref={(ref) => {
                menuButtonRefs.current[item.id] = ref;
              }}
              style={styles.moreButton}
              onPress={(e) => {
                e.stopPropagation();
                handleMenuPress(item.id);
              }}
            >
              <Text style={styles.moreIcon}>⋯</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.itemDescription}>{item.description}</Text>
        
        <View style={styles.locationContainer}>
          <Image source={require('../assets/images/location.png')} style={styles.locationIcon} />
          <Text style={styles.locationText}>{item.location}, {item.distance}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Categories" 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            placeholder="Search here..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filters */}
        <View style={styles.categoryFiltersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFiltersContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryFilterButton,
                  category.id === selectedCategory && styles.categoryFilterButtonSelected
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Image 
                  source={getCategoryIcon(category)}
                  style={[
                    styles.categoryFilterImageIcon,
                    category.id === selectedCategory && styles.categoryFilterImageIconSelected
                    ]}
                    resizeMode="contain"
                  />
                <Text style={[
                  styles.categoryFilterText,
                  category.id === selectedCategory && styles.categoryFilterTextSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

                 {/* Items List */}
         <View style={styles.itemsSection}>
           {loadingListings ? (
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={colors.primary} />
               <Text style={styles.loadingText}>Loading listings...</Text>
             </View>
           ) : items && items.length > 0 ? (
             <FlatList
               data={items}
               renderItem={renderItemCard}
               keyExtractor={(item) => {
                 if (!item || !item.id) {
                   console.warn('⚠️ Item without ID found:', item);
                   return Math.random().toString();
                 }
                 return item.id.toString();
               }}
               scrollEnabled={false}
               showsVerticalScrollIndicator={false}
               contentContainerStyle={styles.itemsList}
             />
           ) : (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>No listings found in this category</Text>
             </View>
           )}
         </View>

        <View style={{ height: wp(10) }} />
      </ScrollView>

      {/* Popup Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={handleMenuClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleMenuClose}
        >
          <View style={[styles.menuContainer, { 
            position: 'absolute',
            top: menuPosition.y,
            left: menuPosition.x,
          }]}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('edit')}
            >
              <Image 
                source={require('../assets/images/edit.png')}
                style={styles.menuItemIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('delete')}
            >
              <Image 
                source={require('../assets/images/delete.png')}
                style={styles.menuItemIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Delete</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('collected')}
            >
              <View 
                style={[
                  styles.statusBox,
                  {
                    backgroundColor: getCurrentItem()?.status === 'claimed' 
                      ? colors.primary 
                      : 'transparent',
                    borderColor: colors.text.gray,
                    borderWidth: 1,
                  }
                ]}
              />
              <Text style={styles.menuText}>Collected</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    marginBottom: wp(12)
  },
  searchSection: {
    marginBottom: wp(2),
  },
  categoryFiltersSection: {
    marginBottom: wp(4),
  },
  categoryFiltersContainer: {
    paddingHorizontal: wp(5),
    gap: wp(3),
  },
  categoryFilterButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray.borderGray,
    borderRadius: wp(6),
    paddingVertical: wp(1.5),
    paddingHorizontal: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp(22),
    flexDirection: 'row',
    gap: wp(1),
  },
  categoryFilterButtonSelected: {
    borderColor: colors.primary,
  },
  categoryFilterIcon: {
    fontSize: wp(4),
    color: colors.gray.medium,
  },
  categoryFilterIconSelected: {
    color: colors.white,
  },
  categoryFilterImageIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: colors.gray.medium,
    marginRight: wp(1),
  },
  categoryFilterImageIconSelected: {
    tintColor: colors.secondary,
  },
  categoryFilterText: {
    fontSize: wp(3.6),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
  },
  categoryFilterTextSelected: {
    color: colors.primary,
  },
  itemsSection: {
    paddingHorizontal: wp(5),
  },
  itemsList: {
    gap: wp(4),
  },
  itemCard: {
    width: wp(90),
    padding: wp(5),
    paddingBottom: wp(3),
    borderRadius: wp(4),
    overflow: 'hidden',
    marginRight: wp(3),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.15,
    shadowRadius: wp(1.5),
    backgroundColor: "#F6F6F6",
    marginBottom: wp(3),
    alignItems: "center"
  },
  imageContainer: {
    width: wp(80),
    height: wp(40),
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: wp(4),
  },
  favoriteButton: {
    position: 'absolute',
    top: wp(2),
    right: wp(2),
    width: wp(8),
    height: wp(8),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'rgba(162, 162, 162, 1)',
    borderRadius: wp(5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  favoriteIcon: {
    fontSize: wp(5),
    color: colors.black,
  },
  favoriteIconFilled: {
    // Emoji hearts have their own colors
  },
  itemContent: {
    width:"100%",
    paddingTop: wp(4),
    paddingBottom: wp(2)
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: wp(1),
  },
  itemTitle: {
    fontSize: wp(4.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    flex: 1,
  },
  moreButton: {
    width: wp(8),
    height: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: wp(5),
    color: colors.black,
    transform: [{ rotate: '90deg' }],
  },
  itemDescription: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    lineHeight: wp(5),
    marginBottom: wp(2),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  locationIcon: {
    width: wp(4),
    height: wp(4),
    marginRight: wp(2),
    tintColor: colors.gray.medium,
  },
  locationText: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    marginTop: wp(0.5)
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  loadingText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    marginTop: wp(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  emptyText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: wp(3),
    paddingVertical: wp(2),
    minWidth: wp(25),
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: wp(2),
  },
  menuText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    marginTop: wp(1)
  },
  menuItemIcon: {
    width: wp(5.5),
    height: wp(5.5),
    marginRight: wp(2.5),
  },
  statusBox: {
    width: wp(4.5),
    height: wp(4.5),
    marginRight: wp(3.5),
    borderRadius: wp(1),
  },
});

export default CategoriesScreen; 