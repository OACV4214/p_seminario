// src/components/dashboard/Asignaciones/AsignacionesTester.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Asignaciones.css';

const AsignacionesTester = () => {
  const [defectos, setDefectos] = useState([]);
  const navigate = useNavigate();
  const id_usuario = localStorage.getItem('id_usuario'); // Obtener id_usuario

  useEffect(() => {
    const fetchDefectos = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/defectos_usuario/${id_usuario}`);
        console.log('Datos recibidos:', response.data);
        setDefectos(response.data);
      } catch (error) {
        console.error('Error al obtener los defectos:', error);
      }
    };

    if (id_usuario) {
      fetchDefectos();
    } else {
      console.log('No se encontró id_usuario en localStorage');
    }
  }, [id_usuario]);

  const handleTrabajarClick = (id_caso) => {
    navigate(`/casos_prueba/${id_caso}/defectos`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="asignaciones-container">
      <h1>Defectos Asignados</h1>
      <button onClick={handleBack} className="back-button">Atrás</button>

      {defectos.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID Defecto</th>
              <th>Nombre del Defecto</th>
              <th>Descripción</th>
              <th>Nombre del Caso de Prueba</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {defectos.map((defecto) => (
              <tr key={defecto.id_defecto}>
                <td>{defecto.id_defecto}</td>
                <td>{defecto.nombre_defecto}</td>
                <td>{defecto.descripcion_defecto}</td>
                <td>{defecto.nombre_caso}</td>
                <td>
                  <button onClick={() => handleTrabajarClick(defecto.id_caso)}>
                    Vamos a trabajar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No tienes defectos asignados.</p>
      )}
    </div>
  );
};

export default AsignacionesTester;
