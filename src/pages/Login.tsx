import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoginForm from '@/components/LoginForm';

const Login = () => {
  const { isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left image column: hidden on small screens */}
      <div className="relative hidden md:block">
        <img
          src="/Participant%20Manual.webp"
          alt="Login side visual"
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
        />
      </div>

      {/* Right content column */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-3 md:p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
            <img
              src="https://www.pef.edu.pk/images/logo/pef-logo_2.png"
              alt="PEF Logo"
              className="h-12 md:h-16"
            />
            <img
              src="https://premierdlc.com/wp-content/uploads/2018/01/logo.png"
              alt="Premier DLC Logo"
              className="h-12 md:h-16"
            />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
            Punjab English Training Portal
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Monitoring & Management System
          </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="border-2">
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
