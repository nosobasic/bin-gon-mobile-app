import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface CategoryButtonProps {
  name: string;
  icon?: string;
  imageIcon?: any;
  isSelected?: boolean;
  onPress?: () => void;
  style?: any;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  name,
  icon,
  imageIcon,
  isSelected = false,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        isSelected && styles.categoryButtonSelected,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {imageIcon ? (
        <Image 
          source={imageIcon}
          style={[
            styles.categoryImageIcon,
            isSelected && styles.categoryImageIconSelected
          ]}
          resizeMode="contain"
        />
      ) : icon ? (
        <Text style={styles.categoryIcon}>{icon}</Text>
      ) : null}
      <Text style={[
        styles.categoryText,
        isSelected && styles.categoryTextSelected
      ]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: wp(6),
    paddingVertical: wp(1.5),
    paddingHorizontal: wp(3),
    marginRight: wp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp(22),
    flexDirection: 'row',
    gap: wp(1),
  },
  categoryButtonSelected: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    fontSize: wp(5),
    marginBottom: wp(1),
  },
  categoryImageIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: colors.secondary,
    marginRight: wp(1),
  },
  categoryImageIconSelected: {
    tintColor: colors.white,
  },
  categoryText: {
    fontSize: wp(3.6),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.primary,
  },
  categoryTextSelected: {
    color: colors.white,
  },
});

export default CategoryButton; 