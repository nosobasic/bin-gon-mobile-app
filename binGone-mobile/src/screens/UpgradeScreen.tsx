import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Clipboard,
} from 'react-native';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, RewardStatusResponse, ReferralInfo } from '../services/api';

interface UpgradeScreenProps {
  navigation: NavigationProp;
}

const UpgradeScreen: React.FC<UpgradeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [rewardStatus, setRewardStatus] = useState<RewardStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReferralModalVisible, setIsReferralModalVisible] = useState(false);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [referralCodeText, setReferralCodeText] = useState<string>('');
  const [referralLoading, setReferralLoading] = useState<boolean>(false);
  const [referralError, setReferralError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const rs = await apiClient.getRewardStatus();
        setRewardStatus(rs);
      } catch (e) {
        // Fallback to auth user only
        setRewardStatus(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const isPremium = useMemo(() => {
    const apiIsPremium = rewardStatus?.user?.isPremium;
    const apiTier = rewardStatus?.user?.tier;
    if (apiIsPremium || (apiTier && apiTier.toLowerCase() === 'premium')) return true;
    // fallback to auth user
    return !!(user?.isPremium || (user?.tier && user?.tier.toLowerCase() === 'premium'));
  }, [rewardStatus, user]);

  // Load referral info and show modal every time this screen is focused
  const fetchReferralData = useCallback(async () => {
    setReferralLoading(true);
    setReferralError('');
    setDebugInfo('');
    try {
      const [statusResult, referralResult] = await Promise.allSettled([
        apiClient.getRewardStatus(),
        apiClient.getReferralInfo(),
      ]);

      const status = statusResult.status === 'fulfilled' ? statusResult.value : null;
      const refInfo = referralResult.status === 'fulfilled' ? referralResult.value : null;

      setRewardStatus(status);
      setReferralInfo(refInfo);

      const codeFromReferral = (refInfo?.referralCode
        || (refInfo as any)?.code
        || (refInfo as any)?.referral_code
        || '') as string;
      const codeFromStatus = (status?.user?.referralCode
        || (status as any)?.user?.code
        || (status as any)?.user?.referral_code
        || '') as string;
      const codeFromUser = user?.referralCode || '';
      const code = (codeFromReferral || codeFromStatus || codeFromUser || '').trim();
      console.log('Referral codes → referral:', codeFromReferral, 'status:', codeFromStatus, 'user:', codeFromUser, 'derived:', code);
      setDebugInfo(`referral:${codeFromReferral || '-'} status:${codeFromStatus || '-'} user:${codeFromUser || '-'}`);
      setReferralCodeText(code);
      if (!code) {
        setReferralError('No referral code returned by API.');
      }
    } catch (e: any) {
      console.log('Failed loading referral sources', e?.message || e);
      setReferralError('Unable to load referral code.');
      setReferralCodeText('');
    } finally {
      setReferralLoading(false);
    }
  }, [user?.referralCode]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchReferralData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchReferralData]);

  useFocusEffect(
    useCallback(() => {
      setIsReferralModalVisible(true); // Open immediately
      fetchReferralData();
      return () => {
        setIsReferralModalVisible(false);
      };
    }, [fetchReferralData])
  );

  const handleCopyReferralCode = () => {
    try {
      if (referralCodeText && referralCodeText !== '------') {
        Clipboard.setString(referralCodeText);
        Alert.alert('Copied', 'Referral code copied to clipboard');
      }
    } catch {}
  };

  const closeReferralModal = () => setIsReferralModalVisible(false);

  // Premium benefits based on user role
  const donorBenefits = [
    'Priority Listing Placement',
    '"Super Donor" Profile Badge',
    'Option to Redeem Points for Listing Boosts',
    'Featured Spot in Community Highlights',
  ];

  const receiverBenefits = [
    'Unlimited Requests',
    'Request Highlight for Better Visibility',
    'Access to Exclusive Donation Drives',
    'Early Alerts for High-Demand Items',
  ];

  // Get benefits based on user role - both boxes show the same benefits
  const getBenefits = () => {
    if (user?.roleId === 2) {
      return receiverBenefits;
    }
    return donorBenefits; // Default to donor benefits for roleId 1 or fallback
  };

  const premiumBenefits = getBenefits();

  const handlePaymentUpgrade = () => {
    // Navigate to payment screen with target tier depending on current status
    const targetTier = isPremium ? 'verified' : 'premium';
    // Cast to any to avoid strict NavigationParam typing issues
    (navigation as any).navigate('Payment', { targetTier });
  };

  const handlePointsUpgrade = () => {
    // Navigate to upgrade points screen
    navigation.navigate('UpgradePoints');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader 
          type="other" 
          title="Upgrade" 
          onBackPress={() => (navigation as any).goBack()}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.text.gray }}>Loading your status…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Upgrade" 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: wp(20) }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          // Lazy import to avoid adding a top import
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          React.createElement(require('react-native').RefreshControl, {
            refreshing,
            onRefresh: handleRefresh,
            tintColor: colors.primary,
            colors: [colors.primary],
          })
        }
      >
        {/* Current Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>
            {isPremium ? "You're currently Premium" : "You're currently a Community Member"}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isPremium ? 'Upgrade to Verified Giver for extra trust and visibility.' : 'Upgrade to unlock premium features.'}
          </Text>
        </View>

        {/* Payment Upgrade Card */}
        <View style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <Image 
              source={require('../assets/images/payment.png')} 
              style={styles.paymentIcon}
              resizeMode="contain"
            />
            {/* Price will be determined by backend payment intent; label here is descriptive */}
            <Text style={styles.priceText}>{isPremium ? 'Verified Giver' : 'Premium'}</Text>
          </View>
          
          <View style={styles.benefitsList}>
            {premiumBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={[styles.benefitText,{
                    color: colors.white
                }]}>• {benefit}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.paymentButton} onPress={handlePaymentUpgrade}>
            <Text style={styles.paymentButtonText}>{isPremium ? 'Upgrade to Verified Giver' : 'Upgrade with Payment'}</Text>
          </TouchableOpacity>
        </View>

        {/* Points Upgrade Card - only show when user is not premium */}
        {!isPremium && (
        <View style={styles.pointsCard}>
          <View style={styles.cardHeader}>
            {/* <View style={styles.circleIcon}>
              <Text style={styles.circleText}>○</Text>
            </View> */}
            <Image 
              source={require('../assets/images/point.png')} 
              style={styles.crownIcon}
              resizeMode="contain"
            />
            <Text style={styles.pointsText}>200/Points</Text>
          </View>
          
          <Text style={styles.deductionText}>Points will be deducted from your balance.</Text>
          
          <View style={styles.benefitsList}>
            {premiumBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitText}>• {benefit}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.pointsButton} onPress={handlePointsUpgrade}>
            <Text style={styles.pointsButtonText}>Upgrade with Points</Text>
          </TouchableOpacity>
        </View>
        )}
      </ScrollView>

      {/* Floating refresh button */}
      <TouchableOpacity 
        onPress={handleRefresh}
        style={{
          position: 'absolute',
          right: wp(4),
          bottom: wp(4),
          backgroundColor: colors.primary,
          paddingVertical: wp(2.5),
          paddingHorizontal: wp(4),
          borderRadius: wp(6),
          elevation: 6,
        }}
        accessibilityLabel="Refresh status"
      >
        <Text style={{ color: colors.white, fontFamily: Fonts.MONTSERRAT_BOLD }}>Refresh</Text>
      </TouchableOpacity>

      {/* Referral Modal */}
      <Modal
        visible={isReferralModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeReferralModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeReferralModal}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Refer and Earn</Text>
              <Text style={styles.modalSubtitle}>Invite friend and get points</Text>

              {referralLoading ? (
                <View style={styles.referralCodeSection}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.referralCodeLabel, { marginTop: wp(2) }]}>Loading your referral code…</Text>
                </View>
              ) : (
                <View style={styles.referralCodeSection}>
                  <Text style={styles.referralCodeLabel}>Your referral code</Text>
                  <TouchableOpacity 
                    style={styles.referralCodeButton}
                    onPress={handleCopyReferralCode}
                    disabled={!referralCodeText}
                  >
                    <Text style={styles.referralCodeText}>{referralCodeText || '------'}</Text>
                    <Text style={styles.copyIcon}>⧉</Text>
                  </TouchableOpacity>
                  {!!referralError && (
                    <TouchableOpacity onPress={fetchReferralData} style={{ marginTop: wp(2) }}>
                      <Text style={{ color: colors.secondary, fontFamily: Fonts.POPPINS_SEMIBOLD }}>Retry</Text>
                    </TouchableOpacity>
                  )}
                  {!!referralError && !!debugInfo && (
                    <Text style={[styles.referralCodeLabel, { marginTop: wp(1) }]}>Debug: {debugInfo}</Text>
                  )}
                </View>
              )}
            </View>
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
  statusSection: {
    marginTop: wp(5),
    marginBottom: wp(6),
  },
  statusTitle: {
    fontSize: wp(4.5),
    color: colors.black,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
    marginBottom: wp(2),
  },
  statusSubtitle: {
    fontSize: wp(3.5),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  paymentCard: {
    backgroundColor: colors.primary,
    borderRadius: wp(4),
    padding: wp(5),
    marginBottom: wp(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.15,
    shadowRadius: wp(2),
    elevation: 8,
  },
  pointsCard: {
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(5),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.1,
    shadowRadius: wp(2),
    elevation: 4,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: wp(4),
  },
  paymentIcon: {
    width: wp(9),
    height: wp(9),
    tintColor: colors.white,
    marginBottom: wp(1),
  },
  crownIcon: {
    width: wp(9),
    height: wp(9),
    marginBottom: wp(1),
  },
  circleIcon: {
    width: wp(8),
    height: wp(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: wp(3),
  },
  circleText: {
    fontSize: wp(10),
    color: colors.black,
    fontWeight: 'bold',
  },
  priceText: {
    fontSize: wp(6),
    color: colors.white,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
  },
  pointsText: {
    fontSize: wp(6),
    color: colors.black,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
  },
  deductionText: {
    fontSize: wp(3.2),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
    marginBottom: wp(4),
  },
  benefitsList: {
    marginBottom: wp(5),
  },
  benefitItem: {
    marginBottom: wp(2),
  },
  benefitText: {
    fontSize: wp(3.5),
    color: colors.black,
    fontFamily: Fonts.POPPINS_REGULAR,
    lineHeight: wp(4.5),
    marginVertical: wp(1),
  },
  paymentButton: {
    backgroundColor: colors.secondary,
    borderRadius: wp(8),
    paddingVertical: wp(4),
    paddingHorizontal: wp(6),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.2,
    shadowRadius: wp(2),
    elevation: 5,
  },
  paymentButtonText: {
    fontSize: wp(4),
    color: colors.white,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
  },
  pointsButton: {
    backgroundColor: colors.primary,
    borderRadius: wp(8),
    paddingVertical: wp(4),
    paddingHorizontal: wp(6),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.2,
    shadowRadius: wp(2),
    elevation: 5,
  },
  pointsButtonText: {
    fontSize: wp(4),
    color: colors.white,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
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
    borderRadius: wp(4),
    width: '100%',
    maxWidth: wp(85),
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: wp(3.5),
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: wp(3),
    right: wp(3),
    zIndex: 1,
    width: wp(6),
    height: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: wp(6),
    color: colors.text.gray,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: wp(7),
    paddingTop: wp(8),
  },
  modalTitle: {
    fontSize: wp(5.5),
    color: colors.black,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
    marginBottom: wp(1),
  },
  modalSubtitle: {
    fontSize: wp(3),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginBottom: wp(6),
  },
  referralCodeSection: {
    width: '100%',
    alignItems: 'center',
  },
  referralCodeLabel: {
    fontSize: wp(3.2),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginBottom: wp(3),
    textAlign: 'center',
  },
  referralCodeButton: {
    backgroundColor: colors.primary,
    borderRadius: wp(2),
    paddingVertical: wp(3),
    paddingHorizontal: wp(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp(50),
    marginBottom: wp(2),
  },
  referralCodeText: {
    fontSize: wp(4.5),
    color: colors.white,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
    letterSpacing: wp(0.5),
    marginRight: wp(2),
  },
  copyIcon: {
    fontSize: wp(4),
    color: colors.white,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
    marginLeft: wp(2),
  },
});

export default UpgradeScreen;
