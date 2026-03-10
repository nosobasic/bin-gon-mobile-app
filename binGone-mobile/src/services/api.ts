import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this to your backend URL
// For Android emulator, use 10.0.2.2 instead of localhost
// For physical device, use your computer's IP address
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (__DEV__) {
    // Development environment
    if (Platform.OS === 'android') {
      // Android emulator needs 10.0.2.2 to access localhost
      // For physical device, use your computer's IP address
      // Try 10.0.2.2 for Android emulator, or 192.168.100.227 for physical device
      return 'http://10.0.2.2:4000';
    } else {
      // iOS simulator can use localhost
      return 'http://localhost:4000';
    }
  }
  // Production environment - update this to your production URL
  return 'https://your-production-backend.com';
};

export const BASE_URL = getBaseUrl();

// Debug logging
console.log('🔧 API Base URL:', BASE_URL);
console.log('🔧 Platform:', Platform.OS);
console.log('🔧 Development mode:', __DEV__);


// API Response types
export interface ApiResponse<T> {
  data: T;
  status: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  accountType: 'donor' | 'receiver' | 'admin';
  phoneNumber?: string;
  profileImageUrl?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  roleId: number; // 1=donor, 2=receiver, 3=admin
  accountType: 'donor' | 'receiver' | 'admin';
  phoneNumber?: string;
  profileImageUrl?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  emailVerified: boolean;
  // Phase 2 - Reward System fields
  points?: number;
  tier?: string;
  referralCode?: string;
  badges?: string[];
  isPremium?: boolean;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export type SignUpResponse = LoginResponse;

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

// Listing types
export interface Listing {
  id: string;
  title: string;
  description: string;
  images: string[];
  categoryId: string;
  category?: Category;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  status: 'available' | 'claimed' | 'removed';
  donorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  images: string[];
  categoryId: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  images?: string[];
  categoryId?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  address?: string;
  status?: string;
}

// Story types
export interface Story {
  id: string;
  title: string;
  body: string;
  images: string[];
  published: boolean;
  author: UserProfile;
  createdAt: string;
  updatedAt: string;
}

// Admin Analytics types
export interface AdminAnalyticsOverview {
  totalDonationItems: number;
  totalDonors: number;
  totalReceivers: number;
  totalActiveDonors: number;
}

// Admin User types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  
  accountType: 'donor' | 'receiver' | 'admin';
  phoneNumber?: string;
  profileImageUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
  isActive: boolean;
  donationCount?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  address?: string;
  points?: number;
  isPremium?: boolean;
}

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  count: number;
}

export interface CategoryAnalyticsResponse {
  categoryStats: CategoryAnalytics[];
}

export interface MonthlyClaimedAnalytics {
  year: number;
  monthlyClaimedListings: number[];
}

