# 🔧 SOLUCIÓN PARA GMAIL EN RENDER

## ❌ PROBLEMA ACTUAL:
```
Error: ETIMEDOUT - No se puede conectar con Gmail SMTP
```

---

## ✅ SOLUCIONES A PROBAR:

### **SOLUCIÓN 1: Nueva contraseña de aplicación + Puerto 587**

Ya actualicé el código para usar puerto 587 con STARTTLS (más compatible).

**PASOS:**

1. **Genera nueva contraseña de Gmail:**
   - Ve a: https://myaccount.google.com/apppasswords
   - Nombre: "KueniKueni Render"
   - Copia la contraseña de 16 caracteres

2. **Actualiza en Render:**
   - Ve a: https://dashboard.render.com
   - Click en tu servicio "kuenikueniapp17-11-2-0"
   - Click en "Environment" (en el menú izquierdo)
   - Busca `GMAIL_APP_PASSWORD`
   - Click en el ícono de editar
   - Pega la NUEVA contraseña
   - Click en "Save Changes"

3. **Sube los cambios del código:**
   ```bash
   cd C:\Users\diego\Downloads\KueniKueniApp17-11-2.0-1
   git add .
   git commit -m "Fix: Usar puerto 587 con STARTTLS"
   git push origin main
   ```

4. **Espera 2-3 minutos** que Render redesplegue

5. **Prueba de nuevo**

---

### **CAMBIOS QUE HICE EN EL CÓDIGO:**

✅ Cambié de puerto 465 a 587 (STARTTLS)
✅ Agregué `rejectUnauthorized: false` para servicios cloud
✅ Aumenté timeouts a 60 segundos
✅ Activé debug mode para ver logs detallados

---

### **SOLUCIÓN 2: Si la Solución 1 no funciona**

Render puede estar bloqueando SMTP completamente. Alternativas:

**A) Usar Mailgun** (tiene plan gratuito)
- 5,000 correos gratis/mes
- Funciona 100% con Render
- Configuración rápida

**B) Usar servidor SMTP de terceros:**
- SMTP2GO (1,000 correos gratis/mes)
- Mailjet (6,000 correos gratis/mes)

**C) Usar Supabase Edge Functions**
- Ya tienes Supabase
- No necesitas servidor separado
- Envía correos desde Supabase directamente

---

## 🚀 PRÓXIMOS PASOS:

1. Genera nueva contraseña de Gmail
2. Actualízala en Render
3. Sube los cambios del código con git
4. Espera el redespliegue
5. Prueba

**Si después de esto sigue sin funcionar, significa que Render bloquea SMTP y tendremos que usar Mailgun o Supabase.**

---

## 📝 COMANDOS RÁPIDOS:

```bash
# Subir cambios
cd C:\Users\diego\Downloads\KueniKueniApp17-11-2.0-1
git add .
git commit -m "Fix SMTP para Render"
git push origin main
```

---

## 🔍 VER LOGS EN RENDER:

1. Ve a https://dashboard.render.com
2. Click en tu servicio
3. Click en "Logs"
4. Busca errores de conexión

Con `debug: true` ahora verás más detalles de qué está pasando.

---

**¿Listo para probar?** 😊
