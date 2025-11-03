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
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Spoken English Training Portal
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