# 🚀 GUÍA DE DEPLOYMENT - PANEL WEB EN AWS EC2

Esta guía explica cómo desplegar el Panel Web Administrativo en AWS EC2 con Nginx.

## 📋 Requisitos Previos

- Servidor AWS EC2 (Ubuntu 22.04)
- IP: `18.220.8.226`
- Backend corriendo en puerto `3000` (PM2)
- Acceso SSH con key `edmil-key.pem`

## 🔧 PASO 1: Instalar Nginx en EC2

```bash
# Conectar al servidor
ssh -i edmil-key.pem ubuntu@18.220.8.226

# Actualizar sistema
sudo apt update
sudo apt upgrade -y

# Instalar Nginx
sudo apt install nginx -y

# Verificar instalación
nginx -v
sudo systemctl status nginx

# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 📁 PASO 2: Crear Directorios

```bash
# Crear directorio para el panel web
sudo mkdir -p /var/www/sistema-haccp
sudo chown -R ubuntu:ubuntu /var/www/sistema-haccp

# Crear directorio para logs
sudo mkdir -p /var/log/nginx/sistema-haccp
```

## 🏗️ PASO 3: Build del Proyecto (En tu PC local)

```bash
# En tu PC, en la carpeta WebPanel
cd "d:\Programacion Fuera de la U\AppWino\WebPanel"

# Instalar dependencias
npm install

# Build para producción
npm run build

# Esto genera la carpeta 'dist' con los archivos estáticos
```

## 📤 PASO 4: Transferir Archivos al Servidor

```bash
# Desde tu PC (PowerShell), transferir archivos
cd "d:\Programacion Fuera de la U\AppWino\WebPanel"

