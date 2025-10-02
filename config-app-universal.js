// Configuración Universal para Apps Móviles - HACCP System
// Acceso automático desde WiFi local y datos móviles

const CONFIG_UNIVERSAL = {
  // URLs del servidor en orden de prioridad
  SERVER_URLS: [
    // 1. TÚNEL PÚBLICO (DATOS MÓVILES) ⭐ PRINCIPAL - ACTIVO
    'https://honest-bears-call.loca.lt',
    
    // 2. IP local (para WiFi local)
    'http://192.168.1.98:3000',
    
    // 3. Localhost (para emuladores)
    'http://localhost:3000'
  ],
  
  // Configuración de timeout para pruebas de conectividad
  TIMEOUT_MS: 5000,
  
  // Headers para CORS y bypass COMPLETO de LocalTunnel
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'X-Bypass-Tunnel-Reminder': 'true',
    'User-Agent': 'HACCP-Mobile-App/1.0',
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache'
  },

  // ========== CONFIGURACIÓN DEL SERVIDOR BACKEND ==========
  // Configuración del servidor
  server: {
    // Puerto del servidor (modificable por el usuario)
    port: process.env.PORT || 3000,
    
    // Host del servidor - 0.0.0.0 permite conexiones desde cualquier IP
    host: process.env.HOST || '0.0.0.0',
    
    // IP pública/local para mostrar en logs (opcional, se detecta automáticamente)
    publicIP: process.env.PUBLIC_IP || null
  },

  // Configuración de la base de datos
  database: {
    // Ruta de la base de datos SQLite (relativa al contenedor)
    path: process.env.DB_PATH || '/app/database/database.db',
    
    // Directorio de la base de datos
    directory: process.env.DB_DIRECTORY || '/app/database'
  },

  // Configuración de seguridad
  security: {
    // Clave secreta para JWT (se genera automáticamente si no se proporciona)
    jwtSecret: process.env.JWT_SECRET || 'haccp-secret-key-' + Date.now(),
    
    // Tiempo de expiración del token (24 horas por defecto)
    tokenExpiration: process.env.TOKEN_EXPIRATION || '24h'
  },

  // Configuración GPS para futuras funcionalidades
  gps: {
    // Latitud de la cocina/hotel
    kitchenLatitude: parseFloat(process.env.KITCHEN_LATITUDE) || -12.0464,
    
    // Longitud de la cocina/hotel  
    kitchenLongitude: parseFloat(process.env.KITCHEN_LONGITUDE) || -77.0428,
    
    // Radio permitido en metros
    radiusMeters: parseInt(process.env.GPS_RADIUS_METERS) || 100
  },

  // Configuración de logs
  logging: {
    // Directorio de logs
    directory: process.env.LOG_DIRECTORY || '/app/logs',
    
    // Nivel de logging
    level: process.env.LOG_LEVEL || 'info'
  },

  // Configuración de CORS
  cors: {
    // Permitir todas las conexiones por defecto para máxima compatibilidad
    origin: process.env.CORS_ORIGIN || '*',
    
    // Métodos permitidos - incluye HEAD para bypass completo
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    
    // Headers permitidos - configuración COMPLETA para bypass de LocalTunnel
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'bypass-tunnel-reminder', 
      'X-Bypass-Tunnel-Reminder',
      'User-Agent', 
      'X-Requested-With',
      'Accept',
      'Cache-Control',
      'Pragma'
    ]
  },

  // Información del entorno
  environment: {
    // Entorno de ejecución
    nodeEnv: process.env.NODE_ENV || 'production',
    
    // Versión de la aplicación
    version: '1.0.0',
    
    // Nombre de la aplicación
    appName: 'HACCP Backend Server'
  }
};

