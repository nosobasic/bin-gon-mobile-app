import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface UserActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  position: { x: number; y: number };
}

const UserActionMenu: React.FC<UserActionMenuProps> = ({
  visible,
  onClose,
  onEdit,
  onDelete,
  position,
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.menu, { top: position.y, right: wp(5) }]}>
              <TouchableOpacity style={styles.menuItem} onPress={onEdit}>
                <MaterialIcons name="edit" size={wp(4.5)} color={colors.primary} />
                <Text style={styles.menuText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={onDelete}>
                <MaterialIcons name="delete" size={wp(4.5)} color={colors.red} />
                <Text style={[styles.menuText, { color: colors.red }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: wp(2),
    paddingVertical: wp(2),
    minWidth: wp(35),
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
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
  },
  menuText: {
    fontSize: wp(3.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.black,
    marginLeft: wp(3),
  },
});

export default UserActionMenu;
