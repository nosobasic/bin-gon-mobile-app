import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface ImpactCardProps {
  icon: string;
  title: string;
  description: string;
  style?: any;
}

const ImpactCard: React.FC<ImpactCardProps> = ({
  icon,
  title,
  description,
  style,
}) => {
  return (
    <View style={[styles.impactCard, style]}>
      <View style={styles.impactIconContainer}>
        <Text style={styles.impactIcon}>{icon}</Text>
      </View>
      <Text style={styles.impactCardTitle}>{title}</Text>
      <Text style={styles.impactCardDescription}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  impactCard: {
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(4),
    paddingVertical: wp(6),
    marginRight: wp(3),
    width: wp(68),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(0.5),
    },
    shadowOpacity: 0.15,
    shadowRadius: wp(1),
    elevation: 5,
    marginHorizontal: wp(5)
  },
  impactIconContainer: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(2),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: wp(5),
  },
  impactIcon: {
    fontSize: wp(6),
    color: colors.white,
  },
  impactCardTitle: {
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    textAlign: 'center',
    marginBottom: wp(1.5),
  },
  impactCardDescription: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    textAlign: 'center',
    lineHeight: wp(4.5),
  },
});

export default ImpactCard; 