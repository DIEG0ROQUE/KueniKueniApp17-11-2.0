// login.js - Sistema de login con recuperación de contraseña CORREGIDO

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya hay sesión activa
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const userType = sessionStorage.getItem('userType');
        redirectUser(userType);
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    // Validación en tiempo real
    emailInput.addEventListener('blur', () => validarEmail(emailInput.value));
    
    // ============================================
    // LOGIN FORM SUBMIT
    // ============================================
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        limpiarErrores();
        
        let hayErrores = false;
        
        if (!validarEmail(email)) {
            hayErrores = true;
        }
        
        if (!password) {
            mostrarError('passwordError', 'La contraseña es obligatoria');
            hayErrores = true;
        }
        
        if (hayErrores) {
            return;
        }
        
        await realizarLogin(email, password);
    });
    
    // ============================================
    // MODAL DE RECUPERACIÓN DE CONTRASEÑA
    // ============================================
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const recoveryModal = document.getElementById('recoveryModal');
    const closeModalBtn = document.getElementById('closeModal');
    const recoveryForm = document.getElementById('recoveryForm');
    const recoveryEmailInput = document.getElementById('recoveryEmail');
    
    // Abrir modal
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            recoveryModal.style.display = 'flex';
            recoveryEmailInput.focus();
            
            // Limpiar formulario de recuperación
            recoveryForm.reset();
            document.getElementById('recoveryError').textContent = '';
            document.getElementById('recoveryMessage').innerHTML = '';
        });
    }
    
    // Cerrar modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            recoveryModal.style.display = 'none';
        });
    }
    
    // Cerrar modal al hacer click fuera
    recoveryModal.addEventListener('click', function(e) {
        if (e.target === recoveryModal) {
            recoveryModal.style.display = 'none';
        }
    });
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && recoveryModal.style.display === 'flex') {
            recoveryModal.style.display = 'none';
        }
    });
    
    // ============================================
    // FORMULARIO DE RECUPERACIÓN
    // ============================================
    recoveryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = recoveryEmailInput.value.trim();
        const recoveryError = document.getElementById('recoveryError');
        const recoveryMessage = document.getElementById('recoveryMessage');
        
        // Limpiar mensajes previos
        recoveryError.textContent = '';
        recoveryMessage.innerHTML = '';
        
        // Validar email
        if (!validarEmailRecuperacion(email)) {
            return;
        }
        
        // Procesar recuperación
        await recuperarContrasena(email);
    });
});

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================
function validarEmail(email) {
    const emailError = document.getElementById('emailError');
    
    if (!email) {
        mostrarError('emailError', 'El correo electrónico es obligatorio');
        return false;
    }
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        mostrarError('emailError', 'Formato de correo inválido');
        return false;
    }
    
    const dominiosPermitidos = [
        'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
        'live.com', 'icloud.com', 'protonmail.com'
    ];
    
    const dominio = email.split('@')[1].toLowerCase();
    if (!dominiosPermitidos.includes(dominio)) {
        mostrarError('emailError', 'Solo se permiten dominios comunes (gmail, hotmail, outlook, yahoo)');
        return false;
    }
    
    emailError.textContent = '';
    return true;
}

function validarEmailRecuperacion(email) {
    const recoveryError = document.getElementById('recoveryError');
    
    if (!email) {
        recoveryError.textContent = 'El correo electrónico es obligatorio';
        return false;
    }
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        recoveryError.textContent = 'Formato de correo inválido';
        return false;
    }
    
    const dominiosPermitidos = [
        'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
        'live.com', 'icloud.com', 'protonmail.com'
    ];
    
    const dominio = email.split('@')[1].toLowerCase();
    if (!dominiosPermitidos.includes(dominio)) {
        recoveryError.textContent = 'Solo se permiten dominios comunes';
        return false;
    }
    
    return true;
}

