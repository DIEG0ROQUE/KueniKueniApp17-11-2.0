# 🔧 GUÍA DE IMPLEMENTACIÓN - Sistema de Suscripciones con Estado Activo/Inactivo

## 📋 Resumen de Cambios

Se han implementado las siguientes modificaciones al sistema:

### ✅ Funcionalidades Implementadas:

1. **Login permite entrada a socios inactivos** ✓
2. **Socios inactivos solo ven su perfil** ✓
3. **Botón Activar/Cancelar Suscripción** ✓
4. **Crear suscripción activa el usuario** ✓
5. **Cancelar suscripción desactiva el usuario** ✓

---

## 📁 Archivos Modificados/Creados

### 1. `login-MODIFICADO.js`
**Ubicación:** `javaScript/login-MODIFICADO.js`

**Cambios principales:**
- ✅ Permite login a usuarios con estado `inactivo`
- ✅ Guarda el estado del usuario en `sessionStorage`
- ✅ Muestra mensaje diferente si el usuario está inactivo

**Líneas clave modificadas:**
```javascript
// Línea ~270: Guardar estado en sesión
sessionStorage.setItem('userEstado', usuario.estado);

// Línea ~285: No bloquear acceso si está inactivo
// Se removió la validación que impedía el acceso
```

---

### 2. `socio-dashboard-MODIFICADO.js`
**Ubicación:** `javaScript/socio-dashboard-MODIFICADO.js`

**Cambios principales:**
- ✅ Detecta si el usuario está inactivo
- ✅ Muestra vista restringida con solo información del perfil
- ✅ Bloquea acceso a todas las funcionalidades
- ✅ Muestra botón "Activar mi Cuenta"

**Funciones nuevas:**
```javascript
mostrarModoInactivo()          // Renderiza vista restringida
cargarPerfilInactivo()         // Carga datos del perfil
agregarEstilosInactivo()       // Estilos para modo inactivo
```

---

### 3. `gestion-suscripciones-NUEVO.js` ⭐ NUEVO ARCHIVO
**Ubicación:** `javaScript/gestion-suscripciones-NUEVO.js`

**Funcionalidades principales:**
- ✅ Botón dinámico "Activar" o "Cancelar" suscripción
- ✅ Modal de confirmación al cancelar
- ✅ Cambiar estado del usuario a activo/inactivo
- ✅ Actualizar sessionStorage automáticamente

**Funciones principales:**
```javascript
mostrarBotonGestionSuscripcion(socioId)      // Muestra botón según estado
confirmarCancelacionSuscripcion()            // Modal de confirmación
cancelarSuscripcion()                        // Cancela y desactiva usuario
activarUsuarioDespuesSuscripcion()          // Activa usuario
procesarSuscripcionExitosa()                 // Crea suscripción y activa
```

---

## 🔨 PASOS DE IMPLEMENTACIÓN

### PASO 1: Actualizar archivo `login.js`

```bash
# Reemplazar el archivo actual
javaScript/login.js
```

**Opción A - Reemplazar completamente:**
```bash
1. Hacer backup del login.js actual
2. Renombrar login-MODIFICADO.js a login.js
```

**Opción B - Modificar manualmente:**
Agregar en la función `realizarLogin()` después de validar la contraseña:

```javascript
// ⭐ AGREGAR ESTA LÍNEA (aproximadamente línea 270)
sessionStorage.setItem('userEstado', usuario.estado);

// ⭐ ELIMINAR O COMENTAR ESTA VALIDACIÓN (aproximadamente línea 240):
/*
if (usuario.estado !== 'activo') {
    mostrarMensaje('Tu cuenta está inactiva...', 'error');
    return;
}
*/

// ⭐ MODIFICAR MENSAJE DE BIENVENIDA (aproximadamente línea 285):
let mensaje = '¡Inicio de sesión exitoso!';
if (usuario.estado === 'inactivo' && usuario.tipo_usuario === 'socio') {
    mensaje = '⚠️ Tu cuenta está inactiva. Solo podrás ver tu perfil.';
} else {
    const mensajes = {
        'admin': '¡Bienvenido Administrador!',
        'socio': '¡Bienvenido Socio!',
        'donante': '¡Bienvenido Donante!',
        'coordinador': '¡Bienvenido Coordinador!'
    };
    mensaje = mensajes[usuario.tipo_usuario] || mensaje;
}
```

---

### PASO 2: Actualizar archivo `socio-dashboard.js`

```bash
# Reemplazar el archivo actual
javaScript/socio-dashboard.js
```

**Opción A - Reemplazar completamente:**
```bash
1. Hacer backup del socio-dashboard.js actual
2. Renombrar socio-dashboard-MODIFICADO.js a socio-dashboard.js
```

**Opción B - Modificar manualmente:**
Agregar al inicio de `DOMContentLoaded` (después de obtener datos de sesión):

```javascript
// ⭐ AGREGAR DESPUÉS DE LA LÍNEA ~30
const userEstado = sessionStorage.getItem('userEstado');

console.log('Usuario autenticado:', {
    email: userEmail,
    nombre: userName,
    socioId: socioId,
    estado: userEstado  // ⭐ NUEVO
});

// ⭐ AGREGAR VALIDACIÓN (línea ~40)
if (userEstado === 'inactivo') {
    mostrarModoInactivo();
    return;
}
```

Y agregar las 3 funciones nuevas al final del archivo:
- `mostrarModoInactivo()`
- `cargarPerfilInactivo()`
- `agregarEstilosInactivo()`

(Copiar del archivo `socio-dashboard-MODIFICADO.js`)

