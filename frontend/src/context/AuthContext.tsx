import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthResponse } from '../types';
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  getMeApi,
  loginApi,
  registerApi,
  googleAuthApi,
  updateProfileApi,
  changePasswordApi,
  unlinkGoogleApi,
  deleteAccountApi,
  getAuthConfigApi,
} from '../services/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalView: 'login' | 'register' | 'forgot';
  authConfig: { googleOAuthEnabled: boolean; googleClientId: string } | null;
  login: (email: string, password?: string) => Promise<User>;
  register: (data: {
    firstName: string;
    lastName?: string;
    email: string;
    password?: string;
    phone?: string;
  }) => Promise<User>;
  loginWithGoogle: (data?: {
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    idToken?: string;
  }) => Promise<User>;
  logout: () => void;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
  }) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
  unlinkGoogle: () => Promise<string>;
  deleteAccount: () => Promise<string>;
  openAuthModal: (view?: 'login' | 'register' | 'forgot', callback?: () => void) => void;
  closeAuthModal: () => void;
  executeWithAuth: (action: () => void) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | 'forgot'>('login');
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);
  const [authConfig, setAuthConfig] = useState<{
    googleOAuthEnabled: boolean;
    googleClientId: string;
  } | null>(null);

  // Load backend auth configuration (e.g. Google OAuth enabled status)
  useEffect(() => {
    getAuthConfigApi()
      .then((cfg) => setAuthConfig(cfg))
      .catch(() => {
        // Fallback default config
        setAuthConfig({ googleOAuthEnabled: true, googleClientId: '' });
      });
  }, []);

  // Check URL params for token (e.g. after Google OAuth redirect from backend)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token') || urlParams.get('oauth_token');

    if (urlToken) {
      setStoredToken(urlToken);
      setToken(urlToken);
      // Clean query parameter from URL without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Load user profile if token exists
  const loadUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await getMeApi();
      setUser(me);
    } catch (err) {
      console.warn('Failed to load user session, token may be expired:', err);
      removeStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [token, loadUser]);

  const handleAuthSuccess = (authRes: AuthResponse) => {
    setStoredToken(authRes.token);
    setToken(authRes.token);
    setUser(authRes.user);
    setAuthModalOpen(false);

    if (pendingCallback) {
      const cb = pendingCallback;
      setPendingCallback(null);
      setTimeout(() => cb(), 100);
    }
  };

  const login = async (email: string, password?: string): Promise<User> => {
    const res = await loginApi({ email, password });
    handleAuthSuccess(res);
    return res.user;
  };

  const register = async (data: {
    firstName: string;
    lastName?: string;
    email: string;
    password?: string;
    phone?: string;
  }): Promise<User> => {
    const res = await registerApi(data);
    handleAuthSuccess(res);
    return res.user;
  };

  const loginWithGoogle = async (data?: {
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    idToken?: string;
  }): Promise<User> => {
    if (data?.email) {
      const res = await googleAuthApi(data);
      handleAuthSuccess(res);
      return res.user;
    }

    // Default: Redirect to backend Spring Security Google OAuth endpoint
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    return new Promise(() => {}); // Halts execution as browser navigates
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
    setPendingCallback(null);
  };

  const updateProfile = async (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
  }): Promise<User> => {
    const updated = await updateProfileApi(data);
    setUser(updated);
    return updated;
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<string> => {
    return await changePasswordApi({ currentPassword, newPassword });
  };

  const unlinkGoogle = async (): Promise<string> => {
    const msg = await unlinkGoogleApi();
    await loadUser();
    return msg;
  };

  const deleteAccount = async (): Promise<string> => {
    const msg = await deleteAccountApi();
    logout();
    return msg;
  };

  const openAuthModal = (view: 'login' | 'register' | 'forgot' = 'login', callback?: () => void) => {
    setAuthModalView(view);
    if (callback) {
      setPendingCallback(() => callback);
    }
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setPendingCallback(null);
  };

  const executeWithAuth = (action: () => void) => {
    if (user && token) {
      action();
    } else {
      openAuthModal('login', action);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        authModalOpen,
        authModalView,
        authConfig,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
        changePassword,
        unlinkGoogle,
        deleteAccount,
        openAuthModal,
        closeAuthModal,
        executeWithAuth,
        refreshUser,
      }}
    >
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
