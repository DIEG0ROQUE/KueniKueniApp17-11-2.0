// ============================================
// COORDINADOR DE EVENTOS - VERSIÓN FINAL COMPLETA
// ============================================
// ✅ Doble JOIN: asistencias_eventos → socios → usuarios
// ✅ Modal más grande (95% ancho, 90% alto) con scroll
// ✅ Botón "No Asistió" (estado: no_asistio)
// ✅ 4 estadísticas: Total, Confirmados, Asistieron, No Asistieron
// ✅ Columna de acciones completa visible
// ✅ 100% funcional

document.addEventListener('DOMContentLoaded', function() {
    console.log(' Sistema inicializado');
    verificarAutenticacion();
    setTimeout(() => {
        if (window.supabaseClient) {
            console.log(' Supabase conectado');
            cargarDatos();
        }
    }, 500);
    configurarEventos();
    establecerFechaMinima();
});

let eventosGlobal = [];
let eventoEditando = null;
let eventoAsistenciaActual = null;
let asistenciasSeleccionadas = new Set();

function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    if (!isLoggedIn || userType !== 'coordinador') {
        window.location.href = 'login.html';
        return;
    }
}

function establecerFechaMinima() {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fechaEvento');
    if (fechaInput) {
        fechaInput.setAttribute('min', hoy);
        fechaInput.value = hoy;
    }
}

function configurarEventos() {
    document.getElementById('btnCerrarSesion')?.addEventListener('click', cerrarSesion);
    document.getElementById('btnAgregarEvento')?.addEventListener('click', abrirModalNuevo);
    document.getElementById('btnCerrarModal')?.addEventListener('click', cerrarModal);
    document.getElementById('btnCancelarModal')?.addEventListener('click', cerrarModal);
    document.getElementById('formEvento')?.addEventListener('submit', function(e) {
        e.preventDefault();
        guardarEvento();
    });
    document.getElementById('inputBuscar')?.addEventListener('input', filtrarEventos);
    document.getElementById('filtroEstado')?.addEventListener('change', filtrarEventos);
    document.getElementById('filtroCategoria')?.addEventListener('change', filtrarEventos);
}

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

