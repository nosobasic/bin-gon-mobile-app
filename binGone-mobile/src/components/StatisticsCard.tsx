import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';

interface StatisticsCardProps {
  iconSource: any;
  iconBackgroundColor: string;
  lineColor: string;
  number: string;
  changePercent: string;
  changeColor: string;
  label: string;
  style?: any;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  iconSource,
  iconBackgroundColor,
  lineColor,
  number,
  changePercent,
  changeColor,
  label,
  style,
}) => {
  return (
    <View style={[styles.statCard, style]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: iconBackgroundColor }]}>
          <Image source={iconSource} style={styles.statIconImage} />
        </View>
        <Image 
          source={require('../assets/images/line.png')} 
          resizeMode="contain" 
          style={styles.lineImage} 
          tintColor={lineColor} 
        />
      </View>
      <View style={styles.statContent}>
        <View style={styles.statNumberContainer}>
          <Text style={styles.statNumber}>{number}</Text>
          <View style={styles.statChange}>
            <MaterialIcons 
              name={parseFloat(changePercent) >= 0 ? 'arrow-upward' : 'arrow-downward'} 
              size={wp(4)} 
              color={changeColor} 
              style={styles.arrowIcon}
            />
            {/* <Text style={[styles.changePercent, { color: changeColor }]}>{changePercent}</Text> */}
          </View>
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    borderRadius: wp(4),
    padding: wp(4),
    marginHorizontal: wp(1),
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  statIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconImage: {
    width: wp(11),
    height: wp(11),
  },
  lineImage: {
    width: wp(10),
    height: wp(10),
  },
  statContent: {
    flex: 1,
  },
  statNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  statNumber: {
    fontSize: wp(6),
    fontWeight: 'bold',
    color: colors.black,
    marginRight: wp(2),
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowIcon: {
    // marginRight: wp(1),
  },
  changePercent: {
    fontSize: wp(3.5),
    fontWeight: '600',
  },
  statLabel: {
    fontSize: wp(3),
    color: colors.gray.medium,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
});

export default StatisticsCard;