---

### PASO 3: Agregar el nuevo módulo de suscripciones

```bash
# Agregar el nuevo archivo
javaScript/gestion-suscripciones-NUEVO.js
```

Este es un archivo completamente nuevo que se debe agregar.

---

### PASO 4: Modificar `socio-donaciones.html`

Agregar el contenedor del botón y el script:

```html
<!-- ⭐ AGREGAR DENTRO DE LA SECCIÓN DE SUSCRIPCIÓN ACTIVA -->
<div id="suscripcionStatus" style="display: none;">
    <!-- Contenido existente... -->
    
    <!-- ⭐ AGREGAR ESTE CONTAINER -->
    <div id="btnSuscripcionContainer"></div>
</div>

<!-- ⭐ AGREGAR ANTES DE CERRAR </body> -->
<script src="javaScript/gestion-suscripciones-NUEVO.js"></script>
```

---

### PASO 5: Modificar `socio-donaciones.js`

Agregar la llamada para mostrar el botón:

```javascript
// ⭐ AGREGAR EN LA FUNCIÓN inicializarDonaciones()
async function inicializarDonaciones(socioId) {
    try {
        await cargarSuscripcion(socioId);
        
        // ⭐ AGREGAR ESTA LÍNEA
        await mostrarBotonGestionSuscripcion(socioId);
        
        const donaciones = await cargarDonacionesSocio(socioId);
        // ... resto del código
    }
}
```

---

### PASO 6: Integrar activación al crear suscripción

En el archivo donde procesas la creación de suscripciones (posiblemente `socio-donaciones.js`), modificar:

```javascript
// ⭐ BUSCAR LA FUNCIÓN QUE CREA LA SUSCRIPCIÓN
// Y REEMPLAZAR CON:

async function crearNuevaSuscripcion(socioId, datosTarjeta, montoMensual) {
    try {
        // ... código de creación de suscripción
        
        // ⭐ DESPUÉS DE CREAR LA SUSCRIPCIÓN EXITOSAMENTE:
        const activado = await activarUsuarioDespuesSuscripcion();
        
        if (activado) {
            mostrarMensaje('✅ ¡Suscripción creada! Tu cuenta está ahora ACTIVA.', 'success');
        }
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('Error:', error);
    }
}
```

---

## 🎯 FLUJO COMPLETO

### 📥 Login de Usuario Inactivo:
1. Usuario inactivo ingresa credenciales → ✅ Permite acceso
2. Se guarda `userEstado: 'inactivo'` en sessionStorage
3. Redirige a `socio-dashboard.html`
4. Dashboard detecta estado inactivo
5. Muestra solo perfil + botón "Activar Cuenta"

### 💳 Activar Cuenta (Crear Suscripción):
1. Usuario hace clic en "Activar mi Cuenta"
2. Redirige a página de donaciones
3. Usuario crea suscripción mensual
4. Al crear suscripción:
   - Se guarda en tabla `suscripciones_mensuales`
   - Se actualiza `usuarios.estado = 'activo'`
   - Se actualiza `sessionStorage.userEstado = 'activo'`
5. Recarga página → Usuario ve dashboard completo

### ❌ Cancelar Suscripción:
1. Usuario activo ve botón "Cancelar Suscripción"
2. Hace clic → Aparece modal de confirmación
3. Confirma → Se ejecuta:
   - Actualiza `suscripciones_mensuales.estado = 'cancelada'`
   - Actualiza `usuarios.estado = 'inactivo'`
   - Actualiza `sessionStorage.userEstado = 'inactivo'`
4. Recarga página → Usuario ve solo perfil

---

## 📊 CAMBIOS EN BASE DE DATOS

### No se requieren cambios en la estructura de tablas ✅

El sistema usa las columnas existentes:
- `usuarios.estado` (ya existe)
- `suscripciones_mensuales.estado` (ya existe)

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de implementar, verificar:

- [ ] Usuario inactivo puede hacer login
- [ ] Usuario inactivo ve solo su perfil
- [ ] Usuario inactivo ve botón "Activar mi Cuenta"
- [ ] Al crear suscripción, usuario pasa a activo
- [ ] Usuario activo ve botón "Cancelar Suscripción"
- [ ] Al cancelar, usuario pasa a inactivo
- [ ] SessionStorage se actualiza correctamente
- [ ] Recarga de página refleja cambios de estado

---

## 🐛 DEBUGGING

### Si el usuario inactivo no puede entrar:
1. Verificar que `login.js` tiene la línea:
   ```javascript
   sessionStorage.setItem('userEstado', usuario.estado);
   ```
2. Verificar que se eliminó/comentó la validación de estado activo

### Si no se muestra el perfil restringido:
1. Abrir consola del navegador
2. Verificar que aparece: `⚠️ Usuario inactivo detectado - Mostrando vista restringida`
3. Verificar que `userEstado` en sessionStorage es 'inactivo'

### Si el botón no aparece:
1. Verificar que existe `<div id="btnSuscripcionContainer"></div>` en el HTML
2. Verificar que se cargó el script `gestion-suscripciones-NUEVO.js`
3. Verificar que se llama `mostrarBotonGestionSuscripcion(socioId)`

---

## 📞 SOPORTE

Si tienes problemas con la implementación:
1. Revisa la consola del navegador (F12)
2. Verifica que todos los archivos están en su lugar
3. Asegúrate de que Supabase está configurado correctamente

---

**Fecha de creación:** 11 de Diciembre, 2024
**Versión:** 1.0
**Estado:** ✅ Listo para implementar
