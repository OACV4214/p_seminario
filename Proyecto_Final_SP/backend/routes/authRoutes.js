// authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const database = require('../config/db'); 
const vm = require('vm');

// Ruta de autenticación
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar que el usuario exista y que su estado sea 1 (activo)
        const [rows] = await database.query('SELECT * FROM usuarios WHERE email = ? AND estado = 1', [email]);
        const user = rows[0];

        if (!user) {
            return res.json({ success: false, message: 'Correo o contraseña incorrectos o cuenta inactiva' });
        }

        // Comparar la contraseña ingresada con la almacenada en la base de datos
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: 'Correo o contraseña incorrectos' });
        }

        // Asegurarse de que user tiene las propiedades correctas
        console.log('Usuario autenticado:', user);

        // Si todo está correcto, enviar respuesta de éxito con datos adicionales
        return res.json({
            success: true,
            message: 'Login exitoso',
            nombre: user.nombre || user.nombre_usuario,
            id_usuario: user.id_usuario,
            id_rol: user.id_rol
        });
    } catch (error) {
        console.error('Error en la autenticación:', error);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});


// Ruta para obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
    try {
        const [rows] = await database.query(`
            SELECT usuarios.id_usuario, usuarios.nombre, usuarios.email, usuarios.estado, usuarios.id_rol, roles.nombre_rol
            FROM usuarios
            JOIN roles ON usuarios.id_rol = roles.id_rol
            Where estado = 1
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los usuarios' });
    }
});


// Ruta para crear un nuevo usuario 
router.post('/usuarios', async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    try {
        // Encripta la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserta el nuevo usuario con la contraseña encriptada
        await database.query(
            'INSERT INTO usuarios (nombre, email, password, id_rol,estado) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, hashedPassword, rol,1]
        );

        res.json({ success: true, message: 'Usuario creado correctamente' });
    } catch (error) {
        console.error('Error al crear el usuario:', error.message);
        res.status(500).json({ success: false, message: 'Error al crear el usuario' });
    }
});

// Conseguir Roles
router.get('/roles', async (req, res) => {
    try {
        const [roles] = await database.query('SELECT id_rol, nombre_rol FROM roles');
        res.json(roles);
    } catch (error) {
        console.error('Error al obtener los roles:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los roles' });
    }
});


// Ruta para actualizar un usuario
router.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, rol, password } = req.body;

    try {
        if (password) {
            // Si se proporciona una nueva contraseña, encriptarla antes de actualizar
            const hashedPassword = await bcrypt.hash(password, 10);
            await database.query(
                'UPDATE usuarios SET nombre = ?, email = ?, id_rol = ?, password = ? WHERE id_usuario = ?',
                [nombre, email, rol, hashedPassword, id]
            );
        } else {
            // Si no se proporciona una contraseña, actualizar los demás campos
            await database.query(
                'UPDATE usuarios SET nombre = ?, email = ?, id_rol = ? WHERE id_usuario = ?',
                [nombre, email, rol, id]
            );
        }

        res.json({ success: true, message: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el usuario' });
    }
});



// Ruta para "eliminar" un usuario (cambia el estado a 0)
router.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await database.query('UPDATE usuarios SET estado = 0 WHERE id_usuario = ?', [id]);
        res.json({ success: true, message: 'Usuario desactivado correctamente' });
    } catch (error) {
        console.error('Error al desactivar el usuario:', error);
        res.status(500).json({ success: false, message: 'Error al desactivar el usuario' });
    }
});


// Ruta para obtener todos los proyectos con estado, plazo y usuario asignado
router.get('/proyectos', async (req, res) => {
    try {
        const [rows] = await database.query(`
            SELECT 
                proyectos.id_proyecto, 
                proyectos.nombre_proyecto, 
                proyectos.descripcion_proyecto, 
                proyectos.id_estado,  -- Incluimos id_estado para editar
                estados.nombre_estado AS estado, 
                proyectos.id_plazo,
                plazos.fecha_inicio, 
                plazos.fecha_fin, 
                proyectos_usuarios.id_usuario AS id_usuario_asignado, -- Incluimos id_usuario para editar
                usuarios.nombre AS nombre_usuario
            FROM proyectos
            LEFT JOIN estados ON proyectos.id_estado = estados.id_estado
            LEFT JOIN plazos ON proyectos.id_plazo = plazos.id_plazo
            LEFT JOIN proyectos_usuarios ON proyectos.id_proyecto = proyectos_usuarios.id_proyecto
            LEFT JOIN usuarios ON proyectos_usuarios.id_usuario = usuarios.id_usuario
            WHERE proyectos.estado_activo = 1
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los proyectos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los proyectos' });
    }
});


// Ruta para crear un plazo
router.post('/plazos', async (req, res) => {
    const { fecha_inicio, fecha_fin } = req.body;

    if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ success: false, message: 'Fecha de inicio y fin son obligatorias' });
    }

    try {
        const [result] = await database.query(
            'INSERT INTO plazos (fecha_inicio, fecha_fin) VALUES (?, ?)',
            [fecha_inicio, fecha_fin]
        );
        
        // Devolver el id del plazo creado
        res.json({ success: true, id_plazo: result.insertId });
    } catch (error) {
        console.error('Error al crear el plazo:', error);
        res.status(500).json({ success: false, message: 'Error al crear el plazo' });
    }
});