# Transferir carpeta dist completa
scp -i "..\edmil-key.pem" -r dist/* ubuntu@18.220.8.226:/var/www/sistema-haccp/

# Verificar transferencia
ssh -i "..\edmil-key.pem" ubuntu@18.220.8.226 "ls -la /var/www/sistema-haccp"
```

## ⚙️ PASO 5: Configurar Nginx

```bash
# Conectar al servidor
ssh -i edmil-key.pem ubuntu@18.220.8.226

# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/sistema-haccp
```

Pegar esta configuración:

```nginx
server {
    listen 80;
    server_name 18.220.8.226;

    # Logs
    access_log /var/log/nginx/sistema-haccp/access.log;
    error_log /var/log/nginx/sistema-haccp/error.log;

    # Root del panel web
    root /var/www/sistema-haccp;
    index index.html;

    # Servir archivos estáticos del panel
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para el backend API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        
        # Handle OPTIONS requests
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Optimización de caché para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Compresión gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

```bash
# Guardar (Ctrl+O, Enter, Ctrl+X)

# Crear symlink
sudo ln -s /etc/nginx/sites-available/sistema-haccp /etc/nginx/sites-enabled/

# Eliminar configuración default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Si todo está OK, reiniciar Nginx
sudo systemctl restart nginx
```

## 🔥 PASO 6: Configurar Firewall (AWS Security Group)

En la consola de AWS EC2:

1. Ir a EC2 → Security Groups
2. Seleccionar el security group de tu instancia
3. Añadir reglas de entrada:
   - **HTTP**: Puerto `80`, Source: `0.0.0.0/0` (cualquier IP)
   - **HTTPS**: Puerto `443`, Source: `0.0.0.0/0` (opcional, para SSL)
   - **Custom**: Puerto `3000`, Source: `localhost` (ya debería estar)

O desde el servidor:

```bash
# Verificar firewall
sudo ufw status

# Si está activo, añadir reglas
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

## 🌐 PASO 7: Verificar Despliegue

```bash
# Desde el servidor, verificar que Nginx está corriendo
sudo systemctl status nginx

# Ver logs en tiempo real
sudo tail -f /var/log/nginx/sistema-haccp/access.log
sudo tail -f /var/log/nginx/sistema-haccp/error.log

# Verificar backend PM2
pm2 status
pm2 logs wino-backend
```

Desde tu navegador:

1. Abrir: `http://18.220.8.226`
2. Deberías ver la página de login del panel
3. Login con: `admin@hotel.com` / `admin123`

## 🔐 PASO 8 (OPCIONAL): Configurar HTTPS con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL (requiere dominio)
# NOTA: Necesitas un dominio apuntando a tu IP
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Renovación automática
sudo certbot renew --dry-run
```

Si no tienes dominio, puedes usar IP directamente (sin HTTPS).

## 🔄 PASO 9: Actualizar el Panel Web

Cuando hagas cambios en el código:

```bash
# 1. En tu PC, rebuild
cd "d:\Programacion Fuera de la U\AppWino\WebPanel"
npm run build

# 2. Transferir archivos actualizados
scp -i "..\edmil-key.pem" -r dist/* ubuntu@18.220.8.226:/var/www/sistema-haccp/

# 3. Limpiar caché de Nginx (opcional)
ssh -i "..\edmil-key.pem" ubuntu@18.220.8.226 "sudo systemctl reload nginx"
```

## 📊 PASO 10: Monitorear

```bash
# Ver logs de Nginx
sudo tail -f /var/log/nginx/sistema-haccp/access.log

# Ver logs del backend
pm2 logs wino-backend

# Monitorear recursos del servidor
htop
```

## 🐛 Troubleshooting

### Error 502 Bad Gateway

```bash
# Verificar que el backend está corriendo
pm2 status

# Reiniciar backend si es necesario
pm2 restart wino-backend

# Verificar logs
pm2 logs wino-backend
```

### Error 404 Not Found

```bash
# Verificar que los archivos están en la carpeta correcta
ls -la /var/www/sistema-haccp

# Verificar permisos
sudo chown -R ubuntu:ubuntu /var/www/sistema-haccp
sudo chmod -R 755 /var/www/sistema-haccp
```

### CORS Errors

```bash
# Asegúrate de que el backend tiene CORS configurado
# Editar server.js y añadir:
const cors = require('cors');
app.use(cors({
  origin: ['http://18.220.8.226', 'http://localhost:5173'],
  credentials: true
}));

# Reiniciar backend
pm2 restart wino-backend
```

### Panel no carga, pantalla en blanco

```bash
# Ver errores en consola del navegador (F12)
# Verificar que las rutas en index.html son correctas

# Limpiar caché del navegador
# Ctrl + Shift + Delete → Clear cache
```

## 📝 Comandos Útiles

```bash
# Nginx
sudo systemctl start nginx      # Iniciar
sudo systemctl stop nginx       # Detener
sudo systemctl restart nginx    # Reiniciar
sudo systemctl reload nginx     # Recargar config
sudo nginx -t                   # Verificar config

# PM2
pm2 list                        # Listar procesos
pm2 restart wino-backend        # Reiniciar backend
pm2 logs wino-backend           # Ver logs
pm2 monit                       # Monitor en tiempo real

# Sistema
df -h                           # Espacio en disco
free -h                         # Memoria RAM
htop                            # Monitor de procesos
```

## ✅ Checklist Final

- [ ] Nginx instalado y corriendo
- [ ] Archivos del panel transferidos a `/var/www/sistema-haccp`
- [ ] Configuración de Nginx creada y symlinkeada
- [ ] Firewall configurado (puerto 80 abierto)
- [ ] Backend PM2 corriendo
- [ ] Panel accesible desde `http://18.220.8.226`
- [ ] Login funciona correctamente
- [ ] API responde correctamente (Dashboard carga datos)
- [ ] Logs de Nginx sin errores críticos

## 🎉 ¡Listo!

Tu panel web debería estar funcionando en:
**http://18.220.8.226**

Credenciales:
- Email: `admin@hotel.com`
- Password: `admin123`
