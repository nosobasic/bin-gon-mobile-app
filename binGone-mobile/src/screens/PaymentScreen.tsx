import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { 
  createPaymentIntent, 
  confirmPayment, 
  RewardTier,
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
  getRewardTiers
} from '../services/api';
import { TEST_CARDS, isTestMode, getStripePublishableKey } from '../config/stripe';
import { useStripe, CardField } from '@stripe/stripe-react-native';

interface PaymentScreenProps {
  navigation: NavigationProp;
  route?: any; // expecting route.params.targetTier
}

// Helper function to convert full country name to 2-character ISO code
const getCountryCode = (countryName: string): string => {
  const countryMap: { [key: string]: string } = {
    'United States': 'US',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'Germany': 'DE',
    'France': 'FR',
    'Australia': 'AU',
    'India': 'IN',
    'Egypt': 'EG',
    'Italy': 'IT',
    'Spain': 'ES',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Poland': 'PL',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Portugal': 'PT',
    'Greece': 'GR',
    'Ireland': 'IE',
    'New Zealand': 'NZ',
    'Japan': 'JP',
    'South Korea': 'KR',
    'Singapore': 'SG',
    'Hong Kong': 'HK',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Argentina': 'AR',
    'Chile': 'CL',
    'Colombia': 'CO',
    'Peru': 'PE',
    'South Africa': 'ZA',
    'Nigeria': 'NG',
    'Kenya': 'KE',
    'Morocco': 'MA',
    'Israel': 'IL',
    'Turkey': 'TR',
    'Russia': 'RU',
    'China': 'CN',
    'Thailand': 'TH',
    'Malaysia': 'MY',
    'Indonesia': 'ID',
    'Philippines': 'PH',
    'Vietnam': 'VN',
  };
  return countryMap[countryName] || countryName; // Return code if found, otherwise return original
};

// Country list data
const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LV', name: 'Latvia' },
  { code: 'EE', name: 'Estonia' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'IL', name: 'Israel' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'BY', name: 'Belarus' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'NZ', name: 'New Zealand' },
];

