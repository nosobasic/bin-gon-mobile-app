import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NavigationProp, RootStackParamList, UserData } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { apiClient, Listing } from '../services/api';
import { useData } from '../contexts/DataContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface SelectListingsToDeleteScreenProps {
  navigation: NavigationProp;
  route: RouteProp<RootStackParamList, 'SelectListingsToDelete'>;
}

interface SelectableListing extends Listing {
  selected: boolean;
}

const SelectListingsToDeleteScreen: React.FC<SelectListingsToDeleteScreenProps> = ({ navigation, route }) => {
  const { userData } = route.params;
  const { deleteListing } = useData();
  const [listings, setListings] = useState<SelectableListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Fetch user's donation listings
  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const userListings = await apiClient.getUserListings(userData.id);
        if (userListings.length > 0) {
        }
        const selectableListings = userListings.map(listing => ({
          ...listing,
          selected: false,
        }));
        setListings(selectableListings);
      } catch (err: any) {
        console.error('Error fetching user listings:', err);
        setError('Failed to load donation listings');
        Alert.alert('Error', 'Failed to load donation listings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (userData?.id) {
      fetchUserListings();
    } else {
      setLoading(false);
      setError('User ID not available');
    }
  }, [userData?.id]);

  const toggleListingSelection = (listingId: string) => {
    setListings(prev => prev.map(listing => 
      listing.id === listingId 
        ? { ...listing, selected: !listing.selected }
        : listing
    ));
  };

  const selectAllListings = () => {
    setListings(prev => prev.map(listing => ({ ...listing, selected: true })));
  };

  const deselectAllListings = () => {
    setListings(prev => prev.map(listing => ({ ...listing, selected: false })));
  };

  const getSelectedCount = () => {
    return listings.filter(listing => listing.selected).length;
  };

  const handleDeleteSelected = async () => {
    const selectedListings = listings.filter(listing => listing.selected);
    
    if (selectedListings.length === 0) {
      Alert.alert('No Selection', 'Please select at least one listing to delete.');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${selectedListings.length} listing(s)? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteSelected,
        },
      ]
    );
  };

  const confirmDeleteSelected = async () => {
    const selectedListings = listings.filter(listing => listing.selected);
    setDeleting(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const listing of selectedListings) {
        try {
          try {
            const existingListing = await apiClient.getListing(listing.id);
          } catch (verifyError: any) {
            errorCount++;
            continue;
          }
          
          await deleteListing(listing.id);
          successCount++;
        } catch (error: any) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        if (errorCount > 0) {
          Alert.alert(
            'Partial Success', 
            `Successfully deleted ${successCount} listing(s), but ${errorCount} failed. Please try again for the failed ones.`
          );
        } else {
          Alert.alert('Success', `Successfully deleted ${successCount} listing(s)!`);
        }
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to delete any listings. Please check your connection and try again.');
      }
    } catch (error) {
      console.error('Failed to delete listings:', error);
      Alert.alert('Error', 'Failed to delete listings. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const getListingImage = (listing: Listing) => {
    if (listing.images && listing.images.length > 0) {
      return { uri: listing.images[0] };
    }
    return require('../assets/images/stationery.png');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader 
          type="other" 
          title="Select Listings to Delete" 
          onBackPress={handleBackPress}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader 
          type="other" 
          title="Select Listings to Delete" 
          onBackPress={handleBackPress}
        />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={wp(15)} color={colors.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (listings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader 
          type="other" 
          title="Select Listings to Delete" 
          onBackPress={handleBackPress}
        />
        <View style={styles.emptyContainer}>
          <MaterialIcons name="inbox" size={wp(15)} color={colors.gray.medium} />
          <Text style={styles.emptyText}>No listings found</Text>
          <Text style={styles.emptySubtext}>This donor has no active listings to delete</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Select Listings to Delete" 
        onBackPress={handleBackPress}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delete Listings for {userData.userName}</Text>
        <Text style={styles.headerSubtitle}>
          Select the listings you want to delete. This action cannot be undone.
        </Text>
        
        <View style={styles.selectionControls}>
          <TouchableOpacity style={styles.controlButton} onPress={selectAllListings}>
            <Text style={styles.controlButtonText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={deselectAllListings}>
            <Text style={styles.controlButtonText}>Deselect All</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.selectionCount}>
          {getSelectedCount()} of {listings.length} listings selected
        </Text>
      </View>

      <ScrollView style={styles.listingsContainer} showsVerticalScrollIndicator={false}>
        {listings.map((listing) => (
          <TouchableOpacity
            key={listing.id}
            style={[styles.listingCard, listing.selected && styles.selectedListingCard]}
            onPress={() => toggleListingSelection(listing.id)}
            activeOpacity={0.8}
          >
            <View style={styles.listingContent}>
              <View style={styles.checkboxContainer}>
                <MaterialIcons
                  name={listing.selected ? 'check-box' : 'check-box-outline-blank'}
                  size={wp(6)}
                  color={listing.selected ? colors.primary : colors.gray.medium}
                />
              </View>
              
              <Image source={getListingImage(listing)} style={styles.listingImage} />
              
              <View style={styles.listingDetails}>
                <Text style={styles.listingTitle} numberOfLines={2}>
                  {listing.title}
                </Text>
                <Text style={styles.listingDescription} numberOfLines={2}>
                  {listing.description}
                </Text>
                <Text style={styles.listingLocation} numberOfLines={1}>
                  📍 {listing.address}
                </Text>
                <Text style={styles.listingDate}>
                  Listed: {new Date(listing.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {getSelectedCount() > 0 && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteSelected}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <MaterialIcons name="delete" size={wp(5)} color={colors.white} />
            )}
            <Text style={styles.deleteButtonText}>
              {deleting ? 'Deleting...' : `Delete ${getSelectedCount()} Listing(s)`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: wp(4),
    fontSize: wp(4),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  errorText: {
    marginTop: wp(4),
    fontSize: wp(4),
    color: colors.red,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: wp(6),
    paddingHorizontal: wp(8),
    paddingVertical: wp(3),
    backgroundColor: colors.primary,
    borderRadius: wp(2),
  },
  retryButtonText: {
    color: colors.white,
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  emptyText: {
    marginTop: wp(4),
    fontSize: wp(5),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  emptySubtext: {
    marginTop: wp(2),
    fontSize: wp(4),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: wp(5),
    paddingVertical: wp(4),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  headerTitle: {
    fontSize: wp(5),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginBottom: wp(2),
  },
  headerSubtitle: {
    fontSize: wp(4),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginBottom: wp(4),
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: wp(3),
  },
  controlButton: {
    flex: 1,
    paddingVertical: wp(3),
    paddingHorizontal: wp(4),
    backgroundColor: colors.gray.light,
    borderRadius: wp(2),
    marginHorizontal: wp(1),
  },
  controlButtonText: {
    textAlign: 'center',
    fontSize: wp(4),
    color: colors.primary,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  selectionCount: {
    fontSize: wp(4),
    color: colors.primary,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: 'center',
  },
  listingsContainer: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  listingCard: {
    backgroundColor: colors.white,
    borderRadius: wp(3),
    marginVertical: wp(2),
    padding: wp(4),
    borderWidth: 1,
    borderColor: colors.gray.light,
  },
  selectedListingCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  listingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: wp(3),
  },
  listingImage: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(2),
    marginRight: wp(3),
  },
  listingDetails: {
    flex: 1,
  },
  listingTitle: {
    fontSize: wp(4.5),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginBottom: wp(1),
  },
  listingDescription: {
    fontSize: wp(3.5),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginBottom: wp(1),
  },
  listingLocation: {
    fontSize: wp(3.5),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginBottom: wp(1),
  },
  listingDate: {
    fontSize: wp(3),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  bottomActions: {
    paddingHorizontal: wp(5),
    paddingVertical: wp(4),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
    paddingVertical: wp(4),
    borderRadius: wp(2),
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: wp(4.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginLeft: wp(2),
  },
});

export default SelectListingsToDeleteScreen;
