// ============================================
// ADMIN ESTADÍSTICAS - KUENI KUENI
// Sistema completo de análisis y reportes
// ============================================
console.log('Sistema de estadísticas iniciando...');

let donacionesGlobal = [];
let sociosGlobal = [];
let eventosGlobal = [];
let añoSeleccionado = new Date().getFullYear();
let chartDonaciones = null;

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM cargado');
    verificarAutenticacion();
    configurarEventos();

    setTimeout(() => {
        if (window.supabaseClient) {
            console.log('Supabase conectado');
            cargarDatos();
        } else {
            console.error('Supabase no disponible');
            setTimeout(() => cargarDatos(), 1000);
        }
    }, 500);
});

function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');

    if (!isLoggedIn || userType !== 'admin') {
        window.location.href = 'login.html';
    }
}

function configurarEventos() {
    document.getElementById('btnCerrarSesion')?.addEventListener('click', function () {
        if (confirm('¿Cerrar sesión?')) {
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        yearSelect.addEventListener('change', function () {
            añoSeleccionado = parseInt(this.value);
            console.log(`Año seleccionado: ${añoSeleccionado}`);
            cargarDatos();
        });
    }

    const tabs = document.querySelectorAll('.tab-est');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const tabName = this.dataset.tab;
            console.log(`Tab seleccionado: ${tabName}`);
            cambiarTab(tabName);
        });
    });

    document.querySelector('.btn-exportar')?.addEventListener('click', exportarReporte);
}

async function cargarDatos() {
    if (!window.supabaseClient) {
        console.error('Supabase no inicializado');
        return;
    }

    try {
        console.log('Cargando datos...');
        mostrarLoader(true);

        await Promise.all([
            cargarDonaciones(),
            cargarSocios(),
            cargarEventos()
        ]);

        calcularEstadisticas();
        inicializarGrafica();

        mostrarLoader(false);
        console.log('Datos cargados correctamente');

    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarLoader(false);
    }
}

async function cargarDonaciones() {
    try {
        const { data: donaciones, error } = await window.supabaseClient
            .from('donaciones')
            .select('*')
            .order('fecha_donacion', { ascending: false });

        if (error) throw error;

        donacionesGlobal = donaciones || [];
        console.log(`${donacionesGlobal.length} donaciones cargadas`);

    } catch (error) {
        console.error('Error cargando donaciones:', error);
        donacionesGlobal = [];
    }
}

async function cargarSocios() {
    try {
        const { data: socios, error } = await window.supabaseClient
            .from('socios')
            .select('*');

        if (error) throw error;

        sociosGlobal = socios || [];
        console.log(`${sociosGlobal.length} socios cargados`);

    } catch (error) {
        console.error('Error cargando socios:', error);
        sociosGlobal = [];
    }
}

async function cargarEventos() {
    try {
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('*');

        if (error) throw error;

        eventosGlobal = eventos || [];
        console.log(`${eventosGlobal.length} eventos cargados`);

    } catch (error) {
        console.error('Error cargando eventos:', error);
        eventosGlobal = [];
    }
}

function calcularEstadisticas() {
    // Filtrar donaciones del año
    const donacionesAño = donacionesGlobal.filter(d => {
        const fecha = new Date(d.fecha_donacion);
        return fecha.getFullYear() === añoSeleccionado;
    });

    const donacionesCompletadas = donacionesAño.filter(d => d.estado_pago === 'completado');

    // Total recaudado
    const totalRecaudado = donacionesCompletadas.reduce((sum, d) =>
        sum + parseFloat(d.monto || 0), 0
    );

    // Donación promedio
    const promedioRecaudado = donacionesCompletadas.length > 0
        ? totalRecaudado / donacionesCompletadas.length
        : 0;

    // Año anterior
    const donacionesAñoAnterior = donacionesGlobal.filter(d => {
        const fecha = new Date(d.fecha_donacion);
        return fecha.getFullYear() === (añoSeleccionado - 1);
    });

    const totalAñoAnterior = donacionesAñoAnterior
        .filter(d => d.estado_pago === 'completado')
        .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);

    const crecimientoIngresos = totalAñoAnterior > 0
        ? ((totalRecaudado - totalAñoAnterior) / totalAñoAnterior) * 100
        : 0;

    // Actualizar UI - Ingresos
    document.getElementById('totalRecaudado').textContent =
        '$' + Math.round(totalRecaudado).toLocaleString('es-MX');
    actualizarCambio('cambioIngresos', crecimientoIngresos);

    // Actualizar UI - Donación Promedio
    document.getElementById('donacionPromedio').textContent =
        '$' + Math.round(promedioRecaudado).toLocaleString('es-MX');

    const promedioAnterior = donacionesAñoAnterior.filter(d => d.estado_pago === 'completado').length > 0
        ? donacionesAñoAnterior.filter(d => d.estado_pago === 'completado')
            .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0) /
        donacionesAñoAnterior.filter(d => d.estado_pago === 'completado').length
        : 0;

    const cambioPromedio = promedioAnterior > 0
        ? ((promedioRecaudado - promedioAnterior) / promedioAnterior) * 100
        : 0;

    actualizarCambio('cambioPromedio', cambioPromedio);

    // Socios activos
    const sociosActivos = sociosGlobal.filter(s => s.estado === 'activo');
    document.getElementById('totalSocios').textContent = sociosActivos.length;

    const sociosAñoAnteriorActivos = sociosGlobal.filter(s => {
        if (!s.fecha_ingreso) return false;
        const fecha = new Date(s.fecha_ingreso);
        return fecha.getFullYear() < añoSeleccionado && s.estado === 'activo';
    });

    const crecimientoSocios = sociosAñoAnteriorActivos.length > 0
        ? ((sociosActivos.length - sociosAñoAnteriorActivos.length) / sociosAñoAnteriorActivos.length) * 100
        : 0;

    actualizarCambio('cambioSocios', crecimientoSocios);

    // Eventos
    const eventosAño = eventosGlobal.filter(e => {
        const fecha = new Date(e.fecha_evento);
        return fecha.getFullYear() === añoSeleccionado;
    });

    const eventosCompletados = eventosAño.filter(e => e.estado === 'completado');
    document.getElementById('totalEventos').textContent = eventosCompletados.length;

    const eventosProximos = eventosGlobal.filter(e => {
        const fechaEvento = new Date(e.fecha_evento);
        return fechaEvento > new Date() && e.estado === 'proximo';
    });

    document.querySelector('.est-desc').textContent = `${eventosProximos.length} próximos`;

    // Análisis detallado
    const tasa = donacionesAño.length > 0
        ? (donacionesCompletadas.length / donacionesAño.length) * 100
        : 0;

    const maxDonacion = donacionesCompletadas.length > 0
        ? Math.max(...donacionesCompletadas.map(d => parseFloat(d.monto)))
        : 0;

    document.querySelectorAll('.analysis-grid .analysis-item')[0]
        .querySelector('h4').textContent = '$' + Math.round(totalRecaudado).toLocaleString('es-MX');
    document.querySelectorAll('.analysis-grid .analysis-item')[0]
        .querySelector('.analysis-right span').textContent = donacionesCompletadas.length;

    document.querySelectorAll('.analysis-grid .analysis-item')[1]
        .querySelector('h4').textContent = '$' + Math.round(promedioRecaudado).toLocaleString('es-MX');
    document.querySelectorAll('.analysis-grid .analysis-item')[1]
        .querySelector('.analysis-right span').textContent = '$' + Math.round(maxDonacion).toLocaleString('es-MX');

    document.querySelectorAll('.analysis-grid .analysis-item')[2]
        .querySelector('h4').textContent = tasa.toFixed(1) + '%';
    document.querySelectorAll('.analysis-grid .analysis-item')[2]
        .querySelector('.analysis-right span').textContent = '+' + crecimientoIngresos.toFixed(1) + '%';

    console.log('Estadísticas calculadas');
}

