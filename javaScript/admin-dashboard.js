// admin-dashboard.js - Dashboard administrativo CON ALERTA PERSONALIZADA

document.addEventListener('DOMContentLoaded', function() {
    // Asegurar que los estilos de alerta estén disponibles
    agregarEstilosAlerta();
    
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

// ============================================
// CERRAR SESIÓN CON ALERTA PERSONALIZADA
// ============================================
function cerrarSesion() {
    mostrarAlertaPersonalizada(
        '¿Cerrar sesión?',
        'Se cerrará tu sesión de administrador. ¿Estás seguro?',
        'Sí, cerrar sesión',
        'Cancelar',
        function() {
            console.log('Cerrando sesión...');
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    );
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

// ============================================
// COMPONENTE DE ALERTA PERSONALIZADA
// (Copiado del dashboard de donante)
// ============================================

function mostrarAlertaPersonalizada(titulo, mensaje, textoAceptar = 'Aceptar', textoCancelar = 'Cancelar', onAceptar = null) {
    const alertaExistente = document.getElementById('alertaPersonalizada');
    if (alertaExistente) alertaExistente.remove();

    const alertaHTML = `
        <div id="alertaPersonalizada" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        ">
            <div style="
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
                padding: 2rem;
                animation: slideUp 0.3s ease;
            ">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="
                        width: 56px;
                        height: 56px;
                        background: linear-gradient(135deg, #5f0d51 0%, #7d1166 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1rem;
                    ">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </div>
                    <h3 style="font-size: 1.5rem; font-weight: 700; color: #18181b; margin: 0 0 0.5rem 0;">${titulo}</h3>
                    <p style="font-size: 1rem; color: #71717a; margin: 0;">${mensaje}</p>
                </div>
                <div style="display: flex; gap: 0.75rem; margin-top: 2rem;">
                    <button id="btnCancelarAlerta" style="
                        flex: 1;
                        padding: 0.875rem;
                        background: #f3f4f6;
                        color: #52525b;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">${textoCancelar}</button>
                    <button id="btnAceptarAlerta" style="
                        flex: 1;
                        padding: 0.875rem;
                        background: linear-gradient(135deg, #5f0d51 0%, #7d1166 100%);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: 0 4px 12px rgba(95, 13, 81, 0.3);
                    ">${textoAceptar}</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertaHTML);
    document.body.style.overflow = 'hidden';

    const alerta = document.getElementById('alertaPersonalizada');
    const btnAceptar = document.getElementById('btnAceptarAlerta');
    const btnCancelar = document.getElementById('btnCancelarAlerta');

    btnAceptar.addEventListener('mouseenter', () => {
        btnAceptar.style.transform = 'translateY(-2px)';
        btnAceptar.style.boxShadow = '0 6px 16px rgba(95, 13, 81, 0.4)';
    });
    btnAceptar.addEventListener('mouseleave', () => {
        btnAceptar.style.transform = 'translateY(0)';
        btnAceptar.style.boxShadow = '0 4px 12px rgba(95, 13, 81, 0.3)';
    });

    btnCancelar.addEventListener('mouseenter', () => {
        btnCancelar.style.background = '#e5e7eb';
        btnCancelar.style.transform = 'translateY(-2px)';
    });
    btnCancelar.addEventListener('mouseleave', () => {
        btnCancelar.style.background = '#f3f4f6';
        btnCancelar.style.transform = 'translateY(0)';
    });

    const cerrarAlerta = () => {
        alerta.style.opacity = '0';
        setTimeout(() => {
            alerta.remove();
            document.body.style.overflow = '';
        }, 200);
    };

    btnCancelar.addEventListener('click', cerrarAlerta);
    btnAceptar.addEventListener('click', () => {
        if (onAceptar) onAceptar();
        cerrarAlerta();
    });

    alerta.addEventListener('click', (e) => {
        if (e.target === alerta) cerrarAlerta();
    });
}

// CSS para animaciones
function agregarEstilosAlerta() {
    if (!document.querySelector('#estilos-alerta')) {
        const style = document.createElement('style');
        style.id = 'estilos-alerta';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

console.log('Dashboard admin con alerta personalizada cargado');