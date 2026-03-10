import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type UserRole = 'donor' | 'receiver' | 'admin';

export type RootStackParamList = {
  Splash: undefined;
  Login: { role?: UserRole } | undefined;
  ForgotPassword: undefined;
  OtpVerification: { email: string; isEmailVerification?: boolean; password?: string } | undefined;
  NewPassword: { email: string } | undefined;
  SignUp: { role?: UserRole } | undefined;
  AreaSelection: undefined;
  Dashboard: { initialTab?: string; selectedCategoryId?: string } | undefined;
  AdminDashboard: undefined;
  CreateDonation: undefined;
  EditDonation: { donation: any };
  Donation: undefined;
  UserManagement: undefined;
  UserDetails: { userData: UserData };
  EditUser: { userData: UserData };
  SelectListingsToDelete: { userData: UserData };
  ProductDetail: { product: ProductCard };
  DonationDetail: { donation: ProductCard };
  EditProfile: undefined;
  RewardTiers: undefined;
  Upgrade: undefined;
  UpgradePoints: undefined;
  Payment: undefined;
  Chat: undefined;
  ChatDetail: { userName: string; threadId?: string; otherUserName?: string; listingTitle?: string; userAvatar?: string };
  Map: undefined;
  LocationSelection: { onLocationSelect: (location: { name: string; coordinates: [number, number] }) => void };
  Wishlist: undefined;
  CreateWishlistItem: { editItem?: WishlistItem } | undefined;
  AdminWishlist: undefined;
  EditWishlistItem: { item: WishlistItem };
};

export interface UserData {
  id: string;
  userName: string;
  email: string;
  registrationDate: string;
  numberOfDonations: string;
  status: 'Active' | 'Inactive';
  profileImageUrl?: string;
  phoneNumber?: string;
  address?: string;
  lastActiveDate?: string;
  accountType: string;
  points?: number;
  isPremium?: boolean;
}

export interface ProductCard {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  distance: string;
  image: any; // Keep for backward compatibility
  images?: string[]; // Array of image URLs
  isFavorite: boolean;
  coordinates?: [number, number]; // [longitude, latitude] from listing.location.coordinates
  address?: string; // from listing.address
  donorName?: string;
  createdAt?: string;
}

export interface WishlistItem {
  id: string;
  itemName: string;
  name: string;
  type?: string;
  size?: string;
  priority: 'Low' | 'Medium' | 'High';
  location?: string;
  coordinates?: [number, number];
  notes?: string;
  userId: string | { _id: string; name: string; email: string; accountType: string };
  userName?: string; // Add user name for display purposes
  createdAt: string;
  updatedAt: string;
}

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>; 