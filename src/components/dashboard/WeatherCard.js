import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CircularProgress, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Divider 
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import OpacityIcon from '@mui/icons-material/Opacity';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { weatherService } from '../../services/weatherService';

// Get weather icon based on condition
const getWeatherIcon = (condition, size = 'small') => {
  const conditionLower = condition ? condition.toLowerCase() : '';
  
  // Map sizes to MUI sizes
  const sizes = {
    small: 'small',
    medium: 'medium',
    large: 'large'
  };
  
  const iconSize = sizes[size] || 'small';
  
  if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
    return <WbSunnyIcon fontSize={iconSize} sx={{ color: '#f59e0b' }} />;
  } else if (conditionLower.includes('cloud') && !conditionLower.includes('rain')) {
    return <CloudIcon fontSize={iconSize} sx={{ color: '#6b7280' }} />;
  } else if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
    return <OpacityIcon fontSize={iconSize} sx={{ color: '#3b82f6' }} />;
  } else if (conditionLower.includes('snow')) {
    return <AcUnitIcon fontSize={iconSize} sx={{ color: '#93c5fd' }} />;
  } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
    return <FlashOnIcon fontSize={iconSize} sx={{ color: '#8b5cf6' }} />;
  } else {
    return <CloudIcon fontSize={iconSize} sx={{ color: '#9ca3af' }} />;
  }
};

// Get background color based on condition
const getConditionColors = (condition) => {
  const conditionLower = condition ? condition.toLowerCase() : '';
  
  if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
    return {
      light: '#fef3c7',
      border: '#fcd34d'
    };
  } else if (conditionLower.includes('cloud') && !conditionLower.includes('rain')) {
    return {
      light: '#f3f4f6',
      border: '#d1d5db'
    };
  } else if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
    return {
      light: '#dbeafe',
      border: '#93c5fd'
    };
  } else if (conditionLower.includes('snow')) {
    return {
      light: '#e0f2fe',
      border: '#bae6fd'
    };
  } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
    return {
      light: '#ede9fe',
      border: '#c4b5fd'
    };
  } else {
    return {
      light: '#dbeafe',
      border: '#93c5fd'
    };
  }
};

function WeatherCard({ fullScreen = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoading(true);
        // Default to Hermitage, PA - in a real app, you might get this from user settings
        const city = 'Hermitage, PA';
        
        // Get current weather
        const weatherData = await weatherService.getWeatherByCity(city);
        setCurrentWeather(weatherData);
        
        // Get forecast
        const forecastData = await weatherService.getForecastByCity(city);
        const dailyForecast = weatherService.getDailyForecast(forecastData);
        setForecast(dailyForecast);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Unable to load weather data: ' + (err.message || 'Unknown error'));
        setIsLoading(false);
      }
    };
    
    fetchWeather();
  }, []);

  if (isLoading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={28} />
      </Card>
    );
  }

  if (error || !currentWeather || !forecast || forecast.length === 0) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <CloudIcon sx={{ mb: 1, color: '#9ca3af' }} />
        <Typography variant="body2" color="text.secondary">
          {error || "Weather data unavailable"}
        </Typography>
      </Card>
    );
  }

  const currentCondition = currentWeather?.weather?.[0]?.description || 'Unknown';
  const colors = getConditionColors(currentCondition);

  return (
    <Card 
      sx={{ 
        height: '100%', 
        background: `linear-gradient(to bottom right, ${colors.light}, white)`,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden'
      }}
    >
      <CardHeader
        title="Weather"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'medium' }}
        subheader={currentWeather?.name || "Location Unknown"}
        subheaderTypographyProps={{ variant: 'caption' }}
        sx={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          py: 1.5,
          px: 2
        }}
      />

      <CardContent sx={{ p: 2 }}>
        {/* Current Weather */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {currentCondition}
          </Typography>
          <Typography variant="h2" component="div" fontWeight="medium" sx={{ my: 0.5 }}>
            {Math.round(currentWeather?.main?.temp || 0)}°F
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Feels like {Math.round(currentWeather?.main?.feels_like || 0)}°F
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* 3-Day Forecast */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          3-Day Forecast
        </Typography>
        <Grid container spacing={1}>
          {forecast.slice(0, 3).map((day, index) => {
            if (!day) return null;
            
            const dayName = index === 0 ? 'Today' : 
                         index === 1 ? 'Tomorrow' : 
                         'Sat';
            
            return (
              <Grid item xs={4} key={index}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 1, 
                    textAlign: 'center',
                    border: `1px solid rgba(0, 0, 0, 0.08)`,
                    borderRadius: 1
                  }}
                >
                  <Typography variant="caption" fontWeight="medium">
                    {dayName}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                    {getWeatherIcon(day.weatherDescription || '')}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#ef4444' }}>
                      <TrendingUpIcon sx={{ fontSize: '0.875rem', mr: 0.25 }} />
                      <Typography variant="caption">
                        {Math.round(day.maxTemp || 0)}°
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#3b82f6' }}>
                      <TrendingDownIcon sx={{ fontSize: '0.875rem', mr: 0.25 }} />
                      <Typography variant="caption">
                        {Math.round(day.minTemp || 0)}°
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default WeatherCard; 