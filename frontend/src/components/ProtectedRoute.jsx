import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { isAuthenticated as checkToken } from '../services/authService';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  
  // Double check: store state AND token validity
  if (!isAuthenticated || !checkToken()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
