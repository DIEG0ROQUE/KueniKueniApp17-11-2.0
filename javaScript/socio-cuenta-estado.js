// ============================================================================
// GESTIÓN DE ESTADO DE CUENTA - SOCIO
// Maneja la activación y desactivación de cuentas
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    configurarBotonesEstadoCuenta();
});

// ============================================================================
// CONFIGURAR BOTONES DE ACTIVAR/DESACTIVAR
// ============================================================================

function configurarBotonesEstadoCuenta() {
    // Botón Activar Cuenta (en el mensaje de inactivo)
    const btnActivar = document.getElementById('btnActivarCuenta');
    if (btnActivar) {
        btnActivar.addEventListener('click', activarCuentaDirectamente);
    }

    // Mostrar/ocultar elementos según el estado
    verificarEstadoYMostrarElementos();
}

// ============================================================================
// VERIFICAR ESTADO Y MOSTRAR ELEMENTOS APROPIADOS
// ============================================================================

function verificarEstadoYMostrarElementos() {
    const userEstado = sessionStorage.getItem('userEstado');
    const inactiveAlert = document.getElementById('inactiveAccountAlert');
    const activeDashboard = document.getElementById('activeDashboard');
    const sidebar = document.querySelector('.sidebar');
    const sidebarNav = document.querySelector('.sidebar-nav');

    console.log('Estado del usuario:', userEstado);

    if (userEstado === 'inactivo') {
        // MODO INACTIVO
        console.log('🔴 Modo Inactivo activado');
        
        if (inactiveAlert) inactiveAlert.style.display = 'flex';
        if (activeDashboard) activeDashboard.style.display = 'none';
        
        // Ocultar navegación lateral
        if (sidebarNav) sidebarNav.style.display = 'none';
        if (sidebar) sidebar.classList.add('inactive-mode');
        
    } else {
        // MODO ACTIVO
        console.log('🟢 Modo Activo - Dashboard completo');
        
        if (inactiveAlert) inactiveAlert.style.display = 'none';
        if (activeDashboard) activeDashboard.style.display = 'block';
        
        // Mostrar navegación lateral
        if (sidebarNav) sidebarNav.style.display = 'block';
        if (sidebar) sidebar.classList.remove('inactive-mode');
    }
}

// ============================================================================
// ACTIVAR CUENTA DIRECTAMENTE (SIN REDIRIGIR A DONACIONES)
// ============================================================================

