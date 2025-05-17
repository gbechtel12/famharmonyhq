// WeatherAPI.com service
const WEATHERAPI_KEY = 'fe9f65a1f1ff48098fb161207251605'; 
const BASE_URL = 'https://api.weatherapi.com/v1';

export const weatherService = {
  // Get current weather by coordinates
  async getWeatherByCoords(lat, lon) {
    try {
      const response = await fetch(
        `${BASE_URL}/current.json?key=${WEATHERAPI_KEY}&q=${lat},${lon}&aqi=no`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch current weather');
      }
      
      const data = await response.json();
      
      // Format response to match OpenWeatherMap structure used by the components
      return {
        name: data.location.name,
        main: {
          temp: data.current.temp_f,
          feels_like: data.current.feelslike_f
        },
        weather: [
          {
            id: this._mapWeatherCodeToId(data.current.condition.code),
            description: data.current.condition.text,
            icon: data.current.condition.icon
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching weather by coordinates:', error);
      throw error;
    }
  },
  
  // Get forecast by coordinates
  async getForecastByCoords(lat, lon) {
    try {
      const response = await fetch(
        `${BASE_URL}/forecast.json?key=${WEATHERAPI_KEY}&q=${lat},${lon}&days=3&aqi=no&alerts=no`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast');
      }
      
      const data = await response.json();
      
      // Format response to match OpenWeatherMap structure used by components
      return this._formatForecastData(data);
    } catch (error) {
      console.error('Error fetching forecast by coordinates:', error);
      throw error;
    }
  },
  
  // Get weather by city name
  async getWeatherByCity(city) {
    try {
      const response = await fetch(
        `${BASE_URL}/current.json?key=${WEATHERAPI_KEY}&q=${city}&aqi=no`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather for city');
      }
      
      const data = await response.json();
      
      // Format response to match OpenWeatherMap structure used by components
      return {
        name: data.location.name,
        main: {
          temp: data.current.temp_f,
          feels_like: data.current.feelslike_f
        },
        weather: [
          {
            id: this._mapWeatherCodeToId(data.current.condition.code),
            description: data.current.condition.text,
            icon: data.current.condition.icon
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching weather by city:', error);
      // Return mock data for development
      return this._getMockCurrentWeather(city);
    }
  },
  
  // Get forecast by city name
  async getForecastByCity(city) {
    try {
      const response = await fetch(
        `${BASE_URL}/forecast.json?key=${WEATHERAPI_KEY}&q=${city}&days=3&aqi=no&alerts=no`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast for city');
      }
      
      const data = await response.json();
      
      // Format response to match OpenWeatherMap structure
      return this._formatForecastData(data);
    } catch (error) {
      console.error('Error fetching forecast by city:', error);
      // Return mock data for development
      return this._getMockForecastData();
    }
  },
  
  // Get location coordinates by city name
  async getCoordsByCity(city) {
    try {
      const response = await fetch(
        `${BASE_URL}/search.json?key=${WEATHERAPI_KEY}&q=${city}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch coordinates for city');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('City not found');
      }
      
      return {
        lat: data[0].lat,
        lon: data[0].lon,
        name: data[0].name,
        country: data[0].country
      };
    } catch (error) {
      console.error('Error fetching coordinates by city:', error);
      throw error;
    }
  },
  
  // Parse forecast data from weatherapi.com and format it to match OpenWeatherMap structure
  _formatForecastData(weatherApiData) {
    // Create a structure matching what the components expect from OpenWeatherMap
    const list = [];
    
    // Add forecast data for each day and hour
    weatherApiData.forecast.forecastday.forEach(day => {
      // Add entries for each hour of the day to match OpenWeatherMap's structure
      day.hour.forEach(hour => {
        list.push({
          dt: new Date(hour.time).getTime() / 1000, // Convert to Unix timestamp
          main: {
            temp: hour.temp_f
          },
          weather: [
            {
              id: this._mapWeatherCodeToId(hour.condition.code),
              description: hour.condition.text,
              icon: hour.condition.icon
            }
          ]
        });
      });
    });
    
    return { list };
  },
  
  // Map weatherapi.com condition codes to OpenWeatherMap-like IDs
  // This is needed to maintain compatibility with the existing component
  _mapWeatherCodeToId(code) {
    // WeatherAPI.com condition codes: https://www.weatherapi.com/docs/weather_conditions.json
    // Map to approximate OpenWeatherMap IDs used by the component
    
    // Thunderstorm
    if ([1087, 1273, 1276, 1279, 1282].includes(code)) {
      return 200; // Thunderstorm
    }
    
    // Drizzle and Rain
    if ([1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(code)) {
      return 500; // Rain
    }
    
    // Snow
    if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1261, 1264].includes(code)) {
      return 600; // Snow
    }
    
    // Fog, Mist
    if ([1030, 1135, 1147].includes(code)) {
      return 701; // Mist
    }
    
    // Clear
    if ([1000].includes(code)) {
      return 800; // Clear sky
    }
    
    // Clouds
    if ([1003, 1006, 1009, 1030].includes(code)) {
      return 801; // Few clouds
    }
    
    // Default: Cloudy
    return 804;
  },
  
  // Parse the forecast and extract daily data (maintained for compatibility)
  getDailyForecast(forecastData) {
    if (!forecastData || !forecastData.list) {
      return [];
    }
    
    // Group by day
    const dailyData = {};
    
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toISOString().split('T')[0];
      
      if (!dailyData[day]) {
        dailyData[day] = {
          date: day,
          temps: [],
          weatherIds: [],
          weatherDescriptions: [],
          weatherIcons: []
        };
      }
      
      dailyData[day].temps.push(item.main.temp);
      dailyData[day].weatherIds.push(item.weather[0].id);
      dailyData[day].weatherDescriptions.push(item.weather[0].description);
      dailyData[day].weatherIcons.push(item.weather[0].icon);
    });
    
    // Convert to array and calculate mins and maxes
    return Object.values(dailyData).map(day => {
      // Find most common weather condition
      const counts = {};
      let maxCount = 0;
      let mostCommonIndex = 0;
      
      day.weatherIds.forEach((id, index) => {
        counts[id] = (counts[id] || 0) + 1;
        if (counts[id] > maxCount) {
          maxCount = counts[id];
          mostCommonIndex = index;
        }
      });
      
      return {
        date: day.date,
        minTemp: Math.min(...day.temps),
        maxTemp: Math.max(...day.temps),
        avgTemp: day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
        weatherId: day.weatherIds[mostCommonIndex],
        weatherDescription: day.weatherDescriptions[mostCommonIndex],
        weatherIcon: day.weatherIcons[mostCommonIndex]
      };
    }).slice(0, 3); // Return only the next 3 days
  },
  
  // Mock data for development
  _getMockCurrentWeather(city) {
    return {
      name: city || "Austin, TX",
      main: {
        temp: 78,
        feels_like: 80
      },
      weather: [
        {
          id: 800,
          description: "Sunny",
          icon: "01d"
        }
      ]
    };
  },
  
  // Mock forecast data for development
  _getMockForecastData() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    return {
      list: [
        // Today's data
        ...[...Array(8)].map((_, i) => ({
          dt: (now + i * 3 * 60 * 60 * 1000) / 1000,
          main: { temp: 75 + i },
          weather: [{ id: 800, description: "Sunny", icon: "01d" }]
        })),
        
        // Tomorrow's data
        ...[...Array(8)].map((_, i) => ({
          dt: (now + oneDay + i * 3 * 60 * 60 * 1000) / 1000,
          main: { temp: 70 + i },
          weather: [{ id: 801, description: "Partly Cloudy", icon: "02d" }]
        })),
        
        // Day after tomorrow
        ...[...Array(8)].map((_, i) => ({
          dt: (now + 2 * oneDay + i * 3 * 60 * 60 * 1000) / 1000,
          main: { temp: 65 + i },
          weather: [{ id: 500, description: "Light Rain", icon: "10d" }]
        }))
      ]
    };
  }
}; 