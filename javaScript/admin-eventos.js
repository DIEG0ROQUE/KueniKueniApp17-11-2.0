// admin-eventos.js - CON SISTEMA DE REGISTRO DE ASISTENCIA Y FILTROS
// ============================================================================

let eventoEditando = null;
let eventoSeleccionadoParaAsistencia = null;

// Arrays globales
let eventosGlobal = [];        // todos los eventos de la BD
let eventosProximos = [];
let eventosEnCurso = [];
let eventosCompletados = [];

// Variables de paginación
let paginaActualProximos = 1;
let paginaActualEnCurso = 1;
let paginaActualCompletados = 1;
let itemsPorPaginaProximos = 6;
let itemsPorPaginaEnCurso = 6;
let itemsPorPaginaCompletados = 6;

// Arrays filtrados para paginación
let eventosFiltradosProximos = [];
let eventosFiltradosEnCurso = [];
let eventosFiltradosCompletados = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Gestión de eventos inicializada');
    
    verificarAutenticacion();
    
    setTimeout(() => {
        if (window.supabaseClient) {
            actualizarEstadosAutomaticamente().then(() => {
                cargarEventos();
            });
        } else {
            console.error('Supabase no disponible');
        }
    }, 500);
    
    document.getElementById('btnNuevoEvento')?.addEventListener('click', abrirModalCrear);
    document.getElementById('formEvento')?.addEventListener('submit', guardarEvento);

    // Filtros de eventos
    document.getElementById('btnAplicarFiltrosEventos')?.addEventListener('click', aplicarFiltrosEventos);
    document.getElementById('btnLimpiarFiltrosEventos')?.addEventListener('click', limpiarFiltrosEventos);

    document.getElementById('filtroBusqueda')?.addEventListener('input', aplicarFiltrosEventos);
    document.getElementById('filtroFechaDesde')?.addEventListener('change', aplicarFiltrosEventos);
    document.getElementById('filtroFechaHasta')?.addEventListener('change', aplicarFiltrosEventos);
    document.getElementById('filtroCategoria')?.addEventListener('change', aplicarFiltrosEventos);
    
    // Modales de asistencia
    document.getElementById('formRegistroAsistencia')?.addEventListener('submit', guardarRegistroAsistencia);
    
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => cambiarTab(tab.dataset.tab));
    });
    
    // Configurar paginación
    configurarPaginacion();
});

// ================= CONFIGURACIÓN DE PAGINACIÓN =================

function configurarPaginacion() {
    // Próximos
    document.getElementById('btnPrevProximos')?.addEventListener('click', () => cambiarPaginaEventos('proximos', -1));
    document.getElementById('btnNextProximos')?.addEventListener('click', () => cambiarPaginaEventos('proximos', 1));
    document.getElementById('selectItemsPorPaginaProximos')?.addEventListener('change', (e) => {
        itemsPorPaginaProximos = parseInt(e.target.value) || 6;
        paginaActualProximos = 1;
        aplicarFiltrosEventos();
    });
    
    // En Curso
    document.getElementById('btnPrevEnCurso')?.addEventListener('click', () => cambiarPaginaEventos('encurso', -1));
    document.getElementById('btnNextEnCurso')?.addEventListener('click', () => cambiarPaginaEventos('encurso', 1));
    document.getElementById('selectItemsPorPaginaEnCurso')?.addEventListener('change', (e) => {
        itemsPorPaginaEnCurso = parseInt(e.target.value) || 6;
        paginaActualEnCurso = 1;
        aplicarFiltrosEventos();
    });
    
    // Completados
    document.getElementById('btnPrevCompletados')?.addEventListener('click', () => cambiarPaginaEventos('completados', -1));
    document.getElementById('btnNextCompletados')?.addEventListener('click', () => cambiarPaginaEventos('completados', 1));
    document.getElementById('selectItemsPorPaginaCompletados')?.addEventListener('change', (e) => {
        itemsPorPaginaCompletados = parseInt(e.target.value) || 6;
        paginaActualCompletados = 1;
        aplicarFiltrosEventos();
    });
}

