# 📧 Sistema de Correos - Kueni Kueni

## ✅ Estado Actual

El servidor de correos está **funcionando correctamente** usando **Brevo API**.

**URL del servidor:** https://kuenikueniapp17-11-2-0.onrender.com

---

## 🚀 Configuración del Servidor de Correos

### Tecnologías Usadas

- **Plataforma:** Render.com (plan gratuito)
- **Servicio de correos:** Brevo (antes Sendinblue)
- **Método:** API HTTP (puerto 443)
- **Base de datos:** Supabase

### Por qué usamos Brevo API y no SMTP

Render bloquea conexiones SMTP (puertos 587 y 465) en el plan gratuito. Por eso usamos la API HTTP de Brevo que funciona perfectamente.

---

## 🔧 Configuración para Desarrollo Local

### 1. Instalar dependencias

```bash
cd email-server
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `email-server/` con:

```env
PORT=3000
BREVO_USER=kuenikueni.contacto@gmail.com
BREVO_API_KEY=xkeysib-[TU-API-KEY]
SUPABASE_URL=https://yceoopbgzmzjtyzbozst.supabase.co
SUPABASE_ANON_KEY=[TU-SUPABASE-KEY]
FRONTEND_URL=http://localhost:5500
```

**IMPORTANTE:** Pide las credenciales al equipo. NO las subas a GitHub.

### 3. Iniciar el servidor

```bash
node email-server.js
```

El servidor estará disponible en: `http://localhost:3000`

---

## 🌐 Configuración en Producción (Render)

### Variables de Entorno Necesarias

En Render → Environment, configurar:

| Variable | Valor |
|----------|-------|
| `PORT` | 3000 |
| `BREVO_USER` | kuenikueni.contacto@gmail.com |
| `BREVO_API_KEY` | [Pedir al equipo] |
| `SUPABASE_URL` | https://yceoopbgzmzjtyzbozst.supabase.co |
| `SUPABASE_ANON_KEY` | [Pedir al equipo] |
| `FRONTEND_URL` | https://kuenikueni.netlify.app |

### Comandos de Deploy

Render detecta cambios automáticamente cuando haces push a `main`:

```bash
git add .
git commit -m "Descripción del cambio"
git push origin main
```

Render redesplegará en 2-3 minutos.

---

## 📨 Endpoints Disponibles

### 1. Recuperación de Contraseña

**POST** `/send-recovery-email`

```json
{
  "email": "usuario@example.com"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Correo de recuperación enviado exitosamente",
  "email": "usuario@example.com"
}
```

### 2. Correo de Bienvenida

**POST** `/send-welcome-email`

```json
{
  "email": "usuario@example.com",
  "nombre": "Juan Pérez"
}
```

### 3. Comprobante de Donación

**POST** `/send-donation-receipt`

```json
{
  "email": "donante@example.com",
  "nombre": "María González",
  "monto": 500,
  "fecha": "2025-12-01",
  "folio": "DON-12345",
  "metodo_pago": "Tarjeta"
}
```

### 4. Confirmación de Evento

**POST** `/send-event-confirmation`

```json
{
  "email": "participante@example.com",
  "nombre": "Pedro López",
  "evento_nombre": "Abrigatón 2025",
  "evento_fecha": "15 de Enero 2025",
  "evento_lugar": "Plaza Principal"
}
```

---

## 🧪 Probar el Servidor

### En Desarrollo Local

```bash
# Usando curl
curl -X POST http://localhost:3000/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","nombre":"Test User"}'
```

### En Producción

```bash
curl -X POST https://kuenikueniapp17-11-2-0.onrender.com/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","nombre":"Test User"}'
```

---

## 🔐 Seguridad

### Credenciales

- ✅ El archivo `.env` está en `.gitignore` (nunca se sube a GitHub)
- ✅ Las API Keys se configuran como variables de entorno en Render
- ✅ Las credenciales se comparten solo por canales seguros (no por commits)

### Obtener Credenciales

Si necesitas las credenciales de Brevo o Supabase:

1. Contacta al líder del proyecto
2. O revisa el dashboard de Render si tienes acceso

---

## 🐛 Solución de Problemas

### El servidor no envía correos

1. **Verifica las variables de entorno en Render**
   - Todas deben estar configuradas
   - La API Key debe ser válida

2. **Revisa los logs en Render**
   ```
   Dashboard → Tu servicio → Logs
   ```

3. **Verifica el email remitente en Brevo**
   - Debe estar verificado en Brevo
   - Ve a: Brevo → Senders & IP

### Error: "sender is not valid"

El email remitente no está verificado en Brevo:

1. Ve a https://app.brevo.com
2. Senders & IP → Add sender
3. Verifica el email que quieres usar

### Cambios no se reflejan en Render

1. Verifica que el push se hizo correctamente:
   ```bash
   git log --oneline -n 5
   ```

2. Verifica en GitHub que el código está actualizado

3. Fuerza un redespliegue manual en Render:
   - Dashboard → Manual Deploy → Clear build cache & deploy

---

## 📚 Recursos

- **Render Docs:** https://render.com/docs
- **Brevo API Docs:** https://developers.brevo.com/
- **Supabase Docs:** https://supabase.com/docs

---

## 👥 Equipo

Si tienes dudas o problemas, contacta al equipo del proyecto.

---

## 📝 Historial de Cambios

### 2025-12-01
- ✅ Implementado sistema de correos con Brevo API
- ✅ Servidor desplegado en Render
- ✅ 4 endpoints funcionando: recuperación, bienvenida, donaciones, eventos
- ✅ Email remitente verificado: kuenikueni.contacto@gmail.com

---

**Última actualización:** 01 de Diciembre, 2025
