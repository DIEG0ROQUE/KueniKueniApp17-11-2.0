// socio-dashboard.js - Sistema completo de integración con Supabase CON ALERTA PERSONALIZADA
// ============================================================================

// ============================================================================
// 1. VERIFICACIÓN DE SESIÓN Y CONFIGURACIÓN INICIAL
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    // Asegurar que los estilos de alerta estén disponibles
    agregarEstilosAlerta();
    
    console.log('Inicializando dashboard de socio...');
    
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
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    const socioId = sessionStorage.getItem('socioId');
    
    console.log('Usuario autenticado:', {
        email: userEmail,
        nombre: userName,
        socioId: socioId
    });
    
    // Inicializar componentes
    await inicializarDashboard(userId, socioId);
    
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
// 3. INICIALIZACIÓN DEL DASHBOARD (CORREGIDO)
// ============================================================================

async function inicializarDashboard(userId, socioId) {
    mostrarLoaders();
    
    try {
        // Cargar datos en paralelo
        const [datosBasicos, eventos, actividad] = await Promise.all([
            cargarDatosBasicosSocio(socioId),
            cargarProximosEventos(socioId),
            cargarActividadReciente(socioId)
        ]);
        
        // Actualizar UI con los datos
        if (datosBasicos) {
            actualizarEncabezado(datosBasicos);
            // PASAMOS EL CONTEO DE EVENTOS A LA FUNCIÓN DE ESTADÍSTICAS
            actualizarTarjetasEstadisticas(datosBasicos, eventos ? eventos.length : 0);
        }
        
        if (eventos) {
            mostrarProximosEventos(eventos, socioId);
        }
        
        if (actividad) {
            mostrarActividadReciente(actividad);
        }
        
        console.log('Dashboard cargado exitosamente');
        
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        mostrarMensajeError('Ocurrió un error al cargar tus datos. Por favor, intenta actualizar la página.');
    } finally {
        ocultarLoaders();
    }
}

// ============================================================================
// 4. CARGAR DATOS BÁSICOS DEL SOCIO
// ============================================================================

async function cargarDatosBasicosSocio(socioId) {
    console.log('Cargando datos del socio:', socioId);
    
    try {
        // Cargar datos básicos del socio
        const { data, error } = await window.supabaseClient
            .from('vista_socios_completa')
            .select('*')
            .eq('id', socioId)
            .single();
        
        if (error) {
            console.error('Error al cargar datos del socio:', error);
            
            if (error.code === 'PGRST116') {
                mostrarMensajeError('No se encontraron datos del socio. Contacta al administrador.');
            } else if (error.message.includes('permission')) {
                mostrarMensajeError('No tienes permiso para ver esta información. Contacta al administrador.');
            }
            
            return null;
        }
        
        // Calcular total de donaciones directamente desde la tabla donaciones
        const { data: donacionesData, error: donacionesError } = await window.supabaseClient
            .from('donaciones')
            .select('monto')
            .eq('socio_id', socioId)
            .eq('estado_pago', 'completado');
        
        if (donacionesError) {
            console.error('Error al cargar donaciones:', donacionesError);
        } else if (donacionesData && donacionesData.length > 0) {
            const totalDonaciones = donacionesData.reduce((sum, d) => sum + parseFloat(d.monto), 0);
            data.total_donaciones = totalDonaciones;
            console.log('Total donaciones calculado:', totalDonaciones);
        } else {
            console.log('No hay donaciones completadas');
            data.total_donaciones = 0;
        }
        
        console.log('Datos del socio cargados:', data);
        return data;
        
    } catch (error) {
        console.error('Error inesperado:', error);
        return null;
    }
}

// ============================================================================
// 5. CARGAR PRÓXIMOS EVENTOS (CORREGIDO - USA ESTADO 'activo')
// ============================================================================

