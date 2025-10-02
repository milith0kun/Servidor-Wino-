const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Crear directorio database si no existe
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.db');

// Conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite');
    }
});

// Función para inicializar las tablas
const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        // Crear tabla usuarios
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                rol TEXT NOT NULL CHECK(rol IN ('ADMIN', 'EMPLEADO')),
                activo BOOLEAN DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Crear tabla asistencia
        const createAttendanceTable = `
            CREATE TABLE IF NOT EXISTS asistencia (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                fecha DATE NOT NULL,
                hora_entrada TIME,
                hora_salida TIME,
                latitud REAL,
                longitud REAL,
                latitud_salida REAL,
                longitud_salida REAL,
                ubicacion_valida BOOLEAN DEFAULT 0,
                codigo_qr TEXT,
                metodo_fichado TEXT DEFAULT 'GPS' CHECK(metodo_fichado IN ('MANUAL', 'GPS', 'QR')),
                observaciones TEXT,
                timestamp_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
            )
        `;

        // Crear tabla códigos QR (para futuro)
        const createQRTable = `
            CREATE TABLE IF NOT EXISTS codigos_qr_locales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo TEXT UNIQUE NOT NULL,
                ubicacion TEXT NOT NULL,
                descripcion TEXT,
                activo BOOLEAN DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Ejecutar creación de tablas
        db.serialize(() => {
            db.run(createUsersTable, (err) => {
                if (err) {
                    console.error('Error creando tabla usuarios:', err.message);
                    reject(err);
                    return;
                }
                console.log('Tabla usuarios creada o ya existe');
            });

            db.run(createAttendanceTable, (err) => {
                if (err) {
                    console.error('Error creando tabla asistencia:', err.message);
                    reject(err);
                    return;
                }
                console.log('Tabla asistencia creada o ya existe');
                
                // Agregar columnas de GPS de salida si no existen
                db.run(`ALTER TABLE asistencia ADD COLUMN latitud_salida REAL`, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.error('Error agregando columna latitud_salida:', err.message);
                    }
                });
                
                db.run(`ALTER TABLE asistencia ADD COLUMN longitud_salida REAL`, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.error('Error agregando columna longitud_salida:', err.message);
                    }
                });
            });

            db.run(createQRTable, (err) => {
                if (err) {
                    console.error('Error creando tabla códigos QR:', err.message);
                    reject(err);
                    return;
                }
                console.log('Tabla códigos QR creada o ya existe');
                
                // Insertar usuarios por defecto después de crear todas las tablas
                insertDefaultUsers().then(() => {
                    resolve();
                }).catch(reject);
            });
        });
    });
};

// Función para insertar usuarios por defecto
const insertDefaultUsers = async () => {
    return new Promise((resolve, reject) => {
        // Verificar si ya existen usuarios
        db.get("SELECT COUNT(*) as count FROM usuarios", async (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (row.count > 0) {
                console.log('Usuarios por defecto ya existen');
                resolve();
                return;
            }

            try {
                // Hash de las contraseñas
                const adminPassword = await bcrypt.hash('admin123', 10);
                const empleadoPassword = await bcrypt.hash('empleado123', 10);

                // Insertar usuario administrador
                const insertAdmin = `
                    INSERT INTO usuarios (nombre, email, password, rol)
                    VALUES (?, ?, ?, ?)
                `;

                // Insertar usuario empleado
                const insertEmpleado = `
                    INSERT INTO usuarios (nombre, email, password, rol)
                    VALUES (?, ?, ?, ?)
                `;

                db.serialize(() => {
                    db.run(insertAdmin, ['Administrador', 'admin@hotel.com', adminPassword, 'ADMIN'], (err) => {
                        if (err) {
                            console.error('Error insertando admin:', err.message);
                            reject(err);
                            return;
                        }
                        console.log('Usuario administrador creado');
                    });

                    db.run(insertEmpleado, ['Empleado Prueba', 'empleado@hotel.com', empleadoPassword, 'EMPLEADO'], (err) => {
                        if (err) {
                            console.error('Error insertando empleado:', err.message);
                            reject(err);
                            return;
                        }
                        console.log('Usuario empleado creado');
                        resolve();
                    });
                });

            } catch (error) {
                reject(error);
            }
        });
    });
};

module.exports = {
    db,
    initializeDatabase
};