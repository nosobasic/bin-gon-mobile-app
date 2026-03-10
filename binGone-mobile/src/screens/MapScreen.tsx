import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import DonationMarkerSheet from '../components/DonationMarkerSheet';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { locationStorage, UserCoordinates } from '../utils/locationStorage';
import { generateCategoryColor } from '../utils/categoryColors';
import { Listing } from '../services/api';

interface MapScreenProps {
  navigation: NavigationProp;
}

interface DonationLocation {
  id: string;
  title: string;
  description: string;
  category: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  donorName: string;
}

const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const { categories, listings, fetchCategories, fetchListings, loadingCategories, loadingListings } = useData();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [localCoordinates, setLocalCoordinates] = useState<UserCoordinates | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Listing | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Track component mount state
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const loadData = async () => {
        if (!isActive || !isMounted) return;
        
        try {
          console.log('🗺️ MapScreen - Loading data on focus');
          await Promise.all([
            fetchCategories(),
            fetchListings()
          ]);
        } catch (error) {
          console.error('🗺️ MapScreen - Error loading data:', error);
        }
      };
      
      const loadLocalCoordinates = async () => {
        if (!isActive || !isMounted) return;
        
        try {
          const coordinates = await locationStorage.getUserCoordinates();
          if (coordinates && isActive) {
            setLocalCoordinates(coordinates);
          }
        } catch (error) {
          console.error('🗺️ MapScreen - Error loading coordinates:', error);
        }
      };

      loadData();
      loadLocalCoordinates();

      return () => {
        isActive = false;
      };
    }, [fetchCategories, fetchListings, isMounted])
  );

  // Convert listings to donation locations for map with proper null checks
  const donationLocations: DonationLocation[] = React.useMemo(() => {
    if (!listings || !Array.isArray(listings) || !isMounted) {
      return [];
    }

    return listings
      .filter(listing => {
        // Comprehensive null checks
        if (!listing || !listing.location || !listing.location.coordinates) {
          return false;
        }
        
        const coordinates = listing.location.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) {
          return false;
        }
        
        return true;
      })
      .filter(listing => {
        // Filter out invalid coordinates (ocean coordinates, etc.)
        const lat = listing.location?.coordinates?.[1];
        const lng = listing.location?.coordinates?.[0];
        
        // Check if coordinates are reasonable (not in ocean)
        const isValidLat = lat != null && lat > -90 && lat < 90;
        const isValidLng = lng != null && lng > -180 && lng < 180;
        
        // Additional check: if coordinates seem to be in ocean, skip them
        const isInOcean = (lat === 0 && lng === 0) || 
                         (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) ||
                         (lat == null || lng == null);
        
        return isValidLat && isValidLng && !isInOcean;
      })
      .map(listing => {
        // Find the category name from the categories array using categoryId
        const categoryName = listing.category?.name || 
          (categories && Array.isArray(categories) ? categories.find(cat => cat && cat.id === listing.categoryId)?.name : null) || 
          'Other';
        
        console.log('🗺️ Creating map pin for listing:', {
          id: listing.id,
          title: listing.title,
          coordinates: listing.location?.coordinates,
          latitude: listing.location?.coordinates?.[1],
          longitude: listing.location?.coordinates?.[0],
          category: categoryName
        });
        
        return {
          id: listing.id,
          title: listing.title || 'Untitled',
          description: listing.description || '',
          category: categoryName,
          coordinate: {
            latitude: listing.location.coordinates[1], // [longitude, latitude] format
            longitude: listing.location.coordinates[0],
          },
          donorName: 'Donor', // Simplified for now
        };
      });
  }, [listings, categories, isMounted]);

  // Get unique categories from actual listings with safety checks
  const uniqueListingCategories = React.useMemo(() => {
    if (!donationLocations || !Array.isArray(donationLocations)) {
      return [];
    }
    return [...new Set(donationLocations.map(location => location?.category).filter(Boolean))];
  }, [donationLocations]);
  
  const categoryOptions = ['All', ...uniqueListingCategories];

  // Calculate initial region with safety checks
  const initialRegion = React.useMemo(() => {
    if (localCoordinates && localCoordinates.latitude && localCoordinates.longitude) {
      // Use user's saved location as primary
      return {
        latitude: localCoordinates.latitude,
        longitude: localCoordinates.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    } else if (donationLocations && donationLocations.length > 0 && donationLocations[0]?.coordinate) {
      // Fallback to first listing location
      return {
        latitude: donationLocations[0].coordinate.latitude,
        longitude: donationLocations[0].coordinate.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    } else {
      // Default to NYC if no saved location or listings
      return {
        latitude: 40.7128,
        longitude: -74.0060,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }
  }, [localCoordinates, donationLocations]);

  const getCategoryColor = (category: string) => {
    return generateCategoryColor(category);
  };

  const filteredLocations = React.useMemo(() => {
    if (!donationLocations || !Array.isArray(donationLocations)) {
      return [];
    }
    
    return selectedCategory === 'All' 
      ? donationLocations 
      : donationLocations.filter(location => location && location.category === selectedCategory);
  }, [donationLocations, selectedCategory]);

  const hasLocations = filteredLocations && filteredLocations.length > 0;

  // Determine filter title based on user account type or role and location
  const getFilterTitle = () => {
    let baseTitle = '';
    if (user?.accountType === 'donor' || user?.roleId === 1) {
      baseTitle = 'Where You Donate';
    } else if (user?.accountType === 'receiver' || user?.roleId === 2) {
      baseTitle = 'Donations Near You';
    } else {
      baseTitle = 'Donations Near You'; // Default fallback
    }
    return baseTitle;
  };

  // Handle marker press - show bottom sheet
  const handleMarkerPress = (listing: Listing) => {
    setSelectedDonation(listing);
    setShowBottomSheet(true);
  };

  // Handle contact donor
  const handleContactDonor = () => {
    if (selectedDonation) {
      setShowBottomSheet(false);
      // Navigate to chat with the donor
      navigation.navigate('ChatDetail', {
        userName: selectedDonation.donorName || 'Donor',
        otherUserName: selectedDonation.donorName || 'Donor',
        listingTitle: selectedDonation.title,
        userAvatar: '',
      });
    }
  };

  // Close bottom sheet
  const handleCloseSheet = () => {
    setShowBottomSheet(false);
    setTimeout(() => setSelectedDonation(null), 300);
  };

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup any pending operations when component unmounts
      console.log('🗺️ MapScreen - Component unmounting, cleaning up');
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Map" 
        onBackPress={() => navigation.goBack()}
        showGpsButton={false}
      />
      
      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>{getFilterTitle()}</Text>
        <TouchableOpacity 
          style={styles.categoryButton}
          onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
        >
          <Text style={styles.categoryButtonText}>{selectedCategory}</Text>
          <Text style={[styles.dropdownIcon, showCategoryDropdown && styles.dropdownIconRotated]}>
            ▼
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {(loadingCategories || loadingListings) ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading donations...</Text>
        </View>
      ) : hasLocations ? (
        <>
          {/* Map View */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={initialRegion}
              showsUserLocation={false}
              showsMyLocationButton={false}
              provider="google"
              onMapReady={() => {
                console.log('🗺️ MapView ready');
              }}
            >
              {/* Show donation location markers with safety checks */}
              {filteredLocations && Array.isArray(filteredLocations) && filteredLocations.map((location) => {
                if (!location || !location.coordinate || !location.id) {
                  return null;
                }
                
                // Find the full listing for this location
                const listing = listings?.find(l => l.id === location.id);
                if (!listing) return null;
                
                return (
                  <Marker
                    key={location.id}
                    coordinate={location.coordinate}
                    pinColor={getCategoryColor(location.category || 'Other')}
                    onPress={() => handleMarkerPress(listing)}
                  />
                );
              })}
            </MapView>
          </View>

          {/* Category Filter Dropdown */}
          {showCategoryDropdown && (
            <View style={styles.categoryDropdown}>
              {categoryOptions.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    selectedCategory === category && styles.selectedCategoryOption
                  ]}
                  onPress={() => {
                    console.log('🔍 Category selected:', category);
                    setSelectedCategory(category);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    selectedCategory === category && styles.selectedCategoryOptionText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      ) : (
        /* No Location Found UI */
        <View style={styles.noLocationContainer}>
          <Text style={styles.noLocationTitle}>No Donations Found</Text>
          <Text style={styles.noLocationDescription}>
            We couldn't find any active donations near you right now. Please check back later.
          </Text>
        </View>
      )}

      {/* Small Popup Above Marker for Donation Details */}
      {selectedDonation && showBottomSheet && (
        <TouchableOpacity
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={handleCloseSheet}
        >
          <View style={styles.popupContainer}>
            <DonationMarkerSheet
              donation={selectedDonation}
              onContactDonor={handleContactDonor}
            />
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: wp(3),
    backgroundColor: colors.white,
  },
  filterTitle: {
    fontSize: wp(4.5),
    fontFamily: Fonts.MONTSERRAT_BOLD,
    color: colors.black,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: wp(4),
    paddingVertical: wp(2),
    borderRadius: wp(6),
    borderWidth: 1,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_MEDIUM,
    color: colors.primary,
    marginRight: wp(2),
  },
  dropdownIcon: {
    fontSize: wp(3),
    color: colors.primary,
  },
  dropdownIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: wp(5),
    marginBottom: wp(3),
    borderRadius: wp(4),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  map: {
    flex: 1,
  },
  categoryDropdown: {
    position: 'absolute',
    top: hp(15),
    right: wp(5),
    backgroundColor: colors.white,
    borderRadius: wp(3),
    paddingVertical: wp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: wp(25),
  },
  categoryOption: {
    paddingHorizontal: wp(4),
    paddingVertical: wp(2.5),
  },
  selectedCategoryOption: {
    backgroundColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_MEDIUM,
    color: colors.black,
  },
  selectedCategoryOptionText: {
    color: colors.white,
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
    backgroundColor: colors.white,
  },
  noLocationTitle: {
    fontSize: wp(4),
    fontFamily: Fonts.MONTSERRAT_BOLD,
    color: colors.black,
    marginBottom: hp(1),
    textAlign: 'center',
  },
  noLocationDescription: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    textAlign: 'center',
    marginBottom: hp(3),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_MEDIUM,
    color: colors.primary,
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: hp(25),
    alignItems: 'center',
    zIndex: 1000,
  },
  popupContainer: {
    width: wp(60),
    backgroundColor: colors.white,
    borderRadius: wp(2.5),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
});

export default MapScreen;
