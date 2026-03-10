import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { NavigationProp, ProductCard } from '../types/navigation';

interface DonationActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  onEditDetails: () => void;
  onDeleteListing: () => void;
  onCollectAll: () => void;
  isCollected?: boolean;
  style?: any;
  buttonPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const DonationActionMenu: React.FC<DonationActionMenuProps> = ({
  visible,
  onClose,
  onViewDetails,
  onEditDetails,
  onDeleteListing,
  onCollectAll,
  isCollected = false,
  style,
  buttonPosition,
}) => {
  const handleDeletePress = () => {
    onClose();
    // Call the delete function directly - it will handle navigation to selection screen
    onDeleteListing();
  };

  const menuItems = [
    {
      id: 'view',
      icon: 'visibility',
      text: 'View Full Details',
      onPress: () => {
        onClose();
        onViewDetails();
      },
    },
    {
      id: 'edit',
      icon: 'edit',
      text: 'Edit Details',
      onPress: () => {
        onClose();
        onEditDetails();
      },
    },
    {
      id: 'delete',
      icon: 'delete',
      text: 'Delete Listing',
      onPress: handleDeletePress,
    },
    {
      id: 'collect',
      icon: isCollected ? 'check-box' : 'check-box-outline-blank',
      text: 'Collected All',
      onPress: () => {
        onClose();
        onCollectAll();
      },
    },
  ];

  // Calculate menu position based on button position
  const getMenuPosition = () => {
    if (!buttonPosition) {
      return {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: [{ translateX: -wp(30) }, { translateY: -hp(15) }],
      };
    }

    const { x, y, width, height } = buttonPosition;
    
    // Position menu to the LEFT of the button, aligned with the top of the button
    // This matches the first image where menu is to the left of three dots
    const menuWidth = wp(60);
    const left = x - menuWidth - wp(3); // Position to the left of the button with some spacing
    const top = y; // Align with the top of the button
    
    return {
      position: 'absolute' as const,
      left: Math.max(wp(2), left), // Ensure it doesn't go off the left edge
      top: Math.max(hp(2), top), // Ensure it doesn't go off the top edge
    };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.menuContainer, getMenuPosition(), style]}>
          {/* Arrow pointing to the three dots button (from left menu to right button) */}
          {buttonPosition && (
            <View style={[styles.arrow, {
              right: -wp(2), // Position arrow on the right side of the menu
              top: hp(2), // Position arrow near the top of the menu
            }]} />
          )}
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={item.onPress}
            >
              <MaterialIcons
                name={item.icon}
                size={wp(5)}
                color={colors.gray.medium}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: wp(3),
    paddingVertical: hp(1),
    minWidth: wp(60),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    marginRight: wp(4),
  },
  menuText: {
    fontSize: wp(4),
    color: colors.black,
    fontFamily: Fonts.POPPINS_REGULAR,
    flex: 1,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderTopWidth: wp(2),
    borderBottomWidth: wp(2),
    borderLeftWidth: wp(2),
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.white,
    zIndex: 1,
  },
});

export default DonationActionMenu;
