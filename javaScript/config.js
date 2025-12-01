// ===================================================
// 🔧 ARCHIVO DE CONFIGURACIÓN
// ===================================================
// Este archivo centraliza todas las URLs y configuraciones
// para facilitar el cambio entre desarrollo y producción

// 🌍 MODO: Cambia esto según donde estés trabajando
const MODO = 'desarrollo'; // Opciones: 'desarrollo' o 'produccion'

// 📧 CONFIGURACIÓN DEL SERVIDOR DE CORREOS
const CONFIG = {
    desarrollo: {
        EMAIL_SERVER_URL: 'http://localhost:3000',
        FRONTEND_URL: 'http://localhost:5500' // O el puerto que uses
    },
    produccion: {
        EMAIL_SERVER_URL: 'https://tu-servidor.onrender.com', // Actualizar después del deploy
        FRONTEND_URL: 'https://tu-sitio.netlify.app' // Actualizar con tu URL de Netlify
    }
};

// Exportar la configuración actual
const currentConfig = CONFIG[MODO];

// Si estás en el navegador (frontend)
if (typeof window !== 'undefined') {
    window.EMAIL_SERVER_URL = currentConfig.EMAIL_SERVER_URL;
    window.FRONTEND_URL = currentConfig.FRONTEND_URL;
}

// Si estás en Node.js (backend)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = currentConfig;
}

console.log(`🚀 Modo activo: ${MODO}`);
console.log(`📧 Servidor de correos: ${currentConfig.EMAIL_SERVER_URL}`);
console.log(`🌐 Frontend: ${currentConfig.FRONTEND_URL}`);
