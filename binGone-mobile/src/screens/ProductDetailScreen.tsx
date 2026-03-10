import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { NavigationProp, ProductCard } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

interface ProductDetailScreenProps {
  navigation: NavigationProp;
  route: {
    params: {
      product: ProductCard;
    };
  };
}

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ navigation, route }) => {
  const { product } = route.params;
  const [isFavorite, setIsFavorite] = useState(product.isFavorite);
  const [isContactingDonor, setIsContactingDonor] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  // Get images array - use product.images if available, otherwise fallback to single image
  let images = product.images && product.images.length > 0 
    ? product.images.filter(img => typeof img === 'string') // Only include string URLs
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

       const thread = await createThread(product.id);
      
      const donorName = product.donorName || 'Donor';
      navigation.navigate('ChatDetail', {
        userName: donorName,
        threadId: thread.id,
        otherUserName: donorName,
        listingTitle: product.title
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
                {/* Product Image Card */}
        <View style={styles.imageCard}>
          <View style={styles.imageContainer}>
            {/* Horizontal Image Gallery */}
            <FlatList
              ref={flatListRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / wp(80));
                setCurrentImageIndex(index);
              }}
              renderItem={({ item }) => (
                <View style={styles.imageSlide}>
                  <Image 
                    source={typeof item === 'string' ? { uri: item } : item} 
                    style={styles.productImage} 
                    resizeMode="cover" 
                    onError={(error) => {
                      console.log('Image loading error:', error);
                    }}
                  />
                </View>
              )}
            />
            
            {/* Category Tag */}
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            
            {/* Favorite Button */}
            <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
              <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteActive]}>
                {isFavorite ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
            
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
          
          {/* Product Title and Location */}
          <View style={styles.productContent}>
            <Text style={styles.productTitle}>{product.title}</Text>
            <View style={styles.locationContainer}>
              <Image source={require('../assets/images/location.png')} style={styles.locationIcon} />
              <Text style={styles.locationText}>
                {product.location}, {product.distance}
              </Text>
            </View>
          </View>

          {/* Points Earning Section */}
          <View style={styles.pointsSection}>
            {user?.accountType === 'donor' || user?.roleId === 1 ? (
              // Donor points
              <>
                <View style={styles.pointsBox}>
                  <Text style={styles.pointsText}>Earn +5 points for each donation.</Text>
                </View>
                <View style={styles.pointsBox}>
                  <Text style={styles.pointsText}>Earn +2 points each time a pickup is confirmed.</Text>
                </View>
              </>
            ) : user?.accountType === 'receiver' || user?.roleId === 2 ? (
              // Receiver points
              <View style={styles.pointsBox}>
                <Text style={styles.pointsText}>Earn +2 points each time a pickup is confirmed.</Text>
              </View>
            ) : (
              // Default/guest view - show both
              <>
                <View style={styles.pointsBox}>
                  <Text style={styles.pointsText}>Earn +5 points for each donation.</Text>
                </View>
                <View style={styles.pointsBox}>
                  <Text style={styles.pointsText}>Earn +2 points each time a pickup is confirmed.</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
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
              <Text style={styles.detailValue}>July 25, 2025</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Condition:</Text>
              <Text style={styles.detailValue}>Gently Used</Text>
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View style={[styles.section, {backgroundColor: colors.gray.light, marginHorizontal: wp(5), marginVertical: wp(2),  borderRadius: wp(4),}]}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.mapImage}
              initialRegion={{
                latitude: product.coordinates ? product.coordinates[1] : 37.7749, // Use actual lat or fallback
                longitude: product.coordinates ? product.coordinates[0] : -122.4194, // Use actual lng or fallback
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              <Marker
                coordinate={{
                  latitude: product.coordinates ? product.coordinates[1] : 37.7749,
                  longitude: product.coordinates ? product.coordinates[0] : -122.4194,
                }}
                title={product.title}
                description={product.address || product.location}
                pinColor={colors.primary}
              />
            </MapView>
          </View>
          {product.address && (
            <View style={styles.addressContainer}>
              <Image source={require('../assets/images/location.png')} style={styles.addressIcon} />
              <Text style={styles.addressText}>{product.address}</Text>
            </View>
          )}


        </View>

        {(user?.accountType === 'receiver' || user?.roleId === 2) && (
          <View style={{paddingHorizontal: wp(5), paddingVertical: wp(3)}}>
            <TouchableOpacity 
              style={[styles.contactButton, isContactingDonor && styles.contactButtonDisabled]} 
              onPress={()=>{}}
              activeOpacity={0.8}
            >
              <Text style={styles.contactButtonText}>
              Request
              </Text>
            </TouchableOpacity>
          </View>
        )}
        

        <View style={{ height: wp(20) }} />
      </ScrollView>
      
      {/* Contact Donor Button - Fixed at bottom - Only show for receivers */}
      {(user?.accountType === 'receiver' || user?.roleId === 2) && (
        <View style={styles.bottomActionContainer}>
          <TouchableOpacity 
            style={[styles.contactButton, isContactingDonor && styles.contactButtonDisabled]} 
            onPress={handleContactDonor}
            disabled={isContactingDonor}
            activeOpacity={0.8}
          >
            <Text style={styles.contactButtonText}>
              {isContactingDonor ? 'Connecting...' : 'Contact Donor'}
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
  productImage: {
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
  favoriteButton: {
    position: 'absolute',
    top: wp(2),
    right: wp(2),
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
  favoriteIcon: {
    fontSize: wp(5),
    color: colors.black,
  },
  favoriteActive: {
    color: colors.red,
  },
  productContent: {
    paddingTop: wp(4),
    paddingBottom: wp(2)
  },
  productTitle: {
    fontSize: wp(4.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(1),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
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
    marginTop: wp(0.5)
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
  bottomActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: wp(5),
    paddingVertical: wp(3),
    paddingBottom: wp(6),
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingVertical: wp(4),
    borderRadius: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  contactButtonDisabled: {
    backgroundColor: colors.gray.medium,
  },
  contactButtonText: {
    color: colors.white,
    fontSize: wp(4.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  pointsSection: {
    gap: wp(2),
  },
  pointsBox: {
    backgroundColor: '#FFFFFF', // Light cream/off-white background
    paddingVertical: wp(1.5),
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsText: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_MEDIUM,
    color: '#FFAC00', // Orange/gold color
    textAlign: 'center',
  },
});

export default ProductDetailScreen; 