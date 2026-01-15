import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { postTokenToExtension } from '../services/extensionService';

function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/login?error=${error}`);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // Store token in localStorage
        localStorage.setItem('auth_token', token);
        
        // Send token to extension (single send to avoid rate limiting)
        postTokenToExtension(token);
        console.log('✅ Token sent to extension (Google OAuth)');
        
        // Update store
        setUser(user);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to parse user data:', err);
        navigate('/login?error=invalid_response');
      }
    } else {
      navigate('/login?error=missing_data');
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-lg">Completing sign in...</div>
    </div>
  );
}

export default AuthCallbackPage;
