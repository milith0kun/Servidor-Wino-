const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar datos de entrada
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario en la base de datos
        db.get(
            'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
            [email],
            async (err, user) => {
                if (err) {
                    console.error('Error en login:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Error interno del servidor'
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        error: 'Credenciales inválidas',
                        message: 'Email o contraseña incorrectos'
                    });
                }

                try {
                    // Verificar contraseña
                    const passwordMatch = await bcrypt.compare(password, user.password);
                    
                    if (!passwordMatch) {
                        return res.status(401).json({
                            success: false,
                            error: 'Credenciales inválidas',
                            message: 'Email o contraseña incorrectos'
                        });
                    }

                    // Generar token JWT
                    const token = jwt.sign(
                        {
                            id: user.id,
                            email: user.email,
                            rol: user.rol
                        },
                        process.env.JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    // Respuesta exitosa
                    res.json({
                        success: true,
                        message: 'Login exitoso',
                        token,
                        user: {
                            id: user.id,
                            nombre: user.nombre,
                            email: user.email,
                            rol: user.rol
                        }
                    });

                } catch (bcryptError) {
                    console.error('Error verificando contraseña:', bcryptError);
                    return res.status(500).json({
                        success: false,
                        error: 'Error interno del servidor'
                    });
                }
            }
        );

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/auth/verify - Verificar token
router.get('/verify', authenticateToken, (req, res) => {
    // Si llegamos aquí, el token es válido (verificado por el middleware)
    res.json({
        success: true,
        message: 'Token válido',
        user: {
            id: req.user.id,
            nombre: req.user.nombre,
            email: req.user.email,
            rol: req.user.rol
        }
    });
});

// POST /api/auth/refresh - Renovar token (opcional)
router.post('/refresh', authenticateToken, (req, res) => {
    try {
        // Generar nuevo token
        const newToken = jwt.sign(
            {
                id: req.user.id,
                email: req.user.email,
                rol: req.user.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Token renovado',
            token: newToken,
            user: {
                id: req.user.id,
                nombre: req.user.nombre,
                email: req.user.email,
                rol: req.user.rol
            }
        });

    } catch (error) {
        console.error('Error renovando token:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// POST /api/auth/logout - Cerrar sesión (opcional, principalmente para logs)
router.post('/logout', authenticateToken, (req, res) => {
    // En JWT no hay logout real del lado del servidor
    // Esto es principalmente para logging
    console.log(`Usuario ${req.user.email} cerró sesión`);
    
    res.json({
        success: true,
        message: 'Sesión cerrada correctamente'
    });
});

module.exports = router;