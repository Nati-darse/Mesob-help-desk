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
                axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
                axios.defaults.headers.common['x-tenant-id'] = String(parsedUser.companyId || '');
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
            console.log('✅ Login response:', res.data);
            console.log('👤 User role:', res.data.role);
            
            // Ensure profilePic is included in user data
            const userData = {
                ...res.data,
                profilePic: res.data.profilePic || ''
            };
            
            setUser(userData);
            sessionStorage.setItem('mesob_user', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
            axios.defaults.headers.common['x-tenant-id'] = String(userData.companyId || '');
            
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
            setUser(res.data);
            sessionStorage.setItem('mesob_user', JSON.stringify(res.data));
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
        sessionStorage.removeItem('mesob_user');
        delete axios.defaults.headers.common['Authorization'];
        delete axios.defaults.headers.common['x-tenant-id'];
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
