import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface CustomTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  iconSource?: any;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  showEyeIcon?: boolean;
  onEyePress?: () => void;
  error?: string;
  onClearError?: () => void;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconSource,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  showEyeIcon = false,
  onEyePress,
  error,
  onClearError,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
        {iconSource && (
          <Image 
            source={iconSource} 
            style={styles.inputIcon}
            resizeMode="contain"
          />
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            // Clear error when user starts typing
            if (error && onClearError) {
              onClearError();
            }
          }}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
        {showEyeIcon && (
          <TouchableOpacity onPress={onEyePress} style={styles.eyeIconContainer}>
            <Image 
              source={require('../assets/images/eye.png')} 
              style={styles.eyeIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom:  wp(4),
  },
  label: {
    fontSize: wp(3.6),
    fontFamily: Fonts.POPPINS_MEDIUM,
    color: colors.text.black,
    marginBottom: hp(1),
  },
  inputWrapper: {
    backgroundColor: colors.gray.textInputBg,
    borderRadius: wp(7),
    paddingHorizontal: wp(6),
    paddingVertical: wp(3.9),
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapperError: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  inputIcon: {
    width: wp(5),
    height: wp(5),
    marginRight: wp(3),
    tintColor: colors.gray.textInputIcon,
  },
  input: {
    fontSize: wp(3.3),
    color: colors.text.gray,
    padding: 0,
    flex: 1,
    fontFamily: Fonts.POPPINS_REGULAR,
    lineHeight: wp(6),
  },
  eyeIconContainer: {
    padding: wp(1),
  },
  eyeIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: colors.gray.textInputIcon,
  },
  errorText: {
    fontSize: wp(3),
    color: '#FF6B6B',
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: hp(0.5),
  },
});

export default CustomTextInput; 