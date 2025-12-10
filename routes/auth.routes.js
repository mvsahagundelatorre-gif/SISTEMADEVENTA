/**
 * Rutas de Autenticación
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Registro de usuario
router.post('/register', authController.register);

// Verificar cuenta con código
router.post('/verify', authController.verifyAccount);

// Reenviar código de verificación
router.post('/resend', authController.resendCode);

// Iniciar sesión
router.post('/login', authController.login);

// Verificar token
router.get('/verify-token', authController.verifyToken);

module.exports = router;
