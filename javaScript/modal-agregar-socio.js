// modal-agregar-socio.js
// JavaScript para el modal de agregar socio con validaciones completas

// Abrir modal
document.getElementById('btnAgregarSocio')?.addEventListener('click', abrirModal);

function abrirModal() {
    document.getElementById('modalAgregarSocio').classList.add('show');
    limpiarFormulario();
}

function cerrarModal() {
    document.getElementById('modalAgregarSocio').classList.remove('show');
    limpiarFormulario();
}

function limpiarFormulario() {
    document.getElementById('formNuevoSocio').reset();
    document.getElementById('modalMessage').innerHTML = '';
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.getElementById('modalPasswordStrength').className = 'password-strength';
    document.getElementById('modalPasswordRequirements').classList.remove('show');
}

// Cerrar modal al hacer clic fuera
document.getElementById('modalAgregarSocio')?.addEventListener('click', function(e) {
    if (e.target === this) {
        cerrarModal();
    }
});

// Validaciones en tiempo real
document.getElementById('modalNombre')?.addEventListener('input', validarNombre);
document.getElementById('modalNombre')?.addEventListener('blur', validarNombre);

document.getElementById('modalEmail')?.addEventListener('blur', validarEmail);

document.getElementById('modalTelefono')?.addEventListener('input', validarTelefono);
document.getElementById('modalTelefono')?.addEventListener('blur', validarTelefono);

document.getElementById('modalPassword')?.addEventListener('input', function() {
    validarPassword();
    mostrarRequisitosPassword();
});

document.getElementById('modalPassword')?.addEventListener('focus', function() {
    document.getElementById('modalPasswordRequirements').classList.add('show');
});

document.getElementById('modalPasswordConfirm')?.addEventListener('input', validarPasswordConfirm);

// Guardar socio
document.getElementById('btnGuardarSocio')?.addEventListener('click', guardarSocio);

function validarNombre() {
    const nombre = document.getElementById('modalNombre').value.trim();
    const error = document.getElementById('modalNombreError');
    
    if (!nombre) {
        error.textContent = 'El nombre completo es obligatorio';
        return false;
    }
    
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(nombre)) {
        error.textContent = 'El nombre solo puede contener letras';
        return false;
    }
    
    if (nombre.length < 3) {
        error.textContent = 'El nombre debe tener al menos 3 caracteres';
        return false;
    }
    
    error.textContent = '';
    return true;
}

function validarEmail() {
    const email = document.getElementById('modalEmail').value.trim();
    const error = document.getElementById('modalEmailError');
    
    if (!email) {
        error.textContent = 'El correo electrónico es obligatorio';
        return false;
    }
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        error.textContent = 'Formato de correo inválido';
        return false;
    }
    
    const dominiosPermitidos = [
        'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
        'live.com', 'icloud.com', 'protonmail.com'
    ];
    
    const dominio = email.split('@')[1]?.toLowerCase();
    if (!dominiosPermitidos.includes(dominio)) {
        error.textContent = 'Solo se permiten dominios comunes (gmail, hotmail, outlook, yahoo)';
        return false;
    }
    
    error.textContent = '';
    return true;
}

function validarTelefono() {
    const telefono = document.getElementById('modalTelefono').value.trim();
    const error = document.getElementById('modalTelefonoError');
    
    const telefonoLimpio = telefono.replace(/\D/g, '');
    document.getElementById('modalTelefono').value = telefonoLimpio;
    
    if (!telefonoLimpio) {
        error.textContent = 'El teléfono es obligatorio';
        return false;
    }
    
    if (telefonoLimpio.length !== 10) {
        error.textContent = 'El teléfono debe tener exactamente 10 dígitos';
        return false;
    }
    
    error.textContent = '';
    return true;
}

function validarPassword() {
    const password = document.getElementById('modalPassword').value;
    const error = document.getElementById('modalPasswordError');
    
    const requisitos = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[@$!%*?&]/.test(password)
    };
    
    document.getElementById('modal-req-length').className = requisitos.length ? 'requirement valid' : 'requirement invalid';
    document.getElementById('modal-req-uppercase').className = requisitos.uppercase ? 'requirement valid' : 'requirement invalid';
    document.getElementById('modal-req-lowercase').className = requisitos.lowercase ? 'requirement valid' : 'requirement invalid';
    document.getElementById('modal-req-number').className = requisitos.number ? 'requirement valid' : 'requirement invalid';
    document.getElementById('modal-req-special').className = requisitos.special ? 'requirement valid' : 'requirement invalid';
    
    const todosValidos = Object.values(requisitos).every(v => v);
    
    if (!password) {
        error.textContent = 'La contraseña es obligatoria';
        return false;
    }
    
    if (!todosValidos) {
        error.textContent = 'La contraseña no cumple con todos los requisitos';
        return false;
    }
    
    const fortaleza = calcularFortaleza(requisitos);
    mostrarFortaleza(fortaleza);
    
    error.textContent = '';
    return true;
}

