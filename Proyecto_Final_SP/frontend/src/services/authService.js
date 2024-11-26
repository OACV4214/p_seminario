// src/services/authService.js
import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';

const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
            email: email,
            password: password,
        });
        return response.data; // Retornar response.data
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return { success: false };
    }
};

export default { login };
