// src/components/dashboard/Dashboard.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const nombre = localStorage.getItem('nombre') || '';
    const id_rol = parseInt(localStorage.getItem('id_rol'), 10) || 0;
    const id_usuario = localStorage.getItem('id_usuario'); // Obtener el id_usuario correctamente

    const goToAsignaciones = () => { 
        navigate(`/asignaciones/${id_usuario}/asignacion`);
    };

    const goToAsignacionesTester = () => {
        navigate(`/asignacionesTester/${id_usuario}/asignacionTester`);
    };



    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="dashboard-container">
            <div className="header">
                <span>Bienvenido, {nombre}</span>
                <button onClick={handleLogout} className="logout-button">
                    Log out
                </button>
            </div>
            <div className="main-content">
                <h1>Bienvenido al Dashboard</h1>



                {/* Botón de Asignaciones para Desarrollador */}
                {id_rol === 2 && (
                    <button onClick={goToAsignaciones} className="asignaciones-button">
                        Asignaciones
                    </button>
                )}

                {/* Botón de Asignaciones Tester para Tester */}
                {id_rol === 1 && (
                    <button onClick={goToAsignacionesTester} className="asignaciones-tester-button">
                        Asignaciones Tester
                    </button>
                )}

                {/* Otros botones para otros roles */}
                {id_rol === 3 && (
                    <>
                        <button onClick={() => navigate('/user-management')} className="manage-users-button">
                            Administrar Usuarios
                        </button>
                        <button onClick={() => navigate('/project-management')} className="manage-projects-button">
                            Gestión de Proyectos
                        </button>
                    </>
                )}



                {id_rol === 0 && (
                    <p>No se pudo determinar el rol del usuario. Por favor, inicie sesión nuevamente.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
