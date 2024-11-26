import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TestPlanning.css';

const TestPlanning = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [testPlans, setTestPlans] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newTestPlan, setNewTestPlan] = useState({
        nombre_plan: '',
        descripcion_plan: '',
        fecha_inicio: '',
        fecha_fin: '',
        id_estado: '',
        id_usuario: ''
    });
    const [editTestPlan, setEditTestPlan] = useState(null);
    const [estados, setEstados] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [confirmationMessage, setConfirmationMessage] = useState('');

    useEffect(() => {
        fetchTestPlans();
        fetchEstados();
        fetchUsuarios();
    }, [id]);

    const fetchTestPlans = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/api/proyectos/${id}/planes_prueba`);
            setTestPlans(response.data);
        } catch (error) {
            console.error('Error al obtener los planes de prueba:', error);
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

    const fetchUsuarios = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/usuarios');
            setUsuarios(response.data);
        } catch (error) {
            console.error('Error al obtener los usuarios:', error);
        }
    };

    const handleCreateTestPlan = async () => {
        if (!id) {
            alert("No se puede crear el plan de prueba sin un ID de proyecto válido.");
            return;
        }

        try {
            const plazoResponse = await axios.post('http://localhost:3001/api/plazos', {
                fecha_inicio: newTestPlan.fecha_inicio,
                fecha_fin: newTestPlan.fecha_fin
            });
            const id_plazo = plazoResponse.data.id_plazo;

            await axios.post('http://localhost:3001/api/planes_prueba', {
                ...newTestPlan,
                id_proyecto: id,
                id_plazo
            });

            fetchTestPlans();
            setShowCreateModal(false);
            setNewTestPlan({ nombre_plan: '', descripcion_plan: '', fecha_inicio: '', fecha_fin: '', id_estado: '', id_usuario: '' });
            setConfirmationMessage('Plan de prueba creado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            console.error('Error al crear el plan de prueba:', error);
        }
    };

    const handleEditClick = async (plan) => {
        if (estados.length === 0) {
            await fetchEstados();
        }
        setEditTestPlan({
            ...plan,
            id_plazo: plan.id_plazo,
            id_estado: plan.id_estado || '',
            fecha_inicio: plan.fecha_inicio ? plan.fecha_inicio.slice(0, 10) : '',
            fecha_fin: plan.fecha_fin ? plan.fecha_fin.slice(0, 10) : ''
        });
        setShowEditModal(true);
    };

    const handleUpdateTestPlan = async () => {
        if (!editTestPlan || !editTestPlan.id_plan) return;

        try {
            await axios.put(`http://localhost:3001/api/planes_prueba/${editTestPlan.id_plan}`, {
                nombre_plan: editTestPlan.nombre_plan,
                descripcion_plan: editTestPlan.descripcion_plan,
                id_estado: editTestPlan.id_estado,
                id_usuario: editTestPlan.id_usuario,
                id_plazo: editTestPlan.id_plazo,
                fecha_inicio: editTestPlan.fecha_inicio,
                fecha_fin: editTestPlan.fecha_fin
            });

            fetchTestPlans();
            setShowEditModal(false);
            setEditTestPlan(null);
            setConfirmationMessage('Plan de prueba modificado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            console.error('Error al actualizar el plan de prueba:', error);
        }
    };

    const handleDeleteTestPlan = async (id_plan) => {
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este plan de prueba?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`http://localhost:3001/api/planes_prueba/${id_plan}`);
            fetchTestPlans();
            setConfirmationMessage('Plan de prueba eliminado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            console.error('Error al eliminar el plan de prueba:', error);
        }
    };

    const handleNavigateToTestCases = (planId) => {
        navigate(`/planes_prueba/${planId}/casos_prueba`);
    };

    const handleBack = () => {
        navigate(-1); // O puedes especificar una ruta específica
        // navigate(`/projects/${id}`);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="test-planning-container">
            <h1>Planes de Prueba</h1>

            {/* Mensaje de confirmación */}
            {confirmationMessage && (
                <div className="confirmation-message">
                    {confirmationMessage}
                </div>
            )}

            {/* Botón de regreso */}
            <button onClick={handleBack} className="back-button">Regresar</button>
            <br></br>
            <br></br>

            <button onClick={() => setShowCreateModal(true)} className="create-plan-button">Crear Plan de Prueba</button>

            <table className="test-plans-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Estado</th>
                        <th>Asignado a</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {testPlans.map((plan) => (
                        <tr key={plan.id_plan}>
                            <td>{plan.nombre_plan}</td>
                            <td>{plan.descripcion_plan}</td>
                            <td>{formatDate(plan.fecha_inicio)}</td>
                            <td>{formatDate(plan.fecha_fin)}</td>
                            <td>{estados.find(state => state.id_estado === plan.id_estado)?.nombre_estado || 'No asignado'}</td>
                            <td>{usuarios.find(user => user.id_usuario === plan.id_usuario)?.nombre || 'No asignado'}</td>
                            <td>
                                <button onClick={() => handleEditClick(plan)} className="edit-button">Modificar</button>
                                <button onClick={() => handleDeleteTestPlan(plan.id_plan)} className="delete-button">Eliminar</button>
                                <button onClick={() => handleNavigateToTestCases(plan.id_plan)} className="view-cases-button">Casos de Prueba</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Crear Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Crear Nuevo Plan de Prueba</h2>
                        <input
                            type="text"
                            placeholder="Nombre del plan"
                            value={newTestPlan.nombre_plan}
                            onChange={(e) => setNewTestPlan({ ...newTestPlan, nombre_plan: e.target.value })}
                        />
                        <textarea
                            placeholder="Descripción del plan"
                            value={newTestPlan.descripcion_plan}
                            onChange={(e) => setNewTestPlan({ ...newTestPlan, descripcion_plan: e.target.value })}
                        />
                        <select
                            value={newTestPlan.id_estado}
                            onChange={(e) => setNewTestPlan({ ...newTestPlan, id_estado: e.target.value })}
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
                            value={newTestPlan.fecha_inicio}
                            onChange={(e) => setNewTestPlan({ ...newTestPlan, fecha_inicio: e.target.value })}
                        />
                        </label>
                        <label>
                        Fecha de Fin:
                        <input
                            type="date"
                            placeholder="Fecha de Fin"
                            value={newTestPlan.fecha_fin}
                            onChange={(e) => setNewTestPlan({ ...newTestPlan, fecha_fin: e.target.value })}
                        />
                         </label>
                        <select
                            value={newTestPlan.id_usuario}
                            onChange={(e) => setNewTestPlan({ ...newTestPlan, id_usuario: e.target.value })}
                        >
                            <option value="">Asignar a Usuario</option>
                            {usuarios.map((usuario) => (
                                <option key={usuario.id_usuario} value={usuario.id_usuario}>{usuario.nombre}</option>
                            ))}
                        </select>
                        <button onClick={handleCreateTestPlan} className="create-plan-button">Guardar</button>
                        <button onClick={() => setShowCreateModal(false)} className="close-button">Cancelar</button>
                    </div>
                </div>
            )}

            {/* Editar Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Modificar Plan de Prueba</h2>
                        <input
                            type="text"
                            placeholder="Nombre del plan"
                            value={editTestPlan.nombre_plan}
                            onChange={(e) => setEditTestPlan({ ...editTestPlan, nombre_plan: e.target.value })}
                        />
                        <textarea
                            placeholder="Descripción del plan"
                            value={editTestPlan.descripcion_plan}
                            onChange={(e) => setEditTestPlan({ ...editTestPlan, descripcion_plan: e.target.value })}
                        />
                        <select
                            value={editTestPlan?.id_estado || ''}
                            onChange={(e) => setEditTestPlan({ ...editTestPlan, id_estado: e.target.value })}
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
                            value={editTestPlan.fecha_inicio}
                            onChange={(e) => setEditTestPlan({ ...editTestPlan, fecha_inicio: e.target.value })}
                        />
                        </label>
                        <label>
                        Fecha de Fin:
                        <input
                            type="date"
                            placeholder="Fecha de Fin"
                            value={editTestPlan.fecha_fin}
                            onChange={(e) => setEditTestPlan({ ...editTestPlan, fecha_fin: e.target.value })}
                        />
                        </label>
                        <select
                            value={editTestPlan.id_usuario}
                            onChange={(e) => setEditTestPlan({ ...editTestPlan, id_usuario: e.target.value })}
                        >
                            <option value="">Asignar a Usuario</option>
                            {usuarios.map((usuario) => (
                                <option key={usuario.id_usuario} value={usuario.id_usuario}>{usuario.nombre}</option>
                            ))}
                        </select>
                        <button onClick={handleUpdateTestPlan} className="update-plan-button">Guardar Cambios</button>
                        <button onClick={() => setShowEditModal(false)} className="close-button">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestPlanning;
