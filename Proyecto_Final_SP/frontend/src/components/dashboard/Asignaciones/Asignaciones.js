// src/components/dashboard/Asignaciones/Asignaciones.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Asignaciones.css';

const Asignaciones = () => {
  const [planesPrueba, setPlanesPrueba] = useState([]);
  const navigate = useNavigate();
  const id_usuario = localStorage.getItem('id_usuario'); // Obtener id_usuario

  useEffect(() => {
    const fetchPlanesPrueba = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/planes_prueba_usuario/${id_usuario}`);
        console.log('Datos recibidos:', response.data);
        setPlanesPrueba(response.data);
      } catch (error) {
        console.error('Error al obtener los planes de prueba:', error);
      }
    };

    if (id_usuario) {
      fetchPlanesPrueba();
    } else {
      console.log('No se encontró id_usuario en localStorage');
    }
  }, [id_usuario]);

  const handleButtonClick = (id_proyecto) => {
    navigate(`/projects/${id_proyecto}/test-planning`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="asignaciones-container">
      <h1>Planes de Prueba Asignados</h1>
      <button onClick={handleBack} className="back-button">Atrás</button>

      {planesPrueba.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID Plan</th>
              <th>Nombre del Plan</th>
              <th>Descripción del Plan</th>
              <th>Nombre del Proyecto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {planesPrueba.map((plan) => (
              <tr key={plan.id_plan}>
                <td>{plan.id_plan}</td>
                <td>{plan.nombre_plan}</td>
                <td>{plan.descripcion_plan}</td>
                <td>{plan.nombre_proyecto}</td>
                <td>
                  <button onClick={() => handleButtonClick(plan.id_proyecto)}>
                    Vamos a trabajar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No tienes planes de prueba asignados.</p>
      )}
    </div>
  );
};

export default Asignaciones;
