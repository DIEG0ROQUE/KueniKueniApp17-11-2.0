// socio-dashboard.js - Sistema con restricciones para usuarios INACTIVOS
// Los socios inactivos solo pueden ver su perfil y no pueden hacer acciones

document.addEventListener('DOMContentLoaded', async function() {
    agregarEstilosAlerta();
    
    console.log('Inicializando dashboard de socio...');
    
    // Verificar sesión
    if (!verificarSesion()) {
        console.log('No hay sesión válida. Redirigiendo al login...');
        window.location.href = 'login.html';
        return;
    }
    
    // Verificar cliente Supabase
    if (!window.supabaseClient) {
        console.error('Error: Cliente Supabase no inicializado');
        mostrarMensajeError('Error de configuración. Por favor, recarga la página.');
        return;
    }
    
    // Obtener datos de sesión
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    const socioId = sessionStorage.getItem('socioId');
    const userEstado = sessionStorage.getItem('userEstado'); // ⭐ NUEVO
    
    console.log('Usuario autenticado:', {
        email: userEmail,
        nombre: userName,
        socioId: socioId,
        estado: userEstado // ⭐ NUEVO
    });
    
    // ⭐ VERIFICAR SI EL SOCIO ESTÁ INACTIVO
    if (userEstado === 'inactivo') {
        mostrarModoInactivo();
        return; // No cargar dashboard completo
    }
    
    // Inicializar dashboard normal para usuarios activos
    await inicializarDashboard(userId, socioId);
    configurarEventListeners();
});

