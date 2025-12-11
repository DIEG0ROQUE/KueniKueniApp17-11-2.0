# 📋 GUÍA DE IMPLEMENTACIÓN: ENCABEZADO UNIVERSAL

## 🎯 Objetivo
Estandarizar todas las vistas del sistema con el mismo diseño de encabezado usado en `/admin-estadisticas.html`

---

## 📦 Archivo CSS Creado
**Ubicación:** `/styles/page-header.css`

Este archivo contiene todos los estilos necesarios para el encabezado universal.

---

## 🔧 PASOS PARA IMPLEMENTAR

### 1️⃣ **Agregar el CSS en cada página HTML**

En la sección `<head>` de cada archivo HTML, agregar:

```html
<link rel="stylesheet" href="styles/page-header.css">
```

**Ejemplo completo:**
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel - Kueni Kueni</title>
    <!-- Estilos existentes -->
    <link rel="stylesheet" href="styles/admin-sidebar.css">
    <link rel="stylesheet" href="styles/admin-common.css">
    
    <!-- ⭐ NUEVO: Agregar este CSS -->
    <link rel="stylesheet" href="styles/page-header.css">
    
    <!-- Estilos específicos de la página -->
    <link rel="stylesheet" href="styles/admin-dashboard.css">
</head>
```

---

### 2️⃣ **Reemplazar el encabezado actual**

Buscar el encabezado existente en cada página y reemplazarlo con esta estructura:

#### ✅ **ESTRUCTURA BÁSICA (sin botones)**

```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Título de la Página</h1>
        <p class="subtitle">Descripción breve de la página</p>
    </div>
</header>
```

#### ✅ **CON BOTÓN DE EXPORTAR**

```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Estadísticas y Reportes</h1>
        <p class="subtitle">Análisis detallado del desempeño de la organización</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" id="btnExportar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M4.66667 6.66667L8 10L11.3333 6.66667" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 10V2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            Exportar Reporte
        </button>
    </div>
</header>
```

#### ✅ **CON SELECTOR DE AÑO Y BOTÓN**

```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Donaciones</h1>
        <p class="subtitle">Gestión y seguimiento de todas las donaciones</p>
    </div>
    <div class="header-actions">
        <select class="year-select" id="yearSelect">
            <option value="2025" selected>2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
        </select>
        <button class="header-btn" id="btnExportar">
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

#### ✅ **CON MÚLTIPLES BOTONES**

```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Eventos</h1>
        <p class="subtitle">Administración y calendario de actividades</p>
    </div>
    <div class="header-actions">
        <button class="header-btn btn-secondary" id="btnFiltrar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Filtrar
        </button>
        <button class="header-btn" id="btnNuevoEvento">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Nuevo Evento
        </button>
    </div>
</header>
```

---

## 📄 PÁGINAS A ACTUALIZAR

### 🔴 **VISTAS DE ADMINISTRADOR**

1. ✅ **admin-estadisticas.html** - Ya tiene el diseño (referencia)
2. ⚠️ **admin-dashboard.html** - Actualizar
3. ⚠️ **admin-eventos.html** - Actualizar
4. ⚠️ **admin-donaciones.html** - Actualizar
5. ⚠️ **admin-socios.html** - Actualizar
6. ⚠️ **admin-noticias.html** - Actualizar

### 🟡 **VISTAS DE COORDINADOR**

7. ⚠️ **coordinador-dashboard.html** - Actualizar
8. ⚠️ **coordinador-eventos.html** - Actualizar
9. ⚠️ **coordinador-noticias.html** - Actualizar

### 🟢 **VISTAS DE SOCIO**

10. ⚠️ **socio-dashboard.html** - Actualizar
11. ⚠️ **socio-eventos.html** - Actualizar
12. ⚠️ **socio-calendario.html** - Actualizar
13. ⚠️ **socio-donaciones.html** - Actualizar
14. ⚠️ **socio-donar.html** - Actualizar
15. ⚠️ **socio-noticias.html** - Actualizar
16. ⚠️ **socio-acerca.html** - Actualizar

### 🔵 **VISTAS DE DONANTE**

