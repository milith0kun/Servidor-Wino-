# ========================================
# Script de Deploy Automático
# Sistema HACCP - Panel Web
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY DEL PANEL WEB AL SERVIDOR AWS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$SERVER_IP = "18.220.8.226"
$SERVER_USER = "ubuntu"
$KEY_PATH = "..\edmil-key.pem"
$REMOTE_PATH = "/var/www/sistema-haccp"
$LOCAL_DIST = "dist"

Write-Host "► Verificando build..." -ForegroundColor Yellow
if (-Not (Test-Path $LOCAL_DIST)) {
    Write-Host "✗ Error: No existe la carpeta 'dist'" -ForegroundColor Red
    Write-Host "  Ejecuta primero: npm run build" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build encontrado" -ForegroundColor Green
Write-Host ""

Write-Host "► Verificando conexión SSH..." -ForegroundColor Yellow
$testConnection = ssh -i $KEY_PATH -o ConnectTimeout=5 $SERVER_USER@$SERVER_IP "echo 'OK'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error: No se puede conectar al servidor" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Conexión SSH exitosa" -ForegroundColor Green
Write-Host ""

Write-Host "► Creando directorio en servidor..." -ForegroundColor Yellow
ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP "sudo mkdir -p $REMOTE_PATH && sudo chown -R ubuntu:ubuntu $REMOTE_PATH"

Write-Host "✓ Directorio creado" -ForegroundColor Green
Write-Host ""

Write-Host "► Transferiendo archivos..." -ForegroundColor Yellow
Write-Host "  Origen: $LOCAL_DIST" -ForegroundColor Gray
Write-Host "  Destino: ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}" -ForegroundColor Gray

scp -i $KEY_PATH -r "${LOCAL_DIST}/*" "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error: Fallo al transferir archivos" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Archivos transferidos exitosamente" -ForegroundColor Green
Write-Host ""

Write-Host "► Verificando archivos en servidor..." -ForegroundColor Yellow
ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP "ls -lh $REMOTE_PATH"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ DEPLOY COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Accede al panel en: http://$SERVER_IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "1. Configurar Nginx (ver DEPLOY.md)" -ForegroundColor White
Write-Host "2. Abrir puerto 80 en AWS Security Group" -ForegroundColor White
Write-Host "3. Verificar que el backend este corriendo" -ForegroundColor White
Write-Host ""
