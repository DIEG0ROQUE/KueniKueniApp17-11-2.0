// ============================================
// MÓDULO DE GESTIÓN DE SUSCRIPCIONES
// Incluye botón para activar/cancelar suscripción
// ============================================

/**
 * ⭐ NUEVA FUNCIÓN: Gestionar botón de suscripción
 * Muestra botón "Activar" o "Cancelar" según el estado actual
 */
async function mostrarBotonGestionSuscripcion(socioId) {
    const container = document.getElementById('btnSuscripcionContainer');
    if (!container) {
        console.warn('Container de botón de suscripción no encontrado');
        return;
    }
    
    try {
        // Verificar si hay suscripción activa
        const { data: suscripcion, error } = await window.supabaseClient
            .from('suscripciones_mensuales')
            .select('*')
            .eq('socio_id', socioId)
            .eq('estado', 'activa')
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error al verificar suscripción:', error);
            return;
        }
        
        // Renderizar botón según el estado
        if (suscripcion) {
            // Hay suscripción activa - Mostrar botón CANCELAR
            container.innerHTML = `
                <button id="btnCancelarSuscripcion" class="btn-suscripcion btn-cancelar">
                    <span class="btn-icon">❌</span>
                    <span>Cancelar Suscripción</span>
                </button>
            `;
            
            // Event listener para cancelar
            document.getElementById('btnCancelarSuscripcion').addEventListener('click', () => {
                confirmarCancelacion Suscripcion(socioId, suscripcion.id);
            });
            
        } else {
            // No hay suscripción - Mostrar botón ACTIVAR
            container.innerHTML = `
                <button id="btnActivarSuscripcion" class="btn-suscripcion btn-activar">
                    <span class="btn-icon">✅</span>
                    <span>Activar Suscripción</span>
                </button>
            `;
            
            // Event listener para activar
            document.getElementById('btnActivarSuscripcion').addEventListener('click', () => {
                abrirModalNuevaSuscripcion();
            });
        }
        
    } catch (error) {
        console.error('Error al gestionar botón de suscripción:', error);
    }
}

/**
 * ⭐ FUNCIÓN: Confirmar cancelación de suscripción
 */
