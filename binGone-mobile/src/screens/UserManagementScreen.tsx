import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { NavigationProp, RootStackParamList, UserData } from '../types/navigation';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import { UserProfileCard } from '../components';
import UserActionMenu from '../components/UserActionMenu';
import { colors } from '../constants/colors';
import { getAdminUsers, AdminUser, deleteAdminUser } from '../services/api';

interface UserManagementScreenProps {
  navigation: NavigationProp;
  route: RouteProp<RootStackParamList, 'UserManagement'>;
}

const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ navigation, route }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<{
    visible: boolean;
    userId: string | null;
    position: { x: number; y: number };
  }>({
    visible: false,
    userId: null,
    position: { x: 0, y: 0 },
  });

  // Helper function to convert AdminUser to UserData
  const convertAdminUserToUserData = (adminUser: AdminUser): UserData => {
    return {
      id: adminUser.id,
      userName: adminUser.name,
      email: adminUser.email,
      registrationDate: new Date(adminUser.createdAt).toLocaleDateString('en-GB'),
      numberOfDonations: adminUser.donationCount?.toString() || '0',
      status: adminUser.isActive ? 'Active' : 'Inactive',
      phoneNumber: adminUser.phoneNumber,
      address: adminUser.address,
      lastActiveDate: adminUser.lastActiveAt ? new Date(adminUser.lastActiveAt).toISOString().split('T')[0] : undefined,
      profileImageUrl: adminUser.profileImageUrl,
      accountType: adminUser.accountType,
      points: adminUser.points,
      isPremium: adminUser.isPremium,
    };
  };

  // Fetch users from API
  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getAdminUsers({
        page: 1,
        limit: 50, // Fetch more users at once
      });

      // Handle different possible response structures
      let usersArray: AdminUser[] = [];
      
      if (response && response.users && Array.isArray(response.users)) {
        // Expected structure: { users: [...], pagination: {...} }
        usersArray = response.users;
      } else if (response && Array.isArray(response)) {
        // Alternative structure: direct array of users
        usersArray = response as AdminUser[];
      } else if (response && (response as any).data && Array.isArray((response as any).data)) {
        // Another possible structure: { data: [...] }
        usersArray = (response as any).data;
      } else {
        console.warn('Unexpected API response structure:', response);
        throw new Error('Invalid response format from API');
      }

      const convertedUsers = usersArray.length > 0 
        ? usersArray.map(convertAdminUserToUserData)
        : [];
      setUsers(convertedUsers);
      
      console.log('Converted users:', convertedUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
      
      // Show alert for better user experience
      Alert.alert(
        'Error',
        'Failed to load users. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleActionPress = (userId: string, event?: any) => {
    console.log('Action pressed for user:', userId);
    
    // Get the position of the button for menu placement
    event?.target?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setActionMenu({
        visible: true,
        userId: userId,
        position: { x: pageX + width, y: pageY + height },
      });
    });
  };

  const handleUserPress = (user: UserData) => {
    navigation.navigate('UserDetails', { userData: user });
  };

  const handleCloseActionMenu = () => {
    setActionMenu({
      visible: false,
      userId: null,
      position: { x: 0, y: 0 },
    });
  };

  const handleEditUser = () => {
    const userId = actionMenu.userId;
    if (userId) {
      const user = users.find(u => u.id === userId);
      if (user) {
        // Navigate to edit user screen
        navigation.navigate('EditUser', { userData: user });
      }
    }
    handleCloseActionMenu();
  };

  const handleDeleteUser = () => {
    const userId = actionMenu.userId;
    if (userId) {
      const user = users.find(u => u.id === userId);
      if (user) {
        Alert.alert(
          'Delete User',
          `Are you sure you want to delete ${user.userName}? This action cannot be undone and will remove all user data including donations and listings.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => confirmDeleteUser(userId, user.userName),
            },
          ]
        );
      }
    }
    handleCloseActionMenu();
  };

  const confirmDeleteUser = async (userId: string, userName: string) => {
    try {
      console.log('Deleting user:', userId);
      await deleteAdminUser(userId);
      
      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      Alert.alert(
        'Success',
        `${userName} has been successfully deleted.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error deleting user:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to delete user. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader 
          title="User Management" 
          type="other" 
          onBackPress={handleBackPress}
          showGpsButton={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error && users.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader 
          title="User Management" 
          type="other" 
          onBackPress={handleBackPress}
          showGpsButton={false}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={() => fetchUsers()}>
            Tap to retry
          </Text>
        </View>
      </View>
    );
  }

  console.log('users---', users);

  return (
    <View style={styles.container}>
      <AppHeader 
        title="User Management" 
        type="other" 
        onBackPress={handleBackPress}
        showGpsButton={false}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {users.map((user) => (
          <UserProfileCard
            key={user.id}
            userName={user.userName}
            email={user.email}
            accountType={user.accountType}
            registrationDate={user.registrationDate}
            numberOfDonations={user.numberOfDonations}
            status={user.status}
            points={user.points}
            isPremium={user.isPremium}
            onActionPress={(event) => handleActionPress(user.id, event)}
            onPress={() => handleUserPress(user)}
          />
        ))}
        <View style={styles.footer}></View>
      </ScrollView>

      {/* User Action Menu */}
      <UserActionMenu
        visible={actionMenu.visible}
        onClose={handleCloseActionMenu}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        position={actionMenu.position}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingVertical: wp(5),
    paddingBottom: 20,
  },
  footer: {
   height: wp(10)
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  loadingText: {
    marginTop: wp(3),
    fontSize: wp(4),
    color: colors.text.gray,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  errorText: {
    fontSize: wp(4),
    color: colors.red,
    textAlign: 'center',
    marginBottom: wp(3),
  },
  retryText: {
    fontSize: wp(4),
    color: colors.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default UserManagementScreen;
