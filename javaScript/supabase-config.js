// supabase-config.js - Configuración de Supabase

// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
// INSTRUCCIONES: Reemplaza TU_SUPABASE_URL y TU_SUPABASE_ANON_KEY
// con los valores que copiaste de Supabase

const SUPABASE_CONFIG = {
    url: 'https://yceoopbgzmzjtyzbozst.supabase.co',  // Ejemplo: 'https://abcdefghijk.supabase.co'
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZW9vcGJnem16anR5emJvenN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTA0MzQsImV4cCI6MjA3ODQ4NjQzNH0.hLEZ94Vz4b84GE7oSKVG9Xga2ezRe_2tMiy_hQhe8Lg'  // La larga cadena que empieza con eyJhbG...
};

// ============================================
// NO MODIFIQUES NADA DE AQUÍ HACIA ABAJO
// ============================================

// Verificar que las credenciales fueron configuradas
if (SUPABASE_CONFIG.url === 'TU_SUPABASE_URL' || SUPABASE_CONFIG.anonKey === 'TU_SUPABASE_ANON_KEY') {
    console.error('IMPORTANTE: Debes configurar tus credenciales de Supabase en supabase-config.js');
    console.error('1. Abre javaScript/supabase-config.js');
    console.error('2. Reemplaza TU_SUPABASE_URL con tu Project URL');
    console.error('3. Reemplaza TU_SUPABASE_ANON_KEY con tu anon public key');
}

// Crear cliente de Supabase
let supabaseClient = null;

try {
    if (window.supabase && SUPABASE_CONFIG.url !== 'TU_SUPABASE_URL') {
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        console.log('Cliente de Supabase inicializado correctamente');
    } else if (!window.supabase) {
        console.error('Error: La librería de Supabase no está cargada. Asegúrate de incluir el CDN en el HTML.');
    }
} catch (error) {
    console.error('Error al inicializar Supabase:', error);
}

// Exportar cliente
window.supabaseClient = supabaseClient;

// Función para verificar conexión
async function verificarConexionSupabase() {
    if (!supabaseClient) {
        console.error('Cliente de Supabase no inicializado');
        return false;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('count');
        
        if (error) {
            console.error('Error de conexión a Supabase:', error.message);
            return false;
        }
        
        console.log('Conexión a Supabase verificada exitosamente');
        return true;
    } catch (error) {
        console.error('Error al verificar conexión:', error);
        return false;
    }
}

// Verificar conexión al cargar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verificarConexionSupabase);
} else {
    verificarConexionSupabase();
}












































