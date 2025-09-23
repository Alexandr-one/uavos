"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,          
} from "react";
import Cookies from "js-cookie";

interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = async (): Promise<boolean> => {
    const storedToken = Cookies.get("token");
    const storedUser = Cookies.get("user");

    if (!storedToken || !storedUser) {
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_HOST + "/auth/check", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData: User = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        return true;
      } else {
        Cookies.remove("token");
        Cookies.remove("user");
        setToken(null);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      Cookies.remove("token");
      Cookies.remove("user");
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

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_HOST + "/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.access_token) {
        Cookies.set("token", data.access_token, { expires: 7 });
        Cookies.set("user", JSON.stringify(data.user), { expires: 7 });

        setToken(data.access_token);
        setUser(data.user);

        return { success: true };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      return { success: false, message: "Network error" };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch(process.env.NEXT_PUBLIC_API_HOST + "/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      Cookies.remove("token");
      Cookies.remove("user");
      setToken(null);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
