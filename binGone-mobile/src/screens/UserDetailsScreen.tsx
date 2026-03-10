import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { NavigationProp, RootStackParamList, UserData, ProductCard } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { apiClient, Listing } from '../services/api';
import { generateCategoryColor } from '../utils/categoryColors';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface UserDetailsScreenProps {
  navigation: NavigationProp;
  route: RouteProp<RootStackParamList, 'UserDetails'>;
}

interface MenuPosition {
  x: number;
  y: number;
}

const UserDetailsScreen: React.FC<UserDetailsScreenProps> = ({ navigation, route }) => {
  const { userData } = route.params;
  const { deleteListing, updateListing, categories } = useData();
  const { user } = useAuth();
  const [donationData, setDonationData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const menuButtonRefs = useRef<{ [key: string]: View | null }>({});

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Fetch user's donation listings
  const fetchUserListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const listings = await apiClient.getUserListings(userData.id, 'active');
      setDonationData(listings);
    } catch (err: any) {
      console.error('Error fetching user listings:', err);
      setError('Failed to load donation listings');
      Alert.alert('Error', 'Failed to load donation listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userData?.id]);

  useEffect(() => {
    if (userData?.id) {
      fetchUserListings();
    } else {
      setLoading(false);
      setError('User ID not available');
    }
  }, [userData?.id, fetchUserListings]);

  // Refresh data when screen comes back into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      if (userData?.id) {
        fetchUserListings();
      }
    }, [userData?.id, fetchUserListings])
  );


  const getProfileImage = () => {
    if (userData?.profileImageUrl) {
      return { uri: userData.profileImageUrl };
    }
    return require('../assets/images/profile_user.png');
  };

  const getStatusColor = () => {
    return userData.status === 'Active' ? colors.primary : colors.red;
  };

  // Helper function to get donation image
  const getDonationImage = (listing: Listing) => {
    if (listing.images && listing.images.length > 0) {
      return { uri: listing.images[0] };
    }
    return require('../assets/images/stationery.png'); // Default image
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'General';
  };

  const handleDonationPress = (donation: Listing) => {
    const productCard = {
      id: donation.id,
      title: donation.title,
      description: donation.description,
      category: getCategoryName(donation.categoryId),
      location: donation.address ? donation.address.split(',')[0] : 'Location not specified',
      distance: '2.5 km',
      image: donation.images && donation.images.length > 0 ? { uri: donation.images[0] } : require('../assets/images/stationery.png'),
      images: donation.images || [],
      isFavorite: false,
      coordinates: donation.location?.coordinates,
      address: donation.address,
        donorName: userData.userName,
      createdAt: donation.createdAt,
    };
    
    navigation.navigate('DonationDetail', { donation: productCard });
  };

  const toggleFavorite = (donationId: string) => {
    console.log('Toggle favorite for donation:', donationId);
    // TODO: Implement favorite toggle logic
  };

  const isAdmin = () => {
    return user?.roleId === 3;
  };

  const handleMenuPress = (itemId: string) => {
    const buttonRef = menuButtonRefs.current[itemId];
    if (buttonRef) {
      buttonRef.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuPosition({
          x: x + width - wp(35), // Align right edge of menu with right edge of button
          y: y + height // Position below the button with small gap
        });
        setSelectedItem(itemId);
        setShowMenu(true);
      });
    }
  };

  const handleMenuClose = () => {
    setShowMenu(false);
    setSelectedItem(null);
  };

  const getCurrentItem = () => {
    if (!selectedItem) return null;
    return donationData.find(donation => donation.id === selectedItem);
  };

  const handleMenuAction = async (action: string) => {
    if (!selectedItem) return;
    try {
      switch (action) {
        case 'edit':
          const currentItem = getCurrentItem();
          if (currentItem) {
            navigation.navigate('EditDonation', { donation: currentItem });
          }
          break;
        case 'delete':
          Alert.alert(
            'Delete Donation',
            'Are you sure you want to delete this donation? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteListing(selectedItem);
                    // Refresh the donations list
                    await fetchUserListings();
                    Alert.alert('Success', 'Donation deleted successfully');
                  } catch (error) {
                    console.error('Error deleting donation:', error);
                    Alert.alert('Error', 'Failed to delete donation. Please try again.');
                  }
                }
              }
            ]
          );
          break;
        case 'collected':
          try {
            const currentItem = getCurrentItem();
            const newStatus = currentItem?.status === 'claimed' ? 'available' : 'claimed';
            
            await updateListing(selectedItem, { status: newStatus });
            
            // Refresh the donations list
            await fetchUserListings();
            
            Alert.alert('Success', `Donation marked as ${newStatus === 'claimed' ? 'collected' : 'available'}`);
          } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert('Error', 'Failed to update donation status. Please try again.');
          }
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
    
    handleMenuClose();
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="User Details" 
        onBackPress={handleBackPress}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: wp(20) }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Information Section */}
        <View style={{borderWidth:10,alignSelf:"center", zIndex:9999,  width: wp(35),
          height: wp(35),
          borderRadius: wp(18),
          marginTop: wp(5),
          borderColor:"white"
          }}>
          <View style={styles.profileImageContainer}>
              <Image 
                source={getProfileImage()} 
                style={styles.profileImage}
                resizeMode="cover"
              />
          </View>
        </View>
       
        <View style={styles.profileSection}>
          <Text style={styles.userName}>{userData.userName}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
          
          <View style={[styles.statusButton, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{userData.accountType}</Text>
          </View>

          <View style={styles.divider} />

          {/* Status Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.statusIconContainer}>
                <View style={styles.statusIcon} />
              </View>
              <Text style={styles.sectionTitle}>Status</Text>
            </View>
            <View style={styles.statusWrapper}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() === colors.primary ? '#E8F5E8' : '#FFE8E8' }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>
                  {userData.status}
                </Text>
              </View>
            </View>
          </View>

       

        </View>
           {/* Donation Listed Section */}
           <View style={styles.donationsSection}>
            <Text style={styles.donationsTitle}>Donation Listed</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading donations...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    setError(null);
                    setLoading(true);
                    // Retry the API call
                    const fetchUserListings = async () => {
                      try {
                        const listings = await apiClient.getUserListings(userData.id, 'active');
                        setDonationData(listings);
                      } catch (err: any) {
                        console.error('Error fetching user listings:', err);
                        setError('Failed to load donation listings');
                      } finally {
                        setLoading(false);
                      }
                    };
                    fetchUserListings();
                  }}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : donationData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No active donations found</Text>
              </View>
            ) : (
              <View style={styles.donationsList}>
                {donationData.map((donation) => (
                  <TouchableOpacity 
                    key={donation.id}
                    style={styles.donationCard}
                    onPress={() => handleDonationPress(donation)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.donationImageContainer}>
                      <Image source={getDonationImage(donation)} style={styles.donationImage} />
                    
                      {donation.categoryId && (
                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryTagText}>{getCategoryName(donation.categoryId)}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.donationContent}>
                      <View style={styles.donationHeader}>
                        <Text style={styles.donationTitle}>{donation.title}</Text>
                        {isAdmin() && (
                          <TouchableOpacity 
                            ref={(ref) => {
                              menuButtonRefs.current[donation.id] = ref;
                            }}
                            style={styles.moreButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleMenuPress(donation.id);
                            }}
                          >
                            <Text style={styles.moreIcon}>⋯</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      <Text style={styles.donationDescription}>{donation.description}</Text>
                      
                      <View style={styles.locationContainer}>
                        <Image source={require('../assets/images/location.png')} style={styles.locationIcon} />
                        <Text style={styles.locationText}>{donation.address}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
      </ScrollView>

      {/* Admin Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={handleMenuClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleMenuClose}
        >
          <View style={[styles.menuContainer, { 
            position: 'absolute',
            top: menuPosition.y,
            left: menuPosition.x,
          }]}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('edit')}
            >
              <Image 
                source={require('../assets/images/edit.png')}
                style={styles.menuItemIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('delete')}
            >
              <Image 
                source={require('../assets/images/delete.png')}
                style={styles.menuItemIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Delete</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('collected')}
            >
              <View 
                style={[
                  styles.statusBox,
                  {
                    backgroundColor: getCurrentItem()?.status === 'claimed' 
                      ? colors.primary 
                      : 'transparent',
                    borderColor: colors.text.gray,
                    borderWidth: 1,
                  }
                ]}
              />
              <Text style={styles.menuText}>Collected</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  profileSection: {
    width: wp(90),
    alignItems: 'center',
    paddingTop: wp(20),
    marginTop: -wp(18),
    backgroundColor: '#F6F6F6',
    borderRadius: wp(3.5),
  },
  profileImageContainer: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    borderWidth: 4,
    borderColor: colors.primary,
    marginBottom: 16,
    overflow: 'hidden',
    zIndex: 9999,
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
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textTransform: 'capitalize'
  },
  sectionContainer: {
    paddingVertical: 20,
    paddingHorizontal: wp(4),
    width: wp(90),
    borderTopWidth:1,
    borderColor: '#A2A2A2',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: wp(5),
    height: wp(5),
    marginRight: 12,
    tintColor: colors.text.gray,
  },
  statusIconContainer: {
    width: wp(5),
    height: wp(5),
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    width: wp(4),
    height: wp(4),
    borderRadius: wp(2),
    borderWidth: 2,
    borderColor: colors.text.gray,
  },
  sectionTitle: {
    fontSize: wp(4.2),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  categoriesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryText: {
    fontSize: wp(3.5),
    color: colors.black,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  statusWrapper: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray.borderGray,
    marginHorizontal: wp(4),
  },
  donationsSection: {
    paddingVertical: 20,
    width: wp(90),
  },
  donationsTitle: {
    fontSize: wp(5),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginBottom: 16,
  },
  donationsList: {
    width: '100%',
  },
  donationCard: {
    width: '100%',
    padding: wp(4),
    paddingBottom: wp(3),
    borderRadius: wp(4),
    backgroundColor: colors.white,
    marginBottom: wp(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  donationImageContainer: {
    width: '100%',
    height: wp(35),
    borderRadius: wp(4),
    overflow: 'hidden',
    marginBottom: wp(3),
  },
  donationImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: wp(4),
  },
  categoryTag: {
    position: 'absolute',
    top: wp(2),
    left: wp(2),
    backgroundColor: colors.primary,
    paddingVertical: wp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
  },
  categoryTagText: {
    color: colors.white,
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  favoriteButton: {
    position: 'absolute',
    top: wp(2),
    right: wp(2),
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: wp(4),
    color: colors.red,
  },
  donationContent: {
    width: '100%',
    paddingTop: wp(2),
    paddingBottom: wp(1),
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: wp(1),
  },
  donationTitle: {
    fontSize: wp(4.2),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    flex: 1,
  },
  moreButton: {
    width: wp(6),
    height: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: wp(4),
    color: colors.black,
    transform: [{ rotate: '90deg' }],
  },
  donationDescription: {
    fontSize: wp(3.5),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
    lineHeight: wp(4.5),
    marginBottom: wp(2),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: wp(3.5),
    height: wp(3.5),
    marginRight: wp(2),
    tintColor: colors.text.gray,
  },
  locationText: {
    fontSize: wp(3.2),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: wp(10),
  },
  loadingText: {
    fontSize: wp(4),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: wp(3),
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: wp(10),
  },
  errorText: {
    fontSize: wp(4),
    color: colors.red,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
    marginBottom: wp(4),
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: wp(6),
    paddingVertical: wp(3),
    borderRadius: wp(2),
  },
  retryButtonText: {
    color: colors.white,
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: wp(10),
  },
  emptyText: {
    fontSize: wp(4),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: wp(3),
    paddingVertical: wp(2),
    minWidth: wp(25),
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: wp(2),
  },
  menuText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    marginTop: wp(1)
  },
  menuItemIcon: {
    width: wp(5.5),
    height: wp(5.5),
    marginRight: wp(2.5),
  },
  statusBox: {
    width: wp(4.5),
    height: wp(4.5),
    marginRight: wp(3.5),
    borderRadius: wp(1),
  },
});

export default UserDetailsScreen;
