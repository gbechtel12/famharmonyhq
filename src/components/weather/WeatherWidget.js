import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  IconButton, 
  CircularProgress,
  Divider,
  Tooltip,
  Popover,
  InputAdornment
} from '@mui/material';
import { 
  Search as SearchIcon,
  MyLocation as LocationIcon,
  WbSunny as SunnyIcon,
  Nightlight as NightIcon,
  AcUnit as SnowIcon,
  Grain as RainIcon,
  Cloud as CloudIcon,
  Thunderstorm as StormIcon,
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { weatherService } from '../../services/weatherService';
import { styled } from '@mui/material/styles';

// Styled components for the weather widget
const WeatherContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  background: theme.palette.background.paper,
  position: 'relative',
  overflow: 'hidden'
}));

const WeatherIconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: theme.palette.action.hover
}));

const ForecastDay = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(1),
  minWidth: 90
}));

// Helper function to get the appropriate icon based on weather ID 
// (We map weatherapi.com codes to these IDs in the weatherService)
const getWeatherIcon = (weatherId, isNight = false) => {
  // Weather condition codes are mapped from weatherapi.com to match OpenWeatherMap ranges
  if (weatherId >= 200 && weatherId < 300) {
    return <StormIcon color="warning" />;
  } else if (weatherId >= 300 && weatherId < 600) {
    return <RainIcon color="info" />;
  } else if (weatherId >= 600 && weatherId < 700) {
    return <SnowIcon color="info" />;
  } else if (weatherId >= 700 && weatherId < 800) {
    return <WarningIcon color="warning" />;
  } else if (weatherId === 800) {
    return isNight ? <NightIcon color="action" /> : <SunnyIcon color="warning" />;
  } else {
    return <CloudIcon color="action" />;
  }
};

// Format date to display day of week
const formatDay = (dateStr) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const date = new Date(dateStr);
  return days[date.getDay()];
};

function WeatherWidget() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  // Check if we have a saved location in localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem('weatherLocation');
    if (savedLocation) {
      setLocation(savedLocation);
      fetchWeatherData(savedLocation);
    } else {
      // Try to detect location
      if (navigator.geolocation) {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
          },
          (err) => {
            console.error('Error getting location:', err);
            setLoading(false);
            setError('Could not detect location. Please enter a city name.');
          }
        );
      }
    }
  }, []);

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      setLoading(true);
      setError(null);
      
      const [weatherData, forecastData] = await Promise.all([
        weatherService.getWeatherByCoords(lat, lon),
        weatherService.getForecastByCoords(lat, lon)
      ]);
      
      setWeather(weatherData);
      setForecast(weatherService.getDailyForecast(forecastData));
      setLocation(weatherData.name);
      
      // Save to localStorage
      localStorage.setItem('weatherLocation', weatherData.name);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const fetchWeatherData = async (city) => {
    try {
      setLoading(true);
      setError(null);
      
      const [weatherData, forecastData] = await Promise.all([
        weatherService.getWeatherByCity(city),
        weatherService.getForecastByCity(city)
      ]);
      
      setWeather(weatherData);
      setForecast(weatherService.getDailyForecast(forecastData));
      setLocation(weatherData.name);
      
      // Save to localStorage
      localStorage.setItem('weatherLocation', weatherData.name);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data for ' + city);
      setLoading(false);
    }
  };

  const handleSearchClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSearch = () => {
    if (searchValue.trim()) {
      fetchWeatherData(searchValue);
      setAnchorEl(null);
      setSearchValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
          setAnchorEl(null);
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('Could not detect location. Please enter a city name.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'weather-search-popover' : undefined;

  return (
    <WeatherContainer>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Box sx={{ p: 1 }}>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
          <Typography 
            variant="body2" 
            color="primary"
            sx={{ cursor: 'pointer', mt: 1 }}
            onClick={handleSearchClick}
          >
            Try searching for a city
          </Typography>
        </Box>
      ) : weather ? (
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
            <IconButton size="small" onClick={handleSearchClick}>
              <SearchIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <WeatherIconContainer>
              {getWeatherIcon(weather.weather[0].id)}
            </WeatherIconContainer>
            <Box sx={{ ml: 1 }}>
              <Typography variant="h6" component="div">
                {location}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {weather.weather[0].description}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
            {Math.round(weather.main.temp)}°F
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Feels like {Math.round(weather.main.feels_like)}°F
          </Typography>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            {forecast.map((day, index) => (
              <ForecastDay key={index}>
                <Typography variant="caption" color="text.secondary">
                  {index === 0 ? 'Today' : formatDay(day.date)}
                </Typography>
                <Box sx={{ my: 0.5 }}>
                  {getWeatherIcon(day.weatherId)}
                </Box>
                <Typography variant="body2" component="div">
                  {Math.round(day.maxTemp)}° <span style={{ color: 'text.secondary' }}>{Math.round(day.minTemp)}°</span>
                </Typography>
              </ForecastDay>
            ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            No weather data available
          </Typography>
          <Typography 
            variant="body2" 
            color="primary"
            sx={{ cursor: 'pointer', mt: 1 }}
            onClick={handleSearchClick}
          >
            Search for a city
          </Typography>
        </Box>
      )}
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', width: 250 }}>
          <Typography variant="subtitle1" gutterBottom>
            Weather Location
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Enter City"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearch}>
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Tooltip title="Detect my location">
              <IconButton onClick={handleLocationDetect}>
                <LocationIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" sx={{ ml: 1 }}>
              Use my current location
            </Typography>
          </Box>
        </Box>
      </Popover>
    </WeatherContainer>
  );
}

export default WeatherWidget; 