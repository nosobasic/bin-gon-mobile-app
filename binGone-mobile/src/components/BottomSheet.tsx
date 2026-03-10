import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';

interface BottomSheetProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ activeTab, onTabPress }) => {
  const [isCenterExpanded, setIsCenterExpanded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));

  const tabs = [
    { 
      name: 'Home', 
      icon: require('../assets/images/home.png'),
      activeIcon: require('../assets/images/home_active.png')
    },
    { 
      name: 'Categories', 
      icon: require('../assets/images/category.png'),
      activeIcon: require('../assets/images/category_active.png')
    },
    { 
      name: 'Close', 
      icon: require('../assets/images/back.png'),
      activeIcon: require('../assets/images/back.png'),
      isCenter: true
    },
    { 
      name: 'Featured', 
      icon: require('../assets/images/featured.png'),
      activeIcon: require('../assets/images/featured_active.png')
    },
    { 
      name: 'Community', 
      icon: require('../assets/images/community.png'),
      activeIcon: require('../assets/images/community_active.png')
    },
  ];

  const centerButtons = [
    {
      name: 'Profile',
      icon: require('../assets/images/profile.png'),
      position: 'left'
    },
    {
      name: 'Chat',
      icon: require('../assets/images/chat.png'),
      position: 'right'
    }
  ];

  const handleCenterPress = () => {
    if (isCenterExpanded) {
      // Close the expanded view
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsCenterExpanded(false);
      });
    } else {
      // Open the expanded view
      setIsCenterExpanded(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const handleCenterButtonPress = (buttonName: string) => {
    onTabPress(buttonName);
    // Close the expanded view after selection
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsCenterExpanded(false);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.bottomSheet}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tab,
              tab.isCenter && styles.centerTab
            ]}
            onPress={() => tab.isCenter ? handleCenterPress() : onTabPress(tab.name)}
          >
            {tab.isCenter ? (
              <View style={styles.centerButton}>
                <Text style={styles.centerIcon}>✕</Text>
              </View>
            ) : (
              <View style={styles.iconContainer}>
                <Image
                  source={activeTab === tab.name ? tab.activeIcon : tab.icon}
                  style={[
                    styles.icon,
                    activeTab === tab.name && styles.activeIcon
                  ]}
                  resizeMode="contain"
                />
                {activeTab === tab.name && (
                  <Image
                    source={require('../assets/images/activeIndicator.png')}
                    style={styles.activeIndicator}
                    resizeMode="contain"
                  />
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Expanded center buttons */}
      {isCenterExpanded && (
        <Animated.View 
          style={[
            styles.expandedContainer,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.expandedButtonsRow}>
            {centerButtons.map((button, index) => (
              <TouchableOpacity
                key={button.name}
                style={[
                  styles.expandedButton,
                  button.position === 'left' ? styles.leftButton : styles.rightButton
                ]}
                onPress={() => handleCenterButtonPress(button.name)}
              >
                <View style={styles.expandedButtonInner}>
                  <Image
                    source={button.icon}
                    style={styles.expandedIcon}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  bottomSheet: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    paddingTop: wp(2),
    paddingHorizontal: wp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    alignItems: 'flex-end',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // paddingVertical: wp(2),
    // borderWidth:1
  },
  centerTab: {
    flex: 0,
    paddingBottom: wp(2),
    // marginTop: -wp(1),
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // paddingVertical: wp(3),
    paddingBottom: wp(6),

  },
  icon: {
    width: wp(6),
    height: wp(6),
    tintColor: colors.gray.medium,
  },
  activeIcon: {
    tintColor: colors.primary,
  },
  centerButton: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerIcon: {
    fontSize: wp(6),
    color: colors.white,
    fontWeight: 'bold',
  },
  expandedContainer: {
    position: 'absolute',
    bottom: wp(18.2),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  expandedButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
  },
  expandedButton: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  leftButton: {
    marginRight: wp(2),
  },
  rightButton: {
    marginLeft: wp(2),
  },
  expandedButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: colors.white,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: wp(8),
    height: wp(2),
    alignSelf: 'center',
  },
});

export default BottomSheet; 