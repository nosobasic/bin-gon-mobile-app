/**
 * BinGone App
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { getStripePublishableKey } from './src/config/stripe';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { DataProvider } from './src/contexts/DataContext';
import { ChatProvider } from './src/contexts/ChatContext';
import LoadingScreen from './src/screens/LoadingScreen';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';
import NewPasswordScreen from './src/screens/NewPasswordScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import AreaSelectionScreen from './src/screens/AreaSelectionScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminWishlistScreen from './src/screens/AdminWishlistScreen';
import CreateDonationScreen from './src/screens/CreateDonationScreen';
import EditDonationScreen from './src/screens/EditDonationScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import DonationDetailScreen from './src/screens/DonationDetailScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import RewardTiersScreen from './src/screens/RewardTiersScreen';
import UpgradeScreen from './src/screens/UpgradeScreen';
import UpgradePointsScreen from './src/screens/UpgradePointsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ChatScreen from './src/screens/ChatScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import MapScreen from './src/screens/MapScreen';
import LocationSelectionScreen from './src/screens/LocationSelectionScreen';
import { RootStackParamList } from './src/types/navigation';
import UserDetailsScreen from './src/screens/UserDetailsScreen';
import EditUserScreen from './src/screens/EditUserScreen';
import SelectListingsToDeleteScreen from './src/screens/SelectListingsToDeleteScreen';
import DonationScreen from './src/screens/DonationScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import CreateWishlistItemScreen from './src/screens/CreateWishlistItemScreen';
import EditWishlistItemScreen from './src/screens/EditWishlistItemScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';

  if (isLoading) {
    return <LoadingScreen />;
  }

  console.log("user0000", user)

  return (
    <NavigationContainer>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Stack.Navigator
        initialRouteName={isAuthenticated ? (user?.roleId === 3 ? "AdminDashboard" : "Dashboard") : "Splash"}
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth screens
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
            <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />

          </>
        ) : (
          // App screens - show different screens based on user role
          user?.roleId === 3 ? (
            // Admin screens
            <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="AdminWishlist" component={AdminWishlistScreen} />
            <Stack.Screen name="EditWishlistItem" component={EditWishlistItemScreen} />
            <Stack.Screen name="Donation" component={DonationScreen} />
            <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
            <Stack.Screen name="EditUser" component={EditUserScreen} />
            <Stack.Screen name="SelectListingsToDelete" component={SelectListingsToDeleteScreen} />
            <Stack.Screen name="DonationDetail" component={DonationDetailScreen} />
            <Stack.Screen name="EditDonation" component={EditDonationScreen} />
            <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
            <Stack.Screen name="RewardTiers" component={RewardTiersScreen} />
            <Stack.Screen name="Upgrade" component={UpgradeScreen} />
            <Stack.Screen name="UpgradePoints" component={UpgradePointsScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />

            </>
          ) : (
            // Regular user screens (donor/receiver)
            <>

              <Stack.Screen name="AreaSelection" component={AreaSelectionScreen} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Donation" component={DonationScreen} />
              <Stack.Screen name="CreateDonation" component={CreateDonationScreen} />
              <Stack.Screen name="EditDonation" component={EditDonationScreen} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="RewardTiers" component={RewardTiersScreen} />
              <Stack.Screen name="Upgrade" component={UpgradeScreen} />
              <Stack.Screen name="UpgradePoints" component={UpgradePointsScreen} />
              <Stack.Screen name="Payment" component={PaymentScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
              <Stack.Screen name="Map" component={MapScreen} />
              <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
              <Stack.Screen name="Wishlist" component={WishlistScreen} />
              <Stack.Screen name="CreateWishlistItem" component={CreateWishlistItemScreen} />
            </>
          )
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <StripeProvider publishableKey={getStripePublishableKey()}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataProvider>
            <ChatProvider>
              <AppNavigator />
            </ChatProvider>
          </DataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StripeProvider>
  );
}

export default App;
