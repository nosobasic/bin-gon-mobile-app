interface GeocodingResult {
  formatted_address: string;
  place_id: string;
  types: string[];
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface GeocodingResponse {
  results: GeocodingResult[];
  status: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyDJVXPE-LmoyfecgZZKT7Yi_ASTfwqa-sI';

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data: GeocodingResponse = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      // Get the most relevant result (usually the first one)
      const result = data.results[0];
      
      // Try to get a more specific name if available
      let placeName = result.formatted_address;
      
      // Look for more specific place names in address components
      const establishment = result.address_components.find(component => 
        component.types.includes('establishment')
      );
      
      const pointOfInterest = result.address_components.find(component => 
        component.types.includes('point_of_interest')
      );
      
      const route = result.address_components.find(component => 
        component.types.includes('route')
      );
      
      const streetNumber = result.address_components.find(component => 
        component.types.includes('street_number')
      );
      
      // Build a more specific name
      if (establishment) {
        placeName = establishment.long_name;
      } else if (pointOfInterest) {
        placeName = pointOfInterest.long_name;
      } else if (route && streetNumber) {
        placeName = `${streetNumber.long_name} ${route.long_name}`;
      } else if (route) {
        placeName = route.long_name;
      }
      
      return placeName;
    } else {
      // Fallback to coordinates if geocoding fails
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    // Fallback to coordinates if API call fails
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

export const getDetailedAddress = async (
  latitude: number,
  longitude: number
): Promise<{
  name: string;
  fullAddress: string;
}> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data: GeocodingResponse = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      
      // Get a specific place name
      let placeName = result.formatted_address;
      
      // Look for more specific place names
      const establishment = result.address_components.find(component => 
        component.types.includes('establishment')
      );
      
      const pointOfInterest = result.address_components.find(component => 
        component.types.includes('point_of_interest')
      );
      
      const route = result.address_components.find(component => 
        component.types.includes('route')
      );
      
      const streetNumber = result.address_components.find(component => 
        component.types.includes('street_number')
      );
      
      // Build a more specific name
      if (establishment) {
        placeName = establishment.long_name;
      } else if (pointOfInterest) {
        placeName = pointOfInterest.long_name;
      } else if (route && streetNumber) {
        placeName = `${streetNumber.long_name} ${route.long_name}`;
      } else if (route) {
        placeName = route.long_name;
      }
      
      return {
        name: placeName,
        fullAddress: result.formatted_address,
      };
    } else {
      // Fallback to coordinates
      const fallbackName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      return {
        name: fallbackName,
        fullAddress: fallbackName,
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    // Fallback to coordinates
    const fallbackName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    return {
      name: fallbackName,
      fullAddress: fallbackName,
    };
  }
};
