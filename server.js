/**
 * Sistema de Login Profesional
 * Servidor principal con Express
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Importar rutas
const authRoutes = require('./routes/auth.routes');

// Crear aplicación Express
const app = express();

// Configuración de rate limiting para prevenir ataques de fuerza bruta
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 peticiones por ventana
    message: {
        success: false,
        message: 'Demasiadas peticiones desde esta IP, intente nuevamente en 15 minutos'
    }
});

// Rate limiting más estricto para autenticación
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // Máximo 10 intentos por hora
    message: {
        success: false,
        message: 'Demasiados intentos de autenticación, intente nuevamente en 1 hora'
    }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API
app.use('/api/auth', authLimiter, authRoutes);

// Ruta principal - servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para verificación de cuenta
app.get('/verificar', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verificar.html'));
});

// Ruta para el dashboard (después del login)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 SISTEMA DE LOGIN PROFESIONAL                          ║
║                                                            ║
║   Servidor corriendo en: http://localhost:${PORT}            ║
║                                                            ║
║   Endpoints disponibles:                                   ║
║   • POST /api/auth/register - Registrar usuario            ║
║   • POST /api/auth/verify   - Verificar cuenta             ║
║   • POST /api/auth/login    - Iniciar sesión               ║
║   • POST /api/auth/resend   - Reenviar código              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