// Ruta para crear un proyecto
router.post('/proyectos', async (req, res) => {
    const { nombre_proyecto, descripcion_proyecto, id_estado, id_plazo, id_usuario_asignado } = req.body;

    if (!nombre_proyecto || !id_estado || !id_plazo) {
        return res.status(400).json({ success: false, message: 'Nombre, estado y plazo son obligatorios' });
    }

    try {
        // Inserta el proyecto en la tabla `proyectos`
        const [projectResult] = await database.query(
            'INSERT INTO proyectos (nombre_proyecto, descripcion_proyecto, id_estado, id_plazo, estado_activo) VALUES (?, ?, ?, ?, 1)',
            [nombre_proyecto, descripcion_proyecto, id_estado, id_plazo]
        );

        const id_proyecto = projectResult.insertId; // Obtiene el id del proyecto recién creado

        // Inserta la relación en `proyectos_usuarios`
        if (id_usuario_asignado) {
            await database.query(
                'INSERT INTO proyectos_usuarios (id_proyecto, id_usuario) VALUES (?, ?)',
                [id_proyecto, id_usuario_asignado]
            );
        }

        res.json({ success: true, message: 'Proyecto creado correctamente' });
    } catch (error) {
        console.error('Error al crear el proyecto:', error);
        res.status(500).json({ success: false, message: 'Error al crear el proyecto' });
    }
});


// Ruta para obtener todos los estados
router.get('/estados', async (req, res) => {
    try {
        const [rows] = await database.query('SELECT * FROM estados');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los estados:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los estados' });
    }
});

// Ruta para actualizar un proyecto existente
router.put('/proyectos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_proyecto, descripcion_proyecto, id_estado, id_usuario_asignado, id_plazo } = req.body;

    try {
        // Actualiza la información general del proyecto
        const query = id_plazo
            ? 'UPDATE proyectos SET nombre_proyecto = ?, descripcion_proyecto = ?, id_estado = ?, id_plazo = ? WHERE id_proyecto = ?'
            : 'UPDATE proyectos SET nombre_proyecto = ?, descripcion_proyecto = ?, id_estado = ? WHERE id_proyecto = ?';

        const params = id_plazo
            ? [nombre_proyecto, descripcion_proyecto, id_estado, id_plazo, id]
            : [nombre_proyecto, descripcion_proyecto, id_estado, id];

        await database.query(query, params);

        // Actualizar el usuario asignado en `proyectos_usuarios`
        if (id_usuario_asignado) {
            const [existingAssignment] = await database.query(
                'SELECT * FROM proyectos_usuarios WHERE id_proyecto = ?',
                [id]
            );

            if (existingAssignment.length > 0) {
                // Si ya existe una asignación, actualiza el usuario
                await database.query(
                    'UPDATE proyectos_usuarios SET id_usuario = ? WHERE id_proyecto = ?',
                    [id_usuario_asignado, id]
                );
            } else {
                // Si no existe una asignación, crea una nueva
                await database.query(
                    'INSERT INTO proyectos_usuarios (id_proyecto, id_usuario) VALUES (?, ?)',
                    [id, id_usuario_asignado]
                );
            }
        }

        res.json({ success: true, message: 'Proyecto actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el proyecto:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el proyecto' });
    }
});


// Ruta para actualizar un plazo existente
router.put('/plazos/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin } = req.body;

    try {
        await database.query(
            'UPDATE plazos SET fecha_inicio = ?, fecha_fin = ? WHERE id_plazo = ?',
            [fecha_inicio, fecha_fin, id]
        );
        res.json({ success: true, message: 'Plazo actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el plazo:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el plazo' });
    }
});

// Ruta para "eliminar" un proyecto (cambia estado_activo a 0)
router.delete('/proyectos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await database.query('UPDATE proyectos SET estado_activo = 0 WHERE id_proyecto = ?', [id]);
        res.json({ success: true, message: 'Proyecto desactivado correctamente' });
    } catch (error) {
        console.error('Error al desactivar el proyecto:', error);
        res.status(500).json({ success: false, message: 'Error al desactivar el proyecto' });
    }
});


// PreviewProject