function cambiarPaginaEventos(tipo, delta) {
    if (tipo === 'proximos') {
        const total = calcularTotalPaginas(eventosFiltradosProximos.length, itemsPorPaginaProximos);
        paginaActualProximos += delta;
        if (paginaActualProximos < 1) paginaActualProximos = 1;
        if (paginaActualProximos > total) paginaActualProximos = total;
        mostrarEventosPaginados(eventosFiltradosProximos, 'eventosProximos', 'badgeProximos', paginaActualProximos, itemsPorPaginaProximos, 'Proximos');
        actualizarPaginacion('Proximos', paginaActualProximos, total);
    } else if (tipo === 'encurso') {
        const total = calcularTotalPaginas(eventosFiltradosEnCurso.length, itemsPorPaginaEnCurso);
        paginaActualEnCurso += delta;
        if (paginaActualEnCurso < 1) paginaActualEnCurso = 1;
        if (paginaActualEnCurso > total) paginaActualEnCurso = total;
        mostrarEventosPaginados(eventosFiltradosEnCurso, 'eventosEnCurso', 'badgeEnCurso', paginaActualEnCurso, itemsPorPaginaEnCurso, 'EnCurso');
        actualizarPaginacion('EnCurso', paginaActualEnCurso, total);
    } else if (tipo === 'completados') {
        const total = calcularTotalPaginas(eventosFiltradosCompletados.length, itemsPorPaginaCompletados);
        paginaActualCompletados += delta;
        if (paginaActualCompletados < 1) paginaActualCompletados = 1;
        if (paginaActualCompletados > total) paginaActualCompletados = total;
        mostrarEventosPaginados(eventosFiltradosCompletados, 'eventosCompletados', 'badgeCompletados', paginaActualCompletados, itemsPorPaginaCompletados, 'Completados');
        actualizarPaginacion('Completados', paginaActualCompletados, total);
    }
}

function calcularTotalPaginas(totalItems, itemsPorPagina) {
    return Math.max(1, Math.ceil(totalItems / itemsPorPagina));
}

function actualizarPaginacion(tipo, paginaActual, totalPaginas) {
    document.getElementById(`paginaActual${tipo}`).textContent = String(paginaActual);
    document.getElementById(`totalPaginas${tipo}`).textContent = String(totalPaginas);
    
    const btnPrev = document.getElementById(`btnPrev${tipo}`);
    const btnNext = document.getElementById(`btnNext${tipo}`);
    
    if (btnPrev) btnPrev.disabled = paginaActual <= 1;
    if (btnNext) btnNext.disabled = paginaActual >= totalPaginas;
}

// ================= AUTENTICACIÓN =================

function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (!isLoggedIn || userType !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
}

// ================= TABS =================

function cambiarTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ================= ESTADOS AUTOMÁTICOS =================

