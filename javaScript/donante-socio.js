// donante-socio.js - Funcionalidad de la página Ser Socio

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (!isLoggedIn || userType !== 'donante') {
        window.location.href = 'login.html';
        return;
    }
    
    // Botón "Solicitar Membresía"
    const solicitarBtn = document.querySelector('.btn-solicitar');
    if (solicitarBtn) {
        solicitarBtn.addEventListener('click', function() {
            // Aquí se podría abrir un modal o redirigir a un formulario
            alert('Funcionalidad de solicitud de membresía próximamente.\n\nTu solicitud será procesada por nuestro equipo.');
            // En producción, esto abriría un formulario de solicitud
        });
    }
});