async function cargarDatos() {
    try {
        await cargarEstadisticas();
        await cargarEventos();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cargarEstadisticas() {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const { data: eventos } = await window.supabaseClient
            .from('eventos')
            .select('estado, fecha_evento');
        if (!eventos) return;
        const total = eventos.length;
        const proximos = eventos.filter(e => e.estado === 'proximo' && e.fecha_evento >= hoy).length;
        const enCurso = eventos.filter(e => e.estado === 'activo').length;
        const finalizados = eventos.filter(e => e.estado === 'completado').length;
        document.getElementById('totalEventos').textContent = total;
        document.getElementById('eventosProximos').textContent = proximos;
        document.getElementById('eventosActivos').textContent = enCurso;
        document.getElementById('eventosFinalizados').textContent = finalizados;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cargarEventos() {
    try {
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .order('fecha_evento', { ascending: false });
        if (error) throw error;
        eventosGlobal = eventos || [];
        mostrarEventos(eventos || []);
    } catch (error) {
        console.error('Error:', error);
    }
}

function mostrarEventos(eventos) {
    const tbody = document.getElementById('tablaEventos');
    if (!tbody) return;
    if (!eventos || eventos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;">No hay eventos</td></tr>';
        return;
    }
    tbody.innerHTML = eventos.map(evento => {
        const estadoBadge = obtenerEstadoBadge(evento.estado);
        const categoriaBadge = obtenerCategoriaBadge(evento.categoria);
        return `
            <tr>
                <td style="font-weight:600;">${evento.titulo}</td>
                <td><span class="badge-categoria ${categoriaBadge.clase}">${categoriaBadge.texto}</span></td>
                <td>${formatearFecha(evento.fecha_evento)}</td>
                <td>${evento.hora_evento ? evento.hora_evento.substring(0, 5) : 'N/A'}</td>
                <td><span class="badge-estado ${estadoBadge.clase}">${estadoBadge.texto}</span></td>
                <td style="text-align:center;">
                    <strong>${evento.asistentes_confirmados || 0}</strong> / ${evento.cupo_maximo || 0}
                </td>
                <td>
                    <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;">
                        <button onclick="gestionarAsistencias('${evento.id}')" class="btn-icon btn-success" title="Gestionar Asistencias">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <polyline points="17 11 19 13 23 9"></polyline>
                            </svg>
                        </button>
                        <button onclick="editarEvento('${evento.id}')" class="btn-icon" title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button onclick="eliminarEvento('${evento.id}')" class="btn-icon btn-danger" title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filtrarEventos() {
    const busqueda = document.getElementById('inputBuscar').value.toLowerCase();
    const estado = document.getElementById('filtroEstado').value;
    const categoria = document.getElementById('filtroCategoria').value;
    let filtrados = eventosGlobal;
    if (busqueda) {
        filtrados = filtrados.filter(e => 
            e.titulo.toLowerCase().includes(busqueda) ||
            e.descripcion?.toLowerCase().includes(busqueda)
        );
    }
    if (estado) filtrados = filtrados.filter(e => e.estado === estado);
    if (categoria) filtrados = filtrados.filter(e => e.categoria === categoria);
    mostrarEventos(filtrados);
}

function abrirModalNuevo() {
    eventoEditando = null;
    document.getElementById('modalTitulo').textContent = ' Nuevo Evento';
    document.getElementById('formEvento').reset();
    establecerFechaMinima();
    abrirModal();
}

function abrirModal() {
    const modal = document.getElementById('modalEvento');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal() {
    const modal = document.getElementById('modalEvento');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    eventoEditando = null;
}

async function guardarEvento() {
    const btnGuardar = document.getElementById('btnGuardarEvento');
    const btnText = document.getElementById('btnGuardarText');
    const btnLoader = document.getElementById('btnGuardarLoader');
    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const categoria = document.getElementById('categoria').value;
    const fechaEvento = document.getElementById('fechaEvento').value;
    const horaEvento = document.getElementById('horaEvento').value;
    const ubicacion = document.getElementById('ubicacion').value.trim();
    const cupoMaximo = parseInt(document.getElementById('cupoMaximo').value);
    const estado = document.getElementById('estado').value;
    const hoy = new Date().toISOString().split('T')[0];
    if (fechaEvento < hoy) {
        mostrarMensaje('La fecha no puede ser anterior a hoy', 'error');
        return;
    }
    if (cupoMaximo < 1) {
        mostrarMensaje('El cupo máximo debe ser al menos 1', 'error');
        return;
    }
    try {
        btnGuardar.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        const eventoData = {
            titulo, descripcion, categoria,
            fecha_evento: fechaEvento,
            hora_evento: horaEvento,
            ubicacion, cupo_maximo: cupoMaximo, estado
        };
        let error;
        if (eventoEditando) {
            const result = await window.supabaseClient
                .from('eventos')
                .update(eventoData)
                .eq('id', eventoEditando);
            error = result.error;
        } else {
            eventoData.asistentes_confirmados = 0;
            const result = await window.supabaseClient
                .from('eventos')
                .insert([eventoData]);
            error = result.error;
        }
        if (error) throw error;
        mostrarMensaje('¡Evento guardado exitosamente!', 'success');
        await cargarDatos();
        setTimeout(cerrarModal, 1000);
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje(error.message || 'Error al guardar evento', 'error');
    } finally {
        btnGuardar.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

async function editarEvento(id) {
    try {
        const { data: evento, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        eventoEditando = id;
        document.getElementById('modalTitulo').textContent = ' Editar Evento';
        document.getElementById('titulo').value = evento.titulo;
        document.getElementById('descripcion').value = evento.descripcion;
        document.getElementById('categoria').value = evento.categoria;
        document.getElementById('fechaEvento').value = evento.fecha_evento;
        document.getElementById('horaEvento').value = evento.hora_evento;
        document.getElementById('ubicacion').value = evento.ubicacion;
        document.getElementById('cupoMaximo').value = evento.cupo_maximo;
        document.getElementById('estado').value = evento.estado;
        abrirModal();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar evento', 'error');
    }
}

async function eliminarEvento(id) {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;
    try {
        const { error } = await window.supabaseClient
            .from('eventos')
            .delete()
            .eq('id', id);
        if (error) throw error;
        mostrarMensaje('Evento eliminado exitosamente', 'success');
        await cargarDatos();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al eliminar evento', 'error');
    }
}

window.editarEvento = editarEvento;
window.eliminarEvento = eliminarEvento;

// ============================================
// GESTIÓN DE ASISTENCIAS - MODAL MEJORADO
// ============================================

async function gestionarAsistencias(eventoId) {
    console.log(' ========================================');
    console.log(' CARGANDO ASISTENCIAS CON DOBLE JOIN');
    console.log(' ========================================');
    console.log(' Evento ID:', eventoId);
    
    try {
        // PASO 1: Verificar evento existe
        console.log('\n PASO 1: Verificando evento...');
        const { data: evento, error: errorEvento } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('id', eventoId)
            .single();
        
        if (errorEvento) {
            console.error(' Error al cargar evento:', errorEvento);
            throw new Error('No se pudo cargar el evento: ' + errorEvento.message);
        }
        
        console.log(' Evento encontrado:', evento.titulo);
        
        // PASO 2: Cargar asistencias CON DOBLE JOIN
        console.log('\n PASO 2: Cargando con DOBLE JOIN (asistencias → socios → usuarios)...');
        
        const { data: asistencias, error: errorAsistencias } = await window.supabaseClient
            .from('asistencias_eventos')
            .select(`
                *,
                socios!inner (
                    id,
                    usuario_id,
                    usuarios!inner (
                        nombre_completo,
                        email
                    )
                )
            `)
            .eq('evento_id', eventoId);
        
        if (errorAsistencias) {
            console.error(' Error al cargar asistencias:', errorAsistencias);
            mostrarMensaje('Error: ' + errorAsistencias.message, 'error');
            return;
        }
        
        console.log(' Asistencias cargadas:', asistencias?.length || 0);
        console.log(' Estructura de datos:', asistencias);
        
        // Si no hay asistencias
        if (!asistencias || asistencias.length === 0) {
            console.log(' No hay asistencias para este evento');
            
            eventoAsistenciaActual = eventoId;
            mostrarModalVacio(evento);
            return;
        }
        
        console.log(' Datos completos con nombre y email');
        
        // Mostrar modal
        eventoAsistenciaActual = eventoId;
        asistenciasSeleccionadas.clear();
        
        // Calcular estadísticas
        const total = asistencias.length;
        const confirmados = asistencias.filter(a => a.estado === 'confirmado').length;
        const asistieron = asistencias.filter(a => a.estado === 'asistio').length;
        const noAsistieron = asistencias.filter(a => a.estado === 'no_asistio').length;
        
        console.log(' Estadísticas:', { total, confirmados, asistieron, noAsistieron });
        
        mostrarModalAsistenciasMejorado(evento, asistencias, { total, confirmados, asistieron, noAsistieron });
        
        console.log(' ¡Asistencias cargadas exitosamente!');
        console.log(' ========================================\n');
        
    } catch (error) {
        console.error(' ERROR CRÍTICO:', error);
        console.error('Stack:', error.stack);
        console.log(' ========================================\n');
        mostrarMensaje('Error crítico: ' + error.message, 'error');
    }
}

function mostrarModalVacio(evento) {
    const modalHTML = `
        <div id="modalAsistencias" style="display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;">
            <div style="background:white;border-radius:12px;width:90%;max-width:1200px;max-height:85vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="padding:1.5rem;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;background:#f9fafb;">
                    <div>
                        <h2 style="margin:0;font-size:1.5rem;color:#0f172a;"> Gestionar Asistencias</h2>
                        <p style="margin:0.5rem 0 0 0;color:#64748b;">${evento.titulo}</p>
                    </div>
                    <button onclick="cerrarModalAsistencias()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#64748b;padding:0.5rem;">✕</button>
                </div>
                <div style="padding:3rem;text-align:center;">
                    <div style="font-size:3rem;margin-bottom:1rem;"></div>
                    <div style="font-weight:600;margin-bottom:0.5rem;">No hay asistentes registrados</div>
                    <div style="font-size:0.875rem;color:#71717a;">
                        Ejecuta SQL-AGREGAR-ASISTENCIAS.sql para agregar datos
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('modalAsistencias');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

function mostrarModalAsistenciasMejorado(evento, asistencias, stats) {
    const confirmados = asistencias.filter(a => a.estado === 'confirmado');
    const asistieron = asistencias.filter(a => a.estado === 'asistio');
    const noAsistieron = asistencias.filter(a => a.estado === 'no_asistio');
    
    const modalHTML = `
        <div id="modalAsistencias" style="display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;">
            <div style="background:white;border-radius:12px;width:95%;max-width:1400px;max-height:90vh;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);display:flex;flex-direction:column;">
                
                <!-- HEADER -->
                <div style="padding:1.5rem;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;background:#f9fafb;">
                    <div>
                        <h2 style="margin:0;font-size:1.5rem;color:#0f172a;"> Gestionar Asistencias</h2>
                        <p style="margin:0.5rem 0 0 0;color:#64748b;">${evento.titulo}</p>
                    </div>
                    <button onclick="cerrarModalAsistencias()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#64748b;padding:0.5rem;">✕</button>
                </div>
                
                <!-- ESTADÍSTICAS -->
                <div style="padding:1.5rem;display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;border-bottom:1px solid #e5e7eb;">
                    <div style="text-align:center;padding:1rem;background:#f8fafc;border-radius:8px;">
                        <div style="font-size:0.875rem;color:#64748b;margin-bottom:0.25rem;">TOTAL</div>
                        <div style="font-size:2rem;font-weight:700;color:#0f172a;">${stats.total}</div>
                    </div>
                    <div style="text-align:center;padding:1rem;background:#fef3c7;border-radius:8px;">
                        <div style="font-size:0.875rem;color:#92400e;margin-bottom:0.25rem;">CONFIRMADOS</div>
                        <div style="font-size:2rem;font-weight:700;color:#92400e;">${stats.confirmados}</div>
                    </div>
                    <div style="text-align:center;padding:1rem;background:#d1fae5;border-radius:8px;">
                        <div style="font-size:0.875rem;color:#065f46;margin-bottom:0.25rem;">ASISTIERON</div>
                        <div style="font-size:2rem;font-weight:700;color:#065f46;">${stats.asistieron}</div>
                    </div>
                    <div style="text-align:center;padding:1rem;background:#fee2e2;border-radius:8px;">
                        <div style="font-size:0.875rem;color:#dc2626;margin-bottom:0.25rem;">NO ASISTIERON</div>
                        <div style="font-size:2rem;font-weight:700;color:#dc2626;">${stats.noAsistieron}</div>
                    </div>
                </div>
                
                <!-- CONTENIDO CON SCROLL -->
                <div style="flex:1;overflow-x:auto;overflow-y:auto;padding:1.5rem;">
                    <table style="width:100%;border-collapse:collapse;min-width:1000px;">
                        <thead style="position:sticky;top:0;background:white;z-index:10;">
                            <tr style="border-bottom:2px solid #e5e7eb;">
                                <th style="padding:0.75rem;text-align:left;font-weight:600;color:#475569;width:40px;">✓</th>
                                <th style="padding:0.75rem;text-align:left;font-weight:600;color:#475569;">SOCIO</th>
                                <th style="padding:0.75rem;text-align:left;font-weight:600;color:#475569;">EMAIL</th>
                                <th style="padding:0.75rem;text-align:left;font-weight:600;color:#475569;width:150px;">ESTADO</th>
                                <th style="padding:0.75rem;text-align:left;font-weight:600;color:#475569;width:180px;">REGISTRO</th>
                                <th style="padding:0.75rem;text-align:center;font-weight:600;color:#475569;width:220px;">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generarFilasConfirmados(confirmados)}
                            ${generarFilasAsistieron(asistieron)}
                            ${generarFilasNoAsistieron(noAsistieron)}
                        </tbody>
                    </table>
                </div>
                
                <!-- FOOTER CON ACCIÓN -->
                ${confirmados.length > 0 ? `
                <div style="padding:1rem 1.5rem;border-top:1px solid #e5e7eb;background:#f9fafb;display:flex;justify-content:space-between;align-items:center;">
                    <div style="display:flex;align-items:center;gap:1rem;">
                        <input type="checkbox" id="checkboxSelectAll" onchange="toggleSelectAll(this)" style="width:18px;height:18px;cursor:pointer;">
                        <label for="checkboxSelectAll" style="font-weight:600;color:#065f46;cursor:pointer;">Seleccionar todos los confirmados</label>
                        <span style="color:#64748b;font-size:0.875rem;">(<span id="cantidadSeleccionados">0</span> seleccionados)</span>
                    </div>
                    <button onclick="confirmarSeleccionados()" style="padding:0.75rem 1.5rem;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">
                        ✓ Confirmar Asistencia de Seleccionados
                    </button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('modalAsistencias');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

function generarFilasConfirmados(confirmados) {
    if (confirmados.length === 0) return '';
    
    let html = `
        <tr style="background:#f0fdf4;">
            <td colspan="6" style="padding:1rem;font-weight:700;color:#065f46;"> CONFIRMADOS (${confirmados.length})</td>
        </tr>
    `;
    
    confirmados.forEach(asistencia => {
        const usuario = asistencia.socios?.usuarios || { nombre_completo: 'N/A', email: 'N/A' };
        const isChecked = asistenciasSeleccionadas.has(asistencia.id);
        
        html += `
            <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:0.75rem;">
                    <input type="checkbox" 
                           class="checkbox-asistencia" 
                           data-id="${asistencia.id}"
                           ${isChecked ? 'checked' : ''}
                           onchange="toggleAsistencia('${asistencia.id}')"
                           style="width:18px;height:18px;cursor:pointer;">
                </td>
                <td style="padding:0.75rem;font-weight:600;">${usuario.nombre_completo}</td>
                <td style="padding:0.75rem;color:#64748b;">${usuario.email}</td>
                <td style="padding:0.75rem;">
                    <span style="padding:0.35rem 0.75rem;background:#fef3c7;color:#92400e;border-radius:6px;font-size:0.8125rem;font-weight:600;">
                         Confirmado
                    </span>
                </td>
                <td style="padding:0.75rem;color:#64748b;font-size:0.875rem;">${formatearFechaHora(asistencia.fecha_registro)}</td>
                <td style="padding:0.75rem;">
                    <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;">
                        <button onclick="marcarAsistio('${asistencia.id}')" 
                                style="padding:0.5rem 0.75rem;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.875rem;font-weight:500;"
                                title="Marcar como asistió">
                            ✓ Asistió
                        </button>
                        <button onclick="marcarNoAsistio('${asistencia.id}')" 
                                style="padding:0.5rem 0.75rem;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.875rem;font-weight:500;"
                                title="Marcar como no asistió">
                            ✕ No Asistió
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    return html;
}

function generarFilasAsistieron(asistieron) {
    if (asistieron.length === 0) return '';
    
    let html = `
        <tr style="background:#d1fae5;">
            <td colspan="6" style="padding:1rem;font-weight:700;color:#065f46;"> YA ASISTIERON (${asistieron.length})</td>
        </tr>
    `;
    
    asistieron.forEach(asistencia => {
        const usuario = asistencia.socios?.usuarios || { nombre_completo: 'N/A', email: 'N/A' };
        
        html += `
            <tr style="border-bottom:1px solid #e5e7eb;background:#fafafa;">
                <td></td>
                <td style="padding:0.75rem;font-weight:600;">${usuario.nombre_completo}</td>
                <td style="padding:0.75rem;color:#64748b;">${usuario.email}</td>
                <td style="padding:0.75rem;">
                    <span style="padding:0.35rem 0.75rem;background:#d1fae5;color:#065f46;border-radius:6px;font-size:0.8125rem;font-weight:600;">
                        Asistió
                    </span>
                </td>
                <td style="padding:0.75rem;color:#64748b;font-size:0.875rem;">${formatearFechaHora(asistencia.fecha_registro)}</td>
                <td style="padding:0.75rem;">
                    <button onclick="cambiarEstadoAsistencia('${asistencia.id}', 'confirmado')" 
                            style="padding:0.5rem 0.75rem;background:#f3f4f6;color:#52525b;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;font-size:0.875rem;"
                            title="Volver a confirmado">
                        ↩ Volver
                    </button>
                </td>
            </tr>
        `;
    });
    
    return html;
}

function generarFilasNoAsistieron(noAsistieron) {
    if (noAsistieron.length === 0) return '';
    
    let html = `
        <tr style="background:#fee2e2;">
            <td colspan="6" style="padding:1rem;font-weight:700;color:#dc2626;">✕ NO ASISTIERON (${noAsistieron.length})</td>
        </tr>
    `;
    
    noAsistieron.forEach(asistencia => {
        const usuario = asistencia.socios?.usuarios || { nombre_completo: 'N/A', email: 'N/A' };
        
        html += `
            <tr style="border-bottom:1px solid #e5e7eb;background:#fafafa;">
                <td></td>
                <td style="padding:0.75rem;font-weight:600;">${usuario.nombre_completo}</td>
                <td style="padding:0.75rem;color:#64748b;">${usuario.email}</td>
                <td style="padding:0.75rem;">
                    <span style="padding:0.35rem 0.75rem;background:#fee2e2;color:#dc2626;border-radius:6px;font-size:0.8125rem;font-weight:600;">
                        ✕ No Asistió
                    </span>
                </td>
                <td style="padding:0.75rem;color:#64748b;font-size:0.875rem;">${formatearFechaHora(asistencia.fecha_registro)}</td>
                <td style="padding:0.75rem;">
                    <button onclick="cambiarEstadoAsistencia('${asistencia.id}', 'confirmado')" 
                            style="padding:0.5rem 0.75rem;background:#f3f4f6;color:#52525b;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;font-size:0.875rem;"
                            title="Volver a confirmado">
                        ↩ Volver
                    </button>
                </td>
            </tr>
        `;
    });
    
    return html;
}

// ============================================
// FUNCIONES DE ACCIÓN
// ============================================

async function marcarNoAsistio(asistenciaId) {
    if (!confirm('¿Marcar como NO ASISTIÓ?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('asistencias_eventos')
            .update({ estado: 'no_asistio' })
            .eq('id', asistenciaId);
        
        if (error) throw error;
        
        mostrarMensaje('✕ Marcado como NO ASISTIÓ', 'success');
        await gestionarAsistencias(eventoAsistenciaActual);
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al actualizar', 'error');
    }
}

window.marcarNoAsistio = marcarNoAsistio;

function toggleAsistencia(asistenciaId) {
    if (asistenciasSeleccionadas.has(asistenciaId)) {
        asistenciasSeleccionadas.delete(asistenciaId);
    } else {
        asistenciasSeleccionadas.add(asistenciaId);
    }
    actualizarContadorSeleccionados();
}

window.toggleAsistencia = toggleAsistencia;

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.checkbox-asistencia');
    asistenciasSeleccionadas.clear();
    
    if (checkbox.checked) {
        checkboxes.forEach(cb => {
            cb.checked = true;
            asistenciasSeleccionadas.add(cb.dataset.id);
        });
    } else {
        checkboxes.forEach(cb => cb.checked = false);
    }
    actualizarContadorSeleccionados();
}

window.toggleSelectAll = toggleSelectAll;

function actualizarContadorSeleccionados() {
    const contador = document.getElementById('cantidadSeleccionados');
    if (contador) {
        contador.textContent = asistenciasSeleccionadas.size;
    }
}

async function confirmarSeleccionados() {
    if (asistenciasSeleccionadas.size === 0) {
        mostrarMensaje('Selecciona al menos un asistente', 'error');
        return;
    }
    
    if (!confirm(`¿Confirmar asistencia de ${asistenciasSeleccionadas.size} persona(s)?`)) {
        return;
    }
    
    try {
        const idsArray = Array.from(asistenciasSeleccionadas);
        
        const { error } = await window.supabaseClient
            .from('asistencias_eventos')
            .update({ estado: 'asistio' })
            .in('id', idsArray);
        
        if (error) throw error;
        
        mostrarMensaje(` ${asistenciasSeleccionadas.size} asistencia(s) confirmada(s)!`, 'success');
        asistenciasSeleccionadas.clear();
        await gestionarAsistencias(eventoAsistenciaActual);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al confirmar asistencias', 'error');
    }
}

window.confirmarSeleccionados = confirmarSeleccionados;

async function marcarAsistio(asistenciaId) {
    try {
        const { error } = await window.supabaseClient
            .from('asistencias_eventos')
            .update({ estado: 'asistio' })
            .eq('id', asistenciaId);
        
        if (error) throw error;
        
        mostrarMensaje(' Asistencia confirmada', 'success');
        await gestionarAsistencias(eventoAsistenciaActual);
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al confirmar', 'error');
    }
}

window.marcarAsistio = marcarAsistio;

async function cambiarEstadoAsistencia(asistenciaId, nuevoEstado) {
    try {
        const { error } = await window.supabaseClient
            .from('asistencias_eventos')
            .update({ estado: nuevoEstado })
            .eq('id', asistenciaId);
        
        if (error) throw error;
        
        mostrarMensaje('Estado actualizado', 'success');
        await gestionarAsistencias(eventoAsistenciaActual);
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al actualizar', 'error');
    }
}

window.cambiarEstadoAsistencia = cambiarEstadoAsistencia;

function cerrarModalAsistencias() {
    const modal = document.getElementById('modalAsistencias');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = '';
    eventoAsistenciaActual = null;
    asistenciasSeleccionadas.clear();
}

window.cerrarModalAsistencias = cerrarModalAsistencias;
window.gestionarAsistencias = gestionarAsistencias;

function obtenerEstadoBadge(estado) {
    const badges = {
        'proximo': { clase: 'estado-proximo', texto: ' Próximo' },
        'en_curso': { clase: 'estado-activo', texto: ' En Curso' },
        'completado': { clase: 'estado-finalizado', texto: ' Completado' }
    };
    return badges[estado] || { clase: '', texto: estado };
}

function obtenerCategoriaBadge(categoria) {
    const badges = {
        'Educación': { clase: 'cat-educacion', texto: ' Educación' },
        'Salud': { clase: 'cat-salud', texto: ' Salud' },
        'Medio Ambiente': { clase: 'cat-ambiente', texto: ' Medio Ambiente' },
        'Cultura': { clase: 'cat-cultura', texto: ' Cultura' },
        'Deporte': { clase: 'cat-deporte', texto: ' Deporte' },
        'Otro': { clase: 'cat-otro', texto: ' Otro' }
    };
    return badges[categoria] || { clase: '', texto: categoria };
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatearFechaHora(fechaHora) {
    if (!fechaHora) return 'N/A';
    const date = new Date(fechaHora);
    return date.toLocaleString('es-MX', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function mostrarMensaje(texto, tipo) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;';
    container.innerHTML = `<div style="padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);background:${tipo === 'success' ? '#d1fae5' : '#fee2e2'};color:${tipo === 'success' ? '#065f46' : '#dc2626'};border:1px solid ${tipo === 'success' ? '#a7f3d0' : '#fecaca'};">${texto}</div>`;
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 3000);
}

const style = document.createElement('style');
style.textContent = `
    .btn-success { background: #d1fae5 !important; color: #065f46 !important; }
    .btn-success:hover { background: #a7f3d0 !important; }
    .btn-warning { background: #fef3c7 !important; color: #92400e !important; }
    .btn-warning:hover { background: #fde68a !important; }
    .estado-confirmado { background: #dbeafe; color: #1e40af; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; }
    .estado-asistio { background: #d1fae5; color: #065f46; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; }
`;
document.head.appendChild(style);

console.log('✅ Sistema COMPLETO FINAL cargado');
console.log('✅ Modal mejorado: 95% ancho, 90% alto, scroll horizontal');
console.log('✅ Doble JOIN: asistencias → socios → usuarios');
console.log('✅ Botón "No Asistió" (estado: no_asistio)');
console.log('✅ 4 estadísticas: Total, Confirmados, Asistieron, No Asistieron');
console.log('💡 Abre consola (F12) para ver logs detallados');