import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, CircularProgress, Grid } from '@mui/material';
import { 
  WbSunny as SunnyIcon, 
  Cloud as CloudyIcon,
  Opacity as RainIcon,
  AcUnit as SnowIcon,
  Thunderstorm as StormIcon,
  Waves as WindIcon,
  DeviceThermostat as TempIcon
} from '@mui/icons-material';

// Mock weather data - replace with actual API call in a real implementation
const mockWeatherData = {
  location: "Austin, TX",
  currentTemp: 78,
  currentCondition: "Sunny",
  forecast: [
    {
      day: "Today",
      date: "Oct 15",
      condition: "Sunny",
      high: 82,
      low: 65,
      precipitation: "0%",
      wind: "5 mph"
    },
    {
      day: "Tomorrow",
      date: "Oct 16",
      condition: "Partly Cloudy",
      high: 80,
      low: 68,
      precipitation: "10%",
      wind: "8 mph"
    },
    {
      day: "Wednesday",
      date: "Oct 17",
      condition: "Rain Showers",
      high: 75,
      low: 62,
      precipitation: "60%",
      wind: "12 mph"
    }
  ]
};

// Weather condition icon mapping
const getWeatherIcon = (condition) => {
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
    return <SunnyIcon className="text-yellow-500" sx={{ fontSize: 48 }} />;
  } else if (conditionLower.includes('cloud')) {
    return <CloudyIcon className="text-gray-500" sx={{ fontSize: 48 }} />;
  } else if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
    return <RainIcon className="text-blue-500" sx={{ fontSize: 48 }} />;
  } else if (conditionLower.includes('snow')) {
    return <SnowIcon className="text-blue-200" sx={{ fontSize: 48 }} />;
  } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
    return <StormIcon className="text-purple-500" sx={{ fontSize: 48 }} />;
  } else {
    return <CloudyIcon className="text-gray-400" sx={{ fontSize: 48 }} />;
  }
};

function WeatherForecastView() {
  const [isLoading, setIsLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    // Simulate API call
    const fetchWeather = async () => {
      // In a real app, call your weather API here
      setTimeout(() => {
        setWeatherData(mockWeatherData);
        setIsLoading(false);
      }, 1000);
    };
    
    fetchWeather();
  }, []);

  // Get background gradient based on current condition
  const getBackgroundGradient = () => {
    if (!weatherData) return 'from-blue-200 to-blue-400';
    
    const condition = weatherData.currentCondition.toLowerCase();
    if (condition.includes('sunny') || condition.includes('clear')) {
      return 'from-sky-300 to-blue-500';
    } else if (condition.includes('cloud')) {
      return 'from-gray-200 to-gray-400';
    } else if (condition.includes('rain')) {
      return 'from-blue-300 to-blue-600';
    } else if (condition.includes('snow')) {
      return 'from-blue-100 to-blue-300';
    } else {
      return 'from-blue-200 to-blue-400';
    }
  };

  return (
    <div className="w-full h-full p-6 bg-gradient-to-br from-blue-100 to-blue-300 overflow-auto">
      <Paper className={`w-full h-full rounded-xl shadow-xl overflow-hidden bg-white bg-opacity-90 backdrop-blur`}>
        {isLoading ? (
          <div className="w-full h-full flex justify-center items-center">
            <CircularProgress size={60} />
          </div>
        ) : (
          <div className="p-6 flex flex-col h-full">
            {/* Current Weather Header */}
            <div className={`text-center p-8 mb-6 rounded-xl bg-gradient-to-r ${getBackgroundGradient()} text-white`}>
              <Typography variant="h3" className="font-bold mb-2">
                {weatherData.location}
              </Typography>
              <div className="flex justify-center items-center">
                {getWeatherIcon(weatherData.currentCondition)}
                <Typography variant="h2" className="font-bold ml-4">
                  {weatherData.currentTemp}°F
                </Typography>
              </div>
              <Typography variant="h5" className="mt-2">
                {weatherData.currentCondition}
              </Typography>
            </div>

            {/* 3-Day Forecast */}
            <Typography variant="h4" className="font-bold text-center mb-6 text-blue-800">
              3-Day Forecast
            </Typography>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {weatherData.forecast.map((day, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100"
                >
                  {/* Day Header */}
                  <div className="bg-blue-500 text-white p-3 text-center">
                    <Typography variant="h5" className="font-bold">
                      {day.day}
                    </Typography>
                    <Typography variant="subtitle1">
                      {day.date}
                    </Typography>
                  </div>
                  
                  {/* Weather Details */}
                  <div className="p-4">
                    <div className="flex justify-center my-4">
                      {getWeatherIcon(day.condition)}
                    </div>
                    
                    <Typography variant="h6" className="text-center font-medium mb-4">
                      {day.condition}
                    </Typography>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <div className="flex items-center">
                          <TempIcon className="text-red-500 mr-2" />
                          <span>High</span>
                        </div>
                        <strong>{day.high}°F</strong>
                      </div>
                      
                      <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <div className="flex items-center">
                          <TempIcon className="text-blue-500 mr-2" />
                          <span>Low</span>
                        </div>
                        <strong>{day.low}°F</strong>
                      </div>
                      
                      <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <div className="flex items-center">
                          <RainIcon className="text-blue-600 mr-2" />
                          <span>Precipitation</span>
                        </div>
                        <strong>{day.precipitation}</strong>
                      </div>
                      
                      <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <div className="flex items-center">
                          <WindIcon className="text-gray-500 mr-2" />
                          <span>Wind</span>
                        </div>
                        <strong>{day.wind}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Paper>
    </div>
  );
}

export default WeatherForecastView; 