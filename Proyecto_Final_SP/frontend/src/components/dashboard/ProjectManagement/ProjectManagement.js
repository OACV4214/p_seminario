// src/components/dashboard/ProjectManagement/ProjectManagement.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProjectManagement.css';




const ProjectManagement = () => {
    
    const [proyectos, setProyectos] = useState([]);
    const [confirmationMessage, setConfirmationMessage] = useState(''); // Estado para mensajes de confirmación
    const [usuarios, setUsuarios] = useState([]);
    const [estados, setEstados] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [originalData, setOriginalData] = useState(null); // Estado para guardar datos originales
    const [newProjectData, setNewProjectData] = useState({
        nombre_proyecto: '',
        descripcion_proyecto: '',
        id_estado: '',
        fecha_inicio: '',
        fecha_fin: '',
        id_usuario_asignado: ''
    });
    const [editProjectData, setEditProjectData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        cargarProyectos();
        cargarUsuarios();
        cargarEstados();
    }, []);
    

    const cargarProyectos = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/proyectos');
            setProyectos(response.data);
        } catch (error) {
            console.error('Error al cargar los proyectos:', error);
        }
    };

    const cargarUsuarios = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/usuarios');
            setUsuarios(response.data);
        } catch (error) {
            console.error('Error al cargar los usuarios:', error);
        }
    };

    const cargarEstados = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/estados');
            setEstados(response.data);
        } catch (error) {
            console.error('Error al cargar los estados:', error);
        }
    };

    const handleBack = () => {
        navigate('/dashboard');
    };

    const handleCreateProject = () => {
        setNewProjectData({
            nombre_proyecto: '',
            descripcion_proyecto: '',
            id_estado: '',
            fecha_inicio: '',
            fecha_fin: '',
            id_usuario_asignado: ''
        });
        setShowModal(true);
    };
    

    const handleCloseModal = () => {
        setShowModal(false);
        setNewProjectData({
            nombre_proyecto: '',
            descripcion_proyecto: '',
            id_estado: '',
            fecha_inicio: '',
            fecha_fin: '',
            id_usuario_asignado: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProjectData({ ...newProjectData, [name]: value });
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditProjectData({ ...editProjectData, [name]: value });
    };

    const handleSaveProject = async () => {
        try {
            const plazoResponse = await axios.post('http://localhost:3001/api/plazos', {
                fecha_inicio: newProjectData.fecha_inicio,
                fecha_fin: newProjectData.fecha_fin
            });
            const id_plazo = plazoResponse.data.id_plazo;

            await axios.post('http://localhost:3001/api/proyectos', {
                ...newProjectData,
                id_plazo
            });

            cargarProyectos();
            handleCloseModal();
        } catch (error) {
            console.error('Error al crear el proyecto:', error);
        }
    };

    // Función para abrir el modal de edición y cargar datos
    const handleEditClick = (proyecto) => {
        const initialData = {
            id_proyecto: proyecto.id_proyecto,
            nombre_proyecto: proyecto.nombre_proyecto,
            descripcion_proyecto: proyecto.descripcion_proyecto,
            id_estado: proyecto.id_estado,
            fecha_inicio: proyecto.fecha_inicio ? proyecto.fecha_inicio.slice(0, 10) : null,
            fecha_fin: proyecto.fecha_fin ? proyecto.fecha_fin.slice(0, 10) : null,
            id_usuario_asignado: proyecto.id_usuario_asignado,
            id_plazo: proyecto.id_plazo
        };
        setEditProjectData(initialData);
        setOriginalData(initialData); // Guarda los valores originales
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditProjectData(null);
    };

    const handleUpdateProject = async () => {

    
        try {
            if (
                editProjectData.fecha_inicio !== originalData.fecha_inicio || 
                editProjectData.fecha_fin !== originalData.fecha_fin
            ) {
                await axios.put(`http://localhost:3001/api/plazos/${editProjectData.id_plazo}`, {
                    fecha_inicio: editProjectData.fecha_inicio,
                    fecha_fin: editProjectData.fecha_fin
                });
            }
    
            await axios.put(`http://localhost:3001/api/proyectos/${editProjectData.id_proyecto}`, {
                nombre_proyecto: editProjectData.nombre_proyecto,
                descripcion_proyecto: editProjectData.descripcion_proyecto,
                id_estado: editProjectData.id_estado,
                id_usuario_asignado: editProjectData.id_usuario_asignado,
                id_plazo: editProjectData.id_plazo
            });
    
            cargarProyectos();
            handleCloseEditModal();
    
            // Mostrar mensaje de confirmación
            setConfirmationMessage('Proyecto modificado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000); 
        } catch (error) {
            console.error('Error al actualizar el proyecto:', error);
        }
    };
    
    
    
    const handleDeleteProject = async (id) => {
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este proyecto?");
        if (!confirmDelete) return;
    
        try {
            await axios.delete(`http://localhost:3001/api/proyectos/${id}`);
            cargarProyectos();
    
            // Mostrar mensaje de confirmación
            setConfirmationMessage('Proyecto eliminado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000); // Limpia el mensaje después de 3 segundos
        } catch (error) {
            console.error('Error al eliminar el proyecto:', error);
        }
    };
    
        // Función para manejar la previsualización
        const handlePreviewProject = (id) => {
            navigate(`/proyectos/${id}`);
        };

    return (
        <div className="project-management-container">
            <div className="header">
                <h2>Gestión de Proyectos</h2>
                <div className="button-group">
                    <button onClick={handleBack} className="back-button">Regresar</button>
                    <button onClick={handleCreateProject} className="create-project-button">Crear Proyecto</button>
                </div>
            </div>
                    {/* Mensaje de confirmación */}
        {confirmationMessage && (
            <div className="confirmation-message">
                {confirmationMessage}
            </div>
        )}
            
            <table className="project-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Usuario Asignado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {proyectos.map((proyecto) => (
                        <tr key={proyecto.id_proyecto}>
                            <td>{proyecto.id_proyecto}</td>
                            <td>{proyecto.nombre_proyecto}</td>
                            <td>{proyecto.descripcion_proyecto}</td>
                            <td>{proyecto.estado}</td>
                            <td>{new Date(proyecto.fecha_inicio).toLocaleDateString()}</td>
                            <td>{new Date(proyecto.fecha_fin).toLocaleDateString()}</td>
                            <td>{proyecto.nombre_usuario || 'No asignado'}</td>
                            <td>
    <button onClick={() => handleEditClick(proyecto)} className="edit-button">
        Modificar
    </button>
    <button onClick={() => handleDeleteProject(proyecto.id_proyecto)} className="delete-button">
        Eliminar
    </button>
    <button onClick={() => handlePreviewProject(proyecto.id_proyecto)} className="preview-button">
        Previsualización
    </button>
</td>

                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal para Crear Proyecto */}
{showModal && (
    <div className="modal-overlay">
        <div className="modal-content">
            <h3>Crear Nuevo Proyecto</h3>
            <form>
                <label>
                    Nombre del Proyecto:
                    <input
                        type="text"
                        name="nombre_proyecto"
                        value={newProjectData.nombre_proyecto}
                        onChange={handleInputChange}
                    />
                </label>
                <label>
                    Descripción del Proyecto:
                    <textarea
                        name="descripcion_proyecto"
                        value={newProjectData.descripcion_proyecto}
                        onChange={handleInputChange}
                    />
                </label>
                <label>
                    Estado:
                    <select
                        name="id_estado"
                        value={newProjectData.id_estado}
                        onChange={handleInputChange}
                    >
                        <option value="">Seleccionar Estado</option>
                        {estados.map((estado) => (
                            <option key={estado.id_estado} value={estado.id_estado}>
                                {estado.nombre_estado}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Fecha de Inicio:
                    <input
                        type="date"
                        name="fecha_inicio"
                        value={newProjectData.fecha_inicio}
                        onChange={handleInputChange}
                    />
                </label>
                <label>
                    Fecha de Fin:
                    <input
                        type="date"
                        name="fecha_fin"
                        value={newProjectData.fecha_fin}
                        onChange={handleInputChange}
                    />
                </label>
                <label>
                    Asignar a Usuario:
                    <select
                        name="id_usuario_asignado"
                        value={newProjectData.id_usuario_asignado}
                        onChange={handleInputChange}
                    >
                        <option value="">Seleccionar Usuario</option>
                        {usuarios.map((usuario) => (
                            <option key={usuario.id_usuario} value={usuario.id_usuario}>
                                {usuario.nombre}
                            </option>
                        ))}
                    </select>
                </label>
            </form>
            <button onClick={handleSaveProject} className="save-button">Guardar</button>
            <button onClick={handleCloseModal} className="close-button">Cerrar</button>
        </div>
    </div>
)}


            {/* Modal para Editar Proyecto */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Modificar Proyecto</h3>
                        <form>
                            <label>
                                Nombre del Proyecto:
                                <input
                                    type="text"
                                    name="nombre_proyecto"
                                    value={editProjectData.nombre_proyecto}
                                    onChange={handleEditInputChange}
                                />
                            </label>
                            <label>
                                Descripción del Proyecto:
                                <textarea
                                    name="descripcion_proyecto"
                                    value={editProjectData.descripcion_proyecto}
                                    onChange={handleEditInputChange}
                                />
                            </label>
                            <label>
                                Estado:
                                <select
                                    name="id_estado"
                                    value={editProjectData.id_estado}
                                    onChange={handleEditInputChange}
                                >
                                    <option value="">Seleccionar Estado</option>
                                    {estados.map((estado) => (
                                        <option key={estado.id_estado} value={estado.id_estado}>
                                            {estado.nombre_estado}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Fecha de Inicio:
                                <input
                                    type="date"
                                    name="fecha_inicio"
                                    value={editProjectData.fecha_inicio}
                                    onChange={handleEditInputChange}
                                />
                            </label>
                            <label>
                                Fecha de Fin:
                                <input
                                    type="date"
                                    name="fecha_fin"
                                    value={editProjectData.fecha_fin}
                                    onChange={handleEditInputChange}
                                />
                            </label>
                            <label>
                                Asignar a Usuario:
                                <select
                                    name="id_usuario_asignado"
                                    value={editProjectData.id_usuario_asignado}
                                    onChange={handleEditInputChange}
                                >
                                    <option value="">Seleccionar Usuario</option>
                                    {usuarios.map((usuario) => (
                                        <option key={usuario.id_usuario} value={usuario.id_usuario}>
                                            {usuario.nombre}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </form>
                        <button onClick={handleUpdateProject} className="save-button">Guardar Cambios</button>
                        <button onClick={handleCloseEditModal} className="close-button">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectManagement;
