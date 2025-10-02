const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const ngrok = require('@ngrok/ngrok');
const axios = require('axios');
const os = require('os');
const { initializeDatabase } = require('./utils/database');
const { config, displayConfig } = require('./config-app-universal');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Variables globales para detección de entorno
let PUBLIC_IP = null;
let IS_AWS = false;
let DETECTED_PORT = null;

// Función para detectar si estamos en AWS
async function detectEnvironment() {
    try {
        // Paso 1: Obtener token IMDSv2 para AWS EC2
        const tokenResponse = await axios.put(
            'http://169.254.169.254/latest/api/token',
            null,
            {
                timeout: 2000,
                headers: { 'X-aws-ec2-metadata-token-ttl-seconds': '21600' }
            }
        );
        
        const token = tokenResponse.data;
        
        // Paso 2: Usar el token para obtener la IP pública
        const ipResponse = await axios.get(
            'http://169.254.169.254/latest/meta-data/public-ipv4',
            {
                timeout: 2000,
                headers: { 'X-aws-ec2-metadata-token': token }
            }
        );
        
        if (ipResponse.data && /^(\d{1,3}\.){3}\d{1,3}$/.test(ipResponse.data)) {
            return { isAWS: true, ip: ipResponse.data.trim() };
        }
    } catch (error) {
        // No es AWS o no tiene acceso a metadata (error 404 o timeout)
    }
    return { isAWS: false, ip: null };
}

// Función para detectar puerto disponible automáticamente
async function detectAvailablePort() {
    // Detectar puerto desde .env o usar 80 por defecto (puerto HTTP estándar)
    const port = process.env.EXTERNAL_PORT || process.env.PORT || 80;
    return parseInt(port);
}

// Configuración inicial del puerto (se actualizará automáticamente al iniciar)
let PORT = process.env.EXTERNAL_PORT || process.env.PORT || 80;
const HOST = process.env.HOST || config.server.host || '0.0.0.0';

// Token de ngrok desde variables de entorno
const NGROK_TOKEN = process.env.NGROK_TOKEN || '33UMqXLZCDRstqQg8xwAKRz0jBM_6XopkVsFYV1DidpXhNn1';

// Dominio estático de ngrok (opcional - requiere plan de pago)
// Si no se especifica, ngrok generará una URL aleatoria diferente cada vez
const NGROK_DOMAIN = process.env.NGROK_DOMAIN || null;

// Configuración de CORS flexible para máxima compatibilidad
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder', 'X-Bypass-Tunnel-Reminder', 'User-Agent', 'X-Requested-With', 'Accept'],
    credentials: true
};

// Middleware básico
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware especial para bypass completo y compatibilidad total
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    
    // Headers para máxima compatibilidad
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent, X-Requested-With, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Headers adicionales
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Responder inmediatamente a preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});

// Rutas principales - usar las rutas sin prefijo /api
app.use('/auth', require('./routes/auth'));
app.use('/fichado', require('./routes/fichado'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/tiempo-real', require('./routes/tiempo-real'));

// Ruta de health check mejorada
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        server: {
            host: HOST,
            port: PORT
        },
        database: {
            connected: true
        },
        ngrok: {
            enabled: true,
            token_configured: !!NGROK_TOKEN
        }
    });
});

// Ruta principal con información del servidor
app.get('/', (req, res) => {
    res.json({
        message: '🍷 Servidor HACCP Wino funcionando correctamente',
        timestamp: new Date().toISOString(),
        server: {
            host: HOST,
            port: PORT,
            environment: process.env.NODE_ENV || 'development'
        },
        endpoints: {
            auth: '/auth/login, /auth/verify',
            fichado: '/fichado/entrada, /fichado/salida, /fichado/historial',
            dashboard: '/dashboard/hoy, /dashboard/resumen',
            health: '/health'
        },
        instructions: {
            mobile_apps: 'Usar la URL de ngrok para conectar desde dispositivos móviles',
            local_access: `http://localhost:${PORT}`,
            configuration: 'Variables configuradas automáticamente con ngrok'
        }
    });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        message: `La ruta ${req.originalUrl} no existe`
    });
});

