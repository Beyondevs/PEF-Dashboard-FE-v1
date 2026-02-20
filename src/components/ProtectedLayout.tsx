import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { ClientHeader } from './ClientHeader';
import { FilterBar } from './FilterBar';
import LoginPopup from './LoginPopup';
import { SidebarProvider } from './ui/sidebar';
import { toast } from '@/hooks/use-toast';

export const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect to login if we're not loading and there's no role
    // and we're not already on the login page
    if (!isLoading && !role && location.pathname !== '/login') {
      const lastPath = location.pathname + location.search;
      try { localStorage.setItem('pef.lastPath', lastPath); } catch {}
      navigate(`/login?returnTo=${encodeURIComponent(lastPath)}`);
    }
    // Removed client redirect restriction - clients can now view all pages
  }, [role, isLoading, navigate, location.pathname]);

  useEffect(() => {
    const onExpired = () => {
      toast({ title: 'Session expired', description: 'Please sign in again to continue.' });
    };
    window.addEventListener('pef:session-expired' as any, onExpired as any);
    return () => window.removeEventListener('pef:session-expired' as any, onExpired as any);
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not loading and no role, return null (will redirect)
  if (!role) {
    return null;
  }

  // All roles: full layout with sidebar and header (client has view-only access)
  return (
    <SidebarProvider>
      <LoginPopup />
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <FilterBar />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-[1600px] mx-auto animate-page-enter">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
