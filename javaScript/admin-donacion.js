// admin-donaciones.js - CON EXPORTACIÓN, FILTROS Y PAGINACIÓN

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de donaciones inicializado');

    verificarAutenticacion();
    inicializarSelectorMes();

    setTimeout(() => {
        if (window.supabaseClient) {
            console.log('Supabase conectado');
            cargarDatos();
        } else {
            console.error('Supabase no disponible');
            setTimeout(() => cargarDatos(), 1000);
        }
    }, 500);

    // Event Listeners generales
    document.getElementById('btnExportarReporte')?.addEventListener('click', exportarReporte);
    document.getElementById('inputBuscar')?.addEventListener('input', aplicarFiltrosYRedibujar);
    document.getElementById('selectorMes')?.addEventListener('change', cambiarMes);

    // Filtros avanzados
    document.getElementById('btnAplicarFiltros')?.addEventListener('click', aplicarFiltrosYRedibujar);
    document.getElementById('btnLimpiarFiltros')?.addEventListener('click', limpiarFiltros);

    // Paginación
    document.getElementById('btnPrev')?.addEventListener('click', () => cambiarPagina(-1));
    document.getElementById('btnNext')?.addEventListener('click', () => cambiarPagina(1));
    document.getElementById('selectItemsPorPagina')?.addEventListener('change', () => {
        itemsPorPagina = parseInt(document.getElementById('selectItemsPorPagina').value, 10) || 10;
        paginaActual = 1;
        aplicarFiltrosYRedibujar();
    });
});

// ESTADO GLOBAL
let donacionesGlobal = [];      // Todas las donaciones del mes seleccionado
let donacionesFiltradas = [];   // Resultado de filtros/búsqueda/orden
let mesSeleccionado = null;
let añoSeleccionado = null;

// Paginación
let paginaActual = 1;
let itemsPorPagina = 10;

// ================== AUTENTICACIÓN ==================

function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');

    if (!isLoggedIn || userType !== 'admin') {
        console.log('Acceso no autorizado');
        window.location.href = 'login.html';
        return;
    }

    console.log('Usuario autenticado como admin');
}


// ================== SELECTOR DE MES ==================

function inicializarSelectorMes() {
    const selector = document.getElementById('selectorMes');
    if (!selector) {
        console.warn('No se encontró el selector de mes');
        return;
    }

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    mesSeleccionado = mesActual;
    añoSeleccionado = añoActual;

    const opciones = [];

    for (let i = 0; i < 24; i++) {
        const fecha = new Date(añoActual, mesActual - i, 1);
        const mes = fecha.getMonth();
        const año = fecha.getFullYear();

        const nombreMes = fecha.toLocaleDateString('es-MX', {
            month: 'long',
            year: 'numeric'
        });

        const nombreCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

        opciones.push({
            value: `${año}-${String(mes + 1).padStart(2, '0')}`,
            text: nombreCapitalizado,
            selected: i === 0
        });
    }

    selector.innerHTML = opciones.map(op =>
        `<option value="${op.value}" ${op.selected ? 'selected' : ''}>${op.text}</option>`
    ).join('');

    console.log(`Selector inicializado: ${opciones[0].text}`);
}

function cambiarMes() {
    const selector = document.getElementById('selectorMes');
    if (!selector) return;

    const [año, mes] = selector.value.split('-');
    añoSeleccionado = parseInt(año);
    mesSeleccionado = parseInt(mes) - 1;

    console.log(`Mes cambiado a: ${año}-${mes}`);
    cargarDatos();
}

