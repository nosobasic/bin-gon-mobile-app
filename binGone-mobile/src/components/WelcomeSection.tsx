import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface WelcomeSectionProps {
  title: string;
  subtitle: string;
  style?: any;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  title,
  subtitle,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: wp(5),
  },
  title: {
    fontSize: wp(6),
    color: colors.text.black,
    marginBottom: hp(1.5),
    fontFamily: Fonts.MONTSERRAT_SEMIBOLD,
  },
  subtitle: {
    fontSize: wp(3.1),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
});

export default WelcomeSection; 