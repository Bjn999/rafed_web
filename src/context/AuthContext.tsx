'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface Tenant {
  id: number;
  name: string;
  name_en?: string | null;
  commercial_registration?: string | null;
  tax_number?: string | null;
  billing_details?: string | null;
  domain: string;
  status: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone_number?: string;
  job_title?: string;
}

export interface User {
  id: number;
  email: string;
  tenant_id: number;
  status: string;
  role?: string;
  tenant?: Tenant;
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  refreshProfile: () => void;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Read initial token synchronously on mount (if in browser) to prevent flash of redirect
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return Cookies.get('auth_token') || null;
    }
    return null;
  });

  // Read initial token on mount to keep in sync
  useEffect(() => {
    const savedToken = Cookies.get('auth_token');
    if (savedToken && savedToken !== token) {
      setToken(savedToken);
    }
  }, [token]);

  // Fetch profile when token exists
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['profile', token],
    queryFn: async () => {
      if (!token) return null;
      try {
        const response = await api.get<{ success: boolean; data: { user: User } }>('/profile');
        return response.data.user;
      } catch (err) {
        // Clear token if request fails (e.g. token expired, database reset, 401 unauthorized)
        Cookies.remove('auth_token');
        setToken(null);
        queryClient.removeQueries({ queryKey: ['profile'] });
        router.push('/login');
        throw err;
      }
    },
    enabled: !!token,
    retry: false,
  });

  const user = data || null;
  const tenant = user?.tenant || null;
  const profile = user?.profile || null;

  const handleLogin = (newToken: string, userData: User) => {
    Cookies.set('auth_token', newToken, { expires: 7 }); // Keep logged in for 7 days
    setToken(newToken);
    queryClient.setQueryData(['profile', newToken], userData);
    if (userData.role === 'system_admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      Cookies.remove('auth_token');
      setToken(null);
      queryClient.removeQueries({ queryKey: ['profile'] });
      router.push('/login');
    }
  };

  const handleUpdateProfile = async (profileData: Partial<UserProfile>) => {
    await api.put('/profile', profileData);
    await refetch();
  };

  const value: AuthContextType = {
    user,
    tenant,
    profile,
    isLoading: !!token && isLoading,
    login: handleLogin,
    logout: handleLogout,
    refreshProfile: refetch,
    updateProfile: handleUpdateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
