// supabase/functions/send-recovery-email/index.ts
// Esta es una Supabase Edge Function que envía emails de recuperación

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar OPTIONS request (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtener email del body
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email es requerido' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Conectar a Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Buscar usuario
    const { data: usuario, error: dbError } = await supabaseClient
      .from('usuarios')
      .select('id, email, nombre_completo, password_hash')
      .eq('email', email)
      .eq('estado', 'activo')
      .single()

    if (dbError || !usuario) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Enviar email con Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Kueni Kueni <onboarding@resend.dev>', // Cambiar por tu dominio verificado
        to: [usuario.email],
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
                font-size: 32px;
                margin-bottom: 10px;
              }
              h1 {
                color: #0d5f3a;
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
                background: #f3f4f6;
                border: 2px dashed #0d5f3a;
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
                color: #0d5f3a;
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
                background: #0d5f3a;
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
                <div class="logo"></div>
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
                  <div class="warning-title">Importante por seguridad</div>
                  <div class="warning-text">
                    Te recomendamos cambiar tu contraseña inmediatamente después de iniciar sesión.
                    Nunca compartas tu contraseña con nadie.
                  </div>
                </div>
                
                <center>
                  <a href="https://tusitio.com/login.html" class="button">Iniciar Sesión</a>
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
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Error de Resend:', data)
      return new Response(
        JSON.stringify({ error: 'Error al enviar email' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email enviado exitosamente',
        email: usuario.email
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})