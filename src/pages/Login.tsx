import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoginForm from '@/components/LoginForm';

const Login = () => {
  const { isLoading, role } = useAuth();
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);
  const isLoginAttemptInProgress = useRef(false);

  // Global safety: Prevent form submissions on this page
  useEffect(() => {
    const preventFormSubmit = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'FORM') {
        console.log('Preventing form submission');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Prevent any form submissions
    document.addEventListener('submit', preventFormSubmit, true);
    
    // Prevent Enter key from submitting forms
    const preventEnterSubmit = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'FORM') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    
    document.addEventListener('keydown', preventEnterSubmit, true);

    return () => {
      document.removeEventListener('submit', preventFormSubmit, true);
      document.removeEventListener('keydown', preventEnterSubmit, true);
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (role && !isNavigatingRef.current && !isLoginAttemptInProgress.current) {
      console.log('User already logged in, redirecting to dashboard');
      isNavigatingRef.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [role, navigate]);

  const handleLoginSuccess = useCallback(() => {
    console.log('Login successful, navigating to dashboard');
    if (!isNavigatingRef.current) {
      isNavigatingRef.current = true;
      isLoginAttemptInProgress.current = false;
      // Use replace to prevent back button from returning to login page
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f4674' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f4674' }}>
      {/* White square with rounded corners */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6">
          {/* Left side - Image */}
          <div className="flex items-center hidden sm:block justify-start pr-0">
            <img
              src="/Participant%20Manual.webp"
              alt="PEF Training"
              className="w-full h-full max-h-[600px] object-cover"
            />
          </div>
          {/* Right side - Logos and Login form */}
          <div className="flex flex-col justify-center">
            {/* Logo section */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 md:gap-4 mb-4">
                <img
                  src="https://www.pef.edu.pk/images/logo/pef-logo_2.png"
                  alt="PEF Logo"
                  className="h-16 md:h-20"
                />
                <img
                  src="https://premierdlc.com/wp-content/uploads/2018/01/logo.png"
                  alt="Premier DLC Logo"
                  className="h-16 md:h-20"
                />
              </div>
              <h1 className="text-1xl md:text-2xl font-bold text-gray-800 mb-2">
                PEF Spoken English Training Portal
              </h1>
              <p className="text-gray-600 text-base md:text-lg">
                Monitoring & Management System
              </p>
            </div>
            {/* Login form */}
            <Card className="border-2 border-gray-200 shadow-sm">
              <CardHeader className="text-center pb-3 md:pb-4">
                <CardTitle className="text-xl md:text-2xl">Login</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Enter your credentials to access the portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm onSuccess={handleLoginSuccess} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;