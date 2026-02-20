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
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6" style={{ backgroundColor: '#0f4674' }}>
      {/* Main card — scale-in entrance animation */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-scale-in">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left side — only show on md+ to prevent stacked image on small tablets */}
          <div className="hidden md:block">
            <img
              src="/Participant%20Manual.webp"
              alt="PEF Training"
              className="w-full h-full max-h-[640px] object-cover"
            />
          </div>

          {/* Right side - Logos and Login form */}
          <div className="flex flex-col justify-center p-5 sm:p-7 md:p-8">
            {/* Logo section */}
            <div className="text-center mb-5 sm:mb-6">
              <div className="flex items-center justify-center gap-3 md:gap-4 mb-3 sm:mb-4">
                <img
                  src="https://www.pef.edu.pk/images/logo/pef-logo_2.png"
                  alt="PEF Logo"
                  className="h-14 sm:h-16 md:h-20 w-auto"
                />
                <img
                  src="https://premierdlc.com/wp-content/uploads/2018/01/logo.png"
                  alt="Premier DLC Logo"
                  className="h-14 sm:h-16 md:h-20 w-auto"
                />
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1 tracking-tight">
                PEF Spoken English Training Portal
              </h1>
              <p className="text-gray-500 text-sm sm:text-base">
                Monitoring &amp; Management System
              </p>
            </div>

            {/* Login form — slide-up on entry */}
            <Card className="border border-gray-200 shadow-sm animate-slide-up">
              <CardHeader className="text-center pb-3 sm:pb-4">
                <CardTitle className="text-xl sm:text-2xl">Sign In</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
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