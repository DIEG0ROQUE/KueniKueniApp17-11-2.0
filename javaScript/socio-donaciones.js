// socio-donaciones.js - Sistema de gestión de donaciones del socio (Optimizado)
// ============================================================================

// ============================================================================
// 1. VERIFICACIÓN DE SESIÓN Y CONFIGURACIÓN INICIAL
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando vista de donaciones...');
    
    // Verificar sesión
    if (!verificarSesion()) {
        console.log('No hay sesión válida. Redirigiendo al login...');
        window.location.href = 'login.html';
        return;
    }
    
    // Verificar cliente Supabase
    if (!window.supabaseClient) {
        console.error('Error: Cliente Supabase no inicializado');
        mostrarMensajeError('Error de configuración. Por favor, recarga la página.');
        return;
    }
    
    // Obtener datos de sesión
    const socioId = sessionStorage.getItem('socioId');
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    
    console.log('Usuario autenticado:', {
        email: userEmail,
        nombre: userName,
        socioId: socioId
    });
    
    // Inicializar componentes
    await inicializarDonaciones(socioId);
    
    // Configurar event listeners
    configurarEventListeners();
});

// ============================================================================
// 2. VERIFICACIÓN DE SESIÓN
// ============================================================================

function verificarSesion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (isLoggedIn !== 'true') {
        return false;
    }
    
    if (userType !== 'socio') {
        console.warn('Tipo de usuario incorrecto:', userType);
        return false;
    }
    
    return true;
}

// ============================================================================
// 3. INICIALIZACIÓN DE LA VISTA DE DONACIONES
// ============================================================================

async function inicializarDonaciones(socioId) {
    try {
        // Cargar donaciones del socio
        const donaciones = await cargarDonacionesSocio(socioId);
        
        if (donaciones && donaciones.length > 0) {
            // Actualizar estadísticas
            actualizarEstadisticas(donaciones);
            
            // Mostrar tabla de donaciones
            mostrarTablaDonaciones(donaciones);
        } else {
            // No hay donaciones
            mostrarSinDonaciones();
            actualizarEstadisticasVacias();
        }
        
        console.log('Vista de donaciones cargada exitosamente');
        
    } catch (error) {
        console.error('Error al cargar donaciones:', error);
        mostrarMensajeError('Ocurrió un error al cargar tus donaciones. Por favor, intenta actualizar la página.');
    }
}

// ============================================================================
// 4. CARGAR DONACIONES DEL SOCIO
// ============================================================================

async function cargarDonacionesSocio(socioId) {
    console.log('Cargando donaciones del socio:', socioId);
    
    try {
        const { data: donaciones, error } = await window.supabaseClient
            .from('donaciones')
            .select('*')
            .eq('socio_id', socioId)
            .order('fecha_donacion', { ascending: false });
        
        if (error) {
            console.error('Error al cargar donaciones:', error);
            
            if (error.message.includes('permission')) {
                mostrarMensajeError('No tienes permiso para ver esta información. Contacta al administrador.');
            }
            
            return [];
        }
        
        console.log('Donaciones cargadas:', donaciones.length);
        return donaciones;
        
    } catch (error) {
        console.error('Error inesperado:', error);
        return [];
    }
}

// ============================================================================
// 5. ACTUALIZAR ESTADÍSTICAS
// ============================================================================

function actualizarEstadisticas(donaciones) {
    // Filtrar solo donaciones completadas
    const donacionesCompletadas = donaciones.filter(d => d.estado_pago === 'completado');
    
    // Calcular total donado
    const totalDonado = donacionesCompletadas.reduce((sum, d) => sum + parseFloat(d.monto), 0);
    
    // Calcular número de donaciones
    const numDonaciones = donacionesCompletadas.length;
    
    // Calcular promedio
    const promedio = numDonaciones > 0 ? totalDonado / numDonaciones : 0;
    
    // Actualizar UI
    const statCards = document.querySelectorAll('.donacion-stat-card');
    
    if (statCards[0]) {
        const totalElement = statCards[0].querySelector('.stat-value-don');
        if (totalElement) {
            totalElement.textContent = `$${totalDonado.toLocaleString('es-MX', {minimumFractionDigits: 0})}`;
        }
    }
    
    if (statCards[1]) {
        const numElement = statCards[1].querySelector('.stat-value-don');
        if (numElement) {
            numElement.textContent = numDonaciones;
        }
    }
    
    if (statCards[2]) {
        const promedioElement = statCards[2].querySelector('.stat-value-don');
        if (promedioElement) {
            promedioElement.textContent = `$${promedio.toLocaleString('es-MX', {minimumFractionDigits: 0})}`;
        }
    }
    
    console.log('Estadísticas actualizadas:', {
        total: totalDonado,
        cantidad: numDonaciones,
        promedio: promedio
    });
}

// ============================================================================
// 6. ACTUALIZAR ESTADÍSTICAS VACÍAS
// ============================================================================

function actualizarEstadisticasVacias() {
    const statCards = document.querySelectorAll('.donacion-stat-card');
    
    if (statCards[0]) {
        const totalElement = statCards[0].querySelector('.stat-value-don');
        if (totalElement) totalElement.textContent = '$0';
    }
    
    if (statCards[1]) {
        const numElement = statCards[1].querySelector('.stat-value-don');
        if (numElement) numElement.textContent = '0';
    }
    
    if (statCards[2]) {
        const promedioElement = statCards[2].querySelector('.stat-value-don');
        if (promedioElement) promedioElement.textContent = '$0';
    }
}

