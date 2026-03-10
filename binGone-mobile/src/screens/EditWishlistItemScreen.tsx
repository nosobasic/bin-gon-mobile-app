import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NavigationProp, RootStackParamList, WishlistItem } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { updateAdminWishlistItem, updateWishlistItem } from '../services/api';

interface EditWishlistItemScreenProps {
  navigation: NavigationProp;
  route: RouteProp<RootStackParamList, 'EditWishlistItem'>;
}

const EditWishlistItemScreen: React.FC<EditWishlistItemScreenProps> = ({
  navigation,
  route,
}) => {
  const { item } = route.params;
  const [name, setName] = useState(item?.name || item?.itemName || '');
  const [type, setType] = useState(item?.type || '');
  const [size, setSize] = useState(item?.size || '');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>(
    item?.priority || 'Medium'
  );
  const [location, setLocation] = useState(item?.location || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    coordinates: [number, number];
  } | null>(null);

  // Dropdowns visibility
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  // Options for dropdowns
  const typeOptions = [
    'Clothing',
    'Furniture',
    'Electronics',
    'Books',
    'Toys',
    'Kitchen Items',
    'Bedding',
    'Shoes',
    'Baby Items',
    'Sports Equipment',
    'Other',
  ];

  const sizeOptions = ['Small', 'Medium', 'Large', 'Extra Large', 'Any Size'];
  const priorityOptions: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];

  // Handle location selection
  const handleLocationSelect = (loc: { name: string; coordinates: [number, number] }) => {
    setSelectedLocation(loc);
    setLocation(loc.name);
  };

  // Navigate to location selection screen
  const handleSelectLocation = () => {
    navigation.navigate('LocationSelection', {
      onLocationSelect: handleLocationSelect,
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert(
        'Name Required',
        'Please provide a name for the wishlist item.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);
      
      // Convert priority to lowercase for API
      const apiPriority = priority.toLowerCase() as 'high' | 'medium' | 'low';

      const updatePayload = {
        name: name.trim(),
        type: type.trim() || undefined,
        size: size.trim() || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        priority: apiPriority,
      };

      try {
        await updateAdminWishlistItem(item.id, updatePayload);
      } catch (adminError) {
        console.log('Admin update failed, trying regular update:', adminError);
        await updateWishlistItem(item.id, updatePayload);
      }
      
      Alert.alert('Success', 'Wishlist item updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error updating wishlist item:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Failed to update wishlist item. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderTypeItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setType(item);
        setShowTypeDropdown(false);
      }}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderSizeItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setSize(item);
        setShowSizeDropdown(false);
      }}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderPriorityItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setPriority(item as 'Low' | 'Medium' | 'High');
        setShowPriorityDropdown(false);
      }}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Edit Wishlist Item"
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Item Name - Required field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Item Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g, Winter Coat"
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.gray.medium}
          />
          <Text style={styles.helperText}>
            Enter the name of the item you want to add to your wishlist
          </Text>
        </View>

        {/* Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Type</Text>
          <TouchableOpacity 
            style={styles.dropdownContainer}
            onPress={() => setShowTypeDropdown(true)}
          >
            <Text style={[styles.dropdownText, !type && styles.placeholderText]}>
              {type || 'Select a type'}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
          {type && (
            <View style={styles.selectedOption}>
              <Text style={styles.selectedOptionText}>{type}</Text>
              <TouchableOpacity onPress={() => setType('')}>
                <Text style={styles.removeOption}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          {showTypeDropdown && (
            <Modal
              visible={showTypeDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowTypeDropdown(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={0}
                onPress={() => setShowTypeDropdown(false)}
              >
                <View style={styles.modalContent}>
                  <FlatList
                    data={typeOptions}
                    renderItem={renderTypeItem}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.dropdownList}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </View>

        {/* Size */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Size</Text>
          <TouchableOpacity 
            style={styles.dropdownContainer}
            onPress={() => setShowSizeDropdown(true)}
          >
            <Text style={[styles.dropdownText, !size && styles.placeholderText]}>
              {size || 'Select a size'}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
          {size && (
            <View style={styles.selectedOption}>
              <Text style={styles.selectedOptionText}>{size}</Text>
              <TouchableOpacity onPress={() => setSize('')}>
                <Text style={styles.removeOption}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          {showSizeDropdown && (
            <Modal
              visible={showSizeDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowSizeDropdown(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={0}
                onPress={() => setShowSizeDropdown(false)}
              >
                <View style={styles.modalContent}>
                  <FlatList
                    data={sizeOptions}
                    renderItem={renderSizeItem}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.dropdownList}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </View>

        {/* Priority */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Priority</Text>
          <TouchableOpacity 
            style={styles.dropdownContainer}
            onPress={() => setShowPriorityDropdown(true)}
          >
            <Text style={[styles.dropdownText, !priority && styles.placeholderText]}>
              {priority || 'Select priority'}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
          {priority && (
            <View style={styles.selectedOption}>
              <Text style={styles.selectedOptionText}>{priority}</Text>
              <TouchableOpacity onPress={() => setPriority('Medium')}>
                <Text style={styles.removeOption}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          {showPriorityDropdown && (
            <Modal
              visible={showPriorityDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowPriorityDropdown(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={0}
                onPress={() => setShowPriorityDropdown(false)}
              >
                <View style={styles.modalContent}>
                  <FlatList
                    data={priorityOptions}
                    renderItem={renderPriorityItem}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.dropdownList}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
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
                !location && styles.placeholderText
              ]}>
                {location || 'Select a location'}
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

        {/* Notes */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Add any notes about this item..."
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor={colors.gray.medium}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            loading && styles.disabledSubmitButton
          ]} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Updating...' : 'Update Item'}
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
  label: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(1.5),
  },
  required: {
    color: '#FF3B30',
    fontSize: wp(3.5),
  },
  helperText: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    marginTop: wp(1),
    fontStyle: 'italic',
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
    backgroundColor: 'white',
  },
  textArea: {
    height: wp(25),
    textAlignVertical: 'top',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
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
    fontSize: wp(3),
    color: colors.gray.medium,
  },
  selectedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: wp(2),
    marginTop: wp(2),
  },
  selectedOptionText: {
    fontSize: wp(3),
    fontFamily: Fonts.POPPINS_MEDIUM,
    color: colors.primary,
    flex: 1,
  },
  removeOption: {
    fontSize: wp(4),
    color: colors.gray.medium,
    marginLeft: wp(2),
  },
  locationContainer: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
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
    fontSize: wp(2.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    marginTop: wp(0.5),
  },
  locationIcon: {
    fontSize: wp(4),
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: wp(2.5),
    paddingVertical: wp(4),
    alignItems: 'center',
    marginTop: wp(4),
  },
  disabledSubmitButton: {
    backgroundColor: colors.gray.medium,
  },
  submitButtonText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: 'white',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: wp(3),
    maxHeight: hp(60),
    width: wp(80),
    paddingVertical: wp(2),
  },
  dropdownList: {
    paddingVertical: wp(2),
  },
  dropdownItem: {
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  dropdownItemText: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
  },
});

export default EditWishlistItemScreen;
