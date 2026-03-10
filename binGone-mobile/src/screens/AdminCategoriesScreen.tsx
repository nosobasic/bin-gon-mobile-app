import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Image,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NavigationProp } from '../types/navigation';
import AdminAppHeader from '../components/AdminAppHeader';
import { SearchBar } from '../components';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useData } from '../contexts/DataContext';

interface AdminCategoriesScreenProps {
  navigation: NavigationProp;
  selectedCategoryId?: string;
}

interface ItemCard {
  id: string;
  title: string;
  description: string;
  category?: string;
  location: string;
  distance: string;
  image: any;
  images?: string[];
  isFavorite: boolean;
  coordinates?: [number, number];
  address?: string;
}

interface CategoryMenuState {
  visible: boolean;
  itemId: string | null;
  position: { x: number; y: number };
}

const AdminCategoriesScreen: React.FC<AdminCategoriesScreenProps> = ({ navigation, selectedCategoryId }) => {
  const { categories, loadingCategories, listings, loadingListings, fetchListings, createCategory } = useData();
  
  // Available icons for categories
  const availableIcons = [
    { name: 'Education', icon: require('../assets/images/education.png') },
    { name: 'Food', icon: require('../assets/images/food.png') },
    { name: 'Clothes', icon: require('../assets/images/clothes.png') },
    { name: 'Medical', icon: require('../assets/images/medical.png') },
    { name: 'Stationery', icon: require('../assets/images/stationery.png') },
    { name: 'Athletic', icon: require('../assets/images/athletic.png') },
    { name: 'Book', icon: require('../assets/images/book.png') },
    { name: 'Category', icon: require('../assets/images/category.png') },
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryMenu, setCategoryMenu] = useState<CategoryMenuState>({
    visible: false,
    itemId: null,
    position: { x: 0, y: 0 }
  });
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(availableIcons[0]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

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
      fetchListings({
        categoryId: selectedCategory,
        q: searchQuery,
        status: 'available'
      });
    }
  }, [selectedCategory, searchQuery, hasInitialized, categories.length, fetchListings]);

  const getCategoryIcon = (category: any) => {
    const iconMap: { [key: string]: any } = {
      'Education': require('../assets/images/education.png'),
      'Food': require('../assets/images/food.png'),
      'Clothes': require('../assets/images/clothes.png'),
      'Medical': require('../assets/images/medical.png'),
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
      await fetchListings({
        categoryId: selectedCategory,
        q: searchQuery,
        status: 'available'
      });
    }
    setRefreshing(false);
  }, [selectedCategory, searchQuery, fetchListings]);

  const handleMorePress = (itemId: string, event: any) => {
    event.persist();
    const { pageX, pageY } = event.nativeEvent;
    setCategoryMenu({
      visible: true,
      itemId,
      position: { x: pageX, y: pageY }
    });
  };

  const handleEditCategory = (itemId: string) => {
    setCategoryMenu({ visible: false, itemId: null, position: { x: 0, y: 0 } });
    Alert.alert('Edit Category', 'Edit functionality will be implemented');
  };

  const handleDeleteCategory = (itemId: string) => {
    setCategoryMenu({ visible: false, itemId: null, position: { x: 0, y: 0 } });
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Category deleted successfully!');
          }
        }
      ]
    );
  };

  const handleAddCategory = () => {
    setShowAddCategoryModal(true);
  };

  const closeAddCategoryModal = () => {
    setShowAddCategoryModal(false);
    setNewCategoryTitle('');
    setSelectedIcon(availableIcons[0]);
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryTitle.trim()) {
      Alert.alert('Error', 'Please enter a category title');
      return;
    }

    // Check if category already exists
    const categoryExists = categories.some(cat => 
      cat.name.toLowerCase() === newCategoryTitle.toLowerCase()
    );

    if (categoryExists) {
      Alert.alert('Error', 'Category already exists');
      return;
    }

    setIsCreatingCategory(true);
    try {
      // Generate slug from category name
      const slug = newCategoryTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Send the selected icon name as the icon field
      const categoryData = {
        name: newCategoryTitle.trim(),
        slug: slug,
        icon: selectedIcon.name
      };

      await createCategory(categoryData);
      Alert.alert('Success', 'New category added successfully!');
      closeAddCategoryModal();
    } catch (error: any) {
      console.error('Failed to create category:', error);
      Alert.alert('Error', error.message || 'Failed to create category. Please try again.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Use real listings data instead of hardcoded items
  console.log('🔍 Raw listings data:', listings);
  const items = listings
    .filter(listing => {
      console.log('🔍 Checking listing:', listing);
      return listing && listing.id && typeof listing.id === 'string';
    }) // Filter out any undefined, null, or invalid listings
    .map(listing => ({
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
      address: listing.address // Add address from listing
    }));
  console.log('🔍 Processed items:', items);

  const toggleFavorite = (itemId: string) => {
    Alert.alert('Favorite', 'Item added to favorites!');
  };

  const renderItemCard = ({ item }: { item: ItemCard }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => {
        const productCard = {
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category || 'General',
          location: item.location.split(',')[0],
          distance: item.distance,
          image: item.image,
          images: item.images || [],
          isFavorite: item.isFavorite,
          coordinates: item.coordinates,
          address: item.address,
          donorName: 'Community Donor',
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
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={(event) => handleMorePress(item.id, event)}
          >
            <Text style={styles.moreIcon}>⋯</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.itemDescription}>{item.description}</Text>
        
        <View style={styles.locationContainer}>
          <Image source={require('../assets/images/location.png')} style={styles.locationIcon} />
          <Text style={styles.locationText}>{item.location}, {item.distance}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryMenu = () => {
    if (!categoryMenu.visible) return null;

    return (
      <Modal
        transparent
        visible={categoryMenu.visible}
        animationType="fade"
        onRequestClose={() => setCategoryMenu({ visible: false, itemId: null, position: { x: 0, y: 0 } })}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setCategoryMenu({ visible: false, itemId: null, position: { x: 0, y: 0 } })}
        >
          <View style={[styles.categoryMenu, { 
            left: Math.max(10, Math.min(categoryMenu.position.x - 60, wp(80))),
            top: Math.max(10, categoryMenu.position.y - 10)
          }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleEditCategory(categoryMenu.itemId!)}
            >
              <Image source={require('../assets/images/edit.png')} style={styles.menuIcon} />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleDeleteCategory(categoryMenu.itemId!)}
            >
              <Image source={require('../assets/images/delete.png')} style={styles.menuIcon} />
              <Text style={styles.menuText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderAddCategoryModal = () => (
    <Modal
      transparent
      visible={showAddCategoryModal}
      animationType="slide"
      onRequestClose={closeAddCategoryModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Category</Text>
          <Text style={styles.modalDescription}>
            Add a new donation category to help organize items better.
          </Text>
          
          {/* Category Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter category name"
              value={newCategoryTitle}
              onChangeText={setNewCategoryTitle}
              maxLength={20}
            />
          </View>

          {/* Icon Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Select Icon</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.iconScrollView}
            >
              {availableIcons.map((icon, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.iconOption,
                    selectedIcon.name === icon.name && styles.selectedIconOption
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Image source={icon.icon} style={styles.iconOptionImage} />
                
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={closeAddCategoryModal}
              disabled={isCreatingCategory}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton, 
                styles.addButton,
                isCreatingCategory && styles.disabledButton
              ]}
              onPress={handleAddNewCategory}
              disabled={isCreatingCategory}
            >
              {isCreatingCategory ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.addButtonText}>Add Category</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loadingCategories) {
    return (
      <SafeAreaView style={styles.container}>
        <AdminAppHeader type="other" title="Categories" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state when no categories are found
  if (categories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <AdminAppHeader type="other" title="Categories" onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyStateContainer}>
          <Image 
            source={require('../assets/images/category.png')} 
            style={styles.emptyStateIcon}
            resizeMode="contain"
          />
          <Text style={styles.emptyStateTitle}>No Categories Found</Text>
          <Text style={styles.emptyStateDescription}>
            Start by adding your first donation category to organize items better.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={handleAddCategory}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyStateButtonIcon}>+</Text>
            <Text style={styles.emptyStateButtonText}>Add Category</Text>
          </TouchableOpacity>
        </View>
        {renderAddCategoryModal()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdminAppHeader 
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

        <View style={{ height: wp(20) }} />
      </ScrollView>

      {/* Add Category Button */}
      <TouchableOpacity
        style={styles.addCategoryButton}
        onPress={handleAddCategory}
        activeOpacity={0.8}
      >
        <Text style={styles.addCategoryButtonIcon}>+</Text>
        <Text style={styles.addCategoryButtonText}>Add Category</Text>
      </TouchableOpacity>

      {/* Category Menu Modal */}
      {renderCategoryMenu()}

      {/* Add Category Modal */}
      {renderAddCategoryModal()}
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
  addCategoryButton: {
    position: 'absolute',
    bottom: wp(19),
    left: wp(5),
    right: wp(5),
    backgroundColor: colors.primary,
    borderRadius: wp(8),
    paddingVertical: wp(2.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addCategoryButtonIcon: {
    fontSize: wp(6),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginRight: wp(2),
  },
  addCategoryButtonText: {
    fontSize: wp(4.5),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  categoryMenu: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: wp(2),
    paddingVertical: wp(2),
    minWidth: wp(30),
    shadowColor: '#000',
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
    paddingVertical: wp(3),
    paddingHorizontal: wp(4),
  },
  menuIcon: {
    width: wp(4),
    height: wp(4),
    marginRight: wp(3),
    tintColor: colors.gray.medium,
  },
  menuText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(6),
    width: '100%',
    maxWidth: wp(85),
    maxHeight: hp(80),
  },
  modalTitle: {
    fontSize: wp(5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    textAlign: 'center',
    marginBottom: wp(3),
  },
  modalDescription: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    textAlign: 'center',
    lineHeight: wp(5),
    marginBottom: wp(4),
  },
  inputContainer: {
    marginBottom: wp(4),
  },
  inputLabel: {
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(2),
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray.borderGray,
    borderRadius: wp(3),
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
    backgroundColor: colors.white,
  },
  iconScrollView: {
    marginTop: wp(2),
  },
  iconOption: {
    alignItems: 'center',
    marginRight: wp(3),
    padding: wp(2),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: colors.gray.borderGray,
    backgroundColor: colors.white,
    minWidth: wp(20),
  },
  selectedIconOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  iconOptionImage: {
    width: wp(8),
    height: wp(8),
    marginBottom: wp(1),
    tintColor: colors.gray.medium,
  },
  iconOptionText: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    textAlign: 'center',
  },
  selectedIconOptionText: {
    color: colors.primary,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: wp(3),
  },
  modalButton: {
    flex: 1,
    paddingVertical: wp(4),
    borderRadius: wp(3),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray.light,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.gray.medium,
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.gray.medium,
  },
  addButtonText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.white,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
    paddingVertical: hp(10),
  },
  emptyStateIcon: {
    width: wp(18),
    height: wp(18),
    tintColor: colors.gray.medium,
    marginBottom: wp(6),
  },
  emptyStateTitle: {
    fontSize: wp(5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    textAlign: 'center',
    marginBottom: wp(3),
  },
  emptyStateDescription: {
    fontSize: wp(3.7),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    textAlign: 'center',
    lineHeight: wp(6),
    marginBottom: wp(8),
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    borderRadius: wp(8),
    paddingVertical: wp(3),
    paddingHorizontal: wp(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyStateButtonIcon: {
    fontSize: wp(4.7),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginRight: wp(2),
  },
  emptyStateButtonText: {
    fontSize: wp(4.3),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
});

export default AdminCategoriesScreen;