const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const { createPaymentMethod, confirmPayment: stripeConfirmPayment } = useStripe();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'bank'>('card');
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [country, setCountry] = useState('');
  const [isCountryDropdownVisible, setIsCountryDropdownVisible] = useState(false);
  
  // Payment flow state
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<RewardTier | null>(null);
  const [availableTiers, setAvailableTiers] = useState<RewardTier[]>([]);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);

  // Load server tiers and select the correct one (prevents name mismatches causing 404s)
  useEffect(() => {
    const loadTiers = async () => {
      try {
        const tiers = await getRewardTiers();
        setAvailableTiers(tiers);

        const target = (route?.params?.targetTier || 'Premium').toString();
        // Normalize and map to exact backend names
        const canonicalName = (() => {
          const lower = target.toLowerCase();
          if (lower === 'verified' || lower === 'verified_giver' || lower === 'verified giver') return 'Verified Giver';
          return 'Premium';
        })();

        // Prefer exact name match, fallback to displayName match
        const match = tiers.find(t => t.name === canonicalName) || tiers.find(t => t.displayName === canonicalName);

        if (match) {
          setSelectedTier(match);
        } else {
          // Fallback: pick first active tier to avoid nulls; backend will still validate
          setSelectedTier(tiers[0] || null);
        }
      } catch (e) {
        // If fetching tiers fails, keep previous local default (premium)
        const target = (route?.params?.targetTier || 'Premium').toString();
        const canonicalName = (() => {
          const lower = target.toLowerCase();
          if (lower === 'verified' || lower === 'verified_giver' || lower === 'verified giver') return 'Verified Giver';
          return 'Premium';
        })();
        setSelectedTier({
          _id: canonicalName,
          name: canonicalName,
          displayName: canonicalName,
          pointThreshold: canonicalName === 'Verified Giver' ? 0 : 200,
          monthlyPrice: canonicalName === 'Verified Giver' ? 799 : 499,
          pointUpgradeCost: canonicalName === 'Verified Giver' ? undefined : 200,
          benefits: [],
          isActive: true,
          sortOrder: 0,
          createdAt: new Date().toISOString()
        } as RewardTier);
      }
    };
    loadTiers();
  }, [route?.params]);

  const handlePayNow = async () => {
    if (!selectedTier) {
      Alert.alert('Error', 'Please select a tier first');
      return;
    }

    // Validate form
    if (!cardDetails?.complete || !country) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);

      // Step 1: Create payment intent with backend
      const paymentIntentRequest: CreatePaymentIntentRequest = {
        // Backend expects the exact tier name string, e.g., 'Premium' or 'Verified Giver'
        targetTier: selectedTier.name,
        paymentMethodType: selectedPaymentMethod,
      };

      console.log('Creating payment intent for tier:', selectedTier.name);
      console.log('Payment intent request:', paymentIntentRequest);
      
      const paymentIntentResponse = await createPaymentIntent(paymentIntentRequest);
      console.log('Payment intent response:', paymentIntentResponse);
      setPaymentIntent(paymentIntentResponse);

      // Step 2: Create payment method using Stripe SDK
      console.log('Creating payment method with Stripe...');
      
      // Convert country name to 2-character ISO code
      const countryCode = getCountryCode(country);
      
      const { paymentMethod, error: paymentMethodError } = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            address: {
              country: countryCode,
            },
          },
        },
      });

      if (paymentMethodError) {
        console.error('Payment method creation error:', paymentMethodError);
        throw new Error(paymentMethodError.message || 'Failed to create payment method');
      }

      if (!paymentMethod) {
        throw new Error('Payment method creation failed');
      }

      console.log('Payment method created successfully:', paymentMethod.id);

      // Step 3: Confirm payment using Stripe SDK
      console.log('Confirming payment with Stripe...');
      
      const { paymentIntent, error: confirmError } = await stripeConfirmPayment(
        paymentIntentResponse.clientSecret,
        {
          paymentMethodType: 'Card',
          paymentMethodData: {
            billingDetails: {
              address: {
                country: countryCode,
              },
            },
          },
        }
      );

      if (confirmError) {
        console.error('Payment confirmation error:', confirmError);
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }

      if (paymentIntent?.status === 'Succeeded') {
        // Step 4: Notify backend of successful payment
        const confirmPaymentRequest: ConfirmPaymentRequest = {
          paymentId: paymentIntentResponse.paymentId,
          paymentIntentId: paymentIntent.id,
          paymentMethodId: paymentMethod.id,
        };

        console.log('Notifying backend of successful payment...');
        const confirmResponse = await confirmPayment(confirmPaymentRequest);
        console.log('Backend confirmation response:', confirmResponse);

        // Step 5: Show success message
        Alert.alert(
          'Payment Successful! 🎉', 
          `You have successfully upgraded to ${confirmResponse.user.tier} tier!`, 
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back or to a success screen
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        throw new Error(`Payment not completed. Status: ${paymentIntent?.status}`);
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Payment could not be processed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Payment Failed', 
        `Error: ${errorMessage}\n\nStatus: ${error.response?.status || 'Unknown'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };


  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setIsCountryDropdownVisible(false);
  };

  const renderCountryItem = ({ item }: { item: { code: string; name: string } }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item.name)}
    >
      <Text style={styles.countryItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="Payment" 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: wp(20) }} 
        showsVerticalScrollIndicator={false}
      >

        {/* Test Mode Indicator */}
        {isTestMode() && (
          <View style={styles.testModeIndicator}>
            <Text style={styles.testModeText}>🧪 TEST MODE - Use test card: 4242 4242 4242 4242</Text>
          </View>
        )}

        {/* Selected Tier Display */}
        {selectedTier && (
          <View style={styles.selectedTierSection}>
            <View style={styles.selectedTierCard}>
              <View style={styles.selectedTierHeader}>
                <Text style={styles.selectedTierName}>{selectedTier.displayName}</Text>
                <Text style={styles.selectedTierPrice}>
                  ${(selectedTier.monthlyPrice / 100).toFixed(2)}/month
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Method Selection */}
        <View style={styles.paymentMethodSection}>
          <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              selectedPaymentMethod === 'card' && styles.selectedPaymentMethod,
            ]}
            onPress={() => setSelectedPaymentMethod('card')}
          >
            <View style={styles.paymentMethodContent}>
              <View style={styles.paymentMethodIcon}>
                <Text style={styles.cardIcon}>💳</Text>
              </View>
              <Text
                style={[
                  styles.paymentMethodText,
                  selectedPaymentMethod === 'card' && styles.selectedPaymentMethodText,
                ]}
              >
                Card
              </Text>
            </View>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              selectedPaymentMethod === 'bank' && styles.selectedPaymentMethod,
            ]}
            onPress={() => setSelectedPaymentMethod('bank')}
          >
            <View style={styles.paymentMethodContent}>
              <View style={styles.paymentMethodIcon}>
                <Text style={styles.bankIcon}>🏦</Text>
              </View>
              <Text
                style={[
                  styles.paymentMethodText,
                  selectedPaymentMethod === 'bank' && styles.selectedPaymentMethodText,
                ]}
              >
                Bank Account
              </Text>
            </View>
          </TouchableOpacity> */}

          {/* <TouchableOpacity style={styles.moreOptionsButton}>
            <Text style={styles.moreOptionsIcon}>⋯</Text>
          </TouchableOpacity> */}
        </View>


        {/* Card Details Form */}
        {selectedPaymentMethod === 'card' && (
          <View style={styles.formSection}>
            {/* Stripe CardField */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Details</Text>
              <View style={styles.cardFieldContainer}>
                <CardField
                  postalCodeEnabled={true}
                  placeholders={{
                    number: '4242 4242 4242 4242',
                  }}
                  cardStyle={{
                    backgroundColor: '#FFFFFF',
                    textColor: '#000000',
                    borderColor: '#E0E0E0',
                    borderWidth: 1,
                    borderRadius: 8,
                    fontSize: 16,
                    placeholderColor: '#999999',
                  }}
                  style={styles.cardField}
                  onCardChange={(cardDetails) => {
                    console.log('Card details changed:', cardDetails);
                    setCardDetails(cardDetails);
                  }}
                />
              </View>
            </View>

            {/* Country */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Country</Text>
              <TouchableOpacity
                style={styles.countryContainer}
                onPress={() => setIsCountryDropdownVisible(true)}
              >
                <Text style={[styles.countryInput, !country && styles.placeholderText]}>
                  {country || 'Select Country'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bank Account Form */}
        {selectedPaymentMethod === 'bank' && (
          <View style={styles.formSection}>
            <Text style={styles.comingSoonText}>Bank account payment coming soon!</Text>
          </View>
        )}
      </ScrollView>

      {/* Pay Now Button */}
      {selectedTier && (
        <View style={styles.payButtonContainer}>
          <TouchableOpacity 
            style={[styles.payButton, isLoading && styles.payButtonDisabled]} 
            onPress={handlePayNow}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.payButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.payButtonText}>
                Pay ${(selectedTier.monthlyPrice / 100).toFixed(2)} Now
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Country Dropdown Modal */}
      <Modal
        visible={isCountryDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCountryDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCountryDropdownVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setIsCountryDropdownVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={countries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              style={styles.countryList}
              showsVerticalScrollIndicator={true}
            />
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
  paymentMethodSection: {
    flexDirection: 'row',
    marginTop: wp(5),
    marginBottom: wp(6),
    alignItems: 'center',
  },
  paymentMethodButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: wp(2),
    paddingVertical: wp(3),
    paddingHorizontal: wp(3),
    marginRight: wp(2),
    backgroundColor: colors.white,
  },
  selectedPaymentMethod: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodIcon: {
    marginRight: wp(2),
  },
  cardIcon: {
    fontSize: wp(4),
  },
  bankIcon: {
    fontSize: wp(4),
  },
  paymentMethodText: {
    fontSize: wp(3.5),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  selectedPaymentMethodText: {
    color: colors.primary,
  },
  moreOptionsButton: {
    width: wp(12),
    height: wp(10),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  moreOptionsIcon: {
    fontSize: wp(4),
    color: colors.text.gray,
  },
  formSection: {
    marginBottom: wp(6),
  },
  inputGroup: {
    marginBottom: wp(4),
  },
  inputLabel: {
    fontSize: wp(3.5),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginBottom: wp(2),
  },
  cardNumberContainer: {
    position: 'relative',
  },
  cardNumberInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: wp(2),
    paddingVertical: wp(3.5),
    paddingHorizontal: wp(4),
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    backgroundColor: colors.white,
    paddingRight: wp(20), // Space for card logos
  },
  cardLogos: {
    position: 'absolute',
    right: wp(3),
    top: '50%',
    transform: [{ translateY: -wp(1.5) }],
    flexDirection: 'row',
  },
  cardLogo: {
    fontSize: wp(3),
    marginLeft: wp(1),
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: wp(2),
    paddingVertical: wp(3.5),
    paddingHorizontal: wp(4),
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    backgroundColor: colors.white,
  },
  countryContainer: {
    position: 'relative',
  },
  countryInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: wp(2),
    paddingVertical: wp(3.5),
    paddingHorizontal: wp(4),
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    backgroundColor: colors.white,
    paddingRight: wp(8), // Space for dropdown icon
    color: colors.black,
  },
  placeholderText: {
    color: colors.text.gray,
  },
  dropdownIcon: {
    position: 'absolute',
    right: wp(3),
    top: '50%',
    transform: [{ translateY: -wp(1) }],
    fontSize: wp(3),
    color: colors.text.gray,
  },
  comingSoonText: {
    fontSize: wp(4),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
    paddingVertical: wp(8),
  },
  payButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: wp(5),
    paddingTop: wp(3),
  },
  payButton: {
    backgroundColor: colors.primary, // Dark green color
    borderRadius: wp(2),
    paddingVertical: wp(4),
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
  payButtonText: {
    fontSize: wp(4.5),
    color: colors.white,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    fontWeight: 'bold',
  },
  // Modal and Dropdown Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: colors.white,
    borderRadius: wp(3),
    width: wp(85),
    maxHeight: wp(70),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: wp(3),
    elevation: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownTitle: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
  },
  closeButton: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: wp(4),
    color: colors.text.gray,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  countryList: {
    maxHeight: wp(50),
  },
  countryItem: {
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryItemText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
  },
  // Selected Tier Styles
  selectedTierSection: {
    marginBottom: wp(4),
  },
  selectedTierCard: {
    backgroundColor: colors.primary,
    borderRadius: wp(3),
    padding: wp(4),
  },
  selectedTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedTierName: {
    fontSize: wp(4.5),
    fontFamily: Fonts.MONTSERRAT_BOLD,
    color: colors.white,
  },
  selectedTierPrice: {
    fontSize: wp(4),
    fontFamily: Fonts.MONTSERRAT_BOLD,
    color: colors.white,
  },
  changeTierButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: wp(3),
    paddingVertical: wp(2),
    borderRadius: wp(2),
  },
  changeTierText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.white,
  },
  // Loading Button Styles
  payButtonDisabled: {
    opacity: 0.7,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Test Mode Styles
  testModeIndicator: {
    backgroundColor: '#FFF3CD',
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: wp(4),
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  testModeText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: '#856404',
    marginBottom: wp(3),
    textAlign: 'center',
  },
  fillTestButton: {
    backgroundColor: '#856404',
    borderRadius: wp(2),
    paddingVertical: wp(3),
    alignItems: 'center',
  },
  fillTestButtonText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: '#FFF3CD',
  },
  // CardField Styles
  cardFieldContainer: {
    marginTop: wp(2),
  },
  cardField: {
    width: '100%',
    height: wp(12),
    marginVertical: wp(2),
  },
});

export default PaymentScreen;
