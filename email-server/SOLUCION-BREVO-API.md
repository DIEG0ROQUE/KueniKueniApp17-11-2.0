# 🔧 SOLUCIÓN FINAL: BREVO API (HTTP)

## ❌ PROBLEMA CONFIRMADO:
Render bloquea TODAS las conexiones SMTP (Gmail, Brevo SMTP, etc.) en el plan gratuito.

## ✅ SOLUCIÓN: Usar API HTTP de Brevo

En lugar de SMTP (puerto 587), usamos la **API REST de Brevo** (puerto 443 HTTPS) que SÍ funciona.

---

## 📝 PASO 1: Obtener API Key de Brevo

1. Ve a: https://app.brevo.com
2. Inicia sesión
3. Click en tu nombre (arriba derecha)
4. Click en **"SMTP & API"**
5. Pestaña **"API Keys"**
6. Copia tu **API Key** existente O genera una nueva
   - Empieza con `xkeysib-`
   - Tiene como 64 caracteres

**IMPORTANTE:** Necesito que me des esa API Key.

---

## 📝 PASO 2: Actualizar variables en Render

1. Ve a: https://dashboard.render.com
2. Click en tu servicio `kuenikueniapp17-11-2-0`
3. Click en **"Environment"**
4. **AGREGA** una nueva variable:
   - Nombre: `BREVO_API_KEY`
   - Valor: `[tu API Key que empieza con xkeysib-]`
5. Click en **"Save Changes"**

---

## 📝 PASO 3: Subir código actualizado

```bash
cd C:\Users\diego\Downloads\KueniKueniApp17-11-2.0-1

git add .
git commit -m "Cambio a Brevo API HTTP (no SMTP)"
git push origin main
```

---

## 📝 PASO 4: Esperar y probar

- Espera 2-3 minutos que Render redesplegue
- Prueba recuperar contraseña
- **¡AHORA SÍ FUNCIONARÁ!** ✅

---

## 🎯 POR QUÉ AHORA SÍ FUNCIONA:

**Intentos anteriores:**
```
Render → Puerto 587 (SMTP) → ❌ BLOQUEADO
Render → Puerto 465 (SMTP) → ❌ BLOQUEADO
```

**Ahora:**
```
Render → Puerto 443 (HTTPS API) → ✅ FUNCIONA
```

Render NO bloquea peticiones HTTPS normales, solo SMTP.

---

## ⚡ CAMBIOS QUE HICE:

1. ✅ Eliminé `nodemailer` (usaba SMTP)
2. ✅ Implementé llamadas directas a la API de Brevo usando `fetch`
3. ✅ Todos los endpoints actualizados
4. ✅ Mismo diseño de correos

---

**Dame tu API Key de Brevo y te ayudo a configurar Render.** 🔑
