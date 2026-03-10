import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationProp, RootStackParamList } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';
import BottomSheet from '../components/BottomSheet';
import HomeScreen from './HomeScreen';
import CategoriesScreen from './CategoriesScreen';
import FeaturedScreen from './FeaturedScreen';
import CommunityScreen from './CommunityScreen';
import ProfileScreen from './ProfileScreen';

interface DashboardScreenProps {
  navigation: NavigationProp;
  route: RouteProp<RootStackParamList, 'Dashboard'>;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('Home');

  // Set initial tab from route params if provided
  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  // Force re-render when selectedCategoryId changes
  useEffect(() => {
    if (route.params?.selectedCategoryId && route.params?.initialTab === 'Categories') {
      // Force switch to Categories tab when a category is selected
      setActiveTab('Categories');
    }
  }, [route.params?.selectedCategoryId, route.params?.initialTab]);

  const handleTabPress = (tabName: string) => {
    if (tabName === 'Chat') {
      // Navigate to Chat screen instead of switching tabs
      navigation.navigate('Chat');
    } else {
      setActiveTab(tabName);
    }
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen navigation={navigation} />;
      case 'Categories':
        return <CategoriesScreen 
          navigation={navigation} 
          selectedCategoryId={route.params?.selectedCategoryId}
        />;
      case 'Featured':
        return <FeaturedScreen navigation={navigation} />;
      case 'Community':
        return <CommunityScreen navigation={navigation} />;
      case 'Profile':
        return <ProfileScreen navigation={navigation} />;
      case 'Chat':
        // This case won't be reached since we navigate directly to Chat screen
        return <HomeScreen navigation={navigation} />;
      default:
        return <HomeScreen navigation={navigation} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderActiveScreen()}
      <BottomSheet activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default DashboardScreen; 