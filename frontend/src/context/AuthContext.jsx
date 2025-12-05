import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = () => {
            const authenticated = authService.isAuthenticated();
            const currentUser = authService.getCurrentUser();

            setIsAuthenticated(authenticated);
            setUser(currentUser);
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);
            const currentUser = authService.getCurrentUser();

            setUser(currentUser);
            setIsAuthenticated(true);

            return { success: true, data: response };
        } catch (error) {
            return { success: false, error };
        }
    };

    const signup = async (name, email, password, role) => {
        try {
            const response = await authService.signup(name, email, password, role);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error };
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
