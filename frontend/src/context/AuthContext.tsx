import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchRoleQuick: (role: 'admin' | 'doctor' | 'staff') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const me = await api.getMe();
          setUser(me);
        } catch {
          api.setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    api.setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  const switchRoleQuick = async (role: 'admin' | 'doctor' | 'staff') => {
    const creds = {
      admin: { username: 'admin', pass: 'Admin@123' },
      doctor: { username: 'dr.sharma', pass: 'Doctor@123' },
      staff: { username: 'nurse.priya', pass: 'Staff@123' },
    }[role];

    try {
      await login(creds.username, creds.pass);
    } catch (e) {
      console.error('Role switch failed', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRoleQuick }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
