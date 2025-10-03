# 🌐 Sistema HACCP - Panel Web Administrativo

Panel web administrativo para gestión del Sistema de Calidad HACCP desarrollado con React + Vite + Material-UI.

## 🚀 Tecnologías

- **Frontend**: React 18 + Vite
- **UI**: Material-UI (MUI)
- **Routing**: React Router v6
- **State Management**: Zustand + Context API
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Export**: XLSX

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tu configuración
# VITE_API_URL=http://18.220.8.226:3000/api
```

## 🛠️ Desarrollo

```bash
# Modo desarrollo (puerto 5173)
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 📁 Estructura del Proyecto

```
WebPanel/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── Layout.jsx       # Layout principal con sidebar
│   │   └── ProtectedRoute.jsx
│   ├── context/             # Context API
│   │   └── AuthContext.jsx  # Autenticación global
│   ├── pages/               # Páginas principales
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Asistencias.jsx
│   │   ├── Usuarios.jsx
│   │   ├── Reportes.jsx
│   │   ├── Auditoria.jsx
│   │   └── HACCP/           # Submódulos HACCP
│   │       ├── RecepcionMercaderia.jsx
│   │       ├── ControlCoccion.jsx
│   │       ├── LavadoFrutas.jsx
│   │       ├── LavadoManos.jsx
│   │       └── TemperaturaCamaras.jsx
│   ├── services/            # Servicios API
│   │   └── api.js           # Cliente Axios + endpoints
│   ├── utils/               # Utilidades
│   │   └── exportExcel.js   # Exportación a Excel
│   ├── App.jsx              # Componente principal
│   └── main.jsx             # Entry point
├── index.html
├── vite.config.js
└── package.json
```

## 🔐 Autenticación

El sistema usa JWT (JSON Web Tokens) almacenados en `localStorage`:

```javascript
// Login
const { login } = useAuth();
await login('admin@hotel.com', 'admin123');

// Logout
const { logout } = useAuth();
logout();

// Verificar autenticación
const { isAuthenticated, user } = useAuth();
```

## 📊 Funcionalidades

### ✅ Implementadas

1. **Login** - Autenticación con email + password
2. **Dashboard** - Resumen con gráficos y estadísticas
3. **Asistencias** - Tabla con filtros + exportación Excel
4. **Recepción Mercadería** - Tabla HACCP con filtros por tipo

### 🚧 En desarrollo

5. **Control Cocción** - Tabla de control de cocción
6. **Lavado Frutas** - Tabla de lavado de frutas/verduras
7. **Lavado Manos** - Tabla de lavado de manos
8. **Temperatura Cámaras** - Tabla de temperatura + gráficos
9. **Usuarios** - CRUD completo de usuarios
10. **Reportes** - Reportes de no conformidades
11. **Auditoría** - Logs de auditoría

## 📤 Exportación a Excel

Todas las tablas incluyen botón "Exportar a Excel":

```javascript
import { exportarAsistencias } from '../utils/exportExcel';

// Exportar asistencias
exportarAsistencias(datos, mes, anio);

// Exportar recepción mercadería
exportarRecepcionMercaderia(datos, mes, anio, 'FRUTAS_VERDURAS');
```

## 🌐 Deploy a AWS EC2

### Opción 1: Nginx como servidor estático

```bash
# 1. Build local
npm run build

# 2. Transferir archivos al servidor
scp -r dist/* ubuntu@18.220.8.226:/var/www/sistema-haccp/

# 3. Configurar Nginx (ver DEPLOY.md)
```

### Opción 2: Servir con Node.js

```bash
# 1. Build local
npm run build

# 2. Copiar dist al servidor
# 3. Servir con serve o express
npm install -g serve
serve -s dist -p 80
```

## 🔧 Configuración de Nginx

Ver archivo `DEPLOY.md` para instrucciones completas de deployment.

## 📱 Responsive Design

El panel es completamente responsive:
- Desktop: Sidebar fijo
- Tablet: Sidebar colapsable
- Mobile: Drawer hamburger menu

## 🎨 Personalización

### Cambiar tema

Editar `src/App.jsx`:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Tu color primario
    },
    secondary: {
      main: '#dc004e', // Tu color secundario
    },
  },
});
```

### Cambiar logo

Reemplazar `public/vite.svg` con tu logo.

## 📝 API Endpoints

Documentación completa en `Backend/BACKEND_ARCHITECTURE.md`

Base URL: `http://18.220.8.226:3000/api`

### Autenticación
- `POST /auth/login`
- `GET /auth/verify`

### Dashboard
- `GET /dashboard/hoy`
- `GET /dashboard/admin`

### Fichado
- `GET /fichado/historial?mes=X&anio=Y`

### HACCP
- `GET /haccp/recepcion-mercaderia?mes=X&anio=Y&tipo=FRUTAS_VERDURAS`
- `GET /haccp/control-coccion?mes=X&anio=Y`
- (ver más en BACKEND_ARCHITECTURE.md)

## 🐛 Troubleshooting

### Error de CORS

Si ves errores de CORS, asegúrate de que el backend tenga configurado:

```javascript
// server.js
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:5173', 'http://18.220.8.226'],
  credentials: true
}));
```

### Token expirado

Los tokens JWT expiran en 24h. Si ves error 403, haz logout y vuelve a iniciar sesión.

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

## 👨‍💻 Autor

Sistema desarrollado para gestión HACCP en hoteles/restaurantes
