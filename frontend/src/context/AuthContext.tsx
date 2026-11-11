import React, { createContext, useContext, useState } from 'react';
import { User } from '../types/product';
import { apiService, DEFAULT_API_URL, setApiUrl as setServiceApiUrl } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  apiUrl: string;
  login: (username: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateApiUrl: (url: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  apiUrl: DEFAULT_API_URL,
  login: async () => ({ success: false }),
  logout: () => {},
  updateApiUrl: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [apiUrl, setApiUrlState] = useState<string>(DEFAULT_API_URL);

  const login = async (username: string, pass: string) => {
    const res = await apiService.login(username, pass);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'Đăng nhập thất bại' };
  };

  const logout = () => {
    setUser(null);
  };

  const updateApiUrl = (url: string) => {
    setApiUrlState(url);
    setServiceApiUrl(url);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        apiUrl,
        login,
        logout,
        updateApiUrl
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
