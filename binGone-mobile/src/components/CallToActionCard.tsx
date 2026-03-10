import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface CallToActionCardProps {
  backgroundImage: any;
  title: string;
  buttonText: string;
  onButtonPress?: () => void;
  style?: any;
  showButton?: boolean;
}

const CallToActionCard: React.FC<CallToActionCardProps> = ({
  backgroundImage,
  title,
  buttonText,
  onButtonPress,
  style,
  showButton = true,
}) => {
  return (
    <View style={[styles.ctaCard, style]}>
      <ImageBackground
        source={backgroundImage}
        style={styles.ctaBackground}
        imageStyle={styles.ctaBackgroundImage}
        resizeMode="cover"
      >
        <View style={styles.ctaOverlay}>
          <Text style={styles.ctaText}>{title}</Text>
          {showButton && (
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={onButtonPress}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>{buttonText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  ctaCard: {
    borderRadius: wp(4),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.15,
    shadowRadius: wp(1.5),
    elevation: 8,
    marginTop: wp(2)
  },
  ctaBackground: {
    width: '100%',
    height: wp(33),
  },
  ctaBackgroundImage: {
    borderRadius: wp(4),
  },
  ctaOverlay: {
    flex: 1,
    backgroundColor: `${colors.primary}99`, // 60% opacity
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  ctaText: {
    color: colors.white,
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: 'center',
    lineHeight: wp(6),
  },
  ctaButton: {
    backgroundColor: colors.secondary,
    paddingVertical: wp(2.5),
    paddingHorizontal: wp(6),
    borderRadius: wp(6),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(0.5),
    },
    shadowOpacity: 0.25,
    shadowRadius: wp(1),
    elevation: 5,
    marginTop: wp(5),
  },
  ctaButtonText: {
    color: colors.white,
    fontSize: wp(3.3),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: 'center',
  },
});

export default CallToActionCard; 