// OpenWeatherMap API service
// For development/testing, replace this with your actual API key
const OPENWEATHERMAP_API_KEY = 'your_actual_api_key_here'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const weatherService = {
  // Get current weather by coordinates
  async getWeatherByCoords(lat, lon) {
    try {
      const response = await fetch(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch current weather');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching weather by coordinates:', error);
      throw error;
    }
  },
  
  // Get 5-day forecast by coordinates
  async getForecastByCoords(lat, lon) {
    try {
      const response = await fetch(
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching forecast by coordinates:', error);
      throw error;
    }
  },
  
  // Get weather by city name
  async getWeatherByCity(city) {
    try {
      const response = await fetch(
        `${BASE_URL}/weather?q=${city}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather for city');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching weather by city:', error);
      throw error;
    }
  },
  
  // Get 5-day forecast by city name
  async getForecastByCity(city) {
    try {
      const response = await fetch(
        `${BASE_URL}/forecast?q=${city}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast for city');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching forecast by city:', error);
      throw error;
    }
  },
  
  // Get location coordinates by city name
  async getCoordsByCity(city) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${OPENWEATHERMAP_API_KEY}`
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
  
  // Parse the 5-day forecast and extract daily data
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
  }
}; 