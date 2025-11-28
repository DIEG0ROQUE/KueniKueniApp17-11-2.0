

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard inicializado');
    
    verificarAutenticacion();
    
    setTimeout(() => {
        if (window.supabaseClient) {
            console.log('Supabase conectado');
            cargarDatos();
        } else {
            console.error('Supabase no está disponible');
            setTimeout(() => cargarDatos(), 1000);
        }
    }, 500);
    
    // Event listeners
    document.getElementById('btnCerrarSesion')?.addEventListener('click', cerrarSesion);
    document.getElementById('btnCrearEvento')?.addEventListener('click', irAEventos);
});

function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (!isLoggedIn || userType !== 'admin') {
        console.log('Acceso no autorizado');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('✅ Usuario autenticado como admin');
}

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        console.log('Cerrando sesión...');
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

function irAEventos() {
    window.location.href = 'admin-eventos.html';
}

async function cargarDatos() {
    if (!window.supabaseClient) {
        console.error('Supabase no inicializado');
        document.getElementById('donacionesRecientes').innerHTML = 
            '<div class="empty-message">Error: Supabase no está conectado</div>';
        document.getElementById('proximosEventos').innerHTML = 
            '<div class="empty-message">Error: Supabase no está conectado</div>';
        return;
    }
    
    try {
        console.log('Cargando datos del dashboard...');
        
        await Promise.all([
            cargarEstadisticas(),
            cargarDonacionesRecientes(),
            cargarProximosEventos()
        ]);
        
        console.log('Todos los datos cargados correctamente');
        
    } catch (error) {
        console.error('Error general al cargar datos:', error);
        mostrarError('Error al cargar datos del dashboard');
    }
}

async function cargarEstadisticas() {
    try {
        console.log('Cargando estadísticas...');
        
        // 1. Eventos Próximos (solo activos y futuros)
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        const hoyISO = `${year}-${month}-${day}`;
        
        console.log('Buscando eventos activos desde:', hoyISO);
        
        const { data: eventosProximos, error: errorEventos } = await window.supabaseClient
            .from('eventos')
            .select('id')
            .eq('estado', 'proximo')
            .gte('fecha_evento', hoyISO);
        
        if (errorEventos) {
            console.error('Error en eventos:', errorEventos);
            throw errorEventos;
        }
        
        console.log('Eventos activos próximos encontrados:', eventosProximos);
        const totalEventosProximos = eventosProximos ? eventosProximos.length : 0;
        document.getElementById('eventosProximos').textContent = totalEventosProximos;
        console.log(`Total eventos próximos: ${totalEventosProximos}`);
        
        // 2. Donaciones Totales (este mes) - ADAPTADO A TU TABLA
        const primerDiaMes = new Date();
        primerDiaMes.setDate(1);
        primerDiaMes.setHours(0, 0, 0, 0);
        
        console.log('Buscando donaciones desde:', primerDiaMes.toISOString());
        
        const { data: donaciones, error: errorDonaciones } = await window.supabaseClient
            .from('donaciones')
            .select('monto')
            .gte('fecha_donacion', primerDiaMes.toISOString());
        
        if (errorDonaciones) {
            console.error('Error en donaciones:', errorDonaciones);
            throw errorDonaciones;
        }
        
        console.log('Donaciones encontradas:', donaciones);
        const totalDonaciones = donaciones ? donaciones.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0) : 0;
        document.getElementById('donacionesTotales').textContent = '$' + Math.round(totalDonaciones).toLocaleString('es-MX');
        
        // 3. Socios Activos
        const { data: socios, error: errorSocios } = await window.supabaseClient
            .from('socios')
            .select('id')
            .eq('estado', 'activo');
        
        if (errorSocios) {
            console.error('Error en socios:', errorSocios);
            throw errorSocios;
        }
        
        console.log('Socios encontrados:', socios);
        document.getElementById('sociosActivos').textContent = socios ? socios.length : 0;
        
        // 4. Crecimiento
        const mesAnterior = new Date();
        mesAnterior.setMonth(mesAnterior.getMonth() - 1);
        mesAnterior.setDate(1);
        mesAnterior.setHours(0, 0, 0, 0);
        
        const ultimoDiaMesAnterior = new Date(primerDiaMes);
        ultimoDiaMesAnterior.setDate(0);
        ultimoDiaMesAnterior.setHours(23, 59, 59, 999);
        
        const { data: donacionesMesAnterior } = await window.supabaseClient
            .from('donaciones')
            .select('monto')
            .gte('fecha_donacion', mesAnterior.toISOString())
            .lte('fecha_donacion', ultimoDiaMesAnterior.toISOString());
        
        const totalMesAnterior = donacionesMesAnterior 
            ? donacionesMesAnterior.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0)
            : 0;
        
        let crecimiento = 0;
        if (totalMesAnterior > 0) {
            crecimiento = Math.round(((totalDonaciones - totalMesAnterior) / totalMesAnterior) * 100);
        } else if (totalDonaciones > 0) {
            crecimiento = 100;
        }
        
        const signo = crecimiento >= 0 ? '+' : '';
        document.getElementById('crecimiento').textContent = signo + crecimiento + '%';
        
        console.log('Estadísticas cargadas correctamente');
        
    } catch (error) {
        console.error('Error en estadísticas:', error);
    }
}

