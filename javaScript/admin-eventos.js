// admin-eventos.js - CON SISTEMA DE REGISTRO DE ASISTENCIA
// ============================================================================

let eventoEditando = null;
let eventoSeleccionadoParaAsistencia = null;

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
    
    document.getElementById('btnCerrarSesion')?.addEventListener('click', cerrarSesion);
    document.getElementById('btnCrearEvento')?.addEventListener('click', abrirModalCrear);
    document.getElementById('formEvento')?.addEventListener('submit', guardarEvento);
    
    // Nuevos event listeners para modales de asistencia
    document.getElementById('formRegistroAsistencia')?.addEventListener('submit', guardarRegistroAsistencia);
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => cambiarTab(tab.dataset.tab));
    });
});

function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (!isLoggedIn || userType !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
}

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

function cambiarTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

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
        
        const proximos = eventos.filter(e => e.estado === 'proximo');
        const enCurso = eventos.filter(e => e.estado === 'activo');
        const completados = eventos.filter(e => e.estado === 'completado');
        
        mostrarEventos(proximos, 'eventosProximos', 'badgeProximos');
        mostrarEventos(enCurso, 'eventosEnCurso', 'badgeEnCurso');
        mostrarEventos(completados, 'eventosCompletados', 'badgeCompletados');
        
        console.log('Eventos clasificados');
        
    } catch (error) {
        console.error('Error al cargar eventos:', error);
    }
}

// FUNCIÓN CORREGIDA: Formatear fecha sin problemas de zona horaria
function formatearFechaLocal(fechaString) {
    // Crear fecha sin conversión UTC
    const [year, month, day] = fechaString.split('-');
    const fecha = new Date(year, month - 1, day);
    
    return fecha.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function mostrarEventos(eventos, containerId, badgeId) {
    const container = document.getElementById(containerId);
    const badge = document.getElementById(badgeId);
    
    badge.textContent = eventos.length;
    
    if (eventos.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay eventos en esta sección</div>';
        return;
    }
    
    container.innerHTML = eventos.map(evento => {
        // USAR FUNCIÓN CORREGIDA
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
        
        const colores = categoriaColors[evento.categoria] || categoriaColors['Otro'];
        
        const estadoColors = {
            'proximo': { bg: '#dbeafe', text: '#1e40af', label: 'Próximo' },
            'activo': { bg: '#fef3c7', text: '#92400e', label: 'En Curso' },
            'completado': { bg: '#d1fae5', text: '#065f46', label: 'Completado' }
        };
        
        const estadoStyle = estadoColors[evento.estado] || estadoColors['proximo'];
        const estadoBadge = `<span style="background: ${estadoStyle.bg}; color: ${estadoStyle.text}; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; margin-left: 0.5rem;">${estadoStyle.label}</span>`;
        
        // Botón de registro de asistencia solo para eventos activos y completados
        const botonRegistroAsistencia = (evento.estado === 'activo' || evento.estado === 'completado') ? 
          /*  `<button class="btn-registro-asistencia" onclick="abrirModalRegistroAsistencia('${evento.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4"></path>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                </svg>
                Registrar Asistencia
            </button>`*/ '': ''; 
        
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
                       <!-- <button class="btn-icon" onclick="editarEvento('${evento.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="eliminarEvento('${evento.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button> -->
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
        
        // CORREGIDO: Mantener la fecha exacta sin conversión
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
    
    // CORREGIDO: Guardar fecha exacta sin conversión
    const fechaEvento = document.getElementById('fecha_evento').value;
    
    // Determinar el estado según la fecha
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
        fecha_evento: fechaEvento, // Guardar fecha exacta
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

// ============================================================================
// NUEVAS FUNCIONES PARA REGISTRO DE ASISTENCIA
// ============================================================================

async function abrirModalRegistroAsistencia(eventoId) {
    try {
        eventoSeleccionadoParaAsistencia = eventoId;
        
        // Cargar información del evento
        const { data: evento, error: errorEvento } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('id', eventoId)
            .single();
        
        if (errorEvento) throw errorEvento;
        
        // Cargar lista de socios confirmados
        const { data: asistencias, error: errorAsistencias } = await window.supabaseClient
            .from('vista_asistencias_detalladas')
            .select('*')
            .eq('evento_id', eventoId)
            .eq('estado_asistencia', 'confirmado');
        
        if (errorAsistencias) throw errorAsistencias;
        
        // Actualizar el modal
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
        
        // Mostrar el modal
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
        // Actualizar cada asistencia seleccionada
        const updates = Array.from(checkboxes).map(async (checkbox) => {
            const socioId = checkbox.value;
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
            
            return { socioId, success: !error };
        });
        
        // Esperar a que todas las actualizaciones terminen
        const resultados = await Promise.all(updates);
        const exitosas = resultados.filter(r => r.success).length;
        
        // Mostrar resultado
        alert(`Asistencia registrada exitosamente para ${exitosas} socios.`);
        
        // Cerrar modal y recargar eventos
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