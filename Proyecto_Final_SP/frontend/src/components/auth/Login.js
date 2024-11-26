// src/components/auth/Login.js
import React, { useState } from 'react';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(''); // Limpiar el mensaje de error antes de enviar
        try {
            const response = await authService.login(email, password);
            console.log('Respuesta del login:', response); // Verificar la respuesta

            if (response.success) {
                // Almacenar la información del usuario en el localStorage
                localStorage.setItem('nombre', response.nombre);
                localStorage.setItem('id_usuario', response.id_usuario);
                localStorage.setItem('id_rol', response.id_rol);

                navigate('/dashboard'); // Redirige al dashboard
            } else {
                setError(response.message || 'Correo o contraseña incorrectos');
            }
        } catch (error) {
            console.error('Error durante el inicio de sesión:', error);
            setError('Error al iniciar sesión. Por favor, intente nuevamente más tarde.');
        }
    };

    return (
        <div className="login-container">
            <h2>Iniciar sesión</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Iniciar sesión</button>
            </form>
        </div>
    );
};

export default Login;
