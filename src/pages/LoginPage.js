import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Divider,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Google as GoogleIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/common/Loader';
import { styled } from '@mui/material/styles';

const PageContainer = styled('div')({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(45deg, #f3f4f6 30%, #fff 90%)'
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '400px',
  width: '100%',
  boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
  borderRadius: '16px',
  background: '#ffffff'
}));

const Form = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1)
}));

export default function LoginPage() {
  const { user, loading, signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (user) {
      navigate('/calendar', { replace: true });
    }
  }, [user, navigate]);

  if (loading) {
    return <Loader message="Checking authentication..." />;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setError('');
    setIsSubmitting(true);

    try {
      await signInWithEmail(formData.email, formData.password);
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password'
          : 'Failed to sign in. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setError('');
    setIsSubmitting(true);

    try {
      await signUpWithEmail(formData.email, formData.password, formData.displayName);
    } catch (err) {
      console.error('Sign-up error:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError('Failed to sign up. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    
    setError('');
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <Container component="main" maxWidth="sm">
        <StyledPaper elevation={3}>
          <Typography component="h1" variant="h4" gutterBottom>
            {tabValue === 0 ? 'Welcome Back' : 'Join FamHarmonyHQ'}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {tabValue === 0 
              ? 'Sign in to access your family calendar' 
              : 'Create an account to organize your family life'}
          </Typography>

          <Box sx={{ width: '100%', mb: 3, mt: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
            >
              <Tab label="Sign In" />
              <Tab label="Sign Up" />
            </Tabs>
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {tabValue === 0 ? (
            <Form onSubmit={handleSignIn}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isSubmitting}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={isSubmitting}
                sx={{ mt: 3, mb: 2 }}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form>
          ) : (
            <Form onSubmit={handleSignUp}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Name"
                name="displayName"
                autoComplete="name"
                autoFocus
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={isSubmitting}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isSubmitting}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={isSubmitting}
                sx={{ mt: 3, mb: 2 }}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Form>
          )}

          <Box sx={{ width: '100%', my: 2 }}>
            <Divider>
              <Typography variant="body2" color="textSecondary">
                OR
              </Typography>
            </Divider>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            sx={{
              borderColor: 'rgba(0,0,0,0.23)',
              '&:hover': {
                borderColor: 'rgba(0,0,0,0.23)',
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            Continue with Google
          </Button>
        </StyledPaper>
      </Container>
    </PageContainer>
  );
} 