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
    // CORREGIDO: Obtener el estado desde usuarios
    const { data: socios } = await window.supabaseClient
        .from('socios')
        .select('*, usuarios (nombre_completo, email, telefono, estado)')
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
        
        // CORREGIDO: Obtener estado desde usuarios
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;">No hay socios</td></tr>';
        return;
    }
    tbody.innerHTML = sociosPagina.map(socio => {
        const nombre = socio.usuarios?.nombre_completo || 'N/A';
        const email = socio.usuarios?.email || 'N/A';
        const telefono = socio.usuarios?.telefono || 'N/A';
        const fecha = socio.fecha_ingreso || 'N/A';
        const eventos = socio.total_eventos_asistidos || 0;
        const donaciones = Math.round(parseFloat(socio.total_donaciones || 0));
        // CORREGIDO: Obtener estado desde usuarios
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