// Payment and Reward System Types
export interface RewardTier {
  _id: string;
  name: string;
  displayName: string;
  pointThreshold: number;
  monthlyPrice: number;
  pointUpgradeCost?: number;
  benefits: Array<{
    title: string;
    description: string;
    type: string;
  }>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Payment {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  stripeChargeId?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  upgradeType: string;
  targetTier: string;
  pointsUsed: number;
  description: string;
  metadata: Record<string, any>;
  paidAt?: string;
  failedAt?: string;
  refundedAt?: string;
  createdAt: string;
}

export interface CreatePaymentIntentRequest {
  targetTier: string;
  paymentMethodType: 'card' | 'bank';
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentId: string;
  amount: number;
  currency: string;
}

export interface ConfirmPaymentRequest {
  paymentId: string;
  paymentIntentId: string;
  paymentMethodId?: string; // Tokenized payment method ID from Stripe
}

export interface ConfirmPaymentResponse {
  message: string;
  user: {
    tier: string;
    isPremium: boolean;
    badges: string[];
    subscriptionEndDate?: string;
  };
  payment: {
    id: string;
    amount: number;
    status: string;
  };
}

export interface RewardStatusResponse {
  user: {
    id: string;
    name: string;
    email: string;
    points: number;
    tier: string;
    referralCode: string;
    badges: string[];
    isPremium: boolean;
  };
  currentTier: RewardTier;
  progressToNext: {
    targetTier: string;
    targetPoints: number;
    currentPoints: number;
    progress: number;
  };
  availableTiers: RewardTier[];
}

export interface ReferralInfo {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pointsEarned: number;
}

// Chat types
export interface ChatThread {
  id: string;
  listing: {
    title: string;
    images: string[];
    status: string;
  };
  donor: {
    name: string;
    profileImageUrl?: string;
  };
  receiver: {
    name: string;
    profileImageUrl?: string;
  };
  lastMessageAt: string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    sender: {
      name: string;
    };
    createdAt: string;
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  messageType: 'text' | 'image';
  sender: {
    name: string;
    profileImageUrl?: string;
  };
  status: 'sent' | 'delivered' | 'read';
  readAt?: string;
  createdAt: string;
}

// Wishlist types
export interface WishlistItemApi {
  _id: string;
  userId: string | { _id: string; name: string; email: string; accountType: string };
  name: string;
  type?: string;
  size?: string;
  location?: string;
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
}

export interface WishlistResponse {
  items: WishlistItemApi[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Client
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          if (error.config?.url?.includes('/api/auth/login') || 
              error.config?.url?.includes('/api/auth/signup') || 
              error.config?.url?.includes('/api/auth/refresh') ||
              error.config?.url?.includes('/api/auth/verify-token')) {
            console.log('🔍 API - Clearing auth data due to authentication failure');
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userProfile');
          } else {
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.client.post('/api/auth/login', payload);
    return response.data;
  }

  async signUp(payload: SignUpRequest): Promise<SignUpResponse> {
    const response: AxiosResponse<SignUpResponse> = await this.client.post('/api/auth/register', payload);
    return response.data;
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response: AxiosResponse<{ user: UserProfile }> = await this.client.get('/api/auth/me');
    return response.data.user; // Backend returns { user: userData }
  }

  async updateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
    const response: AxiosResponse<{ user: UserProfile }> = await this.client.put('/api/auth/me', payload);
    return response.data.user; // Backend returns { user: userData }
  }
  

  async forgotPassword(email: string): Promise<{ status: string; emailSent: boolean }> {
    const response: AxiosResponse<{ status: string; emailSent: boolean }> = await this.client.post('/api/auth/forgot-password', { email });
    return response.data;
  }

  async verifyOtp(email: string, optcode: string): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await this.client.post('/api/auth/verify-otp', { email, optcode });
    return response.data;
  }

