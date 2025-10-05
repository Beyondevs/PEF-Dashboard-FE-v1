import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { FilterBar } from './FilterBar';
import { SidebarProvider } from './ui/sidebar';

export const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!role) {
      navigate('/login');
    }
  }, [role, navigate]);

  if (!role) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <FilterBar />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
