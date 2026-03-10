import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_COORDINATES_KEY = 'user_coordinates';

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  cityName?: string;
  stateName?: string;
  timestamp: number;
}

export const locationStorage = {
  // Save user coordinates locally
  async saveUserCoordinates(coordinates: [number, number], cityName?: string, stateName?: string): Promise<void> {
    try {
      const [longitude, latitude] = coordinates;
      const userCoordinates: UserCoordinates = {
        latitude,
        longitude,
        cityName,
        stateName,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(USER_COORDINATES_KEY, JSON.stringify(userCoordinates));
      console.log('✅ Coordinates saved locally:', userCoordinates);
    } catch (error) {
      console.error('❌ Failed to save coordinates locally:', error);
      throw error;
    }
  },

  // Update existing coordinates (preserves city/state info if not provided)
  async updateUserCoordinates(coordinates: [number, number], cityName?: string, stateName?: string): Promise<void> {
    try {
      const existing = await this.getUserCoordinates();
      const [longitude, latitude] = coordinates;
      
      const userCoordinates: UserCoordinates = {
        latitude,
        longitude,
        cityName: cityName || existing?.cityName,
        stateName: stateName || existing?.stateName,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(USER_COORDINATES_KEY, JSON.stringify(userCoordinates));
      console.log('✅ Coordinates updated locally:', userCoordinates);
    } catch (error) {
      console.error('❌ Failed to update coordinates locally:', error);
      throw error;
    }
  },

  // Get user coordinates from local storage
  async getUserCoordinates(): Promise<UserCoordinates | null> {
    try {
      const coordinatesData = await AsyncStorage.getItem(USER_COORDINATES_KEY);
      if (coordinatesData) {
        const coordinates: UserCoordinates = JSON.parse(coordinatesData);
        console.log('📍 Retrieved local coordinates:', coordinates);
        return coordinates;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get local coordinates:', error);
      return null;
    }
  },

  // Clear user coordinates
  async clearUserCoordinates(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_COORDINATES_KEY);
      console.log('✅ Local coordinates cleared');
    } catch (error) {
      console.error('❌ Failed to clear local coordinates:', error);
    }
  },

  // Check if coordinates are still valid (not older than 30 days)
  async areCoordinatesValid(): Promise<boolean> {
    try {
      const coordinates = await this.getUserCoordinates();
      if (!coordinates) return false;
      
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return coordinates.timestamp > thirtyDaysAgo;
    } catch (error) {
      console.error('❌ Failed to check coordinates validity:', error);
      return false;
    }
  }
};
