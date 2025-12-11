// socio-acerca.js - VERSIÓN CORREGIDA PARA EL NUEVO HTML
// ============================================================================

let config = {};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎯 Inicializando página Acerca de...');
    
    if (!verificarSesion()) {
        console.log('No hay sesión válida. Redirigiendo...');
        window.location.href = 'login.html';
        return;
    }
    
    // Esperar a que Supabase esté listo
    setTimeout(() => {
        if (window.supabaseClient) {
            cargarDatos();
        } else {
            setTimeout(() => window.supabaseClient && cargarDatos(), 1000);
        }
    }, 300);
    
    configurarEventListeners();
});

// ============================================================================
// VERIFICACIÓN DE SESIÓN
// ============================================================================

function verificarSesion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    return (isLoggedIn === 'true' && userType === 'socio');
}

// ============================================================================
// CARGAR DATOS COMPLETOS
// ============================================================================

async function cargarDatos() {
    try {
        console.log('📊 Cargando datos...');
        
        await cargarConfiguracion();
        await cargarEstadisticas();
        actualizarUI();
        
        console.log('✅ Datos cargados correctamente');
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        usarDatosPorDefecto();
    }
}

// ============================================================================
// CARGAR CONFIGURACIÓN (TABLA: configuracion)
// ============================================================================

async function cargarConfiguracion() {
    const { data, error } = await window.supabaseClient
        .from('configuracion')
        .select('*');

    if (error) {
        console.error('Error al cargar configuración:', error);
        return;
    }

    if (data) {
        data.forEach(item => {
            config[item.clave] = item.valor;
        });
        console.log('✅ Configuración cargada:', config);
    }
}

// ============================================================================
// CARGAR ESTADÍSTICAS DINÁMICAS
// ============================================================================

async function cargarEstadisticas() {
    // Contar socios activos
    const { data: socios } = await window.supabaseClient
        .from('socios')
        .select('id')
        .eq('estatus', 'activo');

    config.socios_real = socios ? socios.length : 0;

    // Contar eventos totales y completados
    const { data: eventos } = await window.supabaseClient
        .from('eventos')
        .select('id, estado');

    config.eventos_total = eventos ? eventos.length : 0;
    config.eventos_completados = eventos ? eventos.filter(e => e.estado === 'completado').length : 0;

    // Contar asistencias confirmadas
    const { data: asistencias } = await window.supabaseClient
        .from('asistencias')
        .select('socio_id')
        .eq('estado_asistencia', 'confirmado');

    // Beneficiarios únicos
    const beneficiariosUnicos = asistencias ? new Set(asistencias.map(a => a.socio_id)).size : 0;
    config.beneficiarios_real = beneficiariosUnicos;

    console.log('✅ Estadísticas:', {
        socios: config.socios_real,
        eventos: config.eventos_total,
        beneficiarios: config.beneficiarios_real
    });
}

// ============================================================================
// ACTUALIZAR UI CON DATOS - VERSIÓN PARA EL NUEVO HTML
// ============================================================================

function actualizarUI() {
    // Obtener valores con fallback
    const nombre = config.nombre_organizacion || 'Kueni Kueni';
    const anos = config.anos_experiencia || '11';
    const beneficiarios = config.beneficiarios_real > 0 ? config.beneficiarios_real : (config.beneficiarios_directos || 500);
    const eventos = config.eventos_total > 0 ? config.eventos_total : (config.eventos_realizados || 50);
    const socios = config.socios_real > 0 ? config.socios_real : (config.socios_activos || 30);
    
    // Actualizar elementos por ID (nuevo HTML)
    const orgNombreHero = document.getElementById('org-nombre-hero');
    if (orgNombreHero) {
        orgNombreHero.textContent = nombre;
    }
    
    const orgNombreDesc = document.getElementById('org-nombre-desc');
    if (orgNombreDesc) {
        orgNombreDesc.textContent = nombre + ' - Paso a Paso';
    }
    
    const orgDescripcion = document.getElementById('org-descripcion');
    if (orgDescripcion) {
        orgDescripcion.textContent = `Somos una asociación civil sin fines de lucro con más de ${anos} años de experiencia trabajando en la región Mixteca de Oaxaca. Nuestro nombre refleja nuestra filosofía de trabajo: construir comunidad de manera gradual, sostenible y con la participación activa de todos los miembros.`;
    }
    
    const heroDescripcion = document.getElementById('hero-descripcion');
    if (heroDescripcion) {
        heroDescripcion.textContent = 'Conoce nuestra historia, misión y el impacto que generamos en la región Mixteca de Oaxaca';
    }
    
    const orgMision = document.getElementById('org-mision');
    if (orgMision) {
        orgMision.textContent = config.mision || 'Promover el bienestar social y el desarrollo integral de las comunidades de la región Mixteca a través de programas de medio ambiente, deporte, cultura y emprendimiento, con especial énfasis en grupos vulnerables como mujeres y adultos mayores.';
    }
    
    const orgVision = document.getElementById('org-vision');
    if (orgVision) {
        orgVision.textContent = config.vision || 'Ser una organización líder en el desarrollo comunitario de la región Mixteca, reconocida por su impacto social positivo, transparencia en la gestión de recursos y capacidad de generar cambios sostenibles en la calidad de vida de las personas.';
    }
    
    // Actualizar estadísticas con animación
    const statBeneficiarios = document.getElementById('stat-beneficiarios');
    if (statBeneficiarios) {
        animarNumero(statBeneficiarios, beneficiarios, `${beneficiarios}+`);
    }
    
    const statEventos = document.getElementById('stat-eventos');
    if (statEventos) {
        animarNumero(statEventos, eventos, `${eventos}+`);
    }
    
    const statSocios = document.getElementById('stat-socios');
    if (statSocios) {
        animarNumero(statSocios, socios, `${socios}+`);
    }
    
    const statAnos = document.getElementById('stat-anos');
    if (statAnos) {
        animarNumero(statAnos, parseInt(anos), `${anos}+`);
    }
    
    const anosExpSub = document.getElementById('anos-exp-sub');
    if (anosExpSub) {
        anosExpSub.textContent = anos;
    }
    
    // Actualizar información de contacto
    const direccion = (config.direccion || 'Abasolo 27, Barrio las Flores, Asunción Nochixtlán, Oaxaca, México');
    
    const contactDireccion = document.getElementById('contact-direccion');
    if (contactDireccion) {
        contactDireccion.innerHTML = direccion.replace(/,\s*/g, '<br>');
    }
    
    const contactEmail = document.getElementById('contact-email');
    if (contactEmail) {
        contactEmail.textContent = config.email || 'contacto@kuenikueni.org';
    }
    
    const contactTelefono = document.getElementById('contact-telefono');
    if (contactTelefono) {
        contactTelefono.textContent = config.telefono || '+52 951 123 4567';
    }
    
    console.log('✅ UI actualizada correctamente');
}

