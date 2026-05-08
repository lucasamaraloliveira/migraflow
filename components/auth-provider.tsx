'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logout } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  const signOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signOut }}>
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
  const { user, login } = useAuth();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 font-sans">MigraFlow</h1>
            <p className="mt-2 text-sm text-gray-600">Sistema de Gestão de Migrações</p>
          </div>
          <button
            onClick={login}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all active:scale-95"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
