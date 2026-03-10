import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import CustomButton from '../components/CustomButton';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { useAuth } from '../contexts/AuthContext';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import { apiClient } from '../services/api';

interface EditProfileScreenProps {
  navigation: NavigationProp;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, updateUser, isAuthenticated } = useAuth();
  
  // Debug: Log authentication state
  console.log('🔍 EditProfileScreen - Is authenticated:', isAuthenticated);
  console.log('🔍 EditProfileScreen - Current user data:', JSON.stringify(user, null, 2));
  console.log('🔍 EditProfileScreen - User name:', user?.name);
  console.log('🔍 EditProfileScreen - User email:', user?.email);
  console.log('🔍 EditProfileScreen - User phone:', user?.phoneNumber);
  console.log('🔍 EditProfileScreen - User profileImageUrl:', user?.profileImageUrl);
  
  // Check if user is not authenticated and redirect to login
  useEffect(() => {
    if (!isAuthenticated && !user) {
      console.log('🔍 EditProfileScreen - User not authenticated, redirecting to login');
      Alert.alert(
        'Session Expired',
        'Please log in again to continue.',
        [
          {
            text: 'OK',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            }),
          },
        ]
      );
    }
  }, [isAuthenticated, user, navigation]);
  
  // Initialize state with real user data
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(user?.profileImageUrl || null);
  const [isLoading, setIsLoading] = useState(false);

  // Update state when user data changes
  useEffect(() => {
    console.log('🔍 EditProfileScreen - useEffect triggered, user:', JSON.stringify(user, null, 2));
    if (user) {
      console.log('🔍 EditProfileScreen - Updating form fields with user data');
      setFullName(user.name || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
      setProfileImageUri(user.profileImageUrl || null);
    } else {
      console.log('🔍 EditProfileScreen - No user data available, keeping empty fields');
    }
  }, [user]);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('🔍 Permissions - Android detected, requesting permissions...');
        
        // For Android 13+ (API 33+), we need READ_MEDIA_IMAGES instead of READ_EXTERNAL_STORAGE
        const androidVersion = Platform.Version;
        console.log('🔍 Permissions - Android version:', androidVersion);
        
        // Let's check what permissions are available
        console.log('🔍 Available permission constants:');
        console.log('  - CAMERA:', PermissionsAndroid.PERMISSIONS.CAMERA);
        console.log('  - READ_EXTERNAL_STORAGE:', PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        console.log('  - READ_MEDIA_IMAGES:', PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
        
        let permissions = [];
        
        if (androidVersion >= 33) {
          // Android 13+ uses granular media permissions
          permissions = [
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.CAMERA,
          ];
        } else {
          // Older Android versions
          permissions = [
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.CAMERA,
          ];
        }

        console.log('🔍 Permissions - Requesting permissions:', permissions);
        
        // Check current permission status first
        const currentStatus = await PermissionsAndroid.requestMultiple(permissions);
        console.log('🔍 Permissions - Current status:', currentStatus);
        
        // Check if at least storage/media permission is granted
        const storagePermission = androidVersion >= 33 
          ? currentStatus[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES]
          : currentStatus[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];
          
        const cameraPermission = currentStatus[PermissionsAndroid.PERMISSIONS.CAMERA];
        
        console.log('🔍 Permissions - Storage permission result:', storagePermission);
        console.log('🔍 Permissions - Camera permission result:', cameraPermission);
        console.log('🔍 Permissions - Expected GRANTED value:', PermissionsAndroid.RESULTS.GRANTED);
        
        const isStorageGranted = storagePermission === PermissionsAndroid.RESULTS.GRANTED;
        const isCameraGranted = cameraPermission === PermissionsAndroid.RESULTS.GRANTED;
        
        console.log('🔍 Permissions - Final results:', { storage: isStorageGranted, camera: isCameraGranted });
        
        // We need at least storage permission
        return isStorageGranted;
        
      } catch (err) {
        console.error('🔍 Permission request error:', err);
        return false;
      }
    }
    console.log('🔍 Permissions - iOS detected, returning true');
    return true;
  };

  const handleChangeProfilePicture = async () => {
    console.log('🔍 Image picker - Starting...');
    
    // Let's try the direct approach first (react-native-image-picker handles permissions internally)
    Alert.alert(
      'Select Profile Picture',
      'Choose how you would like to set your profile picture',
      [
        {
          text: 'Gallery',
          onPress: () => {
            console.log('🔍 User selected Gallery (direct mode)');
            openGalleryDirect();
          },
        },
        {
          text: 'Camera',
          onPress: () => {
            console.log('🔍 User selected Camera (direct mode)');
            openCameraDirect();
          },
        },
        {
          text: 'Manual Permission Setup',
          onPress: () => {
            console.log('🔍 User wants manual permission setup');
            showManualPermissionSetup();
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const showManualPermissionSetup = async () => {
    const hasPermission = await requestCameraPermission();
    console.log('🔍 Image picker - Permission result:', hasPermission);
    
    if (!hasPermission) {
      console.log('🔍 Image picker - Permission denied, showing instructions');
      Alert.alert(
        'Permission Setup Required', 
        'To use photos from your gallery, please:\n\n1. Go to Settings\n2. Find "binGone" app\n3. Tap "Permissions"\n4. Enable "Camera" and "Files and media" (or "Photos")\n\nThen come back and try again.',
        [
          {
            text: 'Open Settings',
            onPress: () => {
              console.log('🔍 User wants to open settings');
              try {
                if (Platform.OS === 'android') {
                  Linking.openSettings();
                }
              } catch (error) {
                console.error('🔍 Error opening settings:', error);
              }
            },
          },
          {
            text: 'Try Direct Mode',
            onPress: () => {
              console.log('🔍 User wants to try direct mode after permission failure');
              Alert.alert(
                'Select Profile Picture',
                'Let\'s try to access your photos directly',
                [
                  {
                    text: 'Gallery',
                    onPress: () => openGalleryDirect(),
                  },
                  {
                    text: 'Camera',
                    onPress: () => openCameraDirect(),
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                ]
              );
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    console.log('🔍 Image picker - Permission granted, showing picker options');
    Alert.alert(
      'Select Profile Picture',
      'Permissions are set up! Choose your option:',
      [
        {
          text: 'Camera',
          onPress: () => openCamera(),
        },
        {
          text: 'Gallery',
          onPress: () => openGallery(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as any,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        if (response.errorMessage) {
          console.error('Camera error:', response.errorMessage);
          Alert.alert('Camera Error', 'Failed to take photo. Please try again.');
        }
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          console.log('🔍 Selected image from camera:', asset.uri);
          setProfileImageUri(asset.uri);
        }
      }
    });
  };

  const openGallery = () => {
    console.log('🔍 Opening gallery with permission check...');
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as any,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      console.log('🔍 Gallery response:', response);
      
      if (response.didCancel) {
        console.log('🔍 User cancelled gallery selection');
        return;
      }
      
      if (response.errorMessage) {
        console.error('Gallery error:', response.errorMessage);
        Alert.alert('Gallery Error', `Failed to select photo: ${response.errorMessage}`);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          console.log('✅ Selected image from gallery:', asset.uri);
          setProfileImageUri(asset.uri);
          Alert.alert('Success', 'Photo selected successfully!');
        }
      }
    });
  };

  const openGalleryDirect = () => {
    console.log('🔍 Opening gallery directly...');
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as any,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      console.log('🔍 Gallery response:', response);
      
      if (response.didCancel) {
        console.log('🔍 User cancelled gallery selection');
        return;
      }
      
      if (response.errorMessage) {
        console.error('Gallery error:', response.errorMessage);
        Alert.alert('Gallery Error', `Failed to select photo: ${response.errorMessage}`);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          console.log('✅ Selected image from gallery:', asset.uri);
          setProfileImageUri(asset.uri);
          Alert.alert('Success', 'Photo selected successfully!');
        }
      }
    });
  };

  const openCameraDirect = async () => {
    console.log('🔍 Opening camera directly...');
    
    // Request camera permission first
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is required to take photos. Please grant camera permission and try again.',
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'android') {
                  Linking.openSettings();
                }
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }
    } catch (error) {
      console.error('🔍 Permission request failed:', error);
      Alert.alert('Error', 'Failed to request camera permission. Please try again.');
      return;
    }

    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as any,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      console.log('🔍 Camera response:', response);
      
      if (response.didCancel) {
        console.log('🔍 User cancelled camera');
        return;
      }
      
      if (response.errorMessage) {
        console.error('Camera error:', response.errorMessage);
        Alert.alert('Camera Error', `Failed to take photo: ${response.errorMessage}`);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          console.log('✅ Selected image from camera:', asset.uri);
          setProfileImageUri(asset.uri);
          Alert.alert('Success', 'Photo captured successfully!');
        }
      }
    });
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      console.log('🔄 Starting image upload with URI:', imageUri);
      
      // Create file object for React Native
      const fileObject = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      };

      console.log('🔄 File object created:', fileObject);
      const uploadResponse = await apiClient.uploadProfileImage(fileObject);
      console.log('✅ Upload response:', uploadResponse);
      return uploadResponse.url;
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw new Error('Failed to upload profile image');
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return false;
    }
    
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    if (password && password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    console.log('🔄 EditProfileScreen - Starting profile update');
    console.log('🔄 Form data:', { fullName, email, phoneNumber });
    console.log('🔄 Current user before update:', JSON.stringify(user, null, 2));
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      let profileImageUrl = user?.profileImageUrl;

      // Upload new profile image if changed
      if (profileImageUri && profileImageUri !== user?.profileImageUrl) {
        try {
          console.log('🔄 Uploading new profile image...');
          profileImageUrl = await uploadProfileImage(profileImageUri);
          console.log('✅ Profile image uploaded:', profileImageUrl);
        } catch (error) {
          console.error('❌ Profile image upload failed:', error);
          Alert.alert('Upload Error', 'Failed to upload profile image. Profile will be updated without image.');
        }
      }

      // Prepare update data
      const updateData: any = {
        name: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        profileImageUrl,
      };

      // Only include password if it was entered
      if (password) {
        updateData.password = password;
      }

      // Update user profile
      console.log('� Updating user with data:', updateData);
      console.log('🔄 Current auth state before update:', { isAuthenticated, user });
      
      await updateUser(updateData);
      
      console.log('✅ User updated successfully');
      
      // Check auth state after update
      console.log('🔄 Auth state after update:', { isAuthenticated, user });

      // First show success message
      Alert.alert(
        'Success', 
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('🔄 Navigating back to Profile...');
              // Clear the entire navigation stack and start fresh with Dashboard
              navigation.reset({
                index: 0,
                routes: [{ 
                  name: 'Dashboard', 
                  params: { 
                    initialTab: 'Profile',
                    forceRefresh: Date.now() // Add timestamp to force refresh
                  } 
                }],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Check if user is still authenticated after error
      console.log('❌ User auth state after error:', { isAuthenticated, user });
      
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Edit Profile" 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={
                profileImageUri 
                  ? { uri: profileImageUri } 
                  : require('../assets/images/profile_user.png')
              } 
              style={styles.profileImage}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleChangeProfilePicture}
              disabled={isLoading}
            >
              <Image 
                source={require('../assets/images/camera.png')} 
                style={styles.cameraIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Fields Section */}
        <View style={styles.inputSection}>
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name..."
                placeholderTextColor={colors.gray.medium}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.inputWrapper, styles.disabledInput]}>
              <TextInput
                style={[styles.textInput, styles.disabledText]}
                value={email}
                placeholder="Enter email address..."
                placeholderTextColor={colors.gray.medium}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
              />
            </View>
            <Text style={styles.helpText}>Email cannot be changed here</Text>
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number..."
                placeholderTextColor={colors.gray.medium}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password..."
                placeholderTextColor={colors.gray.medium}
                secureTextEntry={true}
              />
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Enter password..."
                placeholderTextColor={colors.gray.medium}
                secureTextEntry={true}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonSection}>
          <CustomButton
            title={isLoading ? "Saving..." : "Save"}
            onPress={handleSave}
            variant="primary"
            size="medium"
            style={styles.saveButton}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 29,
    height: 29,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cameraIcon: {
    width: 15,
    height: 15,
    tintColor: colors.primary,
  },
  inputSection: {
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  inputWrapper: {
    backgroundColor: colors.gray.textInputBg,
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.gray.light,
  },
  textInput: {
    fontSize: 14,
    color: colors.black,
    fontFamily: Fonts.POPPINS_REGULAR,
    padding: 0,
  },
  buttonSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    width: '100%',
  },
  disabledInput: {
    backgroundColor: colors.gray.light,
    opacity: 0.6,
  },
  disabledText: {
    color: colors.gray.medium,
  },
  helpText: {
    fontSize: 12,
    color: colors.gray.medium,
    marginTop: 4,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
});

export default EditProfileScreen; 