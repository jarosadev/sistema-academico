const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'sonet_academic',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: 'Z'
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        console.log(`📊 Base de datos: ${dbConfig.database}`);
        console.log(`🏠 Host: ${dbConfig.host}:${dbConfig.port}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con MySQL:', error.message);
        return false;
    }
};

// Función para ejecutar consultas
const executeQuery = async (query, params = []) => {
    try {
        // Procesar parámetros para asegurar tipos correctos
        const processedParams = params.map(param => {
            // Si es undefined o null, convertir a null para MySQL
            if (param === undefined || param === null) {
                return null;
            }
            // Convertir números a strings para mysql2
            if (typeof param === 'number') {
                return param.toString();
            }
            return param;
        });
        
        const [rows] = await pool.execute(query, processedParams);
        return rows;
    } catch (error) {
        console.error('❌ Error en consulta SQL:', error.message);
        console.error('Query:', query);
        console.error('Params:', params);
        throw error;
    }
};


// Función para ejecutar transacciones
const executeTransaction = async (queries) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const { query, params } of queries) {
            const [result] = await connection.execute(query, params || []);
            results.push(result);
        }
        
        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Función para obtener una conexión del pool
const getConnection = async () => {
    return await pool.getConnection();
};

// Función para cerrar el pool de conexiones
const closePool = async () => {
    try {
        await pool.end();
        console.log('✅ Pool de conexiones MySQL cerrado correctamente');
    } catch (error) {
        console.error('❌ Error al cerrar pool de conexiones:', error.message);
    }
};

// Función para verificar si existe la base de datos
const checkDatabase = async () => {
    try {
        const tempConfig = { ...dbConfig };
        delete tempConfig.database;
        
        const tempPool = mysql.createPool(tempConfig);
        const [databases] = await tempPool.execute(
            'SHOW DATABASES LIKE ?', 
            [dbConfig.database]
        );
        
        await tempPool.end();
        
        if (databases.length === 0) {
            console.log(`⚠️  Base de datos '${dbConfig.database}' no existe`);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error al verificar base de datos:', error.message);
        return false;
    }
};

// Función para crear la base de datos si no existe
const createDatabase = async () => {
    try {
        const tempConfig = { ...dbConfig };
        delete tempConfig.database;
        
        const tempPool = mysql.createPool(tempConfig);
        await tempPool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await tempPool.end();
        
        console.log(`✅ Base de datos '${dbConfig.database}' creada/verificada correctamente`);
        return true;
    } catch (error) {
        console.error('❌ Error al crear base de datos:', error.message);
        return false;
    }
};

// Inicializar conexión y base de datos
const initializeDatabase = async () => {
    try {
        // Verificar si la base de datos existe
        const dbExists = await checkDatabase();
        
        if (!dbExists) {
            // Crear la base de datos si no existe
            await createDatabase();
        }
        
        // Probar la conexión
        const connected = await testConnection();
        
        if (!connected) {
            throw new Error('No se pudo establecer conexión con la base de datos');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar base de datos:', error.message);
        throw error;
    }
};

module.exports = {
    pool,
    executeQuery,
    executeTransaction,
    getConnection,
    closePool,
    testConnection,
    initializeDatabase,
    dbConfig
};
