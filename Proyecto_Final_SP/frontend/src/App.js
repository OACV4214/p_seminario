// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import UserManagement from './components/dashboard/UserManagement/UserManagement';
import ProjectManagement from './components/dashboard/ProjectManagement/ProjectManagement';
import Login from './components/auth/Login';
import PreviewProject from './components/dashboard/ProjectManagement/PreviewProject/PreviewProject';
import TestPlanning from './components/dashboard/ProjectManagement/TestPlanning/TestPlanning';
import TestCases from './components/dashboard/ProjectManagement/TestPlanning/TestCases/TestCases';
import TestResults from './components/dashboard/ProjectManagement/TestPlanning/TestCases/TestResults/TestResults';
import DefectForm from './components/dashboard/ProjectManagement/TestPlanning/TestCases/Defect/Defects';
import ReportsAndMetrics from './components/dashboard/ProjectManagement/ReportsAndMetrics/ReportsAndMetrics';
import PrivateRoute from './components/PrivateRoute'; 
import Asignaciones from './components/dashboard/Asignaciones/Asignaciones';
import AsignacionesTester from './components/dashboard/Asignaciones/AsignacionesTester';


function App() {
    return (
        <Router>
            <Routes>
                {/* Ruta pública */}
                <Route path="/" element={<Login />} />

                {/* Rutas accesibles para cualquier usuario autenticado */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/proyectos/:id" element={<PreviewProject />} />
                <Route path="/planes_prueba/:id_plan/casos_prueba" element={<TestCases />} />
                <Route path="/casos_prueba/:id_caso/resultados" element={<TestResults />} />
                <Route path="/proyectos/:id/metricas" element={<ReportsAndMetrics />} />
                {/* Rutas protegidas por rol */}

                {/* Solo Administradores (id_rol === 3) */}
                <Route
                    path="/user-management"
                    element={
                        <PrivateRoute allowedRoles={[3]}>
                            <UserManagement />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/project-management"
                    element={
                        <PrivateRoute allowedRoles={[3]}>
                            <ProjectManagement />
                        </PrivateRoute>
                    }
                />

                {/* Solo Desarrolladores (id_rol === 2) */}
                <Route
                    path="/projects/:id/test-planning"
                    element={
                        <PrivateRoute allowedRoles={[2,3]}>
                            <TestPlanning />
                        </PrivateRoute>
                    }
                />

                {/* Solo Testers (id_rol === 1) */}
                <Route
                    path="/casos_prueba/:id_caso/defectos"
                    element={
                        <PrivateRoute allowedRoles={[1,2,3]}>
                            <DefectForm />
                        </PrivateRoute>
                    }
                />
            </Routes>
            <Routes>
                <Route
                    path="/asignaciones/:id_usuario/asignacion"
                    element={
                        <PrivateRoute allowedRoles={[2]}>
                            <Asignaciones />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/asignacionesTester/:id_usuario/asignacionTester"
                    element={
                        <PrivateRoute allowedRoles={[1]}>
                            <AsignacionesTester />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
