const connection = require('./src/config/db');

// Verificar la conexión
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);  // Salir si hay un error de conexión
  } else {
    console.log('Conexión exitosa a la base de datos');
    connection.end();  // Finalizar la conexión
  }
});
