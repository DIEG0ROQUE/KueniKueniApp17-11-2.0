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
            console.log('✅ Correo enviado exitosamente:', data.messageId);
            return { success: true, messageId: data.messageId };
        } else {
            console.error('❌ Error de Brevo:', data);
            return { success: false, error: data };
        }
    } catch (error) {
        console.error('❌ Error al llamar API de Brevo:', error);
        return { success: false, error: error.message };
    }
}

// Verificación al iniciar
console.log('✅ Servidor configurado con Brevo API (HTTP)');
console.log('📧 Remitente:', BREVO_SENDER_EMAIL);

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
        console.log('📤 Enviando correo vía API de Brevo...');
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
        console.error('❌ Error general:', error);
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
