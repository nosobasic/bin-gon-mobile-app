import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { NavigationProp, UserRole } from '../types/navigation';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import DecorativeElement from '../components/DecorativeElement';

interface SplashScreenProps {
  navigation: NavigationProp;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const handleDonatePress = () => {
    navigation.navigate('Login', { role: 'donor' });
  };

  const handleSupportPress = () => {
    navigation.navigate('Login', { role: 'receiver' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../assets/images/splash.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark Overlay */}
        <View style={styles.gradientOverlay}>
          {/* Star Logo */}
          <DecorativeElement 
            source={require('../assets/images/star.png')}
            position="topRight"
            size={wp(31)}
          />

          <View />

          {/* Content Container */}
          <View style={styles.contentContainer}>
            {/* Main Heading */}
            <Text style={styles.mainHeading}>
              Together, We Make a Difference
            </Text>

            {/* Body Text */}
            <Text style={styles.bodyText}>
              Whether you're here to give or receive help, you're in the right place. Please select your role to continue.
            </Text>

            {/* Buttons Container */}
            <View style={styles.buttonsContainer}>
              {/* Donate Button */}
              <TouchableOpacity
                style={styles.donateButton}
                onPress={handleDonatePress}
                activeOpacity={0.8}
              >
                <Text style={styles.donateButtonText}>I Want to Donate</Text>
              </TouchableOpacity>

              {/* Support Button */}
              <TouchableOpacity
                style={styles.supportButton}
                onPress={handleSupportPress}
                activeOpacity={0.8}
              >
                <Text style={styles.supportButtonText}>I Need Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: hp(5),
    paddingBottom: hp(5),
    paddingHorizontal: wp(5),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  contentContainer: {
    alignItems: 'center',
  },
  mainHeading: {
    fontSize: wp(6.5),
    fontFamily: Fonts.MONTSERRAT_BOLD,
    color: colors.white,
    marginBottom: hp(2),
    lineHeight: wp(7.5),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bodyText: {
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.white,
    marginBottom: hp(4),
    lineHeight: wp(5.5),
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonsContainer: {
    width: '100%',
    gap: hp(1.5),
  },
  donateButton: {
    backgroundColor: colors.primary,
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(8),
    borderRadius: wp(8),
    alignItems: 'center',
    justifyContent: 'center'
  },
  donateButtonText: {
    color: colors.white,
    fontSize: wp(4.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: 'center',
  },
  supportButton: {
    backgroundColor: colors.white,
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(8),
    borderRadius: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButtonText: {
    color: colors.primary,
    fontSize: wp(4.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: 'center',
  },
});

export default SplashScreen; 