import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface LinkTextProps {
  text: string;
  onPress: () => void;
  variant?: 'link' | 'textWithLink';
  linkText?: string;
  align?: 'left' | 'center' | 'right';
  textColor?: 'primary' | 'gray' | 'black';
  style?: any;
}

const LinkText: React.FC<LinkTextProps> = ({
  text,
  onPress,
  variant = 'link',
  linkText,
  align = 'left',
  textColor = 'primary',
  style,
}) => {
  const getTextStyle = () => {
    switch (textColor) {
      case 'gray':
        return styles.grayText;
      case 'black':
        return styles.blackText;
      case 'primary':
      default:
        return styles.linkText;
    }
  };

  if (variant === 'textWithLink' && linkText) {
    const parts = text.split(linkText);
    
    return (
      <TouchableOpacity 
        style={[styles.container, styles[align], style]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, getTextStyle()]}>
          {parts[0]}
          <Text style={styles.linkText}>{linkText}</Text>
          {parts[1]}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.container, styles[align], style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={getTextStyle()}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: wp(2)
  },
  left: {
    alignItems: 'flex-start',
  },
  center: {
    alignItems: 'center',
  },
  right: {
    alignItems: 'flex-end',
  },
  text: {
    fontSize: wp(3.4),
    color: colors.text.black,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  linkText: {
    fontSize: wp(3.4),
    color: colors.primary,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  grayText: {
    fontSize: wp(3.4),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  blackText: {
    fontSize: wp(3.4),
    color: colors.text.black,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
});

export default LinkText; 