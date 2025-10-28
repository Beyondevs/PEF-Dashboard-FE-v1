import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { UserRole } from '@/types';
import { login as apiLogin, getProfile, refresh } from '@/lib/api';
import { STORAGE_KEYS } from '@/lib/config';

interface AuthContextType {
  role: UserRole | null;
  userName: string;
  userId: string | null;
  email: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  ensureFreshToken: () => Promise<void>;
  isAdmin: () => boolean;
  canEdit: () => boolean;
  canDelete: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const refreshTimeoutRef = useRef<number | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  };

  const scheduleProactiveRefresh = (accessToken: string) => {
    clearRefreshTimer();
    try {
      const parts = accessToken.split('.');
      if (parts.length !== 3) return; // not a JWT
      const payload = JSON.parse(atob(parts[1]));
      const expSeconds = payload.exp as number | undefined;
      if (!expSeconds) return;
      const expMs = expSeconds * 1000;
      const now = Date.now();
      const leadMs = 60_000; // refresh 60s before expiry
      const delay = Math.max(1_000, expMs - now - leadMs);
      refreshTimeoutRef.current = window.setTimeout(() => {
        performRefresh().catch(() => {
          // If proactive refresh fails, let request-time refresh handle user flow
        });
      }, delay);
    } catch {
      // ignore parse errors
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiLogin({ email, password });
      const { accessToken, refreshToken, role: userRole, user } = response.data;
      
      // Store tokens
      localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
      localStorage.setItem(STORAGE_KEYS.userRole, userRole);
      
      // Set state
      setRole(userRole);
      setUserId(user.id);
      setEmail(user.email);
      
      // Set user name based on role
      const nameMap: Record<UserRole, string> = {
        admin: 'Administrator',
        client: 'Client User',
        trainer: 'Trainer Ahmed Khan',
        teacher: 'Teacher Fatima Ali',
        student: 'Student Ali Ahmed',
      };
      setUserName(nameMap[userRole] || 'User');

      scheduleProactiveRefresh(accessToken);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear tokens
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.userRole);
    
    // Reset state
    setRole(null);
    setUserId(null);
    setEmail(null);
    setUserName('');

    clearRefreshTimer();
    // Store current path for redirect after login
    try {
      localStorage.setItem('pef.lastPath', window.location.pathname + window.location.search);
    } catch {}
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const storedToken = localStorage.getItem(STORAGE_KEYS.accessToken);
      const storedRole = localStorage.getItem(STORAGE_KEYS.userRole) as UserRole;
      
      if (!storedToken || !storedRole) {
        // No stored credentials, user needs to login
        setRole(null);
        setUserId(null);
        setEmail(null);
        setUserName('');
        return;
      }

      // Validate token with backend (this call benefits from request-time refresh)
      const response = await getProfile();
      const { role: userRole, id, email: userEmail } = response.data;
      
      setRole(userRole);
      setUserId(id);
      setEmail(userEmail);
      
      // Set user name based on role
      const nameMap: Record<UserRole, string> = {
        admin: 'Administrator',
        client: 'Client User',
        trainer: 'Trainer Ahmed Khan',
        teacher: 'Teacher Fatima Ali',
        student: 'Student Ali Ahmed',
      };
      setUserName(nameMap[userRole] || 'User');

      scheduleProactiveRefresh(storedToken);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only logout if it's an authentication error, not a network error
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        logout();
      } else {
        // For network errors, keep the stored state but mark as not loading
        console.warn('Network error during auth check, keeping current state');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const performRefresh = async () => {
    try {
      const storedRefresh = localStorage.getItem(STORAGE_KEYS.refreshToken);
      if (!storedRefresh) throw new Error('No refresh token');
      const response = await refresh(storedRefresh);
      const { accessToken, refreshToken } = response.data as any;
      if (accessToken && refreshToken) {
        localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
        localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
        scheduleProactiveRefresh(accessToken);
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (e) {
      // On refresh failure, do not instantly logout; allow request-time handler to surface UX
      throw e;
    }
  };

  const ensureFreshToken = async () => {
    try {
      await performRefresh();
    } catch {
      // ignore here
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Listen for session-expired events to guide UX and logout gracefully
  useEffect(() => {
    const onExpired = () => {
      // Preserve current route then logout
      const lastPath = window.location.pathname + window.location.search;
      try { localStorage.setItem('pef.lastPath', lastPath); } catch {}
      logout();
      // Trigger navigation via window.location to avoid router dependency
      window.location.href = `/login?returnTo=${encodeURIComponent(lastPath)}`;
    };
    window.addEventListener('pef:session-expired' as any, onExpired as any);
    return () => window.removeEventListener('pef:session-expired' as any, onExpired as any);
  }, []);

  // Multi-tab sync for login/logout/refresh via storage events
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === STORAGE_KEYS.accessToken) {
        const token = e.newValue;
        if (token) {
          scheduleProactiveRefresh(token);
        }
      }
      if (e.key === STORAGE_KEYS.userRole && e.newValue === null) {
        // Another tab logged out
        logout();
        window.location.href = '/login';
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Permission helper functions
  const isAdmin = () => role === 'admin';
  const canEdit = () => role === 'admin';
  const canDelete = () => role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      role, 
      userName, 
      userId, 
      email, 
      isLoading, 
      login, 
      logout, 
      checkAuth, 
      ensureFreshToken,
      isAdmin,
      canEdit,
      canDelete
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
