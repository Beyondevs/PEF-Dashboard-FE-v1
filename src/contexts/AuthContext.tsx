import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { UserRole } from '@/types';
import { login as apiLogin, getProfile, refresh } from '@/lib/api';
import { STORAGE_KEYS } from '@/lib/config';
import { clearAllFilterStorage } from './FilterContext';

interface AuthContextType {
  role: UserRole | null;
  userName: string;
  userId: string | null;
  email: string | null;
  divisionId: string | null;
  divisionName: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  ensureFreshToken: () => Promise<void>;
  isAdmin: () => boolean;
  isDivisionRole: () => boolean;
  canEdit: () => boolean;
  canDelete: () => boolean;
  canMarkAttendance: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [divisionId, setDivisionId] = useState<string | null>(null);
  const [divisionName, setDivisionName] = useState<string | null>(null);
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

  const login = async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiLogin({ identifier, password });
      const { accessToken, refreshToken, role: userRole, user } = response.data;
      
      // Store tokens
      localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
      localStorage.setItem(STORAGE_KEYS.userRole, userRole);
      
      // Set state
      setRole(userRole);
      setUserId(user.id);
      setEmail(user.email);
      
      // Fetch profile to get division info for division_role users
      if (userRole === 'division_role') {
        try {
          const profileResponse = await getProfile();
          const { profile } = profileResponse.data;
          if (profile?.division) {
            setDivisionId(profile.division.id || profile.divisionId);
            setDivisionName(profile.division.name);
            localStorage.setItem(STORAGE_KEYS.divisionId, profile.division.id || profile.divisionId);
            localStorage.setItem(STORAGE_KEYS.divisionName, profile.division.name);
          }
        } catch (error) {
          console.error('Failed to fetch profile after login:', error);
        }
      }
      
      // Set user name from API response (preferred) or fallback to role-based default
      if (user.name) {
        setUserName(user.name);
      } else {
        // Fallback to role-based defaults if name not provided
        const nameMap: Record<UserRole, string> = {
          admin: 'Administrator',
          client: 'Client User',
          trainer: 'Trainer',
          teacher: 'Teacher',
          student: 'Student',
          division_role: 'Division User',
          bnu: 'BNU User',
        };
        setUserName(nameMap[userRole] || 'User');
      }

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
    localStorage.removeItem(STORAGE_KEYS.divisionId);
    localStorage.removeItem(STORAGE_KEYS.divisionName);
    
    // Clear all filter storage to ensure fresh filters on next login
    clearAllFilterStorage();
    
    // Reset state
    setRole(null);
    setUserId(null);
    setEmail(null);
    setUserName('');
    setDivisionId(null);
    setDivisionName(null);

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
        setDivisionId(null);
        setDivisionName(null);
        return;
      }

      // Validate token with backend (this call benefits from request-time refresh)
      const response = await getProfile();
      const { role: userRole, id, email: userEmail, profile } = response.data;
      
      setRole(userRole);
      setUserId(id);
      setEmail(userEmail);
      
      // Set division info for division_role users
      if (userRole === 'division_role' && profile?.division) {
        setDivisionId(profile.division.id || profile.divisionId);
        setDivisionName(profile.division.name);
        // Store in localStorage for persistence
        localStorage.setItem(STORAGE_KEYS.divisionId, profile.division.id || profile.divisionId);
        localStorage.setItem(STORAGE_KEYS.divisionName, profile.division.name);
      } else {
        setDivisionId(null);
        setDivisionName(null);
        localStorage.removeItem(STORAGE_KEYS.divisionId);
        localStorage.removeItem(STORAGE_KEYS.divisionName);
      }
      
      // Set user name from profile (preferred) or fallback to role-based default
      if (profile?.name) {
        setUserName(profile.name);
      } else {
        // Fallback to role-based defaults if name not provided
        const nameMap: Record<UserRole, string> = {
          admin: 'Administrator',
          client: 'Client User',
          trainer: 'Trainer',
          teacher: 'Teacher',
          student: 'Student',
          division_role: profile?.division?.name || 'Division User',
          bnu: 'BNU User',
        };
        setUserName(nameMap[userRole] || 'User');
      }

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
      // Don't redirect if we're already on the login page
      const currentPath = window.location.pathname;
      if (currentPath === '/login') {
        console.log('Already on login page, skipping redirect');
        return;
      }
      
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
        // Don't redirect if already on login page
        if (window.location.pathname !== '/login') {
        window.location.href = '/login';
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Permission helper functions
  // division_role is view-only across the app
  const isAdmin = () => role === 'admin';
  const isDivisionRole = () => role === 'division_role';
  const canEdit = () => role === 'admin';
  const canDelete = () => role === 'admin';
  const canMarkAttendance = () => role === 'admin' || role === 'trainer';

  return (
    <AuthContext.Provider value={{ 
      role, 
      userName, 
      userId, 
      email, 
      divisionId,
      divisionName,
      isLoading, 
      login, 
      logout, 
      checkAuth, 
      ensureFreshToken,
      isAdmin,
      isDivisionRole,
      canEdit,
      canDelete,
      canMarkAttendance
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
