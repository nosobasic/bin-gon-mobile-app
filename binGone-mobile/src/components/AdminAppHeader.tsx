import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface AdminAppHeaderProps {
  title?: string;
  type?: 'home' | 'other';
  onBackPress?: () => void;
  style?: any;
  showGpsButton?: boolean;
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
  showNotificationButton?: boolean;
}

const AdminAppHeader: React.FC<AdminAppHeaderProps> = ({
  title = 'binGone Admin',
  type = 'home',
  onBackPress,
  style,
  showGpsButton = true,
  onLocationPress,
  onNotificationPress,
  showNotificationButton = true,
}) => {
  const renderHomeHeader = () => (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.locationButton} onPress={onLocationPress}>
            <Image 
              source={require('../assets/images/admin_profile.png')} 
              style={styles.locationIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <Image 
          source={require('../assets/images/star.png')} 
          style={styles.starBurst}
          resizeMode="contain"
        />
        
        <View style={styles.centerSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>{title}</Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.decorativeElement}>
          {showNotificationButton && (
              <TouchableOpacity style={styles.targetButton}>
                <Image 
                  source={require('../assets/images/notification.png')} 
                  style={styles.targetIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const renderOtherHeader = () => (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Image 
              source={require('../assets/images/back.png')} 
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.centerSection}>
          <Text style={styles.screenTitle}>{title}</Text>
        </View>

        <Image 
          source={require('../assets/images/star.png')} 
          style={styles.starBurst}
          resizeMode="contain"
        />

      </View>
    </View>
  );

  return type === 'home' ? renderHomeHeader() : renderOtherHeader();
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingTop: hp(2.5),
    paddingBottom: wp(4),
    overflow: 'visible',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    overflow: 'visible',
  },
  leftSection: {
    flex: 0,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    flex: 0,
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  locationButton: {
    width: wp(9.7),
    height: wp(9.7),
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIcon: {
    width: wp(9.7),
    height: wp(9.7),
  },
  backButton: {
    width: wp(9.7),
    height: wp(9.7),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: wp(9.7),
    height: wp(9.7),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: wp(8.5),
    height: wp(8.5),
    marginRight: wp(3),
  },
  brandName: {
    fontSize: wp(6.5),
    color: colors.primary,
    fontFamily: Fonts.MONTSERRAT_BOLD,
  },
  screenTitle: {
    fontSize: wp(6),
    color: colors.black,
    fontFamily: Fonts.MONTSERRAT_BOLD,
    textAlign: 'center',
  },
  decorativeElement: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    flexDirection: 'row',
    gap: wp(2),
  },
  starBurst: {
    width: wp(25),
    height: wp(25),
    position: 'absolute',
    top: -wp(5),
    right: 0,
  },
  notificationButton: {
    width: wp(9.7),
    height: wp(9.7),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(4.85),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationIcon: {
    fontSize: wp(5),
    color: colors.primary,
  },
  targetButton: {
    width: wp(9.7),
    height: wp(9.7),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: wp(2),
  },
  targetIcon: {
    width: wp(9.7),
    height: wp(9.7),
  },
});

export default AdminAppHeader;
