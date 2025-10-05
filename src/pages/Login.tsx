import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserCheck, GraduationCap } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role: 'trainer' | 'teacher') => {
    login(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-3 md:p-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary" onClick={() => handleLogin('trainer')}>
            <CardHeader className="text-center pb-3 md:pb-4">
              <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
                <UserCheck className="h-7 w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <CardTitle className="text-xl md:text-2xl">Login as Trainer</CardTitle>
              <CardDescription className="text-sm md:text-base">
                PDLC Trainer Portal Access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Create and manage training sessions</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Mark teacher and student attendance</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Enter student assessments</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Access comprehensive reports and analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Manage repository and hybrid workflows</span>
                </li>
              </ul>
              <Button className="w-full" size="lg">
                Continue as Trainer
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-secondary" onClick={() => handleLogin('teacher')}>
            <CardHeader className="text-center pb-3 md:pb-4">
              <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
                <GraduationCap className="h-7 w-7 md:h-8 md:w-8 text-secondary" />
              </div>
              <CardTitle className="text-xl md:text-2xl">Login as Teacher</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Teacher Portal Access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>View assigned training sessions</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Mark student assessments</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>View leaderboard position</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Access school-level reports</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Track student progress</span>
                </li>
              </ul>
              <Button className="w-full bg-secondary hover:bg-secondary/90" size="lg">
                Continue as Teacher
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 md:mt-8 text-center text-xs md:text-sm text-muted-foreground">
          <p>For demo purposes, click either card to simulate login</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
