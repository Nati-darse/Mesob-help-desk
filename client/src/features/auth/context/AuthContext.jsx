import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore user from localStorage on app load
        const storedUser = localStorage.getItem('mesob_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
                axios.defaults.headers.common['x-tenant-id'] = String(parsedUser.companyId || '');
            } catch (e) {
                console.error('Failed to parse stored user');
                localStorage.removeItem('mesob_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            setUser(res.data);
            localStorage.setItem('mesob_user', JSON.stringify(res.data));
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            axios.defaults.headers.common['x-tenant-id'] = String(res.data.companyId || '');
            return { success: true, user: res.data };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const res = await axios.post('/api/auth/register', userData);
            setUser(res.data);
            localStorage.setItem('mesob_user', JSON.stringify(res.data));
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            axios.defaults.headers.common['x-tenant-id'] = String(res.data.companyId || '');
            return { success: true, user: res.data };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mesob_user');
        delete axios.defaults.headers.common['Authorization'];
        delete axios.defaults.headers.common['x-tenant-id'];
    };

    const updateAvailability = async (isAvailable) => {
        try {
            await axios.put('/api/users/availability', { isAvailable });
            const updatedUser = { ...user, isAvailable };
            setUser(updatedUser);
            localStorage.setItem('mesob_user', JSON.stringify(updatedUser));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Failed to update availability' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateAvailability }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
