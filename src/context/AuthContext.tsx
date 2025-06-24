import React, { createContext, useContext, useState, type ReactNode } from 'react';

// Define the shape of our auth state
interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  credits: number;
}

// Define the shape of our context
interface AuthContextType extends AuthState {
  login: (email: string) => void;
  logout: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userEmail: null,
  credits: 0,
  login: () => {},
  logout: () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize state from sessionStorage if available
  const [authState, setAuthState] = useState<AuthState>(() => {
    const storedEmail = sessionStorage.getItem('userEmail');
    return {
      isAuthenticated: !!storedEmail,
      userEmail: storedEmail,
      credits: 0,  // Default value, would normally come from API
    };
  });

  // Login function
  const login = (email: string) => {
    sessionStorage.setItem('userEmail', email);
    setAuthState({
      isAuthenticated: true,
      userEmail: email,
      credits: 0,  // Default value, would normally come from API
    });
  };

  // Logout function
  const logout = () => {
    sessionStorage.removeItem('userEmail');
    setAuthState({
      isAuthenticated: false,
      userEmail: null,
      credits: 0,
    });
  };

  // Provide the context value
  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