async function actualizarEstadosAutomaticamente() {
    if (!window.supabaseClient) return;
    
    try {
        console.log('Actualizando estados automáticamente...');
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString().split('T')[0];
        
        const { error: error1 } = await window.supabaseClient
            .from('eventos')
            .update({ estado: 'completado' })
            .lt('fecha_evento', hoyISO)
            .neq('estado', 'completado');
        
        if (error1) console.error('Error al actualizar completados:', error1);
        
        const { error: error2 } = await window.supabaseClient
            .from('eventos')
            .update({ estado: 'activo' })
            .eq('fecha_evento', hoyISO)
            .neq('estado', 'activo');
        
        if (error2) console.error('Error al actualizar activos:', error2);
        
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

// ================= CARGA DE EVENTOS =================

async function cargarEventos() {
    if (!window.supabaseClient) {
        console.error('Supabase no inicializado');
        return;
    }
    
    try {
        console.log('Cargando eventos...');
        
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .order('fecha_evento', { ascending: false });
        
        if (error) throw error;
        
        console.log('Eventos cargados:', eventos);
        
        eventosGlobal = eventos || [];
        clasificarEventos(eventosGlobal);
        aplicarFiltrosEventos();
        
    } catch (error) {
        console.error('Error al cargar eventos:', error);
    }
}

function clasificarEventos(eventos) {
    eventosProximos = eventos.filter(e => e.estado === 'proximo');
    eventosEnCurso = eventos.filter(e => e.estado === 'activo');
    eventosCompletados = eventos.filter(e => e.estado === 'completado');
}

// ================= FILTROS =================

function obtenerFiltrosEventos() {
    const fechaDesdeEl = document.getElementById('filtroFechaDesde');
    const fechaHastaEl = document.getElementById('filtroFechaHasta');
    const categoriaEl = document.getElementById('filtroCategoria');
    const busquedaEl = document.getElementById('filtroBusqueda');

    const fechaDesde = fechaDesdeEl?.value || '';
    const fechaHasta = fechaHastaEl?.value || '';
    const categoria = categoriaEl?.value || '';
    const termino = (busquedaEl?.value || '').toLowerCase().trim();

    return { fechaDesde, fechaHasta, categoria, termino };
}

function aplicarFiltrosEventos() {
    const { fechaDesde, fechaHasta, categoria, termino } = obtenerFiltrosEventos();

    console.log('=== APLICANDO FILTROS ===');
    console.log('Categoría seleccionada:', categoria);
    console.log('Total eventos - Próximos:', eventosProximos.length, 'En Curso:', eventosEnCurso.length, 'Completados:', eventosCompletados.length);

    function pasaFiltros(evento) {
        if (fechaDesde && evento.fecha_evento < fechaDesde) return false;
        if (fechaHasta && evento.fecha_evento > fechaHasta) return false;
        
        // CORREGIDO: Comparar en minúsculas para que funcione con "Cultura" y "cultura"
        if (categoria && categoria.trim() !== '') {
            const eventoCategoria = (evento.categoria || '').toLowerCase();
            const categoriaFiltro = categoria.toLowerCase();
            if (eventoCategoria !== categoriaFiltro) return false;
        }

        if (termino) {
            const titulo = (evento.titulo || '').toLowerCase();
            const desc = (evento.descripcion || '').toLowerCase();
            const ubicacion = (evento.ubicacion || '').toLowerCase();

            if (!titulo.includes(termino) && !desc.includes(termino) && !ubicacion.includes(termino)) {
                return false;
            }
        }

        return true;
    }

    eventosFiltradosProximos = eventosProximos.filter(pasaFiltros);
    eventosFiltradosEnCurso = eventosEnCurso.filter(pasaFiltros);
    eventosFiltradosCompletados = eventosCompletados.filter(pasaFiltros);

    console.log('Filtrados - Próximos:', eventosFiltradosProximos.length, 'En Curso:', eventosFiltradosEnCurso.length, 'Completados:', eventosFiltradosCompletados.length);

    const totalPaginasProximos = calcularTotalPaginas(eventosFiltradosProximos.length, itemsPorPaginaProximos);
    if (paginaActualProximos > totalPaginasProximos) paginaActualProximos = totalPaginasProximos;
    if (paginaActualProximos < 1) paginaActualProximos = 1;
    
    const totalPaginasEnCurso = calcularTotalPaginas(eventosFiltradosEnCurso.length, itemsPorPaginaEnCurso);
    if (paginaActualEnCurso > totalPaginasEnCurso) paginaActualEnCurso = totalPaginasEnCurso;
    if (paginaActualEnCurso < 1) paginaActualEnCurso = 1;
    
    const totalPaginasCompletados = calcularTotalPaginas(eventosFiltradosCompletados.length, itemsPorPaginaCompletados);
    if (paginaActualCompletados > totalPaginasCompletados) paginaActualCompletados = totalPaginasCompletados;
    if (paginaActualCompletados < 1) paginaActualCompletados = 1;

    mostrarEventosPaginados(eventosFiltradosProximos, 'eventosProximos', 'badgeProximos', paginaActualProximos, itemsPorPaginaProximos, 'Proximos');
    mostrarEventosPaginados(eventosFiltradosEnCurso, 'eventosEnCurso', 'badgeEnCurso', paginaActualEnCurso, itemsPorPaginaEnCurso, 'EnCurso');
    mostrarEventosPaginados(eventosFiltradosCompletados, 'eventosCompletados', 'badgeCompletados', paginaActualCompletados, itemsPorPaginaCompletados, 'Completados');
    
    actualizarPaginacion('Proximos', paginaActualProximos, totalPaginasProximos);
    actualizarPaginacion('EnCurso', paginaActualEnCurso, totalPaginasEnCurso);
    actualizarPaginacion('Completados', paginaActualCompletados, totalPaginasCompletados);
}

function limpiarFiltrosEventos() {
    const fechaDesdeEl = document.getElementById('filtroFechaDesde');
    const fechaHastaEl = document.getElementById('filtroFechaHasta');
    const categoriaEl = document.getElementById('filtroCategoria');
    const busquedaEl = document.getElementById('filtroBusqueda');

    if (fechaDesdeEl) fechaDesdeEl.value = '';
    if (fechaHastaEl) fechaHastaEl.value = '';
    if (categoriaEl) categoriaEl.value = '';
    if (busquedaEl) busquedaEl.value = '';

    aplicarFiltrosEventos();
}

// ================= UTILIDADES DE FECHA =================

function formatearFechaLocal(fechaString) {
    const [year, month, day] = fechaString.split('-');
    const fecha = new Date(year, month - 1, day);
    
    return fecha.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// ================= RENDER DE EVENTOS =================

function mostrarEventosPaginados(eventos, containerId, badgeId, paginaActual, itemsPorPagina, tipoSufijo) {
    const container = document.getElementById(containerId);
    const badge = document.getElementById(badgeId);
    
    if (!container || !badge) return;

    badge.textContent = eventos.length;
    
    if (!eventos || eventos.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay eventos en esta sección</div>';
        return;
    }
    
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const eventosPagina = eventos.slice(inicio, fin);
    
    container.innerHTML = eventosPagina.map(evento => {
        const fechaFormateada = formatearFechaLocal(evento.fecha_evento);
        
        const hora = evento.hora_evento ? evento.hora_evento.substring(0, 5) : '00:00';
        const asistentes = evento.asistentes_confirmados || 0;
        const cupo = evento.cupo_maximo || 0;
        const porcentaje = cupo > 0 ? Math.round((asistentes / cupo) * 100) : 0;
        
        const categoriaColors = {
            'Educación': { bg: '#dbeafe', text: '#1e40af' },
            'Salud': { bg: '#fee2e2', text: '#991b1b' },
            'Medio Ambiente': { bg: '#d1fae5', text: '#065f46' },
            'Cultura': { bg: '#e9d5ff', text: '#6b21a8' },
            'Deporte': { bg: '#fef3c7', text: '#92400e' },
            'Otro': { bg: '#f3f4f6', text: '#374151' }
        };
        
        // Normalizar categoría para buscar color
        const catNormalizada = evento.categoria.charAt(0).toUpperCase() + evento.categoria.slice(1).toLowerCase();
        const colores = categoriaColors[catNormalizada] || categoriaColors['Otro'];
        
        const estadoColors = {
            'proximo': { bg: '#dbeafe', text: '#1e40af', label: 'Próximo' },
            'activo': { bg: '#fef3c7', text: '#92400e', label: 'En Curso' },
            'completado': { bg: '#d1fae5', text: '#065f46', label: 'Completado' }
        };
        
        const estadoStyle = estadoColors[evento.estado] || estadoColors['proximo'];
        const estadoBadge = `<span style="background: ${estadoStyle.bg}; color: ${estadoStyle.text}; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; margin-left: 0.5rem;">${estadoStyle.label}</span>`;
        
        const botonRegistroAsistencia =
            (evento.estado === 'activo' || evento.estado === 'completado')
                ? ''
                : '';
        
        return `
            <div class="evento-card">
                <div class="evento-card-header">
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span class="evento-categoria" style="background: ${colores.bg}; color: ${colores.text};">
                            ${evento.categoria}
                        </span>
                        ${estadoBadge}
                    </div>
                    <div class="evento-acciones">
                     ${botonRegistroAsistencia}
                    </div>
                </div>
                <h3 class="evento-titulo">${evento.titulo}</h3>
                <p class="evento-descripcion">${evento.descripcion || 'Sin descripción'}</p>
                <div class="evento-info">
                    <div class="evento-info-item">
                        ${fechaFormateada}
                    </div>
                    <div class="evento-info-item">
                        ${hora}
                    </div>
                    <div class="evento-info-item">
                        ${evento.ubicacion || 'Por definir'}
                    </div>
                    <div class="evento-info-item">
                        ${asistentes} / ${cupo} asistentes
                    </div>
                </div>
                <div class="evento-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${porcentaje}%;"></div>
                    </div>
                    <span class="progress-text">${porcentaje}% ocupado</span>
                </div>
            </div>
        `;
    }).join('');
}

// ================= CRUD EVENTOS =================

function abrirModalCrear() {
    eventoEditando = null;
    document.getElementById('modalTitle').textContent = 'Crear Evento';
    document.getElementById('formEvento').reset();
    document.getElementById('eventoId').value = '';
    document.getElementById('modalEvento').classList.add('active');
}

async function editarEvento(id) {
    try {
        const { data: evento, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        eventoEditando = evento;
        document.getElementById('modalTitle').textContent = 'Editar Evento';
        document.getElementById('eventoId').value = evento.id;
        document.getElementById('titulo').value = evento.titulo;
        document.getElementById('descripcion').value = evento.descripcion || '';
        document.getElementById('fecha_evento').value = evento.fecha_evento;
        document.getElementById('hora_evento').value = evento.hora_evento;
        document.getElementById('categoria').value = evento.categoria;
        document.getElementById('ubicacion').value = evento.ubicacion || '';
        document.getElementById('cupo_maximo').value = evento.cupo_maximo;
        document.getElementById('asistentes_confirmados').value = evento.asistentes_confirmados || 0;
        
        document.getElementById('modalEvento').classList.add('active');
        
    } catch (error) {
        console.error('Error al cargar evento:', error);
        alert('Error al cargar evento');
    }
}

async function guardarEvento(e) {
    e.preventDefault();
    const fechaEvento = document.getElementById('fecha_evento').value;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const [year, month, day] = fechaEvento.split('-');
    const fechaEventoDate = new Date(year, month - 1, day);
    fechaEventoDate.setHours(0, 0, 0, 0);
    
    let estado = 'proximo';
    if (fechaEventoDate < hoy) {
        estado = 'completado';
    } else if (fechaEventoDate.getTime() === hoy.getTime()) {
        estado = 'activo';
    }
    
    const eventoData = {
        titulo: document.getElementById('titulo').value,
        descripcion: document.getElementById('descripcion').value,
        fecha_evento: fechaEvento,
        hora_evento: document.getElementById('hora_evento').value,
        categoria: document.getElementById('categoria').value,
        ubicacion: document.getElementById('ubicacion').value,
        cupo_maximo: parseInt(document.getElementById('cupo_maximo').value),
        asistentes_confirmados: parseInt(document.getElementById('asistentes_confirmados').value),
        estado: estado
    };
    
    try {
        const eventoId = document.getElementById('eventoId').value;
        
        if (eventoId) {
            const { error } = await window.supabaseClient
                .from('eventos')
                .update(eventoData)
                .eq('id', eventoId);
            
            if (error) throw error;
            
            alert('Evento actualizado correctamente');
        } else {
            const { error } = await window.supabaseClient
                .from('eventos')
                .insert([eventoData]);
            
            if (error) throw error;
            
            alert('Evento creado correctamente');
        }
        
        cerrarModal();
        
        await actualizarEstadosAutomaticamente();
        cargarEventos();
        
    } catch (error) {
        console.error('Error al guardar evento:', error);
        alert('Error al guardar evento: ' + error.message);
    }
}

async function eliminarEvento(id) {
    if (!confirm('¿Eliminar este evento?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('eventos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert('Evento eliminado');
        cargarEventos();
        
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar evento');
    }
}

function cerrarModal() {
    document.getElementById('modalEvento').classList.remove('active');
}

// ================= REGISTRO DE ASISTENCIA =================

async function abrirModalRegistroAsistencia(eventoId) {
    try {
        eventoSeleccionadoParaAsistencia = eventoId;
        const { data: evento, error: errorEvento } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('id', eventoId)
            .single();
        
        if (errorEvento) throw errorEvento;

        const { data: asistencias, error: errorAsistencias } = await window.supabaseClient
            .from('vista_asistencias_detalladas')
            .select('*')
            .eq('evento_id', eventoId)
            .eq('estado_asistencia', 'confirmado');
        
        if (errorAsistencias) throw errorAsistencias;
    
        document.getElementById('modalRegistroTitulo').textContent = `Registrar Asistencia - ${evento.titulo}`;
        document.getElementById('eventoIdAsistencia').value = eventoId;
        
        const listaSocios = document.getElementById('listaSociosAsistencia');
        
        if (!asistencias || asistencias.length === 0) {
            listaSocios.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <path d="M18 8l5 5"></path>
                        <path d="m23 8-5 5"></path>
                    </svg>
                    <p>No hay socios confirmados para este evento</p>
                </div>
            `;
        } else {
            listaSocios.innerHTML = asistencias.map(asistencia => `
                <div class="socio-item">
                    <label class="socio-checkbox">
                        <input type="checkbox" name="asistio" value="${asistencia.socio_id}" data-asistencia-id="${asistencia.id}">
                        <span class="checkmark"></span>
                        <div class="socio-info">
                            <span class="socio-nombre">${asistencia.socio_nombre}</span>
                            <span class="socio-email">${asistencia.socio_email}</span>
                        </div>
                    </label>
                    <div class="asistencia-status">
                        <span class="status-badge status-pendiente">Pendiente</span>
                    </div>
                </div>
            `).join('');
        }
    
        document.getElementById('modalRegistroAsistencia').classList.add('active');
        
    } catch (error) {
        console.error('Error al abrir modal de asistencia:', error);
        alert('Error al cargar la información del evento');
    }
}

async function guardarRegistroAsistencia(e) {
    e.preventDefault();
    
    const eventoId = document.getElementById('eventoIdAsistencia').value;
    const checkboxes = document.querySelectorAll('input[name="asistio"]:checked');
    const userId = sessionStorage.getItem('userId');
    
    if (checkboxes.length === 0) {
        alert('Por favor, selecciona al menos un socio que asistió al evento.');
        return;
    }

    try {
        const updates = Array.from(checkboxes).map(async (checkbox) => {
            const asistenciaId = checkbox.dataset.asistenciaId;
            
            const { error } = await window.supabaseClient
                .from('asistencias')
                .update({
                    estado_asistencia: 'asistio',
                    fecha_asistencia: new Date().toISOString(),
                    registrado_por: userId
                })
                .eq('id', asistenciaId);
            
            if (error) throw error;
            
            return { success: !error };
        });
    
        const resultados = await Promise.all(updates);
        const exitosas = resultados.filter(r => r.success).length;
     
        alert(`Asistencia registrada exitosamente para ${exitosas} socios.`);
    
        cerrarModalRegistroAsistencia();
        cargarEventos();
        
    } catch (error) {
        console.error('Error al guardar asistencia:', error);
        alert('Error al guardar el registro de asistencia');
    }
}

function cerrarModalRegistroAsistencia() {
    document.getElementById('modalRegistroAsistencia').classList.remove('active');
    eventoSeleccionadoParaAsistencia = null;
}

console.log('Gestión de eventos con filtros y asistencia cargada');
