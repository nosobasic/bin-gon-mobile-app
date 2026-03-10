import React, { useState } from 'react';
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
  Clipboard,
} from 'react-native';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAuth } from '../contexts/AuthContext';

interface UpgradePointsScreenProps {
  navigation: NavigationProp;
}

const UpgradePointsScreen: React.FC<UpgradePointsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [isReferralModalVisible, setIsReferralModalVisible] = useState(false);

  const handleRedeemPoints = () => {
    // Handle redeem points logic here
    console.log('Redeem points pressed');
  };

  const handleEarnPoints = (type: string) => {
    if (type === 'referral') {
      setIsReferralModalVisible(true);
    } else {
      // Handle other earn points logic here
      console.log(`Earn points: ${type}`);
    }
  };

  const handleCopyReferralCode = () => {
    const referralCode = 'XAJNSJS'; // This should come from user data or API
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const closeReferralModal = () => {
    setIsReferralModalVisible(false);
  };

  // Check if user is receiver (roleId 2)
  const isReceiver = user?.roleId === 2;

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
      >
        {/* Main Points Card */}
        <View style={styles.pointsCard}>
          <ImageBackground
            source={require('../assets/images/home_bg.jpg')}
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImage}
            resizeMode="cover"
          >
            <View style={styles.cardOverlay}>
              <View style={styles.pointsSection}>
                <View style={styles.pointsInfo}>
                  <Text style={styles.pointsValue}>130</Text>
                  <Text style={styles.pointsLabel}>Available Points</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.statusInfo}>
                  <Text style={styles.statusValue}>Free</Text>
                  <Text style={styles.statusLabel}>Status</Text>
                </View>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
                <Text style={styles.progressText}>
                  Progress to {isReceiver ? 'Verified Receiver' : 'Verified Giver'} (Premium)
                </Text>
              </View>
              
              <TouchableOpacity style={styles.redeemButton} onPress={handleRedeemPoints}>
                <Text style={styles.redeemButtonText}>Redeem your points for extra visibility.</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* You Need More Points Section */}
        <View style={styles.earnPointsSection}>
          <Text style={styles.earnPointsTitle}>You Need More Points</Text>
          
          {isReceiver ? (
            // Receiver specific earning options
            <TouchableOpacity 
              style={styles.earnPointsCard} 
              onPress={() => handleEarnPoints('referral')}
            >
              <Text style={styles.earnPointsText}>Earn +10 points for every successful referral.</Text>
              <Image 
                source={require('../assets/images/right_arrow.png')} 
                style={styles.arrowIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : (
            // Donor specific earning options
            <>
              <TouchableOpacity 
                style={styles.earnPointsCard} 
                onPress={() => handleEarnPoints('donation')}
              >
                <Text style={styles.earnPointsText}>Earn +5 points for each donated item.</Text>
                <Image 
                  source={require('../assets/images/right_arrow.png')} 
                  style={styles.arrowIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.earnPointsCard} 
                onPress={() => handleEarnPoints('referral')}
              >
                <Text style={styles.earnPointsText}>Earn +10 points for every successful referral.</Text>
                <Image 
                  source={require('../assets/images/right_arrow.png')} 
                  style={styles.arrowIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Referral Modal */}
      <Modal
        visible={isReferralModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeReferralModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeReferralModal}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {/* Modal Content */}
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Refer and Earn</Text>
              <Text style={styles.modalSubtitle}>Invite friend and get points</Text>
              
              <View style={styles.referralCodeSection}>
                <Text style={styles.referralCodeLabel}>Your referral code</Text>
                <TouchableOpacity 
                  style={styles.referralCodeButton}
                  onPress={handleCopyReferralCode}
                >
                  <Text style={styles.referralCodeText}>XAJNSJS</Text>
                  <Text style={styles.copyIcon}>⧉</Text>
                </TouchableOpacity>
              </View>
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
  pointsCard: {
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
  cardBackground: {
    width: '100%',
    minHeight: wp(50),
  },
  cardBackgroundImage: {
    borderRadius: wp(4),
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: `${colors.primary}B3`, // 70% opacity overlay
    padding: wp(5),
    justifyContent: 'space-between',
  },
  pointsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: wp(4),
  },
  pointsInfo: {
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
  statusInfo: {
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
  },
  progressFill: {
    height: '100%',
    width: '70%', // 70% progress
    backgroundColor: colors.secondary, // Orange color
    borderRadius: wp(0.75),
  },
  progressText: {
    fontSize: wp(3),
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  redeemButton: {
    backgroundColor: colors.white,
    borderRadius: wp(2),
    paddingVertical: wp(1.4),
    alignItems: 'center',
  },
  redeemButtonText: {
    fontSize: wp(3),
    color: colors.secondary,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: 'center',
  },
  earnPointsSection: {
    marginTop: wp(3),
  },
  earnPointsTitle: {
    fontSize: wp(4.8),
    color: colors.black,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
    marginBottom: wp(4),
  },
  earnPointsCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: wp(2),
    paddingVertical: wp(4),
    paddingHorizontal: wp(4),
    marginBottom: wp(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earnPointsText: {
    fontSize: wp(3.3),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    flex: 1,
  },
  arrowIcon: {
    width: wp(4),
    height: wp(4),
    tintColor: colors.text.gray,
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

export default UpgradePointsScreen;
