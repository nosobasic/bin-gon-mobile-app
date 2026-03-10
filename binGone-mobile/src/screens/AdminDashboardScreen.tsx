import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors } from '../constants/colors';
import { NavigationProp } from '../types/navigation';
import { AdminBottomSheet } from '../components';
import AdminDashboardContent from '../components/AdminDashboardContent';
import DonationScreen from './DonationScreen';
import UserManagementScreen from './UserManagementScreen';
import AdminCategoriesScreen from './AdminCategoriesScreen';
import CategoryManagementScreen from './CategoryManagementScreen';
import AdminWishlistScreen from './AdminWishlistScreen';

interface AdminDashboardScreenProps {
  navigation: NavigationProp;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const handleTabPress = (tabName: string) => {
    setActiveTab(tabName);
  };


  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <AdminDashboardContent navigation={navigation} />;
      case 'Categories':
        return <CategoryManagementScreen navigation={navigation} />;
      case 'Users':
        return <UserManagementScreen navigation={navigation} route={{ key: 'UserManagement', name: 'UserManagement', params: undefined }} />;
      case 'Donations':
        return <DonationScreen navigation={navigation} route={{ key: 'Donation', name: 'Donation', params: undefined }} />;
      case 'Wishlist':
        return <AdminWishlistScreen navigation={navigation} />;
      default:
        return <AdminDashboardContent navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={styles.container}>
        {renderActiveScreen()}
        <AdminBottomSheet activeTab={activeTab} onTabPress={handleTabPress} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default AdminDashboardScreen;
