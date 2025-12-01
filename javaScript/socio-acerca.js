// socio-acerca.js - CORREGIDO basado en acerca-de.js
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
// ACTUALIZAR UI CON DATOS
// ============================================================================

function actualizarUI() {
    // Obtener valores con fallback
    const nombre = config.nombre_organizacion || 'Kueni Kueni';
    const anos = config.anos_experiencia || '11';
    const beneficiarios = config.beneficiarios_real > 0 ? config.beneficiarios_real : (config.beneficiarios_directos || 500);
    const eventos = config.eventos_total > 0 ? config.eventos_total : (config.eventos_realizados || 50);
    const socios = config.socios_real > 0 ? config.socios_real : (config.socios_activos || 30);
    
    // Actualizar título principal
    const tituloElement = document.querySelector('.acerca-title');
    if (tituloElement) {
        tituloElement.textContent = nombre + ' - Paso a Paso';
    }
    
    // Actualizar descripción principal
    const descripcionElement = document.querySelector('.acerca-subtitle');
    if (descripcionElement) {
        descripcionElement.textContent = `Somos una asociación civil sin fines de lucro con más de ${anos} años de experiencia trabajando en la región Mixteca de Oaxaca. Nuestro nombre, que significa "paso a paso" en lengua mixteca, refleja nuestra filosofía de trabajo: construir comunidad de manera gradual, sostenible y con la participación activa de todos los miembros.`;
    }
    
    // Actualizar misión
    const misionElement = document.querySelector('.mv-card:first-child .mv-text');
    if (misionElement) {
        misionElement.textContent = config.mision || 'Promover el bienestar social y el desarrollo integral de las comunidades de la región Mixteca a través de programas de medio ambiente, deporte, cultura y emprendimiento, con especial énfasis en grupos vulnerables como mujeres y adultos mayores.';
    }
    
    // Actualizar visión
    const visionElement = document.querySelector('.mv-card:last-child .mv-text');
    if (visionElement) {
        visionElement.textContent = config.vision || 'Ser una organización líder en el desarrollo comunitario de la región Mixteca, reconocida por su impacto social positivo, transparencia en la gestión de recursos y capacidad de generar cambios sostenibles en la calidad de vida de las personas.';
    }
    
    // Actualizar estadísticas con animación
    const statNumbers = document.querySelectorAll('.stat-number-big');
    
    if (statNumbers[0]) {
        animarNumero(statNumbers[0], beneficiarios, `${beneficiarios}+`);
    }
    
    if (statNumbers[1]) {
        animarNumero(statNumbers[1], eventos, `${eventos}+`);
    }
    
    if (statNumbers[2]) {
        animarNumero(statNumbers[2], socios, `${socios}+`);
    }
    
    if (statNumbers[3]) {
        animarNumero(statNumbers[3], parseInt(anos), `${anos}+`);
    }
    
    // Actualizar información de contacto
    const direccion = (config.direccion || 'Abasolo 27, Barrio las Flores<br>Asunción Nochixtlán, Oaxaca<br>México, C.P. 69600');
    
    const direccionElement = document.querySelector('.contacto-item:nth-child(1) .contacto-text');
    if (direccionElement) {
        direccionElement.innerHTML = direccion.replace(/,\s*/g, '<br>');
    }
    
    const emailElement = document.querySelector('.contacto-item:nth-child(2) .contacto-text');
    if (emailElement) {
        emailElement.textContent = config.email || 'contacto@kuenikueni.org';
    }
    
    const telefonoElement = document.querySelector('.contacto-item:nth-child(3) .contacto-text');
    if (telefonoElement) {
        telefonoElement.textContent = config.telefono || '+52 951 123 4567';
    }
    
    // Cargar áreas de trabajo
    cargarAreasTrabajo();
    
    console.log('✅ UI actualizada');
}

// ============================================================================
// CARGAR ÁREAS DE TRABAJO DESDE EVENTOS
// ============================================================================

async function cargarAreasTrabajo() {
    try {
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('categoria')
            .order('categoria');
        
        if (error) {
            console.error('Error al cargar categorías:', error);
            return;
        }
        
        if (eventos && eventos.length > 0) {
            const categoriasUnicas = [...new Set(eventos.map(e => e.categoria))].filter(Boolean);
            
            const descripciones = {
                'Medio Ambiente': 'Proyectos de reforestación, conservación de recursos naturales y educación ambiental para promover prácticas sostenibles en la comunidad.',
                'Deportes': 'Torneos deportivos, actividades recreativas y programas de activación física para promover la salud y la integración social.',
                'Deporte': 'Torneos deportivos, actividades recreativas y programas de activación física para promover la salud y la integración social.',
                'Cultura': 'Talleres de artesanías tradicionales, eventos culturales y actividades para preservar y promover el patrimonio cultural mixteco.',
                'Emprendimiento': 'Capacitaciones, asesorías y apoyo para el desarrollo de proyectos productivos y negocios locales sostenibles.',
                'Salud': 'Programas de salud preventiva, campañas de bienestar y actividades para promover estilos de vida saludables.',
                'Educación': 'Talleres educativos, capacitaciones y programas de formación para el desarrollo de habilidades.',
                'Otro': 'Diversas actividades comunitarias y proyectos especiales para el beneficio de la comunidad.'
            };
            
            const areasGrid = document.querySelector('.areas-grid');
            if (!areasGrid) return;
            
            if (categoriasUnicas.length > 0) {
                areasGrid.innerHTML = categoriasUnicas.map(cat => `
                    <div class="area-card">
                        <h4 class="area-title">${cat}</h4>
                        <p class="area-desc">${descripciones[cat] || `Actividades y proyectos relacionados con ${cat.toLowerCase()}.`}</p>
                    </div>
                `).join('');
                
                console.log('✅ Áreas actualizadas:', categoriasUnicas);
            }
        }
    } catch (error) {
        console.error('Error al cargar áreas:', error);
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function configurarEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Cerrar sesión?')) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }
    
    // Animaciones al hacer scroll
    const elementos = document.querySelectorAll('.acerca-card, .mv-card, .area-card, .stats-section, .contacto-section');
    
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
    
    .stat-number-big {
        transition: transform 0.3s ease;
    }
    
    .stat-box:hover .stat-number-big {
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
    
    .mv-card {
        transition: all 0.3s ease;
    }
    
    .mv-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(95, 13, 81, 0.15);
        border-color: #5f0d51;
    }
    
    .acerca-card {
        transition: all 0.3s ease;
    }
    
    .acerca-card:hover {
        box-shadow: 0 8px 20px rgba(95, 13, 81, 0.1);
    }
    
    .contacto-item {
        transition: all 0.3s ease;
    }
    
    .contacto-item:hover .contacto-icon {
        transform: scale(1.1);
        background: #f4e4f0;
    }
`;
document.head.appendChild(style);

console.log('🎨 Script de Acerca de cargado correctamente');
