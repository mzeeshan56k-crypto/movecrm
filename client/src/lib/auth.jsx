import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, clearToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then((d) => { setUser(d.user); setOrganization(d.organization); })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(d.token);
    setUser(d.user);
    const me = await api('/auth/me').catch(() => null);
    if (me) setOrganization(me.organization);
  };

  const signup = async (payload) => {
    const d = await api('/auth/signup', { method: 'POST', body: payload });
    setToken(d.token);
    setUser(d.user);
    const me = await api('/auth/me').catch(() => null);
    if (me) setOrganization(me.organization);
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider value={{ user, organization, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
