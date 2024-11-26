// TestCases.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TestCases.css';

const TestCases = () => {
    const { id_plan } = useParams();
    const navigate = useNavigate();
    const [testCases, setTestCases] = useState([]);
    const [estados, setEstados] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newTestCase, setNewTestCase] = useState({
        nombre_caso: '',
        descripcion_caso: '',
        parametros_caso: '',
        id_estado: '',
        fecha_inicio: '',
        fecha_fin: '',
        codigo_script: `(() => {
    // Su código aquí
    const expected = ...;
    const actual = ...;
    return actual === expected;
})();`
    });
    const [editTestCase, setEditTestCase] = useState(null);
    const [confirmationMessage, setConfirmationMessage] = useState('');

    useEffect(() => {
        fetchTestCases();
        fetchEstados();
    }, [id_plan]);

    const fetchTestCases = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/api/planes_prueba/${id_plan}/casos_prueba`);
            const testCasesData = response.data;

            // Obtener el último resultado de cada caso de prueba
            const testCasesWithResults = await Promise.all(testCasesData.map(async (testCase) => {
                try {
                    const resultResponse = await axios.get(`http://localhost:3001/api/casos_prueba/${testCase.id_caso}/ultimo_resultado`);
                    return { ...testCase, resultado_obtenido: resultResponse.data.resultado_obtenido };
                } catch (error) {
                    console.error('Error al obtener el último resultado:', error);
                    return { ...testCase, resultado_obtenido: null };
                }
            }));

            setTestCases(testCasesWithResults);
        } catch (error) {
            console.error('Error al obtener los casos de prueba:', error);
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

    const validateScript = (script) => {
        const containsIIFE = /\(\s*?\(\s*?\)\s*?=>\s*?{[\s\S]*}\s*?}\s*?\)\s*?\(\s*?\)\s*;?/.test(script);
        return containsIIFE;
    };

    const handleCreateTestCase = async () => {
        try {
            if (!validateScript(newTestCase.codigo_script)) {
                alert('El código del script no cumple con el formato requerido. Asegúrese de que esté envuelto en una función autoejecutable (IIFE).');
                return;
            }

            let id_plazo;

            const plazoResponse = await axios.post('http://localhost:3001/api/plazos', {
                fecha_inicio: newTestCase.fecha_inicio,
                fecha_fin: newTestCase.fecha_fin
            });
            id_plazo = plazoResponse.data.id_plazo;

            await axios.post('http://localhost:3001/api/casos_prueba', {
                ...newTestCase,
                id_plan,
                id_plazo
            });

            fetchTestCases();
            setShowCreateModal(false);
            setNewTestCase({
                nombre_caso: '',
                descripcion_caso: '',
                parametros_caso: '',
                id_estado: '',
                fecha_inicio: '',
                fecha_fin: '',
                codigo_script: `(() => {
    // Su código aquí
    const expected = ...;
    const actual = ...;
    return actual === expected;
})();`
            });
            setConfirmationMessage('Caso de prueba creado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            console.error('Error al crear el caso de prueba:', error);
        }
    };

    const handleEditClick = (testCase) => {
        setEditTestCase({
            ...testCase,
            fecha_inicio: testCase.fecha_inicio ? testCase.fecha_inicio.slice(0, 10) : '',
            fecha_fin: testCase.fecha_fin ? testCase.fecha_fin.slice(0, 10) : ''
        });
        setShowEditModal(true);
    };

    const handleUpdateTestCase = async () => {
        if (!editTestCase || !editTestCase.id_caso) return;

        try {
            if (!validateScript(editTestCase.codigo_script)) {
                alert('El código del script no cumple con el formato requerido. Asegúrese de que esté envuelto en una función autoejecutable (IIFE).');
                return;
            }

            await axios.put(`http://localhost:3001/api/casos_prueba/${editTestCase.id_caso}`, {
                nombre_caso: editTestCase.nombre_caso,
                descripcion_caso: editTestCase.descripcion_caso,
                parametros_caso: editTestCase.parametros_caso,
                id_estado: editTestCase.id_estado,
                id_plazo: editTestCase.id_plazo,
                fecha_inicio: editTestCase.fecha_inicio,
                fecha_fin: editTestCase.fecha_fin,
                codigo_script: editTestCase.codigo_script
            });

            fetchTestCases();
            setShowEditModal(false);
            setEditTestCase(null);
            setConfirmationMessage('Caso de prueba modificado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            console.error('Error al actualizar el caso de prueba:', error);
        }
    };

    const handleDeleteTestCase = async (id_caso) => {
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este caso de prueba?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`http://localhost:3001/api/casos_prueba/${id_caso}`);
            fetchTestCases();
            setConfirmationMessage('Caso de prueba eliminado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            console.error('Error al eliminar el caso de prueba:', error);
        }
    };

    const handleExecuteTestCase = async (id_caso) => {
        try {
            const response = await axios.post(`http://localhost:3001/api/casos_prueba/${id_caso}/ejecutar`);
            setConfirmationMessage(response.data.message);
            await fetchTestCases(); // Actualiza la lista de casos de prueba
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            console.error('Error al ejecutar el caso de prueba:', error);
            setConfirmationMessage('Error al ejecutar el caso de prueba');
            setTimeout(() => setConfirmationMessage(''), 3000);
        }
    };

    const handleRegisterDefect = (planId) => {
        navigate(`/casos_prueba/${planId}/defectos`);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date) ? date.toISOString().split('T')[0] : 'Fecha no disponible';
    };

    const handleNavigateToTestResults = (id_caso) => {
        navigate(`/casos_prueba/${id_caso}/resultados`);
    };

    const templates = [
        {
            name: 'Plantilla Básica',
            code: `(() => {
    // Su código aquí
    const expected = ...;
    const actual = ...;
    return actual === expected;
})();`
        },
        {
            name: 'Prueba de Suma',
            code: `(() => {
                const expected = 15;
                const actual = 5 + 10;
        
                if (actual === expected) {
                    return true;
                } else {
                    return {
                        detalles: \`Se esperaba \${expected}, pero se obtuvo \${actual}\`
                    };
                }
            })();`
        },
        {
            name: 'Prueba de Área de Círculo',
            code: `(() => {
    const radio = 5;
    const expected = Math.PI * radio * radio;

    function calcularAreaCirculo(r) {
        return Math.PI * r * r;
    }

    const actual = calcularAreaCirculo(radio);

    if (actual === expected) {
        return true;
    } else {
        return {
            detalles: \`Error en el cálculo: se esperaba \${expected}, pero se obtuvo \${actual}\`
        };
    }
})();`
        }
    ];

    return (
        <div className="test-cases-container">
            <h1>Casos de Prueba</h1>

            {confirmationMessage && (
                <div className="confirmation-message">
                    {confirmationMessage}
                </div>
            )}

            <button onClick={handleBack} className="back-button">Regresar</button>
            <br />
            <br />

            <button onClick={() => setShowCreateModal(true)} className="create-test-case-button">
                Crear Caso de Prueba
            </button>

            <table className="test-cases-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Parámetros</th>
                        <th>Estado</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {testCases.map((testCase) => (
                        <tr key={testCase.id_caso}>
                            <td>{testCase.nombre_caso}</td>
                            <td>{testCase.descripcion_caso}</td>
                            <td>{testCase.parametros_caso}</td>
                            <td>{testCase.nombre_estado}</td>
                            <td>{formatDate(testCase.fecha_inicio)}</td>
                            <td>{formatDate(testCase.fecha_fin)}</td>
                            <td>
                                <button onClick={() => handleExecuteTestCase(testCase.id_caso)} className="execute-button">Ejecutar</button>
                                <button onClick={() => handleEditClick(testCase)} className="edit-button">Modificar</button>
                                <button onClick={() => handleDeleteTestCase(testCase.id_caso)} className="delete-button">Eliminar</button>
                                <button onClick={() => handleNavigateToTestResults(testCase.id_caso)} className="view-results-button">Resultados</button>
                                <button onClick={() => handleRegisterDefect(testCase.id_caso)} className="register-defect-button">Registrar Defecto</button>
                                
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Crear Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Crear Nuevo Caso de Prueba</h2>
                        <div className="modal-body">
                            <input
                                type="text"
                                placeholder="Nombre del caso"
                                value={newTestCase.nombre_caso}
                                onChange={(e) => setNewTestCase({ ...newTestCase, nombre_caso: e.target.value })}
                            />
                            <textarea
                                placeholder="Descripción del caso"
                                value={newTestCase.descripcion_caso}
                                onChange={(e) => setNewTestCase({ ...newTestCase, descripcion_caso: e.target.value })}
                            />
                            <textarea
                                placeholder="Parámetros del caso"
                                value={newTestCase.parametros_caso}
                                onChange={(e) => setNewTestCase({ ...newTestCase, parametros_caso: e.target.value })}
                            />
                            <select
                                value={newTestCase.id_estado}
                                onChange={(e) => setNewTestCase({ ...newTestCase, id_estado: e.target.value })}
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
                                    value={newTestCase.fecha_inicio}
                                    onChange={(e) => setNewTestCase({ ...newTestCase, fecha_inicio: e.target.value })}
                                />
                            </label>
                            <label>
                                Fecha de Fin:
                                <input
                                    type="date"
                                    value={newTestCase.fecha_fin}
                                    onChange={(e) => setNewTestCase({ ...newTestCase, fecha_fin: e.target.value })}
                                />
                            </label>
                            <label>Código del Script:</label>
                            <select
                                onChange={(e) => {
                                    const selectedTemplate = templates.find(t => t.name === e.target.value);
                                    if (selectedTemplate) {
                                        setNewTestCase({ ...newTestCase, codigo_script: selectedTemplate.code });
                                    }
                                }}
                            >
                                <option value="">Seleccionar Plantilla</option>
                                {templates.map((template) => (
                                    <option key={template.name} value={template.name}>{template.name}</option>
                                ))}
                            </select>
                            <textarea
                                value={newTestCase.codigo_script}
                                onChange={(e) => setNewTestCase({ ...newTestCase, codigo_script: e.target.value })}
                                className="script-textarea"
                            />

                            <p className="help-text">
                                Su script debe estar envuelto en una función autoejecutable (IIFE) y debe retornar <code>true</code> si la prueba es exitosa, o <code>false</code> o un objeto con una propiedad <code>detalles</code> si falla.
                            </p>
                            <pre className="code-example">
{`(() => {
    // Su código aquí
    const expected = ...;
    const actual = ...;
    return actual === expected;
})();

Ejemplo:

(() => {
    const expected = 15;
    const actual = 5 + 10;
    return actual === expected;
})();

Ejemplo con detalles en caso de fallo:

(() => {
    const expected = 20;
    const actual = 5 + 10;
    if (actual === expected) {
        return true;
    } else {
        return {
            detalles: 'Se esperaba \${expected}, pero se obtuvo \${actual}.'
        };
    }
})();`}
                            </pre>
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleCreateTestCase} className="create-test-case-button">Guardar</button>
                            <button onClick={() => setShowCreateModal(false)} className="close-button">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Editar Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Modificar Caso de Prueba</h2>
                        <div className="modal-body">
                            <input
                                type="text"
                                placeholder="Nombre del caso"
                                value={editTestCase.nombre_caso}
                                onChange={(e) => setEditTestCase({ ...editTestCase, nombre_caso: e.target.value })}
                            />
                            <textarea
                                placeholder="Descripción del caso"
                                value={editTestCase.descripcion_caso}
                                onChange={(e) => setEditTestCase({ ...editTestCase, descripcion_caso: e.target.value })}
                            />
                            <textarea
                                placeholder="Parámetros del caso"
                                value={editTestCase.parametros_caso}
                                onChange={(e) => setEditTestCase({ ...editTestCase, parametros_caso: e.target.value })}
                            />
                            <select
                                value={editTestCase.id_estado}
                                onChange={(e) => setEditTestCase({ ...editTestCase, id_estado: e.target.value })}
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
                                    value={editTestCase.fecha_inicio}
                                    onChange={(e) => setEditTestCase({ ...editTestCase, fecha_inicio: e.target.value })}
                                />
                            </label>
                            <label>
                                Fecha de Fin:
                                <input
                                    type="date"
                                    value={editTestCase.fecha_fin}
                                    onChange={(e) => setEditTestCase({ ...editTestCase, fecha_fin: e.target.value })}
                                />
                            </label>
                            <label>Código del Script:</label>
                            <textarea
                                value={editTestCase.codigo_script}
                                onChange={(e) => setEditTestCase({ ...editTestCase, codigo_script: e.target.value })}
                                className="script-textarea"
                            />

                            <p className="help-text">
                                Su script debe estar envuelto en una función autoejecutable (IIFE) y debe retornar <code>true</code> si la prueba es exitosa, o <code>false</code> o un objeto con una propiedad <code>detalles</code> si falla.
                            </p>
                            <pre className="code-example">
{`(() => {
    // Su código aquí
    const expected = ...;
    const actual = ...;
    return actual === expected;
})();

Ejemplo:

(() => {
    const expected = 15;
    const actual = 5 + 10;
    return actual === expected;
})();`}
                            </pre>
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleUpdateTestCase} className="update-test-case-button">Guardar Cambios</button>
                            <button onClick={() => setShowEditModal(false)} className="close-button">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestCases;