function confirmarCancelacionSuscripcion(socioId, suscripcionId) {
    // Crear modal de confirmación
    const modalHTML = `
        <div id="modalConfirmacionCancelacion" class="modal-overlay">
            <div class="modal-content">
                <h3>⚠️ Confirmar Cancelación</h3>
                <p>¿Estás seguro que deseas cancelar tu suscripción?</p>
                <p class="warning-text">Al cancelar:</p>
                <ul class="warning-list">
                    <li>Tu cuenta pasará a estado <strong>INACTIVO</strong></li>
                    <li>No podrás acceder a eventos ni funcionalidades</li>
                    <li>Solo podrás ver tu perfil</li>
                    <li>Podrás reactivarla en cualquier momento</li>
                </ul>
                
                <div class="modal-actions">
                    <button id="btnConfirmarCancelacion" class="btn-danger">
                        Sí, cancelar suscripción
                    </button>
                    <button id="btnCancelarModal" class="btn-secondary">
                        No, mantener activa
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Event listeners
    document.getElementById('btnConfirmarCancelacion').addEventListener('click', () => {
        cancelarSuscripcion(socioId, suscripcionId);
    });
    
    document.getElementById('btnCancelarModal').addEventListener('click', () => {
        document.getElementById('modalConfirmacionCancelacion').remove();
    });
}

/**
 * ⭐ FUNCIÓN: Cancelar suscripción y cambiar estado a inactivo
 */
async function cancelarSuscripcion(socioId, suscripcionId) {
    const btn = document.getElementById('btnConfirmarCancelacion');
    btn.disabled = true;
    btn.textContent = 'Cancelando...';
    
    try {
        // 1. Cancelar la suscripción
        const { error: errorSuscripcion } = await window.supabaseClient
            .from('suscripciones_mensuales')
            .update({ 
                estado: 'cancelada',
                fecha_cancelacion: new Date().toISOString()
            })
            .eq('id', suscripcionId);
        
        if (errorSuscripcion) {
            throw new Error('Error al cancelar suscripción');
        }
        
        // 2. Cambiar estado del usuario a INACTIVO
        const userId = sessionStorage.getItem('userId');
        const { error: errorUsuario } = await window.supabaseClient
            .from('usuarios')
            .update({ estado: 'inactivo' })
            .eq('id', userId);
        
        if (errorUsuario) {
            throw new Error('Error al actualizar estado del usuario');
        }
        
        // 3. Actualizar sessionStorage
        sessionStorage.setItem('userEstado', 'inactivo');
        
        // 4. Mostrar éxito y recargar
        document.getElementById('modalConfirmacionCancelacion').remove();
        
        mostrarMensaje('✅ Suscripción cancelada. Tu cuenta está ahora INACTIVA.', 'warning');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('Error al cancelar:', error);
        mostrarMensaje('❌ Error al cancelar la suscripción. Intenta nuevamente.', 'error');
        btn.disabled = false;
        btn.textContent = 'Sí, cancelar suscripción';
    }
}

/**
 * ⭐ FUNCIÓN: Abrir modal para nueva suscripción
 */
function abrirModalNuevaSuscripcion() {
    // Redirigir a la sección de crear suscripción o abrir modal
    const btnSuscripcionMensual = document.getElementById('btnSuscripcionMensual');
    if (btnSuscripcionMensual) {
        btnSuscripcionMensual.click();
    } else {
        mostrarMensaje('ℹ️ Por favor, crea una suscripción mensual para activar tu cuenta.', 'info');
        // Scroll a la sección de suscripciones
        document.getElementById('suscripcionButtons')?.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * ⭐ FUNCIÓN: Activar usuario después de crear suscripción
 * Debe llamarse después de que la suscripción sea exitosa
 */
async function activarUsuarioDespuesSuscripcion() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        const { error } = await window.supabaseClient
            .from('usuarios')
            .update({ estado: 'activo' })
            .eq('id', userId);
        
        if (error) {
            console.error('Error al activar usuario:', error);
            return false;
        }
        
        // Actualizar sessionStorage
        sessionStorage.setItem('userEstado', 'activo');
        
        console.log('✅ Usuario activado exitosamente');
        return true;
        
    } catch (error) {
        console.error('Error inesperado:', error);
        return false;
    }
}

/**
 * ⭐ MODIFICACIÓN: Agregar activación al crear suscripción exitosa
 * Esta función debe integrarse en el flujo de creación de suscripción
 */
async function procesarSuscripcionExitosa(socioId, datosSuscripcion) {
    try {
        // 1. Guardar suscripción (código existente)
        const { data, error } = await window.supabaseClient
            .from('suscripciones_mensuales')
            .insert({
                socio_id: socioId,
                ...datosSuscripcion,
                estado: 'activa'
            })
            .select()
            .single();
        
        if (error) {
            throw new Error('Error al guardar suscripción');
        }
        
        // 2. ⭐ ACTIVAR USUARIO
        const activado = await activarUsuarioDespuesSuscripcion();
        
        if (activado) {
            mostrarMensaje('✅ ¡Suscripción creada! Tu cuenta está ahora ACTIVA.', 'success');
        } else {
            mostrarMensaje('⚠️ Suscripción creada, pero hubo un problema al activar tu cuenta.', 'warning');
        }
        
        // 3. Recargar página
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
        return data;
        
    } catch (error) {
        console.error('Error al procesar suscripción:', error);
        throw error;
    }
}

// ============================================
// ESTILOS PARA BOTONES DE SUSCRIPCIÓN
// ============================================
const estilosBotonSuscripcion = `
    <style>
        #btnSuscripcionContainer {
            margin: 1.5rem 0;
            display: flex;
            justify-content: center;
        }
        
        .btn-suscripcion {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 2rem;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .btn-suscripcion:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
        
        .btn-activar {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
        }
        
        .btn-cancelar {
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            color: white;
        }
        
        .btn-icon {
            font-size: 1.3rem;
        }
        
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .modal-content {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            animation: slideUp 0.3s;
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
        
        .modal-content h3 {
            margin: 0 0 1rem 0;
            color: #DC2626;
            font-size: 1.5rem;
        }
        
        .modal-content p {
            margin: 0.5rem 0;
            color: #374151;
            line-height: 1.6;
        }
        
        .warning-text {
            font-weight: 600;
            color: #B45309;
            margin-top: 1rem;
        }
        
        .warning-list {
            list-style: none;
            padding: 0;
            margin: 1rem 0;
        }
        
        .warning-list li {
            padding: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
            color: #6B7280;
        }
        
        .warning-list li:before {
            content: "⚠️";
            position: absolute;
            left: 0;
        }
        
        .warning-list strong {
            color: #DC2626;
        }
        
        .modal-actions {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
        }
        
        .btn-danger {
            flex: 1;
            padding: 0.75rem 1.5rem;
            background: #DC2626;
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-danger:hover {
            background: #B91C1C;
        }
        
        .btn-secondary {
            flex: 1;
            padding: 0.75rem 1.5rem;
            background: #E5E7EB;
            color: #374151;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-secondary:hover {
            background: #D1D5DB;
        }
    </style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', estilosBotonSuscripcion);

// ============================================
// EXPORTAR FUNCIONES (si usas módulos)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        mostrarBotonGestionSuscripcion,
        activarUsuarioDespuesSuscripcion,
        procesarSuscripcionExitosa
    };
}
