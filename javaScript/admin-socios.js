 console.log('Sistema de socios iniciando...');

let sociosGlobal = [];
let sociosFiltrados = [];
let paginaActualSocios = 1;
let itemsPorPaginaSocios = 10;

document.addEventListener('DOMContentLoaded', function () {
    verificarAutenticacion();
    setTimeout(() => {
    if (window.supabaseClient) {
            cargarDatos();
        }
    }, 500);
    configurarEventos();
    configurarValidaciones();
    configurarFiltrosPaginacionSocios();
});

// ============= FILTROS Y PAGINACIÓN SOCIOS (FUNCIÓN ÚNICA) =============
function configurarFiltrosPaginacionSocios() {
    document.getElementById('btnAplicarFiltrosSocios')?.addEventListener('click', aplicarFiltrosYRedibujarSocios);
    document.getElementById('btnLimpiarFiltrosSocios')?.addEventListener('click', limpiarFiltrosSocios);

    document.getElementById('filtroBuscar')?.addEventListener('input', aplicarFiltrosYRedibujarSocios);
    document.getElementById('filtroEstado')?.addEventListener('change', aplicarFiltrosYRedibujarSocios);
    document.getElementById('filtroFechaDesde')?.addEventListener('change', aplicarFiltrosYRedibujarSocios);
    document.getElementById('filtroFechaHasta')?.addEventListener('change', aplicarFiltrosYRedibujarSocios);

    document.getElementById('selectItemsPorPaginaSocios')?.addEventListener('change', function (e) {
        itemsPorPaginaSocios = parseInt(e.target.value, 10) || 10;
        paginaActualSocios = 1;
        aplicarFiltrosYRedibujarSocios();
    });

    document.getElementById('btnPrevSocios')?.addEventListener('click', () => cambiarPaginaSocios(-1));
    document.getElementById('btnNextSocios')?.addEventListener('click', () => cambiarPaginaSocios(1));
}

// =========================== AUTENTICACIÓN ===========================
function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    if (!isLoggedIn || userType !== 'admin') {
        window.location.href = 'login.html';
    }
}

// ======================= CONFIGURACIÓN DE EVENTOS ====================
function configurarEventos() {
    document.getElementById('btnAgregarSocio')?.addEventListener('click', abrirModal);
    document.getElementById('btnCerrarModal')?.addEventListener('click', cerrarModal);
    document.getElementById('btnCancelarModal')?.addEventListener('click', cerrarModal);
    document.querySelector('.modal-overlay')?.addEventListener('click', cerrarModal);
    document.getElementById('formSocio')?.addEventListener('submit', function (e) {
        e.preventDefault();
        guardarSocio();
  });
}

// ======================= VALIDACIONES EN TIEMPO REAL =================
function configurarValidaciones() {
    const nombreInput = document.getElementById('nombreCompleto');
    const emailInput = document.getElementById('email');
    const telefonoInput = document.getElementById('telefono');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('passwordConfirm');

    if (nombreInput) {
        nombreInput.addEventListener('input', validarNombre);
        nombreInput.addEventListener('blur', validarNombre);
    }
    if (emailInput) emailInput.addEventListener('blur', validarEmail);
    if (telefonoInput) {
        telefonoInput.addEventListener('input', validarTelefono);
        telefonoInput.addEventListener('blur', validarTelefono);
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            validarPassword();
            document.getElementById('passwordRequirements').style.display = 'block';
        });
        passwordInput.addEventListener('focus', function () {
            document.getElementById('passwordRequirements').style.display = 'block';
        });
    }
    if (passwordConfirmInput) {
        passwordConfirmInput.addEventListener('input', validarPasswordConfirm);
    }
}

function validarNombre() {
    const nombre = document.getElementById('nombreCompleto').value.trim();
    const error = document.getElementById('nombreError');

    if (!nombre) {
        error.textContent = 'El nombre completo es obligatorio';
        return false;
    }
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(nombre)) {
        error.textContent = 'El nombre solo puede contener letras';
        return false;
    }
    if (nombre.length < 3) {
        error.textContent = 'El nombre debe tener al menos 3 caracteres';
        return false;
    }
    error.textContent = '';
    return true;
}