async function cargarProximosEventos(socioId) {
    console.log('Cargando próximos eventos...');
    
    try {
        const fechaHoy = new Date().toISOString().split('T')[0];
        
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .gte('fecha_evento', fechaHoy)
            .in('estado', ['proximo']) // CORREGIDO: usar 'activo' en lugar de 'en_curso'
            .order('fecha_evento', { ascending: true })
            .limit(5);
        
        if (error) {
            console.error('Error al cargar eventos:', error);
            return [];
        }
        
        // Verificar asistencias del socio para cada evento
        if (eventos && eventos.length > 0) {
            const eventosConAsistencia = await Promise.all(
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
            
            console.log('✅ Eventos cargados:', eventosConAsistencia.length);
            return eventosConAsistencia;
        }
        
        return [];
        
    } catch (error) {
        console.error('Error inesperado:', error);
        return [];
    }
}

// ============================================================================
// 6. CARGAR ACTIVIDAD RECIENTE
// ============================================================================

async function cargarActividadReciente(socioId) {
    console.log('Cargando actividad reciente...');
    
    try {
        // Cargar asistencias recientes
        const { data: asistencias, error: errorAsistencias } = await window.supabaseClient
            .from('asistencias')
            .select(`
                id,
                fecha_asistencia,
                estado_asistencia,
                eventos (titulo)
            `)
            .eq('socio_id', socioId)
            .eq('estado_asistencia', 'asistio')
            .order('fecha_asistencia', { ascending: false })
            .limit(5);
        
        // Cargar donaciones recientes
        const { data: donaciones, error: errorDonaciones } = await window.supabaseClient
            .from('donaciones')
            .select('id, monto, fecha_donacion, estado_pago')
            .eq('socio_id', socioId)
            .eq('estado_pago', 'completado')
            .order('fecha_donacion', { ascending: false })
            .limit(5);
        
        if (errorAsistencias) console.error('Error al cargar asistencias:', errorAsistencias);
        if (errorDonaciones) console.error('Error al cargar donaciones:', errorDonaciones);
        
        // Combinar y ordenar actividades
        const actividades = [];
        
        if (asistencias) {
            asistencias.forEach(a => {
                actividades.push({
                    tipo: 'evento',
                    titulo: `Asististe a "${a.eventos?.titulo || 'Evento'}"`,
                    fecha: a.fecha_asistencia,
                    icono: 'event'
                });
            });
        }
        
        if (donaciones) {
            donaciones.forEach(d => {
                actividades.push({
                    tipo: 'donacion',
                    titulo: `Donación de $${d.monto.toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN`,
                    fecha: d.fecha_donacion,
                    icono: 'donation'
                });
            });
        }
        
        // Ordenar por fecha descendente
        actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        console.log('Actividades cargadas:', actividades.length);
        return actividades.slice(0, 10);
        
    } catch (error) {
        console.error('Error inesperado:', error);
        return [];
    }
}

// ============================================================================
// 7. ACTUALIZAR UI - ENCABEZADO
// ============================================================================

function actualizarEncabezado(datos) {
    const userNameElement = document.getElementById('userName');
    
    if (userNameElement && datos.nombre_completo) {
        userNameElement.textContent = datos.nombre_completo;
        console.log('Encabezado actualizado');
    }
}

// ============================================================================
// 8. ACTUALIZAR UI - TARJETAS DE ESTADÍSTICAS (CORREGIDO)
// ============================================================================

function actualizarTarjetasEstadisticas(datos, conteoEventosProximos = 0) {
    const statCards = document.querySelectorAll('.stat-card');
    
    // Eventos asistidos (primera tarjeta)
    if (statCards[0]) {
        const eventosValue = statCards[0].querySelector('.stat-value');
        if (eventosValue) {
            animarNumero(eventosValue, datos.total_eventos_asistidos || 0);
        }
    }
    
    // Donaciones totales (segunda tarjeta)
    if (statCards[1]) {
        const donacionesValue = statCards[1].querySelector('.stat-value');
        if (donacionesValue) {
            const monto = datos.total_donaciones || 0;
            donacionesValue.textContent = `$${monto.toLocaleString('es-MX', {minimumFractionDigits: 0})}`;
        }
    }
    
    // Próximos Eventos (tercera tarjeta) - CORREGIDO: usar el conteo real
    if (statCards[2]) {
        const proximosValue = statCards[2].querySelector('.stat-value');
        if (proximosValue) {
            // USAMOS EL CONTEO REAL DE EVENTOS PRÓXIMOS
            animarNumero(proximosValue, conteoEventosProximos);
        }
    }
    
    // Miembro desde (cuarta tarjeta)
    if (statCards[3]) {
        const miembroValue = statCards[3].querySelector('.stat-value');
        if (miembroValue && datos.fecha_ingreso) {
            miembroValue.textContent = formatearFechaMiembro(datos.fecha_ingreso);
        }
    }
    
    console.log('Tarjetas de estadísticas actualizadas - Próximos eventos:', conteoEventosProximos);
}

// ============================================================================
// 9. MOSTRAR PRÓXIMOS EVENTOS EN UI
// ============================================================================

function mostrarProximosEventos(eventos, socioId) {
    const eventsList = document.querySelector('.events-list');
    
    if (!eventsList) {
        console.warn('Contenedor de eventos no encontrado');
        return;
    }
    
    if (eventos.length === 0) {
        eventsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #64748b;">
                <p>No hay eventos próximos disponibles</p>
            </div>
        `;
        return;
    }
    
    eventsList.innerHTML = eventos.map(evento => {
        const badge = obtenerBadgeCategoria(evento.categoria);
        const botonEstado = obtenerBotonAsistencia(evento.asistenciaConfirmada);
        const cupoDisponible = evento.cupo_maximo - evento.asistentes_confirmados;
        const cupoClase = cupoDisponible <= 5 ? 'cupo-limitado' : '';
        
        return `
            <div class="event-item" data-evento-id="${evento.id}">
                <div class="event-badge ${badge.clase}">${badge.texto}</div>
                <div class="event-info">
                    <h4>${evento.titulo}</h4>
                    <p>${evento.descripcion}</p>
                    <div class="event-details">
                        <span>${formatearFechaEvento(evento.fecha_evento)}</span>
                        <span>${evento.hora_evento.substring(0, 5)}</span>
                        <span>${evento.ubicacion}</span>
                    </div>
                    <div class="event-meta">
                        <span class="attendees ${cupoClase}">
                            ${evento.asistentes_confirmados} / ${evento.cupo_maximo} asistentes
                            ${cupoDisponible <= 5 ? '' : ''}
                        </span>
                    </div>
                </div>
                <button 
                    class="btn-event-action ${botonEstado.clase}" 
                    data-evento-id="${evento.id}"
                    data-socio-id="${socioId}"
                    data-accion="${botonEstado.accion}"
                    ${botonEstado.deshabilitado || cupoDisponible === 0 ? 'disabled' : ''}
                >
                    ${cupoDisponible === 0 ? 'Cupo Lleno' : botonEstado.texto}
                </button>
            </div>
        `;
    }).join('');
    
    // Agregar event listeners a los botones
    configurarBotonesAsistencia();
    
    console.log('Eventos mostrados en UI');
}

// ============================================================================
// 10. MOSTRAR ACTIVIDAD RECIENTE EN UI
// ============================================================================

function mostrarActividadReciente(actividades) {
    const activityList = document.querySelector('.activity-list');
    
    if (!activityList) {
        console.warn('Contenedor de actividad no encontrado');
        return;
    }
    
    if (actividades.length === 0) {
        activityList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #64748b;">
                <p>No hay actividad reciente</p>
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = actividades.map(act => {
        const iconoClase = act.icono === 'evento' ? 'event-icon' : 
                          act.icono === 'donacion' ? 'donation-icon' : 'achievement-icon';
        const iconoSVG = obtenerIconoActividad(act.icono);
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${iconoClase}">
                    ${iconoSVG}
                </div>
                <div class="activity-content">
                    <h4>${act.titulo}</h4>
                    <p class="activity-time">${calcularTiempoTranscurrido(act.fecha)}</p>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Actividad reciente mostrada');
}

// ============================================================================
// 11. CONFIRMAR/CANCELAR ASISTENCIA A EVENTO
// ============================================================================

async function manejarAsistenciaEvento(eventoId, socioId, accion) {
    const boton = document.querySelector(`button[data-evento-id="${eventoId}"]`);
    
    if (!boton) return;
    
    // Deshabilitar botón y mostrar loader
    boton.disabled = true;
    const textoOriginal = boton.textContent;
    boton.innerHTML = '<span class="loader"></span> Procesando...';
    
    try {
        if (accion === 'confirmar') {
            // Insertar nueva asistencia
            const { data, error } = await window.supabaseClient
                .from('asistencias')
                .insert({
                    evento_id: eventoId,
                    socio_id: socioId,
                    estado_asistencia: 'confirmado',
                    fecha_confirmacion: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) {
                console.error('Error al confirmar asistencia:', error);
                
                if (error.code === '23505') {
                    mostrarMensajeError('Ya tienes confirmada la asistencia a este evento');
                } else {
                    mostrarMensajeError('Error al confirmar asistencia. Intenta nuevamente.');
                }
                
                boton.disabled = false;
                boton.textContent = textoOriginal;
                return;
            }
            
            console.log('Asistencia confirmada:', data);
            mostrarMensajeExito('¡Asistencia confirmada! Te esperamos en el evento.');
            
            // Actualizar botón
            boton.textContent = 'Confirmado';
            boton.className = 'btn-event-action btn-confirmado';
            boton.dataset.accion = 'cancelar';
            boton.disabled = false;
            
            // Actualizar contador de asistentes
            actualizarContadorAsistentes(eventoId, 1);
            
        } else if (accion === 'cancelar') {
            // Confirmar cancelación con alerta personalizada
            mostrarAlertaPersonalizada(
                '¿Cancelar asistencia?',
                'Se cancelará tu asistencia a este evento. ¿Estás seguro?',
                'Sí, cancelar',
                'No, mantener',
                async function() {
                    // Eliminar asistencia
                    const { error } = await window.supabaseClient
                        .from('asistencias')
                        .delete()
                        .eq('evento_id', eventoId)
                        .eq('socio_id', socioId);
                    
                    if (error) {
                        console.error('Error al cancelar asistencia:', error);
                        mostrarMensajeError('Error al cancelar asistencia. Intenta nuevamente.');
                        boton.disabled = false;
                        boton.textContent = textoOriginal;
                        return;
                    }
                    
                    console.log('Asistencia cancelada');
                    mostrarMensajeExito('Asistencia cancelada exitosamente.');
                    
                    // Actualizar botón
                    boton.textContent = 'Asistir';
                    boton.className = 'btn-event-action';
                    boton.dataset.accion = 'confirmar';
                    boton.disabled = false;
                    
                    // Actualizar contador de asistentes
                    actualizarContadorAsistentes(eventoId, -1);
                }
            );
            
            // Restaurar botón mientras espera decisión
            boton.disabled = false;
            boton.textContent = textoOriginal;
            return;
        }
        
    } catch (error) {
        console.error('Error inesperado:', error);
        mostrarMensajeError('Ocurrió un error inesperado. Intenta nuevamente.');
        boton.disabled = false;
        boton.textContent = textoOriginal;
    }
}

// ============================================
// 12. ACTUALIZAR CONTADOR DE ASISTENTES
// ============================================

function actualizarContadorAsistentes(eventoId, incremento) {
    const eventItem = document.querySelector(`.event-item[data-evento-id="${eventoId}"]`);
    
    if (!eventItem) return;
    
    const attendeesSpan = eventItem.querySelector('.attendees');
    if (!attendeesSpan) return;
    
    const texto = attendeesSpan.textContent;
    const match = texto.match(/(\d+)\s*\/\s*(\d+)/);
    
    if (match) {
        const actual = parseInt(match[1]) + incremento;
        const maximo = parseInt(match[2]);
        
        attendeesSpan.textContent = `${actual} / ${maximo} asistentes`;
        
        // Advertencia si quedan pocos cupos
        if (maximo - actual <= 5) {
            attendeesSpan.textContent += '';
            attendeesSpan.classList.add('cupo-limitado');
        } else {
            attendeesSpan.classList.remove('cupo-limitado');
        }
    }
}

// ============================================================================
// 13. CONFIGURAR EVENT LISTENERS CON ALERTA PERSONALIZADA
// ============================================================================

function configurarEventListeners() {
    // Botón de cerrar sesión CON ALERTA PERSONALIZADA
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            mostrarAlertaPersonalizada(
                '¿Cerrar sesión?',
                'Se cerrará tu sesión de socio. ¿Estás seguro?',
                'Sí, cerrar sesión',
                'Cancelar',
                function() {
                    console.log('Cerrando sesión...');
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            );
        });
    }
    
    console.log('Event listeners configurados');
}

function configurarBotonesAsistencia() {
    const botones = document.querySelectorAll('.btn-event-action');
    
    botones.forEach(boton => {
        boton.addEventListener('click', function() {
            const eventoId = this.dataset.eventoId;
            const socioId = this.dataset.socioId;
            const accion = this.dataset.accion;
            
            if (eventoId && socioId && accion) {
                manejarAsistenciaEvento(eventoId, socioId, accion);
            }
        });
    });
}

// ============================================================================
// 14. FUNCIONES AUXILIARES
// ============================================================================

function obtenerBadgeCategoria(categoria) {
    const badges = {
        'Medio Ambiente': { clase: 'environment', texto: 'Medio Ambiente' },
        'Deportes': { clase: 'sports', texto: 'Deportes' },
        'Cultura': { clase: 'culture', texto: 'Cultura' },
        'Emprendimiento': { clase: 'entrepreneurship', texto: 'Emprendimiento' }
    };
    
    return badges[categoria] || { clase: '', texto: categoria };
}

function obtenerBotonAsistencia(estadoAsistencia) {
    if (estadoAsistencia === 'confirmado') {
        return {
            texto: 'Confirmado',
            clase: 'btn-confirmado',
            accion: 'cancelar',
            deshabilitado: false
        };
    } else {
        return {
            texto: 'Asistir',
            clase: '',
            accion: 'confirmar',
            deshabilitado: false
        };
    }
}

function obtenerIconoActividad(tipo) {
    const iconos = {
        'evento': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="currentColor"/></svg>',
        'donacion': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="currentColor"/></svg>'
    };
    
    return iconos[tipo] || iconos['evento'];
}

function formatearFechaEvento(fecha) {
    const date = new Date(fecha + 'T00:00:00');
    const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('es-MX', opciones);
}

function formatearFechaMiembro(fecha) {
    const date = new Date(fecha + 'T00:00:00');
    const opciones = { month: 'short', year: 'numeric' };
    return date.toLocaleDateString('es-MX', opciones);
}

function calcularTiempoTranscurrido(fecha) {
    const ahora = new Date();
    const fechaEvento = new Date(fecha);
    const diferencia = ahora - fechaEvento;
    
    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    const semanas = Math.floor(dias / 7);
    const meses = Math.floor(dias / 30);
    
    if (meses > 0) return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    if (semanas > 0) return `Hace ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`;
    if (dias > 0) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
    if (horas > 0) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    if (minutos > 0) return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    return 'Hace un momento';
}

function animarNumero(elemento, valorFinal) {
    let valorActual = 0;
    const incremento = Math.ceil(valorFinal / 30);
    
    const timer = setInterval(() => {
        valorActual += incremento;
        if (valorActual >= valorFinal) {
            elemento.textContent = valorFinal;
            clearInterval(timer);
        } else {
            elemento.textContent = valorActual;
        }
    }, 30);
}

// ============================================================================
// 15. FUNCIONES DE UI - LOADERS Y MENSAJES
// ============================================================================

function mostrarLoaders() {
    const statsCards = document.querySelectorAll('.stat-card .stat-value');
    statsCards.forEach(card => {
        card.innerHTML = '<div class="skeleton-loader"></div>';
    });
}

function ocultarLoaders() {
    // Los loaders se reemplazan automáticamente al actualizar el contenido
}

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
// 16. COMPONENTE DE ALERTA PERSONALIZADA
// (Copiado del dashboard de donante)
// ============================================================================

function mostrarAlertaPersonalizada(titulo, mensaje, textoAceptar = 'Aceptar', textoCancelar = 'Cancelar', onAceptar = null) {
    const alertaExistente = document.getElementById('alertaPersonalizada');
    if (alertaExistente) alertaExistente.remove();

    const alertaHTML = `
        <div id="alertaPersonalizada" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        ">
            <div style="
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
                padding: 2rem;
                animation: slideUp 0.3s ease;
            ">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="
                        width: 56px;
                        height: 56px;
                        background: linear-gradient(135deg, #5f0d51 0%, #7d1166 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1rem;
                    ">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </div>
                    <h3 style="font-size: 1.5rem; font-weight: 700; color: #18181b; margin: 0 0 0.5rem 0;">${titulo}</h3>
                    <p style="font-size: 1rem; color: #71717a; margin: 0;">${mensaje}</p>
                </div>
                <div style="display: flex; gap: 0.75rem; margin-top: 2rem;">
                    <button id="btnCancelarAlerta" style="
                        flex: 1;
                        padding: 0.875rem;
                        background: #f3f4f6;
                        color: #52525b;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">${textoCancelar}</button>
                    <button id="btnAceptarAlerta" style="
                        flex: 1;
                        padding: 0.875rem;
                        background: linear-gradient(135deg, #5f0d51 0%, #7d1166 100%);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: 0 4px 12px rgba(95, 13, 81, 0.3);
                    ">${textoAceptar}</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertaHTML);
    document.body.style.overflow = 'hidden';

    const alerta = document.getElementById('alertaPersonalizada');
    const btnAceptar = document.getElementById('btnAceptarAlerta');
    const btnCancelar = document.getElementById('btnCancelarAlerta');

    btnAceptar.addEventListener('mouseenter', () => {
        btnAceptar.style.transform = 'translateY(-2px)';
        btnAceptar.style.boxShadow = '0 6px 16px rgba(95, 13, 81, 0.4)';
    });
    btnAceptar.addEventListener('mouseleave', () => {
        btnAceptar.style.transform = 'translateY(0)';
        btnAceptar.style.boxShadow = '0 4px 12px rgba(95, 13, 81, 0.3)';
    });

    btnCancelar.addEventListener('mouseenter', () => {
        btnCancelar.style.background = '#e5e7eb';
        btnCancelar.style.transform = 'translateY(-2px)';
    });
    btnCancelar.addEventListener('mouseleave', () => {
        btnCancelar.style.background = '#f3f4f6';
        btnCancelar.style.transform = 'translateY(0)';
    });

    const cerrarAlerta = () => {
        alerta.style.opacity = '0';
        setTimeout(() => {
            alerta.remove();
            document.body.style.overflow = '';
        }, 200);
    };

    btnCancelar.addEventListener('click', cerrarAlerta);
    btnAceptar.addEventListener('click', () => {
        if (onAceptar) onAceptar();
        cerrarAlerta();
    });

    alerta.addEventListener('click', (e) => {
        if (e.target === alerta) cerrarAlerta();
    });
}

// CSS para animaciones
function agregarEstilosAlerta() {
    if (!document.querySelector('#estilos-alerta')) {
        const style = document.createElement('style');
        style.id = 'estilos-alerta';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Agregar estilos de animación (mantener los que ya estaban)
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
    
    .skeleton-loader {
        height: 24px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
    }
    
    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    
    .loader {
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
    
    .btn-confirmado {
        background: #15803d !important;
        cursor: default;
    }
    
    .cupo-limitado {
        color: #dc2626;
        font-weight: 600;
    }
`;
document.head.appendChild(style);

console.log('Dashboard de socio con alerta personalizada cargado');