import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse, ImageLibraryOptions } from 'react-native-image-picker';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';

interface CreateDonationScreenProps {
  navigation: NavigationProp;
}

const CreateDonationScreen: React.FC<CreateDonationScreenProps> = ({ navigation }) => {
  const { categories, loadingCategories, createListing } = useData();
  const { user } = useAuth();
  const [donationTitle, setDonationTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    coordinates: [number, number];
  } | null>(null);
  
  // Dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);

  // Updated conditions to only "New" and "Used"
  const conditions = ['New', 'Used'];

  // Check if user is a donor
  const isDonor = user?.accountType === 'donor' || user?.roleId === 1;

  useEffect(() => {
    // If user is not a donor, show alert and go back
    if (user && !isDonor) {
      Alert.alert(
        'Access Denied',
        'Only donors can create donations. Please log in as a donor to create donations.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    }
  }, [user, isDonor, navigation]);

  const handleAddImageUrl = () => {
    if (imageUrl.trim()) {
      setImageUrls([...imageUrls, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleRemoveImageUrl = (index: number) => {
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImageUrls);
  };

  // Request camera and storage permissions for Android
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API level 33+), we need READ_MEDIA_IMAGES
        // For older versions, we use READ_EXTERNAL_STORAGE
        const permission = Platform.Version >= 33 
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        
        const granted = await PermissionsAndroid.request(
          permission,
          {
            title: 'Gallery Permission',
            message: 'This app needs access to your gallery to select images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  // Handle image selection from gallery
  const handleImagePicker = async () => {
    const hasPermission = await requestPermissions();
    
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Gallery permission is required to select images.',
        [{ text: 'OK' }]
      );
      return;
    }

    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 5, // Allow up to 5 images
      includeBase64: false,
      includeExtra: true, // Include extra metadata
    };

    try {
      const response: ImagePickerResponse = await launchImageLibrary(options);
      
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', `Failed to pick image: ${response.errorMessage}`);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const newImages = response.assets
          .filter(asset => asset.uri)
          .map(asset => asset.uri!);
        
        // Combine with existing images, but limit to 5 total
        const allImages = [...selectedImages, ...newImages];
        const limitedImages = allImages.slice(0, 5);
        
        setSelectedImages(limitedImages);
        
        if (allImages.length > 5) {
          Alert.alert(
            'Image Limit',
            'Maximum 5 images allowed. Only the first 5 images will be used.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // No images selected - might be empty gallery
        Alert.alert(
          'No Images Found',
          'No images were selected. Make sure you have photos in your gallery or try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  // Remove selected image
  const handleRemoveSelectedImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
  };

  // Handle location selection
  const handleLocationSelect = (location: { name: string; coordinates: [number, number] }) => {
    setSelectedLocation(location);
  };

  // Navigate to location selection screen
  const handleSelectLocation = () => {
    navigation.navigate('LocationSelection', {
      onLocationSelect: handleLocationSelect,
    });
  };

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryDropdown(false);
  };

  const handleConditionSelect = (condition: string) => {
    setSelectedCondition(condition);
    setShowConditionDropdown(false);
  };

  const getSelectedCategoryName = () => {
    const category = categories.find(cat => cat.id === selectedCategory);
    return category ? category.name : '';
  };

  const handleSubmit = async () => {
    // Check if user is a donor
    if (!isDonor) {
      Alert.alert('Access Denied', 'Only donors can create donations.');
      return;
    }

    if (!donationTitle.trim()) {
      Alert.alert('Error', 'Please enter a donation title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!selectedCondition) {
      Alert.alert('Error', 'Please select a condition');
      return;
    }
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the listing data
      const listingData = {
        title: donationTitle.trim(),
        description: description.trim(),
        images: selectedImages.length > 0 ? selectedImages : [],
        categoryId: selectedCategory,
        location: {
          type: 'Point' as const,
          coordinates: selectedLocation.coordinates,
        },
        address: selectedLocation.name,
      };

      // Create the listing
      const createdListing = await createListing(listingData);

      // Award points for donation
      try {
        const pointsResponse = await apiClient.awardPointsForDonation(createdListing.id);
        console.log('Points awarded:', pointsResponse);
        
        Alert.alert(
          'Success! 🎉', 
          `Donation created successfully! You earned ${pointsResponse.pointsAwarded} points. Total points: ${pointsResponse.totalPoints}`,
          [
            { 
              text: 'View in Categories', 
              onPress: () => {
                // Navigate to Categories tab in Dashboard
                navigation.navigate('Dashboard', { initialTab: 'Categories' });
              }
            },
            { text: 'Create Another', onPress: () => {
              // Reset form
              setDonationTitle('');
              setDescription('');
              setSelectedCategory('');
              setSelectedCondition('');
              setSelectedImages([]);
              setSelectedLocation(null);
            }}
          ]
        );
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError);
        // Still show success for donation creation even if points fail
        Alert.alert(
          'Success', 
          'Donation created successfully! You can now see it in the categories section.',
          [
            { 
              text: 'View in Categories', 
              onPress: () => {
                // Navigate to Categories tab in Dashboard
                navigation.navigate('Dashboard', { initialTab: 'Categories' });
              }
            },
            { text: 'Create Another', onPress: () => {
              // Reset form
              setDonationTitle('');
              setDescription('');
              setSelectedCategory('');
              setSelectedCondition('');
              setSelectedImages([]);
              setSelectedLocation(null);
            }}
          ]
        );
      }
    } catch (error: any) {
      console.error('Error creating donation:', error);
      Alert.alert('Error', error.message || 'Failed to create donation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleCategorySelect(item.id, item.name)}
    >
      <Text style={styles.dropdownItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderConditionItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleConditionSelect(item)}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Create Donation" 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Access Warning for Non-Donors */}
        {user && !isDonor && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Only donors can create donations. You are currently logged in as a receiver.
            </Text>
          </View>
        )}
        
        {/* Donation Title */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Donation Title</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g, Kids Clothing Bundle (3-5y)"
            value={donationTitle}
            onChangeText={setDonationTitle}
            placeholderTextColor={colors.gray.medium}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe the items, condition, etc..."
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={colors.gray.medium}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity 
            style={[styles.dropdownContainer, loadingCategories && styles.disabledDropdown]}
            onPress={() => !loadingCategories && setShowCategoryDropdown(true)}
            disabled={loadingCategories}
          >
            <Text style={[styles.dropdownText, !selectedCategory && styles.placeholderText]}>
              {loadingCategories ? 'Loading categories...' : (selectedCategory ? getSelectedCategoryName() : 'Select a category')}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
          {selectedCategory && (
            <View style={styles.selectedOption}>
              <Text style={styles.selectedOptionText}>{getSelectedCategoryName()}</Text>
              <TouchableOpacity onPress={() => setSelectedCategory('')}>
                <Text style={styles.removeOption}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          {showCategoryDropdown && (
            <Modal
              visible={showCategoryDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowCategoryDropdown(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={0}
                onPress={() => setShowCategoryDropdown(false)}
              >
                <View style={styles.modalContent}>
                  <FlatList
                    data={categories}
                    renderItem={renderCategoryItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.dropdownList}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </View>

        {/* Condition */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Condition</Text>
          <TouchableOpacity 
            style={styles.dropdownContainer}
            onPress={() => setShowConditionDropdown(true)}
          >
            <Text style={[styles.dropdownText, !selectedCondition && styles.placeholderText]}>
              {selectedCondition || 'Select a condition'}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
          {selectedCondition && (
            <View style={styles.selectedOption}>
              <Text style={styles.selectedOptionText}>{selectedCondition}</Text>
              <TouchableOpacity onPress={() => setSelectedCondition('')}>
                <Text style={styles.removeOption}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          {showConditionDropdown && (
            <Modal
              visible={showConditionDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowConditionDropdown(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={0}
                onPress={() => setShowConditionDropdown(false)}
              >
                <View style={styles.modalContent}>
                  <FlatList
                    data={conditions}
                    renderItem={renderConditionItem}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.dropdownList}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </View>

        {/* Images URL */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Images URL</Text>
          <View style={styles.urlInputContainer}>
            <TextInput
              style={[styles.textInput, styles.urlInput]}
              placeholder="Enter image URL"
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholderTextColor={colors.gray.medium}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddImageUrl}>
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          </View>
          {imageUrls.length > 0 && (
            <View style={styles.imageUrlsContainer}>
              {imageUrls.map((url, index) => (
                <View key={index} style={styles.imageUrlItem}>
                  <Text style={styles.imageUrlText} numberOfLines={1}>
                    {url}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveImageUrl(index)}>
                    <Text style={styles.removeImageUrl}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Upload Images */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Upload Images</Text>
          <TouchableOpacity style={styles.uploadContainer} onPress={handleImagePicker}>
            <View style={styles.uploadIcon}>
             <Image source={require('../assets/images/select_file.png')} style={styles.uploadIconImage} />
            </View>
            <Text style={styles.uploadText}>Select file</Text>
          </TouchableOpacity>
          
          {/* Display selected images */}
          {selectedImages.length > 0 && (
            <View style={styles.selectedImagesContainer}>
              <Text style={styles.selectedImagesTitle}>
                Selected Images ({selectedImages.length}/5)
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imagesScrollView}
              >
                {selectedImages.map((imageUri, index) => (
                  <View key={index} style={styles.imageItem}>
                    <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveSelectedImage(index)}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Location */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Location</Text>
          <TouchableOpacity 
            style={styles.locationContainer} 
            onPress={handleSelectLocation}
          >
            <View style={styles.locationContent}>
              <Text style={[
                styles.locationText, 
                !selectedLocation && styles.placeholderText
              ]}>
                {selectedLocation ? 'Selected Location' : 'Select a location'}
              </Text>
              {selectedLocation && (
                <Text style={styles.locationCoordinates}>
                  {selectedLocation.name}
                </Text>
              )}
            </View>
            <Text style={styles.locationIcon}>📍</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            isSubmitting && styles.disabledSubmitButton
          ]} 
          onPress={handleSubmit} 
          disabled={isSubmitting || !isDonor}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating...' : 'Create Donation'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: wp(10) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: wp(3),
  },
  fieldContainer: {
    marginBottom: wp(4),
  },
  warningContainer: {
    backgroundColor: colors.red,
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    borderRadius: wp(2.5),
    marginBottom: wp(4),
  },
  warningText: {
    color: colors.white,
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
  },

  label: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(1.5),
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
    backgroundColor: colors.white,
  },
  textArea: {
    height: hp(12),
    textAlignVertical: 'top',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledDropdown: {
    backgroundColor: colors.lightGray,
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
    flex: 1,
  },
  placeholderText: {
    color: colors.gray.medium,
  },
  chevron: {
    fontSize: wp(2.5),
    color: colors.gray.medium,
  },
  selectedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: wp(3),
    paddingVertical: wp(1.5),
    borderRadius: wp(2),
    marginTop: wp(1),
    alignSelf: 'flex-start',
  },
  selectedOptionText: {
    color: colors.white,
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    marginRight: wp(2),
  },
  removeOption: {
    color: colors.white,
    fontSize: wp(3.5),
    fontWeight: 'bold',
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
    marginRight: wp(2),
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    borderRadius: wp(2.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  imageUrlsContainer: {
    marginTop: wp(2),
  },
  imageUrlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: wp(3),
    paddingVertical: wp(2),
    borderRadius: wp(2),
    marginBottom: wp(1),
  },
  imageUrlText: {
    flex: 1,
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
  },
  removeImageUrl: {
    color: colors.red,
    fontSize: wp(3.5),
    fontWeight: 'bold',
    marginLeft: wp(2),
  },
  uploadContainer: {
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
    borderRadius: wp(2.5),
    paddingVertical: wp(8),
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  uploadIcon: {
    marginBottom: wp(2),
  },
  uploadIconText: {
    fontSize: wp(8),
  },
  uploadText: {
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_MEDIUM,
    color: colors.primary,
  },
  selectedImagesContainer: {
    marginTop: wp(3),
  },
  selectedImagesTitle: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(2),
  },
  imagesScrollView: {
    flexDirection: 'row',
  },
  imageItem: {
    position: 'relative',
    marginRight: wp(2),
    marginTop: wp(1)
  },
  selectedImage: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  removeImageButton: {
    position: 'absolute',
    top: -wp(1),
    right: -wp(1),
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },
  removeImageText: {
    color: colors.white,
    fontSize: wp(3),
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: wp(4),
    borderRadius: wp(8),
    alignItems: 'center',
    marginTop: wp(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(0.5),
    },
    shadowOpacity: 0.25,
    shadowRadius: wp(1),
    elevation: 5,
  },
  disabledSubmitButton: {
    backgroundColor: colors.gray.medium,
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: wp(3),
    width: wp(80),
    maxHeight: hp(40),
    elevation: 5,
  },
  dropdownList: {
    paddingVertical: wp(2),
  },
  dropdownItem: {
    paddingVertical: wp(3),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  dropdownItemText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
  },
  uploadIconImage: {
    width: wp(9),
    height: wp(9),
    resizeMode: 'contain',
  },
  locationContainer: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContent: {
    flex: 1,
  },
  locationText: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
  },
  locationCoordinates: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    marginTop: wp(0.5),
  },
  locationIcon: {
    fontSize: wp(4),
  },
});

export default CreateDonationScreen; 