function validarEmail() {
    const email = document.getElementById('email').value.trim();
    const error = document.getElementById('emailError');

    if (!email) {
        error.textContent = 'El correo electrónico es obligatorio';
        return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        error.textContent = 'Formato de correo inválido';
        return false;
    }
    const dominiosPermitidos = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'live.com', 'icloud.com', 'protonmail.com'];
    const dominio = email.split('@')[1]?.toLowerCase();
    if (!dominiosPermitidos.includes(dominio)) {
        error.textContent = 'Solo se permiten dominios comunes (gmail, hotmail, outlook, yahoo)';
        return false;
    }
    error.textContent = '';
    return true;
}

function validarTelefono() {
    const telefono = document.getElementById('telefono').value.trim();
    const error = document.getElementById('telefonoError');
    const telefonoLimpio = telefono.replace(/\D/g, '');
    document.getElementById('telefono').value = telefonoLimpio;

    if (!telefonoLimpio) {
        error.textContent = 'El teléfono es obligatorio';
        return false;
    }
    if (telefonoLimpio.length !== 10) {
        error.textContent = 'El teléfono debe tener exactamente 10 dígitos';
        return false;
    }
    error.textContent = '';
    return true;
}

function validarPassword() {
    const password = document.getElementById('password').value;
    const error = document.getElementById('passwordError');

    const requisitos = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[@$!%*?&]/.test(password)
    };

    document.getElementById('req-length').className = requisitos.length ? 'requirement valid' : 'requirement invalid';
    document.getElementById('req-uppercase').className = requisitos.uppercase ? 'requirement valid' : 'requirement invalid';
    document.getElementById('req-lowercase').className = requisitos.lowercase ? 'requirement valid' : 'requirement invalid';
    document.getElementById('req-number').className = requisitos.number ? 'requirement valid' : 'requirement invalid';
    document.getElementById('req-special').className = requisitos.special ? 'requirement valid' : 'requirement invalid';

    const todosValidos = Object.values(requisitos).every(v => v);

    if (!password) {
        error.textContent = 'La contraseña es obligatoria';
        return false;
    }
    if (!todosValidos) {
        error.textContent = 'La contraseña no cumple con todos los requisitos';
        return false;
    }

    const cumplidos = Object.values(requisitos).filter(v => v).length;
    const fortaleza = cumplidos === 5 ? 'strong' : (cumplidos >= 3 ? 'medium' : 'weak');
    const textos = { weak: 'Contraseña débil', medium: 'Contraseña media', strong: 'Contraseña fuerte' };
    const strengthDiv = document.getElementById('passwordStrength');
    strengthDiv.textContent = textos[fortaleza];
    strengthDiv.className = `password-strength show strength-${fortaleza}`;
    strengthDiv.style.display = 'block';

    error.textContent = '';
    return true;
}

function validarPasswordConfirm() {
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    const error = document.getElementById('passwordConfirmError');

    if (!passwordConfirm) {
        error.textContent = 'Debes confirmar tu contraseña';
        return false;
    }
    if (password !== passwordConfirm) {
        error.textContent = 'Las contraseñas no coinciden';
        return false;
    }
    error.textContent = '';
    return true;
}

