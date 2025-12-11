// =====================================================
// CÓDIGO PARA AGREGAR A email-server-brevo.js
// =====================================================
// Copia este código y agrégalo al archivo existente
// email-server-brevo.js (después de las otras rutas)
// =====================================================

// ==========================================
// RUTA: Enviar email de confirmación de evento
// ==========================================
app.post('/send-event-confirmation', async (req, res) => {
  try {
    const {
      email,
      nombre,
      evento_titulo,
      evento_fecha,
      evento_hora,
      evento_ubicacion,
      evento_categoria,
      evento_descripcion
    } = req.body;

    // Validar datos requeridos
    if (!email || !nombre || !evento_titulo) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: email, nombre, evento_titulo'
      });
    }

    console.log(`📧 Enviando email de confirmación de evento a: ${email}`);
    console.log(`   Evento: ${evento_titulo}`);
    console.log(`   Fecha: ${evento_fecha}`);

    // Formatear fecha
    const fecha = new Date(evento_fecha);
    const fechaFormateada = fecha.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Construir HTML del email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          .event-details {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .event-details h2 {
            margin-top: 0;
            color: #667eea;
            font-size: 20px;
          }
          .detail-row {
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            align-items: flex-start;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: bold;
            min-width: 120px;
            color: #667eea;
            flex-shrink: 0;
          }
          .detail-value {
            color: #555;
            flex: 1;
          }
          .description-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
          .description-section strong {
            color: #667eea;
            display: block;
            margin-bottom: 10px;
          }
          .description-section p {
            color: #555;
            margin: 0;
          }
          .next-steps {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
          }
          .next-steps strong {
            color: #856404;
            display: block;
            margin-bottom: 10px;
          }
          .next-steps ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .next-steps li {
            color: #856404;
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            padding: 20px 30px;
            background: #f9f9f9;
            color: #666;
            font-size: 14px;
          }
          .footer strong {
            color: #667eea;
            display: block;
            margin-bottom: 5px;
          }
          .footer .tagline {
            color: #764ba2;
            font-weight: 500;
            margin: 10px 0;
          }
          .footer .disclaimer {
            font-size: 12px;
            color: #999;
            margin-top: 15px;
          }
          @media only screen and (max-width: 600px) {
            .detail-row {
              flex-direction: column;
            }
            .detail-label {
              min-width: auto;
              margin-bottom: 5px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Asistencia Confirmada!</h1>
          </div>
          
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            
            <p>¡Excelente noticia! Tu asistencia al siguiente evento ha sido confirmada exitosamente:</p>
            
            <div class="event-details">
              <h2>${evento_titulo}</h2>
              
              <div class="detail-row">
                <span class="detail-label">📅 Fecha:</span>
                <span class="detail-value">${fechaFormateada}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">🕐 Hora:</span>
                <span class="detail-value">${evento_hora || 'Por confirmar'}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">📍 Ubicación:</span>
                <span class="detail-value">${evento_ubicacion || 'Por confirmar'}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">🏷️ Categoría:</span>
                <span class="detail-value">${evento_categoria || 'General'}</span>
              </div>
              
              ${evento_descripcion ? `
                <div class="description-section">
                  <strong>📋 Descripción del evento:</strong>
                  <p>${evento_descripcion}</p>
                </div>
              ` : ''}
            </div>
            
            <div class="next-steps">
              <strong>¿Qué sigue?</strong>
              <ul>
                <li>Marca la fecha en tu calendario 📅</li>
                <li>Llega 15 minutos antes del evento ⏰</li>
                <li>Trae tu mejor actitud y energía ✨</li>
                <li>¡Prepárate para una gran experiencia! 🎊</li>
              </ul>
            </div>
            
            <p style="margin-top: 25px; color: #555;">
              Si tienes alguna pregunta o necesitas cancelar tu asistencia, 
              por favor contacta con nosotros lo antes posible.
            </p>
            
            <p style="margin-top: 20px; color: #555;">
              ¡Nos vemos pronto! 👋
            </p>
          </div>
          
          <div class="footer">
            <strong>Kueni Kueni</strong>
            <div class="tagline">Construyendo comunidad juntos 💜</div>
            <div class="disclaimer">
              Este es un correo automático, por favor no respondas a este mensaje.
              <br>
              Si deseas más información, visita nuestro sitio web o contáctanos directamente.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email con Brevo
    const sendSmtpEmail = {
      to: [{ 
        email: email, 
        name: nombre 
      }],
      sender: { 
        name: 'Kueni Kueni', 
        email: 'noreply@kueni.org' 
      },
      subject: `¡Confirmación de asistencia! - ${evento_titulo}`,
      htmlContent: htmlContent
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log(`✅ Email de confirmación de evento enviado exitosamente a: ${email}`);

    res.json({
      success: true,
      message: 'Email de confirmación de evento enviado correctamente',
      destinatario: email,
      evento: evento_titulo
    });

  } catch (error) {
    console.error('❌ Error al enviar email de confirmación de evento:', error);
    console.error('Detalles del error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.body
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Error al enviar el email',
      details: error.response?.body || 'No hay detalles adicionales'
    });
  }
});

// =====================================================
// FIN DEL CÓDIGO A AGREGAR
// =====================================================

/*
INSTRUCCIONES:
1. Abre el archivo: email-server-brevo.js
2. Busca el final del archivo (antes de la última línea que inicia el servidor)
3. Pega este código completo ahí
4. Guarda el archivo
5. Reinicia el servidor

EJEMPLO DE UBICACIÓN EN EL ARCHIVO:
...
app.post('/send-reset-password', async (req, res) => {
  // código existente
});

// ⬇️ PEGA EL NUEVO CÓDIGO AQUÍ ⬇️
app.post('/send-event-confirmation', async (req, res) => {
  // ... nuevo código
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de email corriendo en puerto ${PORT}`);
});
*/