// Función para detectar la IP pública automáticamente
async function detectPublicIP() {
    try {
        console.log('🔍 Detectando entorno e IP pública...');
        
        // Primero intentar detectar si estamos en AWS
        const awsDetection = await detectEnvironment();
        
        if (awsDetection.isAWS && awsDetection.ip) {
            console.log(`✅ Entorno AWS detectado`);
            console.log(`✅ IP pública (AWS): ${awsDetection.ip}`);
            IS_AWS = true;
            return awsDetection.ip;
        }
        
        console.log('📍 Entorno: LOCAL');
        
        // Si no es AWS, intentar obtener IP desde servicios públicos
        const services = [
            'https://api.ipify.org?format=json',
            'https://ifconfig.me/ip',
            'https://icanhazip.com'
        ];
        
        for (const service of services) {
            try {
                const response = await axios.get(service, { timeout: 5000 });
                const ip = typeof response.data === 'string' 
                    ? response.data.trim() 
                    : response.data.ip;
                
                if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
                    console.log(`✅ IP pública detectada: ${ip}`);
                    return ip;
                }
            } catch (error) {
                // Intentar con el siguiente servicio
                continue;
            }
        }
        
        // Si no se puede detectar desde internet, intentar obtener IP local
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log(`⚠️  Usando IP local: ${iface.address}`);
                    return iface.address;
                }
            }
        }
        
        console.log('⚠️  No se pudo detectar IP pública');
        return 'localhost';
    } catch (error) {
        console.error('❌ Error detectando IP:', error.message);
        return 'localhost';
    }
}

// Variable global para almacenar el listener de ngrok
let ngrokListener = null;

// Función para inicializar ngrok automáticamente
async function initializeNgrok() {
    try {
        console.log('🔄 Configurando túnel ngrok...');
        
        // Desconectar cualquier túnel existente de ESTE proceso
        if (ngrokListener) {
            try {
                console.log('🔌 Desconectando túnel anterior...');
                await ngrokListener.close();
                ngrokListener = null;
            } catch (e) {
                console.log('⚠️  No se pudo cerrar túnel anterior:', e.message);
            }
        }
        
        // Configuración del túnel - NO usar dominio para evitar conflictos
        const forwardConfig = {
            addr: PORT,
            authtoken: NGROK_TOKEN
        };
        
        // Si hay un dominio estático configurado, usarlo (solo con plan de pago)
        if (NGROK_DOMAIN) {
            forwardConfig.domain = NGROK_DOMAIN;
            console.log(`📌 Usando dominio estático: ${NGROK_DOMAIN}`);
        } else {
            console.log('🔀 Generando URL aleatoria (sin dominio estático)');
        }
        
        // Crear el túnel con el nuevo SDK de ngrok
        ngrokListener = await ngrok.forward(forwardConfig);
        
        const url = ngrokListener.url();
        
        console.log('\n🌐 ¡NGROK CONFIGURADO EXITOSAMENTE! 🌐');
        console.log('================================================');
        console.log(`🔗 URL Pública: ${url}`);
        console.log(`🏠 Puerto Local: ${PORT}`);
        console.log(`🔑 Token: ${NGROK_TOKEN.substring(0, 10)}...`);
        if (NGROK_DOMAIN) {
            console.log(`📌 Dominio: ${NGROK_DOMAIN} (estático)`);
        } else {
            console.log(`🔀 URL: Aleatoria (cambia en cada reinicio)`);
        }
        console.log('================================================\n');
        
        return url;
    } catch (error) {
        console.error('❌ Error configurando ngrok:', error.message);
        
        // Detectar errores específicos de ngrok
        if (error.message.includes('tunnel session') || error.message.includes('account limit') || error.message.includes('already online')) {
            console.log('\n⚠️  ADVERTENCIA: Ya tienes un túnel ngrok activo en otro proyecto');
            console.log('📝 SOLUCIONES:');
            console.log('   1. Cierra el otro proyecto que usa ngrok');
            console.log('   2. Usa un token diferente (crea uno gratis en: https://dashboard.ngrok.com)');
            console.log('   3. Actualiza a un plan de pago para múltiples túneles simultáneos');
            console.log(`   4. Accede directamente con: http://${PUBLIC_IP}:${PORT}\n`);
        }
        
        console.log('⚠️  El servidor funcionará sin ngrok');
        console.log(`🌐 Acceso directo: http://${PUBLIC_IP}:${PORT}\n`);
        return null;
    }
}

