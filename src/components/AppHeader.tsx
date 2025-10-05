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
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <img
            src="https://www.pef.edu.pk/images/logo/pef-logo_2.png"
            alt="PEF Logo"
            className="h-8 md:h-10"
          />
          <img
            src="https://premierdlc.com/wp-content/uploads/2018/01/logo.png"
            alt="Premier DLC Logo"
            className="h-8 md:h-10"
          />
        </div>
        <div className="h-8 md:h-10 w-px bg-border shrink-0" />
        <div className="min-w-0">
          <h1 className="text-base md:text-xl font-bold text-foreground truncate">
            Punjab English Training Portal
          </h1>
          <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
            Monitoring & Management System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground capitalize">{role}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
          <LogOut className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};