// ============================================================================
// USAR DATOS POR DEFECTO SI FALLA LA CARGA
// ============================================================================

function usarDatosPorDefecto() {
    console.log('⚠️ Usando datos por defecto');
    
    config.nombre_organizacion = 'Kueni Kueni';
    config.anos_experiencia = '11';
    config.beneficiarios_directos = 500;
    config.eventos_realizados = 50;
    config.socios_activos = 30;
    config.direccion = 'Abasolo 27, Barrio las Flores, Asunción Nochixtlán, Oaxaca, México';
    config.email = 'contacto@kuenikueni.org';
    config.telefono = '+52 951 123 4567';
    config.mision = 'Promover el bienestar social y el desarrollo integral de las comunidades de la región Mixteca a través de programas de medio ambiente, deporte, cultura y emprendimiento, con especial énfasis en grupos vulnerables como mujeres y adultos mayores.';
    config.vision = 'Ser una organización líder en el desarrollo comunitario de la región Mixteca, reconocida por su impacto social positivo, transparencia en la gestión de recursos y capacidad de generar cambios sostenibles en la calidad de vida de las personas.';
    
    actualizarUI();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function configurarEventListeners() {
    // Animaciones al hacer scroll
    const elementos = document.querySelectorAll('.description-card, .card, .area-card, .impact, .contact');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    elementos.forEach(elem => {
        elem.style.opacity = '0';
        elem.style.transform = 'translateY(20px)';
        elem.style.transition = 'all 0.6s ease';
        observer.observe(elem);
    });
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function animarNumero(elemento, valorFinal, textoFinal) {
    let valorActual = 0;
    const duracion = 2000;
    const pasos = 50;
    const incremento = valorFinal / pasos;
    const intervalo = duracion / pasos;
    
    const timer = setInterval(() => {
        valorActual += incremento;
        if (valorActual >= valorFinal) {
            elemento.textContent = textoFinal;
            clearInterval(timer);
        } else {
            elemento.textContent = Math.floor(valorActual);
        }
    }, intervalo);
}

function mostrarMensaje(mensaje, tipo) {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${tipo === 'error' ? '#fee2e2' : '#d1fae5'};
        color: ${tipo === 'error' ? '#dc2626' : '#065f46'};
        border: 1px solid ${tipo === 'error' ? '#fecaca' : '#a7f3d0'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    div.textContent = mensaje;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// ============================================================================
// ESTILOS ADICIONALES
// ============================================================================

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
    
    .stat-number {
        transition: transform 0.3s ease;
    }
    
    .stat-card:hover .stat-number {
        transform: scale(1.15);
        color: #5f0d51;
    }
    
    .area-card {
        transition: all 0.3s ease;
    }
    
    .area-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(95, 13, 81, 0.15);
        border-color: #5f0d51;
    }
    
    .card {
        transition: all 0.3s ease;
    }
    
    .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(95, 13, 81, 0.15);
        border-color: #5f0d51;
    }
    
    .description-card {
        transition: all 0.3s ease;
    }
    
    .description-card:hover {
        box-shadow: 0 8px 20px rgba(95, 13, 81, 0.1);
    }
    
    .contact-item {
        transition: all 0.3s ease;
    }
    
    .contact-item:hover .contact-icon {
        transform: scale(1.1);
        background: #f4e4f0;
    }
`;
document.head.appendChild(style);

console.log('🎨 Script de Acerca de cargado correctamente');