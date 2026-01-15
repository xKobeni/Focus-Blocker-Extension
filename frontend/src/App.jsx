import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import UsageMetricsPage from './pages/UsageMetricsPage.jsx';
import BlockedSitesPage from './pages/BlockedSitesPage.jsx';
import TimeLimitsPage from './pages/TimeLimitsPage.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import CustomBlockPagePage from './pages/CustomBlockPagePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AuthCallbackPage from './pages/AuthCallbackPage.jsx';
import PopupPage from './pages/PopupPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import useAuthStore from './stores/authStore';
import { getToken } from './services/authService';
import { postTokenToExtension } from './services/extensionService';

function AppRoutes() {
  const { isAuthenticated } = useAuthStore();
  
  // Sync token with extension on app load/mount (minimal frequency to avoid rate limiting)
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = getToken();
    if (!token) return;

    // Function to send token
    const sendToken = () => {
      postTokenToExtension(token);
      console.log('🔄 Auto-syncing token with extension');
    };

    // Send immediately
    sendToken();

    // Send once after a delay to ensure content script is ready
    const timeout = setTimeout(sendToken, 2000);

    // Only send one more time after 30 seconds (total: 3 calls max)
    const finalTimeout = setTimeout(sendToken, 30000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(finalTimeout);
    };
  }, [isAuthenticated]);

  // Listen for token requests from extension
  useEffect(() => {
    const handleExtensionTokenRequest = (event) => {
      // Only respond to messages from the same window
      if (event.source !== window) return;

      if (event.data.type === "FOCUS_BLOCKER_REQUEST_TOKEN") {
        console.log('📨 Extension requested token');
        const token = getToken();
        if (token) {
          postTokenToExtension(token);
          console.log('✅ Token sent to extension (requested)');
          // Removed automatic retry to reduce API calls
        } else {
          console.log('❌ No token available to send');
        }
      }
    };

    window.addEventListener('message', handleExtensionTokenRequest);
    return () => window.removeEventListener('message', handleExtensionTokenRequest);
  }, []);
  
  return (
    <Routes>
      {/* Default route - show landing page if not authenticated, otherwise redirect to home */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />
        } 
      />
      
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      {/* Extension popup route - public, handles auth internally */}
      <Route path="/popup" element={<PopupPage />} />
        
        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/usage-metrics" 
          element={
            <ProtectedRoute>
              <UsageMetricsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/blocked-sites" 
          element={
            <ProtectedRoute>
              <BlockedSitesPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/time-limits" 
          element={
            <ProtectedRoute>
              <TimeLimitsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/schedule" 
          element={
            <ProtectedRoute>
              <SchedulePage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/custom-block-page" 
          element={
            <ProtectedRoute>
              <CustomBlockPagePage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
