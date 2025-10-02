const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const ngrok = require('@ngrok/ngrok');
const { initializeDatabase } = require('./utils/database');
const { config, displayConfig } = require('./config-app-universal');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Configuración flexible del servidor
const PORT = process.env.PORT || config.server.port || 3000;
const HOST = process.env.HOST || config.server.host || '0.0.0.0';

// Token de ngrok desde variables de entorno
const NGROK_TOKEN = process.env.NGROK_TOKEN || '33UMqXLZCDRstqQg8xwAKRz0jBM_6XopkVsFYV1DidpXhNn1';

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

// Función para inicializar ngrok automáticamente
async function initializeNgrok() {
    try {
        console.log('🔄 Configurando túnel ngrok...');
        
        // Crear el túnel con el nuevo SDK de ngrok
        const listener = await ngrok.forward({
            addr: PORT,
            authtoken: NGROK_TOKEN,
            proto: 'http'
        });
        
        const url = listener.url();
        
        console.log('\n🌐 ¡NGROK CONFIGURADO EXITOSAMENTE! 🌐');
        console.log('================================================');
        console.log(`🔗 URL Pública: ${url}`);
        console.log(`🏠 Puerto Local: ${PORT}`);
        console.log(`🔑 Token configurado: ${NGROK_TOKEN.substring(0, 10)}...`);
        console.log('================================================\n');
        
        return url;
    } catch (error) {
        console.error('❌ Error configurando ngrok:', error);
        console.log('⚠️  Continuando sin túnel público...');
        return null;
    }
}

// Función principal para inicializar el servidor
const startServer = async () => {
    try {
        console.log('🔄 Inicializando servidor HACCP Wino...');
        
        console.log('📊 Inicializando base de datos...');
        await initializeDatabase();
        console.log('✅ Base de datos inicializada correctamente');

        // Iniciar servidor en HOST y PORT configurados
        const server = app.listen(PORT, HOST, async () => {
            console.log(`\n🚀 SERVIDOR HACCP WINO INICIADO! 🚀`);
            console.log('==========================================');
            console.log(`🏠 Local: http://${HOST}:${PORT}`);
            console.log(`🏥 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📋 Health: http://localhost:${PORT}/health`);
            console.log('==========================================\n');
            
            // Configurar ngrok automáticamente
            if (NGROK_TOKEN) {
                try {
                    const publicUrl = await initializeNgrok();
                    if (publicUrl) {
                        console.log('✅ SERVIDOR COMPLETAMENTE CONFIGURADO ✅');
                        console.log('==========================================');
                        console.log(`🌍 URL PÚBLICA: ${publicUrl}`);
                        console.log(`🏠 URL Local: http://localhost:${PORT}`);
                        console.log('==========================================\n');
                        console.log('📱 Usa la URL pública para conectar desde cualquier dispositivo\n');
                    }
                } catch (ngrokError) {
                    console.error('❌ Error iniciando ngrok:', ngrokError);
                    console.log('⚠️  El servidor funciona localmente en:', `http://localhost:${PORT}\n`);
                }
            } else {
                console.log('⚠️  No se encontró token de ngrok, servidor solo local\n');
            }
        });

        // Configurar cierre elegante
        const gracefulShutdown = async () => {
            console.log('\n🛑 Cerrando servidor...');
            try {
                await ngrok.disconnect();
                console.log('✅ Ngrok cerrado');
            } catch (error) {
                console.log('⚠️  Error cerrando ngrok:', error.message);
            }
            
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