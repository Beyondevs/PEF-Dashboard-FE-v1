import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ClientHeader = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-end px-4 md:px-6 sticky top-0 z-50 shadow-sm">
      <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0 h-9 sm:h-10">
        <LogOut className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Logout</span>
      </Button>
    </header>
  );
};

