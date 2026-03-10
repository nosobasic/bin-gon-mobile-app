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
import { apiClient, Category } from '../services/api';

interface CategoryManagementScreenProps {
  navigation: NavigationProp;
}

interface CategoryMenuState {
  visible: boolean;
  categoryId: string | null;
  position: { x: number; y: number };
}

const CategoryManagementScreen: React.FC<CategoryManagementScreenProps> = ({ navigation }) => {
  const { categories, loadingCategories, fetchCategories, createCategory } = useData();
  
  // Available icons for categories
  const availableIcons = [
    { name: 'Education', icon: require('../assets/images/education.png') },
    { name: 'Food', icon: require('../assets/images/food.png') },
    { name: 'Clothes', icon: require('../assets/images/clothes.png') },
    { name: 'Medical', icon: require('../assets/images/medical.png') },
    { name: 'Category', icon: require('../assets/images/category.png') },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [categoryMenu, setCategoryMenu] = useState<CategoryMenuState>({
    visible: false,
    categoryId: null,
    position: { x: 0, y: 0 }
  });
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(availableIcons[0]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  useEffect(() => {
    // Fetch categories when component mounts
    fetchCategories();
  }, [fetchCategories]);

  const getCategoryIcon = (category: Category) => {
    const iconMap: { [key: string]: any } = {
      'Education': require('../assets/images/education.png'),
      'Food': require('../assets/images/food.png'),
      'Clothes': require('../assets/images/clothes.png'),
      'Medical': require('../assets/images/medical.png'),
      'Category': require('../assets/images/category.png'),
    };
    return iconMap[category.icon] || iconMap[category.name] || require('../assets/images/category.png');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  }, [fetchCategories]);

  const handleMorePress = (categoryId: string, event: any) => {
    event.persist();
    const { pageX, pageY } = event.nativeEvent;
    setCategoryMenu({
      visible: true,
      categoryId,
      position: { x: pageX, y: pageY }
    });
  };

 

  const handleEditCategory = (categoryId: string) => {
    setCategoryMenu({ visible: false, categoryId: null, position: { x: 0, y: 0 } });
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setEditingCategory(category);
      setNewCategoryTitle(category.name);
      // Find the selected icon
      const icon = availableIcons.find(icon => icon.name === category.icon) || availableIcons[0];
      setSelectedIcon(icon);
      setShowEditCategoryModal(true);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryMenu({ visible: false, categoryId: null, position: { x: 0, y: 0 } });
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => deleteCategory(categoryId)
          }
        ]
      );
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      await apiClient.deleteCategory(categoryId);
      Alert.alert('Success', 'Category deleted successfully!');
      // Refresh categories
      await fetchCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      Alert.alert('Error', error.message || 'Failed to delete category. Please try again.');
    }
  };

  const handleAddCategory = () => {
    setShowAddCategoryModal(true);
  };

  const closeAddCategoryModal = () => {
    setShowAddCategoryModal(false);
    setNewCategoryTitle('');
    setSelectedIcon(availableIcons[0]);
  };

  const closeEditCategoryModal = () => {
    setShowEditCategoryModal(false);
    setEditingCategory(null);
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

  const handleUpdateCategory = async () => {
    if (!newCategoryTitle.trim()) {
      Alert.alert('Error', 'Please enter a category title');
      return;
    }

    if (!editingCategory) {
      Alert.alert('Error', 'No category selected for editing');
      return;
    }

    // Check if category already exists (excluding current category)
    const categoryExists = categories.some(cat => 
      cat.id !== editingCategory.id && 
      cat.name.toLowerCase() === newCategoryTitle.toLowerCase()
    );

    if (categoryExists) {
      Alert.alert('Error', 'Category already exists');
      return;
    }

    setIsUpdatingCategory(true);
    try {
      // Generate slug from category name
      const slug = newCategoryTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Send the selected icon name as the icon field
      const categoryData = {
        name: newCategoryTitle.trim(),
        slug: slug,
        icon: selectedIcon.name
      };

      console.log('🎯 Updating category:', editingCategory.id,categoryData );

      await apiClient.updateCategory(editingCategory.id, categoryData);
      Alert.alert('Success', 'Category updated successfully!');
      closeEditCategoryModal();
      // Refresh categories
      await fetchCategories();
    } catch (error: any) {
      console.error('Failed to update category:', error);
      Alert.alert('Error', error.message || 'Failed to update category. Please try again.');
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCategoryCard = ({ item }: { item: Category }) => (
    <View style={styles.categoryCard}>
      <Image source={getCategoryIcon(item)} style={styles.categoryIcon} />
      <Text style={styles.categoryName}>{item.name}</Text>
      <TouchableOpacity 
        style={styles.moreButton}
        onPress={(event) => handleMorePress(item.id, event)}
      >
        <Text style={styles.moreIcon}>⋯</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategoryMenu = () => {
    if (!categoryMenu.visible) return null;

    return (
      <Modal
        transparent
        visible={categoryMenu.visible}
        animationType="fade"
        onRequestClose={() => setCategoryMenu({ visible: false, categoryId: null, position: { x: 0, y: 0 } })}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setCategoryMenu({ visible: false, categoryId: null, position: { x: 0, y: 0 } })}
        >
          <View style={[styles.categoryMenu, { 
            left: Math.max(10, Math.min(categoryMenu.position.x - 60, wp(80))),
            top: Math.max(10, categoryMenu.position.y - 10)
          }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleEditCategory(categoryMenu.categoryId!)}
            >
              <Image source={require('../assets/images/edit.png')} style={styles.menuIcon} />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleDeleteCategory(categoryMenu.categoryId!)}
            >
              <Image source={require('../assets/images/delete.png')} style={styles.menuIcon} />
              <Text style={[styles.menuText, styles.deleteMenuText]}>Delete</Text>
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

  const renderEditCategoryModal = () => (
    <Modal
      transparent
      visible={showEditCategoryModal}
      animationType="slide"
      onRequestClose={closeEditCategoryModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Category</Text>
          <Text style={styles.modalDescription}>
            Update the category information below.
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
              onPress={closeEditCategoryModal}
              disabled={isUpdatingCategory}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton, 
                styles.addButton,
                isUpdatingCategory && styles.disabledButton
              ]}
              onPress={handleUpdateCategory}
              disabled={isUpdatingCategory}
            >
              {isUpdatingCategory ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.addButtonText}>Update Category</Text>
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
        <AdminAppHeader type="other" title="Category Management" onBackPress={() => navigation.goBack()} />
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
        <AdminAppHeader type="other" title="Category Management" onBackPress={() => navigation.goBack()} />
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
        title="Category Management" 
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

        {/* Categories Grid */}
        <View style={styles.categoriesSection}>
          {filteredCategories.length > 0 ? (
            <FlatList
              data={filteredCategories}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.categoriesGrid}
              columnWrapperStyle={styles.categoryRow}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No categories found matching your search</Text>
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

      {/* Edit Category Modal */}
      {renderEditCategoryModal()}
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
  categoriesSection: {
    paddingHorizontal: wp(5),
  },
  categoriesGrid: {
    gap: wp(4),
    paddingBottom: wp(10),
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  categoryRow: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: wp(42),
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(4),
    paddingBottom: wp(2.5),
    alignItems: 'center',
    borderColor: colors.text.gray,
    borderWidth: 1,
    position: 'relative',
  },
  categoryIcon: {
    width: wp(12),
    height: wp(12),
    marginBottom: wp(2),
    tintColor: colors.primary,
  },
  categoryName: {
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    textAlign: 'center',
    marginBottom: wp(1),
  },
  moreButton: {
    position: 'absolute',
    top: wp(2),
    right: wp(2),
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
  deleteMenuText: {
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

export default CategoryManagementScreen;
