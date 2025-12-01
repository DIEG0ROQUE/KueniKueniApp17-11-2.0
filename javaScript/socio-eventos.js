// ==================================================
// SOCIO-EVENTOS.JS CON PAGINACIÓN MEJORADA
// ==================================================

// Variables globales
let todosLosEventosProximos = [];
let todosLosEventosEnCurso = [];
let todosLosEventosPasados = [];

// Configuración de paginación
const EVENTOS_POR_PAGINA = 6;
let paginaActual = {
    proximos: 1,
    enCurso: 1,
    pasados: 1
};

let socioIdGlobal = null;

// ==================================================
// INICIALIZACIÓN
// ==================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando página de eventos...');
    
    if (!verificarSesion()) {
        window.location.href = 'login.html';
        return;
    }
    
    const socioId = sessionStorage.getItem('socioId');
    socioIdGlobal = socioId;
    
    await cargarTodosLosEventos(socioId);
    configurarTabs();
    configurarEventListeners();
});

function verificarSesion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    return (isLoggedIn === 'true' && userType === 'socio');
}

// ==================================================
// CARGAR TODOS LOS EVENTOS
// ==================================================

async function cargarTodosLosEventos(socioId) {
    mostrarLoaders();
    
    try {
        const fechaHoy = new Date().toISOString().split('T')[0];
        
        // Cargar eventos próximos
        const { data: proximos, error: errorProximos } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .gte('fecha_evento', fechaHoy)
            .eq('estado', 'proximo')
            .order('fecha_evento', { ascending: true });
        
        if (errorProximos) {
            console.error('Error al cargar eventos próximos:', errorProximos);
        } else {
            todosLosEventosProximos = await agregarEstadoAsistencia(proximos, socioId);
            document.getElementById('contadorProximos').textContent = todosLosEventosProximos.length;
        }
        
        // Cargar eventos en curso
        const { data: enCurso, error: errorEnCurso } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('estado', 'activo')
            .order('fecha_evento', { ascending: true });
        
        if (errorEnCurso) {
            console.error('Error al cargar eventos en curso:', errorEnCurso);
        } else {
            todosLosEventosEnCurso = await agregarEstadoAsistencia(enCurso, socioId);
            document.getElementById('contadorEnCurso').textContent = todosLosEventosEnCurso.length;
        }
        
        // Cargar eventos pasados
        const { data: pasados, error: errorPasados } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .lt('fecha_evento', fechaHoy)
            .order('fecha_evento', { ascending: false });
        
        if (errorPasados) {
            console.error('Error al cargar eventos pasados:', errorPasados);
        } else {
            todosLosEventosPasados = await agregarEstadoAsistencia(pasados, socioId);
            document.getElementById('contadorPasados').textContent = todosLosEventosPasados.length;
        }
        
        // Mostrar primera página de eventos próximos
        mostrarEventosPaginados('proximos', 1);
        
    } catch (error) {
        console.error('Error al cargar eventos:', error);
    } finally {
        ocultarLoaders();
    }
}

async function agregarEstadoAsistencia(eventos, socioId) {
    if (!eventos || eventos.length === 0) return [];
    
    return await Promise.all(
        eventos.map(async (evento) => {
            const { data: asistencia } = await window.supabaseClient
                .from('asistencias')
                .select('estado_asistencia')
                .eq('evento_id', evento.id)
                .eq('socio_id', socioId)
                .maybeSingle();
            
            return {
                ...evento,
                asistenciaConfirmada: asistencia ? asistencia.estado_asistencia : null
            };
        })
    );
}

// ==================================================
// MOSTRAR EVENTOS PAGINADOS
// ==================================================

