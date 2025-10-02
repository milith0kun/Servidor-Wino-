#!/bin/bash
#
# Script para configurar redirección de puerto 80 a 3000 en AWS
# Esto permite que el servidor Node.js corra en puerto 3000 (sin sudo)
# mientras se accede públicamente por el puerto 80 (HTTP estándar)
#

echo "🔧 Configurando redirección de puerto 80 -> 3000..."

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Por favor ejecuta este script con sudo"
    exit 1
fi

# Habilitar redirección de puertos
echo "📝 Habilitando IP forwarding..."
sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf

# Limpiar reglas anteriores de redirección
echo "🧹 Limpiando reglas anteriores..."
iptables -t nat -D PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000 2>/dev/null || true
iptables -t nat -D OUTPUT -p tcp --dport 80 -j REDIRECT --to-port 3000 2>/dev/null || true

# Agregar nuevas reglas de redirección
echo "➕ Agregando reglas de iptables..."
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
iptables -t nat -A OUTPUT -p tcp -d localhost --dport 80 -j REDIRECT --to-port 3000

# Guardar reglas para que persistan después de reiniciar
echo "💾 Guardando reglas..."
if command -v netfilter-persistent &> /dev/null; then
    netfilter-persistent save
elif command -v iptables-save &> /dev/null; then
    iptables-save > /etc/iptables/rules.v4
fi

# Verificar reglas
echo ""
echo "✅ Reglas aplicadas correctamente!"
echo "📋 Reglas NAT activas:"
iptables -t nat -L PREROUTING -n --line-numbers | grep "dpt:80"
iptables -t nat -L OUTPUT -n --line-numbers | grep "dpt:80"

echo ""
echo "🌐 Configuración completada:"
echo "   - Puerto 80 (externo) -> Puerto 3000 (interno)"
echo "   - El servidor Node.js debe correr en puerto 3000"
echo "   - Los usuarios acceden por http://18.220.8.226 (sin puerto)"
echo ""
echo "🔄 Reinicia el servidor Node.js con: pm2 restart wino-backend"
