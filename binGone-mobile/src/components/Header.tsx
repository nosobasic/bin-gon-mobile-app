import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface HeaderProps {
  title?: string;
  style?: any;
}

const Header: React.FC<HeaderProps> = ({
  title = 'binGone',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: hp(2.5),
    paddingBottom: wp(6),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: wp(14),
  },
  logo: {
    width: wp(14),
    height: wp(14),
    marginRight: wp(5),
  },
  brandName: {
    fontSize: wp(10),
    color: colors.primary,
    fontFamily: Fonts.MONTSERRAT_BOLD,
  },
});

export default Header; 