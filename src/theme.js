import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0'
    },
    background: {
      default: '#f3f4f6'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 500
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: '0 8px 16px rgba(25, 118, 210, 0.2)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
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
          zIndex: 1200
        }
      }
    }
  },
  shape: {
    borderRadius: 8
  }
});

export default theme; 