async function cargarDonacionesRecientes() {
    try {
        console.log('Cargando donaciones del día actual...');
        
        // OBTENER RANGO DEL DÍA ACTUAL
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        
        const inicioDia = `${year}-${month}-${day} 00:00:00`;
        const finDia = `${year}-${month}-${day} 23:59:59`;
        
        console.log('Buscando donaciones de hoy:', inicioDia, 'a', finDia);
        
        // CONSULTA ADAPTADA A TU TABLA REAL
        const { data: donaciones, error } = await window.supabaseClient
            .from('donaciones')
            .select('*')
            .gte('fecha_donacion', inicioDia)
            .lte('fecha_donacion', finDia)
            .order('fecha_donacion', { ascending: false })
            .limit(5);
        
        if (error) {
            console.error('Error al cargar donaciones:', error);
            throw error;
        }
        
        console.log('Donaciones del día encontradas:', donaciones);
        
        const container = document.getElementById('donacionesRecientes');
        
        if (!donaciones || donaciones.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay donaciones registradas hoy</div>';
            return;
        }
        
        // USAR COLUMNAS CORRECTAS: donante_nombre, descripcion
        container.innerHTML = donaciones.map(donacion => {
            const fecha = new Date(donacion.fecha_donacion);
            const fechaFormateada = fecha.toLocaleDateString('es-MX', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            });
            
            const hora = fecha.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const nombre = donacion.donante_nombre || 'Anónimo';
            const concepto = donacion.descripcion || 'Apoyo general';
            
            return `
                <div class="donacion-item">
                    <div class="donacion-info">
                        <h3>${nombre}</h3>
                        <p>${concepto}</p>
                    </div>
                    <div class="donacion-detalles">
                        <div class="donacion-monto">$${Math.round(donacion.monto).toLocaleString('es-MX')}</div>
                        <div class="donacion-fecha">${hora}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`${donaciones.length} donaciones de hoy mostradas`);
        
    } catch (error) {
        console.error('Error al cargar donaciones:', error);
        document.getElementById('donacionesRecientes').innerHTML = 
            '<div class="empty-message">Error al cargar donaciones</div>';
    }
}

async function cargarProximosEventos() {
    try {
        console.log('Cargando próximos eventos...');
        
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        const hoyISO = `${year}-${month}-${day}`;
        
        console.log('Fecha actual (corregida):', hoyISO);
        
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('estado', 'proximo')
            .gte('fecha_evento', hoyISO)
            .order('fecha_evento', { ascending: true })
            .order('hora_evento', { ascending: true });
        
        if (error) {
            console.error('Error al cargar eventos:', error);
            throw error;
        }
        
        console.log('Eventos activos próximos:', eventos);
        
        const container = document.getElementById('proximosEventos');
        
        if (!eventos || eventos.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay eventos próximos activos</div>';
            return;
        }
        
        container.innerHTML = eventos.map(evento => {
            const fechaString = evento.fecha_evento.includes('T') 
                ? evento.fecha_evento 
                : evento.fecha_evento + 'T00:00:00';
            
            const fecha = new Date(fechaString);
            
            const fechaFormateada = fecha.toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'short',
                year: 'numeric',
                timeZone: 'America/Mexico_City'
            });
            
            const hora = evento.hora_evento ? evento.hora_evento.substring(0, 5) : '00:00';
            const asistentes = evento.asistentes_confirmados || 0;
            const cupo = evento.cupo_maximo || 0;
            
            const categoriaColors = {
                'Educación': { bg: '#dbeafe', text: '#1e40af' },
                'Salud': { bg: '#fee2e2', text: '#991b1b' },
                'Medio Ambiente': { bg: '#d1fae5', text: '#065f46' },
                'Cultura': { bg: '#e9d5ff', text: '#6b21a8' },
                'Deporte': { bg: '#fef3c7', text: '#92400e' },
                'Otro': { bg: '#f3f4f6', text: '#374151' }
            };
            
            const colores = categoriaColors[evento.categoria] || categoriaColors['Otro'];
            
            return `
                <div class="evento-item">
                    <span class="evento-categoria" style="background: ${colores.bg}; color: ${colores.text};">
                        ${evento.categoria || 'Sin categoría'}
                    </span>
                    <h3 class="evento-titulo">${evento.titulo}</h3>
                    <p class="evento-descripcion">${evento.descripcion || 'Sin descripción'}</p>
                    <div class="evento-detalles">
                        <span class="evento-detalle">${fechaFormateada}</span>
                        <span class="evento-detalle">${hora}</span>
                        <span class="evento-detalle">${asistentes}/${cupo}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`${eventos.length} eventos próximos activos mostrados`);
        
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        document.getElementById('proximosEventos').innerHTML = 
            '<div class="empty-message">Error al cargar eventos</div>';
    }
}

function mostrarError(mensaje) {
    console.error('Error:', mensaje);
}

console.log('Dashboard con donaciones del día actual cargado');