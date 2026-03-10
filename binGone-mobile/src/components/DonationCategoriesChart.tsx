import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { useData } from '../contexts/DataContext';
import { generateCategoryColor } from '../utils/categoryColors';

interface DonationCategoriesChartProps {
  style?: any;
}

// Use the centralized category color generation utility

const DonationCategoriesChart: React.FC<DonationCategoriesChartProps> = ({ style }) => {
  const { categoryAnalytics, loadingCategoryAnalytics, fetchCategoryAnalytics } = useData();

  useEffect(() => {
    fetchCategoryAnalytics();
  }, [fetchCategoryAnalytics]);

  // Transform API data to chart format
  const chartData = useMemo(() => {
    if (!categoryAnalytics || categoryAnalytics.length === 0) {
      // Fallback to empty data
      return {
        labels: [],
        datasets: [{ data: [], colors: [] }],
      };
    }

    // Sort by count descending for better visualization
    const sortedData = [...categoryAnalytics].sort((a, b) => b.count - a.count);

    return {
      labels: sortedData.map(cat => cat.categoryName),
      datasets: [
        {
          data: sortedData.map(cat => cat.count),
          colors: sortedData.map((cat, index) => (opacity = 1) => generateCategoryColor(cat.categoryName)),
        },
      ],
    };
  }, [categoryAnalytics]);

  const chartConfig = {
    backgroundColor: '#F6F6F6',
    backgroundGradientFrom: '#F6F6F6',
    backgroundGradientTo: '#F6F6F6',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: wp(4),
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: colors.gray.light,
      strokeWidth: 1,
    },
    barPercentage: 0.7,
    propsForLabels: {
        fontSize: wp(2.7),        // change font size
        fontFamily: Fonts.POPPINS_REGULAR, // custom font (make sure it's linked/loaded)
        fontWeight: "bold",   // weight
        fill: "#333333",      // text color (alternative to labelColor)
    },
  };

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - wp(3); // Account for padding

  // Render loading state
  if (loadingCategoryAnalytics) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.title}>Donation Categories Count</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading chart data...</Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (!categoryAnalytics || categoryAnalytics.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.title}>Donation Categories Count</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Donation Categories Count</Text>
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={chartWidth}
          height={hp(25)}
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          showValuesOnTopOfBars={true}
          fromZero={true}
          style={styles.chart}
          withInnerLines={true}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          segments={5}
          yAxisInterval={Math.max(1, Math.ceil(Math.max(...chartData.datasets[0].data) / 5))}
          yAxisLabel=""
          yAxisSuffix=""
          withCustomBarColorFromData={true}
        />
      </View>
      
      {/* Dynamic Legend */}
      <View style={styles.legendContainer}>
        {categoryAnalytics
          .sort((a, b) => b.count - a.count)
          .map((category, index) => (
            <View key={category.categoryId} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendColor, 
                  { backgroundColor: generateCategoryColor(category.categoryName) }
                ]} 
              />
              <Text style={styles.legendText}>{category.categoryName}</Text>
            </View>
          ))}
      </View>
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
  title: {
    fontSize: wp(4.5),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: hp(2),
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
  chart: {
    borderRadius: wp(4),
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp(2),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
    width: '48%',
  },
  legendColor: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(0.5),
    marginRight: wp(2),
  },
  legendText: {
    fontSize: wp(3),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
  },
  loadingContainer: {
    paddingVertical: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    marginTop: wp(4),
  },
  errorContainer: {
    paddingVertical: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.red,
    textAlign: 'center',
  },
});

export default DonationCategoriesChart;
