import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { NavigationProp } from '../types/navigation';
import { useFocusEffect } from '@react-navigation/native';
import AdminDonationCard from './AdminDonationCard';
import { useData } from '../contexts/DataContext';
import { Listing } from '../services/api';
import { generateCategoryColor } from '../utils/categoryColors';

interface DonationsSectionProps {
  style?: any;
  hiddenSectionHeader?: boolean;
  navigation?: NavigationProp;
}

const DonationsSection: React.FC<DonationsSectionProps> = ({ style, hiddenSectionHeader = false, navigation }) => {
  const [activeTab, setActiveTab] = useState<'listed' | 'collected'>('listed');
  const [groupedListings, setGroupedListings] = useState<Array<{
    user: {
      location: {
        type: 'Point';
        coordinates: [number, number];
      };
      _id: string;
      name: string;
      email: string;
      role: string;
      accountType: string;
      phoneNumber: string;
      profileImageUrl: string;
      resetOtp: string | null;
      resetOtpExpiresAt: string | null;
      resetOtpVerified: boolean;
      emailVerified: boolean;
      emailVerificationOtp: string | null;
      emailVerificationOtpExpiresAt: string | null;
      createdAt: string;
    };
    listings: Listing[];
    count: number;
  }>>([]);
  const [collectedListings, setCollectedListings] = useState<Array<{
    user: {
      location: {
        type: 'Point';
        coordinates: [number, number];
      };
      _id: string;
      name: string;
      email: string;
      role: string;
      accountType: string;
      phoneNumber: string;
      profileImageUrl: string;
      resetOtp: string | null;
      resetOtpExpiresAt: string | null;
      resetOtpVerified: boolean;
      emailVerified: boolean;
      emailVerificationOtp: string | null;
      emailVerificationOtpExpiresAt: string | null;
      createdAt: string;
    };
    listings: Listing[];
    count: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  
  const { fetchListingsGrouped, loadingListings, updateListing, deleteListing, categories } = useData();

  // Fetch recent donations when component mounts
  useEffect(() => {
    fetchRecentDonations();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecentDonations();
    }, [])
  );

  const fetchRecentDonations = async () => {
    setLoading(true);
    try {
      // Fetch available grouped listings by users
      const availableGroupedData = await fetchListingsGrouped({ 
        status: 'available',
        groupBy: 'users'
      });
      
      // Fetch collected grouped listings by users
      const collectedGroupedData = await fetchListingsGrouped({ 
        status: 'claimed',
        groupBy: 'users'
      });
      
      // Sort available listings by count (most donations first) or by most recent listing
      const sortedAvailableData = availableGroupedData.sort((a, b) => {
        // First sort by count (descending)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // If counts are equal, sort by most recent listing
        const aLatestListing = a.listings.reduce((latest, current) => 
          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
        );
        const bLatestListing = b.listings.reduce((latest, current) => 
          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
        );
        return new Date(bLatestListing.createdAt).getTime() - new Date(aLatestListing.createdAt).getTime();
      });
      
      // Sort collected listings by most recent collection
      const sortedCollectedData = collectedGroupedData.sort((a, b) => {
        const aLatestListing = a.listings.reduce((latest, current) => 
          new Date(current.updatedAt || current.createdAt) > new Date(latest.updatedAt || latest.createdAt) ? current : latest
        );
        const bLatestListing = b.listings.reduce((latest, current) => 
          new Date(current.updatedAt || current.createdAt) > new Date(latest.updatedAt || latest.createdAt) ? current : latest
        );
        return new Date(bLatestListing.updatedAt || bLatestListing.createdAt).getTime() - new Date(aLatestListing.updatedAt || aLatestListing.createdAt).getTime();
      });
      
      // Limit to first 2 records
      setGroupedListings(sortedAvailableData.slice(0, 2));
      setCollectedListings(sortedCollectedData.slice(0, 2));
    } catch (error) {
      console.error('Failed to fetch grouped donations:', error);
      setGroupedListings([]);
      setCollectedListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Transform grouped API data to match the component's expected format
  const transformGroupedDataToDonationData = (groupedItem: {
    user: {
      location: {
        type: 'Point';
        coordinates: [number, number];
      };
      _id: string;
      name: string;
      email: string;
      role: string;
      accountType: string;
      phoneNumber: string;
      profileImageUrl: string;
      resetOtp: string | null;
      resetOtpExpiresAt: string | null;
      resetOtpVerified: boolean;
      emailVerified: boolean;
      emailVerificationOtp: string | null;
      emailVerificationOtpExpiresAt: string | null;
      createdAt: string;
    };
    listings: Listing[];
    count: number;
  }) => {
    // Get all unique category IDs from the user's listings
    const uniqueCategoryIds = Array.from(
      new Set(groupedItem.listings.map(listing => listing.categoryId).filter(Boolean))
    );
    
    // Map category IDs to category names using the categories from DataContext
    // and ensure category names are also unique
    const uniqueCategories = Array.from(
      new Set(
        uniqueCategoryIds.map(categoryId => {
          const category = categories.find(cat => cat.id === categoryId);
          return category?.name || 'General';
        }).filter(Boolean)
      )
    );
    
    // Get the most recent listing for additional details
    const mostRecentListing = groupedItem.listings.reduce((latest, current) => 
      new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    );

    return {
      id: groupedItem.user._id, // Use user ID as the main identifier
      donorName: groupedItem.user.name, // Use the user's name from the user object
      donationsListed: groupedItem.count.toString(),
      categories: uniqueCategories.map(categoryName => ({
        name: categoryName || 'General',
        color: generateCategoryColor(categoryName || 'General')
      })),
      status: 'Active' as const, // All grouped listings are available
      // Store the original grouped data for navigation
      groupedData: groupedItem,
    };
  };

  // Sample data for collected donations (keeping as is for now)
  const donationsCollectedData: Array<{
    id: string;
    donorName: string;
    donationTitle: string;
    donationsListed: string;
    categories: Array<{
      name: string;
      color: string;
    }>;
    status: 'Active' | 'Inactive' | 'Pending';
  }> = [
    {
      id: '1',
      donorName: 'Sarah Wilson',
      donationTitle: 'Clothing and Books Collection',
      donationsListed: '15',
      categories: [
        { name: 'Clothes', color: generateCategoryColor('Clothes') },
        { name: 'Books', color: generateCategoryColor('Books') },
      ],
      status: 'Inactive' as const,
    },
    {
      id: '2',
      donorName: 'David Brown',
      donationTitle: 'Food and Medical Supplies',
      donationsListed: '22',
      categories: [
        { name: 'Food', color: generateCategoryColor('Food') },
        { name: 'Medical', color: generateCategoryColor('Medical') },
      ],
      status: 'Inactive' as const,
    },
  ];

  const handleTabPress = (tab: 'listed' | 'collected') => {
    setActiveTab(tab);
  };

  const handleActionPress = (donationId: string) => {
    console.log('Action pressed for donation:', donationId);
    // Handle action menu
  };



  const handleDeleteListing = async (donationId: string) => {
    try {
      await deleteListing(donationId);
      // Refresh the data after deletion
      fetchRecentDonations();
    } catch (error) {
      console.error('Failed to delete listing:', error);
    }
  };

  const handleCollectAll = async (donationId: string) => {
    console.log('Collect all pressed for donation:', donationId);
    try {
      // Find the grouped item to update
      const groupedItem = groupedListings.find(item => item.user._id === donationId);
      
      if (groupedItem && groupedItem.listings.length > 0) {
        let successCount = 0;
        let errorCount = 0;
        
        // Update all listings for this user to 'claimed' status
        for (const listing of groupedItem.listings) {
          try {
            await updateListing(listing.id, { status: 'claimed' });
            successCount++;
          } catch (updateError: any) {
            errorCount++;
            // Log the specific error details
            if (updateError.response) {
            } else if (updateError.request) {
            } else {
            }
          }
        }
        
        // Show result to user
        if (successCount > 0) {
          if (errorCount > 0) {
            Alert.alert('Partial Success', `Collected ${successCount} donations, but ${errorCount} failed. Please try again for the failed ones.`);
          } else {
            Alert.alert('Success', `Successfully collected ${successCount} donations!`);
          }
          // Refresh the data after collection
          fetchRecentDonations();
        } else {
          Alert.alert('Error', 'Failed to collect any donations. Please check your connection and try again.');
        }
      } else {
        Alert.alert('No Data', 'No donations found to collect.');
      }
    } catch (error: any) {
      // Show user-friendly error message
      Alert.alert('Error', 'Failed to collect donations. Please try again.');
    }
  };

  const handleCalendarPress = () => {
    console.log('Calendar filter pressed');
    // Handle calendar filter
  };

  const handleSeeAllPress = () => {
    console.log('See All pressed - navigating to Donation screen');
    if (navigation) {
      navigation.navigate('Donation');
    } else {
      console.log('Navigation not available');
    }
  };

  const handleRefreshPress = () => {
    fetchRecentDonations();
  };

  const renderTabContent = () => {
    if (activeTab === 'listed') {
      if (loading || loadingListings) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading recent donations...</Text>
          </View>
        );
      }

      if (groupedListings.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={wp(15)} color={colors.gray.medium} />
            <Text style={styles.emptyText}>No recent donations found</Text>
            <Text style={styles.emptySubtext}>Check back later for new donations</Text>
          </View>
        );
      }

      const transformedData = groupedListings.map(transformGroupedDataToDonationData);
      
      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          {transformedData.map((donation) => {
            const groupedItem = donation.groupedData;
            const mostRecentListing = groupedItem.listings.reduce((latest, current) => 
              new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
            );
            
            return (
              <AdminDonationCard
                key={donation.id}
                donorName={donation.donorName}
                donationsListed={donation.donationsListed}
                categories={donation.categories}
                status={donation.status}
                onActionPress={() => handleActionPress(donation.id)}
                onCollectAll={() => handleCollectAll(donation.id)}
                isCollected={false}
                navigation={navigation}
                userData={groupedItem.user}
                donationData={{
                  id: mostRecentListing.id,
                  title: mostRecentListing.title, // Generic title since we removed donation title
                  description: mostRecentListing.description,
                  location: mostRecentListing.address,
                  distance: '', // You can calculate this based on user location
                  image: mostRecentListing.images.length > 0 
                    ? { uri: mostRecentListing.images[0] } 
                    : groupedItem.user.profileImageUrl 
                      ? { uri: groupedItem.user.profileImageUrl }
                      : require('../assets/images/feature.png'),
                  coordinates: mostRecentListing.location.coordinates,
                  createdAt: mostRecentListing.createdAt,
                }}
              />
            );
          })}
        </ScrollView>
      );
    } else {
      // Collected donations tab
      if (loading || loadingListings) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading collected donations...</Text>
          </View>
        );
      }

      if (collectedListings.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={wp(15)} color={colors.gray.medium} />
            <Text style={styles.emptyText}>No collected donations found</Text>
            <Text style={styles.emptySubtext}>Collected donations will appear here</Text>
          </View>
        );
      }

      const transformedCollectedData = collectedListings.map(transformGroupedDataToDonationData);
      
      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          {transformedCollectedData.map((donation) => {
            const groupedItem = donation.groupedData;
            const mostRecentListing = groupedItem.listings.reduce((latest, current) => 
              new Date(current.updatedAt || current.createdAt) > new Date(latest.updatedAt || latest.createdAt) ? current : latest
            );
            
            return (
              <AdminDonationCard
                key={donation.id}
                donorName={donation.donorName}
                donationsListed={donation.donationsListed}
                categories={donation.categories}
                status={donation.status}
                onActionPress={() => handleActionPress(donation.id)}
                onCollectAll={() => handleCollectAll(donation.id)}
                isCollected={true}
                navigation={navigation}
                userData={groupedItem.user}
                donationData={{
                  id: mostRecentListing.id,
                  title: mostRecentListing.title,
                  description: mostRecentListing.description,
                  location: mostRecentListing.address,
                  distance: '',
                  image: mostRecentListing.images.length > 0 
                    ? { uri: mostRecentListing.images[0] } 
                    : groupedItem.user.profileImageUrl 
                      ? { uri: groupedItem.user.profileImageUrl }
                      : require('../assets/images/feature.png'),
                  coordinates: mostRecentListing.location.coordinates,
                  createdAt: mostRecentListing.createdAt,
                }}
              />
            );
          })}
        </ScrollView>
      );
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'listed' && styles.activeTab]}
          onPress={() => handleTabPress('listed')}
        >
          <Text style={[styles.tabText, activeTab === 'listed' && styles.activeTabText]}>
            Donations Listed
          </Text>
          {activeTab === 'listed' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'collected' && styles.activeTab]}
          onPress={() => handleTabPress('collected')}
        >
          <Text style={[styles.tabText, activeTab === 'collected' && styles.activeTabText]}>
            Donations Collected
          </Text>
          {activeTab === 'collected' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Section Header */}
      {
        !hiddenSectionHeader && (
          <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'listed' ? 'Donations Listed' : 'Donations Collected'}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAllPress}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
        </View>
        )
      }
      
     

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
      <View style={{height:hp(20)}}></View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginBottom: hp(2),
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styling
  },
  tabText: {
    fontSize: wp(4),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  activeTabText: {
    color: colors.primary,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: wp(5),
    color: colors.black,
    fontFamily: Fonts.MONTSERRAT_BOLD,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    borderWidth: 1,
    borderColor: colors.gray.medium,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  calendarButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    borderWidth: 1,
    borderColor: colors.gray.medium,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  calendarIcon: {
    fontSize: wp(4),
  },
  seeAllButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: wp(5),
  },
  seeAllText: {
    color: colors.white,
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  contentContainer: {
    paddingHorizontal: wp(5),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(5),
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: wp(4),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(8),
  },
  emptyText: {
    marginTop: hp(2),
    fontSize: wp(4.5),
    color: colors.gray.dark,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: hp(1),
    fontSize: wp(3.5),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
  },
});

export default DonationsSection;
