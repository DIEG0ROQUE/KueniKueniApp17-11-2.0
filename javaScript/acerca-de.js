let config = {};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.supabaseClient) {
            cargarDatos();
        } else {
            setTimeout(() => window.supabaseClient && cargarDatos(), 1000);
        }
    }, 300);
});

async function cargarDatos() {
    try {
        await cargarConfiguracion();
        await cargarEstadisticas();
        actualizarUI();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cargarConfiguracion() {
    const { data, error } = await window.supabaseClient
        .from('configuracion')
        .select('*');

    if (error) throw error;

    if (data) {
        data.forEach(item => {
            config[item.clave] = item.valor;
        });
    }
}

async function cargarEstadisticas() {
    const { data: socios } = await window.supabaseClient
        .from('socios')
        .select('id')
        .eq('estado', 'activo');

    config.socios_real = socios ? socios.length : 0;

    const { data: eventos } = await window.supabaseClient
        .from('eventos')
        .select('id, estado');

    config.eventos_total = eventos ? eventos.length : 0;
    config.eventos_completados = eventos ? eventos.filter(e => e.estado === 'completado').length : 0;

    const { data: asistencias } = await window.supabaseClient
        .from('asistencias')
        .select('id')
        .eq('estado_asistencia', 'asistio');

    config.asistencias_total = asistencias ? asistencias.length : 0;
}

function actualizarUI() {
    const nombre = config.nombre_organizacion || 'Kueni Kueni';
    const anos = config.anos_experiencia || '11';

    document.getElementById('org-nombre-header').textContent = nombre;
    document.getElementById('org-nombre-hero').textContent = nombre;
    document.getElementById('org-nombre-desc').textContent = nombre + ' - Paso a Paso';

    document.getElementById('org-descripcion').textContent =
        'Somos una asociación civil sin fines de lucro con más de ' + anos + ' años de experiencia trabajando en la región Mixteca de Oaxaca. Nuestro nombre refleja nuestra filosofía de trabajo: construir comunidad de manera gradual, sostenible y con la participación activa de todos los miembros.';

    document.getElementById('org-mision').textContent =
        'Promover el bienestar social y el desarrollo integral de las comunidades de la región Mixteca a través de programas de medio ambiente, deporte, cultura y emprendimiento, con especial énfasis en grupos vulnerables como mujeres y adultos mayores.';

    document.getElementById('org-vision').textContent =
        'Ser una organización líder en el desarrollo comunitario de la región Mixteca, reconocida por su impacto social positivo, transparencia en la gestión de recursos y capacidad de generar cambios sostenibles en la calidad de vida de las personas.';

    document.getElementById('hero-descripcion').textContent =
        'Conoce nuestra historia, misión y el impacto que generamos en la región';

    const beneficiarios = config.asistencias_total > 0 ? config.asistencias_total : (config.beneficiarios_directos || 500);
    const eventos = config.eventos_total > 0 ? config.eventos_total : (config.eventos_realizados || 50);
    const socios = config.socios_real > 0 ? config.socios_real : (config.socios_activos || 30);

    document.getElementById('stat-beneficiarios').textContent = beneficiarios + '+';
    document.getElementById('stat-eventos').textContent = eventos + '+';
    document.getElementById('stat-socios').textContent = socios + '+';
    document.getElementById('stat-anos').textContent = anos + '+';
    document.getElementById('anos-exp-sub').textContent = anos;

    const direccion = (config.direccion || 'Abasolo 27, Barrio las Flores, Asunción Nochixtlán, Oaxaca, México').replace(/,\s*/g, '<br>');
    document.getElementById('contact-direccion').innerHTML = direccion;
    document.getElementById('contact-email').textContent = config.email || 'contacto@kuenikueni.org';
    document.getElementById('contact-telefono').textContent = config.telefono || '+52 951 123 4567';

    document.getElementById('footer-nombre').textContent = nombre;
    document.getElementById('footer-nombre-copy').textContent = nombre;
    document.getElementById('footer-descripcion').textContent = 'Asociación Civil sin fines de lucro';
    document.getElementById('footer-direccion').innerHTML = direccion;
    document.getElementById('footer-email-extra').textContent = config.email || 'contacto@kuenikueni.org';
    document.getElementById('footer-telefono-extra').textContent = config.telefono || '+52 951 123 4567';
    document.getElementById('year').textContent = new Date().getFullYear();
}