// Función para obtener la IP local automáticamente
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Buscar IPv4 no interna
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Función para mostrar información de configuración al iniciar
function displayConfig() {
  const localIP = getLocalIP();
  
  console.log('\n🚀 HACCP Backend Server - Configuración');
  console.log('==========================================');
  console.log(`📱 Aplicación: ${CONFIG_UNIVERSAL.environment.appName} v${CONFIG_UNIVERSAL.environment.version}`);
  console.log(`🌐 Entorno: ${CONFIG_UNIVERSAL.environment.nodeEnv}`);
  console.log(`🔌 Puerto: ${CONFIG_UNIVERSAL.server.port}`);
  console.log(`🏠 Host: ${CONFIG_UNIVERSAL.server.host}`);
  console.log(`📍 IP Local: ${localIP}`);
  console.log(`🔗 URL Local: http://${localIP}:${CONFIG_UNIVERSAL.server.port}`);
  console.log(`🔗 URL Localhost: http://localhost:${CONFIG_UNIVERSAL.server.port}`);
  console.log(`💾 Base de datos: ${CONFIG_UNIVERSAL.database.path}`);
  console.log(`🔐 JWT configurado: ${CONFIG_UNIVERSAL.security.jwtSecret ? 'Sí' : 'No'}`);
  console.log(`📊 Logs: ${CONFIG_UNIVERSAL.logging.directory}`);
  console.log('==========================================\n');
  
  // Instrucciones para usuarios
  console.log('📋 INSTRUCCIONES PARA USUARIOS:');
  console.log(`   • Para aplicaciones móviles usar: http://${localIP}:${CONFIG_UNIVERSAL.server.port}`);
  console.log('   • Para cambiar puerto: modificar variable PORT en .env');
  console.log('   • Para cambiar IP: modificar variable HOST en .env');
  console.log('   • El servidor acepta conexiones desde cualquier dispositivo en la red\n');
}

// Función para detectar automáticamente la URL funcional
async function detectWorkingURL() {
  for (const url of CONFIG_UNIVERSAL.SERVER_URLS) {
    try {
      console.log(`🔍 Probando conexión: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG_UNIVERSAL.TIMEOUT_MS);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: CONFIG_UNIVERSAL.HEADERS,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Conexión exitosa: ${url}`);
        return url;
      }
    } catch (error) {
      console.log(`❌ Error conectando a ${url}:`, error.message);
    }
  }
  
  console.log('⚠️ No se pudo conectar a ningún servidor');
  return null;
}

// Función para obtener la configuración completa
async function getServerConfig() {
  const workingURL = await detectWorkingURL();
  
  if (!workingURL) {
    throw new Error('No se pudo establecer conexión con el servidor');
  }
  
  return {
    baseURL: workingURL,
    timeout: CONFIG_UNIVERSAL.TIMEOUT_MS,
    headers: CONFIG_UNIVERSAL.HEADERS,
    endpoints: {
      health: `${workingURL}/health`,
      auth: {
        login: `${workingURL}/api/auth/login`,
        register: `${workingURL}/api/auth/register`,
        verify: `${workingURL}/api/auth/verify`
      },
      dashboard: `${workingURL}/api/dashboard`,
      fichado: {
        checkin: `${workingURL}/api/fichado/checkin`,
        checkout: `${workingURL}/api/fichado/checkout`,
        history: `${workingURL}/api/fichado/history`
      }
    }
  };
}



// Exportar para diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
  // Node.js - Exportar tanto configuración de app como de servidor
  module.exports = { 
    CONFIG_UNIVERSAL, 
    detectWorkingURL, 
    getServerConfig,
    config: CONFIG_UNIVERSAL, // Alias para compatibilidad con server.js
    getLocalIP,
    displayConfig
  };
} else if (typeof window !== 'undefined') {
  // Browser
  window.CONFIG_UNIVERSAL = CONFIG_UNIVERSAL;
  window.detectWorkingURL = detectWorkingURL;
  window.getServerConfig = getServerConfig;
}

// Para React Native / Expo
// export { CONFIG_UNIVERSAL, detectWorkingURL, getServerConfig, getLocalIP, displayConfig };