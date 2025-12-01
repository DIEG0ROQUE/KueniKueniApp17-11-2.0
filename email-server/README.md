# 🚀 INICIO RÁPIDO - Servidor de Correos Gmail

## ¿Qué es esto?

Este servidor te permite enviar correos desde Gmail sin las limitaciones de Supabase.

---

## 📝 PASOS RÁPIDOS

### 1️⃣ Crear contraseña de aplicación en Gmail

1. Ve a: https://myaccount.google.com/security
2. Activa "Verificación en dos pasos"
3. Busca "Contraseñas de aplicaciones"
4. Crea una nueva para "Correo"
5. Copia la contraseña de 16 caracteres

### 2️⃣ Configurar el archivo .env

1. Renombra `.env.example` a `.env`
2. Abre `.env` con un editor
3. Completa:
   - `GMAIL_USER` = tu correo de Gmail
   - `GMAIL_APP_PASSWORD` = la contraseña que generaste
   - `SUPABASE_URL` y `SUPABASE_ANON_KEY` de tu proyecto Supabase

### 3️⃣ Instalar y ejecutar

Abre una terminal en esta carpeta (`email-server`) y ejecuta:

```bash
npm install
npm start
```

Verás:
```
╔═══════════════════════════════════════╗
║  🚀 SERVIDOR DE CORREOS ACTIVO       ║
║  📧 Puerto: 3000                      ║
║  💜 Kueni Kueni Email Service        ║
╚═══════════════════════════════════════╝
```

### 4️⃣ Actualizar el frontend

En tu archivo `javaScript/login.js`:

1. Busca la función `recuperarContrasena`
2. Cámbiala por `recuperarContrasenaConGmail` (ver GUIA-INSTALACION.md)
3. O simplemente copia el código del archivo `login-nuevo.js` que está en la raíz del proyecto

---

## ✅ Probar

1. Servidor corriendo: http://localhost:3000
2. Abre login.html
3. Click "¿Olvidaste tu contraseña?"
4. Ingresa un email registrado
5. Revisa tu bandeja de entrada

---

## 📚 Documentación completa

Lee `GUIA-INSTALACION.md` para instrucciones detalladas, solución de problemas y deployment en producción.

---

## 🆘 Problemas comunes

- **"No se puede conectar"**: El servidor no está corriendo → ejecuta `npm start`
- **"Invalid login"**: Contraseña de app incorrecta → verifica en `.env`
- **Correo no llega**: Revisa spam o logs del servidor

---

¡Listo! Ya no hay límites de Supabase para enviar correos 🎉
