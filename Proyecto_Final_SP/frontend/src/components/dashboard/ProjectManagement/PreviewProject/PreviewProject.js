import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './PreviewProject.css';
import { useNavigate } from 'react-router-dom';


const formatDate = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date) ? date.toLocaleDateString() : 'Fecha no disponible';
};

const PreviewProject = () => {
    const { id } = useParams();
    const [proyecto, setProyecto] = useState(null);
    const [hitos, setHitos] = useState([]);
    const [estados, setEstados] = useState([]);
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);
    const [newMilestone, setNewMilestone] = useState({
        nombre_hito: '',
        descripcion_hito: '',
        id_estado: '',
        fecha_inicio: '',
        fecha_fin: ''
    });
    const [editMilestone, setEditMilestone] = useState(null);

    useEffect(() => {
        fetchProject();
        fetchMilestones();
        fetchEstados();
    }, [id]);

    const fetchProject = async () => {
        try {
            const proyectoResponse = await axios.get(`http://localhost:3001/api/proyectos/${id}`);
            setProyecto(proyectoResponse.data);
        } catch (error) {
            console.error('Error al obtener el proyecto:', error);
        }
    };

    const fetchMilestones = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/api/proyectos/${id}/hitos`);
            setHitos(response.data);
        } catch (error) {
            console.error('Error al obtener los hitos:', error);
        }
    };

    const fetchEstados = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/estados');
            setEstados(response.data);
        } catch (error) {
            console.error('Error al obtener los estados:', error);
        }
    };

    const handleCreateMilestone = async () => {
        try {
            const plazoResponse = await axios.post('http://localhost:3001/api/plazos', {
                fecha_inicio: newMilestone.fecha_inicio,
                fecha_fin: newMilestone.fecha_fin
            });
            const id_plazo = plazoResponse.data.id_plazo;

            await axios.post('http://localhost:3001/api/hitos', {
                ...newMilestone,
                id_proyecto: id,
                id_plazo
            });

            fetchMilestones();
            setShowMilestoneModal(false);
            setNewMilestone({ nombre_hito: '', descripcion_hito: '', id_estado: '', fecha_inicio: '', fecha_fin: '' });
            setConfirmationMessage('Hito creado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000); 
        } catch (error) {
            console.error('Error al crear el hito:', error);
        }
    };

    const handleEditMilestone = (hito) => {
        setEditMilestone({
            ...hito,
            fecha_inicio: hito.fecha_inicio ? hito.fecha_inicio.slice(0, 10) : '',
            fecha_fin: hito.fecha_fin ? hito.fecha_fin.slice(0, 10) : ''
        });
    };

    const handleUpdateMilestone = async () => {
        try {
            await axios.put(`http://localhost:3001/api/hitos/${editMilestone.id_hito}`, {
                nombre_hito: editMilestone.nombre_hito,
                descripcion_hito: editMilestone.descripcion_hito,
                id_estado: editMilestone.id_estado,
                id_plazo: editMilestone.id_plazo,
                fecha_inicio: editMilestone.fecha_inicio,
                fecha_fin: editMilestone.fecha_fin
            });
    
            fetchMilestones();
            setEditMilestone(null);
            setConfirmationMessage('Hito modificado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000); 
        } catch (error) {
            console.error('Error al actualizar el hito:', error);
        }
    };
    

    const handleDeleteMilestone = async (idHito) => {
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este hito?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`http://localhost:3001/api/hitos/${idHito}`);
            fetchMilestones();
            setConfirmationMessage('Hito eliminado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000); 
        } catch (error) {
            console.error('Error al eliminar el hito:', error);
        }
    };

        // Agregar useNavigate
        const navigate = useNavigate();

    const handleBack = () => {
        navigate('/project-management');
    };



    const handleInformesMetricas = () => {
        navigate(`/proyectos/${id}/metricas`);
    };

    const handlePlanificacionPruebas = () => {
        navigate(`/projects/${id}/test-planning`);
    };
    

    if (!proyecto) return <p>Cargando proyecto...</p>;

    return (
        <div className="preview-project-container">
            <h1>{proyecto.nombre_proyecto}</h1>
            <p><strong>Descripción:</strong> {proyecto.descripcion_proyecto}</p>
            <p><strong>Estado:</strong> {proyecto.estado}</p>
            <p><strong>Fecha de Inicio:</strong> {formatDate(proyecto.fecha_inicio)}</p>
            <p><strong>Fecha de Fin:</strong> {formatDate(proyecto.fecha_fin)}</p>
            <p><strong>Usuario Asignado:</strong> {proyecto.nombre_usuario || 'No asignado'}</p>

            {confirmationMessage && (
                <div className="confirmation-message">
                    {confirmationMessage}
                </div>
            )}

            <h2>Hitos del Proyecto</h2>

            <button onClick={handleBack} className="back-button">Regresar</button>
            <br></br>
            <br></br>
            <div className="button-group">
                <button onClick={handlePlanificacionPruebas} className="planificacion-button">
                    Planificación de pruebas
                </button>
                <button onClick={handleInformesMetricas} className="informes-button">
                    Informes y métricas
                </button>
            </div>
            <br></br>
            <br></br>
            <button onClick={() => setShowMilestoneModal(true)} className="create-milestone-button">
                Crear Nuevo Hito
            </button>

            <table className="milestones-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {hitos.map((hito) => (
                        <tr key={hito.id_hito}>
                            <td>{hito.id_hito}</td>
                            <td>{hito.nombre_hito}</td>
                            <td>{hito.descripcion_hito}</td>
                            <td>{hito.nombre_estado}</td>
                            <td>{formatDate(hito.fecha_inicio)}</td>
                            <td>{formatDate(hito.fecha_fin)}</td>
                            <td>
                                <button onClick={() => handleEditMilestone(hito)} className="edit-button">Modificar</button>
                                <button onClick={() => handleDeleteMilestone(hito.id_hito)} className="delete-button">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {(showMilestoneModal || editMilestone) && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editMilestone ? "Modificar Hito" : "Crear Nuevo Hito"}</h3>
                        <input
                            type="text"
                            placeholder="Nombre del hito"
                            value={editMilestone ? editMilestone.nombre_hito : newMilestone.nombre_hito}
                            onChange={(e) => editMilestone ? setEditMilestone({ ...editMilestone, nombre_hito: e.target.value }) : setNewMilestone({ ...newMilestone, nombre_hito: e.target.value })}
                        />
                        <textarea
                            placeholder="Descripción del hito"
                            value={editMilestone ? editMilestone.descripcion_hito : newMilestone.descripcion_hito}
                            onChange={(e) => editMilestone ? setEditMilestone({ ...editMilestone, descripcion_hito: e.target.value }) : setNewMilestone({ ...newMilestone, descripcion_hito: e.target.value })}
                        />
                        <select
                            value={editMilestone ? editMilestone.id_estado : newMilestone.id_estado}
                            onChange={(e) => editMilestone ? setEditMilestone({ ...editMilestone, id_estado: e.target.value }) : setNewMilestone({ ...newMilestone, id_estado: e.target.value })}
                        >
                            <option value="">Seleccionar Estado</option>
                            {estados.map((estado) => (
                                <option key={estado.id_estado} value={estado.id_estado}>{estado.nombre_estado}</option>
                            ))}
                        </select>
                        <label>
                        Fecha de Inicio:
                        <input
                            type="date"
                            placeholder="Fecha de Inicio"
                            value={editMilestone ? editMilestone.fecha_inicio : newMilestone.fecha_inicio}
                            onChange={(e) => editMilestone ? setEditMilestone({ ...editMilestone, fecha_inicio: e.target.value }) : setNewMilestone({ ...newMilestone, fecha_inicio: e.target.value })}
                        />
                        </label>
                        
                        <label>
                        Fecha de Fin:
                        <input
                            type="date"
                            placeholder="Fecha de Fin"
                            value={editMilestone ? editMilestone.fecha_fin : newMilestone.fecha_fin}
                            onChange={(e) => editMilestone ? setEditMilestone({ ...editMilestone, fecha_fin: e.target.value }) : setNewMilestone({ ...newMilestone, fecha_fin: e.target.value })}
                        />
                        </label>

                        <button onClick={editMilestone ? handleUpdateMilestone : handleCreateMilestone} className="save-button">
                            {editMilestone ? "Guardar Cambios" : "Guardar Hito"}
                        </button>
                        <button onClick={() => { setShowMilestoneModal(false); setEditMilestone(null); }} className="close-button">
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PreviewProject;
