
// ===================================================
// SERVIDOR DE CORREOS PARA KUENI KUENI
// Envía correos usando API de Brevo (NO SMTP)
// ===================================================

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ===================================================
// CONFIGURACIÓN DE SUPABASE
// ===================================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ===================================================
// CONFIGURACIÓN DE BREVO API
// ===================================================
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_USER; // 9cfd8c001@smtp-brevo.com

// Función para enviar correos usando API de Brevo
async function enviarCorreoBrevo(destinatario, asunto, contenidoHTML) {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: 'Kueni Kueni',
                    email: BREVO_SENDER_EMAIL
                },
                to: [
                    {
                        email: destinatario
                    }
                ],
                subject: asunto,
                htmlContent: contenidoHTML
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Correo enviado exitosamente:', data.messageId);
            return { success: true, messageId: data.messageId };
        } else {
            console.error('Error de Brevo:', data);
            return { success: false, error: data };
        }
    } catch (error) {
        console.error('Error al llamar API de Brevo:', error);
        return { success: false, error: error.message };
    }
}

// Verificación al iniciar
console.log('Servidor configurado con Brevo API (HTTP)');
console.log('Remitente:', BREVO_SENDER_EMAIL);

// ===================================================
// RUTA DE SALUD DEL SERVIDOR
// ===================================================
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Servidor de correos Kueni Kueni funcionando con Brevo API',
        timestamp: new Date().toISOString()
    });
});

// ===================================================
// ENVIAR CORREO DE RECUPERACIÓN DE CONTRASEÑA
// ===================================================
app.post('/send-recovery-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'El correo electrónico es requerido'
            });
        }

        console.log('Solicitud de recuperación para:', email);

        // Buscar usuario en Supabase
        const { data: usuario, error: dbError } = await supabase
            .from('usuarios')
            .select('id, email, nombre_completo, password_hash')
            .eq('email', email)
            .eq('estado', 'activo')
            .single();

        if (dbError || !usuario) {
            console.log(' Usuario no encontrado:', email);
            return res.status(404).json({
                error: 'No existe una cuenta con este correo electrónico'
            });
        }

        console.log(' Usuario encontrado:', usuario.nombre_completo);

        // Contenido HTML del correo
        const contenidoHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    .container {
                        background: white;
                        border-radius: 12px;
                        padding: 40px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 48px;
                        margin-bottom: 10px;
                    }
                    h1 {
                        color: #5f0d51;
                        font-size: 24px;
                        margin: 0 0 10px 0;
                    }
                    .subtitle {
                        color: #6b7280;
                        font-size: 14px;
                    }
                    .content {
                        margin: 30px 0;
                    }
                    .password-box {
                        background: #fef3f8;
                        border: 2px solid #5f0d51;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 20px 0;
                    }
                    .password-label {
                        color: #6b7280;
                        font-size: 14px;
                        margin-bottom: 10px;
                    }
                    .password {
                        font-size: 24px;
                        font-weight: 700;
                        color: #5f0d51;
                        font-family: 'Courier New', monospace;
                        letter-spacing: 2px;
                    }
                    .warning {
                        background: #fef3c7;
                        border-left: 4px solid #f59e0b;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .warning-title {
                        color: #92400e;
                        font-weight: 600;
                        margin-bottom: 5px;
                    }
                    .warning-text {
                        color: #78350f;
                        font-size: 14px;
                    }
                    .button {
                        display: inline-block;
                        background: #5f0d51;
                        color: white;
                        text-decoration: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        font-weight: 600;
                        margin: 20px 0;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        text-align: center;
                        color: #6b7280;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">💜</div>
                        <h1>Kueni Kueni</h1>
                        <p class="subtitle">Recuperación de Contraseña</p>
                    </div>
                    
                    <div class="content">
                        <p>Hola <strong>${usuario.nombre_completo}</strong>,</p>
                        <p>Recibimos una solicitud para recuperar tu contraseña. Aquí está tu contraseña actual:</p>
                        
                        <div class="password-box">
                            <div class="password-label">Tu contraseña es:</div>
                            <div class="password">${usuario.password_hash}</div>
                        </div>
                        
                        <div class="warning">
                            <div class="warning-title">⚠️ Importante por seguridad</div>
                            <div class="warning-text">
                                Te recomendamos cambiar tu contraseña inmediatamente después de iniciar sesión.
                                Nunca compartas tu contraseña con nadie.
                            </div>
                        </div>
                        
                        <center>
                            <a href="${process.env.FRONTEND_URL || 'http://localhost'}/login.html" class="button">Iniciar Sesión</a>
                        </center>
                        
                        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                            Si no solicitaste este correo, puedes ignorarlo de forma segura.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p><strong>Kueni Kueni</strong></p>
                        <p>Asociación Civil sin fines de lucro</p>
                        <p>Abasolo 27, Barrio las Flores<br>Asunción Nochixtlán, Oaxaca</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Enviar el correo usando API de Brevo
        console.log(' Enviando correo vía API de Brevo...');
        const resultado = await enviarCorreoBrevo(
            usuario.email,
            'Recuperación de Contraseña - Kueni Kueni',
            contenidoHTML
        );

        if (resultado.success) {
            res.json({
                success: true,
                message: 'Correo de recuperación enviado exitosamente',
                email: usuario.email
            });
        } else {
            res.status(500).json({
                error: 'Error al enviar el correo',
                details: resultado.error
            });
        }

    } catch (error) {
        console.error('Error general:', error);
        res.status(500).json({
            error: 'Error al procesar la solicitud',
            details: error.message
        });
    }
});

