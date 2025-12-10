/**
 * Controlador de Autenticación
 * Maneja registro, verificación y login de usuarios
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const emailService = require('../services/email.service');

// Almacenamiento temporal de códigos de verificación
const verificationCodes = new Map();

/**
 * Registrar nuevo usuario
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        // Validaciones básicas
        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo electrónico no es válido'
            });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = db.findUserByEmail(email);
        if (existingUser) {
            // Si existe pero no está verificado, permitir reenviar código
            if (!existingUser.isVerified) {
                const code = emailService.generateVerificationCode();

                // Guardar código con expiración de 15 minutos
                verificationCodes.set(email.toLowerCase(), {
                    code,
                    expiresAt: Date.now() + 15 * 60 * 1000,
                    userId: existingUser.id
                });

                // Enviar correo con el código
                const emailResult = await emailService.sendVerificationEmail(email, existingUser.nombre, code);

                if (!emailResult.success) {
                    console.log('⚠️ No se pudo enviar el correo, pero el código es:', code);
                }

                return res.status(200).json({
                    success: true,
                    message: 'Usuario ya registrado pero no verificado. Se ha enviado un nuevo código de verificación.',
                    requiresVerification: true,
                    email: email
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Ya existe una cuenta con este correo electrónico'
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario
        const userId = uuidv4();
        const newUser = {
            id: userId,
            nombre: nombre.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            isVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Guardar usuario
        const saved = db.createUser(newUser);
        if (!saved) {
            return res.status(500).json({
                success: false,
                message: 'Error al crear el usuario'
            });
        }

        // Generar código de verificación
        const code = emailService.generateVerificationCode();

        // Guardar código con expiración de 15 minutos
        verificationCodes.set(email.toLowerCase(), {
            code,
            expiresAt: Date.now() + 15 * 60 * 1000,
            userId
        });

        // Enviar correo con el código
        const emailResult = await emailService.sendVerificationEmail(email, nombre, code);

        if (!emailResult.success) {
            // Si falla el envío del correo, mostrar el código en consola (solo desarrollo)
            console.log('⚠️ No se pudo enviar el correo. Código de verificación:', code);
        }

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente. Se ha enviado un código de verificación a tu correo.',
            requiresVerification: true,
            email: email,
            // Solo en desarrollo, mostrar el código si falla el email
            ...(process.env.NODE_ENV === 'development' && !emailResult.success && { devCode: code })
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Verificar cuenta con código
 * POST /api/auth/verify
 */
const verifyAccount = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email y código son requeridos'
            });
        }

        const storedData = verificationCodes.get(email.toLowerCase());

        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'No hay código de verificación pendiente para este correo'
            });
        }

        // Verificar si el código ha expirado
        if (Date.now() > storedData.expiresAt) {
            verificationCodes.delete(email.toLowerCase());
            return res.status(400).json({
                success: false,
                message: 'El código de verificación ha expirado. Solicita uno nuevo.'
            });
        }

        // Verificar el código
        if (storedData.code !== code.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Código de verificación incorrecto'
            });
        }

        // Actualizar usuario como verificado
        const updated = db.updateUser(storedData.userId, {
            isVerified: true,
            verifiedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        if (!updated) {
            return res.status(500).json({
                success: false,
                message: 'Error al verificar la cuenta'
            });
        }

        // Eliminar código usado
        verificationCodes.delete(email.toLowerCase());

        // Obtener usuario actualizado
        const user = db.findUserByEmail(email);

        // Enviar correo de bienvenida
        await emailService.sendWelcomeEmail(email, user.nombre);

        res.status(200).json({
            success: true,
            message: '¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.'
        });

    } catch (error) {
        console.error('Error en verificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Reenviar código de verificación
 * POST /api/auth/resend
 */
const resendCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico es requerido'
            });
        }

        const user = db.findUserByEmail(email);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No existe una cuenta con este correo electrónico'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Esta cuenta ya está verificada'
            });
        }

        // Generar nuevo código
        const code = emailService.generateVerificationCode();

        // Guardar código con expiración de 15 minutos
        verificationCodes.set(email.toLowerCase(), {
            code,
            expiresAt: Date.now() + 15 * 60 * 1000,
            userId: user.id
        });

        // Enviar correo con el código
        const emailResult = await emailService.sendVerificationEmail(email, user.nombre, code);

        if (!emailResult.success) {
            console.log('⚠️ No se pudo enviar el correo. Código:', code);
        }

        res.status(200).json({
            success: true,
            message: 'Se ha enviado un nuevo código de verificación a tu correo.',
            ...(process.env.NODE_ENV === 'development' && !emailResult.success && { devCode: code })
        });

    } catch (error) {
        console.error('Error al reenviar código:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Iniciar sesión
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const user = db.findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar si la cuenta está verificada
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta no está verificada. Por favor, verifica tu correo electrónico.',
                requiresVerification: true,
                email: user.email
            });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                nombre: user.nombre
            },
            process.env.JWT_SECRET || 'default_secret_key_change_in_production',
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h'
            }
        );

        // Actualizar última conexión
        db.updateUser(user.id, {
            lastLogin: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({
            success: true,
            message: '¡Inicio de sesión exitoso!',
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Verificar token JWT
 * GET /api/auth/verify-token
 */
const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'default_secret_key_change_in_production'
        );

        const user = db.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

module.exports = {
    register,
    verifyAccount,
    resendCode,
    login,
    verifyToken
};
