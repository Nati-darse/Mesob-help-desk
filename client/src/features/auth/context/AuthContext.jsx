import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore user from sessionStorage on app load
        const storedUser = sessionStorage.getItem('mesob_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (e) {
                console.error('Failed to parse stored user');
                sessionStorage.removeItem('mesob_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            console.log('🔐 Attempting login for:', email);
            const res = await axios.post('/api/auth/login', { email, password });
            console.log('✅ Login successful:', res.data.role);

            // Ensure profilePic is included in user data
            const userData = {
                ...res.data,
                profilePic: res.data.profilePic || ''
            };

            setUser(userData);
            sessionStorage.setItem('mesob_user', JSON.stringify(userData));

            return { success: true, user: userData };
        } catch (error) {
            console.error('❌ Login failed:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const res = await axios.post('/api/auth/register', userData);
            const newUser = res.data;
            setUser(newUser);
            sessionStorage.setItem('mesob_user', JSON.stringify(newUser));
            return { success: true, user: newUser };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('mesob_user');
    };

    const updateAvailability = async (isAvailable) => {
        try {
            await axios.put('/api/users/availability', { isAvailable });
            const updatedUser = { ...user, isAvailable };
            setUser(updatedUser);
            sessionStorage.setItem('mesob_user', JSON.stringify(updatedUser));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Failed to update availability' };
        }
    };

    const updateUser = (data) => {
        if (!user) return;
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        sessionStorage.setItem('mesob_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateAvailability, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
