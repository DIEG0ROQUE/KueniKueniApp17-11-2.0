// ============================================
// SISTEMA COMPLETO DE DONACIONES CON SUSCRIPCIONES
// Mantiene funcionalidad original + nuevas características
// ============================================

const DONACIONES_POR_PAGINA = 10;
let paginaActualHistorial = 1;
let todasLasDonaciones = [];
let donacionesFiltradas = [];
let suscripcionActual = null;

// Bancos detectables por BIN (primeros 4-6 dígitos)
const BANCOS_MEXICO = {
    'BBVA': { bins: ['4152', '4772'], color: '#004481' },
    'Santander': { bins: ['5579'], color: '#EC0000' },
    'Banorte': { bins: ['5465', '5492'], color: '#DA291C' },
    'HSBC': { bins: ['4051', '5469'], color: '#DB0011' },
    'Citibanamex': { bins: ['5256', '4915'], color: '#003B71' },
    'ScotiaBank': { bins: ['4571'], color: '#EC1C24' },
    'Inbursa': { bins: ['5204'], color: '#C8102E' }
};

// ============================================
// 1. INICIALIZACIÓN
// ============================================

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
        mostrarMensaje('Error de configuración. Por favor, recarga la página.', 'error');
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
    configurarEventListeners(socioId);
});

// ============================================
// 2. VERIFICACIÓN DE SESIÓN
// ============================================

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

// ============================================
// 3. INICIALIZACIÓN COMPLETA
// ============================================

async function inicializarDonaciones(socioId) {
    try {
        // Cargar suscripción activa (si existe)
        await cargarSuscripcion(socioId);
        
        // Cargar donaciones
        const donaciones = await cargarDonacionesSocio(socioId);
        
        if (donaciones && donaciones.length > 0) {
            todasLasDonaciones = donaciones;
            donacionesFiltradas = [...donaciones];
            
            // Actualizar estadísticas
            actualizarEstadisticas(donaciones);
            
            // Mostrar primera página
            mostrarPaginaHistorial(1);
        } else {
            mostrarSinDonaciones();
            actualizarEstadisticasVacias();
        }
        
        console.log('Vista de donaciones cargada exitosamente');
        
    } catch (error) {
        console.error('Error al cargar donaciones:', error);
        mostrarMensaje('Ocurrió un error al cargar tus donaciones. Por favor, intenta actualizar la página.', 'error');
    }
}

// ============================================
// 4. CARGAR DONACIONES
// ============================================

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
            return [];
        }
        
        console.log('Donaciones cargadas:', donaciones.length);
        return donaciones;
        
    } catch (error) {
        console.error('Error inesperado:', error);
        return [];
    }
}

// ============================================
// 5. SUSCRIPCIONES
// ============================================

async function cargarSuscripcion(socioId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('suscripciones_mensuales')
            .select('*')
            .eq('socio_id', socioId)
            .eq('estado', 'activa')
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error al cargar suscripción:', error);
            return;
        }
        
        if (data) {
            suscripcionActual = data;
            mostrarEstadoSuscripcion(data);
        }
    } catch (error) {
        console.error('Error al cargar suscripción:', error);
    }
}

