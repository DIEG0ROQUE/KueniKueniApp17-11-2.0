// socio-calendario.js - RENOVADO con mejores prácticas UI/UX
// ============================================================================

let mesActual = new Date();
let diaSeleccionado = null;
let todosEventos = [];
let eventosFiltrados = [];
let socioIdGlobal = null;
let filtroActivo = 'all';
let vistaActual = 'calendar';

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎯 Inicializando calendario renovado...');
    
    if (!verificarSesion()) {
        window.location.href = 'login.html';
        return;
    }
    
    if (!window.supabaseClient) {
        mostrarMensaje('Error de configuración', 'error');
        return;
    }
    
    socioIdGlobal = sessionStorage.getItem('socioId');
    
    await inicializarCalendario();
    configurarEventListeners();
    configurarNavegacionTeclado();
});

function verificarSesion() {
    return sessionStorage.getItem('isLoggedIn') === 'true' && 
           sessionStorage.getItem('userType') === 'socio';
}

async function inicializarCalendario() {
    try {
        await actualizarEstados();
        await cargarEventos();
        inicializarSelectores();
        aplicarFiltro();
        renderizarCalendario();
        actualizarEstadisticas();
        
        console.log('✅ Calendario listo');
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarMensaje('Error al cargar el calendario', 'error');
    }
}

async function actualizarEstados() {
    const hoy = new Date().toISOString().split('T')[0];
    
    await window.supabaseClient
        .from('eventos')
        .update({ estado: 'completado' })
        .lt('fecha_evento', hoy)
        .neq('estado', 'completado');
    
    await window.supabaseClient
        .from('eventos')
        .update({ estado: 'activo' })
        .eq('fecha_evento', hoy)
        .neq('estado', 'activo');
    
    await window.supabaseClient
        .from('eventos')
        .update({ estado: 'proximo' })
        .gt('fecha_evento', hoy)
        .neq('estado', 'proximo');
}

async function cargarEventos() {
    const { data: eventos, error } = await window.supabaseClient
        .from('eventos')
        .select('*')
        .order('fecha_evento', { ascending: true });
    
    if (error || !eventos) {
        todosEventos = [];
        eventosFiltrados = [];
        return;
    }
    
    todosEventos = await Promise.all(
        eventos.map(async (evento) => {
            const { data: asistencia } = await window.supabaseClient
                .from('asistencias_eventos')
                .select('estado')
                .eq('evento_id', evento.id)
                .eq('socio_id', socioIdGlobal)
                .maybeSingle();
            
            return {
                ...evento,
                registrado: asistencia?.estado === 'confirmado'
            };
        })
    );
    
    eventosFiltrados = [...todosEventos];
    console.log(`📅 ${todosEventos.length} eventos cargados`);
}

// ============================================================================
// SELECTORES DE MES Y AÑO
// ============================================================================

function inicializarSelectores() {
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    
    // Poblar meses
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    monthSelect.innerHTML = meses.map((mes, i) => 
        `<option value="${i}" ${i === mesActual.getMonth() ? 'selected' : ''}>${mes}</option>`
    ).join('');
    
    // Poblar años (2020-2030)
    const anoActual = new Date().getFullYear();
    yearSelect.innerHTML = Array.from({length: 11}, (_, i) => {
        const year = 2020 + i;
        return `<option value="${year}" ${year === mesActual.getFullYear() ? 'selected' : ''}>${year}</option>`;
    }).join('');
    
    monthSelect.addEventListener('change', (e) => {
        mesActual.setMonth(parseInt(e.target.value));
        renderizarCalendario();
        actualizarEstadisticas();
    });
    
    yearSelect.addEventListener('change', (e) => {
        mesActual.setFullYear(parseInt(e.target.value));
        renderizarCalendario();
        actualizarEstadisticas();
    });
}

// ============================================================================
// FILTROS
// ============================================================================

function aplicarFiltro() {
    if (filtroActivo === 'all') {
        eventosFiltrados = [...todosEventos];
    } else if (filtroActivo === 'mis-eventos') {
        eventosFiltrados = todosEventos.filter(e => e.registrado);
    } else {
        eventosFiltrados = todosEventos.filter(e => e.categoria === filtroActivo);
    }
}

function cambiarFiltro(filtro) {
    filtroActivo = filtro;
    aplicarFiltro();
    renderizarCalendario();
    actualizarEstadisticas();
    
    if (vistaActual === 'list') {
        renderizarVistaLista();
    }
}

// ============================================================================
// RENDERIZADO DEL CALENDARIO
// ============================================================================

