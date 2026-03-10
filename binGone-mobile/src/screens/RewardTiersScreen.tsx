import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, RewardStatusResponse, RewardTier } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

interface RewardTiersScreenProps {
  navigation: NavigationProp;
}

const RewardTiersScreen: React.FC<RewardTiersScreenProps> = ({ navigation }) => {
  const [isPremiumModalVisible, setIsPremiumModalVisible] = useState(false);
  const [rewardStatus, setRewardStatus] = useState<RewardStatusResponse | null>(null);
  const [availableTiers, setAvailableTiers] = useState<RewardTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { user } = useAuth();

  // Fetch reward status and tiers on component mount
  useEffect(() => {
    fetchRewardData();
  }, []);

  // Also refetch whenever screen regains focus (e.g., after payment success)
  useFocusEffect(
    useCallback(() => {
      fetchRewardData();
    }, [])
  );

  const fetchRewardData = async () => {
    try {
      setIsLoading(true);
      const [statusResponse, tiersResponse] = await Promise.all([
        apiClient.getRewardStatus(),
        apiClient.getRewardTiers()
      ]);
      
      setRewardStatus(statusResponse);
      setAvailableTiers(tiersResponse);
    } catch (error) {
      console.error('Error fetching reward data:', error);
      Alert.alert('Error', 'Failed to load reward information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeWithPoints = async (targetTier: string) => {
    try {
      setIsUpgrading(true);
      const response = await apiClient.upgradeWithPoints(targetTier);
      
      Alert.alert(
        'Upgrade Successful!', 
        response.message,
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh reward data
              fetchRewardData();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error upgrading with points:', error);
      Alert.alert('Upgrade Failed', error.response?.data?.message || 'Failed to upgrade with points');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleUpgradeWithPayment = () => {
    navigation.navigate('Upgrade');
    setIsPremiumModalVisible(false);
  };

  // Donor offers (roleId 1)
  const donorOffers = [
    'Unlimited Donation Posts',
    'Points for Each Donated Item (+5 pts/item)',
    'Points for Successful Referrals (+10 pts/referral)',
    'Recognition in Community Highlights',
    'Basic Donor Badge',
    'Access to Standard Listing Placement',
    'Eligibility for Future Donor Rewards',
  ];

  // Receiver offers (roleId 2)
  const receiverOffers = [
    'Monthly Request Quota (2 items/month)',
    'Points for Confirming Pickups (+2 pts/pickup)',
    'Points for Successful Referrals (+10 pts/referral)',
    'Access to Community Donation Listings',
    'Basic Support Badge',
    'Early Access to Selected Donation Campaigns',
    'Notifications for Nearby Donations',
    'Eligibility for Tier-Up via Points',
  ];

  // Get offers based on user role
  const getOffers = () => {
    if (user?.roleId === 2) {
      return receiverOffers;
    }
    return donorOffers; // Default to donor offers for roleId 1 or fallback
  };

  const offers = getOffers();

  // Donor premium benefits (roleId 1)
  const donorPremiumBenefits = [
    'Priority Listing Placement',
    'Super Donor Profile Badge',
    'Option to Redeem Points for Listing Boosts',
    'Featured Spot in Community Highlights',
    'Early Access to New Campaigns',
    'Priority Support Access',
    'Increased Visibility in Search & Filters',
  ];

  // Receiver premium benefits (roleId 2)
  const receiverPremiumBenefits = [
    'Unlimited Item Requests',
    'Option to Redeem Points for Request Boosts',
    'Premium Request Highlight (stands out in listings)',
    'Access to Exclusive Donation Drives',
    'Early Notifications for High-Demand Items',
    'Priority Support Access',
    'Premium Receiver Badge',
  ];

  // Get premium benefits based on user role
  const getPremiumBenefits = () => {
    if (user?.roleId === 2) {
      return receiverPremiumBenefits;
    }
    return donorPremiumBenefits; // Default to donor benefits for roleId 1 or fallback
  };

  const premiumBenefits = getPremiumBenefits();

  const handlePremiumBenefitsPress = () => {
    setIsPremiumModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsPremiumModalVisible(false);
  };

  const handleUpgradeNow = () => {
    // Navigate to upgrade screen
    navigation.navigate('Upgrade');
    setIsPremiumModalVisible(false);
  };

  // Get next tier for upgrade
  const getNextTier = () => {
    if (!rewardStatus || !availableTiers.length) return null;
    
    const currentTier = rewardStatus.currentTier;
    const currentIndex = availableTiers.findIndex(tier => tier._id === currentTier._id);
    
    if (currentIndex < availableTiers.length - 1) {
      return availableTiers[currentIndex + 1];
    }
    return null;
  };

  const nextTier = getNextTier();

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Reward Tiers" 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: wp(20) }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Reward Summary Card */}
        <View style={styles.rewardCard}>
          <ImageBackground
            source={require('../assets/images/home_bg.jpg')}
            style={styles.rewardBackground}
            imageStyle={styles.rewardBackgroundImage}
            resizeMode="cover"
          >
            <View style={styles.rewardOverlay}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.white} />
                  <Text style={styles.loadingText}>Loading reward data...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.rewardCardContent}>
                    <View style={styles.pointsSection}>
                      <Text style={styles.pointsValue}>
                        {rewardStatus?.user.points || 0}
                      </Text>
                      <Text style={styles.pointsLabel}>Available Points</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.statusSection}>
                      <Text style={styles.statusValue}>
                        {rewardStatus?.user.tier || 'Free'}
                      </Text>
                      <Text style={styles.statusLabel}>Status</Text>
                    </View>
                  </View>
                  
                  {nextTier && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${rewardStatus?.progressToNext.progress || 0}%` 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        Progress to {nextTier.displayName} ({rewardStatus?.progressToNext.currentPoints || 0}/{rewardStatus?.progressToNext.targetPoints || 0} points)
                      </Text>
                    </View>
                  )}
                  
                  {/* Upgrade Options */}
                  {nextTier && (
                    <View style={styles.upgradeOptionsContainer}>
                      {nextTier.pointUpgradeCost && rewardStatus && rewardStatus.user.points >= nextTier.pointUpgradeCost && (
                        <TouchableOpacity 
                          style={[styles.upgradeOptionButton, styles.pointsUpgradeButton]}
                          onPress={() => handleUpgradeWithPoints(nextTier._id)}
                          disabled={isUpgrading}
                        >
                          {isUpgrading ? (
                            <ActivityIndicator size="small" color={colors.white} />
                          ) : (
                            <>
                              <Text style={styles.upgradeOptionText}>
                                Upgrade with {nextTier.pointUpgradeCost} Points
                              </Text>
                              <Image 
                                source={require('../assets/images/right_arrow.png')} 
                                style={styles.arrowIcon}
                                resizeMode="contain"
                              />
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity 
                        style={[styles.upgradeOptionButton, styles.paymentUpgradeButton]}
                        onPress={handleUpgradeWithPayment}
                      >
                        <Text style={styles.upgradeOptionText}>
                          Upgrade with Payment (${nextTier.monthlyPrice}/month)
                        </Text>
                        <Image 
                          source={require('../assets/images/right_arrow.png')} 
                          style={styles.arrowIcon}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <TouchableOpacity style={styles.premiumButton} onPress={handlePremiumBenefitsPress}>
                    <Text style={styles.premiumButtonText}>Premium Only Benefits</Text>
                    <Image 
                      source={require('../assets/images/right_arrow.png')} 
                      style={styles.arrowIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ImageBackground>
        </View>

        {/* Offers Section */}
        <View style={styles.offersSection}>
          <Text style={styles.offersTitle}>
            {rewardStatus?.user.tier === 'Premium' ? 'Premium Benefits' : 'Offers For Community Member'}
          </Text>
          
          {(rewardStatus?.user.tier === 'Premium' ? premiumBenefits : offers).map((offer, index) => (
            <View key={index} style={styles.offerItem}>
              <Text style={styles.offerText}>{offer}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Premium Benefits Modal */}
      <Modal
        visible={isPremiumModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Premium Only Benefits</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Premium Benefits List */}
            <View style={styles.benefitsList}>
              {premiumBenefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {/* Upgrade Now Button */}
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeNow}>
              <Image 
                source={require('../assets/images/upgrade.png')} 
                style={styles.lightningIcon}
                resizeMode="contain"
              />
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  rewardCard: {
    borderRadius: wp(4),
    marginTop: wp(5),
    marginBottom: wp(5),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.15,
    shadowRadius: wp(1.5),
    elevation: 8,
  },
  rewardBackground: {
    width: '100%',
    minHeight: wp(40),
  },
  rewardBackgroundImage: {
    borderRadius: wp(4),
  },
  rewardOverlay: {
    flex: 1,
    backgroundColor: `${colors.primary}B3`, // 70% opacity overlay
    padding: wp(5),
    justifyContent: 'space-between',
  },
  rewardCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsSection: {
    flex: 1,
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: wp(8),
    color: colors.white,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
  },
  pointsLabel: {
    fontSize: wp(3.5),
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: wp(1),
  },
  divider: {
    width: 1,
    height: wp(12),
    backgroundColor: colors.white,
    marginHorizontal: wp(4),
  },
  statusSection: {
    flex: 1,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: wp(8),
    color: colors.white,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
  },
  statusLabel: {
    fontSize: wp(3.5),
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: wp(1),
  },
  progressContainer: {
    marginBottom: wp(4),
  },
  progressBar: {
    height: wp(2),
    backgroundColor: colors.white,
    borderRadius: wp(1),
    marginBottom: wp(2),
    marginVertical: wp(2)
  },
  progressFill: {
    height: '100%',
    width: '75%', // 75% progress
    backgroundColor: colors.secondary, // Orange color
    borderRadius: wp(0.75),
  },
  progressText: {
    fontSize: wp(3),
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  premiumButtonText: {
    fontSize: wp(3.5),
    color:  colors.white, // Green color
    fontFamily: Fonts.POPPINS_REGULAR,
    marginRight: wp(2),
  },
  arrowIcon: {
    width: wp(3.8),
    height: wp(3.8),
    tintColor: colors.white,
    marginTop: wp(0.5),
  },
  offersSection: {
    marginTop: wp(3),
  },
  offersTitle: {
    fontSize: wp(4.8),
    color: colors.black,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
    marginBottom: wp(4),
  },
  offerItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: wp(2),
    paddingVertical: wp(4),
    paddingHorizontal: wp(4),
    marginBottom: wp(2),
  },
  offerText: {
    fontSize: wp(3.3),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: wp(6),
    width: '100%',
    paddingVertical: wp(6),
    paddingHorizontal: wp(5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: wp(3),
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: wp(5),
  },
  modalTitle: {
    fontSize: wp(5),
    color: colors.black,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
  },
  closeButton: {
    width: wp(8),
    height: wp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: wp(5),
    color: colors.text.gray,
    fontWeight: 'bold',
  },
  benefitsList: {
    marginBottom: wp(4),
  },
  benefitItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: wp(2),
    paddingVertical: wp(4),
    paddingHorizontal: wp(4),
    marginBottom: wp(2),
  },
  benefitText: {
    fontSize: wp(3.3),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: wp(8),
    paddingVertical: wp(4.5),
    paddingHorizontal: wp(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.2,
    shadowRadius: wp(2),
    elevation: 5,
  },
  lightningIcon: {
    width: wp(5),
    height: wp(5),
    marginRight: wp(3),
    tintColor: '#FFD700', // Gold color for lightning
  },
  upgradeButtonText: {
    fontSize: wp(4.2),
    color: colors.white,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: wp(10),
  },
  loadingText: {
    fontSize: wp(3.5),
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: wp(3),
  },
  // Upgrade options styles
  upgradeOptionsContainer: {
    marginBottom: wp(4),
  },
  upgradeOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: wp(3),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    marginBottom: wp(2),
  },
  pointsUpgradeButton: {
    backgroundColor: colors.secondary, // Orange color for points upgrade
  },
  paymentUpgradeButton: {
    backgroundColor: colors.primary, // Green color for payment upgrade
  },
  upgradeOptionText: {
    fontSize: wp(3.2),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    flex: 1,
  },
});

export default RewardTiersScreen;
