# Documentación Backend - Sistema HACCP con GPS
**Estado:** ✅ Funcional con GPS y Dashboard en Tiempo Real  
**Última actualización:** Enero 2025

## 🎯 Estado Actual del Proyecto

### ✅ Funcionalidades Implementadas
- **Sistema de autenticación** completo con JWT
- **Fichado GPS** con validación de ubicación en tiempo real
- **Dashboard interactivo** con fecha y hora en tiempo real
- **Historial de fichados** con información GPS detallada
- **Base de datos SQLite** con estructura optimizada
- **API REST** completa y documentada
- **Configuración unificada** para desarrollo y producción

### 🚀 Nuevas Características GPS
- **Validación de ubicación** automática al fichar
- **Cálculo de distancia** con fórmula Haversine
- **Coordenadas de entrada y salida** almacenadas
- **Método GPS por defecto** con fallback manual
- **Información GPS detallada** en respuestas API

## 🌐 URLs y Acceso

### Servidor Local
- **Backend:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

### Túnel Público (LocalTunnel)
- **URL Externa:** https://afraid-goats-wave.loca.lt
- **Bypass automático** de página de contraseña configurado

## 🔐 Credenciales por Defecto
```
Usuario: admin
Contraseña: admin123
```

## 🐳 Comandos Docker Esenciales

### Construcción y Ejecución
```bash
# Construir imagen
docker build -t haccp-backend .

# Ejecutar contenedor
docker run -d --name haccp-backend -p 3000:3000 haccp-backend

# Ver logs en tiempo real
docker logs haccp-backend -f

# Reiniciar contenedor
docker restart haccp-backend
```

## 📡 Endpoints API Principales

### 🔐 Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/verify` - Verificar token

### 📍 Fichado con GPS
- `POST /api/fichado/entrada` - **Fichado de entrada con GPS**
  - Requiere: `latitud`, `longitud`, `metodo` (GPS/MANUAL)
  - Valida ubicación automáticamente
  - Respuesta incluye información GPS detallada

- `POST /api/fichado/salida` - **Fichado de salida con GPS**
  - Opcional: `latitud`, `longitud`
  - Almacena coordenadas de salida
  - Calcula horas trabajadas

- `GET /api/fichado/historial` - **Historial con información GPS**
  - Filtros: `fecha_inicio`, `fecha_fin`, `periodo`
  - Incluye coordenadas y validación GPS
  - Estadísticas de periodo

- `GET /api/fichado/estado-hoy` - Estado de fichado del día

### 📊 Dashboard en Tiempo Real
- `GET /api/dashboard/hoy` - **Dashboard completo con tiempo real**
  - Información de usuario y fichado
  - Fecha y hora actualizadas
  - Detalles GPS de entrada/salida
  - Estado de trabajo actual

- `GET /api/dashboard/resumen` - Resumen estadístico

### ⏰ Tiempo Real
- `GET /api/tiempo-real/ahora` - **Fecha y hora del servidor**
- `GET /api/tiempo-real/formato` - Formatos específicos de tiempo
- `GET /api/tiempo-real/zona-trabajo` - Información de turno laboral

## 🗄️ Estructura Base de Datos SQLite

### Tabla `usuarios`
```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre_completo TEXT,
    email TEXT,
    rol TEXT DEFAULT 'empleado',
    activo INTEGER DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla `asistencia` (Actualizada con GPS)
```sql
CREATE TABLE asistencia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    latitud REAL,           -- Coordenadas de entrada
    longitud REAL,
    latitud_salida REAL,    -- 🆕 Coordenadas de salida
    longitud_salida REAL,   -- 🆕 Coordenadas de salida
    metodo_fichado TEXT DEFAULT 'GPS',  -- 🆕 GPS por defecto
    observaciones TEXT,
    horas_trabajadas REAL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

## 📁 Estructura del Proyecto

```
Backend/
├── 📄 server.js                 # Servidor principal
├── 📄 config-app-universal.js   # Configuración unificada
├── 📄 Dockerfile               # Contenedor Docker
├── 📁 routes/
│   ├── 📄 auth.js              # Autenticación
│   ├── 📄 fichado.js           # Fichado con GPS
│   ├── 📄 dashboard.js         # Dashboard tiempo real
│   └── 📄 tiempo-real.js       # 🆕 Endpoints de tiempo
├── 📁 utils/
│   ├── 📄 database.js          # Gestión SQLite
│   ├── 📄 auth.js              # Middleware JWT
│   └── 📄 gpsValidation.js     # 🆕 Validación GPS
└── 📁 data/
    └── 📄 database.sqlite      # Base de datos
```

## 🧪 Comandos de Prueba Rápida

### Autenticación
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Fichado con GPS
```bash
# Fichado entrada con GPS
curl -X POST http://localhost:3000/api/fichado/entrada \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"latitud":-12.0464,"longitud":-77.0428,"metodo":"GPS"}'

# Ver historial con GPS
curl -X GET "http://localhost:3000/api/fichado/historial" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Dashboard y Tiempo Real
```bash
# Dashboard completo
curl -X GET http://localhost:3000/api/dashboard/hoy \
  -H "Authorization: Bearer YOUR_TOKEN"

# Tiempo real
curl -X GET http://localhost:3000/api/tiempo-real/ahora
```

## ⚙️ Configuración GPS

### Parámetros en `config-app-universal.js`
```javascript
gps: {
    kitchenLatitude: -12.0464,    // Latitud de la cocina
    kitchenLongitude: -77.0428,   // Longitud de la cocina
    radiusMeters: 100             // Radio permitido en metros
}
```

## 🔄 Próximas Fases de Implementación

### Fase 3: Mejoras Avanzadas
- [ ] **Notificaciones push** para fichados
- [ ] **Reportes automáticos** semanales/mensuales
- [ ] **Geofencing avanzado** con múltiples zonas
- [ ] **Integración con sistemas externos**

### Fase 4: Optimización
- [ ] **Cache Redis** para mejor rendimiento
- [ ] **Base de datos PostgreSQL** para producción
- [ ] **Monitoreo y métricas** avanzadas
- [ ] **Backup automático** de datos

## 🎯 Características Destacadas

### ✨ Sistema GPS Inteligente
- **Validación automática** de ubicación
- **Cálculo preciso** de distancia con Haversine
- **Fallback manual** cuando GPS no está disponible
- **Almacenamiento** de coordenadas de entrada y salida

### ⏰ Dashboard en Tiempo Real
- **Fecha y hora actualizadas** del servidor
- **Información completa** de fichado diario
- **Detalles GPS** de entrada y salida
- **Estado de trabajo** en tiempo real

### 🔧 Configuración Flexible
- **Un solo archivo** de configuración
- **Adaptable** a desarrollo y producción
- **Parámetros GPS** configurables
- **CORS y seguridad** optimizados

---

**🚀 El backend está completamente funcional con GPS, dashboard en tiempo real y listo para integración con el frontend.**