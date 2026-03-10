import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { NavigationProp, ProductCard } from '../types/navigation';
import DonationActionMenu from './DonationActionMenu';

interface AdminDonationCardProps {
  donorName: string;
  donationsListed: string;
  categories: Array<{
    name: string;
    color: string;
  }>;
  status: 'Active' | 'Inactive' | 'Pending';
  onActionPress?: () => void;
  onViewDetails?: () => void;
  onEditDetails?: () => void;
  onDeleteListing?: () => void;
  onCollectAll?: () => void;
  isCollected?: boolean;
  style?: any;
  navigation?: NavigationProp;
  userData?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    accountType: string;
    phoneNumber: string;
    profileImageUrl: string;
    createdAt: string;
  };
  donationData?: {
    id: string;
    title: string;
    description: string;
    location: string;
    distance: string;
    image?: any;
    images?: string[];
    coordinates?: [number, number];
    address?: string;
    createdAt?: string;
  };
}

const AdminDonationCard: React.FC<AdminDonationCardProps> = ({
  donorName,
  donationsListed,
  categories,
  status,
  onActionPress,
  onViewDetails,
  onEditDetails,
  onDeleteListing,
  onCollectAll,
  isCollected = false,
  style,
  navigation,
  userData,
  donationData,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const actionButtonRef = useRef<any>(null);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return colors.primary;
      case 'Inactive':
        return colors.gray.medium;
      case 'Pending':
        return colors.secondary;
      default:
        return colors.gray.medium;
    }
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'Active':
        return colors.lightGreen;
      case 'Inactive':
        return colors.gray.light;
      case 'Pending':
        return '#FFF3E0';
      default:
        return colors.gray.light;
    }
  };


  const handleActionPress = () => {
    // Measure button position
    if (actionButtonRef.current) {
      actionButtonRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        setButtonPosition({ x, y, width, height });
        setShowMenu(true);
      });
    } else {
      setShowMenu(true);
    }
    
    if (onActionPress) {
      onActionPress();
    }
  };

  const handleViewDetails = () => { 
    if (onViewDetails) {
      onViewDetails();
    } else if (navigation && userData) {
      const userDataForNavigation = {
        id: userData._id,
        userName: userData.name,
        email: userData.email,
        registrationDate: new Date(userData.createdAt).toLocaleDateString(),
        numberOfDonations: donationsListed,
        status: status === 'Active' ? 'Active' as const : 'Inactive' as const,
        profileImageUrl: userData.profileImageUrl,
        phoneNumber: userData.phoneNumber,
        accountType: userData.accountType,
      };
      navigation.navigate('UserDetails', { userData: userDataForNavigation });
    } else {
      console.log('Cannot navigate - missing navigation or userData');
      console.log('navigation available:', !!navigation);
      console.log('userData available:', !!userData);
    }
  };

  const handleEditDetails = () => {
    if (onEditDetails) {
      onEditDetails();
    } else if (navigation && userData) {
      const userDataForNavigation = {
        id: userData._id,
        userName: userData.name,
        email: userData.email,
        registrationDate: new Date(userData.createdAt).toLocaleDateString(),
        numberOfDonations: donationsListed,
        status: status === 'Active' ? 'Active' as const : 'Inactive' as const,
        profileImageUrl: userData.profileImageUrl,
        phoneNumber: userData.phoneNumber,
        accountType: userData.accountType,
      };
      navigation.navigate('EditUser', { userData: userDataForNavigation });
    } else {
      console.log('Cannot navigate - missing navigation or userData');
      console.log('navigation available:', !!navigation);
      console.log('userData available:', !!userData);
    }
  };

  const handleDeleteListing = () => { 
    if (onDeleteListing) {
      onDeleteListing();
    } else if (navigation && userData) {
      const userDataForNavigation = {
        id: userData._id,
        userName: userData.name,
        email: userData.email,
        registrationDate: new Date(userData.createdAt).toLocaleDateString(),
        numberOfDonations: donationsListed,
        status: status === 'Active' ? 'Active' as const : 'Inactive' as const,
        profileImageUrl: userData.profileImageUrl,
        phoneNumber: userData.phoneNumber,
        accountType: userData.accountType,
      };
      navigation.navigate('SelectListingsToDelete', { userData: userDataForNavigation });
    } else {
      console.log('Cannot navigate - missing navigation or userData');
      console.log('navigation available:', !!navigation);
      console.log('userData available:', !!userData);
    }
  };

  const handleCollectAll = () => {
    if (onCollectAll) {
      onCollectAll();
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, style]} 
      onPress={handleViewDetails}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Donor</Text>
          <Text style={styles.value}>{donorName}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Donations Listed</Text>
          <Text style={styles.value}>{donationsListed}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Categories</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                <Text style={styles.categoryText}>{category.name}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Status</Text>
          <View style={{flex: 1,alignItems: "flex-end"}}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBackgroundColor(status) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{status}</Text>
          </View>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Action</Text>
          <View style={{flex: 1,alignItems: "flex-end"}}>
            <TouchableOpacity 
              ref={actionButtonRef}
              style={styles.actionButton} 
              onPress={handleActionPress}
            >
              <MaterialIcons 
                name="more-vert" 
                size={wp(5)} 
                color={colors.gray.medium} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <DonationActionMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onViewDetails={handleViewDetails}
        onEditDetails={handleEditDetails}
        onDeleteListing={handleDeleteListing}
        onCollectAll={handleCollectAll}
        isCollected={isCollected}
        buttonPosition={buttonPosition || undefined}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(2),
    borderColor: colors.gray.borderGray,
    padding: wp(4),
    marginBottom: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  label: {
    fontSize: wp(3.1),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
    width: wp(26),
  },
  value: {
    fontSize: wp(3.2),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    flex: 1,
    textAlign:"right",
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    justifyContent:"flex-end",
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(3),
    marginBottom: hp(0.3),
  },
  categoryColor: {
    width: wp(3),
    height: wp(3),
    marginRight: wp(1.5),
  },
  categoryText: {
    fontSize: wp(3.1),
    color: colors.black,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: Platform.OS == "android" ? wp(0.3) : 0,
  },
  statusBadge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.3),
    borderRadius: wp(2),
  },
  statusText: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  actionButton: {
    width: wp(8),
    height: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray.light,
    borderRadius: wp(2),
  },
});

export default AdminDonationCard;

