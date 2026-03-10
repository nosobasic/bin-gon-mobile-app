import React, { useState, useCallback } from 'react';
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { NavigationProp } from '../types/navigation';
import { colors } from '../constants/colors';
import {
  CustomTextInput,
  CustomButton,
  Header,
  WelcomeSection,
  LinkText,
  DecorativeElement,
} from '../components';
import { apiClient } from '../services/api';

interface ForgotPasswordScreenProps {
  navigation: NavigationProp;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validateForm = useCallback(() => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email]);

  const handleSendResetLink = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await apiClient.forgotPassword(email.trim());
      
      if (result.emailSent) {
        Alert.alert(
          'Success', 
          'Password reset instructions have been sent to your email. Please check your inbox.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('OtpVerification', { email: email.trim() })
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to send reset email. Please try again later.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [validateForm, email, navigation]);

  const handleBackToLogin = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const clearEmailError = useCallback(() => {
    setErrors(prev => ({ ...prev, email: undefined }));
  }, []);

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
              title="Forgot Password"
              subtitle="Recover Your Account, it only takes a moment, enter your email address."
            />

            <View style={{ flex: 1 }}>
              <CustomTextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="johndoe@gmail.com"
                iconSource={require('../assets/images/mail.png')}
                keyboardType="email-address"
                error={errors.email}
                onClearError={clearEmailError}
              />

              <CustomButton
                title="Send Reset Link"
                onPress={handleSendResetLink}
                loading={loading}
                disabled={loading}
                variant='primary'
                style={{ marginTop: wp(9), marginBottom: hp(2.5) }}
              />

              <LinkText
                text="Remembered your password? Back to Login"
                onPress={handleBackToLogin}
                variant="textWithLink"
                linkText="Back to Login"
                align="center"
                textColor="black"
                style={{ marginTop: wp(3) }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen; 