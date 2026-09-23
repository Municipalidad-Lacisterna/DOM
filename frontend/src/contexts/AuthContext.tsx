import { createContext, useContext, useState, type ReactNode } from "react";
import { api, KEY_TOKEN } from "../lib/api";
import type { Funcionario, LoginResponse } from "../lib/types";

const KEY_FUNCIONARIO = "dom_funcionario";

interface AuthContextValue {
  rol: "funcionario" | null;
  funcionario: Funcionario | null;
  login: (rut: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Autenticación REAL (Fase 4): login con RUT + contraseña contra
 * /api/auth/login → JWT Bearer.
 *
 * Los accesos a localStorage van por helpers con try/catch porque
 * navegadores endurecidos (LibreWolf modo máximo, incógnito) BLOQUEAN
 * el storage y lanzan SecurityError; antes eso tiraba la app. Si el
 * storage no está disponible, la sesión simplemente no persiste entre
 * recargas, pero la app sigue viva.
 */
function leerTokenLocal(): string | null {
  try {
    return localStorage.getItem(KEY_TOKEN);
  } catch {
    return null;
  }
}

function leerFuncionarioLocal(): Funcionario | null {
  try {
    const raw = localStorage.getItem(KEY_FUNCIONARIO);
    return raw ? (JSON.parse(raw) as Funcionario) : null;
  } catch {
    return null;
  }
}

function guardarLocal(key: string, valor: string | null) {
  try {
    if (valor) localStorage.setItem(key, valor);
    else localStorage.removeItem(key);
  } catch {
    // storage bloqueado → no se persiste, la sesión queda en memoria
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(leerTokenLocal);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(leerFuncionarioLocal);

  const login = async (rut: string, password: string) => {
    const res = await api.post<LoginResponse>("/auth/login", { rut, password });
    guardarLocal(KEY_TOKEN, res.access_token);
    guardarLocal(KEY_FUNCIONARIO, JSON.stringify(res.funcionario));
    setToken(res.access_token);
    setFuncionario(res.funcionario);
  };

  const logout = () => {
    guardarLocal(KEY_TOKEN, null);
    guardarLocal(KEY_FUNCIONARIO, null);
    setToken(null);
    setFuncionario(null);
  };

  const rol = token && funcionario ? "funcionario" : null;

  return (
    <AuthContext.Provider value={{ rol, funcionario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}