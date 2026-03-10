import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../contexts/DataContext';

interface DonationsCollectedChartProps {
  style?: any;
}

const DonationsCollectedChart: React.FC<DonationsCollectedChartProps> = ({ style }) => {
  const { 
    monthlyClaimedAnalytics, 
    loadingMonthlyClaimedAnalytics, 
    fetchMonthlyClaimedAnalytics 
  } = useData();

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showYearModal, setShowYearModal] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchMonthlyClaimedAnalytics(selectedYear);
  }, [fetchMonthlyClaimedAnalytics, selectedYear]);

  // Prepare chart data
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: monthlyClaimedAnalytics?.monthlyClaimedListings || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => '#00705C', // Dark green color matching the image
        strokeWidth: 1,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#F6F6F6',
    backgroundGradientFrom: '#F6F6F6',
    backgroundGradientTo: '#F6F6F6',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 112, 92, ${opacity})`, // Dark green
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: wp(4),
    },
    propsForDots: {
      r: '4',
      strokeWidth: '1',
      stroke: '#00705C',
      fill: '#00705C',
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: colors.gray.light,
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: wp(2.7),
      fontFamily: Fonts.POPPINS_REGULAR,
      fontWeight: "normal",
      fill: "#333333",
    },
    fillShadowGradient: '#00705C',
    fillShadowGradientOpacity: 0.1,
    paddingLeft: 0, // Remove left padding
    paddingRight: 0, // Remove right padding
  };

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - wp(6); // Reduce padding to use more space

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setShowYearModal(false);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Donations Collected</Text>
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => setShowYearModal(true)}
        >
          <Icon name="calendar-today" size={wp(5)} color={colors.gray.medium} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.chartContainer}>
        {loadingMonthlyClaimedAnalytics ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00705C" />
            <Text style={styles.loadingText}>Loading chart data...</Text>
          </View>
        ) : (
          <LineChart
            data={data}
            width={chartWidth}
            height={hp(25)}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={true}
            withShadow={true}
            withScrollableDot={false}
            withInnerLines={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            segments={5}
            yAxisInterval={500}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero={true}
          />
        )}
      </View>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#00705C' }]} />
          <Text style={styles.legendText}>Donations Collected</Text>
        </View>
      </View>

      <Modal
        visible={showYearModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <TouchableOpacity
                onPress={() => setShowYearModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={wp(5)} color={colors.gray.medium} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.yearList} showsVerticalScrollIndicator={false}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearItem,
                    selectedYear === year && styles.selectedYearItem
                  ]}
                  onPress={() => handleYearSelect(year)}
                >
                  <Text style={[
                    styles.yearText,
                    selectedYear === year && styles.selectedYearText
                  ]}>
                    {year}
                  </Text>
                  {selectedYear === year && (
                    <Icon name="check" size={wp(4)} color="#00705C" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F6F6',
    borderRadius: wp(4),
    padding: wp(4),
    marginHorizontal: wp(5),
    marginBottom: hp(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  title: {
    fontSize: wp(4.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
  },
  calendarButton: {
    padding: wp(2),
    borderRadius: wp(2),
    backgroundColor: colors.gray.light,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: hp(2),
    marginLeft: -wp(2), // Reduce left margin to minimize empty space
  },
  chart: {
    borderRadius: wp(4),
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: wp(2),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    marginRight: wp(2),
  },
  legendText: {
    fontSize: wp(3),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
  },
  loadingContainer: {
    height: hp(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: wp(3.5),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    marginTop: hp(1),
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    width: wp(70),
    maxHeight: hp(50),
    padding: wp(4),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  modalTitle: {
    fontSize: wp(4.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
  },
  closeButton: {
    padding: wp(1),
  },
  yearList: {
    maxHeight: hp(30),
  },
  yearItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(2),
    marginBottom: hp(0.5),
  },
  selectedYearItem: {
    backgroundColor: '#E8F5F3',
  },
  yearText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.black,
  },
  selectedYearText: {
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: '#00705C',
  },
});

export default DonationsCollectedChart;