function obtenerRangoMesSeleccionado() {
    const año = añoSeleccionado;
    const mes = mesSeleccionado;

    const primerDia = new Date(año, mes, 1);
    const primerDiaISO = primerDia.toISOString().split('T')[0];

    const ultimoDia = new Date(año, mes + 1, 0);
    const ultimoDiaISO = ultimoDia.toISOString().split('T')[0];

    const nombreMes = primerDia.toLocaleDateString('es-MX', {
        month: 'long',
        year: 'numeric'
    });

    console.log(`Rango: ${primerDiaISO} a ${ultimoDiaISO} (${nombreMes})`);

    return {
        primerDia: primerDiaISO,
        ultimoDia: ultimoDiaISO,
        nombreMes: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
    };
}
function exportarReporte() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: #ffffff;
        border-radius: 16px;
        padding: 1.5rem 1.75rem;
        max-width: 360px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.35);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #0f172a;
    `;

    modal.innerHTML = `
        <h3 style="margin:0 0 0.25rem;font-size:1.1rem;font-weight:700;color:#111827;">
            Exportar reporte de donaciones
        </h3>
        <p style="margin:0 0 1rem;font-size:0.9rem;color:#6b7280;">
            Elige el formato en el que deseas descargar el reporte del mes seleccionado.
        </p>
        <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:0.75rem;">
            <button id="btnExportPDF" style="
                width:100%;
                padding:0.6rem 0.9rem;
                border-radius:999px;
                border:1px solid #5f0d51;
                background:#5f0d51;
                color:#fff;
                font-size:0.9rem;
                font-weight:600;
                cursor:pointer;
                display:flex;
                align-items:center;
                justify-content:center;
                gap:0.4rem;
            ">
                <span>📄 PDF </span>
            </button>
            <button id="btnExportCSV" style="
                width:100%;
                padding:0.6rem 0.9rem;
                border-radius:999px;
                border:1px solid #e5e7eb;
                background:#f9fafb;
                color:#111827;
                font-size:0.9rem;
                font-weight:600;
                cursor:pointer;
                display:flex;
                align-items:center;
                justify-content:center;
                gap:0.4rem;
            ">
                <span>📊 CSV </span>
            </button>
        </div>
        <button id="btnExportCancelar" style="
            width:100%;
            margin-top:0.25rem;
            padding:0.45rem 0.9rem;
            border-radius:999px;
            border:none;
            background:transparent;
            color:#6b7280;
            font-size:0.85rem;
            cursor:pointer;
        ">
            Cancelar
        </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cerrar = () => {
        document.body.removeChild(overlay);
    };

    modal.querySelector('#btnExportPDF').addEventListener('click', () => {
    cerrar();
    if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('Generando reporte PDF profesional...', 'info');
    }
    exportarPDF(); // sin await, como antes
});

modal.querySelector('#btnExportCSV').addEventListener('click', () => {
    cerrar();
    if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('Generando archivo CSV limpio y estructurado...', 'info');
    }
    exportarCSV(); // sin await, como antes
});


    modal.querySelector('#btnExportCancelar').addEventListener('click', cerrar);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrar();
    });
}

// ================== CARGA DE DATOS ==================

async function cargarDatos() {
    if (!window.supabaseClient) {
        console.error('Supabase no inicializado');
        mostrarError('Error de conexión');
        return;
    }

    try {
        const { nombreMes } = obtenerRangoMesSeleccionado();
        console.log(`Cargando donaciones de ${nombreMes}...`);

        await Promise.all([
            cargarEstadisticas(),
            cargarDonaciones()
        ]);

        console.log('Datos cargados correctamente');

    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarError('Error al cargar donaciones');
    }
}

