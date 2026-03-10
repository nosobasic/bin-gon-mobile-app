import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { NavigationProp } from '../types/navigation';
import { useFocusEffect } from '@react-navigation/native';
import { AdminAppHeader, CallToActionCard, StatisticsCard, DonationsSection, DonationCategoriesChart, DonationsCollectedChart } from '../components';
import { useData } from '../contexts/DataContext';
import { Fonts } from '../constants/fonts';

interface AdminDashboardContentProps {
  navigation: NavigationProp;
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ navigation }) => {
  const { adminAnalytics, loadingAnalytics, fetchAdminAnalytics } = useData();

  useEffect(() => {
    fetchAdminAnalytics();
  }, [fetchAdminAnalytics]);

  useFocusEffect(
    useCallback(() => {
      fetchAdminAnalytics();
    }, [fetchAdminAnalytics])
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const renderStatisticsCards = () => {
    if (loadingAnalytics) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      );
    }

    if (!adminAnalytics) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load analytics data</Text>
        </View>
      );
    }

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatisticsCard
            iconSource={require('../assets/images/dashboard_1.png')}
            iconBackgroundColor={colors.lightGreen}
            lineColor="#00705C"
            number={formatNumber(adminAnalytics.totalDonationItems)}
            changePercent="12%"
            changeColor={colors.primary}
            label="Total Donation Items"
          />
          <StatisticsCard
            iconSource={require('../assets/images/dashboard_2.png')}
            iconBackgroundColor={colors.lightOrange}
            lineColor="#D80F0F"
            number={formatNumber(adminAnalytics.totalDonors)}
            changePercent="4%"
            changeColor={colors.primary}
            label="Total Donors"
          />
        </View>

        <View style={styles.statsRow}>
          <StatisticsCard
            iconSource={require('../assets/images/dashboard_3.png')}
            iconBackgroundColor={colors.lightBlue}
            lineColor="#1A73E8"
            number={formatNumber(adminAnalytics.totalReceivers)}
            changePercent="12%"
            changeColor={colors.primary}
            label="Total Receivers"
          />
          <StatisticsCard
            iconSource={require('../assets/images/dashboard_4.png')}
            iconBackgroundColor={colors.lightPurple}
            lineColor="#9747FF"
            number={formatNumber(adminAnalytics.totalActiveDonors)}
            changePercent="12%"
            changeColor={colors.primary}
            label="Total Active Donors"
          />
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <AdminAppHeader title="binGone" type="home" />

      {/* Banner Section */}
      <View style={styles.bannerContainer}>
        <CallToActionCard
          backgroundImage={require('../assets/images/home_bg.jpg')}
          title="Easily oversee and manage all donation activities in one place."
          buttonText="Get Started"
          showButton={false}
        />
      </View>

      {/* Statistics Cards */}
      {renderStatisticsCards()}

      {/* Donation Categories Chart */}
      <DonationCategoriesChart />

      {/* Donations Collected Chart */}
      <DonationsCollectedChart />

      {/* Donations Section */}
      <DonationsSection navigation={navigation} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  bannerContainer: {
    paddingHorizontal: wp(5),
    marginBottom: hp(3),
  },
  statsContainer: {
    paddingHorizontal: wp(5),
    marginBottom: wp(5), 
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
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

export default AdminDashboardContent;
