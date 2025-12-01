// socio-eventos.js - Sistema COMPLETO con confirmación de asistencias
// ============================================================================
// Usa estados del admin: proximo, activo, completado
// Inserta en tabla asistencias_eventos con estado 'confirmado'
// Actualiza contador automáticamente con trigger
// ============================================================================

// ============================================================================
// 1. VERIFICACIÓN DE SESIÓN Y CONFIGURACIÓN INICIAL
// ============================================================================










const EMAIL_SERVER_URL = 'http://localhost:3000';

async function enviarConfirmacionEvento(registro) {
    try {
        const response = await fetch(`${EMAIL_SERVER_URL}/send-event-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: registro.email,
                nombre: registro.nombre,
                evento_nombre: registro.evento_nombre,
                evento_fecha: registro.evento_fecha,
                evento_lugar: registro.evento_lugar,
                evento_hora: registro.evento_hora
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Confirmación enviada');
            return true;
        } else {
            console.error('❌ Error:', data.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error al enviar confirmación:', error);
        return false;
    }
}













document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando vista de eventos...');
    
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
    await inicializarEventos(socioId);
    
    // Configurar event listeners
    configurarEventListeners(socioId);
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
// 3. INICIALIZACIÓN DE LA VISTA DE EVENTOS
// ============================================================================

async function inicializarEventos(socioId) {
    try {
        console.log('Actualizando estados de eventos...');
        await actualizarEstadosAutomaticamente();
        
        // Cargar eventos próximos, en curso y pasados en paralelo
        const [eventosProximos, eventosEnCurso, eventosPasados] = await Promise.all([
            cargarEventosProximos(socioId),
            cargarEventosEnCurso(socioId),
            cargarEventosPasados(socioId)
        ]);
        
        // Mostrar eventos en UI
        mostrarEventosProximos(eventosProximos, socioId);
        mostrarEventosEnCurso(eventosEnCurso, socioId);
        mostrarEventosPasados(eventosPasados, socioId);
        
        // Actualizar contadores en tabs
        actualizarContadoresTabs(eventosProximos.length, eventosEnCurso.length, eventosPasados.length);
        
        console.log('Vista de eventos cargada exitosamente');
        
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        mostrarMensajeError('Ocurrió un error al cargar los eventos. Por favor, intenta actualizar la página.');
    }
}

// ============================================================================
// 3.1 ACTUALIZAR ESTADOS AUTOMÁTICAMENTE
// ============================================================================

async function actualizarEstadosAutomaticamente() {
    if (!window.supabaseClient) return;
    
    try {
        console.log('Actualizando estados automáticamente...');
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString().split('T')[0];
        
        // Actualizar eventos pasados a 'completado'
        const { error: error1 } = await window.supabaseClient
            .from('eventos')
            .update({ estado: 'completado' })
            .lt('fecha_evento', hoyISO)
            .neq('estado', 'completado');
        
        if (error1) console.error('Error al actualizar completados:', error1);
        
        // Actualizar eventos de hoy a 'activo'
        const { error: error2 } = await window.supabaseClient
            .from('eventos')
            .update({ estado: 'activo' })
            .eq('fecha_evento', hoyISO)
            .neq('estado', 'activo');
        
        if (error2) console.error('Error al actualizar activos:', error2);
        
        // Actualizar eventos futuros a 'proximo'
        const { error: error3 } = await window.supabaseClient
            .from('eventos')
            .update({ estado: 'proximo' })
            .gt('fecha_evento', hoyISO)
            .neq('estado', 'proximo');
        
        if (error3) console.error('Error al actualizar próximos:', error3);
        
        console.log('Estados actualizados correctamente');
        
    } catch (error) {
        console.error('Error al actualizar estados:', error);
    }
}

// ============================================================================
// 4. CARGAR EVENTOS PRÓXIMOS
// ============================================================================

async function cargarEventosProximos(socioId) {
    console.log('Cargando próximos eventos...');
    
    try {
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('estado', 'proximo')
            .order('fecha_evento', { ascending: true });
        
        if (error) {
            console.error('Error al cargar eventos próximos:', error);
            return [];
        }
        
        // Verificar asistencias del socio para cada evento
        if (eventos && eventos.length > 0) {
            const eventosConAsistencia = await Promise.all(
                eventos.map(async (evento) => {
                    const { data: asistencia } = await window.supabaseClient
                        .from('asistencias_eventos')
                        .select('estado')
                        .eq('evento_id', evento.id)
                        .eq('socio_id', socioId)
                        .maybeSingle();
                    
                    return {
                        ...evento,
                        asistenciaConfirmada: asistencia ? asistencia.estado : null
                    };
                })
            );
            
            console.log('Eventos próximos cargados:', eventosConAsistencia.length);
            return eventosConAsistencia;
        }
        
        return [];
        
    } catch (error) {
        console.error('Error inesperado:', error);
        return [];
    }
}

// ============================================================================
// 4.1 CARGAR EVENTOS EN CURSO
// ============================================================================

async function cargarEventosEnCurso(socioId) {
    console.log('Cargando eventos en curso...');
    
    try {
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('estado', 'activo')
            .order('hora_evento', { ascending: true });
        
        if (error) {
            console.error('Error al cargar eventos en curso:', error);
            return [];
        }
        
        // Verificar asistencias del socio para cada evento
        if (eventos && eventos.length > 0) {
            const eventosConAsistencia = await Promise.all(
                eventos.map(async (evento) => {
                    const { data: asistencia } = await window.supabaseClient
                        .from('asistencias_eventos')
                        .select('estado')
                        .eq('evento_id', evento.id)
                        .eq('socio_id', socioId)
                        .maybeSingle();
                    
                    return {
                        ...evento,
                        asistenciaConfirmada: asistencia ? asistencia.estado : null
                    };
                })
            );
            
            console.log('Eventos en curso cargados:', eventosConAsistencia.length);
            return eventosConAsistencia;
        }
        
        return [];
        
    } catch (error) {
        console.error('Error inesperado:', error);
        return [];
    }
}

// ============================================================================
// 5. CARGAR EVENTOS PASADOS
// ============================================================================

async function cargarEventosPasados(socioId) {
    console.log('Cargando eventos pasados...');
    
    try {
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('estado', 'completado')
            .order('fecha_evento', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('Error al cargar eventos pasados:', error);
            return [];
        }
        
        // Verificar si el socio asistió a cada evento
        if (eventos && eventos.length > 0) {
            const eventosConAsistencia = await Promise.all(
                eventos.map(async (evento) => {
                    const { data: asistencia } = await window.supabaseClient
                        .from('asistencias_eventos')
                        .select('estado')
                        .eq('evento_id', evento.id)
                        .eq('socio_id', socioId)
                        .maybeSingle();
                    
                    return {
                        ...evento,
                        asistenciaConfirmada: asistencia ? asistencia.estado : null
                    };
                })
            );
            
            console.log('Eventos pasados cargados:', eventosConAsistencia.length);
            return eventosConAsistencia;
        }
        
        return [];
        
    } catch (error) {
        console.error('Error inesperado:', error);
        return [];
    }
}

// ============================================================================
// 6. MOSTRAR EVENTOS PRÓXIMOS EN UI
// ============================================================================

function mostrarEventosProximos(eventos, socioId) {
    const container = document.getElementById('tab-proximos')?.querySelector('.eventos-grid-socio');
    
    if (!container) {
        console.warn('Contenedor de eventos próximos no encontrado');
        return;
    }
    
    if (eventos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #64748b; grid-column: 1/-1;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 1rem; opacity: 0.3;">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="currentColor"/>
                </svg>
                <h3 style="margin-bottom: 0.5rem;">No hay eventos próximos</h3>
                <p>Vuelve pronto para ver nuevos eventos</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = eventos.map(evento => {
        const badge = obtenerBadgeCategoria(evento.categoria);
        const isRegistrado = evento.asistenciaConfirmada === 'confirmado';
        const cupoDisponible = evento.cupo_maximo - evento.asistentes_confirmados;
        const cupoLleno = cupoDisponible <= 0;
        
        return `
            <div class="evento-card-socio ${isRegistrado ? 'registered' : ''}" data-evento-id="${evento.id}">
                <div class="evento-header-socio">
                    <span class="evento-badge-socio ${badge.clase}">${badge.texto}</span>
                    <span class="estado-badge estado-proximo">Próximo</span>
                    ${isRegistrado ? '<span class="registered-badge">✓ Registrado</span>' : ''}
                </div>
                
                <h3 class="evento-titulo-socio">${evento.titulo}</h3>
                <p class="evento-descripcion-socio">${evento.descripcion}</p>
                
                <div class="evento-detalles-socio">
                    <div class="detalle-item-socio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="#71717a"/>
                        </svg>
                        <span>${formatearFechaCompleta(evento.fecha_evento)}</span>
                    </div>
                    
                    <div class="detalle-item-socio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" fill="#71717a"/>
                        </svg>
                        <span>${evento.hora_evento.substring(0, 5)} hrs</span>
                    </div>
                    
                    <div class="detalle-item-socio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#71717a"/>
                        </svg>
                        <span>${evento.ubicacion}</span>
                    </div>
                    
                    <div class="detalle-item-socio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#71717a"/>
                        </svg>
                        <span>${evento.asistentes_confirmados} / ${evento.cupo_maximo} asistentes confirmados</span>
                    </div>
                </div>
                
                <button 
                    class="btn-evento-action-socio ${isRegistrado ? 'cancel' : ''}" 
                    data-evento-id="${evento.id}"
                    data-socio-id="${socioId}"
                    ${cupoLleno && !isRegistrado ? 'disabled' : ''}
                >
                    ${cupoLleno && !isRegistrado ? 'Cupo Lleno' : isRegistrado ? 'Cancelar Asistencia' : 'Confirmar Asistencia'}
                </button>
            </div>
        `;
    }).join('');
    
    console.log('Eventos próximos mostrados en UI');
}

// [CONTINÚA EN SIGUIENTE PARTE...]
// ============================================================================
// 6.1 MOSTRAR EVENTOS EN CURSO EN UI
// ============================================================================

function mostrarEventosEnCurso(eventos, socioId) {
    const container = document.getElementById('tab-en-curso')?.querySelector('.eventos-grid-socio');
    
    if (!container) {
        console.warn('Contenedor de eventos en curso no encontrado');
        return;
    }
    
    if (eventos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #64748b; grid-column: 1/-1;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 1rem; opacity: 0.3;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
                <h3 style="margin-bottom: 0.5rem;">No hay eventos en curso</h3>
                <p>No hay eventos activos en este momento</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = eventos.map(evento => {
        const badge = obtenerBadgeCategoria(evento.categoria);
        const isRegistrado = evento.asistenciaConfirmada === 'confirmado';
        
        return `
            <div class="evento-card-socio en-curso ${isRegistrado ? 'registered' : ''}" data-evento-id="${evento.id}">
                <div class="evento-header-socio">
                    <span class="evento-badge-socio ${badge.clase}">${badge.texto}</span>
                    <span class="estado-badge estado-en-curso">En Curso</span>
                    ${isRegistrado ? '<span class="registered-badge">✓ Registrado</span>' : ''}
                </div>
                
                <h3 class="evento-titulo-socio">${evento.titulo}</h3>
                <p class="evento-descripcion-socio">${evento.descripcion}</p>
                
                <div class="evento-detalles-socio">
                    <div class="detalle-item-socio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="#71717a"/>
                        </svg>
                        <span>Hoy - ${formatearFechaCompleta(evento.fecha_evento)}</span>
                    </div>
                    
                    <div class="detalle-item-socio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" fill="#71717a"/>
                        </svg>
                        <span>${evento.hora_evento.substring(0, 5)} hrs</span>
                    </div>
                    
                    <div class="detalle-item-socio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#71717a"/>
                        </svg>
                        <span>${evento.ubicacion}</span>
                    </div>
                    
                    <div class="detalle-item-socio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#71717a"/>
                        </svg>
                        <span>${evento.asistentes_confirmados} / ${evento.cupo_maximo} asistentes confirmados</span>
                    </div>
                </div>
                
                <div class="en-curso-actions">
                    <button 
                        class="btn-evento-action-socio ${isRegistrado ? 'cancel' : ''}" 
                        data-evento-id="${evento.id}"
                        data-socio-id="${socioId}"
                        ${!isRegistrado ? 'disabled' : ''}
                    >
                        ${isRegistrado ? 'Asistiendo' : 'Registro Cerrado'}
                    </button>
                    ${isRegistrado ? '<span class="en-curso-notice">¡El evento está en curso!</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Eventos en curso mostrados en UI');
}

// ============================================================================
// 7. MOSTRAR EVENTOS PASADOS EN UI
// ============================================================================

function mostrarEventosPasados(eventos, socioId) {
    const container = document.getElementById('tab-pasados')?.querySelector('.eventos-grid-socio');
    
    if (!container) {
        console.warn('Contenedor de eventos pasados no encontrado');
        return;
    }
    
    if (eventos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #64748b; grid-column: 1/-1;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 1rem; opacity: 0.3;">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="currentColor"/>
                </svg>
                <h3 style="margin-bottom: 0.5rem;">No hay eventos pasados</h3>
                <p>Tu historial de eventos aparecerá aquí</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = eventos.map(evento => {
        const badge = obtenerBadgeCategoria(evento.categoria);
        const asistio = evento.asistenciaConfirmada === 'asistio';
        
        return `
            <div class="evento-card-socio past" data-evento-id="${evento.id}">
                <div class="evento-header-socio">
                    <span class="evento-badge-socio ${badge.clase}">${badge.texto}</span>
                    <span class="estado-badge estado-completado">Completado</span>
                </div>
                
                <h3 class="evento-titulo-socio">${evento.titulo}</h3>
                <p class="evento-descripcion-socio">${evento.descripcion}</p>
                
                <div class="evento-detalles-socio">
                    <div class="detalle-item-socio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="#71717a"/>
                        </svg>
                        <span>${formatearFechaCompleta(evento.fecha_evento)}</span>
                    </div>
                    
                    <div class="detalle-item-socio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" fill="#71717a"/>
                        </svg>
                        <span>${evento.hora_evento.substring(0, 5)} hrs</span>
                    </div>
                    
                    <div class="detalle-item-socio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#71717a"/>
                        </svg>
                        <span>${evento.ubicacion}</span>
                    </div>
                    
                    <div class="detalle-item-socio">
                        ${asistio ? `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#15803d"/>
                            </svg>
                            <span class="attended">Asististe a este evento</span>
                        ` : `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#dc2626"/>
                            </svg>
                            <span class="not-attended">No asististe</span>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Eventos pasados mostrados en UI');
}

// ============================================================================
// 8. ACTUALIZAR CONTADORES EN TABS
// ============================================================================

function actualizarContadoresTabs(proximosCount, enCursoCount, pasadosCount) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        const tab = btn.dataset.tab;
        if (tab === 'proximos') {
            btn.textContent = `Próximos Eventos (${proximosCount})`;
        } else if (tab === 'en-curso') {
            btn.textContent = `En Curso (${enCursoCount})`;
        } else if (tab === 'pasados') {
            btn.textContent = `Eventos Pasados (${pasadosCount})`;
        }
    });
}

// ============================================================================
// 9. CONFIGURAR EVENT LISTENERS
// ============================================================================

function configurarEventListeners(socioId) {
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
    
    // Tabs
    configurarTabs();
    
    // Botones de acción de eventos (delegación de eventos)
    document.addEventListener('click', async function(e) {
        if (e.target.classList.contains('btn-evento-action-socio')) {
            const button = e.target;
            const eventoId = button.dataset.eventoId;
            const isCancel = button.classList.contains('cancel');
            
            if (isCancel) {
                await cancelarAsistencia(eventoId, socioId, button);
            } else {
                await confirmarAsistencia(eventoId, socioId, button);
            }
        }
    });
    
    console.log('Event listeners configurados');
}

function configurarTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover active de todos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activar el clickeado
            this.classList.add('active');
            const tabName = this.dataset.tab;
            const tabContent = document.getElementById(`tab-${tabName}`);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
}

// ============================================================================
// 10. CONFIRMAR ASISTENCIA (CORREGIDO - USA asistencias_eventos)
// ============================================================================

async function confirmarAsistencia(eventoId, socioId, button) {
    console.log('========================================');
    console.log('CONFIRMANDO ASISTENCIA');
    console.log('========================================');
    console.log('Socio ID:', socioId);
    console.log('Evento ID:', eventoId);
    
    const card = button.closest('.evento-card-socio');
    const eventoTitulo = card.querySelector('.evento-titulo-socio').textContent;
    
    if (!confirm(`¿Confirmar asistencia a "${eventoTitulo}"?`)) {
        return;
    }
    
    // Deshabilitar botón y mostrar loader
    button.disabled = true;
    const textoOriginal = button.textContent;
    button.innerHTML = '<span class="loader-small"></span> Procesando...';
    
    try {
        // PASO 1: Verificar que el evento existe y tiene cupo
        console.log('\n PASO 1: Verificando evento...');
        const { data: evento, error: errorEvento } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('id', eventoId)
            .single();
        
        if (errorEvento) throw errorEvento;
        
        console.log('Evento encontrado:', evento.titulo);
        console.log('Cupo:', evento.asistentes_confirmados, '/', evento.cupo_maximo);
        
        // Verificar cupo disponible
        if (evento.asistentes_confirmados >= evento.cupo_maximo) {
            mostrarMensajeError('Lo sentimos, el evento ya alcanzó su cupo máximo');
            button.disabled = false;
            button.textContent = textoOriginal;
            return;
        }
        
        // PASO 2: Verificar si ya está registrado
        console.log('\n PASO 2: Verificando si ya está registrado...');
        const { data: asistenciaExistente, error: errorCheck } = await window.supabaseClient
            .from('asistencias_eventos')
            .select('*')
            .eq('socio_id', socioId)
            .eq('evento_id', eventoId)
            .maybeSingle();
        
        if (errorCheck) throw errorCheck;
        
        if (asistenciaExistente) {
            console.log(' Ya está registrado');
            mostrarMensajeError('Ya tienes confirmada la asistencia a este evento');
            button.disabled = false;
            button.textContent = textoOriginal;
            return;
        }
        
        console.log(' No está registrado, procediendo...');
        
        // PASO 3: Insertar asistencia
        console.log('\n PASO 3: Insertando asistencia...');
        const { data: nuevaAsistencia, error: errorInsert } = await window.supabaseClient
            .from('asistencias_eventos')
            .insert([{
                socio_id: socioId,
                evento_id: eventoId,
                estado: 'confirmado',
                fecha_registro: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (errorInsert) {
            console.error(' Error al insertar:', errorInsert);
            throw errorInsert;
        }
        
        console.log('Asistencia insertada:', nuevaAsistencia);
        console.log('¡Asistencia confirmada exitosamente!');
        console.log('========================================\n');
        
        mostrarMensajeExito('¡Asistencia confirmada! Te esperamos en el evento.');
        
        // Actualizar UI
        card.classList.add('registered');
        const header = card.querySelector('.evento-header-socio');
        const registeredBadge = document.createElement('span');
        registeredBadge.className = 'registered-badge';
        registeredBadge.textContent = '✓ Registrado';
        header.appendChild(registeredBadge);
        
        button.textContent = 'Cancelar Asistencia';
        button.classList.add('cancel');
        button.disabled = false;
        
        // Actualizar contador de asistentes
        actualizarContadorAsistentesUI(card, 1);
        
    } catch (error) {
        console.error('ERROR AL CONFIRMAR ASISTENCIA:', error);
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        console.log('========================================\n');
        
        mostrarMensajeError('Error al confirmar asistencia: ' + error.message);
        button.disabled = false;
        button.textContent = textoOriginal;
    }
}

// ============================================
// 11. CANCELAR ASISTENCIA (CORREGIDO - USA asistencias_eventos)
// ============================================

async function cancelarAsistencia(eventoId, socioId, button) {
    const card = button.closest('.evento-card-socio');
    const eventoTitulo = card.querySelector('.evento-titulo-socio').textContent;
    
    if (!confirm(`¿Estás seguro de cancelar tu asistencia a "${eventoTitulo}"?`)) {
        return;
    }
    
    // Deshabilitar botón y mostrar loader
    button.disabled = true;
    const textoOriginal = button.textContent;
    button.innerHTML = '<span class="loader-small"></span> Procesando...';
    
    try {
        console.log('Cancelando asistencia...');
        console.log('Socio:', socioId);
        console.log('Evento:', eventoId);
        
        const { error } = await window.supabaseClient
            .from('asistencias_eventos')
            .delete()
            .eq('socio_id', socioId)
            .eq('evento_id', eventoId);
        
        if (error) throw error;
        
        console.log('Asistencia cancelada');
        
        mostrarMensajeExito('Asistencia cancelada exitosamente.');
        
        // Actualizar UI
        card.classList.remove('registered');
        const registeredBadge = card.querySelector('.registered-badge');
        if (registeredBadge) {
            registeredBadge.remove();
        }
        
        button.textContent = 'Confirmar Asistencia';
        button.classList.remove('cancel');
        button.disabled = false;
        
        // Actualizar contador de asistentes
        actualizarContadorAsistentesUI(card, -1);
        
    } catch (error) {
        console.error('Error al cancelar:', error);
        mostrarMensajeError('Error al cancelar asistencia. Intenta nuevamente.');
        button.disabled = false;
        button.textContent = textoOriginal;
    }
}

// [CONTINÚA EN PARTE 3...]

// ============================================================================
// 12. ACTUALIZAR CONTADOR DE ASISTENTES EN UI
// ============================================================================

function actualizarContadorAsistentesUI(card, incremento) {
    const detalles = card.querySelectorAll('.detalle-item-socio');
    const asistentesDetalle = Array.from(detalles).find(d => d.textContent.includes('asistentes confirmados'));
    
    if (!asistentesDetalle) return;
    
    const span = asistentesDetalle.querySelector('span');
    if (!span) return;
    
    const texto = span.textContent;
    const match = texto.match(/(\d+)\s*\/\s*(\d+)/);
    
    if (match) {
        const actual = parseInt(match[1]) + incremento;
        const maximo = parseInt(match[2]);
        span.textContent = `${actual} / ${maximo} asistentes confirmados`;
    }
}

// ============================================================================
// 13. FUNCIONES AUXILIARES
// ============================================================================

function obtenerBadgeCategoria(categoria) {
    const badges = {
        'Medio Ambiente': { clase: 'medio-ambiente', texto: 'Medio Ambiente' },
        'Deportes': { clase: 'deportes', texto: 'Deportes' },
        'Cultura': { clase: 'cultura', texto: 'Cultura' },
        'Emprendimiento': { clase: 'emprendimiento', texto: 'Emprendimiento' },
        'Salud': { clase: 'salud', texto: 'Salud' },
        'Educación': { clase: 'educacion', texto: 'Educación' },
        'Otro': { clase: 'otro', texto: 'Otro' }
    };
    
    return badges[categoria] || { clase: '', texto: categoria };
}

function formatearFechaCompleta(fecha) {
    const date = new Date(fecha + 'T00:00:00');
    const opciones = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    return date.toLocaleDateString('es-MX', opciones);
}

// ============================================================================
// 14. FUNCIONES DE UI - MENSAJES
// ============================================================================

function mostrarMensajeError(mensaje) {
    mostrarMensaje(mensaje, 'error');
}

function mostrarMensajeExito(mensaje) {
    mostrarMensaje(mensaje, 'success');
}

function mostrarMensaje(mensaje, tipo) {
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
// 15. ESTILOS ADICIONALES
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
    
    .loader-small {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .attended {
        color: #15803d;
        font-weight: 500;
    }
    
    .not-attended {
        color: #dc2626;
        font-weight: 500;
    }
    
    .btn-evento-action-socio:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .evento-card-socio.registered {
        border-color: #15803d;
    }
    
    /* Estilos para eventos en curso */
    .evento-card-socio.en-curso {
        border-left: 4px solid #f59e0b;
        background: linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%);
    }
    
    .estado-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-left: 0.5rem;
    }
    
    .estado-proximo {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .estado-en-curso {
        background: #fef3c7;
        color: #92400e;
        animation: pulse 2s infinite;
    }
    
    .estado-completado {
        background: #d1fae5;
        color: #065f46;
    }
    
    .en-curso-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 1rem;
    }
    
    .en-curso-notice {
        font-size: 0.875rem;
        color: #92400e;
        text-align: center;
        font-weight: 500;
        padding: 0.5rem;
        background: #fef3c7;
        border-radius: 6px;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .registered-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        background: #d1fae5;
        color: #065f46;
        margin-left: 0.5rem;
    }
`;
document.head.appendChild(style);

console.log('Sistema de eventos para socios cargado completamente');
console.log('Tabla: asistencias_eventos');
console.log('Estados: proximo, activo, completado');
console.log('Abre consola (F12) para ver logs detallados');