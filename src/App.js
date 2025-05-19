import React, { Suspense } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate,
  Outlet 
} from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FamilyProvider, useFamily } from './contexts/FamilyContext';
import { ThemeProvider, useThemeMode } from './contexts/ThemeContext';
import Loader from './components/common/Loader';
import ErrorBoundary from './components/common/ErrorBoundary';
import NavBar from './components/NavBar';
import getTheme from './theme';

const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ChoresPage = React.lazy(() => import('./pages/ChoresPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const MealPlannerPage = React.lazy(() => import('./pages/MealPlannerPage'));
const RewardsPage = React.lazy(() => import('./pages/RewardsPage'));
const GroceryListPage = React.lazy(() => import('./pages/GroceryListPage'));
const DailyAgendaPage = React.lazy(() => import('./pages/DailyAgendaPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const TailwindExample = React.lazy(() => import('./components/examples/TailwindExample'));
const FamilySetup = React.lazy(() => import('./components/family/FamilySetup'));

function FamilyRedirect({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { loading: familyLoading } = useFamily();
  
  if (authLoading || familyLoading) {
    return <Loader message="Checking family status..." />;
  }
  
  // If user has no family, redirect to setup
  if (user && !user.familyId) {
    return <Navigate to="/family-setup" replace />;
  }
  
  return children;
}

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
  const { themeMode } = useThemeMode();
  const theme = getTheme(themeMode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <div className={`app-container ${themeMode === 'dark' ? 'dark-mode' : ''}`}>
        {user && <NavBar />}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </MuiThemeProvider>
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
            <FamilyRedirect>
              <Suspense fallback={<Loader message="Loading calendar..." />}>
                <CalendarPage />
              </Suspense>
            </FamilyRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="agenda"
        element={
          <ProtectedRoute>
            <FamilyRedirect>
              <Suspense fallback={<Loader message="Loading agenda..." />}>
                <DailyAgendaPage />
              </Suspense>
            </FamilyRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <FamilyRedirect>
              <Suspense fallback={<Loader message="Loading dashboard..." />}>
                <DashboardPage />
              </Suspense>
            </FamilyRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="chores"
        element={
          <ProtectedRoute>
            <FamilyRedirect>
              <Suspense fallback={<Loader message="Loading chores..." />}>
                <ChoresPage />
              </Suspense>
            </FamilyRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="rewards"
        element={
          <ProtectedRoute>
            <FamilyRedirect>
              <Suspense fallback={<Loader message="Loading rewards store..." />}>
                <RewardsPage />
              </Suspense>
            </FamilyRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="meals"
        element={
          <ProtectedRoute>
            <FamilyRedirect>
              <Suspense fallback={<Loader message="Loading meal planner..." />}>
                <MealPlannerPage />
              </Suspense>
            </FamilyRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="grocery"
        element={
          <ProtectedRoute>
            <FamilyRedirect>
              <Suspense fallback={<Loader message="Loading grocery list..." />}>
                <GroceryListPage />
              </Suspense>
            </FamilyRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="settings"
        element={
          <ProtectedRoute>
            <FamilyRedirect>
              <Suspense fallback={<Loader message="Loading settings..." />}>
                <ProfilePage />
              </Suspense>
            </FamilyRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="family-setup"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader message="Loading family setup..." />}>
              <FamilySetup />
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
      <Route
        path="tailwind-example"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader message="Loading example..." />}>
              <TailwindExample />
            </Suspense>
          </ProtectedRoute>
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
      <ThemeProvider>
        <AuthProvider>
          <FamilyProvider>
            <RouterProvider router={router} />
          </FamilyProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
