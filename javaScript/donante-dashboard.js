// donante-dashboard.js - Funcionalidad del panel de donante

document.addEventListener('DOMContentLoaded', function() {
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
    // BOTÓN CERRAR SESIÓN
    // ============================================
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                // Limpiar sesión
                sessionStorage.clear();
                
                console.log('Sesión cerrada');
                
                // Redirigir al login
                window.location.href = 'login.html';
            }
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
    // BOTONES "APOYAR PROYECTO"
    // ============================================
    const apoyarBtns = document.querySelectorAll('.btn-apoyar');
    
    apoyarBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const proyectoCard = this.closest('.proyecto-card');
            const proyectoTitulo = proyectoCard.querySelector('h3').textContent;
            const proyectoBadge = proyectoCard.querySelector('.proyecto-badge').textContent;
            
            console.log('Proyecto seleccionado:', proyectoTitulo);
            console.log('Categoría:', proyectoBadge);
            
            // Mapear el título del proyecto al valor del select
            const destinoMap = {
                'Programa de Reforestación': 'reforestacion',
                'Taller de Artesanías para Mujeres': 'artesanias',
                'Torneo Deportivo Juvenil': 'deportivo'
            };
            
            // Obtener el valor del destino
            const destinoValue = destinoMap[proyectoTitulo] || 'general';
            
            // Guardar en sessionStorage
            sessionStorage.setItem('destinoSeleccionado', destinoValue);
            sessionStorage.setItem('proyectoNombre', proyectoTitulo);
            
            console.log('Destino guardado:', destinoValue);
            
            // Redirigir a página de donación
            window.location.href = 'donante-donar.html';
        });
    });
    
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