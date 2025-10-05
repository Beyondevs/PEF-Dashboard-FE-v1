import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '@/types';

interface AuthContextType {
  role: UserRole | null;
  userName: string;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');

  const login = (newRole: UserRole) => {
    setRole(newRole);
    setUserName(newRole === 'trainer' ? 'Trainer Ahmed Khan' : 'Teacher Fatima Ali');
  };

  const logout = () => {
    setRole(null);
    setUserName('');
  };

  return (
    <AuthContext.Provider value={{ role, userName, login, logout }}>
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
