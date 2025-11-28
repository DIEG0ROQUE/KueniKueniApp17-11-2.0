// donante-donar.js - Sistema de donaciones con autocompletado y BD

document.addEventListener('DOMContentLoaded', async function() {
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
    const userId = sessionStorage.getItem('userId');
    
    console.log('Usuario logueado:', { userName, userEmail, userId });
    
    // Autocompletar formulario
    const nombreInput = document.getElementById('nombre');
    const emailInput = document.getElementById('email');
    
    if (nombreInput && userName) {
        nombreInput.value = userName;
        nombreInput.readOnly = true;
        nombreInput.style.backgroundColor = '#f3f4f6';
        nombreInput.style.cursor = 'not-allowed';
    }
    
    if (emailInput && userEmail) {
        emailInput.value = userEmail;
        emailInput.readOnly = true;
        emailInput.style.backgroundColor = '#f3f4f6';
        emailInput.style.cursor = 'not-allowed';
    }
    
    // ============================================
    // AUTOSELECCIONAR DESTINO SI VIENE DE UN PROYECTO
    // ============================================
    const destinoSeleccionado = sessionStorage.getItem('destinoSeleccionado');
    const proyectoNombre = sessionStorage.getItem('proyectoNombre');
    const destinoSelect = document.getElementById('destino');
    
    if (destinoSeleccionado && destinoSelect) {
        destinoSelect.value = destinoSeleccionado;
        
        // Actualizar el resumen
        const summaryDestino = document.getElementById('summaryDestino');
        if (summaryDestino) {
            const selectedOption = destinoSelect.options[destinoSelect.selectedIndex];
            summaryDestino.textContent = selectedOption.text;
        }
        
        console.log('Destino autoseleccionado:', destinoSeleccionado);
        console.log('Proyecto:', proyectoNombre);
        
        // Mostrar mensaje informativo
        mostrarMensajeInfo(`Donación para: ${proyectoNombre}`);
        
        // Limpiar sessionStorage después de usarlo
        sessionStorage.removeItem('destinoSeleccionado');
        sessionStorage.removeItem('proyectoNombre');
    }
    
    // ============================================
    // VARIABLES GLOBALES
    // ============================================
    let selectedAmount = 0;
    let isCustomAmount = false;
    
    // ============================================
    // ELEMENTOS DEL DOM
    // ============================================
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    const donationAmountSpan = document.getElementById('donationAmount');
    const summaryAmountSpan = document.getElementById('summaryAmount');
    const impactAmountSpan = document.getElementById('impactAmount');
    const summaryTypeBadge = document.getElementById('summaryType');
    const summaryDestino = document.getElementById('summaryDestino');
    const tipoRadios = document.querySelectorAll('input[name="tipo"]');
    const donationForm = document.getElementById('donationForm');
    
    // Card inputs
    const cardNumber = document.getElementById('cardNumber');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');
    
    // ============================================
    // MANEJO DE SELECCIÓN DE MONTOS
    // ============================================
    amountButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            amountButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const amount = this.getAttribute('data-amount');
            
            if (amount === 'otro') {
                isCustomAmount = true;
                customAmountInput.style.display = 'block';
                customAmountInput.focus();
                selectedAmount = parseInt(customAmountInput.value) || 0;
            } else {
                isCustomAmount = false;
                customAmountInput.style.display = 'none';
                selectedAmount = parseInt(amount);
            }
            
            updateAmounts(selectedAmount);
        });
    });
    
    // ============================================
    // MONTO PERSONALIZADO
    // ============================================
    if (customAmountInput) {
        customAmountInput.addEventListener('input', function() {
            selectedAmount = parseInt(this.value) || 0;
            updateAmounts(selectedAmount);
        });
    }
    
    // ============================================
    // ACTUALIZAR MONTOS EN TIEMPO REAL
    // ============================================
    function updateAmounts(amount) {
        const formatted = amount.toLocaleString('es-MX');
        
        if (donationAmountSpan) donationAmountSpan.textContent = formatted;
        if (summaryAmountSpan) summaryAmountSpan.textContent = `$${formatted} MXN`;
        if (impactAmountSpan) impactAmountSpan.textContent = formatted;
    }
    
    // ============================================
    // CAMBIO DE TIPO DE DONACIÓN
    // ============================================
    tipoRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (summaryTypeBadge) {
                summaryTypeBadge.textContent = this.value === 'unica' ? 'Única' : 'Mensual';
            }
        });
    });
    
    // ============================================
    // CAMBIO DE DESTINO
    // ============================================
    if (destinoSelect) {
        destinoSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (summaryDestino) {
                summaryDestino.textContent = selectedOption.text;
            }
        });
    }
    
    // ============================================
    // FORMATEO DE TARJETA
    // ============================================
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    if (expiry) {
        expiry.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }
    
    if (cvv) {
        cvv.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
    
    // ============================================
    // OBTENER TELÉFONO DEL USUARIO
    // ============================================
    let userPhone = null;
    
    if (window.supabaseClient && userId) {
        try {
            const { data: usuario, error } = await window.supabaseClient
                .from('usuarios')
                .select('telefono')
                .eq('id', userId)
                .single();
            
            if (!error && usuario) {
                userPhone = usuario.telefono;
                console.log('Teléfono obtenido:', userPhone);
            }
        } catch (error) {
            console.log('No se pudo obtener teléfono:', error);
        }
    }
    
    // ============================================
    // SUBMIT DEL FORMULARIO
    // ============================================
    if (donationForm) {
        donationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (selectedAmount === 0 || selectedAmount < 10) {
                mostrarMensaje('Por favor selecciona un monto de donación válido (mínimo $10 MXN)', 'error');
                return;
            }
            
            if (!validarTarjeta()) {
                return;
            }
            
            const socioId = sessionStorage.getItem('socioId') || null;
            
            const donacionData = {
                donante_nombre: userName,
                donante_email: userEmail,
                donante_telefono: userPhone,
                monto: selectedAmount,
                moneda: 'MXN',
                metodo_pago: 'tarjeta',
                estado_pago: 'completado',
                descripcion: obtenerDescripcionDonacion(),
                referencia_pago: generarReferenciaPago(),
                socio_id: socioId
            };
            
            console.log('Datos de donación:', donacionData);
            
            await guardarDonacion(donacionData);
        });
    }
    
    // ============================================
    // VALIDAR TARJETA
    // ============================================
    function validarTarjeta() {
        const cardNum = cardNumber.value.replace(/\s/g, '');
        const expiryVal = expiry.value;
        const cvvVal = cvv.value;
        
        if (cardNum.length < 15 || cardNum.length > 16) {
            mostrarMensaje('Número de tarjeta inválido (15-16 dígitos)', 'error');
            cardNumber.focus();
            return false;
        }
        
        if (!/^\d{2}\/\d{2}$/.test(expiryVal)) {
            mostrarMensaje('Fecha de expiración inválida (MM/AA)', 'error');
            expiry.focus();
            return false;
        }
        
        const [month, year] = expiryVal.split('/');
        const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const today = new Date();
        today.setDate(1);
        
        if (expDate < today) {
            mostrarMensaje('La tarjeta está vencida', 'error');
            expiry.focus();
            return false;
        }
        
        if (cvvVal.length < 3 || cvvVal.length > 4) {
            mostrarMensaje('CVV inválido (3-4 dígitos)', 'error');
            cvv.focus();
            return false;
        }
        
        return true;
    }
    
    // ============================================
    // GUARDAR DONACIÓN EN SUPABASE
    // ============================================
    async function guardarDonacion(datos) {
        if (!window.supabaseClient) {
            mostrarMensaje('Error: No se pudo conectar con la base de datos', 'error');
            console.error('Supabase no está configurado');
            return;
        }
        
        try {
            mostrarCargando(true);
            
            console.log('Guardando donación en la base de datos...');
            
            const { data, error } = await window.supabaseClient
                .from('donaciones')
                .insert([datos])
                .select();
            
            if (error) {
                console.error('Error al guardar donación:', error);
                mostrarMensaje('Error al procesar la donación. Por favor intenta nuevamente.', 'error');
                return;
            }
            
            console.log('Donación guardada exitosamente:', data);
            
            mostrarMensajeExito(datos);
            
            setTimeout(() => {
                limpiarFormulario();
            }, 4000);
            
        } catch (error) {
            console.error('Error inesperado:', error);
            mostrarMensaje('Error al procesar la donación', 'error');
        } finally {
            mostrarCargando(false);
        }
    }
    
    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================
    function obtenerDescripcionDonacion() {
        const destino = destinoSelect.options[destinoSelect.selectedIndex].text;
        const tipo = document.querySelector('input[name="tipo"]:checked').value;
        const mensaje = document.getElementById('mensaje').value.trim();
        
        let descripcion = `Donación ${tipo === 'unica' ? 'única' : 'mensual'} para ${destino}`;
        if (mensaje) {
            descripcion += ` - Mensaje: ${mensaje}`;
        }
        
        return descripcion;
    }
    
    function generarReferenciaPago() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `DON-${timestamp}-${random}`;
    }
    
    function limpiarFormulario() {
        amountButtons.forEach(b => b.classList.remove('active'));
        customAmountInput.style.display = 'none';
        customAmountInput.value = '';
        selectedAmount = 0;
        updateAmounts(0);
        
        cardNumber.value = '';
        expiry.value = '';
        cvv.value = '';
        
        document.getElementById('mensaje').value = '';
        
        document.querySelector('input[name="tipo"][value="unica"]').checked = true;
        destinoSelect.selectedIndex = 0;
        
        if (summaryTypeBadge) summaryTypeBadge.textContent = 'Única';
        if (summaryDestino) summaryDestino.textContent = 'Apoyo General';
        
        console.log('🧹 Formulario limpiado');
    }
    
    // ============================================
    // UI - MENSAJES
    // ============================================
    function mostrarMensaje(mensaje, tipo) {
        let container = document.querySelector('.message-container');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'message-container';
            donationForm.insertBefore(container, donationForm.firstChild);
        }
        
        container.innerHTML = `
            <div class="message message-${tipo}">
                <div class="message-icon">
                    ${tipo === 'error' ? '⚠️' : '✓'}
                </div>
                <div class="message-text">${mensaje}</div>
            </div>
        `;
        
        setTimeout(() => {
            const msg = container.querySelector('.message');
            if (msg) {
                msg.style.opacity = '0';
                setTimeout(() => container.remove(), 300);
            }
        }, 5000);
        
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    function mostrarMensajeInfo(mensaje) {
        let container = document.querySelector('.info-container');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'info-container';
            const formCard = document.querySelector('.form-card');
            if (formCard) {
                formCard.insertBefore(container, formCard.firstChild);
            }
        }
        
        container.innerHTML = `
            <div class="message message-info">
                <div class="message-icon">ℹ</div>
                <div class="message-text">${mensaje}</div>
            </div>
        `;
        
        setTimeout(() => {
            container.style.opacity = '0';
            setTimeout(() => container.remove(), 300);
        }, 5000);
    }
    
    function mostrarMensajeExito(datos) {
        let container = document.querySelector('.message-container');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'message-container';
            donationForm.insertBefore(container, donationForm.firstChild);
        }
        
        container.innerHTML = `
            <div class="message message-success">
                <div class="success-icon"></div>
                <h3 class="success-title">¡Donación Exitosa!</h3>
                <p class="success-text">
                    Gracias <strong>${datos.donante_nombre}</strong> por tu donación de 
                    <strong>$${datos.monto.toLocaleString('es-MX')} MXN</strong>
                </p>
                <p class="success-reference">
                    Referencia: <span>${datos.referencia_pago}</span>
                </p>
                <p class="success-email">
                    Recibirás un comprobante fiscal en <strong>${datos.donante_email}</strong>
                </p>
                <p class="success-impact">
                    Tu apoyo hace la diferencia en nuestra comunidad 
                </p>
            </div>
        `;
        
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    function mostrarCargando(mostrar) {
        const submitBtn = donationForm.querySelector('button[type="submit"]');
        
        if (mostrar) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="loader-inline"></span>
                Procesando donación...
            `;
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Donar $<span id="donationAmount">${selectedAmount.toLocaleString('es-MX')}</span> MXN`;
            
            const newSpan = submitBtn.querySelector('#donationAmount');
            if (newSpan) {
                updateAmounts(selectedAmount);
            }
        }
    }
    
    updateAmounts(0);
    console.log('Sistema de donaciones inicializado correctamente');
});