// ⭐ NUEVA FUNCIÓN: Mostrar modo restringido para socios inactivos
function mostrarModoInactivo() {
    console.log('⚠️ Usuario inactivo detectado - Mostrando vista restringida');
    
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="inactive-notice">
                <div class="inactive-notice-icon">⚠️</div>
                <h2>Cuenta Inactiva</h2>
                <p>Tu cuenta está actualmente <strong>inactiva</strong>.</p>
                <p>Para activar tu cuenta, necesitas crear una suscripción mensual.</p>
            </div>
            
            <div class="profile-container">
                <div class="profile-header">
                    <h3>📋 Tu Perfil</h3>
                    <p class="profile-subtitle">Información de tu cuenta</p>
                </div>
                
                <div class="profile-info">
                    <div class="profile-item">
                        <span class="profile-label">👤 Nombre:</span>
                        <span class="profile-value" id="perfilNombre">-</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-label">📧 Correo:</span>
                        <span class="profile-value" id="perfilEmail">-</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-label">📱 Teléfono:</span>
                        <span class="profile-value" id="perfilTelefono">-</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-label">📅 Fecha de registro:</span>
                        <span class="profile-value" id="perfilFechaRegistro">-</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-label">🔄 Estado:</span>
                        <span class="profile-value profile-status-inactive">Inactivo</span>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <a href="socio-donaciones.html" class="btn-activate">
                        💳 Activar mi Cuenta
                    </a>
                    <p class="profile-note">Crea una suscripción para activar tu cuenta y acceder a todas las funciones</p>
                </div>
            </div>
        `;
        
        // Cargar datos del perfil
        cargarPerfilInactivo();
    }
    
    // Agregar estilos para la vista inactiva
    agregarEstilosInactivo();
}

// ⭐ CARGAR DATOS DEL PERFIL PARA USUARIO INACTIVO
async function cargarPerfilInactivo() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        const { data: usuario, error } = await window.supabaseClient
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('Error al cargar perfil:', error);
            return;
        }
        
        // Actualizar UI con los datos
        document.getElementById('perfilNombre').textContent = usuario.nombre_completo || '-';
        document.getElementById('perfilEmail').textContent = usuario.email || '-';
        document.getElementById('perfilTelefono').textContent = usuario.telefono || 'No registrado';
        
        if (usuario.fecha_registro) {
            const fecha = new Date(usuario.fecha_registro);
            document.getElementById('perfilFechaRegistro').textContent = fecha.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
    } catch (error) {
        console.error('Error inesperado:', error);
    }
}

// ⭐ ESTILOS PARA MODO INACTIVO
function agregarEstilosInactivo() {
    const style = document.createElement('style');
    style.textContent = `
        .inactive-notice {
            background: linear-gradient(135deg, #FEF3C7 0%, #FED7D7 100%);
            border: 2px solid #F59E0B;
            border-radius: 16px;
            padding: 2.5rem;
            text-align: center;
            margin-bottom: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .inactive-notice-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .inactive-notice h2 {
            color: #B45309;
            margin: 0 0 1rem 0;
            font-size: 1.8rem;
        }
        
        .inactive-notice p {
            color: #92400E;
            margin: 0.5rem 0;
            font-size: 1.1rem;
        }
        
        .inactive-notice strong {
            color: #B45309;
            font-weight: 700;
        }
        
        .profile-container {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .profile-header {
            border-bottom: 2px solid #F3F4F6;
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .profile-header h3 {
            margin: 0 0 0.5rem 0;
            color: #4f0d5fff;
            font-size: 1.5rem;
        }
        
        .profile-subtitle {
            color: #6B7280;
            margin: 0;
            font-size: 0.95rem;
        }
        
        .profile-info {
            display: grid;
            gap: 1.5rem;
        }
        
        .profile-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: #F9FAFB;
            border-radius: 10px;
            transition: all 0.3s;
        }
        
        .profile-item:hover {
            background: #F3F4F6;
            transform: translateX(5px);
        }
        
        .profile-label {
            font-weight: 600;
            color: #374151;
            font-size: 1rem;
        }
        
        .profile-value {
            color: #6B7280;
            font-size: 1rem;
        }
        
        .profile-status-inactive {
            background: #FEE2E2;
            color: #DC2626;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .profile-actions {
            margin-top: 2.5rem;
            padding-top: 2rem;
            border-top: 2px solid #F3F4F6;
            text-align: center;
        }
        
        .btn-activate {
            display: inline-block;
            background: linear-gradient(135deg, #5f0d51 0%, #8B1874 100%);
            color: white;
            padding: 1rem 2.5rem;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            font-size: 1.1rem;
            transition: all 0.3s;
            box-shadow: 0 4px 12px rgba(95, 13, 81, 0.3);
        }
        
        .btn-activate:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(95, 13, 81, 0.4);
        }
        
        .profile-note {
            margin-top: 1rem;
            color: #6B7280;
            font-size: 0.9rem;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// VERIFICACIÓN DE SESIÓN
// ============================================================================
function verificarSesion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (isLoggedIn !== 'true') {
        return false;
    }
    
    if (userType !== 'socio') {
        console.warn('Tipo de usuario incorrecto:', userType);
        return false;
    }
    
    return true;
}

// ============================================================================
// RESTO DE FUNCIONES DEL DASHBOARD ORIGINAL (para usuarios activos)
// ============================================================================

async function inicializarDashboard(userId, socioId) {
    mostrarLoaders();
    
    try {
        const [datosBasicos, eventos, actividad] = await Promise.all([
            cargarDatosBasicosSocio(socioId),
            cargarProximosEventos(socioId),
            cargarActividadReciente(socioId)
        ]);
        
        if (datosBasicos) {
            actualizarEncabezado(datosBasicos);
            actualizarTarjetasEstadisticas(datosBasicos, eventos ? eventos.length : 0);
        }
        
        if (eventos) {
            mostrarProximosEventos(eventos, socioId);
        }
        
        if (actividad) {
            mostrarActividadReciente(actividad);
        }
        
        console.log('Dashboard cargado exitosamente');
        
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        mostrarMensajeError('Ocurrió un error al cargar tus datos.');
    } finally {
        ocultarLoaders();
    }
}

async function cargarDatosBasicosSocio(socioId) {
    console.log('Cargando datos del socio:', socioId);
    
    try {
        const { data, error } = await window.supabaseClient
            .from('vista_socios_completa')
            .select('*')
            .eq('id', socioId)
            .single();
        
        if (error) {
            console.error('Error al cargar datos del socio:', error);
            return null;
        }
        
        const { data: donacionesData } = await window.supabaseClient
            .from('donaciones')
            .select('monto')
            .eq('socio_id', socioId)
            .eq('estado_pago', 'completado');
        
        if (donacionesData && donacionesData.length > 0) {
            data.total_donaciones = donacionesData.reduce((sum, d) => sum + parseFloat(d.monto), 0);
        } else {
            data.total_donaciones = 0;
        }
        
        return data;
        
    } catch (error) {
        console.error('Error inesperado:', error);
        return null;
    }
}

// Funciones auxiliares (necesitan estar implementadas)
function mostrarLoaders() {
    document.querySelectorAll('.loader').forEach(loader => {
        if (loader) loader.style.display = 'flex';
    });
}

function ocultarLoaders() {
    document.querySelectorAll('.loader').forEach(loader => {
        if (loader) loader.style.display = 'none';
    });
}

function mostrarMensajeError(mensaje) {
    console.error(mensaje);
}

function agregarEstilosAlerta() {
    // Estilos básicos para alertas
}

function actualizarEncabezado(datos) {
    // Actualizar encabezado del dashboard
}

function actualizarTarjetasEstadisticas(datos, eventosCount) {
    // Actualizar estadísticas
}

async function cargarProximosEventos(socioId) {
    // Cargar eventos
    return [];
}

function mostrarProximosEventos(eventos, socioId) {
    // Mostrar eventos
}

async function cargarActividadReciente(socioId) {
    // Cargar actividad
    return [];
}

function mostrarActividadReciente(actividad) {
    // Mostrar actividad
}

function configurarEventListeners() {
    // Configurar listeners
}