function renderizarCalendario() {
    const mes = mesActual.getMonth();
    const ano = mesActual.getFullYear();
    
    // Actualizar selectores
    document.getElementById('month-select').value = mes;
    document.getElementById('year-select').value = ano;
    
    const primerDia = new Date(ano, mes, 1);
    const diasMes = new Date(ano, mes + 1, 0).getDate();
    const diaSemanaInicio = primerDia.getDay();
    
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    // Crear contenedor de headers
    const headersContainer = document.createElement('div');
    headersContainer.className = 'day-headers';
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    diasSemana.forEach(dia => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = dia;
        headersContainer.appendChild(header);
    });
    grid.appendChild(headersContainer);
    
    // Crear contenedor de días
    const daysContainer = document.createElement('div');
    daysContainer.className = 'days-grid';
    
    // Días mes anterior
    const ultimoDiaMesAnterior = new Date(ano, mes, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
        daysContainer.appendChild(crearCeldaDia(ultimoDiaMesAnterior - i, mes - 1, ano, true));
    }
    
    // Días mes actual
    const hoy = new Date();
    for (let dia = 1; dia <= diasMes; dia++) {
        const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && ano === hoy.getFullYear();
        daysContainer.appendChild(crearCeldaDia(dia, mes, ano, false, esHoy));
    }
    
    // Días mes siguiente
    const totalCeldas = daysContainer.children.length;
    const celdasRestantes = Math.ceil(totalCeldas / 7) * 7 - totalCeldas;
    for (let dia = 1; dia <= celdasRestantes; dia++) {
        daysContainer.appendChild(crearCeldaDia(dia, mes + 1, ano, true));
    }
    
    grid.appendChild(daysContainer);
}

function crearCeldaDia(dia, mes, ano, otroMes = false, esHoy = false) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (otroMes) cell.classList.add('other-month');
    if (esHoy) cell.classList.add('today');
    
    const fecha = new Date(ano, mes, dia);
    const fechaStr = fecha.toISOString().split('T')[0];
    cell.dataset.fecha = fechaStr;
    
    const numero = document.createElement('div');
    numero.className = 'day-number';
    numero.textContent = dia;
    cell.appendChild(numero);
    
    const eventosDelDia = eventosFiltrados.filter(e => e.fecha_evento === fechaStr);
    
    if (eventosDelDia.length > 0) {
        cell.classList.add('has-events');
        
        // Indicador de evento registrado
        const tieneRegistrado = eventosDelDia.some(e => e.registrado);
        if (tieneRegistrado) {
            const indicator = document.createElement('div');
            indicator.className = 'registered-indicator';
            indicator.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="white"/></svg>';
            cell.appendChild(indicator);
        }
        
        // Dots de eventos
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'event-dots';
        
        const categoriasUnicas = [...new Set(eventosDelDia.map(e => e.categoria))];
        categoriasUnicas.slice(0, 5).forEach(cat => {
            const dot = document.createElement('div');
            const badge = getBadge(cat);
            dot.className = `event-dot ${badge.clase}`;
            dot.title = cat;
            dotsContainer.appendChild(dot);
        });
        
        cell.appendChild(dotsContainer);
        
        // Contador
        if (eventosDelDia.length > 0) {
            const count = document.createElement('div');
            count.className = 'event-count';
            count.textContent = `${eventosDelDia.length} evento${eventosDelDia.length !== 1 ? 's' : ''}`;
            cell.appendChild(count);
        }
    }
    
    cell.addEventListener('click', () => seleccionarDia(fechaStr, cell));
    
    return cell;
}

// ============================================================================
// SELECCIÓN DE DÍA Y DETALLES
// ============================================================================

function seleccionarDia(fecha, cell) {
    document.querySelectorAll('.day-cell.selected').forEach(c => {
        c.classList.remove('selected');
    });
    
    cell.classList.add('selected');
    diaSeleccionado = fecha;
    
    mostrarDetallesDia(fecha);
}

