import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AuthUser } from '../types/bankora.ts';
import { bankoraApi, setMemoryAccessToken } from '../services/api.ts';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logoutMessage: string | null;
  logoutModalOpen: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (payload: {
    full_name: string;
    email: string;
    phone_number?: string;
    password: string;
    confirm_password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  requestLogoutConfirmation: () => void;
  closeLogoutModal: () => void;
  updateProfile: (fullName: string, phoneNumber?: string) => Promise<void>;
  clearLogoutMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState<boolean>(false);

  // Store refresh token in memory / session storage only as fallback for sandboxed cross-origin environments
  const refreshTokenRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const scheduleTokenRefresh = useCallback((expiresInSeconds = 14 * 60) => {
    clearRefreshTimer();
    refreshTimerRef.current = window.setTimeout(async () => {
      try {
        const res = await bankoraApi.refresh(refreshTokenRef.current || undefined);
        if (res.accessToken) {
          setMemoryAccessToken(res.accessToken);
          setUser(res.user);
          scheduleTokenRefresh(14 * 60);
        }
      } catch {
        // If refresh fails, silently clear session
        setMemoryAccessToken(null);
        setUser(null);
      }
    }, Math.max(60000, (expiresInSeconds - 60) * 1000));
  }, []);

  // Initial session restoration on mount
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      try {
        const res = await bankoraApi.getMe();
        if (isMounted && res.user) {
          setUser(res.user);
          if (res.accessToken) {
            setMemoryAccessToken(res.accessToken);
            scheduleTokenRefresh(14 * 60);
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setMemoryAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
      clearRefreshTimer();
    };
  }, [scheduleTokenRefresh]);

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    setLogoutMessage(null);
    try {
      const res = await bankoraApi.login({ email, password, rememberMe });
      setMemoryAccessToken(res.accessToken);
      if (res.refreshToken) {
        refreshTokenRef.current = res.refreshToken;
      }
      setUser(res.user);
      scheduleTokenRefresh(14 * 60);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    full_name: string;
    email: string;
    phone_number?: string;
    password: string;
    confirm_password: string;
  }) => {
    setIsLoading(true);
    setLogoutMessage(null);
    try {
      const res = await bankoraApi.register(payload);
      setMemoryAccessToken(res.accessToken);
      if (res.refreshToken) {
        refreshTokenRef.current = res.refreshToken;
      }
      setUser(res.user);
      scheduleTokenRefresh(14 * 60);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    clearRefreshTimer();
    try {
      await bankoraApi.logout(refreshTokenRef.current || undefined);
    } catch {
      // Ignore network errors on logout
    } finally {
      refreshTokenRef.current = null;
      setMemoryAccessToken(null);
      setUser(null);
      setLogoutModalOpen(false);
      setLogoutMessage('You have been securely logged out of your BANKORA workspace.');
    }
  };

  const requestLogoutConfirmation = () => {
    setLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setLogoutModalOpen(false);
  };

  const updateProfile = async (fullName: string, phoneNumber?: string) => {
    const res = await bankoraApi.updateProfile({
      full_name: fullName,
      phone_number: phoneNumber
    });
    setUser(res.user);
  };

  const clearLogoutMessage = () => {
    setLogoutMessage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logoutMessage,
        logoutModalOpen,
        login,
        register,
        logout,
        requestLogoutConfirmation,
        closeLogoutModal,
        updateProfile,
        clearLogoutMessage
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
