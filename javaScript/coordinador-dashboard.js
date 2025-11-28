// coordinador-dashboard.js - Lógica similar al admin
console.log('Dashboard Coordinador inicializado');

document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacion();
    
    setTimeout(() => {
        if (window.supabaseClient) {
            console.log('Supabase conectado');
            cargarDatos();
        } else {
            console.error('Supabase no disponible');
            setTimeout(() => cargarDatos(), 1000);
        }
    }, 500);
    
    // Event listeners
    document.getElementById('btnCerrarSesion')?.addEventListener('click', cerrarSesion);
});

function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (!isLoggedIn || userType !== 'coordinador') {
        console.log('Acceso no autorizado');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('Usuario autenticado como coordinador');
}

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        console.log('Cerrando sesión...');
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

async function cargarDatos() {
    if (!window.supabaseClient) {
        console.error('Supabase no inicializado');
        return;
    }
    
    try {
        console.log('Cargando datos del dashboard...');
        
        await Promise.all([
            cargarEstadisticas(),
            cargarProximosEventos(),
            cargarNoticiasRecientes()
        ]);
        
        console.log('Todos los datos cargados correctamente');
        
    } catch (error) {
        console.error('Error general al cargar datos:', error);
    }
}

async function cargarEstadisticas() {
    try {
        console.log('Cargando estadísticas...');
        
        // Fecha de hoy
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        const hoyISO = `${year}-${month}-${day}`;
        
        console.log('Fecha actual:', hoyISO);
        
        // 1. Eventos Próximos (futuros y activos)
        const { data: eventosProx, error: errorProx } = await window.supabaseClient
            .from('eventos')
            .select('id')
            .eq('estado', 'proximo')
            .gte('fecha_evento', hoyISO);
        
        if (errorProx) {
            console.error('Error en eventos próximos:', errorProx);
        } else {
            const total = eventosProx ? eventosProx.length : 0;
            document.getElementById('eventosProximos').textContent = total;
            console.log(`Eventos próximos: ${total}`);
        }
        
        // 2. Eventos Activos Hoy
        const { data: eventosAct, error: errorAct } = await window.supabaseClient
            .from('eventos')
            .select('id')
            .eq('estado', 'activo')
            .eq('fecha_evento', hoyISO);
        
        if (errorAct) {
            console.error('Error en eventos activos:', errorAct);
        } else {
            const total = eventosAct ? eventosAct.length : 0;
            document.getElementById('eventosActivos').textContent = total;
            console.log(`Eventos activos hoy: ${total}`);
        }
        
        // 3. Asistencias Registradas Hoy
        const hoyInicio = new Date();
        hoyInicio.setHours(0, 0, 0, 0);
        
        const { data: asistencias, error: errorAsist } = await window.supabaseClient
            .from('asistencias_eventos')
            .select('id')
            .gte('fecha_registro', hoyInicio.toISOString());
        
        if (errorAsist) {
            console.error('Error en asistencias:', errorAsist);
        } else {
            const total = asistencias ? asistencias.length : 0;
            document.getElementById('asistenciasHoy').textContent = total;
            console.log(`Asistencias hoy: ${total}`);
        }
        
        // 4. Noticias Publicadas
        const { data: noticias, error: errorNot } = await window.supabaseClient
            .from('noticias')
            .select('id')
            .eq('estado', 'publicado');
        
        if (errorNot) {
            console.error('Error en noticias:', errorNot);
        } else {
            const total = noticias ? noticias.length : 0;
            document.getElementById('noticiasPublicadas').textContent = total;
            console.log(`Noticias publicadas: ${total}`);
        }
        
        console.log('Estadísticas cargadas correctamente');
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
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
        
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('estado', 'proximo')
            .gte('fecha_evento', hoyISO)
            .order('fecha_evento', { ascending: true })
            .order('hora_evento', { ascending: true })
            .limit(3);
        
        if (error) {
            console.error('Error al cargar eventos:', error);
            throw error;
        }
        
        console.log('Eventos cargados:', eventos);
        
        const container = document.getElementById('proximosEventos');
        
        if (!eventos || eventos.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay eventos próximos</div>';
            return;
        }
        
        container.innerHTML = eventos.map(evento => {
            // Formatear fecha sin problemas de zona horaria
            const [year, month, day] = evento.fecha_evento.split('-');
            const fecha = new Date(year, month - 1, day);
            
            const fechaFormateada = fecha.toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'short',
                year: 'numeric'
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
        
        console.log(`${eventos.length} eventos próximos mostrados`);
        
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        document.getElementById('proximosEventos').innerHTML = 
            '<div class="empty-message">Error al cargar eventos</div>';
    }
}

async function cargarNoticiasRecientes() {
    try {
        console.log('Cargando noticias recientes...');
        
        const { data: noticias, error } = await window.supabaseClient
            .from('noticias')
            .select('*')
            .eq('estado', 'publicado')
            .order('fecha_publicacion', { ascending: false })
            .limit(3);
        
        if (error) {
            console.error('Error al cargar noticias:', error);
            throw error;
        }
        
        console.log('Noticias cargadas:', noticias);
        
        const container = document.getElementById('noticiasRecientes');
        
        if (!noticias || noticias.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay noticias publicadas</div>';
            return;
        }
        
        container.innerHTML = noticias.map(noticia => {
            const categoriaBadge = obtenerCategoriaBadge(noticia.categoria);
            
            return `
                <div class="noticia-item">
                    <span class="noticia-categoria ${categoriaBadge.clase}">${categoriaBadge.texto}</span>
                    <h3 class="noticia-titulo">${noticia.titulo}</h3>
                    <p class="noticia-descripcion">${truncarTexto(noticia.contenido, 80)}</p>
                    <div class="noticia-detalles">
                        <span class="noticia-detalle">${formatearFecha(noticia.fecha_publicacion)}</span>
                        <span class="noticia-detalle">${noticia.vistas || 0}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`${noticias.length} noticias mostradas`);
        
    } catch (error) {
        console.error('Error al cargar noticias:', error);
        document.getElementById('noticiasRecientes').innerHTML = 
            '<div class="empty-message">Error al cargar noticias</div>';
    }
}

function obtenerCategoriaBadge(categoria) {
    const badges = {
        'Medio Ambiente': { clase: 'cat-ambiente', texto: 'Medio Ambiente' },
        'Deportes': { clase: 'cat-deportes', texto: 'Deportes' },
        'Cultura': { clase: 'cat-cultura', texto: 'Cultura' },
        'Emprendimiento': { clase: 'cat-emprendimiento', texto: 'Emprendimiento' },
        'General': { clase: 'cat-general', texto: 'General' }
    };
    return badges[categoria] || { clase: 'cat-general', texto: '📌 ' + categoria };
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const [year, month, day] = fecha.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function truncarTexto(texto, max) {
    if (!texto) return '';
    if (texto.length <= max) return texto;
    return texto.substring(0, max) + '...';
}

console.log('Dashboard Coordinador cargado correctamente');