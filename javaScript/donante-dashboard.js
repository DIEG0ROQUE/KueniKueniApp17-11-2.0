// donante-dashboard.js - Funcionalidad del panel de donante CON ALERTAS PERSONALIZADAS

document.addEventListener('DOMContentLoaded', function() {
    // Asegurar que los estilos de alerta estén disponibles
    agregarEstilosAlerta();
    
    // ============================================
    // VERIFICAR AUTENTICACIÓN
    // ============================================
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (!isLoggedIn || userType !== 'donante') {
        window.location.href = 'login.html';
        return;
    }
    
    // ============================================
    // OBTENER DATOS DEL USUARIO
    // ============================================
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    
    // Mostrar nombre del usuario en el header si existe
    const headerTitle = document.querySelector('.donante-header h1');
    if (headerTitle && userName) {
        headerTitle.textContent = `Bienvenido, ${userName.split(' ')[0]}`; // Solo el primer nombre
    }
    
    console.log('👤 Usuario donante:', userName, userEmail);
    
    // ============================================
    // CARGAR ESTADÍSTICAS DEL USUARIO
    // ============================================
    cargarEstadisticasUsuario();
    
    // ============================================
    // BOTÓN CERRAR SESIÓN CON ALERTA PERSONALIZADA
    // ============================================
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            mostrarAlertaPersonalizada(
                '¿Cerrar sesión?',
                'Se cerrará tu sesión actual. ¿Estás seguro?',
                'Sí, cerrar sesión',
                'Cancelar',
                function() {
                    // Limpiar sesión
                    sessionStorage.clear();
                    localStorage.removeItem('userData');
                    
                    console.log('Sesión cerrada');
                    
                    // Redirigir al login
                    window.location.href = 'login.html';
                }
            );
        });
    }
    
    // ============================================
    // BOTÓN "DONAR AHORA" DEL BANNER CTA
    // ============================================
    const donarCtaBtn = document.querySelector('.btn-donar-cta');
    if (donarCtaBtn) {
        donarCtaBtn.addEventListener('click', function() {
            // Limpiar cualquier proyecto seleccionado previamente
            sessionStorage.removeItem('destinoSeleccionado');
            
            window.location.href = 'donante-donar.html';
        });
    }
    
    // ============================================
    // CARGAR ESTADÍSTICAS DEL USUARIO DESDE BD
    // ============================================
    async function cargarEstadisticasUsuario() {
        const userId = sessionStorage.getItem('userId');
        
        if (!window.supabaseClient || !userId) {
            console.log('No se puede cargar estadísticas: falta Supabase o userId');
            return;
        }
        
        try {
            console.log('Cargando estadísticas del usuario...');
            
            // Obtener donaciones del usuario
            const { data: donaciones, error } = await window.supabaseClient
                .from('donaciones')
                .select('monto, estado_pago')
                .eq('donante_email', sessionStorage.getItem('userEmail'))
                .eq('estado_pago', 'completado');
            
            if (error) {
                console.error('Error al cargar donaciones:', error);
                return;
            }
            
            if (donaciones && donaciones.length > 0) {
                // Calcular totales
                const totalDonado = donaciones.reduce((sum, d) => sum + parseFloat(d.monto), 0);
                const numeroDonaciones = donaciones.length;
                
                // Actualizar UI
                actualizarEstadisticas({
                    totalDonado: totalDonado,
                    numeroDonaciones: numeroDonaciones,
                    personasBeneficiadas: Math.floor(totalDonado / 30), // Aproximación
                    proyectosApoyados: Math.min(numeroDonaciones, 3)
                });
                
                console.log('Estadísticas actualizadas:', {
                    totalDonado,
                    numeroDonaciones
                });
            }
            
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }
    
    // ============================================
    // ACTUALIZAR ESTADÍSTICAS EN LA UI
    // ============================================
    function actualizarEstadisticas(stats) {
        // Total donado
        const totalValue = document.querySelector('.stat-card-donante:nth-child(1) .stat-value');
        if (totalValue) {
            totalValue.textContent = `$${stats.totalDonado.toLocaleString('es-MX')}`;
        }
        
        // Número de donaciones
        const donacionesValue = document.querySelector('.stat-card-donante:nth-child(2) .stat-value');
        if (donacionesValue) {
            donacionesValue.textContent = stats.numeroDonaciones;
        }
        
        // Personas beneficiadas
        const beneficiadosValue = document.querySelector('.stat-card-donante:nth-child(3) .stat-value');
        if (beneficiadosValue) {
            beneficiadosValue.textContent = stats.personasBeneficiadas;
        }
        
        // Proyectos apoyados
        const proyectosValue = document.querySelector('.stat-card-donante:nth-child(4) .stat-value');
        if (proyectosValue) {
            proyectosValue.textContent = stats.proyectosApoyados;
        }
    }
    
    console.log('Dashboard de donante inicializado correctamente');
});

// ============================================
// COMPONENTE DE ALERTA PERSONALIZADA
// (Mismo que en coordinador-dashboard.js)
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