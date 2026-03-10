import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface SectionHeaderProps {
  title: string;
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
  seeAllText?: string;
  style?: any;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  showSeeAll = false,
  onSeeAllPress,
  seeAllText = "See All",
  style,
}) => {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {showSeeAll && (
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={onSeeAllPress}
        >
          <Text style={styles.seeAllText}>{seeAllText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: wp(3),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontFamily: Fonts.MONTSERRAT_BOLD,
    color: colors.black,
  },
  seeAllButton: {
    paddingVertical: wp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(6),
    borderColor: colors.primary,
  },
  seeAllText: {
    fontSize: wp(3.3),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.primary,
  },
});

export default SectionHeader; 