function calcularFortaleza(requisitos) {
    const cumplidos = Object.values(requisitos).filter(v => v).length;
    if (cumplidos === 5) return 'strong';
    if (cumplidos >= 3) return 'medium';
    return 'weak';
}

function mostrarFortaleza(fortaleza) {
    const strengthDiv = document.getElementById('modalPasswordStrength');
    
    const textos = {
        weak: 'Contraseña débil',
        medium: 'Contraseña media',
        strong: 'Contraseña fuerte'
    };
    
    strengthDiv.textContent = textos[fortaleza];
    strengthDiv.className = `password-strength show strength-${fortaleza}`;
}

function mostrarRequisitosPassword() {
    document.getElementById('modalPasswordRequirements').classList.add('show');
}

function validarPasswordConfirm() {
    const password = document.getElementById('modalPassword').value;
    const passwordConfirm = document.getElementById('modalPasswordConfirm').value;
    const error = document.getElementById('modalPasswordConfirmError');
    
    if (!passwordConfirm) {
        error.textContent = 'Debes confirmar tu contraseña';
        return false;
    }
    
    if (password !== passwordConfirm) {
        error.textContent = 'Las contraseñas no coinciden';
        return false;
    }
    
    error.textContent = '';
    return true;
}

function mostrarMensaje(texto, tipo) {
    const container = document.getElementById('modalMessage');
    container.innerHTML = `<div class="message message-${tipo}">${texto}</div>`;
    
    if (tipo === 'success') {
        setTimeout(() => {
            container.innerHTML = '';
        }, 3000);
    }
}

