import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { NavigationProp } from '../types/navigation';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { AppHeader, CustomButton } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { locationStorage } from '../utils/locationStorage';

interface AreaSelectionScreenProps {
  navigation: NavigationProp;
}

interface City {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number]; // [longitude, latitude]
}

const cities: City[] = [
  { id: '1', name: 'Los Angeles', state: 'California', coordinates: [-118.2437, 34.0522] },
  { id: '2', name: 'Chicago', state: 'Illinois', coordinates: [-87.6298, 41.8781] },
  { id: '3', name: 'New York City', state: 'New York', coordinates: [-74.0060, 40.7128] },
  { id: '4', name: 'Houston', state: 'Texas', coordinates: [-95.3698, 29.7604] },
  { id: '5', name: 'Phoenix', state: 'Arizona', coordinates: [-112.0740, 33.4484] },
  { id: '6', name: 'Philadelphia', state: 'Pennsylvania', coordinates: [-75.1652, 39.9526] },
  { id: '7', name: 'San Antonio', state: 'Texas', coordinates: [-98.4936, 29.4241] },
  { id: '8', name: 'San Diego', state: 'California', coordinates: [-117.1611, 32.7157] },
  { id: '9', name: 'Dallas', state: 'Texas', coordinates: [-96.7970, 32.7767] },
];

const AreaSelectionScreen: React.FC<AreaSelectionScreenProps> = ({ navigation }) => {
  const { updateUser } = useAuth();
  const [selectedCity, setSelectedCity] = useState<string>('3'); // Default to New York City
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCitySelect = useCallback((cityId: string) => {
    setSelectedCity(cityId);
  }, []);

  const handleContinue = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const selectedCityData = cities.find(city => city.id === selectedCity);
      if (!selectedCityData) {
        Alert.alert('Error', 'Please select a city');
        return;
      }

      // Save coordinates locally since backend doesn't provide them
      await locationStorage.saveUserCoordinates(
        selectedCityData.coordinates,
        selectedCityData.name,
        selectedCityData.state
      );

      const locationData = {
        location: {
          type: 'Point' as const,
          coordinates: selectedCityData.coordinates
        }
      };

      await updateUser(locationData);
      
      navigation.replace('Dashboard');
    } catch (error: any) {
      console.error('❌ Failed to update location:', error);
      Alert.alert(
        'Error', 
        'Failed to update your location. Please try again.',
        [
          {
            text: 'Retry',
            onPress: handleContinue,
          },
          {
            text: 'Continue Anyway',
            onPress: () => navigation.replace('Dashboard'),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  }, [navigation, selectedCity, updateUser]);

  const handlePickOnMap = useCallback(() => {
    // TODO: Implement map selection functionality
    console.log('Pick on map pressed');
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      
      {/* Header */}
      <AppHeader 
        title="Select Your Area" 
        type="other" 
        onBackPress={handleBack}
        showGpsButton={false}
      />

      {/* Search Section */}
      <View style={{ paddingHorizontal: wp(5), marginBottom: hp(3) }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.gray.borderGray,
          borderRadius: wp(10),
          backgroundColor: colors.white,
        //   overflow: 'hidden',
        }}>
          {/* Search Input Section */}
          <View style={{
            flex: 2,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: wp(4),
            paddingVertical: hp(1),
          }}>
            <Image 
              source={require('../assets/images/search.png')} 
              style={{ width: wp(4), height: wp(4), marginRight: wp(2) }}
              resizeMode="contain"
            />
            <TextInput
              placeholder="Search here..."
              placeholderTextColor={colors.text.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                fontSize: wp(3.5),
                fontFamily: Fonts.POPPINS_REGULAR,
                color: colors.text.black,
              }}
            />
          </View>
          
          {/* Pick on Map Button */}
          {/* <TouchableOpacity
            onPress={handlePickOnMap}
            style={{
            //   flex: 1,
              backgroundColor: colors.primary,
              paddingVertical: wp(4),
              paddingHorizontal: wp(6),
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: wp(10),
              marginRight: wp(4)
            }}
          >
            <Text style={{
              fontSize: wp(3.2),
              fontFamily: Fonts.POPPINS_SEMIBOLD,
              color: colors.white,
            }}>
              Pick on Map
            </Text>
          </TouchableOpacity> */}
        </View>
      </View>

      {/* Cities List */}
      <ScrollView 
        style={{ flex: 1, paddingHorizontal: wp(5) }}
        showsVerticalScrollIndicator={false}
      >
        {filteredCities.map((city) => (
          <TouchableOpacity
            key={city.id}
            onPress={() => handleCitySelect(city.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: wp(3),
              paddingHorizontal: wp(6),
              borderRadius: wp(10),
              borderWidth: selectedCity === city.id ? 1 : 0,
              borderColor: selectedCity === city.id ? colors.primary : 'transparent',
              backgroundColor: selectedCity === city.id ? colors.white : 'transparent',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: wp(4.25),
                fontFamily: Fonts.POPPINS_SEMIBOLD,
                color: colors.text.black,
              }}>
                {city.name}
              </Text>
              <Text style={{
                fontSize: wp(3.25),
                fontFamily: Fonts.POPPINS_REGULAR,
                color: colors.text.gray,
                marginTop: -wp(1),
              }}>
                {city.state}
              </Text>
            </View>
            
            {selectedCity === city.id && (
              <View style={{
              
              }}>
                <Image 
                  source={require('../assets/images/tick.png')} 
                  style={{ width: wp(5), height: wp(5) }}
                  resizeMode="contain"
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Continue Button */}
      <View style={{ paddingHorizontal: wp(5), paddingBottom: hp(3) }}>
        <CustomButton
          title={isLoading ? "Updating Location..." : "Continue"}
          onPress={handleContinue}
          variant="primary"
          size="medium"
          disabled={isLoading}
        />
      </View>
    </SafeAreaView>
  );
};

export default AreaSelectionScreen; 