// ============================================
// RECUPERAR CONTRASEÑA - VERSIÓN CORREGIDA
// ============================================
async function recuperarContrasena(email) {
    const recoveryBtn = document.getElementById('recoveryBtn');
    const btnText = recoveryBtn.querySelector('.btn-text');
    const btnLoader = recoveryBtn.querySelector('.btn-loader');
    const recoveryError = document.getElementById('recoveryError');
    const recoveryMessage = document.getElementById('recoveryMessage');
    
    if (!window.supabaseClient) {
        recoveryError.textContent = 'Error de configuración del servidor.';
        return;
    }
    
    try {
        // Mostrar loader
        recoveryBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        
        console.log('Solicitando restablecimiento de contraseña para:', email);
        
        // OBTENER LA URL ACTUAL DINÁMICAMENTE
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
        const redirectUrl = `${baseUrl}/reset-password.html`;
        
        console.log('URL de redirección:', redirectUrl);
        
        // Función de Supabase que envía el correo con el enlace de token
        const { data, error } = await window.supabaseClient.auth
            .resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });

        if (error) {
            console.error('Error de Supabase Auth:', error);
            
            // Mensajes de error más específicos
            if (error.message.includes('Email not found') || error.message.includes('User not found')) {
                recoveryError.textContent = 'No existe una cuenta con este correo electrónico.';
            } else if (error.message.includes('Email rate limit exceeded')) {
                recoveryError.textContent = 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
            } else {
                recoveryError.textContent = 'Error al procesar la solicitud. Intenta más tarde.';
            }
            return;
        }
        
        console.log('Correo de restablecimiento solicitado:', data);
        
        // Mostrar mensaje de éxito
        recoveryMessage.innerHTML = `
            <div class="recovery-success">
                <div class="success-icon">✉️</div>
                <h3>¡Correo de restablecimiento enviado!</h3>
                <p>Hemos enviado un enlace a <strong>${email}</strong></p>
                <p class="recovery-note">
                    Revisa tu bandeja de entrada y sigue las instrucciones para cambiar tu contraseña. 
                    Si no lo ves, revisa la carpeta de spam.
                </p>
                <div class="recovery-timer">
                    Este mensaje se cerrará en <span id="countdown">10</span> segundos
                </div>
            </div>
        `;
        
        // Countdown y cerrar modal
        let segundos = 10;
        const countdownElement = document.getElementById('countdown');
        const interval = setInterval(() => {
            segundos--;
            if (countdownElement) {
                countdownElement.textContent = segundos;
            }
            if (segundos <= 0) {
                clearInterval(interval);
                document.getElementById('recoveryModal').style.display = 'none';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error general:', error);
        recoveryError.textContent = 'Error al procesar la solicitud. Verifica tu conexión.';
    } finally {
        recoveryBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// ============================================
// REALIZAR LOGIN
// ============================================
async function realizarLogin(email, password) {
    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    
    if (!window.supabaseClient) {
        mostrarMensaje('Error de configuración. Verifica la consola.', 'error');
        return;
    }
    
    try {
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        
        console.log('Buscando usuario:', email);
        
        const { data: usuarios, error } = await window.supabaseClient
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .limit(1);
        
        if (error) {
            console.error('Error al buscar usuario:', error);
            mostrarMensaje('Error al conectar con el servidor', 'error');
            return;
        }
        
        if (!usuarios || usuarios.length === 0) {
            console.log('Usuario no encontrado');
            mostrarMensaje('Correo o contraseña incorrectos', 'error');
            return;
        }
        
        const usuario = usuarios[0];
        console.log('Usuario encontrado:', usuario.email);
        
        if (usuario.password_hash !== password) {
            console.log('Contraseña incorrecta');
            mostrarMensaje('Correo o contraseña incorrectos', 'error');
            return;
        }
        
        if (usuario.estado !== 'activo') {
            mostrarMensaje('Tu cuenta está inactiva. Contacta al administrador.', 'error');
            return;
        }
        
        console.log('Contraseña correcta');
        
        // Guardar sesión
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userId', usuario.id);
        sessionStorage.setItem('userEmail', usuario.email);
        sessionStorage.setItem('userName', usuario.nombre_completo);
        sessionStorage.setItem('userType', usuario.tipo_usuario);
        
        console.log('Sesión guardada - Tipo:', usuario.tipo_usuario);
        
        // Si es socio, obtener info adicional
        if (usuario.tipo_usuario === 'socio') {
            const { data: socio } = await window.supabaseClient
                .from('socios')
                .select('*')
                .eq('usuario_id', usuario.id)
                .single();
            
            if (socio) {
                sessionStorage.setItem('socioId', socio.id);
                sessionStorage.setItem('socioEventos', socio.total_eventos_asistidos || 0);
                sessionStorage.setItem('socioDonaciones', socio.total_donaciones || 0);
                console.log('👥 Info de socio cargada');
            }
        }
        
        // Actualizar última sesión
        await window.supabaseClient
            .from('usuarios')
            .update({ ultima_sesion: new Date().toISOString() })
            .eq('id', usuario.id);
        
        const mensajes = {
            'admin': '¡Bienvenido Administrador!',
            'socio': '¡Bienvenido Socio!',
            'donante': '¡Bienvenido Donante!',
            'coordinador': '¡Bienvenido Coordinador!'
        };
        
        mostrarMensaje(mensajes[usuario.tipo_usuario] || '¡Inicio de sesión exitoso!', 'success');
        
        setTimeout(() => {
            redirectUser(usuario.tipo_usuario);
        }, 1000);
        
    } catch (error) {
        console.error('Error en login:', error);
        mostrarMensaje('Error al procesar el login', 'error');
    } finally {
        loginBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function redirectUser(tipoUsuario) {
    const redirects = {
        'admin': 'admin-dashboard.html',
        'socio': 'socio-dashboard.html',
        'donante': 'donante-dashboard.html',
        'coordinador': 'coordinador-dashboard.html'
    };
    
    const url = redirects[tipoUsuario] || 'index.html';
    console.log('Redirigiendo a:', url);
    window.location.href = url;
}

function mostrarError(idError, mensaje) {
    const errorElement = document.getElementById(idError);
    if (errorElement) {
        errorElement.textContent = mensaje;
    }
}

function limpiarErrores() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}

function mostrarMensaje(mensaje, tipo) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = '';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${tipo}`;
    messageDiv.textContent = mensaje;
    container.appendChild(messageDiv);
    
    if (tipo !== 'success') {
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transition = 'opacity 0.3s';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }
}

// ============================================
// ESTILOS
// ============================================
const style = document.createElement('style');
style.textContent = `
    .form-error {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: #dc2626;
    }
    
    .loader {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    #btnLoader, .btn-loader {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    
    .message {
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        transition: opacity 0.3s;
    }
    
    .message-error {
        background: #fee2e2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }
    
    .message-success {
        background: #fad1f8ff;
        color: #5f0d51;
        border: 1px solid #f0a7f3ff;
    }
    
    /* Modal */
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        z-index: 1000;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    .modal-content {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 480px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
        position: relative;
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
    }
    
    .modal-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #4f0d5fff;
        margin: 0;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6b7280;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;
    }
    
    .close-btn:hover {
        background: #f3f4f6;
        color: #1f2937;
    }
    
    .modal-description {
        color: #6b7280;
        margin-bottom: 1.5rem;
        line-height: 1.6;
    }
    
    .recovery-success {
        text-align: center;
        padding: 1rem 0;
    }
    
    .success-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        animation: bounce 0.6s ease-out;
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
    }
    
    .recovery-success h3 {
        color: #5f0d51;
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
    }
    
    .recovery-success p {
        color: #4b5563;
        margin: 0.5rem 0;
        line-height: 1.6;
    }
    
    .recovery-note {
        font-size: 0.875rem;
        color: #6b7280;
        font-style: italic;
        margin-top: 1rem !important;
    }
    
    .recovery-timer {
        margin-top: 1.5rem;
        padding: 0.75rem;
        background: #f3f4f6;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #6b7280;
    }
    
    .recovery-timer span {
        font-weight: 700;
        color: #5f0d51;
    }
    
    .forgot-password-link {
        display: inline-block;
        margin-top: 0.5rem;
        color: #5f0d51;
        text-decoration: none;
        font-size: 0.9rem;
        transition: color 0.2s;
    }
    
    .forgot-password-link:hover {
        color: #651647ff;
        text-decoration: underline;
    }
`;
document.head.appendChild(style);