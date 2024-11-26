const bcrypt = require('bcrypt');
const database = require('./config/db'); // Asegúrate de que este sea el archivo correcto para la conexión

const crearUsuario = async () => {
    const nombre = 'admin';
    const email = 'prueba@example.com';
    const password = 'oacv2000';
    const rol = 3; // Ajusta este ID al ID de rol correcto en la tabla roles

    try {
        // Encripta la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Contraseña encriptada:', hashedPassword);

        // Inserta el usuario en la base de datos
        await database.query(
            'INSERT INTO usuarios (nombre, email, password, id_rol) VALUES (?, ?, ?, ?)',
            [nombre, email, hashedPassword, rol]
        );

        console.log('Usuario creado exitosamente');
    } catch (error) {
        console.error('Error al crear el usuario:', error);
    } finally {
        process.exit(); // Termina el proceso
    }
};

crearUsuario();
