import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
  style?: any;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search donations...",
  value,
  onChangeText,
  onSubmitEditing,
  style,
}) => {
  return (
    <View style={[styles.searchContainer, style]}>
      <Image 
        source={require('../assets/images/search.png')}
        style={styles.searchIcon}
        resizeMode="contain"
      />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={colors.gray.medium}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray.borderGray,
    borderRadius: wp(6),
    paddingHorizontal: wp(4),
    paddingVertical: wp(0.5),
    marginBottom: wp(5),
    marginHorizontal: wp(5),
  },
  searchIcon: {
    width: wp(4),
    height: wp(4),
    marginRight: wp(2),
    tintColor: colors.gray.medium,
  },
  searchInput: {
    flex: 1,
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    marginTop: Platform.OS === 'android' ? wp(0.75) : 0,
  },
});

export default SearchBar; 