# 📧 GUÍA DE INSTALACIÓN - SERVIDOR DE CORREOS GMAIL
## Para el proyecto Kueni Kueni

---

## 📋 REQUISITOS PREVIOS

1. ✅ Node.js instalado (versión 14 o superior)
   - Descarga: https://nodejs.org/

2. ✅ Una cuenta de Gmail activa

3. ✅ Acceso a la configuración de Supabase

---

## 🔧 PARTE 1: CONFIGURAR GMAIL

### Paso 1: Activar verificación en dos pasos

1. Ve a https://myaccount.google.com/
2. Click en **"Seguridad"** en el menú lateral
3. Busca **"Verificación en dos pasos"**
4. Si no está activada, actívala siguiendo los pasos

### Paso 2: Crear contraseña de aplicación

1. Una vez activada la verificación en dos pasos, vuelve a **"Seguridad"**
2. Busca **"Contraseñas de aplicaciones"** (puede estar hasta abajo)
3. Si te pide tu contraseña, ingrésala
4. En "Selecciona la app", elige **"Correo"**
5. En "Selecciona el dispositivo", elige **"Otro (nombre personalizado)"**
6. Escribe: **"Kueni Kueni Server"**
7. Click en **"Generar"**
8. **IMPORTANTE:** Copia la contraseña de 16 caracteres que aparece (sin espacios)
   - Ejemplo: `abcd efgh ijkl mnop` → copia como `abcdefghijklmnop`

---

## 🚀 PARTE 2: INSTALAR EL SERVIDOR

### Paso 1: Ya tienes la carpeta creada

La carpeta del servidor ya está en:
```
C:\Users\diego\Downloads\KueniKueniApp17-11-2.0-1\email-server\
```

### Paso 2: Configurar variables de entorno

1. Abre la carpeta `email-server`
2. Renombra `.env.example` a `.env`
3. Abre el archivo `.env` con un editor de texto (Notepad, VSCode, etc.)
4. Completa la información:

```env
# Puerto del servidor
PORT=3000

# ===== GMAIL =====
# Pon tu correo de Gmail
GMAIL_USER=tu-correo@gmail.com

# Pon la contraseña de aplicación que generaste (sin espacios)
GMAIL_APP_PASSWORD=abcdefghijklmnop

# ===== SUPABASE =====
# Encuentra estos valores en tu dashboard de Supabase
# Proyecto → Settings → API
SUPABASE_URL=https://xxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...

# ===== URL DEL FRONTEND =====
# Si estás probando localmente:
FRONTEND_URL=http://localhost:5500

# Si ya tienes dominio en producción:
# FRONTEND_URL=https://tu-dominio.com
```

### Paso 3: Instalar dependencias

1. Abre una **terminal** o **símbolo del sistema**
2. Navega a la carpeta del servidor:
   ```bash
   cd C:\Users\diego\Downloads\KueniKueniApp17-11-2.0-1\email-server
   ```
3. Ejecuta:
   ```bash
   npm install
   ```

Esto instalará:
- express
- nodemailer
- cors
- dotenv
- @supabase/supabase-js

### Paso 4: Iniciar el servidor

```bash
npm start
```

Deberías ver:
```
╔═══════════════════════════════════════╗
║  🚀 SERVIDOR DE CORREOS ACTIVO       ║
║  📧 Puerto: 3000                      ║
║  💜 Kueni Kueni Email Service        ║
╚═══════════════════════════════════════╝
✅ Servidor listo para enviar correos desde Gmail
```

---

## 🌐 PARTE 3: ACTUALIZAR EL CÓDIGO DEL FRONTEND

### Opción A: Actualizar login.js manualmente

1. Abre tu archivo `javaScript/login.js`
2. Busca la función `recuperarContrasena`
3. Reemplázala con esta nueva función:

```javascript
async function recuperarContrasenaConGmail(email) {
    const recoveryBtn = document.getElementById('recoveryBtn');
    const btnText = recoveryBtn.querySelector('.btn-text');
    const btnLoader = recoveryBtn.querySelector('.btn-loader');
    const recoveryError = document.getElementById('recoveryError');
    const recoveryMessage = document.getElementById('recoveryMessage');
    
    // IMPORTANTE: Cambia esta URL si tu servidor está en otro puerto o dominio
    const EMAIL_SERVER_URL = 'http://localhost:3000';
    
    try {
        recoveryBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        
        console.log('📧 Solicitando recuperación para:', email);
        
        // Llamar a nuestro servidor de correos
        const response = await fetch(`${EMAIL_SERVER_URL}/send-recovery-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 404) {
                recoveryError.textContent = 'No existe una cuenta con este correo.';
            } else {
                recoveryError.textContent = data.error || 'Error al enviar el correo.';
            }
            return;
        }
        
        console.log('✅ Correo enviado');
        
        recoveryMessage.innerHTML = `
            <div class="recovery-success">
                <div class="success-icon">✉️</div>
                <h3>¡Correo enviado!</h3>
                <p>Hemos enviado tu contraseña a <strong>${email}</strong></p>
                <p class="recovery-note">
                    Revisa tu bandeja de entrada. Si no lo ves, revisa spam.
                    <br><br>
                    <strong>⚠️ Importante:</strong> Cambia tu contraseña después de iniciar sesión.
                </p>
                <div class="recovery-timer">
                    Se cerrará en <span id="countdown">10</span> segundos
                </div>
            </div>
        `;
        
        let segundos = 10;
        const countdownElement = document.getElementById('countdown');
        const interval = setInterval(() => {
            segundos--;
            if (countdownElement) countdownElement.textContent = segundos;
            if (segundos <= 0) {
                clearInterval(interval);
                document.getElementById('recoveryModal').style.display = 'none';
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (error.message.includes('Failed to fetch')) {
            recoveryError.textContent = '⚠️ No se puede conectar. Verifica que el servidor esté activo.';
        } else {
            recoveryError.textContent = 'Error de conexión.';
        }
    } finally {
        recoveryBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}
```

4. También necesitas cambiar el evento del formulario de recuperación. Busca:
```javascript
recoveryForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    // ...
    await recuperarContrasena(email); // CAMBIA ESTA LÍNEA
});
```

Y cámbiala por:
```javascript
recoveryForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    // ...
    await recuperarContrasenaConGmail(email); // NUEVA FUNCIÓN
});
```

---

## ✅ PARTE 4: PROBAR EL SISTEMA

### Prueba 1: Verificar el servidor

1. Asegúrate de que el servidor esté corriendo (`npm start`)
2. Abre en tu navegador: `http://localhost:3000`
3. Deberías ver:
```json
{
  "status": "OK",
  "message": "Servidor de correos Kueni Kueni funcionando",
  "timestamp": "2024-..."
}
```

### Prueba 2: Recuperar contraseña

1. Abre tu proyecto web (login.html)
2. Click en "¿Olvidaste tu contraseña?"
3. Ingresa un correo registrado
4. Click en "Recuperar Contraseña"
5. **Revisa la bandeja de entrada del correo**

✅ **Deberías recibir un correo con tu contraseña**

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "No se puede conectar con el servidor"

**Solución:**
- Verifica que el servidor esté corriendo (`npm start` en la terminal)
- Verifica que la URL en `login.js` sea `http://localhost:3000`
- Revisa la consola del navegador (F12) para ver errores

### Error: "Invalid login" o "Authentication failed"

**Solución:**
- La contraseña de aplicación está incorrecta
- Asegúrate de copiarla sin espacios en `.env`
- Verifica que la verificación en dos pasos esté activa

### Error: "Cannot find module"

**Solución:**
```bash
cd C:\Users\diego\Downloads\KueniKueniApp17-11-2.0-1\email-server
npm install
```

### El correo no llega

**Solución:**
- Revisa la carpeta de **spam**
- Verifica los logs del servidor en la terminal
- Asegúrate de que `GMAIL_USER` en `.env` sea correcto

### Error: "Port 3000 is already in use"

**Solución:**
- Cambia el puerto en `.env`:
  ```
  PORT=3001
  ```
- También actualiza la URL en `login.js`:
  ```javascript
  const EMAIL_SERVER_URL = 'http://localhost:3001';
  ```

---

## 📝 NOTAS IMPORTANTES

1. **Seguridad:**
   - NUNCA subas el archivo `.env` a GitHub
   - El `.gitignore` ya está configurado para protegerlo
   - La contraseña de aplicación NO es tu contraseña de Gmail

2. **Límites de Gmail:**
   - Gmail permite ~500 correos por día
   - Es más que suficiente para recuperación de contraseñas

3. **Mantener el servidor activo:**
   - En desarrollo: deja la terminal abierta con `npm start`
   - El servidor debe estar corriendo para enviar correos
   - Si cierras la terminal, el servidor se detiene

---

## 🚀 DESPLEGAR EN PRODUCCIÓN (OPCIONAL)

Si quieres que el servidor funcione 24/7 sin tener tu computadora encendida:

### Railway (Gratis y fácil)

1. Ve a https://railway.app/
2. Conecta tu cuenta de GitHub
3. Sube el código del servidor a un repositorio
4. Importa el proyecto en Railway
5. Configura las variables de entorno
6. Railway te dará una URL pública (ej: `https://tu-app.railway.app`)
7. Actualiza `EMAIL_SERVER_URL` en `login.js` con esa URL

---

## 🆘 AYUDA

Si tienes problemas:

1. **Revisa los logs:** La terminal donde corre `npm start` muestra todos los mensajes
2. **Consola del navegador:** Abre con F12 para ver errores del frontend
3. **Verifica `.env`:** Todas las variables deben estar correctas
4. **Prueba el servidor:** Abre `http://localhost:3000` en el navegador

---

**¡Listo! Ahora puedes enviar correos ilimitados con Gmail** 🎉

Ya no tienes las restricciones de Supabase. Los correos se envían directamente desde tu cuenta de Gmail.