function mostrarEstadoSuscripcion(suscripcion) {
    const statusSection = document.getElementById('suscripcionStatus');
    if (!statusSection) return;
    
    statusSection.style.display = 'block';
    
    const montoEl = document.getElementById('montoSuscripcion');
    if (montoEl) montoEl.textContent = parseFloat(suscripcion.monto).toFixed(2);
    
    const proximaEl = document.getElementById('proximoCargo');
    if (proximaEl) {
        const proximaFecha = new Date(suscripcion.proxima_fecha_cargo);
        proximaEl.textContent = proximaFecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    const tarjetaEl = document.getElementById('tarjetaSuscripcion');
    if (tarjetaEl) tarjetaEl.textContent = `**** ${suscripcion.ultimos_digitos}`;
}

// ============================================
// 6. ESTADÍSTICAS
// ============================================

function actualizarEstadisticas(donaciones) {
    // Filtrar solo donaciones completadas
    const donacionesCompletadas = donaciones.filter(d => 
        d.estado === 'completado' || d.estado_pago === 'completado'
    );
    
    // Calcular total donado
    const totalDonado = donacionesCompletadas.reduce((sum, d) => sum + parseFloat(d.monto), 0);
    
    // Calcular número de donaciones
    const numDonaciones = donacionesCompletadas.length;
    
    // Calcular promedio
    const promedio = numDonaciones > 0 ? totalDonado / numDonaciones : 0;
    
    // Actualizar UI
    const totalEl = document.getElementById('totalDonado');
    if (totalEl) totalEl.textContent = `$${totalDonado.toFixed(2)}`;
    
    const numeroEl = document.getElementById('numeroDonaciones');
    if (numeroEl) numeroEl.textContent = numDonaciones;
    
    const promedioEl = document.getElementById('promedioDonacion');
    if (promedioEl) promedioEl.textContent = `$${promedio.toFixed(2)}`;
    
    console.log('Estadísticas actualizadas:', {
        total: totalDonado,
        cantidad: numDonaciones,
        promedio: promedio
    });
}

function actualizarEstadisticasVacias() {
    const totalEl = document.getElementById('totalDonado');
    if (totalEl) totalEl.textContent = '$0';
    
    const numeroEl = document.getElementById('numeroDonaciones');
    if (numeroEl) numeroEl.textContent = '0';
    
    const promedioEl = document.getElementById('promedioDonacion');
    if (promedioEl) promedioEl.textContent = '$0';
}

// ============================================
// 7. PAGINACIÓN
// ============================================

function mostrarPaginaHistorial(pagina) {
    const inicio = (pagina - 1) * DONACIONES_POR_PAGINA;
    const fin = inicio + DONACIONES_POR_PAGINA;
    const paginaDatos = donacionesFiltradas.slice(inicio, fin);
    
    const tbody = document.getElementById('donacionesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (paginaDatos.length === 0 && donacionesFiltradas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem; color: #6b7280;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style="margin: 0 auto 1rem; opacity: 0.3;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="currentColor"/>
                    </svg>
                    <div style="font-size: 1.125rem; font-weight: 600; color: #1a1a1a; margin-bottom: 0.5rem;">No hay donaciones registradas</div>
                    <div>Realiza tu primera donación para apoyar a la comunidad</div>
                </td>
            </tr>
        `;
        return;
    }
    
    paginaDatos.forEach(donacion => {
        const row = document.createElement('tr');
        const fecha = new Date(donacion.fecha_donacion);
        const tipoDonacion = donacion.tipo_donacion || 'unica';
        const estado = donacion.estado || donacion.estado_pago || 'completado';
        const descripcion = donacion.descripcion || donacion.mensaje || 'Donación general';
        
        row.innerHTML = `
            <td>${fecha.toLocaleDateString('es-MX')}</td>
            <td>${descripcion}</td>
            <td style="font-weight: 600; color: #5f0d51;">$${parseFloat(donacion.monto).toFixed(2)}</td>
            <td><span class="badge-tipo-${tipoDonacion}">${tipoDonacion === 'mensual' ? 'Mensual' : 'Única'}</span></td>
            <td><span class="badge-estado-${estado}">${estado === 'completado' ? 'Completado' : 'Pendiente'}</span></td>
        `;
        tbody.appendChild(row);
    });
    
    actualizarPaginacionHistorial(pagina);
}

function actualizarPaginacionHistorial(pagina) {
    const totalPaginas = Math.ceil(donacionesFiltradas.length / DONACIONES_POR_PAGINA);
    
    const paginaInfo = document.getElementById('paginaInfo');
    if (paginaInfo) {
        paginaInfo.textContent = `Página ${pagina} de ${totalPaginas || 1}`;
    }
    
    const btnPrev = document.getElementById('btnPrevHistorial');
    if (btnPrev) btnPrev.disabled = pagina === 1;
    
    const btnNext = document.getElementById('btnNextHistorial');
    if (btnNext) btnNext.disabled = pagina === totalPaginas || totalPaginas === 0;
    
    paginaActualHistorial = pagina;
}

function mostrarSinDonaciones() {
    const tbody = document.getElementById('donacionesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 3rem; color: #6b7280;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style="margin: 0 auto 1rem; opacity: 0.3;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="currentColor"/>
                </svg>
                <div style="font-size: 1.125rem; font-weight: 600; color: #1a1a1a; margin-bottom: 0.5rem;">No hay donaciones registradas</div>
                <div>Realiza tu primera donación para apoyar a la comunidad</div>
            </td>
        </tr>
    `;
}

// ============================================
// 8. FILTROS
// ============================================

function aplicarFiltros() {
    const filtroMonto = document.getElementById('filtroMonto');
    const filtroFecha = document.getElementById('filtroFecha');
    
    if (!filtroMonto || !filtroFecha) return;
    
    const valorMonto = filtroMonto.value;
    const valorFecha = filtroFecha.value;
    
    donacionesFiltradas = [...todasLasDonaciones];
    
    // Ordenar por monto
    if (valorMonto === 'mayor') {
        donacionesFiltradas.sort((a, b) => parseFloat(b.monto) - parseFloat(a.monto));
    } else if (valorMonto === 'menor') {
        donacionesFiltradas.sort((a, b) => parseFloat(a.monto) - parseFloat(b.monto));
    }
    
    // Ordenar por fecha
    if (valorFecha === 'reciente') {
        donacionesFiltradas.sort((a, b) => new Date(b.fecha_donacion) - new Date(a.fecha_donacion));
    } else if (valorFecha === 'antiguo') {
        donacionesFiltradas.sort((a, b) => new Date(a.fecha_donacion) - new Date(b.fecha_donacion));
    }
    
    mostrarPaginaHistorial(1);
}

function limpiarFiltros() {
    const filtroMonto = document.getElementById('filtroMonto');
    const filtroFecha = document.getElementById('filtroFecha');
    
    if (filtroMonto) filtroMonto.value = '';
    if (filtroFecha) filtroFecha.value = '';
    
    donacionesFiltradas = [...todasLasDonaciones];
    mostrarPaginaHistorial(1);
}

// ============================================
// 9. MODAL DE SUSCRIPCIÓN
// ============================================

function abrirModalSuscripcion(modo) {
    const modal = document.getElementById('modalSuscripcion');
    if (!modal) return;
    
    modal.classList.add('active');
    
    // Llenar selector de días
    const selectDia = document.getElementById('diaCargoInput');
    if (selectDia && selectDia.children.length === 1) {
        for (let i = 1; i <= 28; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Día ${i}`;
            selectDia.appendChild(option);
        }
    }
    
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('formSuscripcion');
    
    if (modo === 'editar' && suscripcionActual) {
        if (modalTitle) modalTitle.textContent = 'Editar Suscripción Mensual';
        
        const montoInput = document.getElementById('montoInput');
        const diaCargoInput = document.getElementById('diaCargoInput');
        const tipoTarjetaRadio = document.querySelector(`input[name="tipoTarjeta"][value="${suscripcionActual.tipo_tarjeta}"]`);
        
        if (montoInput) montoInput.value = suscripcionActual.monto;
        if (diaCargoInput) diaCargoInput.value = suscripcionActual.dia_cargo;
        if (tipoTarjetaRadio) tipoTarjetaRadio.checked = true;
    } else {
        if (modalTitle) modalTitle.textContent = 'Nueva Suscripción Mensual';
        if (form) form.reset();
    }
}

function cerrarModal() {
    const modal = document.getElementById('modalSuscripcion');
    if (modal) modal.classList.remove('active');
}

async function guardarSuscripcion(e) {
    e.preventDefault();
    
    const socioId = sessionStorage.getItem('socioId');
    const montoInput = document.getElementById('montoInput');
    const diaCargoInput = document.getElementById('diaCargoInput');
    const tipoTarjetaChecked = document.querySelector('input[name="tipoTarjeta"]:checked');
    const numeroTarjetaInput = document.getElementById('numeroTarjetaInput');
    const bancoNombreEl = document.getElementById('bancoNombre');
    
    if (!montoInput || !diaCargoInput || !tipoTarjetaChecked || !numeroTarjetaInput) {
        mostrarMensaje('Por favor completa todos los campos', 'error');
        return;
    }
    
    const monto = montoInput.value;
    const diaCargo = diaCargoInput.value;
    const tipoTarjeta = tipoTarjetaChecked.value;
    const numeroTarjeta = numeroTarjetaInput.value.replace(/\s/g, '');
    const ultimos4 = numeroTarjeta.slice(-4);
    const banco = bancoNombreEl ? bancoNombreEl.textContent || 'Otro' : 'Otro';
    
    // Calcular próxima fecha de cargo
    const proximaFecha = new Date();
    if (proximaFecha.getDate() > parseInt(diaCargo)) {
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);
    }
    proximaFecha.setDate(parseInt(diaCargo));
    
    const dataSuscripcion = {
        socio_id: socioId,
        monto: parseFloat(monto),
        tipo_tarjeta: tipoTarjeta,
        ultimos_digitos: ultimos4,
        banco: banco,
        dia_cargo: parseInt(diaCargo),
        estado: 'activa',
        proxima_fecha_cargo: proximaFecha.toISOString().split('T')[0]
    };
    
    try {
        if (suscripcionActual) {
            // Actualizar
            const { error } = await window.supabaseClient
                .from('suscripciones_mensuales')
                .update(dataSuscripcion)
                .eq('id', suscripcionActual.id);
            
            if (error) throw error;
            mostrarMensaje('Suscripción actualizada exitosamente', 'success');
        } else {
            // Crear nueva
            const { error } = await window.supabaseClient
                .from('suscripciones_mensuales')
                .insert(dataSuscripcion);
            
            if (error) throw error;
            mostrarMensaje('Suscripción creada exitosamente', 'success');
        }
        
        cerrarModal();
        await cargarSuscripcion(socioId);
    } catch (error) {
        console.error('Error al guardar suscripción:', error);
        mostrarMensaje('Error al guardar suscripción: ' + error.message, 'error');
    }
}

async function cancelarSuscripcion(socioId) {
    try {
        const { error } = await window.supabaseClient
            .from('suscripciones_mensuales')
            .update({ 
                estado: 'cancelada',
                fecha_cancelacion: new Date().toISOString()
            })
            .eq('socio_id', socioId)
            .eq('estado', 'activa');
        
        if (error) throw error;
        
        const statusSection = document.getElementById('suscripcionStatus');
        if (statusSection) statusSection.style.display = 'none';
        
        suscripcionActual = null;
        mostrarMensaje('Suscripción cancelada exitosamente', 'success');
    } catch (error) {
        console.error('Error al cancelar suscripción:', error);
        mostrarMensaje('Error al cancelar suscripción: ' + error.message, 'error');
    }
}

// ============================================
// 10. DETECCIÓN DE BANCO
// ============================================

function detectarBanco(e) {
    const numero = e.target.value.replace(/\s/g, '');
    const primeros4 = numero.substring(0, 4);
    
    let bancoDetectado = null;
    
    for (const [nombre, info] of Object.entries(BANCOS_MEXICO)) {
        if (info.bins.some(bin => primeros4.startsWith(bin))) {
            bancoDetectado = nombre;
            break;
        }
    }
    
    const bancoLogo = document.getElementById('bancoLogo');
    const bancoNombre = document.getElementById('bancoNombre');
    
    if (bancoDetectado && bancoLogo && bancoNombre) {
        bancoLogo.style.display = 'flex';
        bancoNombre.textContent = bancoDetectado;
        bancoNombre.style.color = BANCOS_MEXICO[bancoDetectado].color;
    } else if (bancoLogo) {
        bancoLogo.style.display = 'none';
    }
}

function formatearNumeroTarjeta(e) {
    let valor = e.target.value.replace(/\s/g, '');
    let formateado = valor.match(/.{1,4}/g)?.join(' ') || valor;
    e.target.value = formateado;
}

// ============================================
// 11. EVENT LISTENERS
// ============================================

function configurarEventListeners(socioId) {
    // Botones principales
    const btnDonacionUnica = document.getElementById('btnDonacionUnica');
    if (btnDonacionUnica) {
        btnDonacionUnica.addEventListener('click', () => {
            window.location.href = 'socio-donar.html?tipo=unica';
        });
    }
    
    const btnSuscripcionMensual = document.getElementById('btnSuscripcionMensual');
    if (btnSuscripcionMensual) {
        btnSuscripcionMensual.addEventListener('click', () => {
            if (suscripcionActual) {
                mostrarMensaje('Ya tienes una suscripción activa. Puedes editarla o cancelarla.', 'info');
            } else {
                abrirModalSuscripcion('crear');
            }
        });
    }
    
    // Gestión de suscripción
    const btnEditar = document.getElementById('btnEditarSuscripcion');
    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            abrirModalSuscripcion('editar');
        });
    }
    
    const btnCancelar = document.getElementById('btnCancelarSuscripcion');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', async () => {
            if (confirm('¿Estás seguro de cancelar tu suscripción mensual? Esta acción no se puede deshacer.')) {
                await cancelarSuscripcion(socioId);
            }
        });
    }
    
    // Paginación
    const btnPrev = document.getElementById('btnPrevHistorial');
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (paginaActualHistorial > 1) {
                mostrarPaginaHistorial(paginaActualHistorial - 1);
            }
        });
    }
    
    const btnNext = document.getElementById('btnNextHistorial');
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const totalPaginas = Math.ceil(donacionesFiltradas.length / DONACIONES_POR_PAGINA);
            if (paginaActualHistorial < totalPaginas) {
                mostrarPaginaHistorial(paginaActualHistorial + 1);
            }
        });
    }
    
    // Filtros
    const filtroMonto = document.getElementById('filtroMonto');
    if (filtroMonto) filtroMonto.addEventListener('change', aplicarFiltros);
    
    const filtroFecha = document.getElementById('filtroFecha');
    if (filtroFecha) filtroFecha.addEventListener('change', aplicarFiltros);
    
    const btnLimpiar = document.getElementById('btnLimpiarFiltros');
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFiltros);
    
    // Modal
    const btnCerrarModal = document.getElementById('btnCerrarModal');
    if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
    
    const btnCancelarModal = document.getElementById('btnCancelarModal');
    if (btnCancelarModal) btnCancelarModal.addEventListener('click', cerrarModal);
    
    const formSuscripcion = document.getElementById('formSuscripcion');
    if (formSuscripcion) formSuscripcion.addEventListener('submit', guardarSuscripcion);
    
    // Detección de banco
    const numeroTarjetaInput = document.getElementById('numeroTarjetaInput');
    if (numeroTarjetaInput) {
        numeroTarjetaInput.addEventListener('input', function(e) {
            formatearNumeroTarjeta(e);
            detectarBanco(e);
        });
    }
    
    // Cerrar modal al hacer clic fuera
    const modalOverlay = document.getElementById('modalSuscripcion');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target.id === 'modalSuscripcion') {
                cerrarModal();
            }
        });
    }
    
    // Cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }
}

// ============================================
// 12. UTILIDADES
// ============================================

function mostrarMensaje(mensaje, tipo) {
    const colores = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    
    const mensajeDiv = document.createElement('div');
    mensajeDiv.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${colores[tipo] || colores.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    mensajeDiv.textContent = mensaje;
    document.body.appendChild(mensajeDiv);
    
    setTimeout(() => {
        mensajeDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => mensajeDiv.remove(), 300);
    }, 4000);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
