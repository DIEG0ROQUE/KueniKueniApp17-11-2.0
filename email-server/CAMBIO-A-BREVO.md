# ✅ CAMBIO A BREVO COMPLETADO

## 🎉 LO QUE HICE:

1. ✅ Actualicé `email-server.js` para usar **Brevo** en lugar de Gmail
2. ✅ Actualicé el archivo `.env` con tus credenciales de Brevo:
   - BREVO_USER: `9cfd8c001@smtp-brevo.com`
   - BREVO_PASSWORD: `UtXJwYyWdC6v7EpV`

---

## 🚀 AHORA SUBE LOS CAMBIOS A RENDER:

### **PASO 1: Actualizar variables en Render**

1. Ve a: https://dashboard.render.com
2. Click en tu servicio `kuenikueniapp17-11-2-0`
3. Click en **"Environment"** (menú izquierdo)
4. **ELIMINA** las variables antiguas de Gmail:
   - Elimina `GMAIL_USER`
   - Elimina `GMAIL_APP_PASSWORD`
5. **AGREGA** las nuevas de Brevo:
   - Click en "Add Environment Variable"
   - Nombre: `BREVO_USER` → Valor: `9cfd8c001@smtp-brevo.com`
   - Click en "Add Environment Variable"
   - Nombre: `BREVO_PASSWORD` → Valor: `UtXJwYyWdC6v7EpV`
6. Click en **"Save Changes"**

---

### **PASO 2: Subir el código a GitHub**

Abre PowerShell y ejecuta:

```bash
cd C:\Users\diego\Downloads\KueniKueniApp17-11-2.0-1

git add .
git commit -m "Cambio a Brevo para envío de correos"
git push origin main
```

---

### **PASO 3: Esperar el redespliegue**

- Ve al dashboard de Render
- Verás "Building..." → "Deploying..."
- Espera 2-3 minutos
- Cuando diga "Live" ✅, está listo

---

### **PASO 4: PROBAR**

1. Ve a tu página de login
2. Click en "Recuperar contraseña"
3. Ingresa tu correo: `diegomrh9@gmail.com`
4. **¡AHORA SÍ DEBERÍA FUNCIONAR!** ✅

---

## 🎯 POR QUÉ AHORA SÍ FUNCIONARÁ:

**Antes (Gmail):**
```
Render → Puerto SMTP Gmail → ❌ BLOQUEADO
```

**Ahora (Brevo):**
```
Render → smtp-relay.brevo.com → ✅ FUNCIONA
```

Brevo está diseñado específicamente para funcionar en servicios cloud como Render.

---

## 📋 RESUMEN:

- ✅ Código actualizado a Brevo
- ✅ Archivo .env actualizado
- ⏳ Faltan actualizar variables en Render
- ⏳ Falta subir a GitHub
- ⏳ Falta probar

---

**¿Listo para actualizar Render y subir los cambios?** 🚀