async function activarCuentaDirectamente() {
    console.log('Activando cuenta directamente...');
    
    const userId = sessionStorage.getItem('userId');
    const socioId = sessionStorage.getItem('socioId');
    
    if (!userId || !socioId) {
        mostrarMensajeError('Error: No se encontró información de usuario');
        return;
    }

    try {
        mostrarLoader('Activando tu cuenta...');

        const { error: errorUsuario } = await window.supabaseClient
            .from('usuarios')
            .update({ estado: 'activo', updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (errorUsuario) {
            console.error('Error al actualizar usuario:', errorUsuario);
            ocultarLoader();
            mostrarMensajeError('Error al activar la cuenta en usuarios');
            return;
        }

        const { error: errorSocio } = await window.supabaseClient
            .from('socios')
            .update({ estado: 'activo' })
            .eq('id', socioId);

        if (errorSocio) {
            console.error('Error al actualizar socio:', errorSocio);
            ocultarLoader();
            mostrarMensajeError('Error al activar la cuenta en socios');
            return;
        }

        console.log('✅ Cuenta activada exitosamente');
        ocultarLoader();

        sessionStorage.setItem('userEstado', 'activo');

        mostrarMensajeExito('¡Cuenta activada exitosamente! Bienvenido de vuelta 🎉');
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        console.error('Error inesperado:', error);
        ocultarLoader();
        mostrarMensajeError('Error inesperado al activar la cuenta');
    }
}

// ============================================================================
// ALERTAS PERSONALIZADAS
// ============================================================================

function mostrarAlertaInfo(titulo, mensaje, textoAceptar, textoCancelar, onAceptar) {
    mostrarAlertaPersonalizada(titulo, mensaje, textoAceptar, textoCancelar, onAceptar, 'info');
}

function mostrarAlertaAdvertencia(titulo, mensaje, textoAceptar, textoCancelar, onAceptar) {
    mostrarAlertaPersonalizada(titulo, mensaje, textoAceptar, textoCancelar, onAceptar, 'warning');
}

function mostrarAlertaPersonalizada(titulo, mensaje, textoAceptar, textoCancelar, onAceptar, tipo = 'info') {
    const alertaExistente = document.getElementById('alertaEstadoCuenta');
    if (alertaExistente) alertaExistente.remove();

    const iconoHTML = tipo === 'warning' 
        ? `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
               <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
               <line x1="12" y1="9" x2="12" y2="13"></line>
               <line x1="12" y1="17" x2="12.01" y2="17"></line>
           </svg>`
        : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
               <circle cx="12" cy="12" r="10"></circle>
               <line x1="12" y1="16" x2="12" y2="12"></line>
               <line x1="12" y1="8" x2="12.01" y2="8"></line>
           </svg>`;

    const colorFondo = tipo === 'warning' ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' : 'linear-gradient(135deg, #5f0d51 0%, #7d1166 100%)';

    const alertaHTML = `
        <div id="alertaEstadoCuenta" style="
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
                max-width: 420px;
                width: 90%;
                padding: 2rem;
                animation: slideUp 0.3s ease;
            ">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="
                        width: 56px;
                        height: 56px;
                        background: ${colorFondo};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1rem;
                    ">
                        ${iconoHTML}
                    </div>
                    <h3 style="font-size: 1.5rem; font-weight: 700; color: #18181b; margin: 0 0 0.5rem 0;">${titulo}</h3>
                    <p style="font-size: 1rem; color: #71717a; margin: 0; line-height: 1.5;">${mensaje}</p>
                </div>
                <div style="display: flex; gap: 0.75rem; margin-top: 2rem;">
                    <button id="btnCancelarAlertaEstado" style="
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
                    <button id="btnAceptarAlertaEstado" style="
                        flex: 1;
                        padding: 0.875rem;
                        background: ${colorFondo};
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

    const alerta = document.getElementById('alertaEstadoCuenta');
    const btnAceptar = document.getElementById('btnAceptarAlertaEstado');
    const btnCancelar = document.getElementById('btnCancelarAlertaEstado');

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

// ============================================================================
// LOADERS Y MENSAJES
// ============================================================================

function mostrarLoader(mensaje = 'Procesando...') {
    const loaderExistente = document.getElementById('loaderGeneral');
    if (loaderExistente) loaderExistente.remove();

    const loaderHTML = `
        <div id="loaderGeneral" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        ">
            <div style="
                background: white;
                padding: 2rem 3rem;
                border-radius: 16px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f4f6;
                    border-top-color: #5f0d51;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                "></div>
                <p style="margin: 0; color: #52525b; font-weight: 600; font-size: 1.1rem;">${mensaje}</p>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', loaderHTML);

    // Agregar animación de spin si no existe
    if (!document.querySelector('#spinAnimation')) {
        const style = document.createElement('style');
        style.id = 'spinAnimation';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function ocultarLoader() {
    const loader = document.getElementById('loaderGeneral');
    if (loader) loader.remove();
}

function mostrarMensajeError(mensaje) {
    mostrarMensaje(mensaje, 'error');
}

function mostrarMensajeExito(mensaje) {
    mostrarMensaje(mensaje, 'success');
}

function mostrarMensaje(mensaje, tipo) {
    let container = document.getElementById('messageContainerEstado');
    if (!container) {
        container = document.createElement('div');
        container.id = 'messageContainerEstado';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(container);
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${tipo}`;
    messageDiv.textContent = mensaje;
    messageDiv.style.cssText = `
        padding: 1rem 1.5rem;
        margin-bottom: 0.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
        min-width: 300px;
        font-weight: 600;
        ${tipo === 'error' ? 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;' : ''}
        ${tipo === 'success' ? 'background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;' : ''}
    `;

    container.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 4000);
}

// Agregar estilos de animación
if (!document.querySelector('#animacionesMensajes')) {
    const style = document.createElement('style');
    style.id = 'animacionesMensajes';
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
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ Módulo de gestión de estado de cuenta cargado');
