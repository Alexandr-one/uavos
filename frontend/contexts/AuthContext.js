'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const storedToken = Cookies.get('token');
    const storedUser = Cookies.get('user');
    
    if (!storedToken || !storedUser) {
      setIsLoading(false);
      return false;
    }

    try {
      // Проверяем токен на сервере
      const response = await fetch('http://localhost:3003/auth/check', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        return true;
      } else {
        // Токен невалиден - очищаем
        Cookies.remove('token');
        Cookies.remove('user');
        setToken(null);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('token');
      Cookies.remove('user');
      setToken(null);
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:3003/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.access_token) {
        Cookies.set('token', data.access_token, { expires: 7 });
        Cookies.set('user', JSON.stringify(data.user), { expires: 7 });
        
        setToken(data.access_token);
        setUser(data.user);
        
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      // Опционально: сообщаем серверу о logout
      await fetch('http://localhost:3003/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('token');
      Cookies.remove('user');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    checkAuth, // Экспортируем функцию проверки
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
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