// auth-supabase.js - Autenticación con Supabase

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Iniciar sesión con email y password
 */
async function login(email, password) {
    try {
        // Buscar usuario en la base de datos
        const { data: usuario, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error || !usuario) {
            throw new Error('Usuario no encontrado');
        }
        
        // En producción, aquí verificarías el password con bcrypt
        // Por ahora, aceptamos cualquier password para pruebas
        
        // Guardar sesión
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userId', usuario.id);
        sessionStorage.setItem('userEmail', usuario.email);
        sessionStorage.setItem('userName', usuario.nombre_completo);
        sessionStorage.setItem('userType', usuario.tipo_usuario);
        
        // Si es socio, obtener info adicional
        if (usuario.tipo_usuario === 'socio') {
            const { data: socio } = await supabaseClient
                .from('socios')
                .select('*')
                .eq('usuario_id', usuario.id)
                .single();
            
            if (socio) {
                sessionStorage.setItem('socioId', socio.id);
            }
        }
        
        // Actualizar última sesión
        await supabaseClient
            .from('usuarios')
            .update({ ultima_sesion: new Date().toISOString() })
            .eq('id', usuario.id);
        
        return {
            success: true,
            usuario: usuario,
            redirectTo: getRedirectUrl(usuario.tipo_usuario)
        };
        
    } catch (error) {
        console.error('Error en login:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Registrar nuevo usuario
 */
async function registrar(email, password, nombreCompleto, telefono, tipoUsuario = 'socio') {
    try {
        // Verificar si el email ya existe
        const { data: existente } = await supabaseClient
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();
        
        if (existente) {
            throw new Error('El email ya está registrado');
        }
        
        // En producción, hashear el password con bcrypt
        const passwordHash = password; // Por ahora sin hashear
        
        // Insertar usuario
        const { data: nuevoUsuario, error } = await supabaseClient
            .from('usuarios')
            .insert({
                email: email,
                password_hash: passwordHash,
                nombre_completo: nombreCompleto,
                telefono: telefono,
                tipo_usuario: tipoUsuario,
                estado: 'activo'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Si es socio, crear registro en tabla socios
        if (tipoUsuario === 'socio') {
            const { error: errorSocio } = await supabaseClient
                .from('socios')
                .insert({
                    usuario_id: nuevoUsuario.id,
                    fecha_ingreso: new Date().toISOString().split('T')[0],
                    estado: 'activo'
                });
            
            if (errorSocio) {
                console.error('Error al crear socio:', errorSocio);
            }
        }
        
        return {
            success: true,
            usuario: nuevoUsuario,
            message: 'Usuario registrado exitosamente'
        };
        
    } catch (error) {
        console.error('Error en registro:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Cerrar sesión
 */
function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

/**
 * Verificar si el usuario está autenticado
 */
function isAuthenticated() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Obtener usuario actual
 */
function getCurrentUser() {
    if (!isAuthenticated()) return null;
    
    return {
        id: sessionStorage.getItem('userId'),
        email: sessionStorage.getItem('userEmail'),
        nombre: sessionStorage.getItem('userName'),
        tipo: sessionStorage.getItem('userType'),
        socioId: sessionStorage.getItem('socioId')
    };
}

/**
 * Obtener URL de redirección según tipo de usuario
 */
function getRedirectUrl(tipoUsuario) {
    const redirects = {
        'admin': 'admin-dashboard.html',
        'socio': 'socio-dashboard.html',
        'donante': 'index.html'
    };
    
    return redirects[tipoUsuario] || 'index.html';
}

/**
 * Proteger ruta - verificar autenticación
 */
function protegerRuta(tipoRequerido = null) {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (tipoRequerido) {
        const userType = sessionStorage.getItem('userType');
        if (userType !== tipoRequerido) {
            window.location.href = 'login.html';
            return false;
        }
    }
    
    return true;
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

window.authSupabase = {
    login,
    registrar,
    logout,
    isAuthenticated,
    getCurrentUser,
    protegerRuta
};

console.log('Sistema de autenticación con Supabase cargado');