// Utilidad para validación GPS - HACCP System
// Verifica si el usuario está dentro del rango permitido para fichar

const { CONFIG_UNIVERSAL } = require('../config-app-universal');
const { db } = require('./database');

/**
 * Cache de configuración GPS para evitar consultas frecuentes a la BD
 */
let gpsConfigCache = null;
let gpsConfigCacheTime = 0;
const GPS_CACHE_TTL = 60000; // 1 minuto de caché

/**
 * Obtener configuración GPS desde la base de datos
 * @returns {Promise<Object>} Configuración GPS
 */
function getGPSConfig() {
    return new Promise((resolve, reject) => {
        // Usar caché si está disponible y no ha expirado
        const now = Date.now();
        if (gpsConfigCache && (now - gpsConfigCacheTime) < GPS_CACHE_TTL) {
            return resolve(gpsConfigCache);
        }

        // Consultar base de datos
        db.get('SELECT latitud, longitud, radio_metros FROM configuracion_gps WHERE id = 1', (err, row) => {
            if (err) {
                console.error('Error obteniendo configuración GPS de BD:', err);
                // Fallback a configuración por defecto
                const fallbackConfig = {
                    latitude: CONFIG_UNIVERSAL.gps.kitchenLatitude,
                    longitude: CONFIG_UNIVERSAL.gps.kitchenLongitude,
                    radiusMeters: CONFIG_UNIVERSAL.gps.radiusMeters
                };
                resolve(fallbackConfig);
            } else if (row) {
                // Configuración desde BD
                gpsConfigCache = {
                    latitude: row.latitud,
                    longitude: row.longitud,
                    radiusMeters: row.radio_metros
                };
                gpsConfigCacheTime = now;
                console.log('Configuración GPS cargada desde BD:', gpsConfigCache);
                resolve(gpsConfigCache);
            } else {
                // No hay configuración en BD, usar valores por defecto
                console.log('No hay configuración GPS en BD, usando valores por defecto');
                const fallbackConfig = {
                    latitude: CONFIG_UNIVERSAL.gps.kitchenLatitude,
                    longitude: CONFIG_UNIVERSAL.gps.kitchenLongitude,
                    radiusMeters: CONFIG_UNIVERSAL.gps.radiusMeters
                };
                resolve(fallbackConfig);
            }
        });
    });
}

/**
 * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lon2 - Longitud del punto 2
 * @returns {number} Distancia en metros
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180; // φ, λ en radianes
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c; // Distancia en metros
    return Math.round(distance);
}

/**
 * Valida si las coordenadas GPS están dentro del rango permitido
 * @param {number} userLatitude - Latitud del usuario
 * @param {number} userLongitude - Longitud del usuario
 * @param {Object} gpsConfig - Configuración GPS (opcional, se obtiene de BD si no se proporciona)
 * @returns {Promise<Object>} Resultado de la validación
 */
async function validateGPSLocation(userLatitude, userLongitude, gpsConfig = null) {
    try {
        // Obtener configuración GPS si no se proporcionó
        if (!gpsConfig) {
            gpsConfig = await getGPSConfig();
        }

        // Validar que las coordenadas sean números válidos
        if (!userLatitude || !userLongitude || 
            isNaN(userLatitude) || isNaN(userLongitude)) {
            return {
                isValid: false,
                error: 'COORDENADAS_INVALIDAS',
                message: 'Las coordenadas GPS proporcionadas no son válidas',
                distance: null,
                maxDistance: gpsConfig.radiusMeters
            };
        }

        // Obtener coordenadas de la cocina desde la configuración
        const kitchenLat = gpsConfig.latitude;
        const kitchenLon = gpsConfig.longitude;
        const maxDistance = gpsConfig.radiusMeters;

        // Calcular distancia entre usuario y cocina
        const distance = calculateDistance(
            userLatitude, 
            userLongitude, 
            kitchenLat, 
            kitchenLon
        );

        // Verificar si está dentro del rango
        const isWithinRange = distance <= maxDistance;

        return {
            isValid: isWithinRange,
            error: isWithinRange ? null : 'FUERA_DE_RANGO',
            message: isWithinRange 
                ? 'Ubicación válida para fichar' 
                : `Estás a ${distance}m de la cocina. Máximo permitido: ${maxDistance}m`,
            distance: distance,
            maxDistance: maxDistance,
            userLocation: {
                latitude: userLatitude,
                longitude: userLongitude
            },
            kitchenLocation: {
                latitude: kitchenLat,
                longitude: kitchenLon
            }
        };

    } catch (error) {
        console.error('Error en validación GPS:', error);
        return {
            isValid: false,
            error: 'ERROR_VALIDACION',
            message: 'Error interno al validar la ubicación GPS',
            distance: null,
            maxDistance: CONFIG_UNIVERSAL.gps.radiusMeters
        };
    }
}

/**
 * Middleware para validar GPS en rutas de fichado
 * @param {boolean} required - Si la validación GPS es obligatoria
 */
function requireGPSValidation(required = true) {
    return async (req, res, next) => {
        try {
            const { latitud, longitud, metodo = 'MANUAL' } = req.body;

            // Si el método es MANUAL y GPS no es requerido, continuar
            if (metodo === 'MANUAL' && !required) {
                return next();
            }

            // Si el método es GPS o GPS es requerido, validar
            if (metodo === 'GPS' || required) {
                if (!latitud || !longitud) {
                    // Obtener configuración GPS para mostrar en el error
                    const gpsConfig = await getGPSConfig();
                    
                    return res.status(400).json({
                        success: false,
                        error: 'GPS_REQUERIDO',
                        message: 'Las coordenadas GPS son obligatorias para fichar',
                        data: {
                            required_fields: ['latitud', 'longitud'],
                            gps_config: {
                                kitchen_location: {
                                    latitude: gpsConfig.latitude,
                                    longitude: gpsConfig.longitude
                                },
                                max_distance_meters: gpsConfig.radiusMeters
                            }
                        }
                    });
                }

                // Validar ubicación GPS (ahora es async)
                const validation = await validateGPSLocation(latitud, longitud);
                
                if (!validation.isValid) {
                    return res.status(403).json({
                        success: false,
                        error: validation.error,
                        message: validation.message,
                        data: {
                            distance: validation.distance,
                            max_distance: validation.maxDistance,
                            user_location: validation.userLocation,
                            kitchen_location: validation.kitchenLocation
                        }
                    });
                }

                // Agregar información de validación al request
                req.gpsValidation = validation;
            }

            next();
        } catch (error) {
            console.error('Error en middleware GPS:', error);
            res.status(500).json({
                success: false,
                error: 'ERROR_VALIDACION_GPS',
                message: 'Error interno al validar la ubicación GPS'
            });
        }
    };
}

/**
 * Limpiar caché de configuración GPS (útil cuando se actualiza la configuración)
 */
function clearGPSConfigCache() {
    gpsConfigCache = null;
    gpsConfigCacheTime = 0;
    console.log('Caché de configuración GPS limpiada');
}

module.exports = {
    calculateDistance,
    validateGPSLocation,
    requireGPSValidation,
    getGPSConfig,
    clearGPSConfigCache
};