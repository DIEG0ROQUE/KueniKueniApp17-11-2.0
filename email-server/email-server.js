// ===================================================
// SERVIDOR DE CORREOS PARA KUENI KUENI
// Envía correos usando Gmail directamente
// ===================================================

const EMAIL_SERVER_URL = 'http://localhost:3000';


const express = require('express');
const nodemailer = require('nodemailer');
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
// CONFIGURACIÓN DE GMAIL
// ===================================================
// IMPORTANTE: Necesitas crear una "Contraseña de Aplicación" en Gmail
// Instrucciones:
// 1. Ve a tu cuenta de Google
// 2. Seguridad > Verificación en dos pasos (actívala si no está activada)
// 3. Seguridad > Contraseñas de aplicaciones
// 4. Genera una nueva contraseña para "Correo"
// 5. Usa esa contraseña de 16 caracteres en GMAIL_APP_PASSWORD

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // Tu correo de Gmail
        pass: process.env.GMAIL_APP_PASSWORD // Contraseña de aplicación (NO tu contraseña normal)
    }
});

// Verificar conexión con Gmail
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Error al conectar con Gmail:', error);
    } else {
        console.log('✅ Servidor listo para enviar correos desde Gmail');
    }
});

// ===================================================
// RUTA DE SALUD DEL SERVIDOR
// ===================================================
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor de correos Kueni Kueni funcionando',
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

        console.log('📧 Solicitud de recuperación para:', email);

        // Buscar usuario en Supabase
        const { data: usuario, error: dbError } = await supabase
            .from('usuarios')
            .select('id, email, nombre_completo, password_hash')
            .eq('email', email)
            .eq('estado', 'activo')
            .single();

        if (dbError || !usuario) {
            console.log('❌ Usuario no encontrado:', email);
            return res.status(404).json({ 
                error: 'No existe una cuenta con este correo electrónico' 
            });
        }

        console.log('✅ Usuario encontrado:', usuario.nombre_completo);

        // Configurar el correo
        const mailOptions = {
            from: `"Kueni Kueni" <${process.env.GMAIL_USER}>`,
            to: usuario.email,
            subject: 'Recuperación de Contraseña - Kueni Kueni',
            html: `
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
            `
        };

        // Enviar el correo
        console.log('📤 Enviando correo...');
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Correo enviado exitosamente:', info.messageId);

        res.json({ 
            success: true,
            message: 'Correo de recuperación enviado exitosamente',
            email: usuario.email
        });

    } catch (error) {
        console.error('❌ Error al enviar correo:', error);
        res.status(500).json({ 
            error: 'Error al enviar el correo',
            details: error.message 
        });
    }
});

// ===================================================
// ENVIAR CORREO DE BIENVENIDA (OPCIONAL)
// ===================================================
app.post('/send-welcome-email', async (req, res) => {
    try {
        const { email, nombre } = req.body;

        if (!email || !nombre) {
            return res.status(400).json({ 
                error: 'Email y nombre son requeridos' 
            });
        }

        const mailOptions = {
            from: `"Kueni Kueni" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '¡Bienvenido a Kueni Kueni!',
            html: `
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
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Correo de bienvenida enviado:', info.messageId);

        res.json({ 
            success: true,
            message: 'Correo de bienvenida enviado'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            error: 'Error al enviar correo de bienvenida',
            details: error.message 
        });
    }
});

// ===================================================
// INICIAR SERVIDOR
// ===================================================








// =================================================== 
// ENVIAR COMPROBANTE DE DONACIÓN
// ===================================================
app.post('/send-donation-receipt', async (req, res) => {
    try {
        const { email, nombre, monto, fecha, folio, metodo_pago } = req.body;

        if (!email || !nombre || !monto) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }

        const mailOptions = {
            from: `"Kueni Kueni" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '🎁 Comprobante de Donación - Kueni Kueni',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                        .container { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #5f0d51; padding-bottom: 20px; }
                        h1 { color: #5f0d51; margin: 0; }
                        .amount { font-size: 32px; font-weight: 700; color: #5f0d51; text-align: center; margin: 20px 0; }
                        .receipt-box { background: #f9fafb; border: 2px solid #5f0d51; border-radius: 8px; padding: 20px; margin: 20px 0; }
                        .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                        .label { font-weight: 600; color: #6b7280; }
                        .value { color: #1f2937; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div style="font-size: 48px; margin-bottom: 10px;">💜</div>
                            <h1>Kueni Kueni</h1>
                            <p style="color: #6b7280;">Comprobante de Donación</p>
                        </div>
                        <p>Estimado/a <strong>${nombre}</strong>,</p>
                        <p>¡Gracias por tu generosa donación!</p>
                        <div class="amount">$${parseFloat(monto).toFixed(2)} MXN</div>
                        <div class="receipt-box">
                            <div class="receipt-row">
                                <span class="label">Folio:</span>
                                <span class="value">${folio || 'N/A'}</span>
                            </div>
                            <div class="receipt-row">
                                <span class="label">Fecha:</span>
                                <span class="value">${fecha || new Date().toLocaleDateString('es-MX')}</span>
                            </div>
                            <div class="receipt-row">
                                <span class="label">Método:</span>
                                <span class="value">${metodo_pago || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Comprobante enviado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al enviar comprobante' });
    }
});

// ===================================================
// ENVIAR CONFIRMACIÓN DE EVENTO
// ===================================================
app.post('/send-event-confirmation', async (req, res) => {
    try {
        const { email, nombre, evento_nombre, evento_fecha, evento_lugar } = req.body;

        if (!email || !nombre || !evento_nombre) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }

        const mailOptions = {
            from: `"Kueni Kueni" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `✅ Confirmación - ${evento_nombre}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                        .container { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                        .header { text-align: center; background: linear-gradient(135deg, #5f0d51 0%, #7d1068 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; margin: -30px -30px 30px -30px; }
                        h1 { color: white; margin: 0; }
                        .event-box { background: #f9fafb; border-left: 4px solid #5f0d51; padding: 20px; margin: 20px 0; border-radius: 4px; }
                        .event-title { font-size: 24px; font-weight: 700; color: #5f0d51; margin-bottom: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                            <h1>¡Registro Confirmado!</h1>
                        </div>
                        <p>Hola <strong>${nombre}</strong>,</p>
                        <p>¡Gracias por registrarte!</p>
                        <div class="event-box">
                            <div class="event-title">${evento_nombre}</div>
                            <p>📅 Fecha: ${evento_fecha || 'Por confirmar'}</p>
                            <p>📍 Lugar: ${evento_lugar || 'Por confirmar'}</p>
                        </div>
                        <p>¡Nos vemos pronto!</p>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Confirmación enviada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al enviar confirmación' });
    }
});











async function enviarComprobanteDonacion(donacion) {
    try {
        const response = await fetch(`${EMAIL_SERVER_URL}/send-donation-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: donacion.email,
                nombre: donacion.nombre,
                monto: donacion.monto,
                fecha: donacion.fecha || new Date().toLocaleDateString('es-MX'),
                folio: donacion.folio || `DON-${Date.now()}`,
                metodo_pago: donacion.metodo_pago
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Comprobante enviado');
            return true;
        } else {
            console.error('❌ Error:', data.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error al enviar comprobante:', error);
        return false;
    }
}













app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║  🚀 SERVIDOR DE CORREOS ACTIVO       ║
    ║  📧 Puerto: ${PORT}                      ║
    ║  💜 Kueni Kueni Email Service        ║
    ╚═══════════════════════════════════════╝
    `);
});
