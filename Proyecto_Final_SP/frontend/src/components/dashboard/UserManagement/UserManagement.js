// src/components/userManagement/UserManagement.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';

const UserManagement = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', email: '', password: '', rol: '' });
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [roles, setRoles] = useState([]); 
    const navigate = useNavigate();

    // Función para cargar los roles desde el backend
    const cargarRoles = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/roles'); 
            setRoles(response.data);
        } catch (error) {
            console.error('Error al cargar los roles:', error);
        }
    };

    // Función para cargar los usuarios desde el backend
    const cargarUsuarios = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/usuarios');
            setUsuarios(response.data);
        } catch (error) {
            console.error('Error al cargar los usuarios:', error);
        }
    };

    // Cargar usuarios y roles al iniciar el componente
    useEffect(() => {
        cargarUsuarios();
        cargarRoles(); // Cargar roles junto con los usuarios
    }, []);   

    // Función para manejar la apertura del modal de edición
    const handleEditClick = (usuario) => {
        setSelectedUser(usuario);
        setFormData({ 
            nombre: usuario.nombre, 
            email: usuario.email, 
            rol: usuario.id_rol 
        });
        setShowEditModal(true);
    };

    // Función para manejar la apertura del modal de eliminación
    const handleDeleteClick = (usuario) => {
        setSelectedUser(usuario);
        setShowDeleteModal(true);
    };

    // Función para abrir el modal de creación
    const handleCreateClick = () => {
        setFormData({ nombre: '', email: '', password: '', rol: roles[0]?.id_rol || '' }); // Configura un rol predeterminado
        setShowCreateModal(true);
    };

    // Función para cerrar los modales
    const closeModals = () => {
        setShowEditModal(false);
        setShowDeleteModal(false);
        setShowCreateModal(false);
        setSelectedUser(null);
    };

    // Función para manejar los cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Función para crear un nuevo usuario
    const handleCreateUser = async () => {
        try {
            await axios.post('http://localhost:3001/api/usuarios', formData);
            cargarUsuarios();
            setConfirmationMessage('Usuario creado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
            closeModals();
        } catch (error) {
            console.error('Error al crear el usuario:', error);
        }
    };

    // Función para actualizar el usuario
    const handleUpdateUser = async () => {
        try {
            await axios.put(`http://localhost:3001/api/usuarios/${selectedUser.id_usuario}`, formData);
            cargarUsuarios();
            setConfirmationMessage('Usuario actualizado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
            closeModals();
        } catch (error) {
            console.error('Error al actualizar el usuario:', error);
        }
    };

    // Función para eliminar el usuario
    const handleDeleteUser = async () => {
        try {
            await axios.delete(`http://localhost:3001/api/usuarios/${selectedUser.id_usuario}`);
            cargarUsuarios();
            setConfirmationMessage('Usuario eliminado correctamente.');
            setTimeout(() => setConfirmationMessage(''), 3000);
            closeModals();
        } catch (error) {
            console.error('Error al eliminar el usuario:', error);
        }
    };

    // Función para regresar a la página anterior
    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="user-management-container">
            <div className="header-container">
                <h2>Administrar Usuarios</h2>
                <div className="button-container">
                    <button onClick={handleBack} className="back-button">Regresar</button>
                    <button onClick={handleCreateClick} className="create-button">Crear Nuevo Usuario</button>
                </div>
            </div>
            {confirmationMessage && (
                <div className="confirmation-message">
                    {confirmationMessage}
                </div>
            )}
            <table className="user-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map((usuario) => (
                        <tr key={usuario.id_usuario}>
                            <td>{usuario.id_usuario}</td>
                            <td>{usuario.nombre}</td>
                            <td>{usuario.email}</td>
                            <td>{usuario.nombre_rol}</td>
                            <td>
                                <button onClick={() => handleEditClick(usuario)} className="edit-button">Editar</button>
                                <button onClick={() => handleDeleteClick(usuario)} className="delete-button">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal para crear */}
            {showCreateModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Crear Nuevo Usuario</h3>
                        <form>
                            <label>
                                Nombre:
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Email:
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Contraseña:
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Rol:
                                <select
                                    name="rol"
                                    value={formData.rol}
                                    onChange={handleInputChange}
                                >
                                    {roles.map((role) => (
                                        <option key={role.id_rol} value={role.id_rol}>
                                            {role.nombre_rol}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </form>
                        <button onClick={handleCreateUser}>Crear Usuario</button>
                        <button onClick={closeModals}>Cerrar</button>
                    </div>
                </div>
            )}

            {/* Modal para editar */}
            {showEditModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Editar Usuario</h3>
                        <form>
                            <label>
                                Nombre:
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Email:
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Rol:
                                <br />
                                <select
                                    name="rol"
                                    value={formData.rol || ''} 
                                    onChange={handleInputChange}
                                >
                                    {roles.map((role) => (
                                        <option key={role.id_rol} value={role.id_rol}>
                                            {role.nombre_rol}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {/* Campo opcional para cambiar la contraseña */}
                            <br />
                            <label>
                                Nueva Contraseña (opcional):
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password || ''} // Utiliza un valor vacío por defecto
                                    onChange={handleInputChange}
                                />
                            </label>
                        </form>
                        <button onClick={handleUpdateUser}>Guardar Cambios</button>
                        <button onClick={closeModals}>Cerrar</button>
                    </div>
                </div>
            )}

            {/* Modal para eliminar */}
            {showDeleteModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Eliminar Usuario</h3>
                        <p>¿Estás seguro de que deseas eliminar a {selectedUser?.nombre}?</p>
                        <button onClick={closeModals}>Cancelar</button>
                        <button className="delete-button" onClick={handleDeleteUser}>Eliminar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