// Función principal para inicializar el servidor
const startServer = async () => {
    try {
        console.log('🔄 Inicializando servidor HACCP Wino...');
        
        // Detectar IP pública y entorno automáticamente
        PUBLIC_IP = await detectPublicIP();
        
        // Detectar puerto disponible automáticamente
        if (!process.env.PORT) {
            PORT = await detectAvailablePort();
            console.log(`🔧 Puerto detectado automáticamente: ${PORT}`);
        } else {
            PORT = parseInt(process.env.PORT);
            console.log(`🔧 Puerto configurado manualmente: ${PORT}`);
        }
        
        DETECTED_PORT = PORT;
        
        console.log('📊 Inicializando base de datos...');
        await initializeDatabase();
        console.log('✅ Base de datos inicializada correctamente');

        // Iniciar servidor en HOST y PORT configurados
        const server = app.listen(PORT, HOST, async () => {
            const ENVIRONMENT = IS_AWS ? 'AWS' : 'LOCAL';
            const PUBLIC_URL = `http://${PUBLIC_IP}${PORT === 80 ? '' : ':' + PORT}`;
            
            console.log(`\n🚀 SERVIDOR HACCP WINO INICIADO! 🚀`);
            console.log('==========================================');
            console.log(`📍 Entorno: ${ENVIRONMENT}`);
            console.log(`🏠 Servidor: ${HOST}:${PORT}`);
            console.log(`🌐 IP Pública: ${PUBLIC_IP}`);
            console.log(`🌍 URL Acceso: ${PUBLIC_URL}`);
            console.log(`🏥 Node ENV: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📋 Health: ${PUBLIC_URL}/health`);
            console.log('==========================================\n');
            
            // Configurar ngrok automáticamente (solo en LOCAL)
            if (NGROK_TOKEN && !IS_AWS) {
                try {
                    const publicUrl = await initializeNgrok();
                    if (publicUrl) {
                        console.log('✅ TÚNEL NGROK CONFIGURADO ✅');
                        console.log('==========================================');
                        console.log(`🌍 URL Ngrok: ${publicUrl}`);
                        console.log(`🏠 URL Local: http://localhost:${PORT}`);
                        console.log('==========================================\n');
                        console.log('📱 Usa la URL de ngrok para acceso externo\n');
                    } else {
                        console.log('⚠️  NGROK NO DISPONIBLE (probablemente ya está en uso)');
                        console.log('==========================================');
                        console.log(`🌐 Acceso: ${PUBLIC_URL}`);
                        console.log(`🏠 Local: http://localhost:${PORT}`);
                        console.log('==========================================\n');
                    }
                } catch (ngrokError) {
                    console.error('❌ Error iniciando ngrok:', ngrokError.message);
                    console.log('==========================================');
                    console.log(`🌐 Acceso: ${PUBLIC_URL}`);
                    console.log(`🏠 Local: http://localhost:${PORT}`);
                    console.log('==========================================\n');
                }
            } else if (IS_AWS) {
                console.log('📡 Servidor AWS - Acceso directo por IP');
                console.log('==========================================');
                console.log(`🌐 URL Pública: ${PUBLIC_URL}`);
                console.log('==========================================\n');
            }
        });

        // Configurar cierre elegante
        const gracefulShutdown = async () => {
            console.log('\n🛑 Cerrando servidor...');
            
            // Cerrar túnel ngrok si existe
            if (ngrokListener) {
                try {
                    console.log('🔌 Cerrando túnel ngrok...');
                    await ngrokListener.close();
                    console.log('✅ Ngrok cerrado');
                } catch (error) {
                    console.log('⚠️  Error cerrando ngrok:', error.message);
                }
            }
            
            // Cerrar servidor HTTP
            server.close(() => {
                console.log('✅ Servidor cerrado correctamente');
                process.exit(0);
            });
        };

        // Manejo de señales de cierre
        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);
        
    } catch (error) {
        console.error('❌ Error al inicializar el servidor:', error);
        process.exit(1);
    }
};

// Iniciar servidor automáticamente
startServer();