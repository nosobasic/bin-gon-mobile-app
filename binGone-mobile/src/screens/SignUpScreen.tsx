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
import { NavigationProp, UserRole } from '../types/navigation';
import { colors } from '../constants/colors';
import {
  CustomTextInput,
  CustomButton,
  Header,
  WelcomeSection,
  DecorativeElement,
  LinkText,
} from '../components';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';

interface SignUpScreenProps {
  navigation: NavigationProp;
  route?: { params?: { role?: UserRole } };
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation, route }) => {
  const selectedRole = route?.params?.role || 'donor';
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    fullName?: string; 
    email?: string; 
    password?: string; 
    repeatPassword?: string; 
    phoneNumber?: string;
    referralCode?: string;
  }>({});

  const validateForm = useCallback(() => {
    const newErrors: { 
      fullName?: string; 
      email?: string; 
      password?: string; 
      repeatPassword?: string; 
      phoneNumber?: string;
      referralCode?: string;
    } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Please enter your full name (first and last name)';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!repeatPassword.trim()) {
      newErrors.repeatPassword = 'Please repeat your password';
    } else if (password !== repeatPassword) {
      newErrors.repeatPassword = 'Passwords do not match';
    }

    if (phoneNumber.trim() && !/^\+?[\d\s\-\(\)]+$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (referralCode.trim() && referralCode.trim().length < 3) {
      newErrors.referralCode = 'Referral code must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, email, password, repeatPassword, phoneNumber, referralCode]);

  const handleSignUp = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await signUp({
        name: fullName.trim(),
        email: email.trim(),
        password,
        accountType: selectedRole as 'donor' | 'receiver',
        phoneNumber: phoneNumber.trim() || undefined,
      });
      
      // Process referral if code is provided
      if (referralCode.trim()) {
        try {
          const referralResp = await apiClient.processReferralSignup(referralCode.trim(), response.user.id);
          console.log('Referral processed successfully', referralResp);
          Alert.alert('Referral applied', 'Thanks! The referrer will receive +10 points.');
        } catch (referralError) {
          console.error('Referral processing failed:', referralError);
          // Don't fail the signup if referral fails
          Alert.alert('Referral not applied', 'The code could not be processed. You can continue signup.');
        }
      }
      
      Alert.alert('Success', 'Account created successfully! Please check your email for verification.', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to OTP verification screen
            navigation.navigate('OtpVerification', { 
              email: email.trim(), 
              isEmailVerification: true,
              password: password // Store password temporarily for login after verification
            });
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Account creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [validateForm, signUp, fullName, email, password, selectedRole, phoneNumber, referralCode, navigation]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleRepeatPasswordVisibility = useCallback(() => {
    setShowRepeatPassword(prev => !prev);
  }, []);

  const clearFullNameError = useCallback(() => {
    setErrors(prev => ({ ...prev, fullName: undefined }));
  }, []);

  const clearEmailError = useCallback(() => {
    setErrors(prev => ({ ...prev, email: undefined }));
  }, []);

  const clearPasswordError = useCallback(() => {
    setErrors(prev => ({ ...prev, password: undefined }));
  }, []);

  const clearRepeatPasswordError = useCallback(() => {
    setErrors(prev => ({ ...prev, repeatPassword: undefined }));
  }, []);

  const clearPhoneNumberError = useCallback(() => {
    setErrors(prev => ({ ...prev, phoneNumber: undefined }));
  }, []);

  const clearReferralCodeError = useCallback(() => {
    setErrors(prev => ({ ...prev, referralCode: undefined }));
  }, []);

  const handleLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
         
          
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ flexGrow: 1,paddingHorizontal: wp(5) }}
            showsVerticalScrollIndicator={false}
          >
             <DecorativeElement 
              source={require('../assets/images/star.png')}
              position="topRight"
            />
            <Header />
            
            <WelcomeSection
              title="Create an Account"
              subtitle={`Create your Account as ${selectedRole ? selectedRole : 'donor/receiver'}, it takes less than a minute, enter your name, email and password.`}
            />

            <View style={{ flex: 1 }}>
              <CustomTextInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="John Doe"
                iconSource={require('../assets/images/user.png')}
                error={errors.fullName}
                onClearError={clearFullNameError}
              />

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

              <CustomTextInput
                label="Phone Number (Optional)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+1 (555) 123-4567"
                iconSource={require('../assets/images/mail.png')}
                keyboardType="phone-pad"
                error={errors.phoneNumber}
                onClearError={clearPhoneNumberError}
              />

              <CustomTextInput
                label="Referral Code (Optional)"
                value={referralCode}
                onChangeText={setReferralCode}
                placeholder="Enter referral code"
                iconSource={require('../assets/images/reward.png')}
                error={errors.referralCode}
                onClearError={clearReferralCodeError}
              />

              <CustomTextInput
                label="New Password"
                value={password}
                onChangeText={setPassword}
                placeholder="***************"
                iconSource={require('../assets/images/password.png')}
                secureTextEntry={!showPassword}
                showEyeIcon={true}
                onEyePress={togglePasswordVisibility}
                error={errors.password}
                onClearError={clearPasswordError}
              />

              <CustomTextInput
                label="Repeat Password"
                value={repeatPassword}
                onChangeText={setRepeatPassword}
                placeholder="***************"
                iconSource={require('../assets/images/password.png')}
                secureTextEntry={!showRepeatPassword}
                showEyeIcon={true}
                onEyePress={toggleRepeatPasswordVisibility}
                error={errors.repeatPassword}
                onClearError={clearRepeatPasswordError}
              />

              <CustomButton
                title="Create an Account"
                onPress={handleSignUp}
                loading={loading}
                disabled={loading}
                variant="primary"
                style={{ marginTop: hp(3), marginBottom: hp(2.5) }}
              />

            <LinkText
                text="If you have account? Login"
                onPress={handleLogin}
                variant="textWithLink"
                linkText="Login"
                align="center"
                textColor="black"
                style={{ marginTop: wp(3), marginBottom: wp(10) }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default SignUpScreen; 