function mostrarDetallesDia(fecha) {
    const eventosDelDia = eventosFiltrados.filter(e => e.fecha_evento === fecha);
    
    const panel = document.getElementById('details-panel');
    const content = document.getElementById('details-content');
    const dateElement = document.getElementById('details-date');
    
    const fechaObj = new Date(fecha + 'T00:00:00');
    dateElement.textContent = fechaObj.toLocaleDateString('es-MX', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });
    
    if (eventosDelDia.length === 0) {
        content.innerHTML = `
            <div class="empty-details">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" fill="#d4d4d8"/></svg>
                <p>No hay eventos programados para este día</p>
            </div>
        `;
    } else {
        content.innerHTML = eventosDelDia.map(evento => {
            const badge = getBadge(evento.categoria);
            return `
                <div class="event-detail-card">
                    <div class="event-detail-header">
                        <div class="event-badges">
                            <span class="badge ${badge.clase}">${badge.texto}</span>
                            ${evento.registrado ? '<span class="badge registered">✓ Registrado</span>' : ''}
                        </div>
                    </div>
                    <h4 class="event-detail-title">${evento.titulo}</h4>
                    <p class="event-detail-desc">${evento.descripcion}</p>
                    <div class="event-detail-meta">
                        <div class="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 13H11v-6h1.5v6zm0-8H11V5h1.5v2z" fill="currentColor"/></svg>
                            <span>${evento.hora_evento.substring(0, 5)} hrs</span>
                        </div>
                        <div class="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/></svg>
                            <span>${evento.ubicacion}</span>
                        </div>
                        <div class="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/></svg>
                            <span>${evento.asistentes_confirmados}/${evento.cupo_maximo}</span>
                        </div>
                        <div class="meta-item">
                            <span class="badge ${evento.estado === 'proximo' ? 'deportes' : evento.estado === 'activo' ? 'emprendimiento' : 'ambiente'}">${formatearEstado(evento.estado)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    panel.classList.add('show');
}

function cerrarDetalles() {
    const panel = document.getElementById('details-panel');
    panel.classList.remove('show');
    
    document.querySelectorAll('.day-cell.selected').forEach(c => {
        c.classList.remove('selected');
    });
    
    diaSeleccionado = null;
}

// ============================================================================
// VISTA LISTA
// ============================================================================

function renderizarVistaLista() {
    const container = document.getElementById('events-list-container');
    
    if (eventosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="empty-details" style="padding: 4rem 2rem;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" fill="#d4d4d8"/></svg>
                <p>No hay eventos que mostrar</p>
            </div>
        `;
        return;
    }
    
    // Agrupar por mes
    const eventosPorMes = {};
    eventosFiltrados.forEach(evento => {
        const fecha = new Date(evento.fecha_evento);
        const mesKey = `${fecha.getFullYear()}-${fecha.getMonth()}`;
        if (!eventosPorMes[mesKey]) {
            eventosPorMes[mesKey] = [];
        }
        eventosPorMes[mesKey].push(evento);
    });
    
    container.innerHTML = Object.keys(eventosPorMes).map(mesKey => {
        const [year, month] = mesKey.split('-');
        const mesNombre = new Date(year, month, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
        const eventos = eventosPorMes[mesKey];
        
        return `
            <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #18181b; margin-bottom: 1rem; text-transform: capitalize;">${mesNombre}</h3>
                ${eventos.map(evento => {
                    const badge = getBadge(evento.categoria);
                    const fecha = new Date(evento.fecha_evento);
                    return `
                        <div class="event-list-item" style="cursor: pointer;" onclick="irAEvento('${evento.fecha_evento}')">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                <div>
                                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                                        <span class="badge ${badge.clase}">${badge.texto}</span>
                                        ${evento.registrado ? '<span class="badge registered">✓ Registrado</span>' : ''}
                                    </div>
                                    <h4 style="font-size: 1.125rem; font-weight: 600; color: #18181b; margin: 0 0 0.25rem 0;">${evento.titulo}</h4>
                                    <p style="color: #71717a; margin: 0;">${evento.descripcion}</p>
                                </div>
                                <div style="text-align: right; min-width: 80px;">
                                    <div style="font-size: 1.5rem; font-weight: 700; color: #5f0d51;">${fecha.getDate()}</div>
                                    <div style="font-size: 0.875rem; color: #71717a;">${fecha.toLocaleDateString('es-MX', { weekday: 'short' })}</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: #71717a;">
                                <div style="display: flex; align-items: center; gap: 0.25rem;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 13H11v-6h1.5v6zm0-8H11V5h1.5v2z" fill="currentColor"/></svg>
                                    ${evento.hora_evento.substring(0, 5)}
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.25rem;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/></svg>
                                    ${evento.ubicacion}
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.25rem;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/></svg>
                                    ${evento.asistentes_confirmados}/${evento.cupo_maximo}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }).join('');
}

function irAEvento(fechaStr) {
    // Cambiar a vista calendario
    document.querySelector('[data-view="calendar"]').click();
    
    // Ir a la fecha
    const fecha = new Date(fechaStr + 'T00:00:00');
    mesActual = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    renderizarCalendario();
    
    setTimeout(() => {
        const cell = document.querySelector(`[data-fecha="${fechaStr}"]`);
        if (cell) {
            seleccionarDia(fechaStr, cell);
            cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

function actualizarEstadisticas() {
    const mes = mesActual.getMonth();
    const ano = mesActual.getFullYear();
    
    const eventosMes = eventosFiltrados.filter(e => {
        const fecha = new Date(e.fecha_evento);
        return fecha.getMonth() === mes && fecha.getFullYear() === ano;
    });
    
    const misEventosMes = eventosMes.filter(e => e.registrado);
    
    const hoy = new Date();
    const proximos3Dias = new Date(hoy);
    proximos3Dias.setDate(proximos3Dias.getDate() + 3);
    
    const proximosTres = eventosFiltrados.filter(e => {
        const fecha = new Date(e.fecha_evento);
        return fecha >= hoy && fecha <= proximos3Dias;
    });
    
    document.getElementById('total-eventos-mes').textContent = eventosMes.length;
    document.getElementById('mis-eventos-mes').textContent = misEventosMes.length;
    document.getElementById('proximos-3').textContent = proximosTres.length;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function configurarEventListeners() {
    // Navegación del calendario
    document.getElementById('btn-prev').addEventListener('click', () => {
        mesActual.setMonth(mesActual.getMonth() - 1);
        renderizarCalendario();
        actualizarEstadisticas();
    });
    
    document.getElementById('btn-next').addEventListener('click', () => {
        mesActual.setMonth(mesActual.getMonth() + 1);
        renderizarCalendario();
        actualizarEstadisticas();
    });
    
    document.getElementById('btn-today').addEventListener('click', () => {
        mesActual = new Date();
        renderizarCalendario();
        actualizarEstadisticas();
        
        const hoy = new Date().toISOString().split('T')[0];
        const cellHoy = document.querySelector(`[data-fecha="${hoy}"]`);
        if (cellHoy) {
            seleccionarDia(hoy, cellHoy);
        }
    });
    
    // Toggle de vista
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const vista = btn.dataset.view;
            vistaActual = vista;
            
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (vista === 'calendar') {
                document.getElementById('calendar-view').style.display = 'block';
                document.getElementById('list-view').style.display = 'none';
            } else {
                document.getElementById('calendar-view').style.display = 'none';
                document.getElementById('list-view').style.display = 'block';
                renderizarVistaLista();
            }
        });
    });
    
    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filtro = btn.dataset.filter;
            
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            cambiarFiltro(filtro);
        });
    });
    
    // Cerrar detalles
    document.getElementById('btn-close-details').addEventListener('click', cerrarDetalles);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('¿Cerrar sesión?')) {
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });
}

