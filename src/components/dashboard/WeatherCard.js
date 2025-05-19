import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Box, 
  Skeleton,
  Alert,
  TextField,
  IconButton,
  InputAdornment,
  Button,
  useTheme
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import GrainIcon from '@mui/icons-material/Grain';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import WaterIcon from '@mui/icons-material/Water';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import { weatherService } from '../../services/weatherService';

function WeatherCard() {
  const theme = useTheme();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('');
  const [locationInputError, setLocationInputError] = useState('');

  useEffect(() => {
    // Retrieve last used location from localStorage
    const savedLocation = localStorage.getItem('weatherLocation') || 'San Francisco, CA';
    setLocation(savedLocation);
    fetchWeather(savedLocation);
  }, []);

  const fetchWeather = async (locationQuery) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call actual weather API through service
      const weatherData = await weatherService.getWeatherByCity(locationQuery);
      const forecastData = await weatherService.getForecastByCity(locationQuery);
      
      // Format data for display
      const currentWeather = {
        temperature: Math.round(weatherData.main.temp),
        condition: getWeatherCondition(weatherData.weather[0].id),
        location: weatherData.name,
        forecast: weatherService.getDailyForecast(forecastData).slice(0, 5).map(day => ({
          day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
          temp: Math.round(day.maxTemp),
          condition: getWeatherCondition(day.mainWeatherId)
        }))
      };
      
      setWeather(currentWeather);
      
      // Save location to localStorage
      localStorage.setItem('weatherLocation', locationQuery);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather:', err);
      
      // Create more user-friendly error messages based on common issues
      let errorMessage = 'Unable to load weather data.';
      
      if (err.message && err.message.includes('404')) {
        errorMessage = `Location "${locationQuery}" not found. Please check the spelling and try again.`;
      } else if (err.message && err.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message && err.message.includes('api key')) {
        errorMessage = 'Weather service unavailable at the moment. Please try again later.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const getWeatherCondition = (weatherId) => {
    // Map weather IDs to condition names
    if (weatherId >= 200 && weatherId < 300) return 'thunderstorm';
    if (weatherId >= 300 && weatherId < 400) return 'drizzle';
    if (weatherId >= 500 && weatherId < 600) return 'rainy';
    if (weatherId >= 600 && weatherId < 700) return 'snowy';
    if (weatherId >= 700 && weatherId < 800) return 'mist';
    if (weatherId === 800) return 'sunny';
    if (weatherId >= 801 && weatherId <= 804) return 'cloudy';
    return 'sunny'; // Default
  };

  const getWeatherIcon = (condition) => {
    // Color mapping that works in both light and dark mode
    const colors = {
      sunny: theme.palette.mode === 'dark' ? '#fbbf24' : '#f59e0b',
      cloudy: theme.palette.mode === 'dark' ? '#cbd5e1' : '#94a3b8',
      rainy: theme.palette.mode === 'dark' ? '#60a5fa' : '#3b82f6',
      snowy: theme.palette.mode === 'dark' ? '#93c5fd' : '#60a5fa',
      thunderstorm: theme.palette.mode === 'dark' ? '#a78bfa' : '#7c3aed',
      drizzle: theme.palette.mode === 'dark' ? '#93c5fd' : '#60a5fa',
      mist: theme.palette.mode === 'dark' ? '#cbd5e1' : '#94a3b8'
    };
    
    switch (condition) {
      case 'sunny':
        return <WbSunnyIcon sx={{ color: colors.sunny }} />;
      case 'cloudy':
        return <CloudIcon sx={{ color: colors.cloudy }} />;
      case 'rainy':
        return <GrainIcon sx={{ color: colors.rainy }} />;
      case 'snowy':
        return <AcUnitIcon sx={{ color: colors.snowy }} />;
      case 'thunderstorm':
        return <ThunderstormIcon sx={{ color: colors.thunderstorm }} />;
      case 'drizzle':
        return <WaterIcon sx={{ color: colors.drizzle }} />;
      case 'mist':
        return <WbTwilightIcon sx={{ color: colors.mist }} />;
      default:
        return <WbSunnyIcon sx={{ color: colors.sunny }} />;
    }
  };

  const handleLocationSearch = (e) => {
    e.preventDefault();
    
    // Validate input
    if (!location || location.trim().length < 2) {
      setLocationInputError('Please enter a valid location');
      return;
    }
    
    setLocationInputError('');
    fetchWeather(location.trim());
  };
  
  const handleRetry = () => {
    // Use the current location or default to San Francisco
    fetchWeather(location || 'San Francisco, CA');
  };

  const renderLoadingSkeleton = () => (
    <Card sx={{ height: '100%' }} data-testid="weather-card-loading">
      <CardHeader
        title={<Skeleton width="40%" />}
        subheader={<Skeleton width="40%" />}
      />
      <CardContent>
        <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton width={100} height={60} sx={{ ml: 2 }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ textAlign: 'center' }}>
              <Skeleton variant="text" width={40} />
              <Skeleton variant="circular" width={30} height={30} sx={{ mx: 'auto', my: 1 }} />
              <Skeleton variant="text" width={30} />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <Card sx={{ height: '100%' }} data-testid="weather-card-error">
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WbSunnyIcon sx={{ fontSize: 18, mr: 0.5, color: theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706' }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Weather
            </Typography>
          </Box>
        }
      />
      <CardContent>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              data-testid="weather-retry-button"
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
        
        <form onSubmit={handleLocationSearch} data-testid="weather-search-form">
          <TextField
            fullWidth
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            error={!!locationInputError}
            helperText={locationInputError}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" edge="end" data-testid="weather-search-button">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            placeholder="Enter city, state, or country"
            size="small"
            sx={{ mb: 1 }}
            data-testid="weather-location-input"
          />
        </form>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Try searching for a major city or check your internet connection.
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return renderLoadingSkeleton();
  }

  if (error) {
    return renderErrorState();
  }

  // Define background based on theme mode
  const cardBackground = theme.palette.mode === 'dark' 
    ? 'linear-gradient(to bottom right, #422006, #713f12)' 
    : 'linear-gradient(to bottom right, #fef3c7, #fde68a)';

  const cardBorder = theme.palette.mode === 'dark' 
    ? '1px solid #92400e' 
    : '1px solid #fbbf24';

  const headerBackground = theme.palette.mode === 'dark'
    ? 'rgba(0, 0, 0, 0.2)'
    : 'rgba(255, 255, 255, 0.7)';

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: cardBackground,
        border: cardBorder
      }}
      data-testid="weather-card"
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WbSunnyIcon sx={{ fontSize: 18, mr: 0.5, color: theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706' }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Weather
            </Typography>
          </Box>
        }
        subheader={weather.location}
        sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: headerBackground,
          py: 1.5,
          px: 2
        }}
      />
      <CardContent>
        <form onSubmit={handleLocationSearch} style={{ marginBottom: 16 }} data-testid="weather-search-form">
          <TextField
            fullWidth
            label="Change Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            error={!!locationInputError}
            helperText={locationInputError}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" edge="end" data-testid="weather-search-button">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            placeholder="Enter city, state, or country"
            size="small"
            data-testid="weather-location-input"
          />
        </form>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }} data-testid="weather-current">
          {getWeatherIcon(weather.condition)}
          <Typography variant="h4" sx={{ ml: 2, fontWeight: 'medium' }}>
            {weather.temperature}°F
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }} data-testid="weather-forecast">
          {weather.forecast.map((day, index) => (
            <Box key={index} sx={{ textAlign: 'center' }} data-testid={`weather-forecast-day-${index}`}>
              <Typography variant="caption" color="text.secondary">
                {day.day}
              </Typography>
              <Box sx={{ my: 1 }}>
                {getWeatherIcon(day.condition)}
              </Box>
              <Typography variant="body2">
                {day.temp}°
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default WeatherCard; 