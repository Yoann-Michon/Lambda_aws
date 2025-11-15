import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = api.auth.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const data = await api.auth.login(email, password);
      setCurrentUser(data.user);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const signup = useCallback(async (email, password, name) => {
    try {
      await api.auth.signup(email, password, name);
      return await login(email, password);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [login]);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setCurrentUser(null);
  }, []);

  const isAdmin = useCallback(() => {
    return currentUser?.groups?.includes('admin');
  }, [currentUser]);

  const isEditor = useCallback(() => {
    return currentUser?.groups?.includes('editor');
  }, [currentUser]);

  const isGuest = useCallback(() => {
    return currentUser?.groups?.includes('guest');
  }, [currentUser]);

  // Vérifier si l'utilisateur peut créer/éditer des posts (editor ou admin)
  const canCreatePosts = useCallback(() => {
    return isEditor() || isAdmin();
  }, [isEditor, isAdmin]);

  const value = useMemo(() => ({
    currentUser,
    loading,
    login,
    signup,
    logout,
    isAdmin,
    isEditor,
    isGuest,
    canCreatePosts,
    isAuthenticated: !!currentUser
  }), [currentUser, loading, login, signup, logout, isAdmin, isEditor, isGuest, canCreatePosts]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};