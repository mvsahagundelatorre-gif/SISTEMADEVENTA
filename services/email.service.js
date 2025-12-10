/**
 * Servicio de Email
 * Maneja el envío de correos electrónicos para verificación
 */

const nodemailer = require('nodemailer');

// Configuración del transporter de email
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

/**
 * Generar código de verificación de 6 dígitos
 */
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Enviar correo de verificación
 */
const sendVerificationEmail = async (email, nombre, code) => {
    const transporter = createTransporter();
    const appName = process.env.APP_NAME || 'Sistema de Venta';

    const mailOptions = {
        from: `"${appName}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🔐 Código de Verificación - ${appName}`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                            <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 40px;">🔐</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Verificación de Cuenta</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">${appName}</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333; font-size: 18px; margin: 0 0 10px;">¡Hola <strong>${nombre}</strong>! 👋</p>
                            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Gracias por registrarte. Para completar tu registro y activar tu cuenta,
                                ingresa el siguiente código de verificación:
                            </p>

                            <!-- Verification Code Box -->
                            <div style="background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px;">
                                <p style="color: #888; font-size: 14px; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 2px;">Tu código de verificación</p>
                                <div style="background: #ffffff; border-radius: 10px; padding: 20px 30px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                                    <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${code}</span>
                                </div>
                                <p style="color: #999; font-size: 13px; margin: 15px 0 0;">
                                    ⏰ Este código expira en <strong>15 minutos</strong>
                                </p>
                            </div>

                            <!-- Warning -->
                            <div style="background: #fff8e6; border-left: 4px solid #ffc107; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 0 0 30px;">
                                <p style="color: #856404; font-size: 14px; margin: 0;">
                                    <strong>⚠️ Importante:</strong> Si no solicitaste este código, puedes ignorar este correo de manera segura.
                                </p>
                            </div>

                            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
                                Si tienes alguna pregunta, no dudes en contactarnos.<br>
                                ¡Gracias por unirte a nosotros!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9fa; padding: 30px 40px; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="color: #888; font-size: 13px; margin: 0 0 10px;">
                                Este correo fue enviado automáticamente por ${appName}
                            </p>
                            <p style="color: #aaa; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} ${appName}. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Correo de verificación enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error al enviar correo:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Enviar correo de bienvenida después de verificación
 */
const sendWelcomeEmail = async (email, nombre) => {
    const transporter = createTransporter();
    const appName = process.env.APP_NAME || 'Sistema de Venta';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    const mailOptions = {
        from: `"${appName}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🎉 ¡Bienvenido a ${appName}!`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                            <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">¡Cuenta Verificada!</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333; font-size: 18px; margin: 0 0 20px;">¡Hola <strong>${nombre}</strong>! 🎊</p>
                            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Tu cuenta ha sido verificada exitosamente. Ahora puedes acceder a todas las
                                funcionalidades de ${appName}.
                            </p>

                            <!-- Success Box -->
                            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 30px;">
                                <span style="font-size: 50px; display: block; margin-bottom: 15px;">✅</span>
                                <p style="color: #2e7d32; font-size: 16px; margin: 0; font-weight: 600;">
                                    Tu cuenta está activa y lista para usar
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    Iniciar Sesión
                                </a>
                            </div>

                            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                                ¡Gracias por unirte a ${appName}!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9fa; padding: 30px 40px; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="color: #aaa; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} ${appName}. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Correo de bienvenida enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error al enviar correo de bienvenida:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateVerificationCode,
    sendVerificationEmail,
    sendWelcomeEmail
};
