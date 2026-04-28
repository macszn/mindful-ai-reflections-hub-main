import axios from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
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
  
  // On mount, check if user is stored in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('MindCare_users');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:4000/login', {
        email,
        password
      });

      const data = response.data;
      
      if (data.success) {
        const loggedInUser = {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email
        };
        
        setUser(loggedInUser);
        localStorage.setItem('MindCare_users', JSON.stringify(loggedInUser));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:4000/signup', { 
        name,
        email,
        password
      });

      const data = response.data;
      console.log('Registration response:', data);

      if (data.success) {
        const registeredUser = {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email
        };
        
        setUser(registeredUser);
        localStorage.setItem('MindCare_users', JSON.stringify(registeredUser));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };
    

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('MindCare_users');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
