import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
  typography: {
    fontFamily: '"Quicksand", "Poppins", "Comic Neue", sans-serif',
    fontSize: 16, // Increase base font size for better readability
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    button: {
      fontWeight: 600,
      fontSize: '1rem',
      textTransform: 'none',
    },
  },
  palette: {
    mode,
    primary: {
      main: '#4585f5', // Friendly blue
      light: '#79b0ff',
      dark: '#2c64c1'
    },
    secondary: {
      main: '#66bb6a', // Soft green
      light: '#98ee99',
      dark: '#338a3e'
    },
    error: {
      main: '#ff7043', // Softer orange-red instead of harsh red
      light: '#ffa270',
      dark: '#c63f17'
    },
    warning: {
      main: '#ffb74d', // Warm orange
      light: '#ffe97d',
      dark: '#c88719'
    },
    info: {
      main: '#29b6f6', // Light blue
      light: '#73e8ff',
      dark: '#0086c3'
    },
    success: {
      main: '#66bb6a', // Matching secondary for consistency
      light: '#98ee99',
      dark: '#338a3e'
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#f8f9fa',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12, // More rounded buttons
          padding: '10px 20px', // Larger click areas
          fontWeight: 600,
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: '0 6px 12px rgba(69, 133, 245, 0.3)',
          },
        },
        containedSecondary: {
          '&:hover': {
            boxShadow: '0 6px 12px rgba(102, 187, 106, 0.3)',
          },
        },
        outlined: {
          borderWidth: 2, // Thicker borders for better visibility
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 12, // Larger clickable area
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            fontSize: '1rem',
          },
          '& .MuiInputLabel-root': {
            fontSize: '1rem',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          zIndex: 1200,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
          fontSize: '0.9rem',
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          minHeight: 48, // Taller tabs for easier touch
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          minHeight: 48, // Taller menu items for easier touch
        }
      }
    }
  },
  shape: {
    borderRadius: 12 // Increase default border radius throughout
  }
});

export default getTheme; 