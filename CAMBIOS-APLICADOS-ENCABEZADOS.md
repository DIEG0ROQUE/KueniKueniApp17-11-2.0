# 🔄 APLICADOR AUTOMÁTICO DE ENCABEZADOS
# Script para actualizar todas las páginas con el nuevo diseño de encabezado

## 📦 ARCHIVOS CREADOS

1. ✅ `/styles/page-header.css` - CSS del encabezado universal
2. ✅ `GUIA-IMPLEMENTACION-ENCABEZADO.md` - Guía completa

---

## 🎯 PÁGINAS ACTUALIZADAS (Ejemplos)

### 1. admin-dashboard.html

**AGREGAR en `<head>` (después de admin-common.css):**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**REEMPLAZAR el header actual:**
```html
<!-- ANTES -->
<div class="page-header">
    <div>
        <h1>Panel de Supervisión</h1>
        <p>Vista general de las operaciones - Solo Lectura</p>
    </div>
</div>

<!-- DESPUÉS -->
<header class="page-header">
    <div class="page-header-info">
        <h1>Panel de Control</h1>
        <p class="subtitle">Vista general de la administración de Kueni Kueni</p>
    </div>
</header>
```

---

### 2. admin-eventos.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Gestión de Eventos</h1>
        <p class="subtitle">Administración completa del calendario de actividades</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" id="modalBtnAbrirCrear">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Nuevo Evento
        </button>
    </div>
</header>
```

---

### 3. admin-donaciones.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Gestión de Donaciones</h1>
        <p class="subtitle">Control y seguimiento de todos los aportes recibidos</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" onclick="exportarExcel()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M4.66667 6.66667L8 10L11.3333 6.66667" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 10V2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            Exportar Excel
        </button>
    </div>
</header>
```

---

### 4. admin-socios.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Gestión de Socios</h1>
        <p class="subtitle">Administración de miembros activos de la asociación</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" id="btnModalAgregarSocio">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Agregar Socio
        </button>
    </div>
</header>
```

---

### 5. admin-noticias.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Gestión de Noticias</h1>
        <p class="subtitle">Publicación y administración de comunicados</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" id="btnNuevaNoticia">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Nueva Noticia
        </button>
    </div>
</header>
```

---

### 6. coordinador-dashboard.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Panel de Coordinación</h1>
        <p class="subtitle">Gestión de eventos y comunicación</p>
    </div>
</header>
```

---

### 7. coordinador-eventos.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Gestión de Eventos</h1>
        <p class="subtitle">Administración del calendario de actividades</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" id="modalBtnAbrirCrear">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Crear Evento
        </button>
    </div>
</header>
```

---

### 8. coordinador-noticias.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Gestión de Noticias</h1>
        <p class="subtitle">Publicación de comunicados y novedades</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" id="btnNuevaNoticia">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Nueva Noticia
        </button>
    </div>
</header>
```

---

### 9. socio-dashboard.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Mi Panel</h1>
        <p class="subtitle">Bienvenido a tu espacio personal</p>
    </div>
</header>
```

---

### 10. socio-eventos.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Calendario de Eventos</h1>
        <p class="subtitle">Próximas actividades y eventos de la asociación</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" onclick="mostrarMisInscripciones()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H14C14.5523 14 15 13.5523 15 13V3C15 2.44772 14.5523 2 14 2Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M11 1V3M5 1V3M1 5H15" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            Mis Inscripciones
        </button>
    </div>
</header>
```

---

### 11. socio-calendario.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Calendario</h1>
        <p class="subtitle">Vista mensual de todos los eventos programados</p>
    </div>
</header>
```

---

### 12. socio-donaciones.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Mis Donaciones</h1>
        <p class="subtitle">Historial completo de tus aportes</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" onclick="exportarHistorial()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M4.66667 6.66667L8 10L11.3333 6.66667" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 10V2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            Exportar
        </button>
    </div>
</header>
```

---

### 13. socio-donar.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Realizar Donación</h1>
        <p class="subtitle">Apoya las causas de Kueni Kueni con tu contribución</p>
    </div>
</header>
```

---

### 14. socio-noticias.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Noticias y Comunicados</h1>
        <p class="subtitle">Mantente informado de las últimas novedades</p>
    </div>
</header>
```

---

### 15. socio-acerca.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Acerca de Kueni Kueni</h1>
        <p class="subtitle">Conoce nuestra misión, visión y valores</p>
    </div>
</header>
```

---

### 16. donante-dashboard.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Panel de Donante</h1>
        <p class="subtitle">Gracias por tu apoyo a Kueni Kueni</p>
    </div>
</header>
```

---

### 17. donante-donar.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Realizar Donación</h1>
        <p class="subtitle">Tu contribución hace la diferencia</p>
    </div>
</header>
```

---

### 18. donante-noticias.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Noticias</h1>
        <p class="subtitle">Últimas novedades y comunicados</p>
    </div>
</header>
```

---

### 19. donante-acerca.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Acerca de Nosotros</h1>
        <p class="subtitle">Misión, visión y valores de Kueni Kueni</p>
    </div>
</header>
```

---

### 20. donante-socio.html

**AGREGAR en `<head>`:**
```html
<link rel="stylesheet" href="styles/page-header.css">
```

**NUEVO HEADER:**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Únete como Socio</h1>
        <p class="subtitle">Conviértete en miembro activo de nuestra asociación</p>
    </div>
</header>
```

---

## ⚠️ IMPORTANTE

### ELIMINAR estilos viejos del encabezado

En cada archivo CSS específico (admin-dashboard.css, admin-eventos.css, etc.), **ELIMINAR o COMENTAR** los estilos del `.page-header` existente para evitar conflictos.

**Ejemplo:**
```css
/* COMENTAR O ELIMINAR ESTOS ESTILOS */
/*
.page-header {
    display: flex;
    justify-content: space-between;
    ...
}
*/
```

---

## ✅ RESULTADO FINAL

Después de aplicar todos estos cambios, todas las páginas tendrán:

1. ✅ Encabezado morado con gradiente consistente
2. ✅ Título grande y subtítulo descriptivo
3. ✅ Botones blancos con animación
4. ✅ Diseño responsive
5. ✅ Animación de entrada suave

---

## 🎯 PRÓXIMOS PASOS

1. Aplicar cambios a cada archivo HTML
2. Probar en navegador
3. Verificar responsive en móvil
4. Ajustar textos según necesidad
5. Confirmar funcionalidad de botones

---

**¿Necesitas que genere el código completo de algún archivo específico?**
