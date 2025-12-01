# 📢 IMPORTANTE PARA EL EQUIPO

## ✅ Sistema de Correos Funcionando

El servidor de correos ya está **funcionando en producción** 🎉

**URL:** https://kuenikueniapp17-11-2-0.onrender.com

---

## 🔑 Credenciales Necesarias

Si vas a trabajar en el servidor de correos, necesitas estas credenciales:

### Para Desarrollo Local

Crea un archivo `.env` en `email-server/` con:

```env
PORT=3000
BREVO_USER=kuenikueni.contacto@gmail.com
BREVO_API_KEY=[PEDIR AL EQUIPO]
SUPABASE_URL=https://yceoopbgzmzjtyzbozst.supabase.co
SUPABASE_ANON_KEY=[PEDIR AL EQUIPO]
FRONTEND_URL=http://localhost:5500
```

**⚠️ NUNCA subas el archivo `.env` a GitHub**

---

## 🚀 Cómo Usar el Servidor de Correos

### Desde el Frontend

En tus archivos JavaScript, usa la URL del servidor:

```javascript
// Desarrollo local
const EMAIL_SERVER_URL = 'http://localhost:3000';

// Producción
const EMAIL_SERVER_URL = 'https://kuenikueniapp17-11-2-0.onrender.com';
```

### Ejemplo: Enviar Correo de Bienvenida

```javascript
async function enviarBienvenida(email, nombre) {
    try {
        const response = await fetch(`${EMAIL_SERVER_URL}/send-welcome-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                nombre: nombre
            })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Correo enviado');
        } else {
            console.error('❌ Error:', data.error);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}
```

---

## 📂 Archivos Actualizados

Los siguientes archivos ya tienen la URL correcta del servidor:

- ✅ `javaScript/registro.js`
- ✅ `javaScript/login.js`
- ✅ `javaScript/socio-donar.js`

Si creas nuevos archivos que usen el servidor de correos, usa:

```javascript
const EMAIL_SERVER_URL = 'https://kuenikueniapp17-11-2-0.onrender.com';
```

---

## 🛠️ Para Hacer Cambios al Servidor

### 1. Edita los archivos localmente

```bash
cd email-server
# Edita email-server.js o lo que necesites
```

### 2. Prueba localmente

```bash
node email-server.js
# Servidor en http://localhost:3000
```

### 3. Sube los cambios

```bash
git add .
git commit -m "Descripción clara del cambio"
git push origin main
```

### 4. Render redesplegará automáticamente

Espera 2-3 minutos. Verás el progreso en: https://dashboard.render.com

---

## ⚠️ IMPORTANTE - NO HACER ESTO

❌ **NO subas credenciales a GitHub**
- El archivo `.env` está en `.gitignore`
- Nunca hagas `git add -f .env`
- No pongas API Keys en archivos .js

❌ **NO cambies las variables de entorno en Render sin avisar**
- Si las cambias, el servidor dejará de funcionar
- Coordina con el equipo antes

❌ **NO uses `git push --force` sin avisar**
- Puede sobrescribir el trabajo de otros
- Solo úsalo en emergencias

---

## 📋 Endpoints Disponibles

| Endpoint | Descripción | Uso |
|----------|-------------|-----|
| `/send-recovery-email` | Recuperar contraseña | Login |
| `/send-welcome-email` | Correo de bienvenida | Registro |
| `/send-donation-receipt` | Comprobante de donación | Donaciones |
| `/send-event-confirmation` | Confirmación de evento | Eventos |

Revisa `email-server/README.md` para ver ejemplos completos.

---

## 🆘 ¿Problemas?

### El servidor no responde

1. Verifica que esté activo: https://kuenikueniapp17-11-2-0.onrender.com
2. Revisa los logs en Render
3. Contacta al equipo

### No puedo hacer push

1. Asegúrate de no tener conflictos:
   ```bash
   git pull origin main
   ```
2. Resuelve conflictos si hay
3. Intenta push de nuevo

### No tengo las credenciales

Pídelas al líder del proyecto o al que configuró el servidor.

---

## 📚 Documentación Completa

Lee `email-server/README.md` para información detallada sobre:
- Configuración completa
- Todos los endpoints
- Solución de problemas
- Ejemplos de código

---

## 👥 Coordinación

Antes de hacer cambios importantes al servidor:
1. Avisa al equipo
2. Haz un branch para probar
3. Haz pull request para revisión
4. Despliega después de aprobación

---

**¡Buen trabajo en el proyecto! 🚀**
