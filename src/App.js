import React, { Suspense } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate,
  Outlet 
} from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Loader from './components/common/Loader';
import ErrorBoundary from './components/common/ErrorBoundary';
import NavBar from './components/NavBar';
import theme from './theme';

const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ChoresPage = React.lazy(() => import('./pages/ChoresPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader message="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function Root() {
  const { user } = useAuth();

  return (
    <div className="app-container">
      {user && <NavBar />}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Root />}>
      <Route
        index
        element={<Navigate to="/calendar" replace />}
      />
      <Route
        path="calendar"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader message="Loading calendar..." />}>
              <CalendarPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="chores"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader message="Loading chores..." />}>
              <ChoresPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="settings"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader message="Loading settings..." />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="login"
        element={
          <Suspense fallback={<Loader message="Loading..." />}>
            <LoginPage />
          </Suspense>
        }
      />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
