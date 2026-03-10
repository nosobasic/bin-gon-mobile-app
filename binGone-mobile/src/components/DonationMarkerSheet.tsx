import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { Listing } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface DonationMarkerSheetProps {
  donation: Listing;
  onContactDonor: () => void;
}

const DonationMarkerSheet: React.FC<DonationMarkerSheetProps> = ({
  donation,
  onContactDonor,
}) => {
  const { user } = useAuth();

 
  // Determine image source - use require() for fallback since Callout has issues with some URIs
  const getImageSource = () => {
    if (donation.images && donation.images.length > 0) {
      const imageUri = donation.images[0];
      return { uri: imageUri };
    }
    return require('../assets/images/feature.png');
  };

  const donationImage = getImageSource();

  const isReceiver = user?.accountType === 'receiver' || user?.roleId === 2;
 
  return (
    <View style={styles.container}>
      {/* Donation Image */}
      <View style={[styles.imageContainer, { height: isReceiver ? hp(10) : hp(13) }]}>
        <Image
          source={donationImage}
          style={styles.donationImage}
          resizeMode="cover"
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {donation.title}
        </Text>

        {/* Location */}
        <View style={styles.locationContainer}>
          <Image
            source={require('../assets/images/location.png')}
            style={styles.locationIcon}
            resizeMode="contain"
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {donation.address}
          </Text>
        </View>

       
        {isReceiver && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={onContactDonor}
          >
            <Text style={styles.contactButtonText}>Contact Donor</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.white,
  },
  imageContainer: {
    width: '100%',
    height: hp(10),
    backgroundColor: colors.gray.light,
    position: 'relative',
  },
  donationImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: wp(1.2),
    left: wp(1.2),
    backgroundColor: colors.primary,
    paddingHorizontal: wp(1.2),
    paddingVertical: wp(0.6),
    borderRadius: wp(1.2),
  },
  categoryBadgeText: {
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    fontSize: wp(2),
  },
  content: {
    padding: wp(2.5),
  },
  title: {
    fontSize: wp(3.2),
    fontFamily: Fonts.MONTSERRAT_BOLD,
    color: colors.black,
    marginBottom: hp(0.6),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  locationIcon: {
    width: wp(2.8),
    height: wp(2.8),
    tintColor: colors.gray.medium,
    marginRight: wp(1),
  },
  locationText: {
    flex: 1,
    fontSize: wp(2.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
  },
  donorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  donorImage: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: colors.gray.light,
    marginRight: wp(1.5),
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: wp(3),
    fontFamily: Fonts.MONTSERRAT_BOLD,
    color: colors.black,
    marginBottom: wp(0.2),
  },
  donorLabel: {
    fontSize: wp(2.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
  },
  contactButton: {
    backgroundColor: colors.primary,
    borderRadius: wp(2),
    paddingVertical: hp(1.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    fontSize: wp(3.2),
    fontFamily: Fonts.MONTSERRAT_BOLD,
    color: colors.white,
  },
});

export default DonationMarkerSheet;

