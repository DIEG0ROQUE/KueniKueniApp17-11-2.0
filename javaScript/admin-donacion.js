// admin-donaciones.js - CON EXPORTACIÓN A CSV Y PDF
// Columnas: donante_nombre, donante_email, fecha_donacion, estado_pago, metodo_pago

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
    
    // Event Listeners
    document.getElementById('btnCerrarSesion')?.addEventListener('click', cerrarSesion);
    document.getElementById('btnExportarCSV')?.addEventListener('click', exportarCSV);
    document.getElementById('btnExportarPDF')?.addEventListener('click', exportarPDF);
    document.getElementById('inputBuscar')?.addEventListener('input', filtrarDonaciones);
    document.getElementById('selectorMes')?.addEventListener('change', cambiarMes);
});

let donacionesGlobal = [];
let mesSeleccionado = null;
let añoSeleccionado = null;

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

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        console.log('Cerrando sesión...');
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

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
        mostrarDonaciones(donacionesGlobal);
        
    } catch (error) {
        console.error('Error:', error);
        const tbody = document.getElementById('tablaDonaciones');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #ef4444;">
                        Error al cargar donaciones: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

function mostrarDonaciones(donaciones) {
    const tbody = document.getElementById('tablaDonaciones');
    
    if (!tbody) {
        console.error('No se encontró la tabla');
        return;
    }
    
    const { nombreMes } = obtenerRangoMesSeleccionado();
    
    if (!donaciones || donaciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">
                    No hay donaciones registradas en ${nombreMes}
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = donaciones.map(donacion => {
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
    
    console.log(`${donaciones.length} donaciones mostradas en la tabla`);
}

function filtrarDonaciones() {
    const input = document.getElementById('inputBuscar');
    if (!input) return;
    
    const termino = input.value.toLowerCase().trim();
    
    if (!termino) {
        mostrarDonaciones(donacionesGlobal);
        return;
    }
    
    const filtradas = donacionesGlobal.filter(donacion => {
        const nombre = (donacion.donante_nombre || '').toLowerCase();
        const email = (donacion.donante_email || '').toLowerCase();
        const descripcion = (donacion.descripcion || '').toLowerCase();
        const monto = donacion.monto.toString();
        
        return nombre.includes(termino) || 
               email.includes(termino) || 
               descripcion.includes(termino) ||
               monto.includes(termino);
    });
    
    console.log(`Filtrado: ${filtradas.length} de ${donacionesGlobal.length} donaciones`);
    mostrarDonaciones(filtradas);
}

// EXPORTAR A CSV (Excel)
function exportarCSV() {
    if (!donacionesGlobal || donacionesGlobal.length === 0) {
        const { nombreMes } = obtenerRangoMesSeleccionado();
        alert(`No hay donaciones de ${nombreMes} para exportar`);
        return;
    }
    
    const { nombreMes } = obtenerRangoMesSeleccionado();
    console.log(`📥 Exportando CSV de ${nombreMes}...`);
    
    const encabezados = ['Donante', 'Email', 'Teléfono', 'Monto', 'Fecha', 'Método Pago', 'Estado', 'Descripción'];
    
    const filas = donacionesGlobal.map(donacion => {
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
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
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
    
    console.log('CSV descargado:', nombreArchivo);
    alert(`${donacionesGlobal.length} donaciones exportadas a CSV`);
}

// EXPORTAR A PDF
function exportarPDF() {
    if (!donacionesGlobal || donacionesGlobal.length === 0) {
        const { nombreMes } = obtenerRangoMesSeleccionado();
        alert(`No hay donaciones de ${nombreMes} para exportar`);
        return;
    }
    
    const { nombreMes } = obtenerRangoMesSeleccionado();
    console.log(`Generando PDF de ${nombreMes}...`);
    
    // Calcular estadísticas
    const totalRecaudado = donacionesGlobal
        .filter(d => d.estado_pago === 'completado')
        .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);
    
    const completadas = donacionesGlobal.filter(d => d.estado_pago === 'completado').length;
    const pendientes = donacionesGlobal.filter(d => d.estado_pago === 'pendiente').length;
    
    // Crear ventana para imprimir
    const ventanaImpresion = window.open('', '', 'height=800,width=1000');
    
    ventanaImpresion.document.write(`
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
                    color: #333;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #e53e3e;
                    padding-bottom: 20px;
                }
                
                .header h1 {
                    color: #e53e3e;
                    font-size: 28px;
                    margin-bottom: 10px;
                }
                
                .header h2 {
                    color: #666;
                    font-size: 18px;
                    font-weight: normal;
                }
                
                .stats {
                    display: flex;
                    justify-content: space-around;
                    margin: 30px 0;
                    padding: 20px;
                    background: #f7fafc;
                    border-radius: 8px;
                }
                
                .stat-item {
                    text-align: center;
                }
                
                .stat-label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                
                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #e53e3e;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    font-size: 11px;
                }
                
                thead {
                    background: #e53e3e;
                    color: white;
                }
                
                th {
                    padding: 12px 8px;
                    text-align: left;
                    font-weight: 600;
                }
                
                tbody tr {
                    border-bottom: 1px solid #e2e8f0;
                }
                
                tbody tr:nth-child(even) {
                    background: #f7fafc;
                }
                
                td {
                    padding: 10px 8px;
                }
                
                .status-completado {
                    background: #d1fae5;
                    color: #065f46;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                }
                
                .status-pendiente {
                    background: #fed7aa;
                    color: #92400e;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                }
                
                .status-fallido {
                    background: #fee2e2;
                    color: #991b1b;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                }
                
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    color: #666;
                    font-size: 11px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 20px;
                }
                
                @media print {
                    body {
                        padding: 20px;
                    }
                    
                    .header h1 {
                        font-size: 24px;
                    }
                    
                    table {
                        font-size: 10px;
                    }
                    
                    @page {
                        margin: 1cm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🩷 Kueni Kueni</h1>
                <h2>Reporte de Donaciones - ${nombreMes}</h2>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-label">Total Recaudado</div>
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
                    <div class="stat-label">Total Donaciones</div>
                    <div class="stat-value">${donacionesGlobal.length}</div>
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
    `);
    
    // Agregar filas de donaciones
    donacionesGlobal.forEach(donacion => {
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
        const estado = donacion.estado_pago || 'pendiente';
        const descripcion = donacion.descripcion || 'Apoyo general';
        
        const estadoClass = `status-${estado}`;
        const estadoTexto = estado.charAt(0).toUpperCase() + estado.slice(1);
        
        ventanaImpresion.document.write(`
            <tr>
                <td>${nombre}</td>
                <td>${email}</td>
                <td>$${monto.toLocaleString('es-MX')}</td>
                <td>${fechaFormateada}</td>
                <td>${metodo}</td>
                <td><span class="${estadoClass}">${estadoTexto}</span></td>
                <td>${descripcion}</td>
            </tr>
        `);
    });
    
    const fechaGeneracion = new Date().toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    ventanaImpresion.document.write(`
                </tbody>
            </table>
            
            <div class="footer">
                <p>Reporte generado el ${fechaGeneracion}</p>
                <p>Kueni Kueni - Sistema de Gestión de Donaciones</p>
            </div>
        </body>
        </html>
    `);
    
    ventanaImpresion.document.close();
    
    // Esperar a que se cargue y luego imprimir
    ventanaImpresion.onload = function() {
        setTimeout(() => {
            ventanaImpresion.print();
            // La ventana se cierra automáticamente después de imprimir o cancelar
            ventanaImpresion.onafterprint = function() {
                ventanaImpresion.close();
            };
        }, 250);
    };
    
    console.log('PDF generado para imprimir/guardar');
}

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

console.log('Sistema de donaciones con exportación CSV y PDF cargado');