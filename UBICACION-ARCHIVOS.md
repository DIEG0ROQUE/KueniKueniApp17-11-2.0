# 📁 UBICACIÓN DE ARCHIVOS - Guía Visual

## 🗂️ ESTRUCTURA DE TU PROYECTO

```
KueniKueniApp17-11-2.0/
│
├── 📄 RESUMEN-ARCHIVOS-MODIFICADOS.md  ⭐ NUEVO (LEER PRIMERO)
├── 📄 INSTRUCCIONES-IMPLEMENTACION-SUSCRIPCIONES.md  ⭐ NUEVO (GUÍA COMPLETA)
│
└── javaScript/
    ├── 📄 login.js  ⬅️ REEMPLAZAR con:
    ├── ✨ login-MODIFICADO.js  ⭐ NUEVO (archivo de reemplazo)
    │
    ├── 📄 socio-dashboard.js  ⬅️ REEMPLAZAR con:
    ├── ✨ socio-dashboard-MODIFICADO.js  ⭐ NUEVO (archivo de reemplazo)
    │
    ├── 📄 socio-donaciones.js  ⬅️ MODIFICAR (ver instrucciones)
    └── ✨ gestion-suscripciones-NUEVO.js  ⭐ NUEVO (agregar al proyecto)
```

---

## 🎯 ACCIÓN REQUERIDA POR ARCHIVO

### 1️⃣ `login-MODIFICADO.js`
```
📍 Ubicación actual: javaScript/login-MODIFICADO.js
🎯 Acción: REEMPLAZAR javaScript/login.js
```

**Opción A - Renombrar (RECOMENDADO):**
```bash
# 1. Backup del original
cp javaScript/login.js javaScript/login-BACKUP.js

# 2. Renombrar el modificado
mv javaScript/login-MODIFICADO.js javaScript/login.js
```

**Opción B - Copiar y pegar:**
```bash
# 1. Backup
cp javaScript/login.js javaScript/login-BACKUP.js

# 2. Copiar contenido
# Abrir login-MODIFICADO.js
# Copiar TODO el contenido
# Pegar en login.js (reemplazando todo)
```

---

### 2️⃣ `socio-dashboard-MODIFICADO.js`
```
📍 Ubicación actual: javaScript/socio-dashboard-MODIFICADO.js
🎯 Acción: REEMPLAZAR javaScript/socio-dashboard.js
```

**Opción A - Renombrar (RECOMENDADO):**
```bash
# 1. Backup del original
cp javaScript/socio-dashboard.js javaScript/socio-dashboard-BACKUP.js

# 2. Renombrar el modificado
mv javaScript/socio-dashboard-MODIFICADO.js javaScript/socio-dashboard.js
```

**Opción B - Copiar y pegar:**
```bash
# 1. Backup
cp javaScript/socio-dashboard.js javaScript/socio-dashboard-BACKUP.js

# 2. Copiar contenido
# Abrir socio-dashboard-MODIFICADO.js
# Copiar TODO el contenido
# Pegar en socio-dashboard.js (reemplazando todo)
```

---

### 3️⃣ `gestion-suscripciones-NUEVO.js`
```
📍 Ubicación actual: javaScript/gestion-suscripciones-NUEVO.js
🎯 Acción: AGREGAR al proyecto (NO reemplaza nada)
```

**Este archivo ya está en su lugar correcto** ✅

Solo necesitas:

1. **Agregarlo en `socio-donaciones.html`:**
```html
<!-- Buscar el final del archivo, antes de </body> -->
<script src="config/supabaseConfig.js"></script>
<script src="javaScript/socio-donaciones.js"></script>
<!-- ⭐ AGREGAR ESTA LÍNEA: -->
<script src="javaScript/gestion-suscripciones-NUEVO.js"></script>
</body>
```

2. **Agregar container en `socio-donaciones.html`:**
```html
<!-- Buscar la sección de suscripción activa -->
<div id="suscripcionStatus" style="display: none;">
    <div class="suscripcion-card">
        <!-- contenido existente... -->
        
        <!-- ⭐ AGREGAR AL FINAL, ANTES DE CERRAR .suscripcion-card: -->
        <div id="btnSuscripcionContainer"></div>
    </div>
</div>
```

---

### 4️⃣ `socio-donaciones.js`
```
📍 Ubicación: javaScript/socio-donaciones.js
🎯 Acción: MODIFICAR (agregar 1 línea)
```

**Buscar la función `inicializarDonaciones()`:**
```javascript
async function inicializarDonaciones(socioId) {
    try {
        // Cargar suscripción activa (si existe)
        await cargarSuscripcion(socioId);
        
        // ⭐ AGREGAR ESTA LÍNEA AQUÍ:
        await mostrarBotonGestionSuscripcion(socioId);
        
        // Cargar donaciones
        const donaciones = await cargarDonacionesSocio(socioId);
        // ... resto del código
    }
}
```

---

## 🔄 PROCESO COMPLETO DE IMPLEMENTACIÓN