async function cargarEstadisticas() {
    try {
        const { primerDia, ultimoDia, nombreMes } = obtenerRangoMesSeleccionado();

        console.log(`Calculando estadísticas de ${nombreMes}...`);

        const { data: donacionesMes, error } = await window.supabaseClient
            .from('donaciones')
            .select('monto, estado_pago')
            .gte('fecha_donacion', primerDia + ' 00:00:00')
            .lte('fecha_donacion', ultimoDia + ' 23:59:59');

        if (error) throw error;

        console.log(`Donaciones de ${nombreMes} encontradas:`, donacionesMes?.length || 0);

        const totalRecaudado = donacionesMes
            .filter(d => d.estado_pago === 'completado')
            .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);

        const totalEl = document.getElementById('totalRecaudado');
        if (totalEl) {
            totalEl.textContent = '$' + Math.round(totalRecaudado).toLocaleString('es-MX');
        }

        const completadas = donacionesMes.filter(d => d.estado_pago === 'completado').length;
        const completadasEl = document.getElementById('donacionesCompletadas');
        if (completadasEl) {
            completadasEl.textContent = completadas;
        }

        const pendientes = donacionesMes.filter(d => d.estado_pago === 'pendiente').length;
        const pendientesEl = document.getElementById('donacionesPendientes');
        if (pendientesEl) {
            pendientesEl.textContent = pendientes;
        }

        console.log(`Estadísticas de ${nombreMes}:`, {
            total: totalRecaudado,
            completadas,
            pendientes
        });

    } catch (error) {
        console.error('Error en estadísticas:', error);
    }
}

async function cargarDonaciones() {
    try {
        const { primerDia, ultimoDia, nombreMes } = obtenerRangoMesSeleccionado();

        console.log(`Cargando historial de ${nombreMes}...`);

        const { data: donaciones, error } = await window.supabaseClient
            .from('donaciones')
            .select('*')
            .gte('fecha_donacion', primerDia + ' 00:00:00')
            .lte('fecha_donacion', ultimoDia + ' 23:59:59')
            .order('fecha_donacion', { ascending: false });

        if (error) {
            console.error('Error al cargar donaciones:', error);
            throw error;
        }

        console.log(`${donaciones?.length || 0} donaciones de ${nombreMes} cargadas`);
        console.log('Muestra de datos:', donaciones?.[0]);

        donacionesGlobal = donaciones || [];

        // Reseteamos filtros y paginación cada vez que se recargan datos
        paginaActual = 1;
        aplicarFiltrosYRedibujar();

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar donaciones: ' + error.message);
    }
}

// ================== FILTROS, ORDEN Y PAGINACIÓN ==================

function obtenerFiltrosUI() {
    const inputBuscar = document.getElementById('inputBuscar');
    const filtroFechaDesde = document.getElementById('filtroFechaDesde');
    const filtroFechaHasta = document.getElementById('filtroFechaHasta');
    const checkboxesOrden = document.querySelectorAll('.chk-orden');

    const termino = (inputBuscar?.value || '').toLowerCase().trim();
    const fechaDesde = filtroFechaDesde?.value || '';
    const fechaHasta = filtroFechaHasta?.value || '';

    const ordenSeleccionados = Array.from(checkboxesOrden || [])
        .filter(chk => chk.checked)
        .map(chk => chk.value);

    return { termino, fechaDesde, fechaHasta, ordenSeleccionados };
}

function aplicarFiltrosYRedibujar() {
    const { termino, fechaDesde, fechaHasta, ordenSeleccionados } = obtenerFiltrosUI();

    // 1) Filtrar por texto
    let resultado = [...donacionesGlobal];
    
    // Variable para saber si se está buscando
    let hayBusqueda = termino || fechaDesde || fechaHasta;

    if (termino) {
        resultado = resultado.filter(donacion => {
            const nombre = (donacion.donante_nombre || '').toLowerCase();
            const email = (donacion.donante_email || '').toLowerCase();
            const descripcion = (donacion.descripcion || '').toLowerCase();
            const monto = (donacion.monto || '').toString().toLowerCase();

            return nombre.includes(termino) ||
                   email.includes(termino) ||
                   descripcion.includes(termino) ||
                   monto.includes(termino);
        });
    }

    // 2) Filtrar por rango de fecha (si se selecciona)
    if (fechaDesde || fechaHasta) {
        resultado = resultado.filter(donacion => {
            const fechaISO = donacion.fecha_donacion.split('T')[0]; // yyyy-mm-dd
            if (fechaDesde && fechaISO < fechaDesde) return false;
            if (fechaHasta && fechaISO > fechaHasta) return false;
            return true;
        });
    }

    // 3) Ordenamiento múltiple según checkboxes
    if (ordenSeleccionados.length > 0) {
        resultado.sort((a, b) => compararDonaciones(a, b, ordenSeleccionados));
    }

    donacionesFiltradas = resultado;

    // 4) Actualizar paginación y mostrar
    paginaActual = Math.min(paginaActual, calcularTotalPaginas());
    if (paginaActual < 1) paginaActual = 1;

    // Pasar información de si hay búsqueda activa
    mostrarDonacionesPaginadas(hayBusqueda);
    actualizarControlesPaginacion();
}