// ===================================================
// ENVIAR CORREO DE BIENVENIDA
// ===================================================
app.post('/send-welcome-email', async (req, res) => {
    try {
        const { email, nombre } = req.body;

        if (!email || !nombre) {
            return res.status(400).json({
                error: 'Email y nombre son requeridos'
            });
        }

        const contenidoHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        border-radius: 12px;
                        padding: 30px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    h1 { color: #5f0d51; }
                    .button {
                        display: inline-block;
                        background: #5f0d51;
                        color: white;
                        text-decoration: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>¡Bienvenido a Kueni Kueni, ${nombre}!</h1>
                    <p>Estamos muy contentos de que te hayas unido a nuestra comunidad.</p>
                    <p>Ahora puedes acceder a todos nuestros servicios y eventos.</p>
                    <center>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost'}/login.html" class="button">Iniciar Sesión</a>
                    </center>
                </div>
            </body>
            </html>
        `;

        const resultado = await enviarCorreoBrevo(
            email,
            '¡Bienvenido a Kueni Kueni!',
            contenidoHTML
        );

        if (resultado.success) {
            res.json({
                success: true,
                message: 'Correo de bienvenida enviado'
            });
        } else {
            res.status(500).json({
                error: 'Error al enviar correo de bienvenida',
                details: resultado.error
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            error: 'Error al enviar correo de bienvenida',
            details: error.message
        });
    }
});

// ===================================================
// ENVIAR CORREO DE AGRADECIMIENTO AL DONANTE
// ===================================================
app.post('/send-donation-thank-you', async (req, res) => {
    const { email, nombre, monto, moneda, referencia, destino, fecha } = req.body;

    console.log('Solicitud de correo de agradecimiento:', { email, nombre, monto });

    try {
        const contenidoHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: 'Arial', sans-serif; 
                        line-height: 1.6; 
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 20px auto; 
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .header { 
                        background: linear-gradient(135deg, #5f0d51 0%, #8b1a7a 100%);
                        color: white; 
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0 0 10px 0;
                        font-size: 28px;
                    }
                    .header p {
                        margin: 0;
                        opacity: 0.95;
                        font-size: 14px;
                    }
                    .content { 
                        padding: 40px 30px;
                    }
                    .heart-icon {
                        font-size: 48px;
                        text-align: center;
                        margin: 20px 0;
                    }
                    .thank-you {
                        font-size: 24px;
                        color: #5f0d51;
                        text-align: center;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .donation-details {
                        background: #f9f9f9;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 25px 0;
                        border-left: 4px solid #5f0d51;
                    }
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #e5e5e5;
                    }
                    .detail-row:last-child {
                        border-bottom: none;
                    }
                    .detail-label {
                        font-weight: 600;
                        color: #666;
                    }
                    .detail-value {
                        color: #333;
                        font-weight: 500;
                    }
                    .amount-highlight {
                        background: linear-gradient(135deg, #fdf0fb 0%, #f9d1fa 100%);
                        color: #5f0d51;
                        padding: 15px;
                        border-radius: 8px;
                        text-align: center;
                        font-size: 32px;
                        font-weight: bold;
                        margin: 20px 0;
                    }
                    .impact-section {
                        background: #fff8f0;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 25px 0;
                    }
                    .impact-section h3 {
                        color: #5f0d51;
                        margin-top: 0;
                    }
                    .impact-list {
                        list-style: none;
                        padding: 0;
                    }
                    .impact-list li {
                        padding: 8px 0;
                        padding-left: 25px;
                        position: relative;
                    }
                    .impact-list li:before {
                        content: "✓";
                        position: absolute;
                        left: 0;
                        color: #5f0d51;
                        font-weight: bold;
                    }
                    .footer { 
                        background: #f5f5f5;
                        padding: 30px;
                        text-align: center;
                        font-size: 13px;
                        color: #666;
                    }
                    .social-links {
                        margin: 20px 0;
                    }
                    .social-links a {
                        display: inline-block;
                        margin: 0 10px;
                        color: #5f0d51;
                        text-decoration: none;
                    }
                    .button {
                        display: inline-block;
                        background: #5f0d51;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 6px;
                        margin: 20px 0;
                        font-weight: 600;

                        
                    .logo-icon-circle {
                        width: 56px;
                        height: 56px;
                        background: linear-gradient(135deg, #5f0d51 0%, #4d094d 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 12px rgba(95, 13, 81, 0.3);
                    }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Kueni Kueni</h1>
                        <p>Paso a Paso</p>
                    </div>
                    
                    <div class="content">
                        <div class="heart-icon">
                        
                        <div class="logo-icon-circle">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white"/>
                        </svg>
                         </div>
                        
                        </div>
                        
                        <div class="thank-you">
                            ¡Gracias por tu generosidad, ${nombre}!
                        </div>
                        
                        <p style="text-align: center; color: #666; font-size: 16px;">
                            Tu donación nos ayuda a seguir trabajando por nuestra comunidad
                        </p>
                        
                        <div class="amount-highlight">
                            $${monto.toLocaleString('es-MX')} ${moneda}
                        </div>
                        
                        <div class="donation-details">
                            <h3 style="margin-top: 0; color: #5f0d51;">Detalles de tu donación</h3>
                            <div class="detail-row">
                                <span class="detail-label">Referencia:</span>
                                <span class="detail-value">${referencia}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Fecha:</span>
                                <span class="detail-value">${fecha}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Destino:</span>
                                <span class="detail-value">${destino}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Estado:</span>
                                <span class="detail-value" style="color: #22c55e;">✓ Completado</span>
                            </div>
                        </div>
                        
                        <div class="impact-section">
                            <h3>Tu impacto en la comunidad</h3>
                            <p>Con tu donación estás apoyando:</p>
                            <ul class="impact-list">
                                <li> ✓ Programas de desarrollo comunitario</li>
                                <li> ✓ Apoyo a familias vulnerables</li>
                                <li> ✓ Preservación de tradiciones culturales</li>
                                <li> ✓ Iniciativas de desarrollo sostenible</li>
                            </ul>
                        </div>
                        
                        <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                            Guarda este correo como comprobante de tu donación.<br>
                            Si tienes alguna pregunta, contáctanos en:<br>
                            <strong>kuenikueni.contacto@gmail.com</strong>
                        </p>
                    </div>
                    
                    <div class="footer">
                        <div class="social-links">
                            <a href="https://www.facebook.com/cuenicuenicolectivo">Facebook</a>
                            <a href="https://www.instagram.com/kueni.kuenicolectivo">Instagram</a>
                        </div>
                        <p>
                            Kueni Kueni - Asociación Civil<br>
                            Abasolo 27, Barrio las Flores<br>
                            Asunción Nochixtlán, Oaxaca, México
                        </p>
                        <p style="margin-top: 15px; font-size: 12px; color: #999;">
                            © 2025 Kueni Kueni. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // USAR LA FUNCIÓN enviarCorreoBrevo() QUE YA TIENES
        const resultado = await enviarCorreoBrevo(
            email,
            '¡Gracias por tu donación! - Kueni Kueni',
            contenidoHTML
        );

        if (resultado.success) {
            console.log(`Correo de agradecimiento enviado a: ${email}`);
            res.json({
                success: true,
                message: 'Correo de agradecimiento enviado',
                messageId: resultado.messageId
            });
        } else {
            console.error('Error al enviar correo:', resultado.error);
            res.status(500).json({
                success: false,
                error: 'Error al enviar correo de agradecimiento',
                details: resultado.error
            });
        }

    } catch (error) {
        console.error('Error al procesar correo de agradecimiento:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===================================================
// ENVIAR NOTIFICACIÓN AL ADMINISTRADOR
// ===================================================
app.post('/send-donation-notification', async (req, res) => {
    const {
        donante_nombre,
        donante_email,
        donante_telefono,
        monto,
        moneda,
        referencia,
        destino,
        fecha,
        metodo_pago,
        mensaje
    } = req.body;

    console.log('Solicitud de notificación al administrador:', { donante_nombre, monto });

    try {
        const contenidoHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: 'Arial', sans-serif; 
                        line-height: 1.6; 
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 20px auto; 
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .header { 
                        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                        color: white; 
                        padding: 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                    }
                    .content { 
                        padding: 30px;
                    }
                    .alert-box {
                        background: #f0fdf4;
                        border-left: 4px solid #22c55e;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .amount-box {
                        background: linear-gradient(135deg, #fdf0fb 0%, #f9d1fa 100%);
                        color: #5f0d51;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        font-size: 36px;
                        font-weight: bold;
                        margin: 20px 0;
                    }
                    .info-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    .info-table td {
                        padding: 12px;
                        border-bottom: 1px solid #e5e5e5;
                    }
                    .info-table td:first-child {
                        font-weight: 600;
                        color: #666;
                        width: 40%;
                    }
                    .info-table tr:last-child td {
                        border-bottom: none;
                    }
                    .message-box {
                        background: #fff8f0;
                        border-radius: 8px;
                        padding: 15px;
                        margin: 20px 0;
                    }
                    .footer {
                        background: #f5f5f5;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Nueva Donación Recibida</h1>
                    </div>
                    
                    <div class="content">
                        <div class="alert-box">
                            <strong>¡Atención!</strong> Se ha registrado una nueva donación en el sistema.
                        </div>
                        
                        <div class="amount-box">
                            $${monto.toLocaleString('es-MX')} ${moneda}
                        </div>
                        
                        <h3 style="color: #5f0d51; border-bottom: 2px solid #5f0d51; padding-bottom: 10px;">
                            Información del Donante
                        </h3>
                        <table class="info-table">
                            <tr>
                                <td>Nombre:</td>
                                <td><strong>${donante_nombre}</strong></td>
                            </tr>
                            <tr>
                                <td>Email:</td>
                                <td>${donante_email}</td>
                            </tr>
                            ${donante_telefono ? `
                            <tr>
                                <td>Teléfono:</td>
                                <td>${donante_telefono}</td>
                            </tr>
                            ` : ''}
                        </table>
                        
                        <h3 style="color: #5f0d51; border-bottom: 2px solid #5f0d51; padding-bottom: 10px; margin-top: 30px;">
                            Detalles de la Donación
                        </h3>
                        <table class="info-table">
                            <tr>
                                <td>Referencia:</td>
                                <td><strong>${referencia}</strong></td>
                            </tr>
                            <tr>
                                <td>Fecha:</td>
                                <td>${fecha}</td>
                            </tr>
                            <tr>
                                <td>Monto:</td>
                                <td><strong>$${monto.toLocaleString('es-MX')} ${moneda}</strong></td>
                            </tr>
                            <tr>
                                <td>Destino:</td>
                                <td>${destino}</td>
                            </tr>
                            <tr>
                                <td>Método de Pago:</td>
                                <td>${metodo_pago === 'tarjeta' ? 'Tarjeta de Crédito/Débito' : metodo_pago}</td>
                            </tr>
                            <tr>
                                <td>Estado:</td>
                                <td><span style="color: #22c55e; font-weight: bold;">✓ Completado</span></td>
                            </tr>
                        </table>
                        
                        ${mensaje ? `
                        <h3 style="color: #5f0d51; border-bottom: 2px solid #5f0d51; padding-bottom: 10px; margin-top: 30px;">
                            Mensaje del Donante
                        </h3>
                        <div class="message-box">
                            <p style="margin: 0; font-style: italic;">"${mensaje}"</p>
                        </div>
                        ` : ''}
                        
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 30px;">
                            <p style="margin: 0; font-size: 14px; color: #666;">
                                <strong>Nota:</strong> El donante recibirá automáticamente un correo de agradecimiento 
                                con el comprobante de su donación.
                            </p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Este es un correo automático del sistema de donaciones de Kueni Kueni</p>
                        <p>© 2025 Kueni Kueni. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Correo del administrador
        const adminEmail = 'kuenikueni.contacto@gmail.com';

        // USAR LA FUNCIÓN enviarCorreoBrevo() QUE YA TIENES
        const resultado = await enviarCorreoBrevo(
            adminEmail,
            `Nueva Donación Recibida - $${monto.toLocaleString('es-MX')} ${moneda}`,
            contenidoHTML
        );

        if (resultado.success) {
            console.log(`Notificación enviada al administrador: ${adminEmail}`);
            res.json({
                success: true,
                message: 'Notificación enviada al administrador',
                messageId: resultado.messageId
            });
        } else {
            console.error('Error al enviar notificación:', resultado.error);
            res.status(500).json({
                success: false,
                error: 'Error al enviar notificación',
                details: resultado.error
            });
        }

    } catch (error) {
        console.error('Error al procesar notificación:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});



// ===================================================
// INICIAR SERVIDOR
// ===================================================
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║  🚀 SERVIDOR DE CORREOS ACTIVO       ║
    ║  📧 Puerto: ${PORT}                      ║
    ║  💜 Kueni Kueni Email Service        ║
    ║  📮 Usando: Brevo API (HTTP)         ║
    ╚═══════════════════════════════════════╝
    `);
});
