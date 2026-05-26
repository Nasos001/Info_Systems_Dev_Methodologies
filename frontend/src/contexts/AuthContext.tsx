import { createContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: number;
  full_name: string;
  email: string;
}

interface Session {
  token: string;
  role: 'citizen' | 'admin' | 'technician';
  user: User;
}

interface AuthContextType {
  session: Session | null;
  setSession: (session: Session | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<Session | null>(null);

  useEffect(() => {
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      try {
        setSessionState(JSON.parse(storedSession));
      } catch (e) {
        localStorage.removeItem('session');
      }
    }
  }, []);

  const setSession = (newSession: Session | null) => {
    if (newSession) {
      localStorage.setItem('session', JSON.stringify(newSession));
    } else {
      localStorage.removeItem('session');
    }
    setSessionState(newSession);
  };

  const logout = () => {
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, setSession, logout, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  );
};