async function guardarSocio() {
    // Validar todos los campos
    const nombreValido = validarNombre();
    const emailValido = validarEmail();
    const telefonoValido = validarTelefono();
    const passwordValido = validarPassword();
    const passwordConfirmValido = validarPasswordConfirm();
    
    if (!nombreValido || !emailValido || !telefonoValido || !passwordValido || !passwordConfirmValido) {
        mostrarMensaje('Por favor corrige los errores en el formulario', 'error');
        return;
    }
    
    const nombre = document.getElementById('modalNombre').value.trim();
    const email = document.getElementById('modalEmail').value.trim();
    const telefono = document.getElementById('modalTelefono').value.trim();
    const password = document.getElementById('modalPassword').value;
    
    const btnGuardar = document.getElementById('btnGuardarSocio');
    const btnText = document.getElementById('btnGuardarText');
    const btnLoader = document.getElementById('btnGuardarLoader');
    
    try {
        btnGuardar.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        
        console.log('Creando nuevo socio:', email);
        
        if (!window.supabaseClient) {
            throw new Error('Cliente de Supabase no inicializado');
        }
        
        // Verificar si el email ya existe
        const { data: usuarioExistente } = await window.supabaseClient
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        
        if (usuarioExistente) {
            throw new Error('Este correo ya está registrado');
        }
        
        // Crear usuario (el trigger creará el socio automáticamente)
        const { data: nuevoUsuario, error: errorUsuario } = await window.supabaseClient
            .from('usuarios')
            .insert({
                email: email,
                password_hash: password,
                nombre_completo: nombre,
                telefono: telefono,
                tipo_usuario: 'socio',
                estado: 'activo'
            })
            .select()
            .single();
        
        if (errorUsuario) {
            console.error('Error al crear usuario:', errorUsuario);
            throw errorUsuario;
        }
        
        console.log('Socio creado:', nuevoUsuario.email);
        
        mostrarMensaje('¡Socio creado exitosamente!', 'success');
        
        // Recargar lista de socios
        setTimeout(async () => {
            await cargarDatos();
            cerrarModal();
        }, 1500);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje(error.message || 'Error al crear socio', 'error');
    } finally {
        btnGuardar.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

console.log('Modal de agregar socio cargado');
JSMODAL
cat /mnt/user-data/outputs/modal-agregar-socio.js
Salida

// modal-agregar-socio.js
// JavaScript para el modal de agregar socio con validaciones completas

// Abrir modal
document.getElementById('btnAgregarSocio')?.addEventListener('click', abrirModal);

function abrirModal() {
    document.getElementById('modalAgregarSocio').classList.add('show');
    limpiarFormulario();
}

function cerrarModal() {
    document.getElementById('modalAgregarSocio').classList.remove('show');
    limpiarFormulario();
}

function limpiarFormulario() {
    document.getElementById('formNuevoSocio').reset();
    document.getElementById('modalMessage').innerHTML = '';
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.getElementById('modalPasswordStrength').className = 'password-strength';
    document.getElementById('modalPasswordRequirements').classList.remove('show');
}

// Cerrar modal al hacer clic fuera
document.getElementById('modalAgregarSocio')?.addEventListener('click', function(e) {
    if (e.target === this) {
        cerrarModal();
    }
});

// Validaciones en tiempo real
document.getElementById('modalNombre')?.addEventListener('input', validarNombre);
document.getElementById('modalNombre')?.addEventListener('blur', validarNombre);

document.getElementById('modalEmail')?.addEventListener('blur', validarEmail);

document.getElementById('modalTelefono')?.addEventListener('input', validarTelefono);
document.getElementById('modalTelefono')?.addEventListener('blur', validarTelefono);

document.getElementById('modalPassword')?.addEventListener('input', function() {
    validarPassword();
    mostrarRequisitosPassword();
});

document.getElementById('modalPassword')?.addEventListener('focus', function() {
    document.getElementById('modalPasswordRequirements').classList.add('show');
});

document.getElementById('modalPasswordConfirm')?.addEventListener('input', validarPasswordConfirm);

// Guardar socio
document.getElementById('btnGuardarSocio')?.addEventListener('click', guardarSocio);

function validarNombre() {
    const nombre = document.getElementById('modalNombre').value.trim();
    const error = document.getElementById('modalNombreError');
    
    if (!nombre) {
        error.textContent = 'El nombre completo es obligatorio';
        return false;
    }
    
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(nombre)) {
        error.textContent = 'El nombre solo puede contener letras';
        return false;
    }
    
    if (nombre.length < 3) {
        error.textContent = 'El nombre debe tener al menos 3 caracteres';
        return false;
    }
    
    error.textContent = '';
    return true;
}

function validarEmail() {
    const email = document.getElementById('modalEmail').value.trim();
    const error = document.getElementById('modalEmailError');
    
    if (!email) {
        error.textContent = 'El correo electrónico es obligatorio';
        return false;
    }
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        error.textContent = 'Formato de correo inválido';
        return false;
    }
    
    const dominiosPermitidos = [
        'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
        'live.com', 'icloud.com', 'protonmail.com'
    ];
    
    const dominio = email.split('@')[1]?.toLowerCase();
    if (!dominiosPermitidos.includes(dominio)) {
        error.textContent = 'Solo se permiten dominios comunes (gmail, hotmail, outlook, yahoo)';
        return false;
    }
    
    error.textContent = '';
    return true;
}

function validarTelefono() {
    const telefono = document.getElementById('modalTelefono').value.trim();
    const error = document.getElementById('modalTelefonoError');
    
    const telefonoLimpio = telefono.replace(/\D/g, '');
    document.getElementById('modalTelefono').value = telefonoLimpio;
    
    if (!telefonoLimpio) {
        error.textContent = 'El teléfono es obligatorio';
        return false;
    }
    
    if (telefonoLimpio.length !== 10) {
        error.textContent = 'El teléfono debe tener exactamente 10 dígitos';
        return false;
    }
    
    error.textContent = '';
    return true;
}

function validarPassword() {
    const password = document.getElementById('modalPassword').value;
    const error = document.getElementById('modalPasswordError');
    
    const requisitos = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[@$!%*?&]/.test(password)
    };
    
    document.getElementById('modal-req-length').className = requisitos.length ? 'requirement valid' : 'requirement invalid';
    document.getElementById('modal-req-uppercase').className = requisitos.uppercase ? 'requirement valid' : 'requirement invalid';
    document.getElementById('modal-req-lowercase').className = requisitos.lowercase ? 'requirement valid' : 'requirement invalid';
    document.getElementById('modal-req-number').className = requisitos.number ? 'requirement valid' : 'requirement invalid';
    document.getElementById('modal-req-special').className = requisitos.special ? 'requirement valid' : 'requirement invalid';
    
    const todosValidos = Object.values(requisitos).every(v => v);
    
    if (!password) {
        error.textContent = 'La contraseña es obligatoria';
        return false;
    }
    
    if (!todosValidos) {
        error.textContent = 'La contraseña no cumple con todos los requisitos';
        return false;
    }
    
    const fortaleza = calcularFortaleza(requisitos);
    mostrarFortaleza(fortaleza);
    
    error.textContent = '';
    return true;
}

