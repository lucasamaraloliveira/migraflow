'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logout } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  login: () => Promise<void>;
  loginAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if was previously guest in this session
    const guestSession = sessionStorage.getItem('isGuest') === 'true';
    if (guestSession) setIsGuest(true);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setIsGuest(false); // Google login overrides guest
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithGoogle();
      setIsGuest(false);
      sessionStorage.removeItem('isGuest');
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    sessionStorage.setItem('isGuest', 'true');
  };

  const signOut = async () => {
    try {
      await logout();
      setIsGuest(false);
      sessionStorage.removeItem('isGuest');
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, login, loginAsGuest, signOut }}>
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isGuest, login, loginAsGuest } = useAuth();

  if (!user && !isGuest) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 font-sans">MigraFlow</h1>
            <p className="mt-2 text-sm text-gray-600">Sistema de Gestão de Migrações</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={login}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all active:scale-95"
            >
              Entrar com Google
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400 font-medium">Ou acesse como</span>
              </div>
            </div>

            <button
              onClick={loginAsGuest}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 transition-all active:scale-95"
            >
              Visitante (Apenas Visualização)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
