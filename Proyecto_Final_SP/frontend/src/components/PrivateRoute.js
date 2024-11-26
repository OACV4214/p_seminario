// src/components/PrivateRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles, children }) => {
    const id_rol = parseInt(localStorage.getItem('id_rol'), 10);

    if (!allowedRoles.includes(id_rol)) {
        // Redirigir al Dashboard si el rol no es permitido
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PrivateRoute;
