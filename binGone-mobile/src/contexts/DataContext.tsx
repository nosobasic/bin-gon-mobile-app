import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Category, Listing, Story, AdminAnalyticsOverview, CategoryAnalytics, MonthlyClaimedAnalytics, UpdateListingRequest, apiClient } from '../services/api';

interface DataContextType {
  // Categories
  categories: Category[];
  loadingCategories: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (categoryData: {
    name: string;
    slug: string;
    icon: string;
  }) => Promise<Category>;
  
  // Listings
  listings: Listing[];
  allListings: Listing[]; // All listings for home screen search
  loadingListings: boolean;
  fetchListings: (params?: {
    q?: string;
    categoryId?: string;
    status?: string | string[];
    lng?: number;
    lat?: number;
    radius?: number;
    isPremium?: boolean;
  }) => Promise<void>;
  fetchAllListings: (params?: { isPremium?: boolean }) => Promise<void>; // Fetch all listings for home screen
  fetchListingsGrouped: (params?: {
    q?: string;
    categoryId?: string;
    status?: string;
    lng?: number;
    lat?: number;
    radius?: number;
    groupBy?: string;
    isPremium?: boolean;
  }) => Promise<Array<{
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
  }>>;
  createListing: (listingData: {
    title: string;
    description: string;
    images: string[];
    categoryId: string;
    location: {
      type: 'Point';
      coordinates: [number, number];
    };
    address: string;
  }) => Promise<Listing>;
  updateListing: (id: string, listingData: UpdateListingRequest) => Promise<Listing>;
  deleteListing: (id: string) => Promise<void>;
  
  // Stories
  stories: Story[];
  loadingStories: boolean;
  fetchStories: (published?: boolean) => Promise<void>;
  createStory: (storyData: {
    title: string;
    body: string;
    images: string[];
  }) => Promise<Story>;
  
  // Admin Analytics
  adminAnalytics: AdminAnalyticsOverview | null;
  loadingAnalytics: boolean;
  fetchAdminAnalytics: () => Promise<void>;
  
  // Category Analytics
  categoryAnalytics: CategoryAnalytics[] | null;
  loadingCategoryAnalytics: boolean;
  fetchCategoryAnalytics: () => Promise<void>;
  
