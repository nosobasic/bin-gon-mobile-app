import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface DonationCardProps {
  image: any;
  category: string;
  title: string;
  description: string;
  location: string;
  donorName: string;
  donorInitials: string;
  onPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  style?: any;
}

const DonationCard: React.FC<DonationCardProps> = ({
  image,
  category,
  title,
  description,
  location,
  donorName,
  donorInitials,
  onPress,
  onFavoritePress,
  isFavorite = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.donationCard, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardImageContainer}>
        <ImageBackground
          source={image}
          style={styles.cardImage}
          imageStyle={styles.cardImageStyle}
        >
          <View style={styles.cardOverlay}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{category}</Text>
            </View>
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={onFavoritePress}
            >
              <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteIconActive]}>
                {isFavorite ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
        
        <View style={styles.locationContainer}>
          <Image 
            source={require('../assets/images/location.png')}
            style={styles.locationIcon}
            resizeMode="contain"
          />
          <Text style={styles.locationText}>{location}</Text>
        </View>
        
        <View style={styles.separator} />
        
        <View style={styles.donorContainer}>
          <View style={styles.donorAvatar}>
            <Text style={styles.donorAvatarText}>{donorInitials}</Text>
          </View>
          <Text style={styles.donorName}>{donorName}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  donationCard: {
    width: wp(80),
    padding: wp(5),
    paddingBottom: wp(3),
    borderRadius: wp(4),
    overflow: 'hidden',
    marginRight: wp(3),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.15,
    shadowRadius: wp(1.5),
    backgroundColor: "#F6F6F6",
    marginBottom: wp(3),
    alignItems: "center"
  },
  cardImageContainer: {
    width: wp(70),
    height: wp(40),
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp(4),
  },
  cardImageStyle: {
    borderRadius: wp(4),
  },
  cardOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: wp(3),
    borderRadius: wp(4),
    flexDirection: "row",
  },
  categoryTag: {
    backgroundColor: colors.primary,
    paddingVertical: wp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
    alignSelf: 'flex-start',
  },
  categoryTagText: {
    color: colors.white,
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  favoriteButton: {
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
  favoriteIconActive: {
    color: colors.secondary,
  },
  cardContent: {
    width:"100%",
    padding: wp(2),
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
  },
  cardTitle: {
    fontSize: wp(4.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(1),
    marginTop: wp(2)
  },
  cardDescription: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    marginBottom: wp(1),
    lineHeight: wp(4.5),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: wp(1),
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
  separator: {
    height: 1,
    backgroundColor: colors.gray.borderGray,
    marginVertical: wp(1),
  },
  donorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: wp(2),
  },
  donorAvatar: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  donorAvatarText: {
    color: colors.white,
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  donorName: {
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
  },
});

export default DonationCard; 