const express = require('express');
const { db } = require('../utils/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/hoy - Información del día actual con fecha y hora en tiempo real
router.get('/hoy', authenticateToken, (req, res) => {
    try {
        const usuarioId = req.user.id;
        const ahora = new Date();
        const fecha = ahora.toISOString().split('T')[0];
        const horaActual = ahora.toTimeString().split(' ')[0];
        const fechaCompleta = ahora.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        db.get(
            `SELECT 
                id,
                fecha,
                hora_entrada,
                hora_salida,
                latitud,
                longitud,
                latitud_salida,
                longitud_salida,
                CASE 
                    WHEN hora_entrada IS NOT NULL AND hora_salida IS NOT NULL 
                    THEN ROUND((julianday(fecha || ' ' || hora_salida) - julianday(fecha || ' ' || hora_entrada)) * 24, 2)
                    WHEN hora_entrada IS NOT NULL AND hora_salida IS NULL
                    THEN ROUND((julianday('now', 'localtime') - julianday(fecha || ' ' || hora_entrada)) * 24, 2)
                    ELSE 0 
                END as horas_trabajadas,
                metodo_fichado,
                observaciones,
                timestamp_creacion
            FROM asistencia 
            WHERE usuario_id = ? AND fecha = ?`,
            [usuarioId, fecha],
            (err, row) => {
                if (err) {
                    console.error('Error obteniendo datos de hoy:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Error obteniendo datos'
                    });
                }

                const dashboard = {
                    // Información de fecha y hora en tiempo real
                    timestamp: ahora.toISOString(),
                    fecha_actual: fecha,
                    hora_actual: horaActual,
                    fecha_completa: fechaCompleta,
                    dia_semana: ahora.toLocaleDateString('es-ES', { weekday: 'long' }),
                    
                    // Información del usuario
                    usuario: {
                        id: req.user.id,
                        nombre: req.user.nombre,
                        email: req.user.email,
                        rol: req.user.rol
                    },

                    // Estado del fichado
                    estado_fichado: {
                        tiene_entrada: false,
                        tiene_salida: false,
                        puede_marcar_entrada: true,
                        puede_marcar_salida: false,
                        hora_entrada: null,
                        hora_salida: null,
                        horas_trabajadas: 0,
                        tiempo_transcurrido: 0,
                        metodo: null,
                        observaciones: null,
                        gps_info: {
                            entrada_con_gps: false,
                            salida_con_gps: false,
                            coordenadas_entrada: null,
                            coordenadas_salida: null
                        }
                    }
                };

                if (row) {
                    const tieneEntrada = !!row.hora_entrada;
                    const tieneSalida = !!row.hora_salida;
                    
                    dashboard.estado_fichado = {
                        tiene_entrada: tieneEntrada,
                        tiene_salida: tieneSalida,
                        puede_marcar_entrada: !tieneEntrada,
                        puede_marcar_salida: tieneEntrada && !tieneSalida,
                        hora_entrada: row.hora_entrada,
                        hora_salida: row.hora_salida,
                        horas_trabajadas: row.horas_trabajadas || 0,
                        tiempo_transcurrido: row.horas_trabajadas || 0,
                        metodo: row.metodo_fichado,
                        observaciones: row.observaciones,
                        timestamp_creacion: row.timestamp_creacion,
                        gps_info: {
                            entrada_con_gps: !!(row.latitud && row.longitud),
                            salida_con_gps: !!(row.latitud_salida && row.longitud_salida),
                            coordenadas_entrada: row.latitud && row.longitud ? {
                                latitud: row.latitud,
                                longitud: row.longitud
                            } : null,
                            coordenadas_salida: row.latitud_salida && row.longitud_salida ? {
                                latitud: row.latitud_salida,
                                longitud: row.longitud_salida
                            } : null
                        }
                    };
                }

                res.json({
                    success: true,
                    data: dashboard,
                    server_time: ahora.toISOString()
                });
            }
        );

    } catch (error) {
        console.error('Error en dashboard hoy:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/dashboard/resumen - Estadísticas y resumen
router.get('/resumen', authenticateToken, (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { periodo = 'mes' } = req.query; // mes, semana, año

        let fechaInicio;
        const fechaFin = new Date().toISOString().split('T')[0];

        // Calcular fecha de inicio según el período
        switch (periodo) {
            case 'semana':
                const inicioSemana = new Date();
                inicioSemana.setDate(inicioSemana.getDate() - 7);
                fechaInicio = inicioSemana.toISOString().split('T')[0];
                break;
            case 'año':
                const inicioAño = new Date();
                inicioAño.setFullYear(inicioAño.getFullYear(), 0, 1);
                fechaInicio = inicioAño.toISOString().split('T')[0];
                break;
            case 'mes':
            default:
                const inicioMes = new Date();
                inicioMes.setDate(1);
                fechaInicio = inicioMes.toISOString().split('T')[0];
                break;
        }

        // Consulta principal para estadísticas
        const statsQuery = `
            SELECT 
                COUNT(*) as total_dias,
                COUNT(CASE WHEN hora_entrada IS NOT NULL THEN 1 END) as dias_con_entrada,
                COUNT(CASE WHEN hora_salida IS NOT NULL THEN 1 END) as dias_completos,
                ROUND(AVG(CASE 
                    WHEN hora_entrada IS NOT NULL AND hora_salida IS NOT NULL 
                    THEN (julianday(fecha || ' ' || hora_salida) - julianday(fecha || ' ' || hora_entrada)) * 24
                    ELSE NULL 
                END), 2) as promedio_horas_diarias,
                ROUND(SUM(CASE 
                    WHEN hora_entrada IS NOT NULL AND hora_salida IS NOT NULL 
                    THEN (julianday(fecha || ' ' || hora_salida) - julianday(fecha || ' ' || hora_entrada)) * 24
                    ELSE 0 
                END), 2) as total_horas_trabajadas,
                TIME(AVG(strftime('%s', '1970-01-01 ' || hora_entrada || '.000')), 'unixepoch') as promedio_hora_entrada,
                TIME(AVG(strftime('%s', '1970-01-01 ' || COALESCE(hora_salida, '18:00:00') || '.000')), 'unixepoch') as promedio_hora_salida
            FROM asistencia 
            WHERE usuario_id = ? AND fecha BETWEEN ? AND ?
        `;

        db.get(statsQuery, [usuarioId, fechaInicio, fechaFin], (err, stats) => {
            if (err) {
                console.error('Error obteniendo estadísticas:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Error obteniendo estadísticas'
                });
            }

            // Obtener últimos 7 días para gráfico
            const ultimosDiasQuery = `
                SELECT 
                    fecha,
                    hora_entrada,
                    hora_salida,
                    CASE 
                        WHEN hora_entrada IS NOT NULL AND hora_salida IS NOT NULL 
                        THEN ROUND((julianday(fecha || ' ' || hora_salida) - julianday(fecha || ' ' || hora_entrada)) * 24, 2)
                        ELSE 0 
                    END as horas_trabajadas
                FROM asistencia 
                WHERE usuario_id = ? AND fecha >= date('now', '-7 days')
                ORDER BY fecha DESC
            `;

            db.all(ultimosDiasQuery, [usuarioId], (err, ultimosDias) => {
                if (err) {
                    console.error('Error obteniendo últimos días:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Error obteniendo datos'
                    });
                }

                const resumen = {
                    periodo,
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin,
                    estadisticas: {
                        total_dias_registrados: stats.total_dias || 0,
                        dias_con_entrada: stats.dias_con_entrada || 0,
                        dias_completos: stats.dias_completos || 0,
                        total_horas_trabajadas: stats.total_horas_trabajadas || 0,
                        promedio_horas_diarias: stats.promedio_horas_diarias || 0,
                        promedio_hora_entrada: stats.promedio_hora_entrada || '00:00:00',
                        promedio_hora_salida: stats.promedio_hora_salida || '00:00:00',
                        porcentaje_asistencia: stats.total_dias > 0 ? 
                            Math.round((stats.dias_con_entrada / stats.total_dias) * 100) : 0
                    },
                    ultimos_dias: ultimosDias,
                    usuario: req.user.nombre
                };

                res.json({
                    success: true,
                    data: resumen
                });
            });
        });

    } catch (error) {
        console.error('Error en dashboard resumen:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/dashboard/admin - Dashboard para administradores
router.get('/admin', authenticateToken, requireAdmin, (req, res) => {
    try {
        const fecha = new Date().toISOString().split('T')[0];

        // Estadísticas generales de hoy
        const statsHoyQuery = `
            SELECT 
                COUNT(DISTINCT u.id) as total_empleados,
                COUNT(DISTINCT CASE WHEN a.hora_entrada IS NOT NULL THEN a.usuario_id END) as empleados_presentes,
                COUNT(DISTINCT CASE WHEN a.hora_salida IS NOT NULL THEN a.usuario_id END) as empleados_salieron,
                ROUND(AVG(CASE 
                    WHEN a.hora_entrada IS NOT NULL AND a.hora_salida IS NOT NULL 
                    THEN (julianday(a.fecha || ' ' || a.hora_salida) - julianday(a.fecha || ' ' || a.hora_entrada)) * 24
                    ELSE NULL 
                END), 2) as promedio_horas_hoy
            FROM usuarios u
            LEFT JOIN asistencia a ON u.id = a.usuario_id AND a.fecha = ?
            WHERE u.rol = 'EMPLEADO' AND u.activo = 1
        `;

        db.get(statsHoyQuery, [fecha], (err, statsHoy) => {
            if (err) {
                console.error('Error obteniendo stats admin:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Error obteniendo estadísticas'
                });
            }

            // Lista de empleados con su estado hoy
            const empleadosQuery = `
                SELECT 
                    u.id,
                    u.nombre,
                    u.email,
                    a.hora_entrada,
                    a.hora_salida,
                    CASE 
                        WHEN a.hora_entrada IS NOT NULL AND a.hora_salida IS NOT NULL 
                        THEN ROUND((julianday(a.fecha || ' ' || a.hora_salida) - julianday(a.fecha || ' ' || a.hora_entrada)) * 24, 2)
                        WHEN a.hora_entrada IS NOT NULL AND a.hora_salida IS NULL
                        THEN ROUND((julianday('now', 'localtime') - julianday(a.fecha || ' ' || a.hora_entrada)) * 24, 2)
                        ELSE 0 
                    END as horas_trabajadas,
                    CASE 
                        WHEN a.hora_entrada IS NULL THEN 'ausente'
                        WHEN a.hora_salida IS NULL THEN 'presente'
                        ELSE 'completado'
                    END as estado
                FROM usuarios u
                LEFT JOIN asistencia a ON u.id = a.usuario_id AND a.fecha = ?
                WHERE u.rol = 'EMPLEADO' AND u.activo = 1
                ORDER BY u.nombre
            `;

            db.all(empleadosQuery, [fecha], (err, empleados) => {
                if (err) {
                    console.error('Error obteniendo empleados:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Error obteniendo datos de empleados'
                    });
                }

                const dashboard = {
                    fecha,
                    estadisticas_hoy: {
                        total_empleados: statsHoy.total_empleados || 0,
                        empleados_presentes: statsHoy.empleados_presentes || 0,
                        empleados_salieron: statsHoy.empleados_salieron || 0,
                        promedio_horas_hoy: statsHoy.promedio_horas_hoy || 0,
                        porcentaje_asistencia: statsHoy.total_empleados > 0 ? 
                            Math.round((statsHoy.empleados_presentes / statsHoy.total_empleados) * 100) : 0
                    },
                    empleados_hoy: empleados
                };

                res.json({
                    success: true,
                    data: dashboard
                });
            });
        });

    } catch (error) {
        console.error('Error en dashboard admin:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;