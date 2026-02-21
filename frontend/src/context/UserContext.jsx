import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, getUser } from '../api/client';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (upiId, password) => {
        const response = await apiLogin(upiId, password);
        if (response.data.success) {
            const userData = response.data.user;
            const token = response.data.token;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', token);
            return { success: true };
        }
        return { success: false, error: response.data.error };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        apiLogout();
    };

    const refreshUser = async () => {
        if (!user) return;
        try {
            const response = await getUser(user.id);
            if (response.data.success) {
                const userData = response.data.user;
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            }
        } catch (e) {
            console.error('Failed to refresh user data', e);
        }
    };

    return (
        <UserContext.Provider value={{ user, login, logout, refreshUser, isAuthenticated: !!user, loading }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);
