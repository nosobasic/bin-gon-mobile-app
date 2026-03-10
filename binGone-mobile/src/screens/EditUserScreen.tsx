import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { NavigationProp, RootStackParamList, UserData } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { updateAdminUser } from '../services/api';

interface EditUserScreenProps {
  navigation: NavigationProp;
  route: RouteProp<RootStackParamList, 'EditUser'>;
}

const EditUserScreen: React.FC<EditUserScreenProps> = ({ navigation, route }) => {
  const { userData } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userData.userName,
    email: userData.email,
    phoneNumber: userData.phoneNumber || '',
    address: userData.address || '',
    accountType: userData.accountType,
    isActive: userData.status === 'Active',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleStatusSelect = (isActive: boolean) => {
    setFormData(prev => ({ ...prev, isActive }));
    setShowStatusDropdown(false);
  };

  const statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      console.log('Updating user with data:', formData);
      
      await updateAdminUser(userData.id, {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address || undefined,
        accountType: formData.accountType as 'donor' | 'receiver' | 'admin',
        isActive: formData.isActive,
      });

      Alert.alert(
        'Success',
        'User information has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating user:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update user. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Edit User" 
        type="other" 
        onBackPress={handleBackPress}
        showGpsButton={false}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>User Information</Text>
          
          <CustomTextInput
            label="Full Name"
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            placeholder="Enter full name"
            error={errors.name}
          />

          <CustomTextInput
            label="Email Address"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <CustomTextInput
            label="Phone Number"
            value={formData.phoneNumber}
            onChangeText={(value) => updateFormData('phoneNumber', value)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            error={errors.phoneNumber}
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.addressInput, errors.address && styles.inputError]}
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              placeholder="Enter address"
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>

          <View style={styles.rowContainer}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Account Type</Text>
              <View style={styles.accountTypeContainer}>
                <Text style={styles.accountTypeText}>
                  {formData.accountType.charAt(0).toUpperCase() + formData.accountType.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity 
                style={styles.statusContainer}
                onPress={() => setShowStatusDropdown(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.statusText,
                  { color: formData.isActive ? colors.primary : colors.gray.medium }
                ]}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Text>
                <Text style={styles.chevron}>▼</Text>
              </TouchableOpacity>
              
              {showStatusDropdown && (
                <Modal
                  visible={showStatusDropdown}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowStatusDropdown(false)}
                >
                  <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowStatusDropdown(false)}
                  >
                    <View style={styles.statusModalContent}>
                      <FlatList
                        data={statusOptions}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.statusOption,
                              formData.isActive === item.value && styles.statusOptionSelected
                            ]}
                            onPress={() => handleStatusSelect(item.value)}
                          >
                            <Text style={[
                              styles.statusOptionText,
                              formData.isActive === item.value && styles.statusOptionTextSelected
                            ]}>
                              {item.label}
                            </Text>
                            {formData.isActive === item.value && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item.label}
                      />
                    </View>
                  </TouchableOpacity>
                </Modal>
              )}
            </View>
          </View>

          <Text style={styles.infoText}>
            Registration Date: {userData.registrationDate}
          </Text>
          
          <Text style={styles.infoText}>
            Number of Donations: {userData.numberOfDonations}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title={loading ? "Saving..." : "Save Changes"}
            onPress={handleSave}
            disabled={loading}
            loading={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingVertical: wp(5),
    paddingBottom: hp(5),
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: wp(3),
    padding: wp(5),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: colors.gray.borderGray,
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: hp(2),
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  halfWidth: {
    flex: 1,
    marginRight: wp(2),
  },
  label: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    marginBottom: hp(1),
  },
  accountTypeContainer: {
    backgroundColor: colors.gray.light,
    padding: wp(3),
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: colors.gray.borderGray,
  },
  accountTypeText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_MEDIUM,
    color: colors.black,
  },
  statusContainer: {
    backgroundColor: colors.gray.light,
    padding: wp(3),
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: colors.gray.borderGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  chevron: {
    fontSize: wp(3),
    color: colors.text.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModalContent: {
    backgroundColor: colors.white,
    borderRadius: wp(3),
    width: wp(60),
    maxHeight: hp(30),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  statusOption: {
    paddingHorizontal: wp(5),
    paddingVertical: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.borderGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  statusOptionText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
  },
  statusOptionTextSelected: {
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.primary,
  },
  checkmark: {
    fontSize: wp(4),
    color: colors.primary,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  infoText: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    marginBottom: hp(0.5),
  },
  buttonContainer: {
    paddingHorizontal: wp(2),
  },
  inputContainer: {
    marginBottom: wp(4),
  },
  addressInput: {
    backgroundColor: colors.gray.textInputBg,
    borderRadius: wp(7),
    paddingHorizontal: wp(6),
    paddingVertical: wp(3.9),
    fontSize: wp(3.3),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
    lineHeight: wp(6),
    textAlignVertical: 'top',
    minHeight: hp(8),
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    fontSize: wp(3),
    color: '#FF6B6B',
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: hp(0.5),
  },
});

export default EditUserScreen;
