// socio-acerca.js - Versión simple para página estática
// ============================================================================

// ============================================================================
// 1. VERIFICACIÓN DE SESIÓN Y CONFIGURACIÓN INICIAL
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando página Acerca de...');
    
    // Verificar sesión
    if (!verificarSesion()) {
        console.log('No hay sesión válida. Redirigiendo al login...');
        window.location.href = 'login.html';
        return;
    }
    
    // Verificar cliente Supabase
    if (!window.supabaseClient) {
        console.warn('Cliente Supabase no inicializado, usando datos estáticos');
    } else {
        // Cargar estadísticas dinámicas desde la BD
        await cargarEstadisticasDinamicas();
    }
    
    // Configurar event listeners
    configurarEventListeners();
    
    console.log('Página Acerca de cargada exitosamente');
});

// ============================================================================
// 2. VERIFICACIÓN DE SESIÓN
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
// 3. CARGAR ESTADÍSTICAS DINÁMICAS (OPCIONAL)
// ============================================================================

async function cargarEstadisticasDinamicas() {
    console.log('Cargando estadísticas desde configuración...');
    
    try {
        const { data: config, error } = await window.supabaseClient
            .from('configuracion')
            .select('clave, valor')
            .in('clave', [
                'beneficiarios_directos',
                'eventos_realizados',
                'socios_activos',
                'anos_experiencia'
            ]);
        
        if (error) {
            console.error('Error al cargar configuración:', error);
            return;
        }
        
        if (config && config.length > 0) {
            // Actualizar estadísticas en la UI
            const statNumbers = document.querySelectorAll('.stat-number-big');
            
            config.forEach(item => {
                let valor = item.valor;
                let index = -1;
                
                switch(item.clave) {
                    case 'beneficiarios_directos':
                        index = 0;
                        valor = `${valor}+`;
                        break;
                    case 'eventos_realizados':
                        index = 1;
                        valor = `${valor}+`;
                        break;
                    case 'socios_activos':
                        index = 2;
                        valor = `${valor}+`;
                        break;
                    case 'anos_experiencia':
                        index = 3;
                        valor = `${valor}+`;
                        break;
                }
                
                if (index >= 0 && statNumbers[index]) {
                    animarNumero(statNumbers[index], parseInt(item.valor), valor);
                }
            });
            
            console.log('Estadísticas actualizadas desde la BD');
        }
        
    } catch (error) {
        console.error('Error inesperado:', error);
    }
}

// ============================================================================
// 4. CONFIGURAR EVENT LISTENERS
// ============================================================================

function configurarEventListeners() {
    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }
    
    console.log('Event listeners configurados');
}

// ============================================================================
// 5. FUNCIONES AUXILIARES
// ============================================================================

function animarNumero(elemento, valorFinal, textoFinal) {
    let valorActual = 0;
    const incremento = Math.ceil(valorFinal / 30);
    
    const timer = setInterval(() => {
        valorActual += incremento;
        if (valorActual >= valorFinal) {
            elemento.textContent = textoFinal;
            clearInterval(timer);
        } else {
            elemento.textContent = valorActual;
        }
    }, 30);
}

// ============================================================================
// 6. ESTILOS ADICIONALES (si se necesitan)
// ============================================================================

const style = document.createElement('style');
style.textContent = `
    .stat-number-big {
        transition: transform 0.3s;
    }
    
    .stat-box:hover .stat-number-big {
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);