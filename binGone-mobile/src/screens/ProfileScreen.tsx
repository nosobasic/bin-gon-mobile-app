import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient, RewardStatusResponse } from '../services/api';

interface ProfileScreenProps {
  navigation: NavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [displayUser, setDisplayUser] = useState(user);
  const [refreshCount, setRefreshCount] = useState(0);
  const [rewardStatus, setRewardStatus] = useState<RewardStatusResponse | null>(null);

  useEffect(() => {
    setDisplayUser(user);
  }, [user]);

  // Fetch reward status
  const fetchRewardStatus = async () => {
    try {
      const statusResponse = await apiClient.getRewardStatus();
      setRewardStatus(statusResponse);
    } catch (error) {
      console.error('Error fetching reward status:', error);
    }
  };

  // Force refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setRefreshCount(prev => prev + 1);
      setDisplayUser(user ? { ...user } : null); // Force new object reference
      fetchRewardStatus();
    }, [user])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled automatically by AuthContext
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    navigation.navigate('EditProfile');
  };

  const handleTransactions = () => {
    // Navigate to transactions screen
    console.log('Transactions pressed');
  };

  const handleInviteFriends = () => {
    // Navigate to invite friends screen
    console.log('Invite Friends pressed');
  };

  const handleRewardTiers = () => {
    navigation.navigate('RewardTiers');
  };

  const handleChat = () => {
    navigation.navigate('Chat');
  };

  const handleWishlist = () => {
    navigation.navigate('Wishlist');
  };

  const getUserDisplayName = () => {
    const name = displayUser?.name || 'User';
    return name;
  };

  const getUserDisplayEmail = () => {
    const email = displayUser?.email || 'user@example.com';
    return email;
  };

  const getAccountTypeText = () => {
    if (!displayUser) return 'User';
    
    if (displayUser.accountType) {
      return displayUser.accountType === 'donor' ? 'Donor' : 'Receiver';
    }
    
    // Fallback to roleId if accountType is not available
    if (displayUser.roleId === 1) return 'Donor';
    if (displayUser.roleId === 2) return 'Receiver';
    
    // Default fallback
    return 'User';
  };

  const getProfileImage = () => {
    if (displayUser?.profileImageUrl) {
      return { uri: displayUser.profileImageUrl };
    }
    return require('../assets/images/profile_user.png');
  };

  const getBadgeText = () => {
    if (rewardStatus?.user.tier) {
      return rewardStatus.user.tier === 'Free' ? 'Community Member' : rewardStatus.user.tier;
    }
    return 'Community Member';
  };

  const getBadgeColor = () => {
    if (rewardStatus?.user.tier === 'Premium') {
      return 'none';
    }
    return '#9E9E9E';
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Profile" 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        key={`profile-${displayUser?.id}-${refreshCount}-${(displayUser as any)?.timestamp || 0}`} 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: wp(20) }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Information Section */}
        <View style={styles.profileContainer}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={getProfileImage()} 
              style={styles.profileImage}
              resizeMode="cover"
            />
            <View style={styles.badgeContainer}>
              <Image 
                source={require('../assets/images/badge.png')} 
                style={[styles.badgeImage, { tintColor: getBadgeColor() }]}
                resizeMode="contain"
              />
              <Text style={styles.badgeText}>{getBadgeText()}</Text>
            </View>
          </View>
        </View>
       
        <View style={styles.profileSection}>
         
          
          <Text style={styles.userName}>{getUserDisplayName()}</Text>
          <Text style={styles.userEmail}>{getUserDisplayEmail()}</Text>
          
          <View style={styles.statusButton}>
            <Text style={styles.statusText}>{getAccountTypeText()}</Text>
          </View>

          <View style={styles.menuSection}>
        <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <View style={styles.menuItemLeft}>
              <Image 
                source={require('../assets/images/user.png')} 
                style={styles.menuIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Edit Profile</Text>
            </View>
            <Image 
              source={require('../assets/images/right_arrow.png')} 
              style={styles.arrowIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* <TouchableOpacity style={styles.menuItem} onPress={handleTransactions}>
            <View style={styles.menuItemLeft}>
              <Image 
                source={require('../assets/images/Transactions.png')} 
                style={styles.menuIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Transactions</Text>
            </View>
            <Image 
              source={require('../assets/images/right_arrow.png')} 
              style={styles.arrowIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleInviteFriends}>
            <View style={styles.menuItemLeft}>
              <Image 
                source={require('../assets/images/Invite_friends.png')} 
                style={styles.menuIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Invite Friends</Text>
            </View>
            <Image 
              source={require('../assets/images/right_arrow.png')} 
              style={styles.arrowIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.divider} /> */}

          {/* Wishlist - Only for receiver users */}
          {(displayUser?.roleId === 2 || displayUser?.accountType === 'receiver') && (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={handleWishlist}>
                <View style={styles.menuItemLeft}>
                  <Image 
                    source={require('../assets/images/wishlist.png')} 
                    style={styles.menuIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.menuText}>My Wishlist</Text>
                </View>
                <Image 
                  source={require('../assets/images/right_arrow.png')} 
                  style={styles.arrowIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <View style={styles.divider} />
            </>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={handleRewardTiers}>
            <View style={styles.menuItemLeft}>
              <Image 
                source={require('../assets/images/reward.png')} 
                style={styles.menuIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Reward Tiers</Text>
            </View>
            <Image 
              source={require('../assets/images/right_arrow.png')} 
              style={styles.arrowIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleChat}>
            <View style={styles.menuItemLeft}>
              <Image 
                source={require('../assets/images/chat.png')} 
                style={styles.menuIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Chat</Text>
            </View>
            <Image 
              source={require('../assets/images/right_arrow.png')} 
              style={styles.arrowIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.divider} />

        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Image 
            source={require('../assets/images/logout.png')} 
            style={styles.powerIcon}
            resizeMode="contain"
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        </View>    
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileContainer: {
    alignSelf: "center",
    width: wp(35),
    height: wp(35),
    borderRadius: wp(18),
    marginTop: wp(5),
    borderWidth: 10,
    borderColor: "white",
    zIndex: 9999,
  },
  profileSection: {
    width: wp(90),
    alignItems: 'center',
    paddingTop: wp(20),
    marginTop: -wp(18),
    backgroundColor: '#F6F6F6',
    borderTopLeftRadius: wp(3.5),
    borderTopRightRadius: wp(3.5)
    // paddingVertical: 30,
  },
  profileImageContainer: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    borderWidth: 4,
    borderColor: colors.primary,
    marginBottom: 16,
    // overflow: 'hidden',
    zIndex: 9999,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: wp(1.5),
    left: '50%',
    transform: [{ translateX: -wp(20) }],
    zIndex: 10000,
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(40),
    height: wp(10),
  },
  badgeImage: {
    width: wp(40),
    height: wp(10),
    position: 'absolute',
    zIndex: 9999
  },
  badgeText: {
    position: 'absolute',
    color: 'white',
    fontSize: wp(2.4),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: 'center',
    zIndex: 10001,
    marginTop: -wp(1.5),
    },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  userName: {
    fontSize: wp(7),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  userEmail: {
    fontSize: 12,
    color: colors.text.gray,
    marginBottom: 12,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  statusButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  menuSection: {
    marginTop: 20,
    width: wp(90),
    paddingHorizontal: wp(4),

  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: wp(5.5),
    height: wp(5.5),
    marginRight: 16,
  },
  menuText: {
    fontSize: wp(4),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  arrowIcon: {
    width: wp(4),
    height: wp(4),
    tintColor: colors.text.gray,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray.borderGray,
    // marginLeft: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 20,
    marginBottom: 20,
    width: wp(80)
  },
  powerIcon: {
    width: wp(5.7),
    height: wp(5.7),
    marginRight: 8,
    tintColor: colors.red,
  },
  logoutText: {
    fontSize: 16,
    color: colors.red,
    fontWeight: '600',
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
});

export default ProfileScreen; 