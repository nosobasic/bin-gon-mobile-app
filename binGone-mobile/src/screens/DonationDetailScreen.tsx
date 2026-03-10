import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { NavigationProp, ProductCard } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

interface DonationDetailScreenProps {
  navigation: NavigationProp;
  route: {
    params: {
      donation: ProductCard;
    };
  };
}

const DonationDetailScreen: React.FC<DonationDetailScreenProps> = ({ navigation, route }) => {
  const { donation } = route.params;
  const [isFavorite, setIsFavorite] = useState(donation.isFavorite);
  const [isContactingDonor, setIsContactingDonor] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  // Get images array - use donation.images if available, otherwise fallback to single image
  let images = donation.images && donation.images.length > 0 
    ? donation.images.filter(img => typeof img === 'string') // Only include string URLs
    : [];
  
  // If no valid images found, use fallback
  if (images.length === 0) {
    images = [require('../assets/images/feature.png')];
  }
  
  const { createThread } = useChat();
  const { user } = useAuth();

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleContactDonor = async () => {
    try {
      setIsContactingDonor(true);
      
      // Check if user is authenticated
      if (!user) {
        Alert.alert(
          'Login Required',
          'Please login to contact the donor.',
          [{ text: 'OK' }]
        );
        return;
      }

      const thread = await createThread(donation.id);
      
      const donorName = donation.donorName || 'Donor';
      navigation.navigate('ChatDetail', {
        userName: donorName,
        threadId: thread.id,
        otherUserName: donorName,
        listingTitle: donation.title
      });
      
    } catch (error) {
      console.error('❌ Failed to contact donor:', error);
      Alert.alert(
        'Error',
        'Failed to start conversation with donor. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsContactingDonor(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Donation Details" 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Donation Image Card */}
        <View style={styles.imageCard}>
          <View style={styles.imageContainer}>
            <View style={styles.imageSlide}>
              <Image 
                source={typeof donation.image === 'string' ? { uri: donation.image } : donation.image} 
                style={styles.donationImage} 
                resizeMode="cover" 
                onError={(error) => {
                  console.log('Image loading error:', error);
                }}
              />
            </View>
            
            {/* Category Tag */}
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{donation.category}</Text>
            </View>   
            
            {/* Image Indicator Dots */}
            {images.length > 1 && (
              <View style={styles.imageIndicatorContainer}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.imageIndicator,
                      index === currentImageIndex && styles.imageIndicatorActive
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
          
          {/* Donation Title and Location */}
          <View style={styles.donationContent}>
            <Text style={styles.donationTitle}>{donation.title}</Text>
            <View style={styles.locationContainer}>
              <Image source={require('../assets/images/location.png')} style={styles.locationIcon} />
              <Text style={styles.locationText}>
                {donation.location}, {donation.distance}
              </Text>
              {/* <TouchableOpacity style={styles.moreOptionsButton}>
                <Text style={styles.moreOptionsIcon}>⋮</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{donation.description}</Text>
        </View>

        {/* Donor Information Section */}
        <View style={styles.donorCard}>
          <Text style={styles.sectionTitle}>Donor Information</Text>
          <View style={styles.donorInfo}>
            <View style={styles.donorProfile}>
              <Image 
                source={require('../assets/images/profile_user.png')}
                style={styles.donorAvatar} 
              />
              <View style={styles.donorDetails}>
                <Text style={styles.donorName}>{donation.donorName || 'Donor'}</Text>
                <Text style={styles.donorRole}>Donor</Text>
              </View>
            </View>
            {/* <TouchableOpacity 
              style={[styles.contactDonorButton, isContactingDonor && styles.contactDonorButtonDisabled]} 
              onPress={handleContactDonor}
              disabled={isContactingDonor}
            >
              <Text style={styles.contactDonorButtonText}>
                {isContactingDonor ? 'Connecting...' : 'Contact Donor'}
              </Text>
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Pickup Information */}
        <View style={styles.pickupCard}>
          <Text style={styles.sectionTitle}>Pickup Information</Text>
          <Text style={styles.pickupText}>
            Arrange pickup directly with the donor. Please be respectful and prompt when scheduling.
          </Text>
          
          <View style={styles.pickupDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Listed On:</Text>
              <Text style={styles.detailValue}>{new Date(donation.createdAt || Date.now()).toLocaleDateString('en-GB')}</Text>
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View style={[styles.section, {backgroundColor: colors.gray.light, marginHorizontal: wp(5), marginVertical: wp(2), borderRadius: wp(4),}]}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.mapImage}
              initialRegion={{
                latitude: donation.coordinates ? donation.coordinates[1] : 37.7749, // Use actual lat or fallback
                longitude: donation.coordinates ? donation.coordinates[0] : -122.4194, // Use actual lng or fallback
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              <Marker
                coordinate={{
                  latitude: donation.coordinates ? donation.coordinates[1] : 37.7749,
                  longitude: donation.coordinates ? donation.coordinates[0] : -122.4194,
                }}
                title={donation.title}
                description={donation.address || donation.location}
                pinColor={colors.primary}
              />
            </MapView>
          </View>
          {donation.address && (
            <View style={styles.addressContainer}>
              <Image source={require('../assets/images/location.png')} style={styles.addressIcon} />
              <Text style={styles.addressText}>{donation.address}</Text>
            </View>
          )}
        </View>

        <View style={{ height: wp(20) }} />
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
  },
  scrollContent: {
    paddingBottom: wp(20), // Add padding to account for fixed bottom button
  },
  imageCard: {
    width: wp(90),
    padding: wp(5),
    paddingBottom: wp(3),
    borderRadius: wp(4),
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: wp(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.15,
    shadowRadius: wp(1.5),
    backgroundColor: "#F6F6F6",
  },
  imageContainer: {
    width: wp(80),
    height: wp(40),
    position: 'relative',
  },
  imageSlide: {
    width: wp(80),
    height: wp(40),
  },
  donationImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: wp(4),
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: wp(2),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(1),
  },
  imageIndicator: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: colors.white,
    width: wp(4),
  },
  categoryTag: {
    position: 'absolute',
    top: wp(2),
    left: wp(2),
    backgroundColor: colors.primary,
    paddingVertical: wp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
  },
  categoryText: {
    color: colors.white,
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  actionButtonsContainer: {
    position: 'absolute',
    top: wp(2),
    right: wp(2),
    flexDirection: 'row',
    gap: wp(2),
  },
  actionButton: {
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
  actionButtonIcon: {
    fontSize: wp(4),
    color: colors.black,
  },
  favoriteActive: {
    color: colors.red,
  },
  donationContent: {
    paddingTop: wp(4),
    paddingBottom: wp(2)
  },
  donationTitle: {
    fontSize: wp(4.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(1),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: wp(0.5),
    flex: 1,
  },
  moreOptionsButton: {
    padding: wp(1),
  },
  moreOptionsIcon: {
    fontSize: wp(4),
    color: colors.gray.medium,
    transform: [{ rotate: '90deg' }],
  },
  section: {
    paddingHorizontal: wp(5),
    paddingVertical: wp(3),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(2),
  },
  descriptionText: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    lineHeight: wp(5.5),
  },
  donorCard: {
    marginHorizontal: wp(5),
    marginVertical: wp(2),
    padding: wp(4),
    backgroundColor: colors.gray.light,
    borderRadius: wp(4),
  },
  donorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donorProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  donorAvatar: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    marginRight: wp(3),
  },
  donorDetails: {
    flex: 1,
  },
  donorName: {
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(0.5),
  },
  donorRole: {
    fontSize: wp(3),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
  },
  contactDonorButton: {
    backgroundColor: colors.primary,
    paddingVertical: wp(3),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactDonorButtonDisabled: {
    backgroundColor: colors.gray.medium,
  },
  contactDonorButtonText: {
    color: colors.white,
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  pickupCard: {
    marginHorizontal: wp(5),
    marginVertical: wp(2),
    padding: wp(4),
    backgroundColor: colors.gray.light,
    borderRadius: wp(4),
  },
  pickupText: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    lineHeight: wp(5),
    marginBottom: wp(3),
  },
  pickupDetails: {
    gap: wp(2),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  detailLabel: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
  },
  detailValue: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_MEDIUM,
    color: colors.black,
  },
  mapContainer: {
    width: '100%',
    height: wp(33),
    borderRadius: wp(2),
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp(4),
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: wp(3),
    paddingHorizontal: wp(2),
  },
  addressIcon: {
    width: wp(4),
    height: wp(4),
    marginRight: wp(2),
    tintColor: colors.primary,
  },
  addressText: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    flex: 1,
  },
});

export default DonationDetailScreen;
