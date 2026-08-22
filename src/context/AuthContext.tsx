import axios, { type AxiosError } from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type User = {
  id: string;
  name: string;
  email: string;
};

export type RegisterOutcome =
  | { ok: true; needsVerification: boolean }
  | { ok: false; message: string };

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<RegisterOutcome>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('Mindful_users');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/login`, {
        email,
        password,
      });

      const data = response.data;

      if (data.success) {
        const loggedInUser = {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
        };

        setUser(loggedInUser);
        localStorage.setItem('Mindful_users', JSON.stringify(loggedInUser));
        localStorage.setItem('auth-token', data.token);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      setIsLoading(false);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        const body = error.response.data as { error?: string };
        throw new Error(body?.error || 'Please verify your email before signing in.');
      }
      return false;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    const response = await axios.post(`${API_BASE}/auth/google`, { credential });
    const data = response.data;
    if (!data?.success || !data.user?._id) {
      throw new Error(data?.error || 'Google sign-in failed');
    }

    const loggedInUser = {
      id: data.user._id,
      name: data.user.name,
      email: data.user.email,
    };
    setUser(loggedInUser);
    localStorage.setItem('Mindful_users', JSON.stringify(loggedInUser));
    localStorage.setItem('auth-token', data.token);
  };

  const register = async (name: string, email: string, password: string): Promise<RegisterOutcome> => {
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/signup`, {
        name,
        email,
        password,
      });

      const data = response.data;

      if (!data?.success) {
        setIsLoading(false);
        return {
          ok: false,
          message: data?.errors || data?.error || 'Registration failed',
        };
      }

      if (data.requiresVerification) {
        const trimmed = email.trim();
        if (trimmed) sessionStorage.setItem('pendingVerificationEmail', trimmed);
        if (typeof data.verificationLink === 'string' && data.verificationLink) {
          sessionStorage.setItem('devVerificationLink', data.verificationLink);
        } else {
          sessionStorage.removeItem('devVerificationLink');
        }
        setIsLoading(false);
        return { ok: true, needsVerification: true };
      }

      const u = data.user as { _id?: string; name?: string; email?: string } | undefined;
      if (u?._id) {
        const registeredUser = {
          id: u._id,
          name: u.name ?? '',
          email: u.email ?? '',
        };
        setUser(registeredUser);
        localStorage.setItem('Mindful_users', JSON.stringify(registeredUser));
      }

      setIsLoading(false);
      return { ok: true, needsVerification: false };
    } catch (error) {
      setIsLoading(false);
      const ax = error as AxiosError<{ errors?: string; error?: string }>;
      if (axios.isAxiosError(ax) && ax.response?.data) {
        const d = ax.response.data;
        const msg = d.errors || d.error || ax.message;
        return { ok: false, message: String(msg) };
      }
      if (axios.isAxiosError(ax) && ax.code === 'ERR_NETWORK') {
        return {
          ok: false,
          message: 'Cannot reach the server. Start the backend on port 4000 and try again.',
        };
      }
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('Mindful_users');
    localStorage.removeItem('auth-token');
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