// Ruta para obtener la información principal del proyecto por ID
router.get('/proyectos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await database.query(`
            SELECT 
                proyectos.id_proyecto AS id,
                proyectos.nombre_proyecto,
                proyectos.descripcion_proyecto,
                estados.nombre_estado AS estado,
                plazos.fecha_inicio,
                plazos.fecha_fin,
                usuarios.nombre AS nombre_usuario
            FROM proyectos
            LEFT JOIN estados ON proyectos.id_estado = estados.id_estado
            LEFT JOIN plazos ON proyectos.id_plazo = plazos.id_plazo
            LEFT JOIN proyectos_usuarios ON proyectos.id_proyecto = proyectos_usuarios.id_proyecto
            LEFT JOIN usuarios ON proyectos_usuarios.id_usuario = usuarios.id_usuario
            WHERE proyectos.id_proyecto = ?
        `, [id]);

        res.json(rows[0] || {});  // Retorna solo el primer resultado
    } catch (error) {
        console.error('Error al obtener el proyecto:', error);
        res.status(500).json({ success: false, message: 'Error al obtener el proyecto' });
    }
});

// Ruta para obtener los detalles adicionales del proyecto (como tareas) por ID de proyecto
router.get('/proyectos/:id/detalles', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await database.query(`
            SELECT 
                detalles.id,
                detalles.nombre_tarea,
                detalles.descripcion,
                detalles.estado,
                responsables.nombre AS responsable
            FROM detalles
            LEFT JOIN responsables ON detalles.id_responsable = responsables.id_responsable
            WHERE detalles.id_proyecto = ?
        `, [id]);

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los detalles del proyecto:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los detalles del proyecto' });
    }
});

// Rutas para Hitos


// Obtener todos los hitos de un proyecto específico
router.get('/proyectos/:id/hitos', async (req, res) => {
    const { id } = req.params;
    try {
        const [hitos] = await database.query(`
            SELECT 
                h.id_hito, 
                h.nombre_hito, 
                h.descripcion_hito, 
                h.id_proyecto, 
                h.id_plazo, 
                h.id_estado, 
                e.nombre_estado,
                p.fecha_inicio, 
                p.fecha_fin
            FROM hitos AS h
            LEFT JOIN estados AS e ON h.id_estado = e.id_estado
            LEFT JOIN plazos AS p ON h.id_plazo = p.id_plazo
            WHERE h.id_proyecto = ? AND h.estado_activo = 1
        `, [id]);
        res.json(hitos);
    } catch (error) {
        console.error('Error al obtener los hitos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los hitos' });
    }
});

// Crear un nuevo hito
router.post('/hitos', async (req, res) => {
    const { nombre_hito, descripcion_hito, id_proyecto, id_plazo, id_estado } = req.body;
    try {
        await database.query(
            'INSERT INTO hitos (nombre_hito, descripcion_hito, id_proyecto, id_plazo, id_estado, estado_activo) VALUES (?, ?, ?, ?, ?, 1)',
            [nombre_hito, descripcion_hito, id_proyecto, id_plazo, id_estado]
        );
        res.json({ success: true, message: 'Hito creado correctamente' });
    } catch (error) {
        console.error('Error al crear el hito:', error);
        res.status(500).json({ success: false, message: 'Error al crear el hito' });
    }
});

// Modificar un hito existente
router.put('/hitos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_hito, descripcion_hito, id_plazo, fecha_inicio, fecha_fin, id_estado } = req.body;

    try {
        // Actualizar el plazo si el id_plazo está presente
        if (id_plazo) {
            const [result] = await database.query(
                'UPDATE plazos SET fecha_inicio = ?, fecha_fin = ? WHERE id_plazo = ?',
                [fecha_inicio, fecha_fin, id_plazo]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Plazo no encontrado' });
            }
        }

        // Actualizar los datos del hito
        await database.query(
            'UPDATE hitos SET nombre_hito = ?, descripcion_hito = ?, id_estado = ? WHERE id_hito = ?',
            [nombre_hito, descripcion_hito, id_estado, id]
        );

        res.json({ success: true, message: 'Hito actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el hito:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el hito' });
    }
});

// Eliminar un hito (cambia estado_activo a 0)
router.delete('/hitos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await database.query('UPDATE hitos SET estado_activo = 0 WHERE id_hito = ?', [id]);
        res.json({ success: true, message: 'Hito eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el hito:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el hito' });
    }
});

// TestPlanning.js


// Ruta para obtener los planes de prueba de un proyecto específico
router.get('/proyectos/:projectId/planes_prueba', async (req, res) => {
    const { projectId } = req.params;
    try {
        const [testPlans] = await database.query(`
            SELECT 
                pp.id_plan, 
                pp.nombre_plan, 
                pp.descripcion_plan, 
                pp.id_plazo, 
                p.fecha_inicio, 
                p.fecha_fin, 
                pp.id_estado,         -- Incluye id_estado aquí
                e.nombre_estado, 
                u.nombre AS nombre_usuario,
                pp.id_usuario
            FROM planes_prueba AS pp
            LEFT JOIN plazos AS p ON pp.id_plazo = p.id_plazo
            LEFT JOIN estados AS e ON pp.id_estado = e.id_estado
            LEFT JOIN usuarios AS u ON pp.id_usuario = u.id_usuario
            WHERE pp.id_proyecto = ? AND pp.estado_activo = 1
        `, [projectId]);
        res.json(testPlans);
    } catch (error) {
        console.error('Error al obtener los planes de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los planes de prueba' });
    }
});


// Ruta para crear un nuevo plan de prueba
router.post('/planes_prueba', async (req, res) => {
    const { nombre_plan, descripcion_plan, id_proyecto, fecha_inicio, fecha_fin, id_estado, id_usuario } = req.body;

    console.log("Received id_proyecto:", id_proyecto); // Log to verify project ID
    try {
        let id_plazo;

        // Check for existing plazo
        const [existingPlazo] = await database.query(
            'SELECT id_plazo FROM plazos WHERE fecha_inicio = ? AND fecha_fin = ?',
            [fecha_inicio, fecha_fin]
        );

        if (existingPlazo.length > 0) {
            id_plazo = existingPlazo[0].id_plazo;
        } else {
            const [plazoResult] = await database.query(
                'INSERT INTO plazos (fecha_inicio, fecha_fin) VALUES (?, ?)',
                [fecha_inicio, fecha_fin]
            );
            id_plazo = plazoResult.insertId;
        }

        // Insert into `planes_prueba`
        await database.query(
            'INSERT INTO planes_prueba (nombre_plan, descripcion_plan, id_plazo, id_estado, id_proyecto, id_usuario) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre_plan, descripcion_plan, id_plazo, id_estado, id_proyecto, id_usuario]
        );

        res.json({ success: true, message: 'Plan de prueba creado correctamente' });
    } catch (error) {
        console.error('Error al crear el plan de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al crear el plan de prueba' });
    }
});

// Ruta para actualizar un plan de prueba existente
router.put('/planes_prueba/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_plan, descripcion_plan, id_plazo, id_estado, id_usuario, fecha_inicio, fecha_fin } = req.body;

    try {
        // Verificar que id_plazo y las fechas estén definidas antes de actualizar
        if (id_plazo && fecha_inicio && fecha_fin) {
            await database.query(
                'UPDATE plazos SET fecha_inicio = ?, fecha_fin = ? WHERE id_plazo = ?',
                [fecha_inicio, fecha_fin, id_plazo]
            );
        }

        // Actualizar el plan de prueba
        await database.query(
            'UPDATE planes_prueba SET nombre_plan = ?, descripcion_plan = ?, id_estado = ?, id_usuario = ? WHERE id_plan = ?',
            [nombre_plan, descripcion_plan, id_estado, id_usuario, id]
        );

        res.json({ success: true, message: 'Plan de prueba actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el plan de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el plan de prueba' });
    }
});

// Eliminar un plan de prueba (cambia estado_activo a 0)
router.delete('/planes_prueba/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Actualizar estado_activo a 0 en lugar de eliminar el registro
        await database.query('UPDATE planes_prueba SET estado_activo = 0 WHERE id_plan = ?', [id]);
        res.json({ success: true, message: 'Plan de prueba eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el plan de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el plan de prueba' });
    }
});

// TestCases

// Obtener todos los casos de prueba de un plan específico
router.get('/planes_prueba/:id_plan/casos_prueba', async (req, res) => {
    const { id_plan } = req.params;
    try {
        const [testCases] = await database.query(`
            SELECT 
                cp.*, 
                e.nombre_estado, 
                p.fecha_inicio, 
                p.fecha_fin
            FROM casos_prueba AS cp
            LEFT JOIN estados AS e ON cp.id_estado = e.id_estado
            LEFT JOIN plazos AS p ON cp.id_plazo = p.id_plazo
            WHERE cp.id_plan = ? AND cp.estado_activo = 1
        `, [id_plan]);
        res.json(testCases);
    } catch (error) {
        console.error('Error al obtener los casos de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los casos de prueba' });
    }
});

// Crear un nuevo caso de prueba
router.post('/casos_prueba', async (req, res) => {
    const { nombre_caso, descripcion_caso, parametros_caso, id_plan, id_estado, fecha_inicio, fecha_fin, codigo_script } = req.body;
    try {
        let id_plazo;

        // Verificar si ya existe un plazo con las mismas fechas
        const [existingPlazo] = await database.query(
            'SELECT id_plazo FROM plazos WHERE fecha_inicio = ? AND fecha_fin = ?',
            [fecha_inicio, fecha_fin]
        );

        if (existingPlazo.length > 0) {
            id_plazo = existingPlazo[0].id_plazo;
        } else {
            const [plazoResult] = await database.query(
                'INSERT INTO plazos (fecha_inicio, fecha_fin) VALUES (?, ?)',
                [fecha_inicio, fecha_fin]
            );
            id_plazo = plazoResult.insertId;
        }

        await database.query(
            'INSERT INTO casos_prueba (nombre_caso, descripcion_caso, parametros_caso, id_plan, id_estado, id_plazo, codigo_script) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre_caso, descripcion_caso, parametros_caso, id_plan, id_estado, id_plazo, codigo_script]
        );
        res.json({ success: true, message: 'Caso de prueba creado correctamente' });
    } catch (error) {
        console.error('Error al crear el caso de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al crear el caso de prueba' });
    }
});

// Actualizar un caso de prueba existente
router.put('/casos_prueba/:id_caso', async (req, res) => {
    const { id_caso } = req.params;
    const { nombre_caso, descripcion_caso, parametros_caso, id_estado, id_plazo, fecha_inicio, fecha_fin, codigo_script } = req.body;

    try {
        // Actualizar el plazo si es necesario
        if (id_plazo && fecha_inicio && fecha_fin) {
            await database.query(
                'UPDATE plazos SET fecha_inicio = ?, fecha_fin = ? WHERE id_plazo = ?',
                [fecha_inicio, fecha_fin, id_plazo]
            );
        }

        // Actualizar el caso de prueba
        await database.query(
            'UPDATE casos_prueba SET nombre_caso = ?, descripcion_caso = ?, parametros_caso = ?, id_estado = ?, codigo_script = ? WHERE id_caso = ?',
            [nombre_caso, descripcion_caso, parametros_caso, id_estado, codigo_script, id_caso]
        );

        res.json({ success: true, message: 'Caso de prueba actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el caso de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el caso de prueba' });
    }
});

// "Eliminar" un caso de prueba (marcar como inactivo)
router.delete('/casos_prueba/:id_caso', async (req, res) => {
    const { id_caso } = req.params;
    try {
        await database.query('UPDATE casos_prueba SET estado_activo = 0 WHERE id_caso = ?', [id_caso]);
        res.json({ success: true, message: 'Caso de prueba eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el caso de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el caso de prueba' });
    }
});

// Ejecutar un caso de prueba
router.post('/casos_prueba/:id_caso/ejecutar', async (req, res) => {
    const { id_caso } = req.params;
    try {
        // Obtener el código del script asociado al caso de prueba
        const [caso] = await database.query('SELECT codigo_script FROM casos_prueba WHERE id_caso = ?', [id_caso]);
        if (caso.length === 0) {
            return res.status(404).json({ success: false, message: 'Caso de prueba no encontrado' });
        }

        const codigoScript = caso[0].codigo_script;

        // Ejecutar el código del script en una sandbox segura
        const sandbox = {};
        vm.createContext(sandbox);
        let executionResult;
        let resultadoObtenido = '';
        let detallesResultado = '';
        try {
            executionResult = vm.runInContext(codigoScript, sandbox, { timeout: 5000 });

            if (executionResult === true) {
                resultadoObtenido = 'Exitoso';
                detallesResultado = 'El script se ejecutó correctamente.';
            } else if (executionResult === false) {
                resultadoObtenido = 'Fallido';
                detallesResultado = 'El script retornó false.';
            } else if (typeof executionResult === 'object' && executionResult !== null && 'detalles' in executionResult) {
                resultadoObtenido = 'Fallido';
                detallesResultado = executionResult.detalles;
            } else {
                resultadoObtenido = 'Fallido';
                detallesResultado = 'El script no retornó true ni false.';
            }
        } catch (scriptError) {
            resultadoObtenido = 'Fallido';
            detallesResultado = `Error en la ejecución del script: ${scriptError.message}`;
        }

        // Registrar el resultado
        await database.query(
            'INSERT INTO resultados_pruebas (resultado_obtenido, detalles_resultado, fecha_ejecucion, id_caso) VALUES (?, ?, NOW(), ?)',
            [resultadoObtenido, detallesResultado, id_caso]
        );

        res.json({ success: true, message: 'Caso de prueba ejecutado correctamente', output: resultadoObtenido });
    } catch (error) {
        console.error('Error al ejecutar el caso de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al ejecutar el caso de prueba' });
    }
});


// Obtener todos los resultados de un caso de prueba específico
router.get('/casos_prueba/:id_caso/resultados', async (req, res) => {
    const { id_caso } = req.params;
    try {
        const [resultados] = await database.query(
            'SELECT * FROM resultados_pruebas WHERE id_caso = ? AND estado_activo = 1',
            [id_caso]
        );
        res.json(resultados);
    } catch (error) {
        console.error('Error al obtener los resultados de pruebas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los resultados de pruebas' });
    }
});

// Crear un nuevo resultado de prueba
router.post('/resultados_pruebas', async (req, res) => {
    const { resultado_obtenido, detalles_resultado, fecha_ejecucion, id_caso } = req.body;
    try {
        await database.query(
            'INSERT INTO resultados_pruebas (resultado_obtenido, detalles_resultado, fecha_ejecucion, id_caso) VALUES (?, ?, ?, ?)',
            [resultado_obtenido, detalles_resultado, fecha_ejecucion, id_caso]
        );
        res.json({ success: true, message: 'Resultado de prueba creado correctamente' });
    } catch (error) {
        console.error('Error al crear el resultado de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al crear el resultado de prueba' });
    }
});

// Actualizar un resultado de prueba existente
router.put('/resultados_pruebas/:id_resultado', async (req, res) => {
    const { id_resultado } = req.params;
    const { resultado_obtenido, detalles_resultado, fecha_ejecucion } = req.body;
    try {
        await database.query(
            'UPDATE resultados_pruebas SET resultado_obtenido = ?, detalles_resultado = ?, fecha_ejecucion = ? WHERE id_resultado = ?',
            [resultado_obtenido, detalles_resultado, fecha_ejecucion, id_resultado]
        );
        res.json({ success: true, message: 'Resultado de prueba actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el resultado de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el resultado de prueba' });
    }
});

// "Eliminar" un resultado de prueba (marcar como inactivo)
router.delete('/resultados_pruebas/:id_resultado', async (req, res) => {
    const { id_resultado } = req.params;
    try {
        await database.query('UPDATE resultados_pruebas SET estado_activo = 0 WHERE id_resultado = ?', [id_resultado]);
        res.json({ success: true, message: 'Resultado de prueba eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el resultado de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el resultado de prueba' });
    }
});



// TestResults 

// Obtener todos los resultados de un caso de prueba específico
router.get('/casos_prueba/:id_caso/resultados', async (req, res) => {
    const { id_caso } = req.params;
    try {
        const [resultados] = await database.query(
            'SELECT * FROM resultados_pruebas WHERE id_caso = ? AND estado_activo = 1',
            [id_caso]
        );
        res.json(resultados);
    } catch (error) {
        console.error('Error al obtener los resultados de pruebas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los resultados de pruebas' });
    }
});


// Crear un nuevo resultado de prueba
router.post('/resultados_pruebas', async (req, res) => {
    const { resultado_obtenido, detalles_resultado, fecha_ejecucion, id_caso } = req.body;
    try {
        await database.query(
            'INSERT INTO resultados_pruebas (resultado_obtenido, detalles_resultado, fecha_ejecucion, id_caso) VALUES (?, ?, ?, ?)',
            [resultado_obtenido, detalles_resultado, fecha_ejecucion, id_caso]
        );
        res.json({ success: true, message: 'Resultado de prueba creado correctamente' });
    } catch (error) {
        console.error('Error al crear el resultado de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al crear el resultado de prueba' });
    }
});


// Actualizar un resultado de prueba existente
router.put('/resultados_pruebas/:id_resultado', async (req, res) => {
    const { id_resultado } = req.params;
    const { resultado_obtenido, detalles_resultado, fecha_ejecucion } = req.body;
    try {
        await database.query(
            'UPDATE resultados_pruebas SET resultado_obtenido = ?, detalles_resultado = ?, fecha_ejecucion = ? WHERE id_resultado = ?',
            [resultado_obtenido, detalles_resultado, fecha_ejecucion, id_resultado]
        );
        res.json({ success: true, message: 'Resultado de prueba actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el resultado de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el resultado de prueba' });
    }
});


// "Eliminar" un resultado de prueba (marcar como inactivo)
router.delete('/resultados_pruebas/:id_resultado', async (req, res) => {
    const { id_resultado } = req.params;
    try {
        await database.query(
            'UPDATE resultados_pruebas SET estado_activo = 0 WHERE id_resultado = ?',
            [id_resultado]
        );
        res.json({ success: true, message: 'Resultado de prueba eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el resultado de prueba:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el resultado de prueba' });
    }
});

// Defects

// GET /api/casos_prueba/:id_caso/ultimo_resultado
router.get('/api/casos_prueba/:id_caso/ultimo_resultado', async (req, res) => {
    const { id_caso } = req.params;
    try {
        const [resultados] = await database.query(
            'SELECT resultado_obtenido FROM resultados_pruebas WHERE id_caso = ? ORDER BY fecha_ejecucion DESC LIMIT 1',
            [id_caso]
        );
        if (resultados.length > 0) {
            res.json({ resultado_obtenido: resultados[0].resultado_obtenido });
        } else {
            res.json({ resultado_obtenido: null });
        }
    } catch (error) {
        console.error('Error al obtener el último resultado:', error);
        res.status(500).json({ message: 'Error al obtener el último resultado' });
    }
});

// GET /api/defectos
router.get('/defectos', async (req, res) => {
    const { id_caso } = req.query; // Obtener id_caso de los parámetros de consulta

    let query = `
        SELECT d.*, e.nombre_estado, u.nombre, c.nombre_clasificacion
        FROM defectos d
        LEFT JOIN estados e ON d.id_estado = e.id_estado
        LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario
        LEFT JOIN clasificacion_defecto c ON d.id_clasificacion = c.id_clasificacion
        WHERE d.estado_activo = 1
    `;

    let params = [];
    if (id_caso) {
        query += ' AND d.id_caso = ?';
        params.push(id_caso);
    }

    try {
        const [defectos] = await database.query(query, params);
        res.json(defectos);
    } catch (error) {
        console.error('Error al obtener defectos:', error);
        res.status(500).json({ message: 'Error al obtener defectos' });
    }
});

// POST /api/defectos
router.post('/defectos', async (req, res) => {
    const {
        nombre_defecto,
        descripcion_defecto,
        notas_defecto,
        id_estado,
        id_usuario,
        id_clasificacion,
        id_caso // Asegúrate de que este campo se incluya en la solicitud
    } = req.body;

    try {
        await database.query(
            'INSERT INTO defectos (nombre_defecto, descripcion_defecto, notas_defecto, id_estado, id_usuario, id_clasificacion, id_caso) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre_defecto, descripcion_defecto, notas_defecto, id_estado, id_usuario, id_clasificacion, id_caso]
        );
        res.json({ message: 'Defecto creado exitosamente' });
    } catch (error) {
        console.error('Error al crear defecto:', error);
        res.status(500).json({ message: 'Error al crear defecto' });
    }
});


// PUT /api/defectos/:id_defecto
router.put('/defectos/:id_defecto', async (req, res) => {
    const { id_defecto } = req.params;
    const {
      nombre_defecto,
      descripcion_defecto,
      notas_defecto,
      id_estado,
      id_usuario,
      id_clasificacion,
    } = req.body;

    try {
      // Consulta SQL con la lógica para actualizar fecha_resolucion
      let query = `
        UPDATE defectos SET
          nombre_defecto = ?,
          descripcion_defecto = ?,
          notas_defecto = ?,
          id_estado = ?,
          id_usuario = ?,
          id_clasificacion = ?,
          fecha_resolucion = CASE
            WHEN ? = 4 THEN NOW()
            ELSE fecha_resolucion
          END
        WHERE id_defecto = ?
      `;

      // Parámetros para la consulta
      let params = [
        nombre_defecto,
        descripcion_defecto,
        notas_defecto,
        id_estado,
        id_usuario,
        id_clasificacion,
        id_estado, // Valor para el CASE en la consulta
        id_defecto
      ];

      await database.query(query, params);
      res.json({ message: 'Defecto actualizado exitosamente' });
    } catch (error) {
      console.error('Error al actualizar defecto:', error);
      res.status(500).json({ message: 'Error al actualizar defecto' });
    }
});

// DELETE /api/defectos/:id_defecto
router.delete('/defectos/:id_defecto', async (req, res) => {
    const { id_defecto } = req.params;

    try {
      await database.query('UPDATE defectos SET estado_activo = 0 WHERE id_defecto = ?', [id_defecto]);
      res.json({ message: 'Defecto eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar defecto:', error);
      res.status(500).json({ message: 'Error al eliminar defecto' });
    }
});

// GET /api/defectos/:id_defecto
router.get('/defectos/:id_defecto', async (req, res) => {
    const { id_defecto } = req.params;

    try {
      const [defecto] = await database.query(`
        SELECT d.*, e.nombre_estado, u.nombre_usuario, c.nombre_clasificacion
        FROM defectos d
        LEFT JOIN estados e ON d.id_estado = e.id_estado
        LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario
        LEFT JOIN clasificacion_defecto c ON d.id_clasificacion = c.id_clasificacion
        WHERE d.id_defecto = ? AND d.estado_activo = 1`,
        [id_defecto]
      );
      if (defecto.length === 0) {
        res.status(404).json({ message: 'Defecto no encontrado' });
      } else {
        res.json(defecto[0]);
      }
    } catch (error) {
      console.error('Error al obtener defecto:', error);
      res.status(500).json({ message: 'Error al obtener defecto' });
    }
});

// GET /api/clasificaciones_defecto
router.get('/clasificaciones_defecto', async (req, res) => {
    try {
      const [clasificaciones] = await database.query('SELECT * FROM clasificacion_defecto');
      res.json(clasificaciones);
    } catch (error) {
      console.error('Error al obtener clasificaciones:', error);
      res.status(500).json({ message: 'Error al obtener clasificaciones' });
    }
});

//Informes

//metricas
router.get('/proyectos/:id/metricas', async (req, res) => {
    const { id } = req.params;
    try {
        console.log('Iniciando la obtención de métricas para el proyecto con id:', id);

        // Obtener todos los planes de prueba asociados al proyecto
        const [planesPrueba] = await database.query(
            'SELECT id_plan FROM planes_prueba WHERE id_proyecto = ?',
            [id]
        );

        if (planesPrueba.length === 0) {
            return res.status(404).json({ message: 'No se encontraron planes de prueba para este proyecto' });
        }

        const planesIds = planesPrueba.map(plan => plan.id_plan);
        
        // Obtener todos los casos de prueba asociados
        const [casosPrueba] = await database.query(
            'SELECT id_caso FROM casos_prueba WHERE id_plan IN (?)',
            [planesIds]
        );

        if (casosPrueba.length === 0) {
            console.log('No se encontraron casos de prueba para los planes de prueba:', planesIds);
            return res.status(404).json({ message: 'No se encontraron casos de prueba para los planes de prueba' });
        }

        const casosIds = casosPrueba.map(caso => caso.id_caso);

        // Obtener todos los defectos asociados a esos casos de prueba
        const [defectos] = await database.query(
            'SELECT * FROM defectos WHERE id_caso IN (?)',
            [casosIds]
        );

        console.log('Defectos asociados a los casos de prueba:', defectos);

        // Cálculo de métricas
        const defectosEncontrados = defectos.length;
        const defectosCorregidos = defectos.filter(defecto => defecto.id_estado === 4).length;

        console.log('Número de defectos encontrados:', defectosEncontrados);
        console.log('Número de defectos corregidos:', defectosCorregidos);

        // Calcular la cobertura de pruebas
        const [resultadosPruebas] = await database.query(
            'SELECT DISTINCT id_caso FROM resultados_pruebas WHERE id_caso IN (?)',
            [casosIds]
        );

        console.log('Casos de prueba con resultados:', resultadosPruebas);

        const coberturaPruebas = casosPrueba.length > 0 ? (resultadosPruebas.length / casosPrueba.length) * 100 : 0;

        console.log('Cobertura de pruebas calculada:', coberturaPruebas);

        // Calcular el tiempo promedio de resolución de defectos
        const [tiemposResolucion] = await database.query(
            `SELECT TIMESTAMPDIFF(HOUR, fecha_creacion, fecha_resolucion) AS tiempo_resolucion
             FROM defectos 
             WHERE id_caso IN (?) AND fecha_resolucion IS NOT NULL`,
            [casosIds]
        );

        console.log('Tiempos de resolución de defectos:', tiemposResolucion);

        const tiempos = tiemposResolucion.map(item => item.tiempo_resolucion);
        const tiempoPromedioResolucion = tiempos.length > 0 ? (tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0;

        console.log('Tiempo promedio de resolución de defectos:', tiempoPromedioResolucion);

        // Calcular el número de casos aprobados y fallidos (basado en resultados de pruebas)
        const [resultados] = await database.query(
            'SELECT id_caso, resultado_obtenido FROM resultados_pruebas WHERE id_caso IN (?)',
            [casosIds]
        );

        const passedTestCases = resultados.filter(resultado => resultado.resultado_obtenido === 'Exitoso').length;
        const failedTestCases = resultados.filter(resultado => resultado.resultado_obtenido === 'Fallido').length;

        console.log('Número de casos aprobados:', passedTestCases);
        console.log('Número de casos fallidos:', failedTestCases);

        // Calcular el porcentaje de defectos críticos
        const criticalDefects = defectos.filter(defecto => defecto.id_clasificacion === 1).length; // Clasificación 1 asumiendo que es crítica
        const criticalDefectsPercentage = defectosEncontrados > 0 ? (criticalDefects / defectosEncontrados) * 100 : 0;

        console.log('Porcentaje de defectos críticos:', criticalDefectsPercentage);

        // Defectos abiertos y cerrados por usuario
        const [defectsPerUser] = await database.query(
            `SELECT id_usuario AS user_id,
                    (SELECT nombre FROM usuarios WHERE id_usuario = defectos.id_usuario) AS user_name,
                    SUM(CASE WHEN id_estado != 4 THEN 1 ELSE 0 END) AS open_defects,
                    SUM(CASE WHEN id_estado = 4 THEN 1 ELSE 0 END) AS closed_defects
             FROM defectos
             WHERE id_caso IN (?)
             GROUP BY id_usuario`,
            [casosIds]
        );

        console.log('Defectos por usuario:', defectsPerUser);

        // Enviar las métricas calculadas
        res.json({
            coverage: coberturaPruebas,
            defects_found: defectosEncontrados,
            defects_fixed: defectosCorregidos,
            average_resolution_time: tiempoPromedioResolucion,
            total_test_cases: casosPrueba.length,
            passed_test_cases: passedTestCases,
            failed_test_cases: failedTestCases,
            critical_defects_percentage: criticalDefectsPercentage,
            defects_per_user: defectsPerUser
        });
    } catch (error) {
        console.error('Error al obtener métricas del proyecto:', error);
        res.status(500).json({ message: 'Error al obtener métricas del proyecto' });
    }
});

// Assigns desarrollador

// Obtener planes de prueba por usuario
router.get('/planes_prueba_usuario/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const [rows] = await database.query(`
            SELECT pp.id_plan, pp.nombre_plan, pp.descripcion_plan, 
                   p.id_proyecto, p.nombre_proyecto
            FROM planes_prueba pp
            INNER JOIN proyectos p ON pp.id_proyecto = p.id_proyecto
            WHERE pp.id_usuario = ? AND pp.estado_activo = 1 AND p.estado_activo = 1
        `, [id_usuario]);
        console.log('Planes de prueba obtenidos:', rows);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los planes de prueba:', error);
        res.status(500).json({ message: 'Error al obtener los planes de prueba' });
    }
});

router.get('/defectos_usuario/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const [rows] = await database.query(`
			SELECT pp.id_defecto, pp.nombre_defecto, pp.descripcion_defecto, 
                   p.id_caso, p.nombre_caso
            FROM defectos pp
            INNER JOIN casos_prueba p ON pp.id_caso = p.id_caso
            WHERE pp.id_usuario = ? AND pp.estado_activo = 1 AND p.estado_activo = 1
        `, [id_usuario]);
        console.log('Defectos obtenidos:', rows);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los defectos:', error);
        res.status(500).json({ message: 'Error al obtener los defectos' });
    }
});

  

module.exports = router;
