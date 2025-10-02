// Endpoint para fecha y hora en tiempo real - HACCP System
// Proporciona información de tiempo actualizada para el frontend

const express = require('express');
const router = express.Router();

// GET /api/tiempo-real/ahora - Obtener fecha y hora actual del servidor
router.get('/ahora', (req, res) => {
    try {
        const ahora = new Date();
        
        // Información básica de tiempo
        const tiempoInfo = {
            timestamp: ahora.toISOString(),
            fecha: ahora.toISOString().split('T')[0], // YYYY-MM-DD
            hora: ahora.toTimeString().split(' ')[0], // HH:MM:SS
            
            // Información detallada en español
            fecha_completa: ahora.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            
            hora_12h: ahora.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }),
            
            dia_semana: ahora.toLocaleDateString('es-ES', { weekday: 'long' }),
            mes: ahora.toLocaleDateString('es-ES', { month: 'long' }),
            año: ahora.getFullYear(),
            
            // Información numérica
            dia_numero: ahora.getDate(),
            mes_numero: ahora.getMonth() + 1,
            dia_semana_numero: ahora.getDay(), // 0 = Domingo
            
            // Zona horaria
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezone_offset: ahora.getTimezoneOffset(),
            
            // Timestamps útiles
            unix_timestamp: Math.floor(ahora.getTime() / 1000),
            milliseconds: ahora.getTime()
        };

        res.json({
            success: true,
            data: tiempoInfo
        });

    } catch (error) {
        console.error('Error obteniendo tiempo real:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/tiempo-real/formato - Obtener fecha y hora en formato específico
router.get('/formato', (req, res) => {
    try {
        const { formato = 'completo' } = req.query;
        const ahora = new Date();
        
        let resultado;
        
        switch (formato.toLowerCase()) {
            case 'fecha':
                resultado = ahora.toISOString().split('T')[0];
                break;
                
            case 'hora':
                resultado = ahora.toTimeString().split(' ')[0];
                break;
                
            case 'timestamp':
                resultado = ahora.toISOString();
                break;
                
            case 'unix':
                resultado = Math.floor(ahora.getTime() / 1000);
                break;
                
            case 'español':
                resultado = {
                    fecha: ahora.toLocaleDateString('es-ES'),
                    hora: ahora.toLocaleTimeString('es-ES'),
                    completo: ahora.toLocaleString('es-ES')
                };
                break;
                
            case 'dashboard':
                resultado = {
                    fecha_actual: ahora.toISOString().split('T')[0],
                    hora_actual: ahora.toTimeString().split(' ')[0],
                    fecha_completa: ahora.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    dia_semana: ahora.toLocaleDateString('es-ES', { weekday: 'long' }),
                    timestamp: ahora.toISOString()
                };
                break;
                
            default: // 'completo'
                resultado = {
                    timestamp: ahora.toISOString(),
                    fecha: ahora.toISOString().split('T')[0],
                    hora: ahora.toTimeString().split(' ')[0],
                    fecha_completa: ahora.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                };
        }

        res.json({
            success: true,
            formato: formato,
            data: resultado,
            server_time: ahora.toISOString()
        });

    } catch (error) {
        console.error('Error en formato de tiempo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/tiempo-real/zona-trabajo - Información de tiempo para zona de trabajo
router.get('/zona-trabajo', (req, res) => {
    try {
        const ahora = new Date();
        
        // Determinar turno de trabajo
        const hora = ahora.getHours();
        let turno;
        
        if (hora >= 6 && hora < 14) {
            turno = 'mañana';
        } else if (hora >= 14 && hora < 22) {
            turno = 'tarde';
        } else {
            turno = 'noche';
        }
        
        // Información específica para zona de trabajo
        const zonaTrabajoInfo = {
            timestamp: ahora.toISOString(),
            fecha_trabajo: ahora.toISOString().split('T')[0],
            hora_actual: ahora.toTimeString().split(' ')[0],
            
            turno_actual: turno,
            es_dia_laboral: ahora.getDay() >= 1 && ahora.getDay() <= 5, // Lunes a Viernes
            
            fecha_legible: ahora.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            
            hora_legible: ahora.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            
            // Información para fichado
            puede_fichar: true, // Siempre se puede fichar
            mensaje_turno: `Turno de ${turno} - ${ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
        };

        res.json({
            success: true,
            data: zonaTrabajoInfo
        });

    } catch (error) {
        console.error('Error en zona de trabajo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;