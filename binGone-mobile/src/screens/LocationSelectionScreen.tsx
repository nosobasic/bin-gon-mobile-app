import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { getDetailedAddress } from '../services/geocoding';
import { useAuth } from '../contexts/AuthContext';
import { locationStorage, UserCoordinates } from '../utils/locationStorage';

interface LocationSelectionScreenProps {
  navigation: NavigationProp;
  route: {
    params: {
      onLocationSelect: (location: {
        name: string;
        coordinates: [number, number];
      }) => void;
    };
  };
}

interface SelectedLocation {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
}

const LocationSelectionScreen: React.FC<LocationSelectionScreenProps> = ({ navigation, route }) => {
  const { onLocationSelect } = route.params;
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128, // Default to NYC
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [localCoordinates, setLocalCoordinates] = useState<UserCoordinates | null>(null);
  
  const mapRef = useRef<MapView>(null);

  // Set initial region based on user's saved location from local storage
  useEffect(() => {
    const loadLocalCoordinates = async () => {
      try {
        const coordinates = await locationStorage.getUserCoordinates();
        if (coordinates) {
          setLocalCoordinates(coordinates);
          setMapRegion({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
          
         
        } else {
          console.log('No local coordinates found, using default coordinates');
        }
      } catch (error) {
        console.error('Failed to load local coordinates:', error);
      }
    };

    loadLocalCoordinates();
  }, []);

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    console.log('Map pressed at:', { latitude, longitude });
    
    setIsLoadingLocation(true);
    
    try {
      // Get the place name from coordinates using Google Geocoding API
      const locationData = await getDetailedAddress(latitude, longitude);
      
      const newLocation: SelectedLocation = {
        id: 'manual',
        name: locationData.name,
        address: locationData.fullAddress,
        coordinates: [longitude, latitude],
      };
      
      setSelectedLocation(newLocation);
      
      // // Save coordinates locally for future use
      // await locationStorage.saveUserCoordinates(
      //   [longitude, latitude],
      //   locationData.name
      // );
    } catch (error) {
      console.error('Error getting location name:', error);
      // Fallback to coordinates if geocoding fails
      const newLocation: SelectedLocation = {
        id: 'manual',
        name: 'Selected Location',
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        coordinates: [longitude, latitude],
      };
      setSelectedLocation(newLocation);
      
      // // Save coordinates locally even if geocoding fails
      // await locationStorage.saveUserCoordinates(
      //   [longitude, latitude],
      //   'Selected Location'
      // );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect({
        name: selectedLocation.name,
        coordinates: selectedLocation.coordinates,
      });
      navigation.goBack();
    } else {
      Alert.alert('No Location Selected', 'Please tap on the map to select a location.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Select Location" 
        onBackPress={() => navigation.goBack()}
      />
      
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          onPress={handleMapPress}
          showsUserLocation={false}
          showsMyLocationButton={false}
          provider="google"
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.coordinates[1],
                longitude: selectedLocation.coordinates[0],
              }}
              title={selectedLocation.name}
              description={selectedLocation.address}
              pinColor={colors.primary}
            />
          )}
        </MapView>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
           Tap on the map to select a specific location
        </Text>
        {isLoadingLocation && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Getting location name...</Text>
          </View>
        )}
      </View>

      {/* Confirm Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedLocation && styles.disabledButton
          ]}
          onPress={handleConfirmLocation}
          disabled={!selectedLocation}
        >
          <Text style={styles.confirmButtonText}>
            Confirm Location
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  mapContainer: {
    flex: 1,
    marginHorizontal: wp(5),
    marginTop: wp(3),
    marginBottom: wp(2),
    borderRadius: wp(4),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  map: {
    flex: 1,
  },
  instructionsContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: wp(2),
    backgroundColor: colors.lightGray + '50',
  },
  instructionsText: {
    fontSize: wp(3),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: wp(2),
  },
  loadingText: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.primary,
    marginLeft: wp(2),
  },
  buttonContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: wp(3),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: wp(4),
    borderRadius: wp(8),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(0.5),
    },
    shadowOpacity: 0.25,
    shadowRadius: wp(1),
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: colors.gray.medium,
    opacity: 0.6,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
});

export default LocationSelectionScreen;