function mostrarEventosPaginados(tipoTab, pagina) {
    let eventos = [];
    let gridId = '';
    let paginacionId = '';
    
    // Seleccionar datos según pestaña
    switch(tipoTab) {
        case 'proximos':
            eventos = todosLosEventosProximos;
            gridId = 'eventosProximosGrid';
            paginacionId = 'paginacionProximos';
            break;
        case 'enCurso':
            eventos = todosLosEventosEnCurso;
            gridId = 'eventosEnCursoGrid';
            paginacionId = 'paginacionEnCurso';
            break;
        case 'pasados':
            eventos = todosLosEventosPasados;
            gridId = 'eventosPasadosGrid';
            paginacionId = 'paginacionPasados';
            break;
    }
    
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    // Calcular paginación
    const totalEventos = eventos.length;
    const totalPaginas = Math.ceil(totalEventos / EVENTOS_POR_PAGINA);
    const inicio = (pagina - 1) * EVENTOS_POR_PAGINA;
    const fin = inicio + EVENTOS_POR_PAGINA;
    const eventosPagina = eventos.slice(inicio, fin);
    
    // Mostrar eventos
    if (eventosPagina.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-eventos">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="#cbd5e1"/>
                </svg>
                <h3>No hay eventos ${tipoTab === 'proximos' ? 'próximos' : tipoTab === 'enCurso' ? 'en curso' : 'pasados'}</h3>
                <p>Por el momento no hay eventos en esta categoría</p>
            </div>
        `;
    } else {
        grid.innerHTML = eventosPagina.map(evento => crearTarjetaEvento(evento, tipoTab)).join('');
        configurarBotonesAsistencia();
    }
    
    // Mostrar controles de paginación
    mostrarControlesPaginacion(tipoTab, pagina, totalPaginas, totalEventos, paginacionId);
}

// ==================================================
// CREAR TARJETA DE EVENTO
// ==================================================

function crearTarjetaEvento(evento, tipoTab) {
    const badge = obtenerBadgeCategoria(evento.categoria);
    const cupoDisponible = evento.cupo_maximo - evento.asistentes_confirmados;
    const porcentajeCupo = ((evento.asistentes_confirmados / evento.cupo_maximo) * 100).toFixed(0);
    const botonEstado = obtenerBotonAsistencia(evento.asistenciaConfirmada, tipoTab);
    
    return `
        <div class="event-card-simple" data-evento-id="${evento.id}">
            <div class="event-card-header-simple">
                <span class="event-badge ${badge.clase}">${badge.texto}</span>
                ${tipoTab === 'proximos' ? '<span class="event-status-badge">Próximo</span>' : ''}
                ${tipoTab === 'enCurso' ? '<span class="event-status-badge event-status-encurso">En Curso</span>' : ''}
                ${tipoTab === 'pasados' ? '<span class="event-status-badge event-status-pasado">Pasado</span>' : ''}
                ${evento.asistenciaConfirmada === 'confirmado' ? '<span class="event-registered-badge">✓ Registrado</span>' : ''}
            </div>
            
            <div class="event-card-content">
                <h3 class="event-card-title">${evento.titulo}</h3>
                <p class="event-card-description">${evento.descripcion}</p>
                
                <div class="event-card-details">
                    <div class="event-detail-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="currentColor"/>
                        </svg>
                        <span>${formatearFechaEvento(evento.fecha_evento)}</span>
                    </div>
                    
                    <div class="event-detail-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" fill="currentColor"/>
                        </svg>
                        <span>${evento.hora_evento.substring(0, 5)}</span>
                    </div>
                    
                    <div class="event-detail-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                        </svg>
                        <span>${evento.ubicacion}</span>
                    </div>
                    
                    <div class="event-detail-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
                        </svg>
                        <span>${evento.asistentes_confirmados} / ${evento.cupo_maximo} asistentes confirmados</span>
                    </div>
                </div>
                
                ${tipoTab !== 'pasados' ? `
                    <button 
                        class="btn-event-modern ${botonEstado.clase}" 
                        data-evento-id="${evento.id}"
                        data-socio-id="${socioIdGlobal}"
                        data-accion="${botonEstado.accion}"
                        ${botonEstado.deshabilitado || cupoDisponible === 0 ? 'disabled' : ''}
                    >
                        ${cupoDisponible === 0 ? '🔒 Cupo Lleno' : botonEstado.texto}
                    </button>
                ` : `
                    <div class="event-estado-pasado">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                        </svg>
                        <span>Evento finalizado</span>
                    </div>
                `}
            </div>
        </div>
    `;
}

// ==================================================
// CONTROLES DE PAGINACIÓN
// ==================================================

function mostrarControlesPaginacion(tipoTab, paginaActualNum, totalPaginas, totalEventos, containerId) {
    // Buscar o crear contenedor de paginación
    let container = document.getElementById(containerId);
    
    if (!container) {
        // Crear contenedor si no existe
        const tabContent = document.getElementById(`tab-${tipoTab.replace('enCurso', 'en-curso')}`);
        if (!tabContent) return;
        
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'pagination-container';
        tabContent.appendChild(container);
    }
    
    if (totalPaginas <= 1) {
        container.innerHTML = '';
        return;
    }
    
    // Calcular rango de eventos mostrados
    const inicio = ((paginaActualNum - 1) * EVENTOS_POR_PAGINA) + 1;
    const fin = Math.min(paginaActualNum * EVENTOS_POR_PAGINA, totalEventos);
    
    // Generar botones de páginas
    let botonesPaginas = '';
    const maxBotones = 5;
    let paginaInicio = Math.max(1, paginaActualNum - Math.floor(maxBotones / 2));
    let paginaFin = Math.min(totalPaginas, paginaInicio + maxBotones - 1);
    
    if (paginaFin - paginaInicio < maxBotones - 1) {
        paginaInicio = Math.max(1, paginaFin - maxBotones + 1);
    }
    
    for (let i = paginaInicio; i <= paginaFin; i++) {
        botonesPaginas += `
            <button class="pagination-btn ${i === paginaActualNum ? 'active' : ''}" 
                    onclick="cambiarPagina('${tipoTab}', ${i})"
                    ${i === paginaActualNum ? 'disabled' : ''}>
                ${i}
            </button>
        `;
    }
    
    container.innerHTML = `
        <div class="pagination-info">
            Mostrando ${inicio}-${fin} de ${totalEventos} eventos
        </div>
        <div class="pagination-controls">
            <button class="pagination-btn pagination-prev" 
                    onclick="cambiarPagina('${tipoTab}', ${paginaActualNum - 1})"
                    ${paginaActualNum === 1 ? 'disabled' : ''}>
                ◄ Anterior
            </button>
            
            ${botonesPaginas}
            
            <button class="pagination-btn pagination-next" 
                    onclick="cambiarPagina('${tipoTab}', ${paginaActualNum + 1})"
                    ${paginaActualNum === totalPaginas ? 'disabled' : ''}>
                Siguiente ►
            </button>
        </div>
    `;
}

// ==================================================
// CAMBIAR PÁGINA
// ==================================================

function cambiarPagina(tipoTab, nuevaPagina) {
    paginaActual[tipoTab] = nuevaPagina;
    mostrarEventosPaginados(tipoTab, nuevaPagina);
    
    // Scroll suave al inicio de la lista
    const tabContent = document.getElementById(`tab-${tipoTab.replace('enCurso', 'en-curso')}`);
    if (tabContent) {
        tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Hacer función global para onclick
window.cambiarPagina = cambiarPagina;

// ==================================================
// CONFIGURAR TABS
// ==================================================

function configurarTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Actualizar botones activos
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Actualizar contenido activo
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const activeContent = document.getElementById(`tab-${tabName}`);
            if (activeContent) {
                activeContent.classList.add('active');
                
                // Cargar eventos de la pestaña
                const tipoTab = tabName === 'en-curso' ? 'enCurso' : tabName;
                mostrarEventosPaginados(tipoTab, paginaActual[tipoTab]);
            }
        });
    });
}

// ==================================================
// ASISTENCIA A EVENTOS
// ==================================================

function configurarBotonesAsistencia() {
    const botones = document.querySelectorAll('.btn-event-modern');
    
    botones.forEach(boton => {
        boton.addEventListener('click', async function() {
            const eventoId = this.dataset.eventoId;
            const socioId = this.dataset.socioId;
            const accion = this.dataset.accion;
            
            if (eventoId && socioId && accion) {
                await manejarAsistenciaEvento(eventoId, socioId, accion, this);
            }
        });
    });
}

async function manejarAsistenciaEvento(eventoId, socioId, accion, boton) {
    boton.disabled = true;
    const textoOriginal = boton.innerHTML;
    boton.innerHTML = '<span class="loader-btn"></span> Procesando...';
    
    try {
        if (accion === 'confirmar') {
            const { error } = await window.supabaseClient
                .from('asistencias')
                .insert({
                    evento_id: eventoId,
                    socio_id: socioId,
                    estado_asistencia: 'confirmado',
                    fecha_confirmacion: new Date().toISOString()
                });
            
            if (error) {
                console.error('Error:', error);
                mostrarMensaje('Error al confirmar asistencia', 'error');
                boton.disabled = false;
                boton.innerHTML = textoOriginal;
                return;
            }
            
            mostrarMensaje('¡Asistencia confirmada!', 'success');
            boton.innerHTML = '✓ Confirmado';
            boton.className = 'btn-event-modern btn-confirmado';
            boton.dataset.accion = 'cancelar';
            boton.disabled = false;
            
        } else if (accion === 'cancelar') {
            if (!confirm('¿Cancelar asistencia?')) {
                boton.disabled = false;
                boton.innerHTML = textoOriginal;
                return;
            }
            
            const { error } = await window.supabaseClient
                .from('asistencias')
                .delete()
                .eq('evento_id', eventoId)
                .eq('socio_id', socioId);
            
            if (error) {
                console.error('Error:', error);
                mostrarMensaje('Error al cancelar', 'error');
                boton.disabled = false;
                boton.innerHTML = textoOriginal;
                return;
            }
            
            mostrarMensaje('Asistencia cancelada', 'success');
            boton.innerHTML = 'Asistir';
            boton.className = 'btn-event-modern';
            boton.dataset.accion = 'confirmar';
            boton.disabled = false;
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error inesperado', 'error');
        boton.disabled = false;
        boton.innerHTML = textoOriginal;
    }
}

// ==================================================
// FUNCIONES AUXILIARES
// ==================================================

function obtenerBadgeCategoria(categoria) {
    const badges = {
        'Medio Ambiente': { clase: 'badge-environment', texto: 'MEDIO AMBIENTE' },
        'Deportes': { clase: 'badge-sports', texto: 'DEPORTE' },
        'Deporte': { clase: 'badge-sports', texto: 'DEPORTE' },
        'Cultura': { clase: 'badge-culture', texto: 'CULTURA' },
        'Emprendimiento': { clase: 'badge-entrepreneurship', texto: 'EMPRENDIMIENTO' },
        'Salud': { clase: 'badge-health', texto: 'SALUD' },
        'Otro': { clase: 'badge-other', texto: 'OTRO' },
        'Educación': { clase: 'badge-education', texto: 'EDUCACIÓN' }
    };
    return badges[categoria] || { clase: 'badge-other', texto: categoria.toUpperCase() };
}

function obtenerBotonAsistencia(estadoAsistencia, tipoTab) {
    if (tipoTab === 'pasados') {
        return { texto: 'Finalizado', clase: 'btn-finalizado', accion: 'ninguna', deshabilitado: true };
    }
    
    if (estadoAsistencia === 'confirmado') {
        return { texto: '✓ Confirmado', clase: 'btn-confirmado', accion: 'cancelar', deshabilitado: false };
    }
    
    return { texto: 'Asistir', clase: '', accion: 'confirmar', deshabilitado: false };
}

function formatearFechaEvento(fecha) {
    const date = new Date(fecha + 'T00:00:00');
    const opciones = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-MX', opciones);
}

function configurarEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Cerrar sesión?')) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }
}

function mostrarLoaders() {
    document.querySelectorAll('.eventos-grid-socio').forEach(grid => {
        grid.innerHTML = `
            <div class="skeleton-event"></div>
            <div class="skeleton-event"></div>
            <div class="skeleton-event"></div>
        `;
    });
}

function ocultarLoaders() {
    // Los loaders se reemplazan al mostrar eventos
}

function mostrarMensaje(mensaje, tipo) {
    const div = document.createElement('div');
    div.className = `message message-${tipo}`;
    div.textContent = mensaje;
    div.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        ${tipo === 'success' ? 'background: #d1fae5; color: #065f46;' : 'background: #fee2e2; color: #dc2626;'}
    `;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 4000);
}

// Estilos de animación
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
    .loader-btn {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