function inicializarGrafica() {
    const ctx = document.getElementById('donacionesChart');
    if (!ctx) return;

    const datos = obtenerDatosMensuales();

    if (chartDonaciones) {
        chartDonaciones.data.datasets[0].data = datos;
        chartDonaciones.update();
        console.log('Gráfica actualizada');
        return;
    }

    const config = {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{
                label: 'Monto',
                data: datos,
                borderColor: '#6366f1',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#18181b',
                    padding: 12,
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#e4e4e7',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return '$' + Math.round(context.parsed.y).toLocaleString('es-MX') + ' MXN';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + (value / 1000).toFixed(0) + 'k';
                        },
                        color: '#71717a',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: '#f4f4f5',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#71717a',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    };

    chartDonaciones = new Chart(ctx, config);
    console.log('Gráfica inicializada');
}

function obtenerDatosMensuales() {
    const meses = Array(12).fill(0);

    const donacionesAño = donacionesGlobal.filter(d => {
        const fecha = new Date(d.fecha_donacion);
        return fecha.getFullYear() === añoSeleccionado && d.estado_pago === 'completado';
    });

    donacionesAño.forEach(donacion => {
        const fecha = new Date(donacion.fecha_donacion);
        const mes = fecha.getMonth();
        meses[mes] += parseFloat(donacion.monto || 0);
    });

    return meses;
}

function actualizarCambio(elementoId, porcentaje) {
    const elemento = document.getElementById(elementoId);
    if (!elemento) return;

    const esPositivo = porcentaje >= 0;
    const icono = esPositivo ? '↑' : '↓';
    const clase = esPositivo ? 'positive' : 'negative';

    elemento.className = `est-change ${clase}`;
    elemento.textContent = `${icono} ${Math.abs(porcentaje).toFixed(1)}% vs año anterior`;
}

function exportarReporte() {
    // Contenedor del mensaje flotante
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
            Exportar reporte
        </h3>
        <p style="margin:0 0 1rem;font-size:0.9rem;color:#6b7280;">
            Elige el formato en el que deseas descargar el reporte del año actual.
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

    // Cerrar helper
    const cerrar = () => {
        document.body.removeChild(overlay);
    };

    // Eventos
    modal.querySelector('#btnExportPDF').addEventListener('click', async () => {
        cerrar();
        mostrarNotificacion('Generando reporte PDF profesional...', 'info');
        await exportarPDF();
    });

    modal.querySelector('#btnExportCSV').addEventListener('click', async () => {
        cerrar();
        mostrarNotificacion('Generando archivo CSV limpio y estructurado...', 'info');
        await exportarCSV();
    });

    modal.querySelector('#btnExportCancelar').addEventListener('click', cerrar);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrar();
    });
}