function calcularFortaleza(requisitos) {
    const cumplidos = Object.values(requisitos).filter(v => v).length;
    if (cumplidos === 5) return 'strong';
    if (cumplidos >= 3) return 'medium';
    return 'weak';
}

function mostrarFortaleza(fortaleza) {
    const strengthDiv = document.getElementById('modalPasswordStrength');
    
    const textos = {
        weak: 'Contraseña débil',
        medium: 'Contraseña media',
        strong: 'Contraseña fuerte'
    };
    
    strengthDiv.textContent = textos[fortaleza];
    strengthDiv.className = `password-strength show strength-${fortaleza}`;
}

function mostrarRequisitosPassword() {
    document.getElementById('modalPasswordRequirements').classList.add('show');
}

function validarPasswordConfirm() {
    const password = document.getElementById('modalPassword').value;
    const passwordConfirm = document.getElementById('modalPasswordConfirm').value;
    const error = document.getElementById('modalPasswordConfirmError');
    
    if (!passwordConfirm) {
        error.textContent = 'Debes confirmar tu contraseña';
        return false;
    }
    
    if (password !== passwordConfirm) {
        error.textContent = 'Las contraseñas no coinciden';
        return false;
    }
    
    error.textContent = '';
    return true;
}

function mostrarMensaje(texto, tipo) {
    const container = document.getElementById('modalMessage');
    container.innerHTML = `<div class="message message-${tipo}">${texto}</div>`;
    
    if (tipo === 'success') {
        setTimeout(() => {
            container.innerHTML = '';
        }, 3000);
    }
}

async function guardarSocio() {
    // Validar todos los campos
    const nombreValido = validarNombre();
    const emailValido = validarEmail();
    const telefonoValido = validarTelefono();
    const passwordValido = validarPassword();
    const passwordConfirmValido = validarPasswordConfirm();
    
    if (!nombreValido || !emailValido || !telefonoValido || !passwordValido || !passwordConfirmValido) {
        mostrarMensaje('Por favor corrige los errores en el formulario', 'error');
        return;
    }
    
    const nombre = document.getElementById('modalNombre').value.trim();
    const email = document.getElementById('modalEmail').value.trim();
    const telefono = document.getElementById('modalTelefono').value.trim();
    const password = document.getElementById('modalPassword').value;
    
    const btnGuardar = document.getElementById('btnGuardarSocio');
    const btnText = document.getElementById('btnGuardarText');
    const btnLoader = document.getElementById('btnGuardarLoader');
    
    try {
        btnGuardar.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        
        console.log('Creando nuevo socio:', email);
        
        if (!window.supabaseClient) {
            throw new Error('Cliente de Supabase no inicializado');
        }
        
        // Verificar si el email ya existe
        const { data: usuarioExistente } = await window.supabaseClient
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        
        if (usuarioExistente) {
            throw new Error('Este correo ya está registrado');
        }
        
        // Crear usuario (el trigger creará el socio automáticamente)
        const { data: nuevoUsuario, error: errorUsuario } = await window.supabaseClient
            .from('usuarios')
            .insert({
                email: email,
                password_hash: password,
                nombre_completo: nombre,
                telefono: telefono,
                tipo_usuario: 'socio',
                estado: 'activo'
            })
            .select()
            .single();
        
        if (errorUsuario) {
            console.error('Error al crear usuario:', errorUsuario);
            throw errorUsuario;
        }
        
        console.log('Socio creado:', nuevoUsuario.email);
        
        mostrarMensaje('¡Socio creado exitosamente!', 'success');
        
        // Recargar lista de socios
        setTimeout(async () => {
            await cargarDatos();
            cerrarModal();
        }, 1500);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje(error.message || 'Error al crear socio', 'error');
    } finally {
        btnGuardar.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

console.log('Modal de agregar socio cargado');