  async resetPassword(email: string, newPassword: string, conformPasswrod: string): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await this.client.post('/api/auth/reset-password', { email, newPassword, conformPasswrod });
    return response.data;
  }

  async verifyEmail(email: string, optcode: string): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await this.client.post('/api/auth/verify-email', { email, optcode });
    return response.data;
  }

  // Categories endpoints
  async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<Category[]> = await this.client.get('/api/categories');
    return response.data;
  }

  async createCategory(categoryData: {
    name: string;
    slug: string;
    icon: string;
  }): Promise<Category> {
    const response: AxiosResponse<Category> = await this.client.post('/api/categories', categoryData);
    return response.data;
  }

  async updateCategory(id: string, categoryData: {
    name: string;
    slug: string;
    icon: string;
  }): Promise<Category> {
    const response: AxiosResponse<Category> = await this.client.put(`/api/categories/${id}`, categoryData);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.client.delete(`/api/categories/${id}`);
  }

  // Listings endpoints
  async getListings(params?: {
    q?: string;
    categoryId?: string;
    status?: string | string[];
    lng?: number;
    lat?: number;
    radius?: number;
    isPremium?: boolean;
  }): Promise<Listing[]> {
    const response: AxiosResponse<Listing[]> = await this.client.get('/api/listings', { params });
    return response.data;
  }

  async getListingsGrouped(params?: {
    q?: string;
    categoryId?: string;
    status?: string;
    lng?: number;
    lat?: number;
    radius?: number;
    groupBy?: string;
    isPremium?: boolean;
  }): Promise<Array<{
    user: {
      location: {
        type: 'Point';
        coordinates: [number, number];
      };
      _id: string;
      name: string;
      email: string;
      role: string;
      accountType: string;
      phoneNumber: string;
      profileImageUrl: string;
      resetOtp: string | null;
      resetOtpExpiresAt: string | null;
      resetOtpVerified: boolean;
      emailVerified: boolean;
      emailVerificationOtp: string | null;
      emailVerificationOtpExpiresAt: string | null;
      createdAt: string;
    };
    listings: Listing[];
    count: number;
  }>> {
    const response: AxiosResponse<Array<{
      user: {
        location: {
          type: 'Point';
          coordinates: [number, number];
        };
        _id: string;
        name: string;
        email: string;
        role: string;
        accountType: string;
        phoneNumber: string;
        profileImageUrl: string;
        resetOtp: string | null;
        resetOtpExpiresAt: string | null;
        resetOtpVerified: boolean;
        emailVerified: boolean;
        emailVerificationOtp: string | null;
        emailVerificationOtpExpiresAt: string | null;
        createdAt: string;
      };
      listings: Listing[];
      count: number;
    }>> = await this.client.get('/api/listings', { params });
    return response.data;
  }

  async getListing(id: string): Promise<Listing> {
    const response: AxiosResponse<Listing> = await this.client.get(`/api/listings/${id}`);
    return response.data;
  }

  async createListing(payload: CreateListingRequest): Promise<Listing> {
    const response: AxiosResponse<Listing> = await this.client.post('/api/listings', payload);
    return response.data;
  }

  async updateListing(id: string, payload: UpdateListingRequest): Promise<Listing> {
    const response: AxiosResponse<Listing> = await this.client.put(`/api/listings/${id}`, payload);
    return response.data;
  }

  async deleteListing(id: string): Promise<void> {
    try {
      const response = await this.client.delete(`/api/listings/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ API Client: Standard delete failed:', error);
      
      try {
        const response = await this.client.delete(`/api/listings/${id}/delete`);
        return response.data;
      } catch (altError: any) {
        console.error('❌ API Client: Alternative delete also failed:', altError);
        // Try one more alternative
        try {
          const response = await this.client.post(`/api/listings/${id}/delete`);
          console.log('🔧 API Client: POST delete response:', response);
          return response.data;
        } catch (postError: any) {
          console.error('❌ API Client: POST delete also failed:', postError);
          // Re-throw the original error
          throw error;
        }
      }
    }
  }

  async getUserListings(ownerId: string, status: string = 'active'): Promise<Listing[]> {
    const response: AxiosResponse<Listing[]> = await this.client.get('/api/listings', { 
      params: { ownerId } 
    });
    return response.data;
  }

  // Stories endpoints
  async getStories(published?: boolean): Promise<Story[]> {
    const response: AxiosResponse<Story[]> = await this.client.get('/api/stories', { params: { published } });
    return response.data;
  }

  async createStory(payload: { title: string; body: string; images: string[] }): Promise<Story> {
    const response: AxiosResponse<Story> = await this.client.post('/api/stories', payload);
    return response.data;
  }

  async updateStory(id: string, payload: Partial<Story>): Promise<Story> {
    const response: AxiosResponse<Story> = await this.client.put(`/api/stories/${id}`, payload);
    return response.data;
  }

  async publishStory(id: string): Promise<Story> {
    const response: AxiosResponse<Story> = await this.client.put(`/api/stories/${id}/publish`);
    return response.data;
  }

  async deleteStory(id: string): Promise<void> {
    await this.client.delete(`/api/stories/${id}`);
  }

  // Chat endpoints
  async getChatThreads(): Promise<ChatThread[]> {
    const response: AxiosResponse<ChatThread[]> = await this.client.get('/api/chats/threads');
    return response.data;
  }

  async createChatThread(listingId: string): Promise<ChatThread> {
    const response: AxiosResponse<ChatThread> = await this.client.post('/api/chats/threads', { listingId });
    return response.data;
  }

  async getChatMessages(threadId: string, page = 1, limit = 50): Promise<{
    messages: ChatMessage[];
    pagination: { page: number; limit: number; hasMore: boolean };
  }> {
    const response: AxiosResponse<{
      messages: ChatMessage[];
      pagination: { page: number; limit: number; hasMore: boolean };
    }> = await this.client.get(`/api/chats/threads/${threadId}/messages`, { params: { page, limit } });
    return response.data;
  }

  async sendMessage(threadId: string, payload: {
    content: string;
    messageType: 'text' | 'image';
    attachmentUrl?: string;
  }): Promise<ChatMessage> {
    const response: AxiosResponse<ChatMessage> = await this.client.post(`/api/chats/threads/${threadId}/messages`, payload);
    return response.data;
  }

  // Wishlist endpoints
  async getWishlist(page = 1, limit = 10): Promise<WishlistResponse> {
    const response: AxiosResponse<WishlistResponse> = await this.client.get('/api/wishlist', { 
      params: { page, limit } 
    });
    return response.data;
  }

  async addToWishlist(payload: {
    name: string;
    type?: string;
    size?: string;
    location?: string;
    notes?: string;
    priority?: 'high' | 'medium' | 'low';
  }): Promise<WishlistItemApi> {
    const response: AxiosResponse<WishlistItemApi> = await this.client.post('/api/wishlist', payload);
    return response.data;
  }

  async updateWishlistItem(itemId: string, payload: {
    name?: string;
    type?: string;
    size?: string;
    location?: string;
    notes?: string;
    priority?: 'high' | 'medium' | 'low';
  }): Promise<WishlistItemApi> {
    const response: AxiosResponse<WishlistItemApi> = await this.client.put(`/api/wishlist/${itemId}`, payload);
    return response.data;
  }

  async removeFromWishlist(itemId: string): Promise<void> {
    await this.client.delete(`/api/wishlist/${itemId}`);
  }

  // Upload endpoints
  async uploadProfileImage(file: any): Promise<{ url: string; user: UserProfile }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response: AxiosResponse<{ url: string; user: UserProfile }> = await this.client.post('/api/uploads/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ API Client - Upload failed:', error);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
      } else if (error.request) {
        console.error('❌ Request failed - no response received');
        console.error('❌ Request details:', error.request);
      } else {
        console.error('❌ Error setting up request:', error.message);
      }
      throw error;
    }
  }

  // Fallbacks endpoints
  async getFallbacks(): Promise<any> {
    const response: AxiosResponse<any> = await this.client.get('/api/fallbacks');
    return response.data;
  }

  async getAdminAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
    const response: AxiosResponse<AdminAnalyticsOverview> = await this.client.get('/api/admin/analytics/overview');
    return response.data;
  }

  async getCategoryAnalytics(): Promise<CategoryAnalyticsResponse> {
    const response: AxiosResponse<CategoryAnalyticsResponse> = await this.client.get('/api/admin/analytics/categories');
    return response.data;
  }

  async getMonthlyClaimedAnalytics(year: number = new Date().getFullYear()): Promise<MonthlyClaimedAnalytics> {
    const response: AxiosResponse<MonthlyClaimedAnalytics> = await this.client.get(`/api/admin/analytics/monthly-claimed?year=${year}`);
    return response.data;
  }

  async getAdminUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    accountType?: string;
  }): Promise<{
    users: AdminUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response: AxiosResponse<any> = await this.client.get('/api/admin/users', { params });
    const data = response.data;
    
    if (data && data.users && Array.isArray(data.users)) {
      return data;
    }
    
    if (Array.isArray(data)) {
      return {
        users: data,
        pagination: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1
        }
      };
    }
    
    // If the response has a different structure, try to extract users
    if (data && data.data && Array.isArray(data.data)) {
      return {
        users: data.data,
        pagination: data.pagination || {
          page: 1,
          limit: data.data.length,
          total: data.data.length,
          totalPages: 1
        }
      };
    }
    
    return {
      users: [],
      pagination: {
        page: 1,
        limit: 0,
        total: 0,
        totalPages: 0
      }
    };
  }

  // Admin user management methods
  async updateAdminUser(userId: string, userData: Partial<AdminUser>): Promise<AdminUser> {
    const response: AxiosResponse<AdminUser> = await this.client.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  }

  async deleteAdminUser(userId: string): Promise<void> {
    await this.client.delete(`/api/admin/users/${userId}`);
  }

  // Admin wishlist endpoints - using regular wishlist endpoints for now
  async getAdminWishlists(params?: {
    page?: number;
    limit?: number;
    search?: string;
    userId?: string;
  }): Promise<{
    wishlists: WishlistItemApi[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Try admin endpoint first, fallback to regular wishlist endpoint
    try {
      const response: AxiosResponse<any> = await this.client.get('/api/admin/wishlists', { params });
      return response.data;
    } catch (error) {
      console.log('Admin wishlist endpoint not available, using regular wishlist endpoint');
      const response: AxiosResponse<WishlistResponse> = await this.client.get('/api/wishlist', { 
        params: { page: params?.page, limit: params?.limit } 
      });
      return {
        wishlists: response.data.items,
        pagination: {
          ...response.data.pagination,
          totalPages: response.data.pagination.pages
        }
      };
    }
  }

  async updateAdminWishlistItem(itemId: string, payload: {
    name?: string;
    type?: string;
    size?: string;
    location?: string;
    notes?: string;
    priority?: 'high' | 'medium' | 'low';
  }): Promise<WishlistItemApi> {
    // Try admin endpoint first, fallback to regular wishlist endpoint
    try {
      const response: AxiosResponse<WishlistItemApi> = await this.client.put(`/api/admin/wishlists/${itemId}`, payload);
      return response.data;
    } catch (error) {
      console.log('Admin wishlist update endpoint not available, using regular wishlist endpoint');
      const response: AxiosResponse<WishlistItemApi> = await this.client.put(`/api/wishlist/${itemId}`, payload);
      return response.data;
    }
  }

  async deleteAdminWishlistItem(itemId: string): Promise<void> {
    // Try admin endpoint first, fallback to regular wishlist endpoint
    try {
      await this.client.delete(`/api/admin/wishlists/${itemId}`);
    } catch (error) {
      console.log('Admin wishlist delete endpoint not available, using regular wishlist endpoint');
      await this.client.delete(`/api/wishlist/${itemId}`);
    }
  }


  // Payment and Reward System endpoints
  async createPaymentIntent(payload: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
    const response: AxiosResponse<CreatePaymentIntentResponse> = await this.client.post('/api/payments/create-payment-intent', payload);
    return response.data;
  }

  async confirmPayment(payload: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> {
    const response: AxiosResponse<ConfirmPaymentResponse> = await this.client.post('/api/payments/confirm-payment', payload);
    return response.data;
  }

  async getPaymentHistory(): Promise<{ payments: Payment[] }> {
    const response: AxiosResponse<{ payments: Payment[] }> = await this.client.get('/api/payments/history');
    return response.data;
  }

  async getRewardStatus(): Promise<RewardStatusResponse> {
    const response: AxiosResponse<RewardStatusResponse> = await this.client.get('/api/rewards/status');
    return response.data;
  }

  async getRewardTiers(): Promise<RewardTier[]> {
    const response: AxiosResponse<RewardTier[]> = await this.client.get('/api/rewards/tiers');
    return response.data;
  }

  async upgradeWithPoints(targetTier: string): Promise<{ message: string; user: any }> {
    const response: AxiosResponse<{ message: string; user: any }> = await this.client.post('/api/rewards/upgrade/points', { targetTier });
    return response.data;
  }

  async redeemPointsForBoost(pointsToRedeem: number, listingId: string): Promise<{ message: string; remainingPoints: number; listingId: string }> {
    const response: AxiosResponse<{ message: string; remainingPoints: number; listingId: string }> = await this.client.post('/api/rewards/redeem/boost', { pointsToRedeem, listingId });
    return response.data;
  }

  async getReferralInfo(): Promise<ReferralInfo> {
    const response: AxiosResponse<ReferralInfo> = await this.client.get('/api/rewards/referral');
    return response.data;
  }

  async processReferralSignup(referralCode: string, userId: string): Promise<{ message: string; referralId: string }> {
    const response: AxiosResponse<{ message: string; referralId: string }> = await this.client.post('/api/rewards/referral/signup', { referralCode, userId });
    return response.data;
  }

  async awardPointsForDonation(donationId: string): Promise<{ message: string; pointsAwarded: number; totalPoints: number }> {
    const response: AxiosResponse<{ message: string; pointsAwarded: number; totalPoints: number }> = await this.client.post('/api/rewards/points/donation', { donationId });
    return response.data;
  }

  // Health check endpoint
  async healthCheck(): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

// Create and export a single instance
export const apiClient = new ApiClient();

// Legacy functions for backward compatibility
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiClient.login(payload);
}

export async function signUp(payload: SignUpRequest): Promise<SignUpResponse> {
  return apiClient.signUp(payload);
}

export async function getCurrentUser(): Promise<UserProfile> {
  return apiClient.getCurrentUser();
}

export async function getAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  accountType?: string;
}): Promise<{
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  return apiClient.getAdminUsers(params);
}

// Admin user management functions
export async function updateAdminUser(userId: string, userData: Partial<AdminUser>): Promise<AdminUser> {
  return apiClient.updateAdminUser(userId, userData);
}

export async function deleteAdminUser(userId: string): Promise<void> {
  return apiClient.deleteAdminUser(userId);
}

// Category management functions
export async function updateCategory(id: string, categoryData: {
  name: string;
  slug: string;
  icon: string;
}): Promise<Category> {
  return apiClient.updateCategory(id, categoryData);
}

export async function deleteCategory(id: string): Promise<void> {
  return apiClient.deleteCategory(id);
}

// Payment and Reward System functions
export async function createPaymentIntent(payload: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
  return apiClient.createPaymentIntent(payload);
}

export async function confirmPayment(payload: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> {
  return apiClient.confirmPayment(payload);
}

export async function getPaymentHistory(): Promise<{ payments: Payment[] }> {
  return apiClient.getPaymentHistory();
}

export async function getRewardStatus(): Promise<RewardStatusResponse> {
  return apiClient.getRewardStatus();
}

export async function getRewardTiers(): Promise<RewardTier[]> {
  return apiClient.getRewardTiers();
}

export async function upgradeWithPoints(targetTier: string): Promise<{ message: string; user: any }> {
  return apiClient.upgradeWithPoints(targetTier);
}

export async function redeemPointsForBoost(pointsToRedeem: number, listingId: string): Promise<{ message: string; remainingPoints: number; listingId: string }> {
  return apiClient.redeemPointsForBoost(pointsToRedeem, listingId);
}

export async function getReferralInfo(): Promise<ReferralInfo> {
  return apiClient.getReferralInfo();
}

export async function processReferralSignup(referralCode: string, userId: string): Promise<{ message: string; referralId: string }> {
  return apiClient.processReferralSignup(referralCode, userId);
}

export async function awardPointsForDonation(donationId: string): Promise<{ message: string; pointsAwarded: number; totalPoints: number }> {
  return apiClient.awardPointsForDonation(donationId);
}

// Wishlist functions
export async function getWishlist(page = 1, limit = 10): Promise<WishlistResponse> {
  return apiClient.getWishlist(page, limit);
}

export async function addToWishlist(payload: {
  name: string;
  type?: string;
  size?: string;
  location?: string;
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
}): Promise<WishlistItemApi> {
  return apiClient.addToWishlist(payload);
}

export async function updateWishlistItem(itemId: string, payload: {
  name?: string;
  type?: string;
  size?: string;
  location?: string;
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
}): Promise<WishlistItemApi> {
  return apiClient.updateWishlistItem(itemId, payload);
}

export async function removeFromWishlist(itemId: string): Promise<void> {
  return apiClient.removeFromWishlist(itemId);
}

// Admin wishlist functions
export async function getAdminWishlists(params?: {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
}): Promise<{
  wishlists: WishlistItemApi[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  return apiClient.getAdminWishlists(params);
}

export async function updateAdminWishlistItem(itemId: string, payload: {
  name?: string;
  type?: string;
  size?: string;
  location?: string;
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
}): Promise<WishlistItemApi> {
  return apiClient.updateAdminWishlistItem(itemId, payload);
}

export async function deleteAdminWishlistItem(itemId: string): Promise<void> {
  return apiClient.deleteAdminWishlistItem(itemId);
}



