import { createContext, useState, useEffect, useContext } from "react";
import type { User } from "../api/auth";
import {
  getMe,
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
} from "../api/auth";
import { ApiError } from "../api/client";
type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    getMe()
      .then((user) => {
        setUser(user);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          setUser(null);
        } else {
          console.error(e);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const user = await loginApi(email, password);
    setUser(user);
  }
  async function register(email: string, password: string) {
    const user = await registerApi(email, password);
    setUser(user);
  }

  async function logout() {
    await logoutApi();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (value === null)
    throw new Error("useAuth must be used within an AuthProvider");
  return value;
}