function exportarCSV() {
    mostrarNotificacion('Generando archivo CSV mejorado y limpio...', 'info');
    
    try {
        // ============================================
        // CONFIGURACIÓN Y UTILIDADES MEJORADAS
        // ============================================
        const añoActual = añoSeleccionado;
        const separador = ';';

        // Función mejorada para sanitizar texto
        const sanitizarTexto = (texto) => {
            if (texto === null || texto === undefined || texto === '') return '""';
            
            let textoLimpio = String(texto)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/"/g, '""')
                .replace(/\r?\n/g, ' ')
                .trim();
            
            // Si después de limpiar está vacío, retornar vacío
            if (!textoLimpio) return '""';
            
            return `"${textoLimpio}"`;
        };

        // Función para obtener nombre significativo
        const obtenerNombreSignificativo = (socio) => {
            // Intentar diferentes campos de nombre
            const nombre = socio.nombre || socio.nombre_completo || socio.nombres || 
                          socio.email || socio.telefono || 'Miembro de la comunidad';
            
            // Si el nombre es muy genérico o parece un placeholder, mejorarlo
            if (nombre.toLowerCase().includes('sin nombre') || 
                nombre.toLowerCase().includes('sin nombre') ||
                nombre === '""' || 
                !nombre.trim()) {
                return 'Miembro de la comunidad';
            }
            
            return nombre;
        };

        // Función para limpiar título de evento
        const limpiarTituloEvento = (titulo) => {
            if (!titulo || titulo === '""') return 'Actividad comunitaria';
            
            const tituloLimpio = String(titulo)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/"/g, '""')
                .replace(/\r?\n/g, ' ')
                .trim();
            
            // Filtrar títulos inapropiados o de prueba
            const titulosInapropiados = [
                'peleas de perros', 'peleas de perros2', 'casita', 'qwdwed', 
                'cum', 'wwd', 'roque vs poronga', 'ssdwd', 'sss', 'qww', 'wedwe'
            ];
            
            if (titulosInapropiados.includes(tituloLimpio.toLowerCase())) {
                return 'Actividad comunitaria';
            }
            
            // Si el título es muy corto o parece placeholder
            if (tituloLimpio.length < 3 || /^[0-9a-z]+$/.test(tituloLimpio)) {
                return 'Actividad comunitaria';
            }
            
            return tituloLimpio;
        };

        // Función para corregir categorías
        const corregirCategoria = (categoria, titulo) => {
            if (!categoria || categoria === '""') return 'General';
            
            const catLimpia = String(categoria).toLowerCase().trim();
            
            // Corregir categorías mal asignadas
            if (titulo && titulo.toLowerCase().includes('futbol')) {
                return 'Deporte';
            }
            if (titulo && titulo.toLowerCase().includes('taller') && titulo.toLowerCase().includes('artesania')) {
                return 'Cultura';
            }
            if (titulo && titulo.toLowerCase().includes('donacion') && titulo.toLowerCase().includes('ropa')) {
                return 'Asistencia Social';
            }
            
            // Mapeo de categorías
            const mapeoCategorias = {
                'salud': 'Salud',
                'deporte': 'Deporte',
                'cultura': 'Cultura',
                'educacion': 'Educación',
                'medio ambiente': 'Medio Ambiente',
                'emprendimiento': 'Emprendimiento',
                'asistencia social': 'Asistencia Social',
                'general': 'General'
            };
            
            return mapeoCategorias[catLimpia] || 'General';
        };

        const sanitizarNumero = (numero) => {
            if (numero === null || numero === undefined) return '0';
            const num = parseFloat(numero);
            return isNaN(num) ? '0' : num.toString().replace('.', ',');
        };

        const sanitizarMoneda = (monto) => {
            if (monto === null || monto === undefined) return '0,00';
            const num = parseFloat(monto);
            return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
        };

        const formatoFecha = (fecha) => {
            if (!fecha) return 'N/D';
            try {
                return new Date(fecha).toISOString().split('T')[0];
            } catch (e) {
                return 'N/D';
            }
        };

        // ============================================
        // FILTRADO Y LIMPIEZA DE DATOS
        // ============================================
        const donacionesAño = donacionesGlobal.filter(d => {
            if (!d || !d.fecha_donacion) return false;
            try {
                const fecha = new Date(d.fecha_donacion);
                return fecha.getFullYear() === añoActual;
            } catch (e) {
                return false;
            }
        }).filter(d => d && d.monto); // Filtrar donaciones válidas

        const sociosActivos = sociosGlobal
            .filter(s => s && s.estado === 'activo')
            .map(socio => ({
                ...socio,
                nombreLimpio: obtenerNombreSignificativo(socio)
            }));

        const eventosAño = eventosGlobal
            .filter(e => {
                if (!e || !e.fecha_evento) return false;
                try {
                    const fecha = new Date(e.fecha_evento);
                    return fecha.getFullYear() === añoActual;
                } catch (error) {
                    return false;
                }
            })
            .map(evento => ({
                ...evento,
                tituloLimpio: limpiarTituloEvento(evento.titulo),
                categoriaCorregida: corregirCategoria(evento.categoria, evento.titulo)
            }))
            .filter(evento => {
                // Filtrar eventos que no sean de prueba
                const titulo = evento.tituloLimpio.toLowerCase();
                return !titulo.includes('test') && 
                       !titulo.includes('prueba') && 
                       titulo !== 'actividad comunitaria' &&
                       evento.asistentes_confirmados !== undefined;
            });

        // ============================================
        // CÁLCULOS ESTADÍSTICOS
        // ============================================
        const donacionesCompletadas = donacionesAño.filter(d => d.estado_pago === 'completado');
        const totalRecaudado = donacionesCompletadas.reduce((sum, d) => {
            const monto = parseFloat(d.monto || 0);
            return isNaN(monto) ? sum : sum + monto;
        }, 0);

        const eventosCompletados = eventosAño.filter(e => e.estado === 'completado');
        const totalAsistentes = eventosCompletados.reduce((sum, e) => {
            const asistentes = parseInt(e.asistentes_confirmados) || 0;
            return sum + asistentes;
        }, 0);

        // ============================================
        // CONSTRUCCIÓN DEL CSV MEJORADO
        // ============================================
        let csvContent = '';
        csvContent += '\uFEFF'; // BOM para UTF-8

        // METADATOS
        csvContent += `REPORTE ANUAL KUENI KUENI - ${añoActual}\n`;
        csvContent += `Asociacion Civil Kueni Kueni\n`;
        csvContent += `Generado el: ${new Date().toLocaleDateString('es-MX')}\n`;
        csvContent += `Nochixtlan, Oaxaca, Mexico\n`;
        csvContent += `Contacto: contacto@kuenikueni.org | +52 951 123 4567\n`;
        csvContent += `Nota: Datos limpios y validados automaticamente\n`;
        csvContent += `\n`;

        // RESUMEN EJECUTIVO
        csvContent += `RESUMEN EJECUTIVO ${añoActual}\n`;
        csvContent += `Metrica${separador}Valor${separador}Detalles\n`;
        csvContent += `Total Recaudado${separador}${sanitizarMoneda(totalRecaudado)}${separador}${donacionesCompletadas.length} donaciones validas\n`;
        csvContent += `Socios Activos${separador}${sociosActivos.length}${separador}Miembros registrados\n`;
        csvContent += `Eventos Realizados${separador}${eventosCompletados.length}${separador}${totalAsistentes} participantes totales\n`;
        csvContent += `Eficiencia Operativa${separador}${((eventosCompletados.length / Math.max(eventosAño.length, 1)) * 100).toFixed(1)}%${separador}Eventos completados vs programados\n`;
        csvContent += `Donacion Promedio${separador}${sanitizarMoneda(donacionesCompletadas.length > 0 ? totalRecaudado / donacionesCompletadas.length : 0)}${separador}Por donante\n`;
        csvContent += `\n`;

        // DONACIONES DETALLADAS (solo completadas)
        csvContent += `DONACIONES VALIDADAS ${añoActual}\n`;
        csvContent += `ID${separador}Donante${separador}Monto${separador}Metodo Pago${separador}Estado${separador}Fecha${separador}Tipo${separador}Comentarios\n`;
        
        donacionesCompletadas.forEach(donacion => {
            if (!donacion) return;
            
            const fila = [
                donacion.id || 'N/D',
                sanitizarTexto(donacion.donante_nombre || 'Donante anonimo'),
                sanitizarMoneda(donacion.monto),
                sanitizarTexto(donacion.metodo_pago || 'Efectivo'),
                sanitizarTexto(donacion.estado_pago),
                formatoFecha(donacion.fecha_donacion),
                sanitizarTexto(donacion.tipo_donacion || 'Apoyo general'),
                sanitizarTexto(donacion.comentarios || 'Sin comentarios')
            ];
            
            csvContent += fila.join(separador) + '\n';
        });
        
        csvContent += `\n`;

        // SOCIOS Y MIEMBROS (solo activos con datos limpios)
        csvContent += `SOCIOS ACTIVOS\n`;
        csvContent += `ID${separador}Nombre${separador}Email${separador}Telefono${separador}Estado${separador}Fecha Ingreso${separador}Total Donaciones${separador}Eventos Asistidos${separador}Referido Por${separador}Ultima Actividad\n`;
        
        sociosActivos.forEach(socio => {
            if (!socio) return;
            
            const fila = [
                socio.id || 'N/D',
                sanitizarTexto(socio.nombreLimpio),
                sanitizarTexto(socio.email || 'No registrado'),
                sanitizarTexto(socio.telefono || 'No registrado'),
                sanitizarTexto(socio.estado),
                formatoFecha(socio.fecha_ingreso),
                sanitizarNumero(socio.total_donaciones),
                sanitizarNumero(socio.total_eventos_asistidos),
                sanitizarTexto(socio.referido_por || 'Ingreso directo'),
                formatoFecha(socio.ultima_actividad)
            ];
            
            csvContent += fila.join(separador) + '\n';
        });
        
        csvContent += `\n`;

        // EVENTOS Y ACTIVIDADES (solo completados y limpios)
        csvContent += `EVENTOS REALIZADOS ${añoActual}\n`;
        csvContent += `ID${separador}Titulo${separador}Categoria${separador}Fecha${separador}Estado${separador}Asistentes${separador}Cupo Maximo${separador}Ocupacion${separador}Responsable${separador}Ubicacion${separador}Descripcion${separador}Costo${separador}Ingresos\n`;
        
        eventosCompletados.forEach(evento => {
            if (!evento) return;
            
            const ocupacion = evento.cupo_maximo > 0 ? 
                ((evento.asistentes_confirmados || 0) / evento.cupo_maximo * 100).toFixed(1) + '%' : 
                'N/D';
            
            const fila = [
                evento.id || 'N/D',
                sanitizarTexto(evento.tituloLimpio),
                sanitizarTexto(evento.categoriaCorregida),
                formatoFecha(evento.fecha_evento),
                sanitizarTexto(evento.estado),
                sanitizarNumero(evento.asistentes_confirmados),
                sanitizarNumero(evento.cupo_maximo),
                ocupacion,
                sanitizarTexto(evento.responsable || 'Coordinacion Kueni Kueni'),
                sanitizarTexto(evento.ubicacion || 'Comunidad Mixteca'),
                sanitizarTexto(evento.descripcion || 'Actividad de desarrollo comunitario'),
                sanitizarMoneda(evento.costo_estimado),
                sanitizarMoneda(evento.ingresos_generados)
            ];
            
            csvContent += fila.join(separador) + '\n';
        });
        
        csvContent += `\n`;

        // ANÁLISIS ESTADÍSTICO
        csvContent += `ANALISIS ESTADISTICO ${añoActual}\n`;
        
        // Estadísticas financieras
        const promedioDonacion = donacionesCompletadas.length > 0 ? 
            totalRecaudado / donacionesCompletadas.length : 0;
        const maxDonacion = donacionesCompletadas.length > 0 ? 
            Math.max(...donacionesCompletadas.map(d => parseFloat(d.monto || 0))) : 0;
        
        csvContent += `ESTADISTICAS FINANCIERAS\n`;
        csvContent += `Metrica${separador}Valor\n`;
        csvContent += `Donacion Promedio${separador}${sanitizarMoneda(promedioDonacion)}\n`;
        csvContent += `Donacion Maxima${separador}${sanitizarMoneda(maxDonacion)}\n`;
        csvContent += `Total Donaciones Validas${separador}${donacionesCompletadas.length}\n`;
        csvContent += `Tasa de Exito${separador}${((donacionesCompletadas.length / Math.max(donacionesAño.length, 1)) * 100).toFixed(1)}%\n`;
        csvContent += `\n`;
        
        // Distribución por método de pago (solo de donaciones completadas)
        const metodoPagoStats = {};
        donacionesCompletadas.forEach(d => {
            const metodo = d.metodo_pago || 'No especificado';
            metodoPagoStats[metodo] = (metodoPagoStats[metodo] || 0) + 1;
        });
        
        csvContent += `DISTRIBUCION POR METODO DE PAGO\n`;
        csvContent += `Metodo${separador}Cantidad${separador}Porcentaje\n`;
        Object.entries(metodoPagoStats).forEach(([metodo, count]) => {
            const porcentaje = ((count / donacionesCompletadas.length) * 100).toFixed(1);
            csvContent += `${sanitizarTexto(metodo)}${separador}${count}${separador}${porcentaje}%\n`;
        });
        
        csvContent += `\n`;
        
        // Distribución por categoría de eventos (solo eventos limpios)
        const categoriaStats = {};
        eventosCompletados.forEach(e => {
            const categoria = e.categoriaCorregida;
            categoriaStats[categoria] = (categoriaStats[categoria] || 0) + 1;
        });
        
        csvContent += `DISTRIBUCION POR CATEGORIA DE EVENTOS\n`;
        csvContent += `Categoria${separador}Eventos${separador}Asistentes Totales${separador}Participacion Promedio\n`;
        Object.entries(categoriaStats).forEach(([categoria, count]) => {
            const eventosCategoria = eventosCompletados.filter(e => e.categoriaCorregida === categoria);
            const asistentesCategoria = eventosCategoria.reduce((sum, e) => sum + (e.asistentes_confirmados || 0), 0);
            const participacionPromedio = count > 0 ? (asistentesCategoria / count).toFixed(1) : '0';
            csvContent += `${sanitizarTexto(categoria)}${separador}${count}${separador}${asistentesCategoria}${separador}${participacionPromedio}\n`;
        });
        
        csvContent += `\n`;

        // TOP DONANTES (agrupando nombres similares)
        csvContent += `TOP DONANTES ${añoActual}\n`;
        
        const donantesMap = {};
        donacionesCompletadas.forEach(d => {
            let donante = d.donante_nombre || 'Donante anonimo';
            
            // Agrupar nombres similares (case insensitive y sin espacios extras)
            donante = donante.toLowerCase().trim();
            const monto = parseFloat(d.monto || 0);
            
            if (!isNaN(monto)) {
                donantesMap[donante] = (donantesMap[donante] || 0) + monto;
            }
        });
        
        const topDonantes = Object.entries(donantesMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([nombre, monto]) => [
                nombre.charAt(0).toUpperCase() + nombre.slice(1), // Capitalizar
                monto
            ]);
        
        csvContent += `Posicion${separador}Donante${separador}Monto Total\n`;
        
        topDonantes.forEach(([donante, montoTotal], index) => {
            csvContent += `${index + 1}${separador}${sanitizarTexto(donante)}${separador}${sanitizarMoneda(montoTotal)}\n`;
        });
        
        csvContent += `\n`;

        // EVENTOS DESTACADOS (solo eventos con asistentes)
        csvContent += `EVENTOS MAS EXITOSOS ${añoActual}\n`;
        
        const eventosExitosos = eventosCompletados
            .filter(e => e && (e.asistentes_confirmados || 0) > 0)
            .sort((a, b) => (b.asistentes_confirmados || 0) - (a.asistentes_confirmados || 0))
            .slice(0, 5);
        
        csvContent += `Posicion${separador}Evento${separador}Fecha${separador}Asistentes${separador}Cupo${separador}Ocupacion${separador}Categoria\n`;
        
        eventosExitosos.forEach((evento, index) => {
            if (!evento) return;
            
            const ocupacion = evento.cupo_maximo > 0 ? 
                ((evento.asistentes_confirmados || 0) / evento.cupo_maximo * 100).toFixed(1) + '%' : 
                'N/D';
            
            csvContent += `${index + 1}${separador}${sanitizarTexto(evento.tituloLimpio)}${separador}${formatoFecha(evento.fecha_evento)}${separador}${evento.asistentes_confirmados || 0}${separador}${evento.cupo_maximo || 0}${separador}${ocupacion}${separador}${sanitizarTexto(evento.categoriaCorregida)}\n`;
        });

        // ============================================
        // GENERAR Y DESCARGAR EL ARCHIVO
        // ============================================
        const blob = new Blob([csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Kueni_Kueni_Reporte_${añoActual}_Limpio.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        mostrarNotificacion(`CSV limpio generado exitosamente para ${añoActual}`, 'success');
        
    } catch (error) {
        console.error('Error al generar CSV:', error);
        mostrarNotificacion('Error al generar el archivo CSV', 'error');
    }
}
async function exportarPDF() {
    mostrarNotificacion('Generando reporte PDF profesional...', 'info');

    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            throw new Error('jsPDF no está disponible');
        }

        const doc = new jsPDF('p', 'mm', 'a4');

        // Configuración de idioma y fuente
        doc.setLanguage('es');
        doc.setFont('helvetica');

        // Paleta de colores basada en el CSS proporcionado
        const COLOR_PRIMARIO = [94, 6, 82];        // #5e0652 - Morado principal
        const COLOR_SECUNDARIO = [146, 72, 122];   // #92487A - Morado claro
        const COLOR_TERCIARIO = [240, 216, 220];   // #f0d8dc - Rosa claro
        const COLOR_AMARILLO = [202, 138, 4];      // #ca8a04 - Amarillo
        const COLOR_AZUL = [30, 64, 175];          // #1e40af - Azul
        const COLOR_MORADO_CLARO = [124, 58, 237]; // #7c3aed - Morado claro
        const COLOR_GRIS_OSCURO = [24, 24, 27];    // #18181b - Gris oscuro
        const COLOR_GRIS_MEDIO = [113, 113, 122];  // #71717a - Gris medio
        const COLOR_GRIS_CLARO = [228, 228, 231];  // #e4e4e7 - Gris claro
        const COLOR_FONDO = [249, 250, 251];       // #f9fafb - Fondo gris

        // ============================================
        // VALIDACIÓN Y CÁLCULO DE DATOS
        // ============================================
        const donacionesAño = donacionesGlobal.filter(d => {
            if (!d || !d.fecha_donacion) return false;
            try {
                const fecha = new Date(d.fecha_donacion);
                return fecha.getFullYear() === añoSeleccionado;
            } catch (e) {
                return false;
            }
        });

        const donacionesCompletadas = donacionesAño.filter(d => d.estado_pago === 'completado');
        const totalRecaudado = donacionesCompletadas.reduce((sum, d) => {
            const monto = parseFloat(d.monto || 0);
            return isNaN(monto) ? sum : sum + monto;
        }, 0);

        const promedio = donacionesCompletadas.length > 0 ? totalRecaudado / donacionesCompletadas.length : 0;
        const maxDonacion = donacionesCompletadas.length > 0 ?
            Math.max(...donacionesCompletadas.map(d => parseFloat(d.monto || 0))) : 0;

        const sociosActivos = sociosGlobal.filter(s => s && s.estado === 'activo');
        const sociosNuevosAño = sociosGlobal.filter(s => {
            if (!s || !s.fecha_ingreso) return false;
            try {
                const fecha = new Date(s.fecha_ingreso);
                return fecha.getFullYear() === añoSeleccionado;
            } catch (e) {
                return false;
            }
        });

        const eventosAño = eventosGlobal.filter(e => {
            if (!e || !e.fecha_evento) return false;
            try {
                const fecha = new Date(e.fecha_evento);
                return fecha.getFullYear() === añoSeleccionado;
            } catch (error) {
                return false;
            }
        });

        const eventosCompletados = eventosAño.filter(e => e.estado === 'completado');
        const totalAsistentes = eventosCompletados.reduce((sum, e) => {
            const asistentes = parseInt(e.asistentes_confirmados) || 0;
            return sum + asistentes;
        }, 0);

        const eventosProximos = eventosAño.filter(e => e.estado === 'proximo');
        const eventosCancelados = eventosAño.filter(e => e.estado === 'cancelado');
        const totalCupo = eventosCompletados.reduce((sum, e) => sum + (e.cupo_maximo || 0), 0);
        const ocupacionPromedio = totalCupo > 0 ? (totalAsistentes / totalCupo) * 100 : 0;

        // Cálculo de crecimiento interanual
        const donacionesAñoAnterior = donacionesGlobal.filter(d => {
            if (!d || !d.fecha_donacion) return false;
            try {
                const fecha = new Date(d.fecha_donacion);
                return fecha.getFullYear() === (añoSeleccionado - 1) && d.estado_pago === 'completado';
            } catch (e) {
                return false;
            }
        });

        const totalAñoAnterior = donacionesAñoAnterior.reduce((sum, d) => {
            const monto = parseFloat(d.monto || 0);
            return isNaN(monto) ? sum : sum + monto;
        }, 0);

        const crecimiento = totalAñoAnterior > 0 ?
            ((totalRecaudado - totalAñoAnterior) / totalAñoAnterior) * 100 :
            (totalRecaudado > 0 ? 100 : 0);

        // ============================================
        // PORTADA PROFESIONAL
        // ============================================
        doc.setFillColor(...COLOR_PRIMARIO);
        doc.rect(0, 0, 210, 297, 'F');

        // Marco decorativo
        doc.setDrawColor(255, 255, 255, 30);
        doc.setLineWidth(2);
        doc.roundedRect(25, 40, 160, 180, 10, 10, 'S');

        // Contenido de portada
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.text('KUENI KUENI', 105, 80, { align: 'center' });

        doc.setFontSize(20);
        doc.setFont('helvetica', 'normal');
        doc.text('Reporte Anual de Gestión', 105, 100, { align: 'center' });

        // Año destacado
        doc.setFillColor(255, 255, 255);
        doc.setTextColor(...COLOR_PRIMARIO);
        doc.roundedRect(85, 115, 40, 40, 5, 5, 'F');
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(añoSeleccionado.toString(), 105, 140, { align: 'center' });

        // Información de la organización
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Asociación Civil', 105, 180, { align: 'center' });
        doc.text('Nochixtlán, Oaxaca', 105, 190, { align: 'center' });
        doc.text('Paso a paso, construyendo comunidad', 105, 200, { align: 'center' });

        // Fecha de generación
        const hoy = new Date();
        const fechaFormateada = hoy.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.setFontSize(10);
        doc.text(`Generado el ${fechaFormateada}`, 105, 250, { align: 'center' });
        doc.text('Sistema de Gestión Kueni Kueni', 105, 260, { align: 'center' });

        // ============================================
        // PÁGINA 2: RESUMEN EJECUTIVO
        // ============================================
        doc.addPage();

        // Encabezado de página
        doc.setFillColor(...COLOR_PRIMARIO);
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN EJECUTIVO', 20, 16);

        let y = 40;

        // Introducción contextual
        doc.setTextColor(...COLOR_GRIS_OSCURO);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Este reporte presenta el análisis integral de la gestión de la asociación Kueni Kueni durante el año ${añoSeleccionado},`, 20, y);
        doc.text(`mostrando el progreso en nuestras áreas principales: comunidad, medio ambiente, cultura y emprendimiento.`, 20, y + 5);
        y += 20;

        // Métricas principales en diseño de tarjetas
        const metrics = [
            {
                label: 'IMPACTO ECONÓMICO',
                value: `$${Math.round(totalRecaudado).toLocaleString('es-MX')}`,
                subtitle: `${donacionesCompletadas.length} donaciones procesadas`,
                color: COLOR_AMARILLO,
                description: `Crecimiento del ${Math.abs(crecimiento).toFixed(1)}% vs ${añoSeleccionado - 1}`
            },
            {
                label: 'COMUNIDAD ACTIVA',
                value: sociosActivos.length.toString(),
                subtitle: `${sociosNuevosAño.length} nuevos integrantes`,
                color: COLOR_AZUL,
                description: 'Base comunitaria en crecimiento'
            },
            {
                label: 'EVENTOS REALIZADOS',
                value: eventosCompletados.length.toString(),
                subtitle: `${totalAsistentes} participantes totales`,
                color: COLOR_SECUNDARIO,
                description: `${eventosProximos.length} eventos programados`
            },
            {
                label: 'SOLIDARIDAD PROMEDIO',
                value: `$${Math.round(promedio).toLocaleString('es-MX')}`,
                subtitle: `Máxima: $${Math.round(maxDonacion).toLocaleString('es-MX')}`,
                color: COLOR_MORADO_CLARO,
                description: 'Donación promedio por persona'
            }
        ];

        metrics.forEach((metric, index) => {
            const x = index % 2 === 0 ? 20 : 110;
            if (index % 2 === 0 && index > 0) y += 55;

            // Tarjeta con borde de color
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...metric.color);
            doc.setLineWidth(2);
            doc.roundedRect(x, y, 85, 50, 5, 5, 'FD');

            // Valor principal
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLOR_GRIS_OSCURO);
            doc.text(metric.value, x + 10, y + 15);

            // Label
            doc.setFontSize(8);
            doc.setTextColor(...COLOR_GRIS_MEDIO);
            doc.text(metric.label, x + 10, y + 22);

            // Subtitle
            doc.setFontSize(7);
            doc.text(metric.subtitle, x + 10, y + 35);

            // Description
            doc.setTextColor(...metric.color);
            doc.text(metric.description, x + 10, y + 42);
        });

        y += 60;

        // Análisis comparativo
        doc.setFillColor(...COLOR_FONDO);
        doc.roundedRect(20, y, 170, 45, 5, 5, 'F');

        doc.setTextColor(...COLOR_GRIS_OSCURO);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISIS COMPARATIVO', 30, y + 10);

        const tasaFinalizacion = donacionesAño.length > 0 ?
            (donacionesCompletadas.length / donacionesAño.length) * 100 : 0;

        const eficienciaEventos = eventosAño.length > 0 ?
            (eventosCompletados.length / eventosAño.length) * 100 : 0;

        const participacionPromedio = eventosCompletados.length > 0 ?
            totalAsistentes / eventosCompletados.length : 0;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Crecimiento interanual: ${crecimiento >= 0 ? '+' : ''}${crecimiento.toFixed(1)}%`, 30, y + 20);
        doc.text(`Eficiencia en eventos: ${eficienciaEventos.toFixed(1)}% completados`, 30, y + 27);
        doc.text(`Participación promedio: ${participacionPromedio.toFixed(1)} personas por evento`, 30, y + 34);
        doc.text(`Ocupación de eventos: ${ocupacionPromedio.toFixed(1)}% del cupo total`, 30, y + 41);

        // ============================================
        // PÁGINA 3: ANÁLISIS VISUAL
        // ============================================
        doc.addPage();

        // Encabezado
        doc.setFillColor(...COLOR_PRIMARIO);
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISIS VISUAL Y TENDENCIAS', 20, 16);

        y = 35;

        // Gráfica del canvas
        try {
            const canvas = document.getElementById('donacionesChart');
            if (canvas && canvas.width > 0 && canvas.height > 0) {
                // Marco para la gráfica
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(...COLOR_GRIS_CLARO);
                doc.roundedRect(15, y, 180, 85, 5, 5, 'FD');

                const chartImage = canvas.toDataURL('image/png', 1.0);
                doc.addImage(chartImage, 'PNG', 20, y + 5, 170, 75);
                y += 95;

                doc.setTextColor(...COLOR_GRIS_MEDIO);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.text('Figura 1: Evolución mensual de donaciones y participación comunitaria', 105, y, { align: 'center' });
                y += 10;
            } else {
                throw new Error('Canvas no disponible');
            }
        } catch (error) {
            // Diseño alternativo cuando no hay gráfica
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...COLOR_GRIS_CLARO);
            doc.roundedRect(20, y, 170, 80, 5, 5, 'FD');

            doc.setTextColor(...COLOR_GRIS_MEDIO);
            doc.setFontSize(12);
            doc.text('Gráfica no disponible', 105, y + 40, { align: 'center' });
            doc.setFontSize(10);
            doc.text('Los datos visuales estarán disponibles en la próxima actualización', 105, y + 48, { align: 'center' });
            y += 90;
        }

        // DISTRIBUCIÓN POR CATEGORÍAS
        doc.setTextColor(...COLOR_GRIS_OSCURO);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('DISTRIBUCIÓN POR CATEGORÍAS', 20, y);
        y += 10;

        // Métodos de pago
        const metodoPago = {};
        donacionesCompletadas.forEach(d => {
            const metodo = d.metodo_pago || 'No especificado';
            metodoPago[metodo] = (metodoPago[metodo] || 0) + 1;
        });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Métodos de Pago Preferidos:', 25, y);
        y += 8;

        doc.setFont('helvetica', 'normal');
        Object.entries(metodoPago).forEach(([metodo, count]) => {
            const porcentaje = donacionesCompletadas.length > 0 ?
                ((count / donacionesCompletadas.length) * 100).toFixed(1) : '0.0';

            // Barra visual
            const barWidth = (count / Math.max(...Object.values(metodoPago))) * 60;
            doc.setFillColor(...COLOR_SECUNDARIO);
            doc.rect(30, y - 3, barWidth, 4, 'F');

            doc.text(`${metodo}: ${count} (${porcentaje}%)`, 95, y);
            y += 6;
        });

        y += 10;

        // Categorías de eventos
        const categoriasEventos = {};
        eventosCompletados.forEach(e => {
            const categoria = e.categoria || 'General';
            categoriasEventos[categoria] = (categoriasEventos[categoria] || 0) + 1;
        });

        doc.setFont('helvetica', 'bold');
        doc.text('Tipos de Eventos Realizados:', 25, y);
        y += 8;

        doc.setFont('helvetica', 'normal');
        Object.entries(categoriasEventos).forEach(([categoria, count]) => {
            const asistentesCategoria = eventosCompletados
                .filter(e => (e.categoria || 'General') === categoria)
                .reduce((sum, e) => sum + (e.asistentes_confirmados || 0), 0);

            doc.text(`${categoria}: ${count} eventos, ${asistentesCategoria} asistentes`, 30, y);
            y += 6;
        });

        y += 15;

        // ANÁLISIS DE TEMPORADA
        doc.setFillColor(...COLOR_FONDO);
        doc.roundedRect(20, y, 170, 35, 5, 5, 'F');

        doc.setTextColor(...COLOR_GRIS_OSCURO);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PATRONES ESTACIONALES', 30, y + 10);

        // Análisis simple de temporadas
        const eventosPorMes = Array(12).fill(0);
        eventosCompletados.forEach(e => {
            try {
                const mes = new Date(e.fecha_evento).getMonth();
                eventosPorMes[mes]++;
            } catch (error) { }
        });

        const mesMaxEventos = eventosPorMes.indexOf(Math.max(...eventosPorMes));
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Mes más activo: ${meses[mesMaxEventos]} (${eventosPorMes[mesMaxEventos]} eventos)`, 30, y + 20);
        doc.text(`Total de eventos cancelados: ${eventosCancelados.length}`, 30, y + 27);
        doc.text(`Eficiencia operativa: ${((eventosCompletados.length / eventosAño.length) * 100).toFixed(1)}%`, 30, y + 34);

        // ============================================
        // PÁGINA 4: ANÁLISIS DETALLADO - SOLUCIÓN AL PROBLEMA DE SOBREPOSICIÓN
        // ============================================
        doc.addPage();

        // Encabezado
        doc.setFillColor(...COLOR_PRIMARIO);
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISIS DETALLADO Y RECONOCIMIENTOS', 20, 16);

        y = 35;

        // TOP DONANTES
        const donantesMap = {};
        donacionesCompletadas.forEach(d => {
            const donante = d.donante_nombre || 'Donante Anónimo';
            const monto = parseFloat(d.monto || 0);
            if (!isNaN(monto)) {
                donantesMap[donante] = (donantesMap[donante] || 0) + monto;
            }
        });

        const topDonantes = Object.entries(donantesMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        doc.setTextColor(...COLOR_GRIS_OSCURO);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TOP DONANTES DESTACADOS', 20, y);
        y += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Reconocimiento a la solidaridad y apoyo continuo de nuestra comunidad', 20, y);
        y += 12;

        if (topDonantes.length > 0) {
            // Cabecera de tabla
            doc.setFillColor(...COLOR_PRIMARIO);
            doc.roundedRect(20, y, 170, 8, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.text('#', 25, y + 5);
            doc.text('Donante', 35, y + 5);
            doc.text('Contribución Total', 160, y + 5, { align: 'right' });
            y += 8;

            // Filas de tabla
            doc.setFontSize(8);
            topDonantes.forEach(([donante, monto], index) => {
                const isEven = index % 2 === 0;
                doc.setFillColor(...(isEven ? [250, 250, 250] : [255, 255, 255]));
                doc.roundedRect(20, y, 170, 7, 2, 2, 'F');

                // Número
                doc.setTextColor(...COLOR_GRIS_MEDIO);
                doc.text((index + 1).toString(), 25, y + 5);

                // Nombre del donante
                doc.setTextColor(...COLOR_GRIS_OSCURO);
                const nombre = donante.length > 35 ? donante.substring(0, 35) + '...' : donante;
                doc.text(nombre, 35, y + 5);

                // Monto con color según el rango
                const colorMonto = index < 3 ? COLOR_SECUNDARIO : COLOR_GRIS_OSCURO;
                doc.setTextColor(...colorMonto);
                doc.text(`$${Math.round(monto).toLocaleString('es-MX')}`, 185, y + 5, { align: 'right' });
                y += 7;
            });

            // Total destacado
            y += 5;
            doc.setFillColor(...COLOR_FONDO);
            doc.roundedRect(20, y, 170, 8, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLOR_GRIS_OSCURO);
            doc.text('Total Recaudado (Top 10):', 120, y + 5);
            const totalTop10 = topDonantes.reduce((sum, [, monto]) => sum + monto, 0);
            doc.text(`$${Math.round(totalTop10).toLocaleString('es-MX')}`, 185, y + 5, { align: 'right' });
        } else {
            doc.setFontSize(10);
            doc.setTextColor(...COLOR_GRIS_MEDIO);
            doc.text('No hay datos de donaciones completadas para mostrar', 25, y);
        }

        y += 25;

        // EVENTOS MÁS EXITOSOS
        const eventosExitosos = eventosCompletados
            .filter(e => e && (e.asistentes_confirmados || 0) > 0)
            .sort((a, b) => (b.asistentes_confirmados || 0) - (a.asistentes_confirmados || 0))
            .slice(0, 6); // Reducido de 8 a 6 para dar más espacio

        if (eventosExitosos.length > 0) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLOR_GRIS_OSCURO);
            doc.text('EVENTOS MÁS DESTACADOS', 20, y);
            y += 8;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Eventos con mayor participación e impacto comunitario', 20, y);
            y += 12;

            // Cabecera de tabla
            doc.setFillColor(...COLOR_PRIMARIO);
            doc.roundedRect(20, y, 170, 8, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.text('Evento', 25, y + 5);
            doc.text('Particip.', 140, y + 5, { align: 'right' });
            doc.text('Cupo', 155, y + 5, { align: 'right' });
            doc.text('Ocupación', 170, y + 5, { align: 'right' });
            y += 8;

            // Filas de tabla
            doc.setFontSize(8);
            eventosExitosos.forEach((evento, index) => {
                if (!evento) return;

                // VERIFICACIÓN DE ESPACIO - SI NO HAY SUFICIENTE ESPACIO, CREAR NUEVA PÁGINA
                if (y > 220) { // Si nos acercamos al final de la página
                    // Agregar pie de página a la página actual
                    doc.setDrawColor(...COLOR_PRIMARIO);
                    doc.setLineWidth(0.5);
                    doc.line(20, 275, 190, 275);
                    doc.setFontSize(8);
                    doc.setTextColor(...COLOR_GRIS_MEDIO);
                    doc.text(`Reporte Kueni Kueni ${añoSeleccionado} - Página ${doc.internal.getNumberOfPages()} de ?`, 105, 282, { align: 'center' });
                    doc.text('Asociación Civil Kueni Kueni | Abasolo 27, Nochixtlán, Oaxaca, México', 105, 287, { align: 'center' });
                    doc.text('www.kuenikueni.org | contacto@kuenikueni.org | +52 951 123 4567', 105, 292, { align: 'center' });

                    // Crear nueva página
                    doc.addPage();
                    y = 35;

                    // Encabezado de la nueva página
                    doc.setFillColor(...COLOR_PRIMARIO);
                    doc.rect(0, 0, 210, 25, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(16);
                    doc.setFont('helvetica', 'bold');
                    doc.text('CONTINUACIÓN: MÉTRICAS DE PARTICIPACIÓN', 20, 16);
                }

                const isEven = index % 2 === 0;
                doc.setFillColor(...(isEven ? [250, 250, 250] : [255, 255, 255]));
                doc.roundedRect(20, y, 170, 7, 2, 2, 'F');

                doc.setTextColor(...COLOR_GRIS_OSCURO);

                const tituloEvento = evento.titulo || 'Evento sin título';
                const titulo = tituloEvento.length > 40 ?
                    tituloEvento.substring(0, 40) + '...' :
                    tituloEvento;

                const asistentes = evento.asistentes_confirmados || 0;
                const cupo = evento.cupo_maximo || 0;
                const ocupacion = cupo > 0 ? (asistentes / cupo) * 100 : 0;

                let fecha = 'N/D';
                try {
                    if (evento.fecha_evento) {
                        fecha = new Date(evento.fecha_evento).toLocaleDateString('es-MX', {
                            month: 'short',
                            day: 'numeric'
                        });
                    }
                } catch (error) {
                    console.warn('Fecha de evento inválida:', evento.fecha_evento);
                }

                doc.text(titulo, 25, y + 5);
                doc.text(asistentes.toString(), 140, y + 5, { align: 'right' });
                doc.text(cupo.toString(), 155, y + 5, { align: 'right' });

                // Indicador de ocupación con color
                const colorOcupacion = ocupacion >= 80 ? COLOR_SECUNDARIO :
                    ocupacion >= 50 ? COLOR_AMARILLO : COLOR_GRIS_MEDIO;
                doc.setTextColor(...colorOcupacion);
                doc.text(`${ocupacion.toFixed(0)}%`, 170, y + 5, { align: 'right' });
                y += 7;
            });
        }

        y += 15;

        // VERIFICACIÓN FINAL DE ESPACIO PARA MÉTRICAS DE PARTICIPACIÓN
        if (y > 200) { // Si no hay espacio suficiente para las métricas
            // Agregar pie de página a la página actual
            doc.setDrawColor(...COLOR_PRIMARIO);
            doc.setLineWidth(0.5);
            doc.line(20, 275, 190, 275);
            doc.setFontSize(8);
            doc.setTextColor(...COLOR_GRIS_MEDIO);
            doc.text(`Reporte Kueni Kueni ${añoSeleccionado} - Página ${doc.internal.getNumberOfPages()} de ?`, 105, 282, { align: 'center' });
            doc.text('Asociación Civil Kueni Kueni | Abasolo 27, Nochixtlán, Oaxaca, México', 105, 287, { align: 'center' });
            doc.text('www.kuenikueni.org | contacto@kuenikueni.org | +52 951 123 4567', 105, 292, { align: 'center' });

            // Crear nueva página para las métricas
            doc.addPage();
            y = 35;

            // Encabezado de la nueva página
            doc.setFillColor(...COLOR_PRIMARIO);
            doc.rect(0, 0, 210, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('MÉTRICAS DE PARTICIPACIÓN COMUNITARIA', 20, 16);
            y = 45; // Posición después del encabezado
        }

        // MÉTRICAS DE PARTICIPACIÓN
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_GRIS_OSCURO);
        doc.text('MÉTRICAS DE PARTICIPACIÓN COMUNITARIA', 20, y);
        y += 15;

        const eventosAsistidos = sociosActivos.reduce((sum, s) => {
            const asistencias = parseInt(s.total_eventos_asistidos) || 0;
            return sum + asistencias;
        }, 0);

        const promedioParticipacion = sociosActivos.length > 0 ?
            eventosAsistidos / sociosActivos.length : 0;

        const sociosDonantes = sociosActivos.filter(s => {
            const donaciones = parseInt(s.total_donaciones) || 0;
            return donaciones > 0;
        }).length;

        const tasaContribucion = sociosActivos.length > 0 ?
            (sociosDonantes / sociosActivos.length) * 100 : 0;

        // Asegurar que el texto de crecimiento comunitario esté bien formateado
        const textoCrecimiento = `Crecimiento comunitario: ${sociosNuevosAño.length} nuevos miembros en ${añoSeleccionado}`;

        const metricasParticipacion = [
            `Base comunitaria activa: ${sociosActivos.length} miembros`,
            `Participación promedio: ${promedioParticipacion.toFixed(1)} eventos por socio`,
            `Tasa de contribución: ${tasaContribucion.toFixed(1)}% de socios son donantes`,
            `Total de interacciones: ${eventosAsistidos} asistencias registradas`,
            `Eficiencia organizativa: ${((eventosCompletados.length / eventosAño.length) * 100).toFixed(1)}% de eventos completados`,
            textoCrecimiento // Usar la variable formateada correctamente
        ];

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        metricasParticipacion.forEach(metrica => {
            // Verificar si hay espacio para la siguiente línea
            if (y > 250) {
                // Agregar pie de página y crear nueva página
                doc.setDrawColor(...COLOR_PRIMARIO);
                doc.setLineWidth(0.5);
                doc.line(20, 275, 190, 275);
                doc.setFontSize(8);
                doc.setTextColor(...COLOR_GRIS_MEDIO);
                doc.text(`Reporte Kueni Kueni ${añoSeleccionado} - Página ${doc.internal.getNumberOfPages()} de ?`, 105, 282, { align: 'center' });
                doc.text('Asociación Civil Kueni Kueni | Abasolo 27, Nochixtlán, Oaxaca, México', 105, 287, { align: 'center' });
                doc.text('www.kuenikueni.org | contacto@kuenikueni.org | +52 951 123 4567', 105, 292, { align: 'center' });

                doc.addPage();
                y = 35;

                // Encabezado de continuación
                doc.setFillColor(...COLOR_PRIMARIO);
                doc.rect(0, 0, 210, 25, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('CONTINUACIÓN: MÉTRICAS DE PARTICIPACIÓN', 20, 16);
                y = 45;

                // Re-escribir el título en la nueva página
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...COLOR_GRIS_OSCURO);
                doc.text('MÉTRICAS DE PARTICIPACIÓN COMUNITARIA', 20, y);
                y += 15;

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
            }

            doc.text(metrica, 25, y);
            y += 6;
        });

        // ============================================
        // PÁGINA 5: CONCLUSIONES Y PERSPECTIVAS
        // ============================================
        doc.addPage();

        // Encabezado
        doc.setFillColor(...COLOR_PRIMARIO);
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('CONCLUSIONES Y PERSPECTIVAS FUTURAS', 20, 16);

        y = 35;

        // RESUMEN DE LOGROS
        doc.setTextColor(...COLOR_GRIS_OSCURO);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('LOGROS DESTACADOS ' + añoSeleccionado, 20, y);
        y += 10;

        const logros = [
            `Recaudación histórica de $${Math.round(totalRecaudado).toLocaleString('es-MX')} destinados a proyectos comunitarios`,
            `Crecimiento del ${Math.abs(crecimiento).toFixed(1)}% en apoyo económico respecto al año anterior`,
            `${eventosCompletados.length} eventos realizados impactando a ${totalAsistentes} personas`,
            `Fortalecimiento de la base comunitaria con ${sociosNuevosAño.length} nuevos miembros`,
            `Eficiencia del ${((eventosCompletados.length / eventosAño.length) * 100).toFixed(1)}% en ejecución de actividades`,
            `Promedio de ${participacionPromedio.toFixed(1)} participantes por evento comunitario`
        ];

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        logros.forEach(logro => {
            doc.text(logro, 25, y);
            y += 6;
        });

        y += 15;

        // ÁREAS DE OPORTUNIDAD
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ÁREAS DE OPORTUNIDAD', 20, y);
        y += 10;

        const oportunidades = [
            `Incrementar la tasa de finalización de donaciones (actualmente ${tasaFinalizacion.toFixed(1)}%)`,
            `Mejorar la ocupación de eventos (actual ${ocupacionPromedio.toFixed(1)}% del cupo disponible)`,
            `Diversificar métodos de pago para facilitar contribuciones`,
            `Fortalecer la retención de nuevos miembros (${sociosNuevosAño.length} incorporados)`,
            `Optimizar la planificación para reducir eventos cancelados (${eventosCancelados.length} este año)`
        ];

        doc.setFontSize(9);
        oportunidades.forEach(oportunidad => {
            doc.text(oportunidad, 25, y);
            y += 6;
        });

        y += 15;

        // PERSPECTIVAS
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PERSPECTIVAS ' + (añoSeleccionado + 1), 20, y);
        y += 10;

        const perspectivas = [
            `Meta de crecimiento: Incrementar la recaudación en un 25% para el próximo año`,
            `Expansión comunitaria: Alcanzar los ${sociosActivos.length + 20} miembros activos`,
            `Diversificación: Implementar 3 nuevos tipos de eventos comunitarios`,
            `Tecnología: Completar la migración al sistema de gestión Kueni Kueni 2.0`,
            `Impacto: Duplicar el número de beneficiarios directos en la Mixteca Oaxaqueña`
        ];

        doc.setFontSize(9);
        perspectivas.forEach(perspectiva => {
            doc.text(perspectiva, 25, y);
            y += 6;
        });

        y += 20;

        // MENSAJE FINAL
        doc.setFillColor(...COLOR_FONDO);
        doc.roundedRect(20, y, 170, 25, 5, 5, 'F');

        doc.setTextColor(...COLOR_PRIMARIO);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('"Paso a paso, construyendo comunidad" - Kueni Kueni', 105, y + 10, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Este reporte refleja el compromiso continuo de nuestra asociación con el desarrollo', 105, y + 17, { align: 'center' });
        doc.text('integral de la Mixteca Oaxaqueña y el apoyo a grupos vulnerables.', 105, y + 22, { align: 'center' });

        // ============================================
        // PIE DE PÁGINA EN TODAS LAS PÁGINAS
        // ============================================
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);

            // Línea decorativa
            doc.setDrawColor(...COLOR_PRIMARIO);
            doc.setLineWidth(0.5);
            doc.line(20, 275, 190, 275);

            // Información del pie
            doc.setFontSize(8);
            doc.setTextColor(...COLOR_GRIS_MEDIO);
            doc.text(`Reporte Kueni Kueni ${añoSeleccionado} - Página ${i} de ${totalPages}`, 105, 282, { align: 'center' });
            doc.text('Asociación Civil Kueni Kueni | Abasolo 27, Nochixtlán, Oaxaca, México', 105, 287, { align: 'center' });
            doc.text('www.kuenikueni.org | contacto@kuenikueni.org | +52 951 123 4567', 105, 292, { align: 'center' });
        }

        // GUARDAR
        doc.save(`Reporte_Kueni_Kueni_${añoSeleccionado}_Profesional.pdf`);

        mostrarNotificacion('Reporte PDF profesional generado exitosamente', 'success');

    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarNotificacion('Error al generar PDF. Generando CSV alternativo...', 'error');
        setTimeout(() => exportarCSV(), 2000);
    }
}
function cambiarTab(tab) {
    console.log(`Cambiando a tab: ${tab}`);

    const chartCard = document.querySelector('.chart-card');
    const analysisCard = document.querySelector('.analysis-card');

    if (!chartCard || !analysisCard) return;

    switch (tab) {
        case 'donaciones':
            chartCard.querySelector('h3').textContent = 'Donaciones Mensuales';
            chartCard.querySelector('.chart-subtitle').textContent = 'Evolución de ingresos por donaciones (MXN)';
            analysisCard.querySelector('h3').textContent = 'Análisis de Donaciones';
            analysisCard.querySelector('.analysis-subtitle').textContent = 'Estadísticas detalladas del periodo';

            if (chartDonaciones) {
                const datos = obtenerDatosMensuales();
                chartDonaciones.data.datasets[0].data = datos;
                chartDonaciones.update();
            }

            mostrarAnalisisDonaciones();
            break;

        case 'socios':
            chartCard.querySelector('h3').textContent = 'Crecimiento de Socios';
            chartCard.querySelector('.chart-subtitle').textContent = 'Evolución de socios activos por mes';
            analysisCard.querySelector('h3').textContent = 'Análisis de Socios';
            analysisCard.querySelector('.analysis-subtitle').textContent = 'Estadísticas de participación';

            if (chartDonaciones) {
                const datos = obtenerSociosMensuales();
                chartDonaciones.data.datasets[0].data = datos;
                chartDonaciones.data.datasets[0].borderColor = '#15803d';
                chartDonaciones.data.datasets[0].pointBackgroundColor = '#15803d';
                chartDonaciones.update();
            }

            mostrarAnalisisSocios();
            break;

        case 'eventos':
            chartCard.querySelector('h3').textContent = 'Eventos por Mes';
            chartCard.querySelector('.chart-subtitle').textContent = 'Número de eventos realizados mensualmente';
            analysisCard.querySelector('h3').textContent = 'Análisis de Eventos';
            analysisCard.querySelector('.analysis-subtitle').textContent = 'Estadísticas de asistencia y ocupación';

            if (chartDonaciones) {
                const datos = obtenerEventosMensuales();
                chartDonaciones.data.datasets[0].data = datos;
                chartDonaciones.data.datasets[0].borderColor = '#1e40af';
                chartDonaciones.data.datasets[0].pointBackgroundColor = '#1e40af';
                chartDonaciones.update();
            }

            mostrarAnalisisEventos();
            break;

        case 'impacto':
            chartCard.querySelector('h3').textContent = 'Impacto Social';
            chartCard.querySelector('.chart-subtitle').textContent = 'Beneficiarios alcanzados por mes';
            analysisCard.querySelector('h3').textContent = 'Análisis de Impacto';
            analysisCard.querySelector('.analysis-subtitle').textContent = 'Alcance y resultados sociales';

            if (chartDonaciones) {
                const datos = obtenerImpactoMensual();
                chartDonaciones.data.datasets[0].data = datos;
                chartDonaciones.data.datasets[0].borderColor = '#7c3aed';
                chartDonaciones.data.datasets[0].pointBackgroundColor = '#7c3aed';
                chartDonaciones.update();
            }

            mostrarAnalisisImpacto();
            break;
    }
}

function obtenerSociosMensuales() {
    const meses = Array(12).fill(0);

    sociosGlobal.forEach(socio => {
        if (!socio.fecha_ingreso) return;
        const fecha = new Date(socio.fecha_ingreso);
        if (fecha.getFullYear() === añoSeleccionado) {
            const mes = fecha.getMonth();
            meses[mes]++;
        }
    });

    // Acumulativo
    for (let i = 1; i < 12; i++) {
        meses[i] += meses[i - 1];
    }

    return meses;
}

function obtenerEventosMensuales() {
    const meses = Array(12).fill(0);

    const eventosAño = eventosGlobal.filter(e => {
        const fecha = new Date(e.fecha_evento);
        return fecha.getFullYear() === añoSeleccionado && e.estado === 'completado';
    });

    eventosAño.forEach(evento => {
        const fecha = new Date(evento.fecha_evento);
        const mes = fecha.getMonth();
        meses[mes]++;
    });

    return meses;
}

function obtenerImpactoMensual() {
    const meses = Array(12).fill(0);

    const eventosAño = eventosGlobal.filter(e => {
        const fecha = new Date(e.fecha_evento);
        return fecha.getFullYear() === añoSeleccionado && e.estado === 'completado';
    });

    eventosAño.forEach(evento => {
        const fecha = new Date(evento.fecha_evento);
        const mes = fecha.getMonth();
        meses[mes] += evento.asistentes_confirmados || 0;
    });

    return meses;
}

function mostrarAnalisisDonaciones() {
    const donacionesAño = donacionesGlobal.filter(d => {
        const fecha = new Date(d.fecha_donacion);
        return fecha.getFullYear() === añoSeleccionado;
    });

    const donacionesCompletadas = donacionesAño.filter(d => d.estado_pago === 'completado');
    const totalRecaudado = donacionesCompletadas.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);
    const promedio = donacionesCompletadas.length > 0 ? totalRecaudado / donacionesCompletadas.length : 0;
    const maxDonacion = donacionesCompletadas.length > 0 ? Math.max(...donacionesCompletadas.map(d => parseFloat(d.monto))) : 0;
    const tasa = donacionesAño.length > 0 ? (donacionesCompletadas.length / donacionesAño.length) * 100 : 0;

    const items = document.querySelectorAll('.analysis-grid .analysis-item');

    items[0].querySelector('.analysis-label').textContent = 'Total Recaudado';
    items[0].querySelector('h4').textContent = '$' + Math.round(totalRecaudado).toLocaleString('es-MX');
    items[0].querySelector('.analysis-right').innerHTML = `Donaciones<span>${donacionesCompletadas.length}</span>`;

    items[1].querySelector('.analysis-label').textContent = 'Donación Promedio';
    items[1].querySelector('h4').textContent = '$' + Math.round(promedio).toLocaleString('es-MX');
    items[1].querySelector('.analysis-right').innerHTML = `Donación Máxima<span>$${Math.round(maxDonacion).toLocaleString('es-MX')}</span>`;

    items[2].querySelector('.analysis-label').textContent = 'Tasa de Completado';
    items[2].querySelector('h4').textContent = tasa.toFixed(1) + '%';
    items[2].querySelector('.analysis-right').innerHTML = `Crecimiento Anual<span>+${Math.abs(parseFloat(document.getElementById('cambioIngresos').textContent.match(/-?\d+\.?\d*/)[0])).toFixed(1)}%</span>`;
}

function mostrarAnalisisSocios() {
    const sociosActivos = sociosGlobal.filter(s => s.estado === 'activo');
    const sociosNuevosAño = sociosGlobal.filter(s => {
        if (!s.fecha_ingreso) return false;
        const fecha = new Date(s.fecha_ingreso);
        return fecha.getFullYear() === añoSeleccionado;
    });

    const eventosAsistidos = sociosActivos.reduce((sum, s) => sum + (s.total_eventos_asistidos || 0), 0);
    const promedioEventos = sociosActivos.length > 0 ? eventosAsistidos / sociosActivos.length : 0;

    const sociosConDonaciones = sociosActivos.filter(s => (s.total_donaciones || 0) > 0);
    const tasaContribucion = sociosActivos.length > 0 ? (sociosConDonaciones.length / sociosActivos.length) * 100 : 0;

    const items = document.querySelectorAll('.analysis-grid .analysis-item');

    items[0].querySelector('.analysis-label').textContent = 'Socios Activos';
    items[0].querySelector('h4').textContent = sociosActivos.length;
    items[0].querySelector('.analysis-right').innerHTML = `Nuevos en ${añoSeleccionado}<span>${sociosNuevosAño.length}</span>`;

    items[1].querySelector('.analysis-label').textContent = 'Promedio de Participación';
    items[1].querySelector('h4').textContent = promedioEventos.toFixed(1) + ' eventos';
    items[1].querySelector('.analysis-right').innerHTML = `Eventos Totales<span>${eventosAsistidos}</span>`;

    items[2].querySelector('.analysis-label').textContent = 'Tasa de Contribución';
    items[2].querySelector('h4').textContent = tasaContribucion.toFixed(1) + '%';
    items[2].querySelector('.analysis-right').innerHTML = `Socios Donantes<span>${sociosConDonaciones.length}</span>`;
}

function mostrarAnalisisEventos() {
    const eventosAño = eventosGlobal.filter(e => {
        const fecha = new Date(e.fecha_evento);
        return fecha.getFullYear() === añoSeleccionado;
    });

    const eventosCompletados = eventosAño.filter(e => e.estado === 'completado');
    const totalAsistentes = eventosCompletados.reduce((sum, e) => sum + (e.asistentes_confirmados || 0), 0);
    const totalCupo = eventosCompletados.reduce((sum, e) => sum + (e.cupo_maximo || 0), 0);
    const promedioAsistentes = eventosCompletados.length > 0 ? totalAsistentes / eventosCompletados.length : 0;
    const ocupacionPromedio = totalCupo > 0 ? (totalAsistentes / totalCupo) * 100 : 0;

    // Por categoría
    const categorias = {};
    eventosCompletados.forEach(e => {
        categorias[e.categoria] = (categorias[e.categoria] || 0) + 1;
    });
    const categoriaMasActiva = Object.keys(categorias).reduce((a, b) => categorias[a] > categorias[b] ? a : b, '');

    const items = document.querySelectorAll('.analysis-grid .analysis-item');

    items[0].querySelector('.analysis-label').textContent = 'Eventos Realizados';
    items[0].querySelector('h4').textContent = eventosCompletados.length;
    items[0].querySelector('.analysis-right').innerHTML = `Total Asistentes<span>${totalAsistentes}</span>`;

    items[1].querySelector('.analysis-label').textContent = 'Asistencia Promedio';
    items[1].querySelector('h4').textContent = Math.round(promedioAsistentes) + ' personas';
    items[1].querySelector('.analysis-right').innerHTML = `Ocupación<span>${ocupacionPromedio.toFixed(1)}%</span>`;

    items[2].querySelector('.analysis-label').textContent = 'Categoría Más Activa';
    items[2].querySelector('h4').textContent = categoriaMasActiva || 'N/A';
    items[2].querySelector('.analysis-right').innerHTML = `Eventos<span>${categorias[categoriaMasActiva] || 0}</span>`;
}

function mostrarAnalisisImpacto() {
    const eventosAño = eventosGlobal.filter(e => {
        const fecha = new Date(e.fecha_evento);
        return fecha.getFullYear() === añoSeleccionado && e.estado === 'completado';
    });

    const beneficiariosDirectos = eventosAño.reduce((sum, e) => sum + (e.asistentes_confirmados || 0), 0);

    const sociosActivos = sociosGlobal.filter(s => s.estado === 'activo');
    const eventosAsistidos = sociosActivos.reduce((sum, s) => sum + (s.total_eventos_asistidos || 0), 0);

    const donacionesAño = donacionesGlobal.filter(d => {
        const fecha = new Date(d.fecha_donacion);
        return fecha.getFullYear() === añoSeleccionado && d.estado_pago === 'completado';
    });
    const totalRecaudado = donacionesAño.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);

    const items = document.querySelectorAll('.analysis-grid .analysis-item');

    items[0].querySelector('.analysis-label').textContent = 'Beneficiarios Directos';
    items[0].querySelector('h4').textContent = beneficiariosDirectos;
    items[0].querySelector('.analysis-right').innerHTML = `Eventos<span>${eventosAño.length}</span>`;

    items[1].querySelector('.analysis-label').textContent = 'Horas de Participación';
    items[1].querySelector('h4').textContent = (eventosAsistidos * 2).toLocaleString('es-MX') + ' horas';
    items[1].querySelector('.analysis-right').innerHTML = `Asistencias<span>${eventosAsistidos}</span>`;

    items[2].querySelector('.analysis-label').textContent = 'Recursos Movilizados';
    items[2].querySelector('h4').textContent = '$' + Math.round(totalRecaudado).toLocaleString('es-MX');
    items[2].querySelector('.analysis-right').innerHTML = `Donantes<span>${donacionesAño.length}</span>`;
}

function mostrarLoader(mostrar) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = mostrar ? 'flex' : 'none';
    }
}

function mostrarNotificacion(mensaje, tipo) {
    const notif = document.createElement('div');
    notif.textContent = mensaje;

    const colores = {
        success: { bg: '#d1fae5', text: '#065f46' },
        info: { bg: '#dbeafe', text: '#1e40af' },
        error: { bg: '#fee2e2', text: '#dc2626' }
    };

    const color = colores[tipo] || colores.info;

    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${color.bg};
        color: ${color.text};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
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
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('Sistema de estadísticas cargado');