  // Monthly Claimed Analytics
  monthlyClaimedAnalytics: MonthlyClaimedAnalytics | null;
  loadingMonthlyClaimedAnalytics: boolean;
  fetchMonthlyClaimedAnalytics: (year?: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]); // All listings for home screen
  const [loadingListings, setLoadingListings] = useState(false);
  
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  
  const [adminAnalytics, setAdminAnalytics] = useState<AdminAnalyticsOverview | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics[] | null>(null);
  const [loadingCategoryAnalytics, setLoadingCategoryAnalytics] = useState(false);
  
  const [monthlyClaimedAnalytics, setMonthlyClaimedAnalytics] = useState<MonthlyClaimedAnalytics | null>(null);
  const [loadingMonthlyClaimedAnalytics, setLoadingMonthlyClaimedAnalytics] = useState(false);

  // Categories functions
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const categoriesData = await apiClient.getCategories();
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const createCategory = useCallback(async (categoryData: {
    name: string;
    slug: string;
    icon: string;
  }) => {
    try {
      const newCategory = await apiClient.createCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      console.log('✅ Category created:', newCategory.id);
      return newCategory;
    } catch (error: any) {
      console.error('❌ Failed to create category:', error.message);
      throw error;
    }
  }, []);

  const fetchAllListings = useCallback(async (params?: { isPremium?: boolean }) => {
    setLoadingListings(true);
    try {
      const listingsData = await apiClient.getListings({ 
        status: 'available', 
        isPremium: params?.isPremium 
      });
      if (Array.isArray(listingsData)) {
        setAllListings(listingsData);
      } else {
        setAllListings([]);
      }
    } catch (error: any) {
      setAllListings([]);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  const fetchListingsGrouped = useCallback(async (params?: {
    q?: string;
    categoryId?: string;
    status?: string;
    lng?: number;
    lat?: number;
    radius?: number;
    groupBy?: string;
    isPremium?: boolean;
  }) => {
    try {
      const groupedData = await apiClient.getListingsGrouped(params);
      return groupedData;
    } catch (error: any) {
      console.error('❌ Failed to fetch grouped listings:', error.message);
      throw error;
    }
  }, []);

  const fetchListings = useCallback(async (params?: {
    q?: string;
    categoryId?: string;
    status?: string | string[];
    lng?: number;
    lat?: number;
    radius?: number;
    isPremium?: boolean;
  }) => {
    setLoadingListings(true);
    try {
      const listingsData = await apiClient.getListings(params);
      if (Array.isArray(listingsData)) {
        setListings(listingsData);
      } else {
        setListings([]);
      }
    } catch (error: any) {
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  const createListing = useCallback(async (listingData: {
    title: string;
    description: string;
    images: string[];
    categoryId: string;
    location: {
      type: 'Point';
      coordinates: [number, number];
    };
    address: string;
  }) => {
    try {
      const newListing = await apiClient.createListing(listingData);
      setListings(prev => [newListing, ...prev]);
      setAllListings(prev => [newListing, ...prev]); // Also update allListings
      console.log('✅ Listing created:', newListing.id);
      return newListing;
    } catch (error: any) {
      console.error('❌ Failed to create listing:', error.message);
      throw error;
    }
  }, []);

  const updateListing = useCallback(async (id: string, listingData: UpdateListingRequest) => {
    try {
      const updatedListing = await apiClient.updateListing(id, listingData);
      setListings(prev => prev.map(listing => 
        listing.id === id ? updatedListing : listing
      ));
      setAllListings(prev => prev.map(listing => 
        listing.id === id ? updatedListing : listing
      ));
      console.log('✅ Listing updated:', id);
      return updatedListing;
    } catch (error: any) {
      console.error('❌ Failed to update listing:', error.message);
      throw error;
    }
  }, []);

  const deleteListing = useCallback(async (id: string) => {
    try {
      console.log('🔧 DataContext: Attempting to delete listing with ID:', id);
      await apiClient.deleteListing(id);
      setListings(prev => prev.filter(listing => listing.id !== id));
      setAllListings(prev => prev.filter(listing => listing.id !== id));
      console.log('✅ DataContext: Listing deleted successfully:', id);
    } catch (error: any) {
      console.error('❌ DataContext: Failed to delete listing:', error.message);
      console.error('❌ DataContext: Full error object:', error);
      if (error.response) {
        console.error('❌ DataContext: Response data:', error.response.data);
        console.error('❌ DataContext: Response status:', error.response.status);
        console.error('❌ DataContext: Response headers:', error.response.headers);
      }
      throw error;
    }
  }, []);

  // Stories functions
  const fetchStories = useCallback(async (published?: boolean) => {
    setLoadingStories(true);
    try {
      const storiesData = await apiClient.getStories(published);
      setStories(storiesData);
      console.log('✅ Stories loaded:', storiesData.length);
    } catch (error: any) {
      console.error('❌ Failed to load stories:', error.message);
    } finally {
      setLoadingStories(false);
    }
  }, []);

  const createStory = useCallback(async (storyData: {
    title: string;
    body: string;
    images: string[];
  }) => {
    try {
      const newStory = await apiClient.createStory(storyData);
      setStories(prev => [newStory, ...prev]);
      console.log('✅ Story created:', newStory.id);
      return newStory;
    } catch (error: any) {
      console.error('❌ Failed to create story:', error.message);
      throw error;
    }
  }, []);

  // Admin Analytics functions
  const fetchAdminAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const analyticsData = await apiClient.getAdminAnalyticsOverview();
      setAdminAnalytics(analyticsData);
      console.log('✅ Admin analytics loaded:', analyticsData);
    } catch (error: any) {
      console.error('❌ Failed to load admin analytics:', error.message);
      setAdminAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // Category Analytics functions
  const fetchCategoryAnalytics = useCallback(async () => {
    setLoadingCategoryAnalytics(true);
    try {
      const analyticsData = await apiClient.getCategoryAnalytics();
      setCategoryAnalytics(analyticsData.categoryStats);
      console.log('✅ Category analytics loaded:', analyticsData.categoryStats);
    } catch (error: any) {
      console.error('❌ Failed to load category analytics:', error.message);
      setCategoryAnalytics(null);
    } finally {
      setLoadingCategoryAnalytics(false);
    }
  }, []);

  // Monthly Claimed Analytics functions
  const fetchMonthlyClaimedAnalytics = useCallback(async (year?: number) => {
    setLoadingMonthlyClaimedAnalytics(true);
    try {
      const analyticsData = await apiClient.getMonthlyClaimedAnalytics(year);
      setMonthlyClaimedAnalytics(analyticsData);
      console.log('✅ Monthly claimed analytics loaded:', analyticsData);
    } catch (error: any) {
      console.error('❌ Failed to load monthly claimed analytics:', error.message);
      setMonthlyClaimedAnalytics(null);
    } finally {
      setLoadingMonthlyClaimedAnalytics(false);
    }
  }, []);

  // Load initial data - only categories and stories
  useEffect(() => {
    fetchCategories();
    fetchStories(true); // Only published stories
    // Don't fetch listings initially - let screens fetch them as needed
  }, [fetchCategories, fetchStories]);

  const value: DataContextType = {
    categories,
    loadingCategories,
    fetchCategories,
    createCategory,
    listings,
    allListings,
    loadingListings,
    fetchListings,
    fetchAllListings,
    fetchListingsGrouped,
    createListing,
    updateListing,
    deleteListing,
    stories,
    loadingStories,
    fetchStories,
    createStory,
    adminAnalytics,
    loadingAnalytics,
    fetchAdminAnalytics,
    categoryAnalytics,
    loadingCategoryAnalytics,
    fetchCategoryAnalytics,
    monthlyClaimedAnalytics,
    loadingMonthlyClaimedAnalytics,
    fetchMonthlyClaimedAnalytics,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