17. ⚠️ **donante-dashboard.html** - Actualizar
18. ⚠️ **donante-donar.html** - Actualizar
19. ⚠️ **donante-noticias.html** - Actualizar
20. ⚠️ **donante-acerca.html** - Actualizar
21. ⚠️ **donante-socio.html** - Actualizar

---

## 📝 EJEMPLOS POR PÁGINA

### **admin-dashboard.html**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Panel de Control</h1>
        <p class="subtitle">Vista general de la administración de Kueni Kueni</p>
    </div>
</header>
```

### **admin-eventos.html**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Gestión de Eventos</h1>
        <p class="subtitle">Administración completa del calendario de actividades</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" id="btnNuevoEvento">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Nuevo Evento
        </button>
    </div>
</header>
```

### **admin-donaciones.html**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Gestión de Donaciones</h1>
        <p class="subtitle">Control y seguimiento de todos los aportes recibidos</p>
    </div>
    <div class="header-actions">
        <select class="year-select" id="yearSelect">
            <option value="2025" selected>2025</option>
            <option value="2024">2024</option>
        </select>
        <button class="header-btn" id="btnExportar">
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

### **admin-socios.html**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Gestión de Socios</h1>
        <p class="subtitle">Administración de miembros activos de la asociación</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" id="btnAgregarSocio">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Agregar Socio
        </button>
    </div>
</header>
```

### **admin-noticias.html**
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

### **coordinador-dashboard.html**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Panel de Coordinación</h1>
        <p class="subtitle">Gestión de eventos y comunicación</p>
    </div>
</header>
```

### **socio-dashboard.html**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Mi Panel</h1>
        <p class="subtitle">Bienvenido a tu espacio personal</p>
    </div>
</header>
```

### **socio-eventos.html**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Calendario de Eventos</h1>
        <p class="subtitle">Próximas actividades y eventos de la asociación</p>
    </div>
    <div class="header-actions">
        <button class="header-btn" id="btnMisInscripciones">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H14C14.5523 14 15 13.5523 15 13V3C15 2.44772 14.5523 2 14 2Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M11 1V3M5 1V3M1 5H15" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            Mis Inscripciones
        </button>
    </div>
</header>
```

### **donante-dashboard.html**
```html
<header class="page-header">
    <div class="page-header-info">
        <h1>Panel de Donante</h1>
        <p class="subtitle">Gracias por tu apoyo a Kueni Kueni</p>
    </div>
</header>
```

---

## 🎨 ICONOS SVG COMUNES

### ➕ Agregar/Nuevo
```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

### 📥 Descargar/Exportar
```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" stroke-width="1.5"/>
    <path d="M4.66667 6.66667L8 10L11.3333 6.66667" stroke="currentColor" stroke-width="1.5"/>
    <path d="M8 10V2" stroke="currentColor" stroke-width="1.5"/>
</svg>
```

### 🔍 Filtrar
```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

### 📅 Calendario
```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M14 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H14C14.5523 14 15 13.5523 15 13V3C15 2.44772 14.5523 2 14 2Z" stroke="currentColor" stroke-width="1.5"/>
    <path d="M11 1V3M5 1V3M1 5H15" stroke="currentColor" stroke-width="1.5"/>
</svg>
```

---

## ⚙️ PERSONALIZACIÓN

### Cambiar el título y subtítulo
Solo edita el contenido del HTML:

```html
<h1>Tu Título Aquí</h1>
<p class="subtitle">Tu descripción aquí</p>
```

### Agregar más botones
Agrega más botones dentro de `<div class="header-actions">`:

```html
<div class="header-actions">
    <button class="header-btn btn-secondary">Botón 1</button>
    <button class="header-btn">Botón 2</button>
</div>
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear archivo `styles/page-header.css`
- [ ] Actualizar 21 archivos HTML
- [ ] Agregar `<link rel="stylesheet" href="styles/page-header.css">` en cada página
- [ ] Reemplazar encabezados con la nueva estructura
- [ ] Probar responsive en móvil
- [ ] Verificar que los botones funcionen correctamente

---

## 🚀 RESULTADO ESPERADO

Todas las páginas tendrán:
- ✅ Encabezado morado con gradiente
- ✅ Título grande y subtítulo
- ✅ Botones blancos con hover animado
- ✅ Diseño responsive
- ✅ Animación de entrada suave

---

**¿Necesitas ayuda con alguna página específica?**
