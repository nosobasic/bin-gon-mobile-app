import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { NavigationProp, RootStackParamList } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { AllDonationsSection } from '../components';

interface DonationScreenProps {
  navigation: NavigationProp;
  route: RouteProp<RootStackParamList, 'Donation'>;
}

const DonationScreen: React.FC<DonationScreenProps> = ({ navigation, route }) => {
  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Total Donations" 
        type="other" 
        onBackPress={handleBackPress}
        showGpsButton={false}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AllDonationsSection hiddenSectionHeader={true} navigation={navigation} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  chartSection: {
    marginTop: 20,
  },
});

export default DonationScreen;