// ============================================================================
// 7. MOSTRAR TABLA DE DONACIONES
// ============================================================================

function mostrarTablaDonaciones(donaciones) {
    const tbody = document.querySelector('.donaciones-table tbody');
    
    if (!tbody) {
        console.warn('Tbody de la tabla no encontrado');
        return;
    }
    
    tbody.innerHTML = donaciones.map(donacion => {
        const badge = obtenerBadgeEstado(donacion.estado_pago);
        const descripcion = obtenerDescripcionDonacion(donacion);
        
        return `
            <tr>
                <td>${formatearFechaDonacion(donacion.fecha_donacion)}</td>
                <td>${descripcion}</td>
                <td class="amount-cell">$${parseFloat(donacion.monto).toLocaleString('es-MX', {minimumFractionDigits: 2})} ${donacion.moneda}</td>
                <td><span class="badge-${badge.clase}">${badge.texto}</span></td>
            </tr>
        `;
    }).join('');
    
    console.log('Tabla de donaciones actualizada');
}

// ============================================================================
// 8. OBTENER DESCRIPCIÓN DE DONACIÓN
// ============================================================================

function obtenerDescripcionDonacion(donacion) {
    // Si tiene mensaje personalizado, usarlo
    if (donacion.mensaje) {
        return donacion.mensaje;
    }
    
    // Si tiene destino específico, usarlo
    if (donacion.destino && donacion.destino !== 'general') {
        const destinos = {
            'reforestacion': 'Donación para programa de reforestación',
            'artesanias': 'Donación para taller de artesanías',
            'deportivo': 'Apoyo para eventos deportivos',
            'asistencia': 'Donación para asistencia social'
        };
        return destinos[donacion.destino] || 'Contribución general';
    }
    
    // Si tiene descripción explícita
    if (donacion.descripcion) {
        return donacion.descripcion;
    }
    
    // Por defecto
    return 'Contribución general';
}

// ============================================================================
// 9. MOSTRAR MENSAJE SIN DONACIONES
// ============================================================================

function mostrarSinDonaciones() {
    const tbody = document.querySelector('.donaciones-table tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 3rem; color: #64748b;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 1rem; opacity: 0.5;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="currentColor"/>
                </svg>
                <p style="font-size: 1.1rem; font-weight: 500; margin-bottom: 0.5rem;">Aún no tienes donaciones registradas</p>
                <p style="font-size: 0.9rem;">Haz tu primera donación para apoyar a la comunidad</p>
                <button 
                    onclick="window.location.href='donante-donar.html'" 
                    style="
                        margin-top: 1.5rem;
                        padding: 0.75rem 1.5rem;
                        background: #5f0d51;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s;
                    "
                    onmouseover="this.style.background='#4d0a37ff'"
                    onmouseout="this.style.background='#5f0d51'"
                >
                    Hacer una Donación
                </button>
            </td>
        </tr>
    `;
}

// ============================================================================
// 10. CONFIGURAR EVENT LISTENERS
// ============================================================================

function configurarEventListeners() {
    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }
    
    console.log('Event listeners configurados');
}

// ============================================================================
// 11. FUNCIONES AUXILIARES
// ============================================================================

function obtenerBadgeEstado(estado) {
    const badges = {
        'completado': { clase: 'completada', texto: 'Completada' },
        'pendiente': { clase: 'pendiente', texto: 'Pendiente' },
        'fallido': { clase: 'fallida', texto: 'Fallida' },
        'reembolsado': { clase: 'reembolsada', texto: 'Reembolsada' }
    };
    
    return badges[estado] || { clase: 'pendiente', texto: estado };
}

function formatearFechaDonacion(fecha) {
    const date = new Date(fecha);
    const opciones = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    return date.toLocaleDateString('es-MX', opciones);
}

// ============================================================================
// 12. FUNCIONES DE UI - MENSAJES
// ============================================================================

function mostrarMensajeError(mensaje) {
    mostrarMensaje(mensaje, 'error');
}

function mostrarMensajeExito(mensaje) {
    mostrarMensaje(mensaje, 'success');
}

function mostrarMensaje(mensaje, tipo) {
    // Crear contenedor si no existe
    let container = document.getElementById('messageContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'messageContainer';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(container);
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${tipo}`;
    messageDiv.textContent = mensaje;
    messageDiv.style.cssText = `
        padding: 1rem 1.5rem;
        margin-bottom: 0.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
        min-width: 300px;
        ${tipo === 'error' ? 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;' : ''}
        ${tipo === 'success' ? 'background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;' : ''}
    `;
    
    container.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 5000);
}

// ============================================================================
// 13. ESTILOS ADICIONALES
// ============================================================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    
    /* Estilos para badges de estado */
    .badge-completada {
        background: #fad1faff;
        color: #5f0d51;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .badge-pendiente {
        background: #fef3c7;
        color: #92400e;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .badge-fallida {
        background: #fee2e2;
        color: #dc2626;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .badge-reembolsada {
        background: #e0e7ff;
        color: #3730a3;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    /* Mejorar la tabla */
    .donaciones-table tbody tr {
        transition: background-color 0.2s;
    }
    
    .donaciones-table tbody tr:hover {
        background-color: #f9fafb;
    }
    
    .amount-cell {
        font-weight: 600;
        color: #5f0d51;
    }
`;
document.head.appendChild(style);