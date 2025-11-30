/**
 * OpenWeatherMap API Client
 * 
 * Handles authentication and API requests to OpenWeatherMap for wind data.
 * Requirements: 1.2, 1.5
 */

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
const API_URL = import.meta.env.VITE_OPENWEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';

export interface OpenWeatherMapWindResponse {
  coord: {
    lon: number;
    lat: number;
  };
  wind: {
    speed: number; // m/s
    deg: number; // degrees
    gust?: number; // m/s
  };
}

export interface OpenWeatherMapError {
  cod: string | number;
  message: string;
}

/**
 * Check if API key is configured
 */
export function isApiKeyConfigured(): boolean {
  return API_KEY !== '' && API_KEY !== 'your_api_key_here';
}

/**
 * Fetch wind data for a specific location
 * Requirements: 1.2
 */
export async function fetchWindDataForLocation(
  lat: number,
  lon: number
): Promise<OpenWeatherMapWindResponse> {
  if (!isApiKeyConfigured()) {
    throw new Error('OpenWeatherMap API key is not configured. Please set VITE_OPENWEATHER_API_KEY in your .env file.');
  }

  const url = `${API_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData: OpenWeatherMapError = await response.json();
      throw new Error(`OpenWeatherMap API error: ${errorData.message} (${errorData.cod})`);
    }

    const data: OpenWeatherMapWindResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch wind data: ${error.message}`);
    }
    throw new Error('Failed to fetch wind data: Unknown error');
  }
}

/**
 * Fetch wind data for a grid of locations within bounds
 * This creates a wind field by sampling multiple points
 * Requirements: 1.2
 */
export async function fetchWindDataGrid(
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  gridSize: { width: number; height: number }
): Promise<OpenWeatherMapWindResponse[]> {
  if (!isApiKeyConfigured()) {
    throw new Error('OpenWeatherMap API key is not configured. Please set VITE_OPENWEATHER_API_KEY in your .env file.');
  }

  const { north, south, east, west } = bounds;
  const { width, height } = gridSize;

  const latStep = (north - south) / (height - 1);
  const lonStep = (east - west) / (width - 1);

  const promises: Promise<OpenWeatherMapWindResponse>[] = [];

  // Sample grid points
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const lat = south + i * latStep;
      const lon = west + j * lonStep;
      promises.push(fetchWindDataForLocation(lat, lon));
    }
  }

  // Fetch all points in parallel with rate limiting
  // OpenWeatherMap free tier allows 60 calls/minute
  const results: OpenWeatherMapWindResponse[] = [];
  const batchSize = 10; // Process 10 requests at a time

  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);

    // Add small delay between batches to respect rate limits
    if (i + batchSize < promises.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Convert wind speed and direction to u/v components
 * u: east-west component (positive = eastward)
 * v: north-south component (positive = northward)
 */
export function windToComponents(speed: number, degrees: number): { u: number; v: number } {
  // Convert meteorological degrees (direction wind is coming FROM)
  // to mathematical radians (direction wind is going TO)
  const radians = ((degrees + 180) % 360) * (Math.PI / 180);
  
  const u = speed * Math.sin(radians);
  const v = speed * Math.cos(radians);
  
  return { u, v };
}

/**
 * Test API connection
 */
export async function testApiConnection(): Promise<boolean> {
  if (!isApiKeyConfigured()) {
    console.warn('OpenWeatherMap API key is not configured');
    return false;
  }

  try {
    // Test with a known location (New York City)
    await fetchWindDataForLocation(40.7128, -74.0060);
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}
