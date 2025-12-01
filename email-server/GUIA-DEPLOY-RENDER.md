# 🚀 GUÍA COMPLETA: DESPLEGAR SERVIDOR DE CORREOS EN RENDER

## 📋 ¿POR QUÉ NECESITAS ESTO?

Actualmente tu servidor de correos solo funciona cuando TÚ lo ejecutas en tu computadora. Para que tus amigos puedan usar el sistema (recuperar contraseña, recibir correos de bienvenida, etc.), el servidor debe estar **activo 24/7 en internet**.

---

## ✅ SOLUCIÓN: RENDER.COM (GRATIS)

Render mantendrá tu servidor activo siempre, sin que tengas que hacer nada.

---

## 📝 PASOS PARA DESPLEGAR

### **1. Crear cuenta en Render**

1. Ve a https://render.com
2. Click en "Get Started" o "Sign Up"
3. Regístrate con tu cuenta de GitHub (recomendado)

---

### **2. Preparar el repositorio de GitHub**

**Tu proyecto YA está en GitHub**, así que este paso es más fácil:

1. Abre PowerShell en la carpeta de tu proyecto
2. Ejecuta:

```bash
cd C:\Users\diego\Downloads\KueniKueniApp17-11-2.0-1
git add .
git commit -m "Preparando servidor para deploy en Render"
git push origin main
```

---

### **3. Crear Web Service en Render**

1. **En Render, click en "New +"** → "Web Service"

2. **Conecta tu repositorio de GitHub:**
   - Selecciona tu repositorio `KueniKueni`
   - Click en "Connect"

3. **Configuración del servicio:**
   
   **Name:** `kuenikueni-email-server` (o el que quieras)
   
   **Region:** Selecciona la más cercana (Oregon, Ohio, Frankfurt)
   
   **Branch:** `main`
   
   **Root Directory:** `email-server`
   
   **Runtime:** `Node`
   
   **Build Command:** `npm install`
   
   **Start Command:** `node email-server.js`
   
   **Instance Type:** `Free`

4. **Click en "Advanced"** y agrega las variables de entorno:

   ```
   PORT = 3000
   GMAIL_USER = kuenikueni.contacto@gmail.com
   GMAIL_APP_PASSWORD = imgfsdttepslilvw
   SUPABASE_URL = https://yceoopbgzmzjtyzbozst.supabase.co
   SUPABASE_ANON_KEY = [tu clave de Supabase]
   ```

   ⚠️ **IMPORTANTE:** Copia exactamente las variables de tu archivo `.env`

5. **Click en "Create Web Service"**

---

### **4. Esperar el despliegue**

Render instalará las dependencias y iniciará el servidor. Esto toma 2-5 minutos.

Verás algo como:
```
==> Cloning from GitHub...
==> Installing dependencies...
==> Starting server...
✅ Servidor listo para enviar correos desde Gmail
✅ Servidor corriendo en puerto 3000
```

Al final, Render te dará una URL como:
```
https://kuenikueni-email-server.onrender.com
```

---

### **5. Actualizar el código del frontend**

Ahora necesitas cambiar la URL del servidor en tus archivos JavaScript.

**Archivos a modificar:**

1. `javaScript/registro.js`
2. `javaScript/login.js`
3. `javaScript/send-recovery-email.js`
4. `javaScript/socio-donar.js`
5. `javaScript/donante-donar.js`
6. Cualquier otro que use el servidor de correos

**Busca esta línea en cada archivo:**
```javascript
const EMAIL_SERVER_URL = 'http://localhost:3000';
```

**Cámbiala por:**
```javascript
const EMAIL_SERVER_URL = 'https://kuenikueni-email-server.onrender.com';
```

(Reemplaza con TU URL de Render)

---

### **6. Probar que funciona**

1. Abre tu página de registro
2. Crea un usuario nuevo
3. Deberías recibir el correo de bienvenida ✅

Si no funciona, revisa los logs en Render:
- Ve a tu servicio en Render
- Click en "Logs"
- Busca errores en rojo

---

## 🔄 ACTUALIZAR EL SERVIDOR

Cada vez que hagas cambios en `email-server.js`:

```bash
git add .
git commit -m "Actualización del servidor"
git push origin main
```

Render detectará el cambio y redesplegará automáticamente.

---

## 💡 CONSEJOS

✅ **El plan gratuito de Render tiene limitaciones:**
- El servidor "duerme" después de 15 minutos de inactividad
- La primera petición después de dormir tarda ~30 segundos
- Luego funciona normal

✅ **Si necesitas que SIEMPRE esté activo:**
- Upgrade a plan de pago ($7/mes)
- O usa un servicio como UptimeRobot para "despertarlo" cada 10 minutos

✅ **Seguridad:**
- NUNCA compartas tu `GMAIL_APP_PASSWORD`
- NO subas el archivo `.env` a GitHub (ya está en .gitignore)

---

## 🆘 PROBLEMAS COMUNES

**❌ Error: "Application failed to respond"**
- Revisa que el puerto sea el correcto (3000)
- Verifica que las variables de entorno estén bien

**❌ No recibo correos**
- Revisa los logs de Render
- Verifica que la contraseña de Gmail sea correcta
- Asegúrate de que la URL del frontend apunte a Render

**❌ CORS Error**
- Agrega tu dominio del frontend a las configuraciones de CORS en `email-server.js`

---

## 📚 RECURSOS

- Documentación de Render: https://render.com/docs
- Dashboard de Render: https://dashboard.render.com
- Soporte de Render: https://render.com/docs/support

---

## ✅ CHECKLIST FINAL

- [ ] Cuenta de Render creada
- [ ] Proyecto subido a GitHub
- [ ] Web Service creado en Render
- [ ] Variables de entorno configuradas
- [ ] Despliegue exitoso (ver logs)
- [ ] URLs actualizadas en el frontend
- [ ] Prueba de registro funcionando
- [ ] Correo de bienvenida recibido

---

¡Listo! Ahora tu sistema de correos funcionará 24/7 sin necesidad de que tu computadora esté encendida. 🎉
