import { WeatherData, WeatherCache, WeatherServiceConfig } from './types/weather';

class WeatherService {
  private config: WeatherServiceConfig;
  private cache: WeatherCache = {};
  private readonly CACHE_KEY_PREFIX = 'weather_';
  private readonly DEFAULT_CACHE_EXPIRY = 3600000; // 1 hour in milliseconds

  constructor(config: WeatherServiceConfig) {
    this.config = {
      cacheExpiry: this.DEFAULT_CACHE_EXPIRY,
      ...config,
    };
    this.loadCacheFromStorage();
  }

  private loadCacheFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('weather_cache');
      if (stored) {
        this.cache = JSON.parse(stored);
        // Clean expired entries
        this.cleanExpiredCache();
      }
    } catch (error) {
      console.warn('Failed to load weather cache from localStorage:', error);
      this.cache = {};
    }
  }

  private saveCacheToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('weather_cache', JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save weather cache to localStorage:', error);
    }
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    Object.keys(this.cache).forEach(key => {
      if (this.cache[key].expires < now) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => delete this.cache[key]);
  }

  private generateCacheKey(lat: number, lon: number, timestamp: string): string {
    // Round coordinates to reduce cache entries for nearby locations
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    const date = new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
    return `${this.CACHE_KEY_PREFIX}${roundedLat}_${roundedLon}_${date}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache[cacheKey];
    return cached && cached.expires > Date.now();
  }

  private generateMockWeatherData(lat: number, lon: number, timestamp: string): WeatherData {
    // Generate consistent mock data based on location and date
    const date = new Date(timestamp);
    const seed = lat + lon + date.getDay();
    const random = (min: number, max: number) => min + (Math.abs(Math.sin(seed)) * (max - min));
    
    // Simulate seasonal temperature variations
    const month = date.getMonth();
    let baseTempC: number;
    
    // Northern hemisphere seasonal approximation
    if (month >= 11 || month <= 1) { // Winter
      baseTempC = random(-5, 10);
    } else if (month >= 2 && month <= 4) { // Spring
      baseTempC = random(10, 20);
    } else if (month >= 5 && month <= 8) { // Summer
      baseTempC = random(20, 32);
    } else { // Fall
      baseTempC = random(5, 18);
    }

    const weatherTypes = ['Clear', 'Clouds', 'Rain', 'Snow', 'Mist'];
    const weatherType = weatherTypes[Math.floor(random(0, weatherTypes.length))];
    
    return {
      timestamp,
      location: {
        lat,
        lon,
        city: 'Mock City',
        country: 'Mock Country',
      },
      main: {
        temp: Math.round(baseTempC),
        feels_like: Math.round(baseTempC + random(-3, 3)),
        temp_min: Math.round(baseTempC - random(0, 5)),
        temp_max: Math.round(baseTempC + random(0, 8)),
        pressure: Math.round(random(990, 1020)),
        humidity: Math.round(random(30, 90)),
      },
      wind: {
        speed: Math.round(random(0, 15) * 10) / 10,
        deg: Math.round(random(0, 360)),
        gust: Math.round(random(0, 20) * 10) / 10,
      },
      visibility: Math.round(random(1000, 10000)),
      clouds: {
        all: Math.round(random(0, 100)),
      },
      weather: [{
        id: 800,
        main: weatherType,
        description: weatherType.toLowerCase(),
        icon: '01d',
      }],
      ...(weatherType === 'Rain' && {
        rain: {
          '1h': Math.round(random(0, 10) * 10) / 10,
        },
      }),
      ...(weatherType === 'Snow' && {
        snow: {
          '1h': Math.round(random(0, 5) * 10) / 10,
        },
      }),
    };
  }

  private async fetchFromOpenWeatherMap(lat: number, lon: number, timestamp: string): Promise<WeatherData> {
    if (!this.config.apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    const date = new Date(timestamp);
    const now = new Date();
    const isHistorical = date < now;

    let url: string;
    if (isHistorical) {
      // Historical weather data (requires paid plan)
      const unixTimestamp = Math.floor(date.getTime() / 1000);
      url = `${this.config.baseUrl || 'https://api.openweathermap.org/data/3.0'}/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${unixTimestamp}&appid=${this.config.apiKey}&units=metric`;
    } else {
      // Current weather
      url = `${this.config.baseUrl || 'https://api.openweathermap.org/data/2.5'}/weather?lat=${lat}&lon=${lon}&appid=${this.config.apiKey}&units=metric`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Normalize the response structure
    if (isHistorical && data.data && data.data[0]) {
      const historicalData = data.data[0];
      return {
        timestamp,
        location: { lat, lon },
        main: {
          temp: historicalData.temp,
          feels_like: historicalData.feels_like,
          temp_min: historicalData.temp,
          temp_max: historicalData.temp,
          pressure: historicalData.pressure,
          humidity: historicalData.humidity,
        },
        wind: {
          speed: historicalData.wind_speed,
          deg: historicalData.wind_deg,
          gust: historicalData.wind_gust,
        },
        visibility: historicalData.visibility || 10000,
        clouds: {
          all: historicalData.clouds,
        },
        weather: historicalData.weather,
        ...(historicalData.rain && { rain: historicalData.rain }),
        ...(historicalData.snow && { snow: historicalData.snow }),
      };
    } else {
      return {
        timestamp,
        location: { lat, lon },
        main: data.main,
        wind: data.wind,
        visibility: data.visibility,
        clouds: data.clouds,
        weather: data.weather,
        ...(data.rain && { rain: data.rain }),
        ...(data.snow && { snow: data.snow }),
      };
    }
  }

  async getWeatherForActivity(
    lat: number,
    lon: number,
    timestamp: string
  ): Promise<WeatherData> {
    const cacheKey = this.generateCacheKey(lat, lon, timestamp);

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache[cacheKey].data;
    }

    try {
      let weatherData: WeatherData;

      if (this.config.provider === 'mock') {
        weatherData = this.generateMockWeatherData(lat, lon, timestamp);
      } else {
        weatherData = await this.fetchFromOpenWeatherMap(lat, lon, timestamp);
      }

      // Cache the result
      this.cache[cacheKey] = {
        data: weatherData,
        timestamp: Date.now(),
        expires: Date.now() + (this.config.cacheExpiry || this.DEFAULT_CACHE_EXPIRY),
      };

      this.saveCacheToStorage();
      return weatherData;
    } catch (error) {
      console.warn(`Failed to fetch weather data, falling back to mock data:`, error);
      
      // Fallback to mock data
      const mockData = this.generateMockWeatherData(lat, lon, timestamp);
      this.cache[cacheKey] = {
        data: mockData,
        timestamp: Date.now(),
        expires: Date.now() + (this.config.cacheExpiry || this.DEFAULT_CACHE_EXPIRY),
      };
      
      this.saveCacheToStorage();
      return mockData;
    }
  }

  async getWeatherForMultipleActivities(
    activities: Array<{
      id: number;
      lat: number;
      lon: number;
      timestamp: string;
    }>
  ): Promise<Map<number, WeatherData>> {
    const results = new Map<number, WeatherData>();
    
    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < activities.length; i += batchSize) {
      const batch = activities.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async activity => {
        try {
          const weather = await this.getWeatherForActivity(
            activity.lat,
            activity.lon,
            activity.timestamp
          );
          return { id: activity.id, weather };
        } catch (error) {
          console.warn(`Failed to get weather for activity ${activity.id}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.set(result.value.id, result.value.weather);
        }
      });

      // Add a small delay between batches to respect rate limits
      if (i + batchSize < activities.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  clearCache(): void {
    this.cache = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem('weather_cache');
    }
  }

  getCacheStats(): { entries: number; size: string; oldestEntry: Date | null } {
    const entries = Object.keys(this.cache).length;
    const size = JSON.stringify(this.cache).length;
    let oldestTimestamp = Infinity;

    Object.values(this.cache).forEach(entry => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    });

    return {
      entries,
      size: `${Math.round(size / 1024)} KB`,
      oldestEntry: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
    };
  }
}

// Default instance with mock provider for development
export const weatherService = new WeatherService({
  provider: process.env.NODE_ENV === 'production' ? 'openweathermap' : 'mock',
  apiKey: process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY,
  cacheExpiry: 3600000, // 1 hour
});

export { WeatherService };