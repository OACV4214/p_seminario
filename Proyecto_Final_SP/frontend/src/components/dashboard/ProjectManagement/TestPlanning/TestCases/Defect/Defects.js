import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Defects.css';

const Defects = () => {
  const { id_caso } = useParams();
  const navigate = useNavigate(); 
  const [defects, setDefects] = useState([]);
  const [estados, setEstados] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDefect, setNewDefect] = useState({
    nombre_defecto: '',
    descripcion_defecto: '',
    notas_defecto: '',
    id_estado: '',
    id_usuario: '',
    id_clasificacion: '',
    id_caso: id_caso
  });
  const [editDefect, setEditDefect] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  useEffect(() => {
    if (id_caso) {
      fetchDefects();
    }
    fetchEstados();
    fetchClasificaciones();
    fetchUsuarios();
  }, [id_caso]);

  const fetchDefects = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/defectos?id_caso=${id_caso}`);
      setDefects(response.data);
    } catch (error) {
      console.error('Error al obtener defectos:', error);
    }
  };

  const fetchEstados = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/estados');
      setEstados(response.data);
    } catch (error) {
      console.error('Error al obtener estados:', error);
    }
  };

  const fetchClasificaciones = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/clasificaciones_defecto');
      setClasificaciones(response.data);
    } catch (error) {
      console.error('Error al obtener clasificaciones:', error);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const handleCreateOrUpdateDefect = async () => {
    try {
      const { nombre_defecto, descripcion_defecto, id_estado, id_usuario, id_clasificacion } = newDefect;

      if (!nombre_defecto || !descripcion_defecto || !id_estado || !id_usuario || !id_clasificacion || !id_caso) {
        alert('Por favor, completa todos los campos requeridos.');
        return;
      }

      if (editDefect) {
        await axios.put(`http://localhost:3001/api/defectos/${editDefect.id_defecto}`, { ...newDefect, id_caso });
        setConfirmationMessage('Defecto actualizado exitosamente.');
      } else {
        await axios.post('http://localhost:3001/api/defectos', { ...newDefect, id_caso });
        setConfirmationMessage('Defecto creado exitosamente.');
      }

      fetchDefects();
      setShowCreateModal(false);
      resetForm();
      setTimeout(() => setConfirmationMessage(''), 3000);
    } catch (error) {
      console.error('Error al crear/actualizar defecto:', error);
      alert('Hubo un error al crear/actualizar el defecto. Por favor, intenta nuevamente.');
    }
  };

  const resetForm = () => {
    setNewDefect({
      nombre_defecto: '',
      descripcion_defecto: '',
      notas_defecto: '',
      id_estado: '',
      id_usuario: '',
      id_clasificacion: '',
      id_caso: id_caso
    });
    setEditDefect(null);
  };

  const handleEditClick = (defecto) => {
    setEditDefect(defecto);
    setNewDefect({
      nombre_defecto: defecto.nombre_defecto,
      descripcion_defecto: defecto.descripcion_defecto,
      notas_defecto: defecto.notas_defecto,
      id_estado: defecto.id_estado,
      id_usuario: defecto.id_usuario,
      id_clasificacion: defecto.id_clasificacion,
      id_caso: defecto.id_caso
    });
    setShowCreateModal(true);
  };

  const handleDeleteDefect = async (id_defecto) => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este defecto?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3001/api/defectos/${id_defecto}`);
      fetchDefects();
      setConfirmationMessage('Defecto eliminado correctamente.');
      setTimeout(() => setConfirmationMessage(''), 3000);
    } catch (error) {
      console.error('Error al eliminar defecto:', error);
      alert('Hubo un error al eliminar el defecto. Por favor, intenta nuevamente.');
    }
  };

  
  const handleBackClick = () => {
    navigate(-1); 
  };

  return (
    <div className="defects-container">
      <h1>Gestión de Defectos</h1>
      {confirmationMessage && (
        <div className="confirmation-message">
          {confirmationMessage}
        </div>
      )}
      <button onClick={handleBackClick} className="back-button">Regresar</button> {/* Botón Regresar */}
      <br></br>
      <br></br>

      <button onClick={() => {
        setShowCreateModal(true);
        resetForm();
      }} className="create-defect-button">Crear Defecto</button>
      <table className="defects-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Asignado a</th>
            <th>Clasificación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {defects.length > 0 ? defects.map(defecto => (
            <tr key={defecto.id_defecto}>
              <td>{defecto.nombre_defecto}</td>
              <td>{defecto.descripcion_defecto}</td>
              <td>{defecto.nombre_estado}</td>
              <td>{defecto.nombre_usuario || defecto.nombre}</td>
              <td>{defecto.nombre_clasificacion}</td>
              <td>
                <button className="edit-button" onClick={() => handleEditClick(defecto)}>Editar</button>
                <button className="delete-button" onClick={() => handleDeleteDefect(defecto.id_defecto)}>Eliminar</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6">No se encontraron defectos.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editDefect ? 'Editar Defecto' : 'Crear Nuevo Defecto'}</h2>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Nombre del defecto"
                value={newDefect.nombre_defecto}
                onChange={(e) => setNewDefect({ ...newDefect, nombre_defecto: e.target.value })}
                required
              />
              <textarea
                placeholder="Descripción del defecto"
                value={newDefect.descripcion_defecto}
                onChange={(e) => setNewDefect({ ...newDefect, descripcion_defecto: e.target.value })}
                required
              />
              <textarea
                placeholder="Notas del defecto"
                value={newDefect.notas_defecto}
                onChange={(e) => setNewDefect({ ...newDefect, notas_defecto: e.target.value })}
              />
              <select
                value={newDefect.id_estado}
                onChange={(e) => setNewDefect({ ...newDefect, id_estado: e.target.value })}
                required
              >
                <option value="">Seleccionar Estado</option>
                {estados.map(estado => (
                  <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre_estado}</option>
                ))}
              </select>
              <select
                value={newDefect.id_usuario}
                onChange={(e) => setNewDefect({ ...newDefect, id_usuario: e.target.value })}
                required
              >
                <option value="">Asignar a Usuario</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id_usuario} value={usuario.id_usuario}>{usuario.nombre}</option>
                ))}
              </select>
              <select
                value={newDefect.id_clasificacion}
                onChange={(e) => setNewDefect({ ...newDefect, id_clasificacion: e.target.value })}
                required
              >
                <option value="">Seleccionar Clasificación</option>
                {clasificaciones.map(clasificacion => (
                  <option key={clasificacion.id_clasificacion} value={clasificacion.id_clasificacion}>
                    {clasificacion.nombre_clasificacion}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button onClick={handleCreateOrUpdateDefect} className="save-button">
                {editDefect ? 'Actualizar' : 'Guardar'}
              </button>
              <button onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }} className="cancel-button">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Defects;