### PASO 1: Hacer Backups
```bash
cd "javaScript"
cp login.js login-BACKUP-$(date +%Y%m%d).js
cp socio-dashboard.js socio-dashboard-BACKUP-$(date +%Y%m%d).js
```

### PASO 2: Reemplazar Archivos JavaScript
```bash
# Opción Windows (PowerShell)
Copy-Item login-MODIFICADO.js login.js -Force
Copy-Item socio-dashboard-MODIFICADO.js socio-dashboard.js -Force

# Opción Linux/Mac (Terminal)
mv login-MODIFICADO.js login.js
mv socio-dashboard-MODIFICADO.js socio-dashboard.js
```

### PASO 3: Modificar HTML (socio-donaciones.html)

Abrir `socio-donaciones.html` y hacer 2 cambios:

**Cambio 1 - Agregar script (al final):**
```html
<script src="javaScript/gestion-suscripciones-NUEVO.js"></script>
```

**Cambio 2 - Agregar container (en sección de suscripción):**
```html
<div id="btnSuscripcionContainer"></div>
```

### PASO 4: Modificar JS (socio-donaciones.js)

Abrir `socio-donaciones.js` y agregar 1 línea en `inicializarDonaciones()`:
```javascript
await mostrarBotonGestionSuscripcion(socioId);
```

### PASO 5: Probar

1. Abrir la aplicación en el navegador
2. Hacer login con un usuario
3. Verificar funcionamiento

---

## 📊 CHECKLIST DE ARCHIVOS

Marca cada archivo cuando lo hayas implementado:

- [ ] **login.js** - Reemplazado con login-MODIFICADO.js
- [ ] **socio-dashboard.js** - Reemplazado con socio-dashboard-MODIFICADO.js
- [ ] **gestion-suscripciones-NUEVO.js** - Ya está en su lugar ✅
- [ ] **socio-donaciones.html** - Agregado script + container
- [ ] **socio-donaciones.js** - Agregada línea de inicialización
- [ ] **Backups creados** - De archivos originales

---

## 🎨 CÓMO SE VE DESPUÉS

### Antes:
```
javaScript/
├── login.js  (original)
└── socio-dashboard.js  (original)
```

### Después:
```
javaScript/
├── login.js  (⬅️ contenido de login-MODIFICADO)
├── login-BACKUP.js  (respaldo del original)
├── socio-dashboard.js  (⬅️ contenido de socio-dashboard-MODIFICADO)
├── socio-dashboard-BACKUP.js  (respaldo del original)
└── gestion-suscripciones-NUEVO.js  (⭐ nuevo archivo)
```

---

## ⚡ ATAJOS RÁPIDOS

### Si usas VS Code:
1. Clic derecho en `login-MODIFICADO.js` → Renombrar → `login.js`
2. Clic derecho en `socio-dashboard-MODIFICADO.js` → Renombrar → `socio-dashboard.js`
3. Listo ✅

### Si usas el Explorador de Archivos:
1. Renombrar `login.js` a `login-BACKUP.js`
2. Renombrar `login-MODIFICADO.js` a `login.js`
3. Renombrar `socio-dashboard.js` a `socio-dashboard-BACKUP.js`
4. Renombrar `socio-dashboard-MODIFICADO.js` a `socio-dashboard.js`
5. Listo ✅

---

## 🚨 IMPORTANTE

### ⚠️ NO BORRES estos archivos después de implementar:

- `login-MODIFICADO.js` → Puedes borrarlo DESPUÉS de verificar que funciona
- `socio-dashboard-MODIFICADO.js` → Puedes borrarlo DESPUÉS de verificar que funciona
- `*-BACKUP.js` → NUNCA borres los backups (por si necesitas volver atrás)

### ✅ CONSERVA estos archivos:

- `RESUMEN-ARCHIVOS-MODIFICADOS.md` → Documentación
- `INSTRUCCIONES-IMPLEMENTACION-SUSCRIPCIONES.md` → Guía completa
- Todos los archivos `-BACKUP.js` → Por seguridad

---

## 🎯 RESULTADO FINAL

Después de seguir todos los pasos, tendrás:

```
✅ Sistema de login que permite usuarios inactivos
✅ Dashboard con vista restringida para inactivos
✅ Botón dinámico de activar/cancelar suscripción
✅ Activación automática al crear suscripción
✅ Desactivación automática al cancelar
✅ Backups de todos los archivos originales
✅ Sistema funcionando correctamente
```

---

**💡 TIP FINAL:**

Si algo no funciona:
1. Abre la consola del navegador (F12)
2. Mira si hay errores
3. Verifica que todos los archivos están en su lugar
4. Restaura los backups si es necesario
5. Lee las instrucciones completas en `INSTRUCCIONES-IMPLEMENTACION-SUSCRIPCIONES.md`

---

**Fecha:** 11 de Diciembre, 2024  
**Estado:** ✅ Listo para implementar  
**Archivos creados:** 4 (3 JS + 2 MD)
