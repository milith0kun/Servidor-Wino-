# 🍷 Servidor HACCP Wino - Backend

## 📋 Descripción
Backend Node.js para el sistema HACCP de control de asistencia con integración automática de ngrok para acceso remoto.

## 🚀 Características
- ✅ API REST con Express.js
- ✅ Base de datos SQLite
- ✅ Autenticación JWT
- ✅ Túnel ngrok automático
- ✅ Validación GPS
- ✅ CORS configurado

## ⚙️ Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/milith0kun/Servidor-Wino-.git
cd Servidor-Wino-
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
El archivo `.env` ya incluye la configuración básica. **Si quieres usar ngrok**, asegúrate de tener un token válido.

## 🔑 Configuración de ngrok

### ⚠️ Importante sobre el token de ngrok

**Token actual en uso:** `33UMqXLZCDRstqQg8xwAKRz0jBM_6XopkVsFYV1DidpXhNn1`

#### Limitaciones del plan gratuito de ngrok:
- ✅ **1 túnel simultáneo** permitido
- ❌ Si ya usas este token en otro proyecto, **no podrás crear un segundo túnel**
- 💡 El servidor **funcionará normalmente** pero sin túnel público

#### Soluciones:

**Opción 1: Usa un solo proyecto con ngrok a la vez**
- Cierra el otro proyecto que usa el mismo token
- Inicia este servidor

**Opción 2: Crea un nuevo token gratuito**
1. Ve a [ngrok Dashboard](https://dashboard.ngrok.com)
2. Inicia sesión o crea una cuenta
3. Ve a "Your Authtoken"
4. Copia el nuevo token
5. Actualiza el archivo `.env`:
```env
NGROK_TOKEN=tu_nuevo_token_aqui
```

**Opción 3: Usa la IP pública directamente**
- El servidor está en AWS: `http://18.220.8.226:3000`
- **Requiere:** Abrir el puerto 3000 en el Security Group de AWS

**Opción 4: Actualiza a ngrok de pago**
- Permite múltiples túneles simultáneos
- Dominios personalizados
- Mayor estabilidad

## 🖥️ Uso

### Iniciar el servidor (desarrollo)
```bash
npm run dev
```

### Iniciar el servidor (producción)
```bash
npm start
```

### Iniciar con PM2 (recomendado para servidor)
```bash
npm install -g pm2
pm2 start server.js --name "wino-backend"
pm2 save
pm2 startup
```

## 📡 Endpoints disponibles

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/verify` - Verificar token

### Fichado
- `POST /fichado/entrada` - Registrar entrada
- `POST /fichado/salida` - Registrar salida
- `GET /fichado/historial` - Ver historial

### Dashboard
- `GET /dashboard/hoy` - Resumen del día
- `GET /dashboard/resumen` - Resumen general

### Health Check
- `GET /health` - Estado del servidor
- `GET /` - Información del API

## 🌐 Acceso remoto

### Con ngrok (automático)
Si el token está disponible y no está en uso, el servidor mostrará:
```
🌍 URL PÚBLICA NGROK: https://xxxxx.ngrok.io
```

### Sin ngrok (IP directa)
```
🌐 IP Pública AWS: http://18.220.8.226:3000
```
**Nota:** Asegúrate de abrir el puerto en AWS Security Groups

## 🔧 Configuración de AWS Security Group

Para acceder sin ngrok, abre el puerto 3000:
1. Ve a EC2 Dashboard
2. Security Groups
3. Selecciona el security group de tu instancia
4. Inbound Rules → Edit
5. Add Rule:
   - Type: Custom TCP
   - Port: 3000
   - Source: 0.0.0.0/0 (o tu IP específica)

## 📦 Estructura del proyecto
```
.
├── server.js              # Servidor principal con ngrok
├── package.json           # Dependencias
├── .env                   # Variables de entorno
├── config/                # Configuraciones
├── database/              # Base de datos SQLite
├── middleware/            # Middleware de autenticación
├── routes/                # Rutas del API
│   ├── auth.js
│   ├── fichado.js
│   ├── dashboard.js
│   └── tiempo-real.js
└── utils/                 # Utilidades
    ├── database.js
    └── gpsValidation.js
```

## 🐛 Solución de problemas

### Error: "You are already running a tunnel session"
- **Causa:** Ya tienes un túnel ngrok activo con el mismo token
- **Solución:** Cierra el otro proyecto o usa un token diferente

### El servidor no es accesible desde fuera
- Verifica que el puerto esté abierto en AWS Security Groups
- Usa la URL de ngrok en lugar de la IP directa
- Verifica que el firewall local no bloquee el puerto

### Base de datos no se inicializa
- Asegúrate de que el directorio `database/` existe
- Verifica permisos de escritura

## 📝 Variables de entorno (.env)

```env
# Puerto del servidor
PORT=3000
HOST=0.0.0.0

# Token de ngrok
NGROK_TOKEN=tu_token_aqui

# JWT Secret
JWT_SECRET=tu_secret_aqui
TOKEN_EXPIRATION=24h

# GPS Config
KITCHEN_LATITUDE=-12.0464
KITCHEN_LONGITUDE=-77.0428
GPS_RADIUS_METERS=100
```

## 📄 Licencia
ISC

## 👤 Autor
milith0kun
