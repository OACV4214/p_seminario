// db.js
const mysql = require('mysql2/promise');

const database = mysql.createPool({
    host: 'database-1.ctgc4emokaci.us-east-2.rds.amazonaws.com',
    user: 'admin',
    password: 'Oacv2000.0',
    database: 'gestion_pruebas', 
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = database;
