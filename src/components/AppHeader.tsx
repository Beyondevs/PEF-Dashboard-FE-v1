import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AppHeader = () => {
  const { userName, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <img
            src="https://www.pef.edu.pk/images/logo/pef-logo_2.png"
            alt="PEF Logo"
            className="h-10"
          />
          <img
            src="https://premierdlc.com/wp-content/uploads/2018/01/logo.png"
            alt="Premier DLC Logo"
            className="h-10"
          />
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Punjab English Training Portal
          </h1>
          <p className="text-xs text-muted-foreground">Monitoring & Management System</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground capitalize">{role}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
};
