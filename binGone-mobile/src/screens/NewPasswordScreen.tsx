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
  DecorativeElement,
} from '../components';
import { apiClient } from '../services/api';

interface NewPasswordScreenProps {
  navigation: NavigationProp;
  route?: { params?: { email?: string } };
}

const NewPasswordScreen: React.FC<NewPasswordScreenProps> = ({ navigation, route }) => {
  const email = route?.params?.email || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const validateForm = useCallback(() => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [newPassword, confirmPassword]);

  const handleResetPassword = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await apiClient.resetPassword(email, newPassword, confirmPassword);
      
      Alert.alert(
        'Success', 
        'Password has been reset successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [validateForm, email, newPassword, confirmPassword, navigation]);

  const clearNewPasswordError = useCallback(() => {
    setErrors(prev => ({ ...prev, newPassword: undefined }));
  }, []);

  const clearConfirmPasswordError = useCallback(() => {
    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
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
              title="Set a New Password"
              subtitle="Choose a new password that is both strong and memorable."
            />

            <View style={{ flex: 1 }}>
              <CustomTextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter your new password"
                iconSource={require('../assets/images/password.png')}
                secureTextEntry={!showNewPassword}
                showEyeIcon={true}
                onEyePress={() => setShowNewPassword(!showNewPassword)}
                error={errors.newPassword}
                onClearError={clearNewPasswordError}
              />

              <CustomTextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your new password"
                iconSource={require('../assets/images/password.png')}
                secureTextEntry={!showConfirmPassword}
                showEyeIcon={true}
                onEyePress={() => setShowConfirmPassword(!showConfirmPassword)}
                error={errors.confirmPassword}
                onClearError={clearConfirmPasswordError}
              />

              <CustomButton
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                variant='primary'
                style={{ marginTop: wp(9), marginBottom: hp(2.5) }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default NewPasswordScreen; 