// ============================================
// ESTILOS ADICIONALES
// ============================================
const styles = document.createElement('style');
styles.textContent = `
    .message-container, .info-container {
        margin-bottom: 1.5rem;
        animation: slideDown 0.3s ease-out;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .message {
        padding: 1rem 1.25rem;
        border-radius: 8px;
        font-size: 0.9rem;
        transition: opacity 0.3s;
        display: flex;
        align-items: flex-start;
        gap: 12px;
    }
    
    .message-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
    }
    
    .message-text {
        flex: 1;
    }
    
    .message-error {
        background: #fee2e2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }
    
    .message-info {
        background: #dbeafe;
        color: #1e40af;
        border: 1px solid #93c5fd;
    }
    
    .message-success {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        color: #5f0d51;
        border: 1px solid #6ee7b7;
        padding: 1.5rem;
        text-align: center;
    }
    
    .success-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
        animation: bounce 0.6s ease-out;
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
    }
    
    .success-title {
        margin: 0 0 0.75rem 0;
        color: #5f0d51;
        font-size: 1.5rem;
        font-weight: 700;
    }
    
    .success-text {
        margin: 0.5rem 0;
        font-size: 1rem;
        line-height: 1.5;
    }
    
    .success-reference {
        margin: 0.75rem 0;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 6px;
        font-size: 0.875rem;
    }
    
    .success-reference span {
        font-family: 'Courier New', monospace;
        font-weight: 600;
        color: #5f0d51;
    }
    
    .success-email {
        margin: 0.5rem 0;
        font-size: 0.875rem;
        opacity: 0.9;
    }
    
    .success-impact {
        margin: 1rem 0 0 0;
        font-size: 1rem;
        font-weight: 600;
        color: #5f0d51;
    }
    
    .loader-inline {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .amount-btn.active {
        background: #5f0d51;
        color: white;
        border-color: #5f0d51;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(95, 13, 70, 0.3);
    }
    
    input[readonly] {
        background-color: #f3f4f6 !important;
        cursor: not-allowed !important;
        color: #6b7280;
    }
`;
document.head.appendChild(styles);