function configurarNavegacionTeclado() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            mesActual.setMonth(mesActual.getMonth() - 1);
            renderizarCalendario();
            actualizarEstadisticas();
        } else if (e.key === 'ArrowRight') {
            mesActual.setMonth(mesActual.getMonth() + 1);
            renderizarCalendario();
            actualizarEstadisticas();
        } else if (e.key === 'Escape') {
            cerrarDetalles();
        }
    });
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function getBadge(categoria) {
    const badges = {
        'Medio Ambiente': { clase: 'ambiente', texto: 'Ambiente' },
        'Deportes': { clase: 'deportes', texto: 'Deportes' },
        'Cultura': { clase: 'cultura', texto: 'Cultura' },
        'Emprendimiento': { clase: 'emprendimiento', texto: 'Emprendimiento' },
        'Salud': { clase: 'salud', texto: 'Salud' },
        'Educación': { clase: 'educacion', texto: 'Educación' }
    };
    return badges[categoria] || { clase: '', texto: categoria };
}

function formatearEstado(estado) {
    const estados = {
        'proximo': 'Próximo',
        'activo': 'En Curso',
        'completado': 'Completado'
    };
    return estados[estado] || estado;
}

function mostrarMensaje(mensaje, tipo) {
    console.log(`${tipo === 'error' ? '❌' : '✅'} ${mensaje}`);
    
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${tipo === 'error' ? '#fee2e2' : '#d1fae5'};
        color: ${tipo === 'error' ? '#dc2626' : '#065f46'};
        border: 1px solid ${tipo === 'error' ? '#fecaca' : '#a7f3d0'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    container.textContent = mensaje;
    document.body.appendChild(container);
    
    setTimeout(() => {
        container.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => container.remove(), 300);
    }, 3000);
}

// Exponer funciones globales
window.irAEvento = irAEvento;

console.log('🎨 Calendario renovado cargado correctamente');