function compararDonaciones(a, b, ordenSeleccionados) {
    // Aplica los criterios en el orden en que están marcados
    for (const criterio of ordenSeleccionados) {
        let diff = 0;

        if (criterio === 'montoAsc' || criterio === 'montoDesc') {
            const ma = parseFloat(a.monto || 0);
            const mb = parseFloat(b.monto || 0);
            diff = ma - mb;
            if (criterio === 'montoDesc') diff = -diff;
        }

        if (criterio === 'alfabetico') {
            const na = (a.donante_nombre || '').toLowerCase();
            const nb = (b.donante_nombre || '').toLowerCase();
            if (na < nb) diff = -1;
            if (na > nb) diff = 1;
        }

        if (criterio === 'fechaAsc' || criterio === 'fechaDesc') {
            const fa = a.fecha_donacion;
            const fb = b.fecha_donacion;
            if (fa < fb) diff = -1;
            if (fa > fb) diff = 1;
            if (criterio === 'fechaDesc') diff = -diff;
        }

        if (diff !== 0) {
            return diff;
        }
    }
    return 0;
}

function limpiarFiltros() {
    const filtroFechaDesde = document.getElementById('filtroFechaDesde');
    const filtroFechaHasta = document.getElementById('filtroFechaHasta');
    const inputBuscar = document.getElementById('inputBuscar');
    const checkboxesOrden = document.querySelectorAll('.chk-orden');

    if (filtroFechaDesde) filtroFechaDesde.value = '';
    if (filtroFechaHasta) filtroFechaHasta.value = '';
    if (inputBuscar) inputBuscar.value = '';
    checkboxesOrden.forEach(chk => chk.checked = false);

    paginaActual = 1;
    aplicarFiltrosYRedibujar();
}

function calcularTotalPaginas() {
    if (!donacionesFiltradas || donacionesFiltradas.length === 0) return 1;
    return Math.ceil(donacionesFiltradas.length / itemsPorPagina);
}

function cambiarPagina(delta) {
    const totalPaginas = calcularTotalPaginas();
    paginaActual += delta;
    if (paginaActual < 1) paginaActual = 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    // Necesitamos saber si hay búsqueda activa
    const { termino, fechaDesde, fechaHasta } = obtenerFiltrosUI();
    const hayBusqueda = termino || fechaDesde || fechaHasta;

    mostrarDonacionesPaginadas(hayBusqueda);
    actualizarControlesPaginacion();
}

function actualizarControlesPaginacion() {
    const totalPaginas = calcularTotalPaginas();
    const spanPaginaActual = document.getElementById('paginaActual');
    const spanTotalPaginas = document.getElementById('totalPaginas');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    if (spanPaginaActual) spanPaginaActual.textContent = totalPaginas === 0 ? '0' : String(paginaActual);
    if (spanTotalPaginas) spanTotalPaginas.textContent = String(totalPaginas);

    if (btnPrev) btnPrev.disabled = paginaActual <= 1;
    if (btnNext) btnNext.disabled = paginaActual >= totalPaginas;
}

