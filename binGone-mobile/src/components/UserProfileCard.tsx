import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface UserProfileCardProps {
  userName: string;
  email: string;
  registrationDate: string;
  numberOfDonations: string;
  status: 'Active' | 'Inactive';
  onActionPress?: (event?: any) => void;
  onPress?: () => void;
  style?: any;
  accountType: string;
  points?: number;
  isPremium?: boolean;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  userName,
  email,
  registrationDate,
  numberOfDonations,
  status,
  onActionPress,
  onPress,
  style,
  accountType,
  points,
  isPremium,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return colors.primary;
      case 'Inactive':
        return colors.gray.medium;
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
      default:
        return colors.gray.light;
    }
  };

  const renderInfoRow = (label: string, value: string | React.ReactNode) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        {typeof value === 'string' ? (
          <Text style={styles.value}>{value}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {renderInfoRow('User Name', userName)}
      {renderInfoRow('Email', email)}
      {renderInfoRow('Account Type', accountType)}
      {renderInfoRow('Registration Date', registrationDate)}
      
      {points !== undefined && renderInfoRow('Points', points.toString())}
      
      {isPremium !== undefined && renderInfoRow('Tier', (
        <View style={[styles.statusBadge, { backgroundColor: isPremium ? colors.primary : colors.gray.light }]}>
          <Text style={[styles.statusText, { color: isPremium ? colors.white : colors.gray.medium }]}>
            {isPremium ? 'Premium' : 'Community Member'}
          </Text>
        </View>
      ))}
      
      {renderInfoRow('Status', (
        <View style={[styles.statusBadge, { backgroundColor: getStatusBackgroundColor(status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
            {status}
          </Text>
        </View>
      ))}
      
      {renderInfoRow('Action', (
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={(e) => {
            e.stopPropagation();
            onActionPress?.(e);
          }}
        >
          <MaterialIcons name="more-vert" size={wp(5)} color={colors.gray.medium} />
        </TouchableOpacity>
      ))}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: colors.gray.borderGray,
    padding: wp(4),
    marginBottom: hp(1.5),
    
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
    width: wp(32),
  },
  valueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: wp(3.2),
    color: colors.black,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: 'right',
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

export default UserProfileCard;
