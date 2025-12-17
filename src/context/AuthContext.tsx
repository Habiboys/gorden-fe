import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                const savedUser = localStorage.getItem('user');

                if (token && savedUser) {
                    // Ideally verify token with backend here
                    // const { data } = await authApi.me();
                    // setUser(data);

                    // For now trust localStorage to avoid flicker, verification happens on api calls
                    setUser(JSON.parse(savedUser));
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // Legacy support for existing admin check in components
        if (userData.role === 'admin' || userData.role === 'ADMIN') {
            localStorage.setItem('adminAuth', 'true');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('adminAuth'); // Clear legacy
        localStorage.removeItem('adminUser'); // Clear legacy
        setUser(null);
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'ADMIN',
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
