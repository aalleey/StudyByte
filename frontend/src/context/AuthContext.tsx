import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from '../lib/axios';
import type { LoginResponse, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, try to silently exchange the httpOnly refresh cookie (if
  // any) for a fresh access token, then load the current user.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const refreshRes = await api.post<{ data: { accessToken: string } }>('/auth/refresh');
        setAccessToken(refreshRes.data.data.accessToken);
        const meRes = await api.get<{ data: User }>('/auth/me');
        if (!cancelled) {
          setUser(meRes.data.data);
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ data: LoginResponse }>('/auth/login', { email, password });
    setAccessToken(res.data.data.accessToken);
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