function mostrarDonacionesPaginadas(hayBusqueda = false) {
    const tbody = document.getElementById('tablaDonaciones');
    if (!tbody) {
        console.error('No se encontró la tabla');
        return;
    }

    const { nombreMes } = obtenerRangoMesSeleccionado();

    // CAMBIO IMPORTANTE: Diferenciar entre "no hay datos del mes" vs "búsqueda sin resultados"
    if (!donacionesFiltradas || donacionesFiltradas.length === 0) {
        let mensaje = '';
        
        if (hayBusqueda) {
            // Si hay una búsqueda activa y no hay resultados
            mensaje = '❌ No hay una persona con ese nombre en donaciones';
        } else {
            // Si no hay búsqueda, simplemente no hay donaciones ese mes
            mensaje = `No hay donaciones registradas en ${nombreMes}`;
        }
        
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280; font-size: 1rem;">
                    ${mensaje}
                </td>
            </tr>
        `;
        return;
    }

    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const paginaDatos = donacionesFiltradas.slice(inicio, fin);

    tbody.innerHTML = paginaDatos.map(donacion => {
        const fechaISO = donacion.fecha_donacion.split('T')[0];
        const [year, month, day] = fechaISO.split('-');
        const fecha = new Date(year, month - 1, day);

        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const nombre = donacion.donante_nombre || 'Anónimo';
        const email = donacion.donante_email || 'N/A';
        const monto = Math.round(parseFloat(donacion.monto || 0));
        const tipo = donacion.metodo_pago || 'N/A';
        const concepto = donacion.descripcion || 'Apoyo general';

        const estadoStyles = {
            'completado': { bg: '#d1fae5', color: '#065f46', text: 'Completado' },
            'pendiente': { bg: '#fed7aa', color: '#92400e', text: 'Pendiente' },
            'fallido': { bg: '#fee2e2', color: '#991b1b', text: 'Fallido' },
            'reembolsado': { bg: '#e0e7ff', color: '#3730a3', text: 'Reembolsado' }
        };

        const estadoInfo = estadoStyles[donacion.estado_pago] || estadoStyles['pendiente'];

        return `
            <tr>
                <td class="donor-name">${nombre}</td>
                <td class="donor-email">${email}</td>
                <td class="amount">$${monto.toLocaleString('es-MX')}</td>
                <td>${fechaFormateada}</td>
                <td><span class="type-badge">${tipo}</span></td>
                <td>
                    <span class="status-badge" style="background: ${estadoInfo.bg}; color: ${estadoInfo.color};">
                        ${estadoInfo.text}
                    </span>
                </td>
                <td class="description">${concepto}</td>
            </tr>
        `;
    }).join('');

    console.log(`${paginaDatos.length} donaciones mostradas en la página ${paginaActual}`);
}

// ================== EXPORTAR CSV (Excel) ==================

function exportarCSV() {
    const datos = donacionesFiltradas && donacionesFiltradas.length > 0
        ? donacionesFiltradas
        : donacionesGlobal;

    if (!datos || datos.length === 0) {
        const { nombreMes } = obtenerRangoMesSeleccionado();
        alert(`No hay donaciones de ${nombreMes} para exportar`);
        return;
    }

    const { nombreMes } = obtenerRangoMesSeleccionado();
    console.log(`📥 Exportando CSV de ${nombreMes}...`);

    const encabezados = ['Donante', 'Email', 'Teléfono', 'Monto', 'Fecha', 'Método Pago', 'Estado', 'Descripción'];

    const filas = datos.map(donacion => {
        const fechaISO = donacion.fecha_donacion.split('T')[0];
        const [year, month, day] = fechaISO.split('-');
        const fecha = new Date(year, month - 1, day);

        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        return [
            donacion.donante_nombre || 'Anónimo',
            donacion.donante_email || 'N/A',
            donacion.donante_telefono || 'N/A',
            `$${Math.round(parseFloat(donacion.monto || 0)).toLocaleString('es-MX')}`,
            fechaFormateada,
            donacion.metodo_pago || 'N/A',
            donacion.estado_pago || 'pendiente',
            (donacion.descripcion || 'Apoyo general').replace(/,/g, ';')
        ].map(campo => `"${campo}"`).join(',');
    });

    const csv = [encabezados.join(','), ...filas].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset-utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fechaHoy = new Date().toISOString().split('T')[0];
    const nombreArchivo = `donaciones_${nombreMes.replace(/\s+/g, '_')}_${fechaHoy}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    
}

// ================== EXPORTAR A PDF (descargable) - MODIFICADO CON LOGO Y NUEVO FOOTER ==================

function exportarPDF() {
    const datos = donacionesFiltradas && donacionesFiltradas.length > 0
        ? donacionesFiltradas
        : donacionesGlobal;

    if (!datos || datos.length === 0) {
        const { nombreMes } = obtenerRangoMesSeleccionado();
        alert(`No hay donaciones de ${nombreMes} para exportar`);
        return;
    }

    const { nombreMes } = obtenerRangoMesSeleccionado();
    console.log(`Generando PDF de ${nombreMes}...`);

    const totalRecaudado = datos
        .filter(d => d.estado_pago === 'completado')
        .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);

    const completadas = datos.filter(d => d.estado_pago === 'completado').length;
    const pendientes = datos.filter(d => d.estado_pago === 'pendiente').length;

    const fechaGeneracion = new Date().toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Construimos HTML del reporte con NUEVO DISEÑO: logo arriba, info de generación arriba, copyright abajo
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Donaciones - ${nombreMes}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    color: #1f2933;
                    background: #f9fafb;
                }
                
                /* NUEVO HEADER CON LOGO Y INFO */
                .header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 3px solid #7c3aed;
                }
                
                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .logo-k {
                    font-size: 48px;
                    font-weight: 900;
                    color: #a855f7;
                    font-family: Arial Black, sans-serif;
                    letter-spacing: -2px;
                    line-height: 1;
                }
                
                .logo-text {
                    font-size: 24px;
                    font-weight: 700;
                    color: #6b7280;
                    font-family: Arial, sans-serif;
                }
                
                .header-info {
                    text-align: right;
                }
                
                .header-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #6d28d9;
                    margin-bottom: 4px;
                }
                
                .header-subtitle {
                    font-size: 12px;
                    color: #6b7280;
                }
                
                .stats {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    margin: 30px 0;
                    padding: 20px;
                    background: #f3e8ff;
                    border-radius: 12px;
                    border: 1px solid #ddd6fe;
                }
                .stat-item {
                    flex: 1;
                    text-align: center;
                }
                .stat-label {
                    font-size: 11px;
                    color: #6b7280;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                    letter-spacing: 0.08em;
                }
                .stat-value {
                    font-size: 20px;
                    font-weight: bold;
                    color: #4c1d95;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 16px;
                    font-size: 10px;
                    background: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                }
                thead {
                    background: linear-gradient(90deg, #7c3aed, #a855f7);
                    color: white;
                }
                th {
                    padding: 10px 6px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 1px solid #4c1d95;
                }
                tbody tr {
                    border-bottom: 1px solid #e5e7eb;
                }
                tbody tr:nth-child(even) {
                    background: #f9fafb;
                }
                td {
                    padding: 8px 6px;
                    color: #111827;
                }
                .status-completado {
                    background: #d1fae5;
                    color: #065f46;
                    padding: 3px 6px;
                    border-radius: 4px;
                    font-size: 9px;
                    font-weight: 600;
                }
                .status-pendiente {
                    background: #fef3c7;
                    color: #92400e;
                    padding: 3px 6px;
                    border-radius: 4px;
                    font-size: 9px;
                    font-weight: 600;
                }
                .status-fallido {
                    background: #fee2e2;
                    color: #991b1b;
                    padding: 3px 6px;
                    border-radius: 4px;
                    font-size: 9px;
                    font-weight: 600;
                }
                .status-reembolsado {
                    background: #e0e7ff;
                    color: #3730a3;
                    padding: 3px 6px;
                    border-radius: 4px;
                    font-size: 9px;
                    font-weight: 600;
                }
                
                /* NUEVO FOOTER CON COPYRIGHT */
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    color: #9ca3af;
                    font-size: 10px;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 16px;
                }
                
                .copyright {
                    font-weight: 600;
                    color: #6b7280;
                }
                
                @media print {
                    body {
                        padding: 20px;
                    }
                    table {
                        font-size: 9px;
                    }
                    @page {
                        margin: 1cm;
                    }
                }
            </style>
        </head>
        <body>
            <!-- NUEVO HEADER CON LOGO -->
            <div class="header">
                <div class="logo-section">
                    <div class="logo-k">K</div>
                    <div class="logo-text">Kueni Kueni</div>
                </div>
                <div class="header-info">
                    <div class="header-title">Reporte de Donaciones - ${nombreMes}</div>
                    <div class="header-subtitle">Generado el ${fechaGeneracion}</div>
                </div>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-label">Total recaudado</div>
                    <div class="stat-value">$${Math.round(totalRecaudado).toLocaleString('es-MX')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Completadas</div>
                    <div class="stat-value">${completadas}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Pendientes</div>
                    <div class="stat-value">${pendientes}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total donaciones</div>
                    <div class="stat-value">${datos.length}</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Donante</th>
                        <th>Email</th>
                        <th>Monto</th>
                        <th>Fecha</th>
                        <th>Método</th>
                        <th>Estado</th>
                        <th>Descripción</th>
                    </tr>
                </thead>
                <tbody>
    `;

    datos.forEach(donacion => {
        const fechaISO = donacion.fecha_donacion.split('T')[0];
        const [year, month, day] = fechaISO.split('-');
        const fecha = new Date(year, month - 1, day);

        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const nombre = donacion.donante_nombre || 'Anónimo';
        const email = donacion.donante_email || 'N/A';
        const monto = Math.round(parseFloat(donacion.monto || 0));
        const metodo = donacion.metodo_pago || 'N/A';
        const estado = (donacion.estado_pago || 'pendiente').toLowerCase();
        const descripcion = donacion.descripcion || 'Apoyo general';

        const estadoClass = `status-${estado}`;
        const estadoTexto = estado.charAt(0).toUpperCase() + estado.slice(1);

        html += `
            <tr>
                <td>${nombre}</td>
                <td>${email}</td>
                <td>$${monto.toLocaleString('es-MX')}</td>
                <td>${fechaFormateada}</td>
                <td>${metodo}</td>
                <td><span class="${estadoClass}">${estadoTexto}</span></td>
                <td>${descripcion}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            
            <!-- NUEVO FOOTER CON COPYRIGHT -->
            <div class="footer">
                <p class="copyright">© 2025 Kueni Kueni. Todos los derechos reservados.</p>
            </div>
        </body>
        </html>
    `;

    // Convertimos HTML a Blob y lo descargamos como PDF usando print dialog del navegador
    const nuevaVentana = window.open('', '_blank');
    if (!nuevaVentana) {
        alert('El bloqueador de ventanas emergentes está impidiendo abrir el PDF.');
        return;
    }

    nuevaVentana.document.open();
    nuevaVentana.document.write(html);
    nuevaVentana.document.close();

    // El usuario podrá elegir "Guardar como PDF" en el diálogo de impresión
    nuevaVentana.onload = function () {
        setTimeout(() => {
            nuevaVentana.print();
        }, 300);
    };
}

// ================== ERRORES ==================

function mostrarError(mensaje) {
    console.error('Error:', mensaje);
    const tbody = document.getElementById('tablaDonaciones');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #ef4444;">
                    ${mensaje}
                </td>
            </tr>
        `;
    }
}

console.log('✅ Sistema de donaciones con filtros, paginación y exportación cargado');
console.log('✅ CORREGIDO: Mensaje de búsqueda sin resultados personalizado');
console.log('✅ MODIFICADO: PDF con logo y copyright actualizado');
