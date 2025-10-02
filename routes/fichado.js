const express = require('express');
const { db } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');
const { requireGPSValidation, validateGPSLocation } = require('../utils/gpsValidation');

const router = express.Router();

// POST /api/fichado/entrada - Registrar entrada con validación GPS
router.post('/entrada', authenticateToken, requireGPSValidation(true), (req, res) => {
    try {
        const { metodo = 'GPS', latitud, longitud, codigo_qr, observaciones } = req.body;
        const usuarioId = req.user.id;
        const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const horaEntrada = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

        // Verificar si ya tiene entrada registrada hoy
        db.get(
            'SELECT id FROM asistencia WHERE usuario_id = ? AND fecha = ? AND hora_entrada IS NOT NULL',
            [usuarioId, fecha],
            (err, existingEntry) => {
                if (err) {
                    console.error('Error verificando entrada existente:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Error interno del servidor'
                    });
                }

                if (existingEntry) {
                    return res.status(400).json({
                        success: false,
                        error: 'Entrada ya registrada',
                        message: 'Ya tienes una entrada registrada para hoy'
                    });
                }

                // Registrar nueva entrada con información GPS
                const insertQuery = `
                    INSERT INTO asistencia 
                    (usuario_id, fecha, hora_entrada, latitud, longitud, codigo_qr, metodo_fichado, observaciones)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const observacionesCompletas = [
                    observaciones,
                    req.gpsValidation ? `GPS validado - Distancia: ${req.gpsValidation.distance}m` : null
                ].filter(Boolean).join(' | ');

                db.run(
                    insertQuery,
                    [usuarioId, fecha, horaEntrada, latitud, longitud, codigo_qr, metodo, observacionesCompletas],
                    function(err) {
                        if (err) {
                            console.error('Error registrando entrada:', err);
                            return res.status(500).json({
                                success: false,
                                error: 'Error registrando entrada'
                            });
                        }

                        res.json({
                            success: true,
                            message: 'Entrada registrada correctamente',
                            data: {
                                id: this.lastID,
                                fecha,
                                hora_entrada: horaEntrada,
                                metodo,
                                usuario: req.user.nombre,
                                gps_validation: req.gpsValidation ? {
                                    distance: req.gpsValidation.distance,
                                    max_distance: req.gpsValidation.maxDistance,
                                    location_valid: req.gpsValidation.isValid
                                } : null
                            }
                        });
                    }
                );
            }
        );

    } catch (error) {
        console.error('Error en fichado entrada:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// POST /api/fichado/salida - Registrar salida con validación GPS opcional
router.post('/salida', authenticateToken, requireGPSValidation(false), (req, res) => {
    try {
        const { latitud, longitud, observaciones } = req.body;
        const usuarioId = req.user.id;
        const fecha = new Date().toISOString().split('T')[0];
        const horaSalida = new Date().toTimeString().split(' ')[0];

        // Buscar entrada del día para actualizar
        db.get(
            'SELECT * FROM asistencia WHERE usuario_id = ? AND fecha = ? AND hora_entrada IS NOT NULL',
            [usuarioId, fecha],
            (err, entry) => {
                if (err) {
                    console.error('Error buscando entrada:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Error interno del servidor'
                    });
                }

                if (!entry) {
                    return res.status(400).json({
                        success: false,
                        error: 'Sin entrada registrada',
                        message: 'No tienes una entrada registrada para hoy'
                    });
                }

                if (entry.hora_salida) {
                    return res.status(400).json({
                        success: false,
                        error: 'Salida ya registrada',
                        message: 'Ya tienes una salida registrada para hoy'
                    });
                }

                // Calcular horas trabajadas
                const horaEntrada = new Date(`${fecha}T${entry.hora_entrada}`);
                const horaSalidaDate = new Date(`${fecha}T${horaSalida}`);
                const horasTrabajadas = ((horaSalidaDate - horaEntrada) / (1000 * 60 * 60)).toFixed(2);

                // Preparar observaciones con información GPS si está disponible
                const observacionesCompletas = [
                    observaciones || 'Salida registrada',
                    req.gpsValidation ? `GPS validado - Distancia: ${req.gpsValidation.distance}m` : null
                ].filter(Boolean).join(' | ');

                // Actualizar registro con salida y coordenadas GPS si están disponibles
                const updateQuery = `
                    UPDATE asistencia 
                    SET hora_salida = ?, 
                        observaciones = COALESCE(observaciones || ' | ', '') || ?,
                        latitud_salida = ?,
                        longitud_salida = ?
                    WHERE id = ?
                `;

                db.run(
                    updateQuery,
                    [horaSalida, observacionesCompletas, latitud || null, longitud || null, entry.id],
                    function(err) {
                        if (err) {
                            console.error('Error registrando salida:', err);
                            return res.status(500).json({
                                success: false,
                                error: 'Error registrando salida'
                            });
                        }

                        res.json({
                            success: true,
                            message: 'Salida registrada correctamente',
                            data: {
                                id: entry.id,
                                fecha,
                                hora_entrada: entry.hora_entrada,
                                hora_salida: horaSalida,
                                horas_trabajadas: parseFloat(horasTrabajadas),
                                usuario: req.user.nombre,
                                gps_validation: req.gpsValidation ? {
                                    distance: req.gpsValidation.distance,
                                    max_distance: req.gpsValidation.maxDistance,
                                    location_valid: req.gpsValidation.isValid
                                } : null
                            }
                        });
                    }
                );
            }
        );

    } catch (error) {
        console.error('Error en fichado salida:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/fichado/historial - Obtener historial de fichados con información GPS
router.get('/historial', authenticateToken, (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { limite = 30, pagina = 1, fecha_inicio, fecha_fin } = req.query;
        const offset = (pagina - 1) * limite;

        // Construir filtros de fecha si se proporcionan
        let whereClause = 'WHERE usuario_id = ?';
        let queryParams = [usuarioId];

        if (fecha_inicio) {
            whereClause += ' AND fecha >= ?';
            queryParams.push(fecha_inicio);
        }

        if (fecha_fin) {
            whereClause += ' AND fecha <= ?';
            queryParams.push(fecha_fin);
        }

        const query = `
            SELECT 
                id,
                fecha,
                hora_entrada,
                hora_salida,
                CASE 
                    WHEN hora_entrada IS NOT NULL AND hora_salida IS NOT NULL 
                    THEN ROUND((julianday(fecha || ' ' || hora_salida) - julianday(fecha || ' ' || hora_entrada)) * 24, 2)
                    ELSE NULL 
                END as horas_trabajadas,
                latitud,
                longitud,
                latitud_salida,
                longitud_salida,
                metodo_fichado,
                observaciones,
                timestamp_creacion,
                CASE 
                    WHEN latitud IS NOT NULL AND longitud IS NOT NULL 
                    THEN 'GPS_DISPONIBLE'
                    ELSE 'SIN_GPS'
                END as estado_gps
            FROM asistencia 
            ${whereClause}
            ORDER BY fecha DESC, hora_entrada DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limite), offset);

        db.all(query, queryParams, (err, rows) => {
            if (err) {
                console.error('Error obteniendo historial:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Error obteniendo historial'
                });
            }

            // Obtener total de registros para paginación
            const countQuery = `SELECT COUNT(*) as total FROM asistencia ${whereClause}`;
            const countParams = queryParams.slice(0, -2); // Remover limite y offset

            db.get(countQuery, countParams, (err, countResult) => {
                if (err) {
                    console.error('Error contando registros:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Error obteniendo historial'
                    });
                }

                // Calcular estadísticas del período
                const totalHoras = rows.reduce((sum, row) => sum + (row.horas_trabajadas || 0), 0);
                const diasTrabajados = rows.filter(row => row.hora_entrada && row.hora_salida).length;
                const registrosIncompletos = rows.filter(row => row.hora_entrada && !row.hora_salida).length;

                res.json({
                    success: true,
                    data: rows,
                    pagination: {
                        total: countResult.total,
                        pagina: parseInt(pagina),
                        limite: parseInt(limite),
                        total_paginas: Math.ceil(countResult.total / limite)
                    },
                    estadisticas: {
                        total_horas_trabajadas: Math.round(totalHoras * 100) / 100,
                        dias_trabajados: diasTrabajados,
                        registros_incompletos: registrosIncompletos,
                        promedio_horas_dia: diasTrabajados > 0 ? Math.round((totalHoras / diasTrabajados) * 100) / 100 : 0
                    }
                });
            });
        });

    } catch (error) {
        console.error('Error en historial:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/fichado/estado-hoy - Estado del fichado de hoy
router.get('/estado-hoy', authenticateToken, (req, res) => {
    try {
        const usuarioId = req.user.id;
        const fecha = new Date().toISOString().split('T')[0];

        db.get(
            `SELECT 
                id,
                fecha,
                hora_entrada,
                hora_salida,
                CASE 
                    WHEN hora_entrada IS NOT NULL AND hora_salida IS NOT NULL 
                    THEN ROUND((julianday(fecha || ' ' || hora_salida) - julianday(fecha || ' ' || hora_entrada)) * 24, 2)
                    ELSE NULL 
                END as horas_trabajadas,
                metodo_fichado,
                observaciones
            FROM asistencia 
            WHERE usuario_id = ? AND fecha = ?`,
            [usuarioId, fecha],
            (err, row) => {
                if (err) {
                    console.error('Error obteniendo estado de hoy:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Error obteniendo estado'
                    });
                }

                const estado = {
                    fecha,
                    tiene_entrada: false,
                    tiene_salida: false,
                    puede_marcar_entrada: true,
                    puede_marcar_salida: false,
                    horas_trabajadas: 0,
                    registro: null
                };

                if (row) {
                    estado.tiene_entrada = !!row.hora_entrada;
                    estado.tiene_salida = !!row.hora_salida;
                    estado.puede_marcar_entrada = !row.hora_entrada;
                    estado.puede_marcar_salida = !!row.hora_entrada && !row.hora_salida;
                    estado.horas_trabajadas = row.horas_trabajadas || 0;
                    estado.registro = row;
                }

                res.json({
                    success: true,
                    data: estado
                });
            }
        );

    } catch (error) {
        console.error('Error en estado-hoy:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;