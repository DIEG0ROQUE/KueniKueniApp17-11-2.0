// ============================================
// ADMIN SIDEBAR - COMPONENTE UNIVERSAL
// Maneja el sidebar, cerrar sesión y alerta personalizada
// Versión: Asume que el HTML del sidebar ya existe en el DOM
// ============================================

(function() {
    'use strict';

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        // Ejecutamos la lógica de inmediato ya que el sidebar ya está en el HTML
        inicializarFuncionalidadSidebar();
    });

    // ============================================
    // FUNCIÓN DE INICIALIZACIÓN PRINCIPAL
    // ============================================
    function inicializarFuncionalidadSidebar() {
        // 1. Marcar página activa (necesita que los elementos .nav-item existan)
        marcarPaginaActiva();

        // 2. Configurar el botón de cerrar sesión
        configurarCerrarSesion();

        // 3. Configurar menú móvil (si los selectores existen)
        configurarMenuMobile();

        // 4. Agregar estilos de alerta (estos estilos están en el JS para la alerta personalizada)
        agregarEstilosAlerta();
    }


    // ============================================
    // MARCAR PÁGINA ACTIVA EN EL SIDEBAR
    // ============================================
    function marcarPaginaActiva() {
        const paginaActual = window.location.pathname.split('/').pop().replace('.html', '');
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            const pagina = item.getAttribute('data-page') + '.html'; // Agregamos .html para la comparación
            const href = item.getAttribute('href');

            // Compara el nombre del archivo actual con el href del enlace
            if (href && href.endsWith(window.location.pathname.split('/').pop())) {
                 item.classList.add('active');
            } else if (pagina === paginaActual) {
                // Compara con el atributo data-page si no se pudo con el href
                item.classList.add('active');
            }
        });
    }

    // ============================================
    // CONFIGURAR BOTÓN CERRAR SESIÓN
    // ============================================
    function configurarCerrarSesion() {
        const btnCerrarSesion = document.getElementById('btnCerrarSesion');
        if (btnCerrarSesion) {
            // Ya no clonamos, solo agregamos el listener
            btnCerrarSesion.addEventListener('click', cerrarSesion);
        }
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

    // ============================================
    // CONFIGURAR MENÚ MOBILE (si existe)
    // ============================================
    function configurarMenuMobile() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active');
            });

            // Cerrar sidebar al hacer clic fuera
            document.addEventListener('click', function(e) {
                if (window.innerWidth <= 1024) {
                    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                        sidebar.classList.remove('active');
                    }
                }
            });
        }
    }

    // ============================================
    // COMPONENTE DE ALERTA PERSONALIZADA
    // (Mantengo esta lógica completa ya que es independiente del sidebar)
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

    // ============================================
    // CSS PARA ANIMACIONES DE ALERTA
    // ============================================
    function agregarEstilosAlerta() {
        if (!document.querySelector('#estilos-alerta-sidebar')) {
            const style = document.createElement('style');
            style.id = 'estilos-alerta-sidebar';
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

    // Exponer funciones globalmente si se necesitan en otros scripts
    window.AdminSidebar = {
        cerrarSesion: cerrarSesion,
        mostrarAlertaPersonalizada: mostrarAlertaPersonalizada
    };

    console.log('Admin Sidebar componente cargado (Solo Lógica)');
})();