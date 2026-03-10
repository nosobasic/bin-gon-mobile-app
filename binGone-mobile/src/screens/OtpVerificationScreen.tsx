import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  TextInput,
  Text,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { NavigationProp } from '../types/navigation';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import {
  CustomButton,
  Header,
  WelcomeSection,
  LinkText,
  DecorativeElement,
} from '../components';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface OtpVerificationScreenProps {
  navigation: NavigationProp;
  route?: { params?: { email?: string; isEmailVerification?: boolean; password?: string } };
}

const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({ navigation, route }) => {
  const email = route?.params?.email || '';
  const isEmailVerification = route?.params?.isEmailVerification || false;
  const password = route?.params?.password || '';
  const { verifyEmailAndLogin } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = useCallback((text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyPress = useCallback((e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const validateOtp = useCallback(() => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      Alert.alert('Error', 'Please enter the complete 4-digit OTP code.');
      return false;
    }
    return true;
  }, [otp]);

  const handleVerifyCode = useCallback(async () => {
    if (!validateOtp()) {
      return;
    }

    setLoading(true);
    
    try {
      const otpString = otp.join('');
      
      if (isEmailVerification) {
        // Email verification flow
        await verifyEmailAndLogin(email, otpString, password);
        Alert.alert('Success', 'Email verified successfully! You are now logged in.', [
          {
            text: 'OK',
            onPress: () => {
              // Navigation will be handled automatically by AuthContext
            }
          }
        ]);
      } else {
        // Password reset flow
        await apiClient.verifyOtp(email, otpString);
        navigation.navigate('NewPassword', { email });
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [validateOtp, otp, email, isEmailVerification, navigation, verifyEmailAndLogin]);

  const handleResendOtp = useCallback(async () => {
    if (!canResend) return;

    setLoading(true);
    
    try {
      if (isEmailVerification) {
        // For email verification, we would need a resend endpoint
        Alert.alert('Info', 'Please try signing up again to receive a new verification code.');
      } else {
        // Password reset resend
        await apiClient.forgotPassword(email);
        Alert.alert('Success', 'New OTP has been sent to your email.');
      }
      
      // Reset OTP and countdown
      setOtp(['', '', '', '']);
      setCountdown(30);
      setCanResend(false);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [canResend, email, isEmailVerification]);

  const getTitle = () => {
    return isEmailVerification ? 'Email Verification' : 'OTP Verification';
  };

  const getSubtitle = () => {
    return isEmailVerification 
      ? 'Insert the 4-digit verification code sent to your email address.'
      : 'Insert the 4-digit OTP code sent to your email address.';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={{ flex: 1, paddingHorizontal: wp(5) }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <DecorativeElement 
            source={require('../assets/images/star.png')}
            position="topRight"
          />
          
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <Header />
            
            <WelcomeSection
              title={getTitle()}
              subtitle={getSubtitle()}
            />

            <View style={{ flex: 1 }}>
              {/* OTP Input Fields */}
              <View style={styles.otpContainer}>
                <Text style={styles.otpLabel}>Enter your 4 digit code</Text>
                <View style={styles.otpInputContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        if (ref) inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpInput,
                        digit ? styles.otpInputFilled : null
                      ]}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      placeholder=""
                      placeholderTextColor={colors.gray.medium}
                    />
                  ))}
                </View>
                <Text style={styles.countdownText}>{formatTime(countdown)}</Text>
              </View>

              <CustomButton
                title="Verify Code"
                onPress={handleVerifyCode}
                loading={loading}
                disabled={loading}
                variant='primary'
                style={{ marginTop: wp(9), marginBottom: hp(2.5) }}
              />

              {canResend ? (
                <LinkText
                  text={`Didn't receive the code? Resend`}
                  onPress={handleResendOtp}
                  variant="textWithLink"
                  linkText="Resend"
                  align="center"
                  textColor="black"
                  style={{ marginTop: wp(3) }}
                />
              ) : (
                <Text style={styles.countdownText}>
                  Resend available in {formatTime(countdown)}
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = {
  otpContainer: {
    marginBottom: wp(5),
  },
  otpLabel: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(3),
  },
  otpInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  otpInput: {
    width: wp(19),
    height: wp(15),
    borderWidth: 1,
    borderColor: colors.gray.borderGray,
    borderRadius: wp(7),
    fontSize: wp(5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    backgroundColor: colors.white,
  },
  otpInputFilled: {
    borderColor: colors.primary,
  },
  countdownText: {
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: '#D80F0F',
    textAlign: 'right' as const,
    marginTop: wp(3),
  },
};

export default OtpVerificationScreen; 