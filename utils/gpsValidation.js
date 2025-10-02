// Utilidad para validación GPS - HACCP System
// Verifica si el usuario está dentro del rango permitido para fichar

const { CONFIG_UNIVERSAL } = require('../config-app-universal');

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
 * @returns {Object} Resultado de la validación
 */
function validateGPSLocation(userLatitude, userLongitude) {
    try {
        // Validar que las coordenadas sean números válidos
        if (!userLatitude || !userLongitude || 
            isNaN(userLatitude) || isNaN(userLongitude)) {
            return {
                isValid: false,
                error: 'COORDENADAS_INVALIDAS',
                message: 'Las coordenadas GPS proporcionadas no son válidas',
                distance: null,
                maxDistance: CONFIG_UNIVERSAL.gps.radiusMeters
            };
        }

        // Obtener coordenadas de la cocina desde la configuración
        const kitchenLat = CONFIG_UNIVERSAL.gps.kitchenLatitude;
        const kitchenLon = CONFIG_UNIVERSAL.gps.kitchenLongitude;
        const maxDistance = CONFIG_UNIVERSAL.gps.radiusMeters;

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
    return (req, res, next) => {
        const { latitud, longitud, metodo = 'MANUAL' } = req.body;

        // Si el método es MANUAL y GPS no es requerido, continuar
        if (metodo === 'MANUAL' && !required) {
            return next();
        }

        // Si el método es GPS o GPS es requerido, validar
        if (metodo === 'GPS' || required) {
            if (!latitud || !longitud) {
                return res.status(400).json({
                    success: false,
                    error: 'GPS_REQUERIDO',
                    message: 'Las coordenadas GPS son obligatorias para fichar',
                    data: {
                        required_fields: ['latitud', 'longitud'],
                        gps_config: {
                            kitchen_location: {
                                latitude: CONFIG_UNIVERSAL.gps.kitchenLatitude,
                                longitude: CONFIG_UNIVERSAL.gps.kitchenLongitude
                            },
                            max_distance_meters: CONFIG_UNIVERSAL.gps.radiusMeters
                        }
                    }
                });
            }

            // Validar ubicación GPS
            const validation = validateGPSLocation(latitud, longitud);
            
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
    };
}

module.exports = {
    calculateDistance,
    validateGPSLocation,
    requireGPSValidation
};