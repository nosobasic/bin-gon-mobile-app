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
  LinkText,
  DecorativeElement,
} from '../components';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  navigation: NavigationProp;
  route?: { params?: { role?: UserRole } };
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, route }) => {
  const selectedRole = route?.params?.role;
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = useCallback(() => {
    const newErrors: { email?: string; password?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await login(email.trim(), password);

      if (response.user && !response.user.emailVerified) {
        navigation.navigate('OtpVerification', {
          email: email.trim(),
          isEmailVerification: true,
          password: password 
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [validateForm, login, email, password, navigation]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  const handleCreateAccount = useCallback(() => {
    navigation.navigate('SignUp', { role: selectedRole });
  }, [navigation, selectedRole]);

  const clearEmailError = useCallback(() => {
    setErrors(prev => ({ ...prev, email: undefined }));
  }, []);

  const clearPasswordError = useCallback(() => {
    setErrors(prev => ({ ...prev, password: undefined }));
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
              title="Welcome Back!"
              subtitle="Access Your Account Instantly, enter your email and password to log in."
            />

            <View style={{ flex: 1 }}>
              <CustomTextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                iconSource={require('../assets/images/mail.png')}
                keyboardType="email-address"
                error={errors.email}
                onClearError={clearEmailError}
              />

              <CustomTextInput
                label="Password"
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

              <LinkText
                text="forgot password?"
                onPress={handleForgotPassword}
                align="right"
                textColor="gray"
                style={{ marginBottom: wp(9) }}
              />

              <CustomButton
                title="Login"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                variant='primary'
                style={{ marginBottom: hp(2.5) }}
              />

              <LinkText
                text="If you don't have account? Create Account"
                onPress={handleCreateAccount}
                variant="textWithLink"
                linkText="Create Account"
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

export default LoginScreen; 