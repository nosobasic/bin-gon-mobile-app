import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { apiClient } from '../services/api';

const LoadingScreen: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<string>('Checking connection...');

  useEffect(() => {
    // Test network connection
    const testConnection = async () => {
      try {
        setNetworkStatus('Testing backend connection...');
        await apiClient.healthCheck();
        setNetworkStatus('Backend connected!');
        console.log('✅ Backend connection successful');
      } catch (error) {
        setNetworkStatus('Backend connection failed');
        console.error('❌ Backend connection failed:', error);
      }
    };

    testConnection();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../assets/images/splash_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: wp(40),
    height: wp(40),
  },
});

export default LoadingScreen;