// =================== CARGAR DATOS Y SOCIOS =============================
async function cargarDatos() {
    if (!window.supabaseClient) return;
    try {
        await cargarEstadisticas();
        await cargarSocios();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cargarEstadisticas() {
    const { data: usuariosSocios } = await window.supabaseClient
        .from('usuarios')
        .select('id, estado')
        .eq('tipo_usuario', 'socio');
    
    const sociosActivos = usuariosSocios?.filter(u => u.estado === 'activo').length || 0;
    
    const { data: todosSocios } = await window.supabaseClient.from('socios').select('id');
    const { data: sociosConEventos } = await window.supabaseClient.from('socios').select('total_eventos_asistidos');
    const { data: sociosConDonaciones } = await window.supabaseClient.from('socios').select('total_donaciones');

    document.getElementById('sociosActivos').textContent = sociosActivos;
    document.getElementById('totalSocios').textContent = todosSocios?.length || 0;
    document.getElementById('eventosAsistidos').textContent = sociosConEventos?.reduce((sum, s) => sum + (s.total_eventos_asistidos || 0), 0) || 0;
    document.getElementById('donacionesSocios').textContent = '$' + Math.round(sociosConDonaciones?.reduce((sum, s) => sum + parseFloat(s.total_donaciones || 0), 0) || 0).toLocaleString('es-MX');
}

async function cargarSocios() {
    // Obtener socios con información de usuarios usando usuario_id
    const { data: socios } = await window.supabaseClient
        .from('socios')
        .select(`
            *,
            usuarios!socios_usuario_id_fkey (
                nombre_completo,
                email,
                telefono,
                estado
            )
        `)
        .order('fecha_ingreso', { ascending: false });

    sociosGlobal = socios || [];
    console.log('Socios cargados:', sociosGlobal.length);
    aplicarFiltrosYRedibujarSocios();
}

function obtenerFiltrosSocios() {
    const buscar = document.getElementById('filtroBuscar')?.value.toLowerCase().trim() || '';
    const estado = document.getElementById('filtroEstado')?.value || '';
    const fechaDesde = document.getElementById('filtroFechaDesde')?.value || '';
    const fechaHasta = document.getElementById('filtroFechaHasta')?.value || '';
    return { buscar, estado, fechaDesde, fechaHasta };
}

function aplicarFiltrosYRedibujarSocios() {
    const { buscar, estado, fechaDesde, fechaHasta } = obtenerFiltrosSocios();

    console.log('=== FILTROS SOCIOS ===');
    console.log('Estado filtro:', estado);
    console.log('Total socios:', sociosGlobal.length);

    sociosFiltrados = sociosGlobal.filter(socio => {
        const nombre = (socio.usuarios?.nombre_completo || '').toLowerCase();
        const email = (socio.usuarios?.email || '').toLowerCase();
        const telefono = (socio.usuarios?.telefono || '').toLowerCase();
        if (buscar && !(nombre.includes(buscar) || email.includes(buscar) || telefono.includes(buscar))) return false;

        // CORREGIDO: Obtener estado desde la tabla usuarios
        if (estado && estado.trim() !== '') {
            const socioEstado = (socio.usuarios?.estado || 'activo').toLowerCase();
            const estadoFiltro = estado.toLowerCase();
            if (socioEstado !== estadoFiltro) return false;
        }

        if (fechaDesde && socio.fecha_ingreso < fechaDesde) return false;
        if (fechaHasta && socio.fecha_ingreso > fechaHasta) return false;
        return true;
    });

    console.log('Socios filtrados:', sociosFiltrados.length);

    const totalPaginas = calcularTotalPaginasSocios();
    if (paginaActualSocios > totalPaginas) paginaActualSocios = totalPaginas;
    if (paginaActualSocios < 1) paginaActualSocios = 1;

    mostrarSociosPaginados();
    actualizarPaginacionSocios();
}

function limpiarFiltrosSocios() {
    document.getElementById('filtroBuscar').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = '';
    paginaActualSocios = 1;
    aplicarFiltrosYRedibujarSocios();
}

function calcularTotalPaginasSocios() {
    return Math.max(1, Math.ceil(sociosFiltrados.length / itemsPorPaginaSocios));
}

function cambiarPaginaSocios(delta) {
    const total = calcularTotalPaginasSocios();
    paginaActualSocios += delta;
    if (paginaActualSocios < 1) paginaActualSocios = 1;
    if (paginaActualSocios > total) paginaActualSocios = total;
    mostrarSociosPaginados();
    actualizarPaginacionSocios();
}

function mostrarSociosPaginados() {
    const tbody = document.getElementById('tablaSocios');
    if (!tbody) return;
    const inicio = (paginaActualSocios - 1) * itemsPorPaginaSocios;
    const fin = inicio + itemsPorPaginaSocios;
    const sociosPagina = sociosFiltrados.slice(inicio, fin);

    if (!sociosPagina.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;">No hay socios</td></tr>';
        return;
    }
    tbody.innerHTML = sociosPagina.map(socio => {
        const nombre = socio.usuarios?.nombre_completo || 'N/A';
        const email = socio.usuarios?.email || 'N/A';
        const telefono = socio.usuarios?.telefono || 'N/A';
        const fecha = socio.fecha_ingreso || 'N/A';
        const eventos = socio.total_eventos_asistidos || 0;
        const donaciones = Math.round(parseFloat(socio.total_donaciones || 0));
        // CORREGIDO: Obtener estado desde la tabla usuarios
        const estado = socio.usuarios?.estado || 'activo';

        return `
            <tr>
                <td style="font-weight:600;">${nombre}</td>
                <td>${email}</td>
                <td>${telefono}</td>
                <td>${fecha}</td>
                <td style="text-align:center;">${eventos}</td>
                <td style="text-align:right;">$${donaciones.toLocaleString('es-MX')}</td>
                <td><span style="background:${estado === 'activo' ? '#d1fae5' : '#fee2e2'};color:${estado === 'activo' ? '#065f46' : '#991b1b'};padding:0.25rem 0.75rem;border-radius:6px;font-size:0.75rem;font-weight:600;">${estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
                <td style="text-align:center;">
                    <button class="btn-ver-detalles" onclick="abrirDetallesSocio('${socio.id}', '${email}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        Ver Detalles
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function actualizarPaginacionSocios() {
    const total = calcularTotalPaginasSocios();
    document.getElementById('paginaActualSocios').textContent = String(paginaActualSocios);
    document.getElementById('totalPaginasSocios').textContent = String(total);
    
    const btnPrev = document.getElementById('btnPrevSocios');
    const btnNext = document.getElementById('btnNextSocios');
    
    if (btnPrev) btnPrev.disabled = paginaActualSocios <= 1;
    if (btnNext) btnNext.disabled = paginaActualSocios >= total;
}

// =============================== MODAL =============================

function abrirModal() {
    const modal = document.getElementById('modalSocio');
    if (modal) {
        modal.style.display = 'flex';
        limpiarFormulario();
    }
}

function cerrarModal() {
    const modal = document.getElementById('modalSocio');
    if (modal) modal.style.display = 'none';
    limpiarFormulario();
}

function limpiarFormulario() {
    document.getElementById('formSocio')?.reset();
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.getElementById('modalMessage').innerHTML = '';
    document.getElementById('passwordStrength').style.display = 'none';
    document.getElementById('passwordRequirements').style.display = 'none';
}

function mostrarMensaje(texto, tipo) {
    const container = document.getElementById('modalMessage');
    container.innerHTML = `<div class="message message-${tipo}" style="padding:1rem;border-radius:8px;margin-bottom:1rem;background:${tipo === 'success' ? '#d1fae5' : '#fee2e2'};color:${tipo === 'success' ? '#065f46' : '#dc2626'};border:1px solid ${tipo === 'success' ? '#a7f3d0' : '#fecaca'};">${texto}</div>`;
    if (tipo === 'success') setTimeout(() => container.innerHTML = '', 3000);
}

async function guardarSocio() {
    const nombreValido = validarNombre();
    const emailValido = validarEmail();
    const telefonoValido = validarTelefono();
    const passwordValido = validarPassword();
    const passwordConfirmValido = validarPasswordConfirm();

    if (!nombreValido || !emailValido || !telefonoValido || !passwordValido || !passwordConfirmValido) {
        mostrarMensaje('Por favor corrige los errores en el formulario', 'error');
        return;
    }

    const nombre = document.getElementById('nombreCompleto').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const password = document.getElementById('password').value;
    const estado = document.getElementById('estado').value;

    const btnGuardar = document.getElementById('btnGuardarSocio');
    const btnText = document.getElementById('btnGuardarText');
    const btnLoader = document.getElementById('btnGuardarLoader');
    const loader = document.getElementById('loader');

    try {
        btnGuardar.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        if (loader) loader.style.display = 'flex';

        const { data: existe } = await window.supabaseClient.from('usuarios').select('id').eq('email', email).maybeSingle();
        if (existe) throw new Error('Este correo ya está registrado');

        const { error } = await window.supabaseClient.from('usuarios').insert({
            email, password_hash: password, nombre_completo: nombre, telefono, tipo_usuario: 'socio', estado
        });

        if (error) throw error;

        mostrarMensaje('¡Socio creado exitosamente!', 'success');
        await cargarDatos();
        setTimeout(cerrarModal, 1500);

    } catch (error) {
        mostrarMensaje(error.message || 'Error al crear socio', 'error');
    } finally {
        btnGuardar.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        if (loader) loader.style.display = 'none';
    }
}

// =============================== DETALLES DEL SOCIO =============================

let socioActual = null; // Variable global para almacenar el socio actual

// Abrir modal de detalles del socio
async function abrirDetallesSocio(socioId, emailSocio) {
    try {
        // Buscar el socio en los datos globales
        const socio = sociosGlobal.find(s => s.id === socioId);
        if (!socio) {
            console.error('Socio no encontrado');
            return;
        }

        socioActual = socio;

        console.log('=== DATOS DEL SOCIO ===');
        console.log('ID:', socioId);
        console.log('Socio completo:', socio);
        console.log('Total donaciones (BD):', socio.total_donaciones);
        console.log('Total eventos (BD):', socio.total_eventos_asistidos);
        console.log('Estado socio:', socio.estado);
        console.log('Estado usuario:', socio.usuarios?.estado);

        // Actualizar información básica en el modal header
        document.getElementById('detallesNombreSocio').textContent = socio.usuarios?.nombre_completo || 'Socio';
        document.getElementById('detallesEmailSocio').textContent = emailSocio;

        // Actualizar información personal del socio
        document.getElementById('infoNombre').textContent = socio.usuarios?.nombre_completo || 'N/A';
        document.getElementById('infoEmail').textContent = socio.usuarios?.email || 'N/A';
        document.getElementById('infoTelefono').textContent = socio.usuarios?.telefono || 'N/A';

        // Formatear fecha de ingreso
        const fechaIngreso = socio.fecha_ingreso ? new Date(socio.fecha_ingreso).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'N/A';
        document.getElementById('infoFechaIngreso').textContent = fechaIngreso;

        // Estado del socio (usar el campo estado de la tabla usuarios, NO de socios)
        const estadoSocio = socio.usuarios?.estado || 'activo';
        const estadoHTML = `<span style="display:inline-block;background:${estadoSocio === 'activo' ? '#d1fae5' : '#fee2e2'};color:${estadoSocio === 'activo' ? '#065f46' : '#991b1b'};padding:0.25rem 0.75rem;border-radius:6px;font-size:0.75rem;font-weight:600;">${estadoSocio === 'activo' ? 'Activo' : 'Inactivo'}</span>`;
        document.getElementById('infoEstado').innerHTML = estadoHTML;

        // Eventos asistidos
        document.getElementById('infoEventosAsistidos').textContent = socio.total_eventos_asistidos || 0;

        // Notas (mostrar solo si existen)
        const notasContainer = document.getElementById('infoNotasContainer');
        const notasText = document.getElementById('infoNotas');
        if (socio.notas && socio.notas.trim() !== '') {
            notasText.textContent = socio.notas;
            notasContainer.style.display = 'block';
        } else {
            notasContainer.style.display = 'none';
        }

        // Limpiar formulario de email
        document.getElementById('emailAsunto').value = '';
        document.getElementById('emailCuerpo').value = '';
        document.getElementById('emailMessage').innerHTML = '';

        // Abrir el modal
        document.getElementById('modalDetallesSocio').style.display = 'flex';

        // Cargar datos del socio
        await cargarKPIsSocio(socioId);
        await cargarHistorialDonaciones(socioId);
    } catch (error) {
        console.error('Error al abrir detalles:', error);
        alert('Error al cargar los detalles del socio');
    }
}

// Cerrar modal de detalles
function cerrarDetallesSocio() {
    document.getElementById('modalDetallesSocio').style.display = 'none';
    socioActual = null;
}

// Cargar KPIs del socio
async function cargarKPIsSocio(socioId) {
    try {
        // Obtener el email del socio para buscar donaciones
        const socio = sociosGlobal.find(s => s.id === socioId);
        const emailSocio = socio?.usuarios?.email;

        console.log('Buscando donaciones para:', { socioId, emailSocio });

        // Buscar donaciones por socio_id O por email
        const { data: donaciones, error } = await window.supabaseClient
            .from('donaciones')
            .select('monto, fecha_donacion, estado_pago')
            .or(`socio_id.eq.${socioId},donante_email.eq.${emailSocio}`)
            .eq('estado_pago', 'completado');

        if (error) throw error;

        console.log('Donaciones encontradas:', donaciones?.length || 0);

        // Calcular totales
        const totalHistorico = donaciones?.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0) || 0;

        // Obtener año y mes actual
        const ahora = new Date();
        const añoActual = ahora.getFullYear();
        const mesActual = ahora.getMonth() + 1; // 0-indexed
        const nombreMes = ahora.toLocaleString('es-MX', { month: 'long' });

        // Filtrar donaciones del año actual
        const donacionesAñoActual = donaciones?.filter(d => {
            const fechaDonacion = new Date(d.fecha_donacion);
            return fechaDonacion.getFullYear() === añoActual;
        }) || [];
        const totalAñoActual = donacionesAñoActual.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);

        // Filtrar donaciones del mes actual
        const donacionesMesActual = donaciones?.filter(d => {
            const fechaDonacion = new Date(d.fecha_donacion);
            return fechaDonacion.getFullYear() === añoActual && (fechaDonacion.getMonth() + 1) === mesActual;
        }) || [];
        const totalMesActual = donacionesMesActual.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);

        console.log('KPIs calculados:', {
            totalHistorico,
            totalAñoActual,
            totalMesActual
        });

        // Comparar con el valor de la BD
        const totalBD = parseFloat(socioActual?.total_donaciones || 0);
        console.log('📊 COMPARACIÓN DE TOTALES:');
        console.log('Total en BD (socios.total_donaciones):', totalBD);
        console.log('Total calculado (desde donaciones):', totalHistorico);
        console.log('Diferencia:', Math.abs(totalBD - totalHistorico).toFixed(2));

        if (Math.abs(totalBD - totalHistorico) > 0.01) {
            console.warn('⚠️ ADVERTENCIA: Los totales NO coinciden!');
            console.log('Posibles razones:');
            console.log('- La BD incluye donaciones pendientes/fallidas');
            console.log('- El modal solo cuenta donaciones completadas');
            console.log('- Hay donaciones sin estado_pago definido');
        } else {
            console.log('✅ Los totales coinciden perfectamente');
        }

        // Actualizar UI
        document.getElementById('kpiTotalHistorico').textContent = '$' + totalHistorico.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('kpiYearLabel').textContent = añoActual;
        document.getElementById('kpiTotalYear').textContent = '$' + totalAñoActual.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('kpiMonthLabel').textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
        document.getElementById('kpiTotalMonth').textContent = '$' + totalMesActual.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    } catch (error) {
        console.error('Error al cargar KPIs:', error);
        document.getElementById('kpiTotalHistorico').textContent = 'Error';
        document.getElementById('kpiTotalYear').textContent = 'Error';
        document.getElementById('kpiTotalMonth').textContent = 'Error';
    }
}

// Cargar historial de últimas 5 donaciones
async function cargarHistorialDonaciones(socioId) {
    try {
        // Obtener el email del socio para buscar donaciones
        const socio = sociosGlobal.find(s => s.id === socioId);
        const emailSocio = socio?.usuarios?.email;

        // Buscar donaciones por socio_id O por email
        const { data: donaciones, error } = await window.supabaseClient
            .from('donaciones')
            .select('fecha_donacion, monto, metodo_pago, estado_pago')
            .or(`socio_id.eq.${socioId},donante_email.eq.${emailSocio}`)
            .order('fecha_donacion', { ascending: false })
            .limit(5);

        if (error) throw error;

        console.log('Historial de donaciones:', donaciones);

        const tbody = document.querySelector('#tablaHistorialDonaciones tbody');

        if (!donaciones || donaciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:2rem;">No hay donaciones registradas</td></tr>';
            return;
        }

        tbody.innerHTML = donaciones.map(d => {
            const fecha = new Date(d.fecha_donacion).toLocaleDateString('es-MX');
            const monto = '$' + parseFloat(d.monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const metodo = d.metodo_pago || 'N/A';
            const estadoPago = d.estado_pago || 'pendiente';

            // Color según estado
            let estadoColor = '#f3f4f6';
            let estadoTextColor = '#374151';
            if (estadoPago === 'completado') {
                estadoColor = '#d1fae5';
                estadoTextColor = '#065f46';
            } else if (estadoPago === 'fallido') {
                estadoColor = '#fee2e2';
                estadoTextColor = '#991b1b';
            }

            return `
                <tr>
                    <td>${fecha}</td>
                    <td style="font-weight:600;color:#6b1560;">${monto}</td>
                    <td>
                        <span style="background:${estadoColor};color:${estadoTextColor};padding:0.25rem 0.75rem;border-radius:6px;font-size:0.75rem;font-weight:600;">${metodo}</span>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error al cargar historial:', error);
        const tbody = document.querySelector('#tablaHistorialDonaciones tbody');
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:2rem;color:#dc2626;">Error al cargar donaciones</td></tr>';
    }
}

// Plantilla de email mensual
function aplicarPlantillaMensual() {
    if (!socioActual) return;

    const nombre = socioActual.usuarios?.nombre_completo || 'Estimado/a Socio';
    const ahora = new Date();
    const nombreMes = ahora.toLocaleString('es-MX', { month: 'long' });
    const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

    // Obtener el monto del mes actual desde el KPI
    const montoMesActual = document.getElementById('kpiTotalMonth').textContent;

    const asunto = `Gracias por tu apoyo en ${mesCapitalizado}`;
    const cuerpo = `Estimado/a ${nombre},

Queremos expresar nuestro más profundo agradecimiento por tu generosa contribución durante el mes de ${mesCapitalizado}.

Tu aporte de ${montoMesActual} ha sido fundamental para continuar con nuestras actividades y proyectos. Gracias a personas como tú, podemos seguir trabajando en beneficio de nuestra comunidad.

Tu compromiso y solidaridad nos motivan a seguir adelante con más fuerza.

¡Muchas gracias por ser parte de Kueni Kueni!

Con gratitud,
Asociación Civil Kueni Kueni`;

    document.getElementById('emailAsunto').value = asunto;
    document.getElementById('emailCuerpo').value = cuerpo;
}

// Plantilla de email anual
function aplicarPlantillaAnual() {
    if (!socioActual) return;

    const nombre = socioActual.usuarios?.nombre_completo || 'Estimado/a Socio';
    const añoActual = new Date().getFullYear();

    // Obtener el monto del año actual desde el KPI
    const montoAñoActual = document.getElementById('kpiTotalYear').textContent;

    const asunto = `Gracias por tu apoyo durante ${añoActual}`;
    const cuerpo = `Estimado/a ${nombre},

Al finalizar este año ${añoActual}, queremos hacer una pausa para agradecerte por tu invaluable apoyo.

Durante este año, tu contribución total de ${montoAñoActual} ha sido un pilar fundamental para nuestra organización. Cada peso donado ha tenido un impacto real y tangible en nuestra comunidad.

Tu constancia y generosidad nos inspiran día a día. Gracias a socios como tú, hemos logrado:
• Realizar eventos significativos para la comunidad
• Apoyar a quienes más lo necesitan
• Fortalecer los lazos de nuestra asociación

Esperamos contar con tu apoyo en el próximo año y seguir creciendo juntos.

Con profundo agradecimiento,
Asociación Civil Kueni Kueni`;

    document.getElementById('emailAsunto').value = asunto;
    document.getElementById('emailCuerpo').value = cuerpo;
}

// Enviar correo de agradecimiento
async function enviarCorreoAgradecimiento() {
    if (!socioActual) {
        mostrarMensajeEmail('No hay socio seleccionado', 'error');
        return;
    }

    const asunto = document.getElementById('emailAsunto').value.trim();
    const cuerpo = document.getElementById('emailCuerpo').value.trim();

    if (!asunto || !cuerpo) {
        mostrarMensajeEmail('Por favor completa el asunto y el mensaje', 'error');
        return;
    }

    const btnEnviar = document.getElementById('btnEnviarAgradecimiento');
    const btnText = document.getElementById('btnEnviarText');
    const btnLoader = document.getElementById('btnEnviarLoader');

    try {
        btnEnviar.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';

        const email = socioActual.usuarios?.email;
        const nombre = socioActual.usuarios?.nombre_completo;

        // Llamar al servidor de correos (ajusta la URL según tu configuración)
        const response = await fetch('http://localhost:3000/send-thanks-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                nombre: nombre,
                asunto: asunto,
                mensaje: cuerpo
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            mostrarMensajeEmail('¡Correo enviado exitosamente!', 'success');
            // Limpiar formulario después de 2 segundos
            setTimeout(() => {
                document.getElementById('emailAsunto').value = '';
                document.getElementById('emailCuerpo').value = '';
            }, 2000);
        } else {
            throw new Error(data.error || 'Error al enviar el correo');
        }

    } catch (error) {
        console.error('Error al enviar correo:', error);
        mostrarMensajeEmail('Error al enviar el correo. Verifica que el servidor esté activo.', 'error');
    } finally {
        btnEnviar.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// Mostrar mensaje en formulario de email
function mostrarMensajeEmail(texto, tipo) {
    const container = document.getElementById('emailMessage');
    container.innerHTML = `<div style="padding:1rem;border-radius:8px;margin-bottom:1rem;background:${tipo === 'success' ? '#d1fae5' : '#fee2e2'};color:${tipo === 'success' ? '#065f46' : '#dc2626'};border:1px solid ${tipo === 'success' ? '#a7f3d0' : '#fecaca'};font-weight:600;">${texto}</div>`;
    if (tipo === 'success') setTimeout(() => container.innerHTML = '', 3000);
}

// Configurar eventos para el modal de detalles
document.addEventListener('DOMContentLoaded', function() {
    // Cerrar modal de detalles
    document.getElementById('btnCerrarDetalles')?.addEventListener('click', cerrarDetallesSocio);
    document.querySelector('#modalDetallesSocio .modal-overlay')?.addEventListener('click', cerrarDetallesSocio);

    // Plantillas de email
    document.getElementById('btnPlantillaMensual')?.addEventListener('click', aplicarPlantillaMensual);
    document.getElementById('btnPlantillaAnual')?.addEventListener('click', aplicarPlantillaAnual);

    // Enviar correo
    document.getElementById('btnEnviarAgradecimiento')?.addEventListener('click', enviarCorreoAgradecimiento);
});
