import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TestResults.css';

const TestResults = () => {
    const { id_caso } = useParams(); // Obtenemos el id del caso de la URL
    const navigate = useNavigate();
    const [testResults, setTestResults] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newTestResult, setNewTestResult] = useState({
        resultado_obtenido: '',
        detalles_resultado: '',
        fecha_ejecucion: ''
    });
    const [editTestResult, setEditTestResult] = useState(null);
    const [confirmationMessage, setConfirmationMessage] = useState('');

    useEffect(() => {
        fetchTestResults();
    }, [id_caso]);

    const fetchTestResults = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/api/casos_prueba/${id_caso}/resultados`);
            setTestResults(response.data);
        } catch (error) {
            console.error('Error al obtener los resultados de pruebas:', error);
        }
    };

    const handleCreateTestResult = async () => {
        try {
            await axios.post('http://localhost:3001/api/resultados_pruebas', {
                ...newTestResult,
                id_caso,
                fecha_ejecucion: new Date().toISOString()
            });

            fetchTestResults();
            setShowCreateModal(false);
            setNewTestResult({ resultado_obtenido: '', detalles_resultado: '', fecha_ejecucion: '' });
            setConfirmationMessage('Resultado de prueba creado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            console.error('Error al crear el resultado de prueba:', error);
        }
    };

    const handleEditClick = (testResult) => {
        setEditTestResult({
            ...testResult,
            fecha_ejecucion: testResult.fecha_ejecucion ? testResult.fecha_ejecucion.slice(0, 10) : ''
        });
        setShowEditModal(true);
    };

    const handleUpdateTestResult = async () => {
        if (!editTestResult || !editTestResult.id_resultado) return;

        try {
            await axios.put(`http://localhost:3001/api/resultados_pruebas/${editTestResult.id_resultado}`, {
                resultado_obtenido: editTestResult.resultado_obtenido,
                detalles_resultado: editTestResult.detalles_resultado,
                fecha_ejecucion: editTestResult.fecha_ejecucion
            });

            fetchTestResults();
            setShowEditModal(false);
            setEditTestResult(null);
            setConfirmationMessage('Resultado de prueba actualizado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            console.error('Error al actualizar el resultado de prueba:', error);
        }
    };

    const handleDeleteTestResult = async (id_resultado) => {
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este resultado de prueba?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`http://localhost:3001/api/resultados_pruebas/${id_resultado}`);
            fetchTestResults();
            setConfirmationMessage('Resultado de prueba eliminado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            console.error('Error al eliminar el resultado de prueba:', error);
        }
    };

    const handleBack = () => {
        navigate(-1); // Regresa a la página anterior
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date) ? date.toLocaleString() : 'Fecha no disponible';
    };

    return (
        <div className="test-results-container">
            <h1>Resultados de Prueba</h1>

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

            {/* Botón para crear un nuevo resultado de prueba */}
            <button onClick={() => setShowCreateModal(true)} className="create-test-result-button">
                Crear Resultado de Prueba
            </button>

            {/* Tabla de resultados de prueba */}
            <table className="test-results-table">
                <thead>
                    <tr>
                        <th>Resultado Obtenido</th>
                        <th>Detalles</th>
                        <th>Fecha de Ejecución</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {testResults.map((result) => (
                        <tr key={result.id_resultado}>
                            <td>{result.resultado_obtenido}</td>
                            <td>{result.detalles_resultado}</td>
                            <td>{formatDate(result.fecha_ejecucion)}</td>
                            <td>
                                <button onClick={() => handleEditClick(result)} className="edit-button">Modificar</button>
                                <button onClick={() => handleDeleteTestResult(result.id_resultado)} className="delete-button">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Crear Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Crear Nuevo Resultado de Prueba</h2>
                        <input
                            type="text"
                            placeholder="Resultado Obtenido"
                            value={newTestResult.resultado_obtenido}
                            onChange={(e) => setNewTestResult({ ...newTestResult, resultado_obtenido: e.target.value })}
                        />
                        <textarea
                            placeholder="Detalles del Resultado"
                            value={newTestResult.detalles_resultado}
                            onChange={(e) => setNewTestResult({ ...newTestResult, detalles_resultado: e.target.value })}
                        />
                        <button onClick={handleCreateTestResult} className="save-button">Guardar</button>
                        <button onClick={() => setShowCreateModal(false)} className="close-button">Cancelar</button>
                    </div>
                </div>
            )}

            {/* Editar Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Modificar Resultado de Prueba</h2>
                        <input
                            type="text"
                            placeholder="Resultado Obtenido"
                            value={editTestResult.resultado_obtenido}
                            onChange={(e) => setEditTestResult({ ...editTestResult, resultado_obtenido: e.target.value })}
                        />
                        <textarea
                            placeholder="Detalles del Resultado"
                            value={editTestResult.detalles_resultado}
                            onChange={(e) => setEditTestResult({ ...editTestResult, detalles_resultado: e.target.value })}
                        />
                        <button onClick={handleUpdateTestResult} className="save-button">Guardar Cambios</button>
                        <button onClick={() => setShowEditModal(false)} className="close-button">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestResults;
