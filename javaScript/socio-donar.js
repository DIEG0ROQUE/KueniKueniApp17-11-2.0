// socio-donar.js - Sistema de donaciones para socios (CORREGIDO)
// ============================================================================


const EMAIL_SERVER_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async function() {
    // ============================================
    // VERIFICAR AUTENTICACIÓN
    // ============================================
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (!isLoggedIn || userType !== 'socio') {
        window.location.href = 'login.html';
        return;
    }
    
    // ============================================
    // OBTENER DATOS DEL SOCIO
    // ============================================
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem('userId');
    const socioId = sessionStorage.getItem('socioId');
    
    console.log('Socio logueado:', { 
        userName, 
        userEmail, 
        userId, 
        socioId 
    });
    
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
    const destinoSelect = document.getElementById('destino');
    
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
    // OBTENER TELÉFONO DEL SOCIO
    // ============================================
    let userPhone = null;
    
    if (window.supabaseClient && socioId) {
        try {
            const { data: socio, error } = await window.supabaseClient
                .from('socios')
                .select('telefono')
                .eq('id', socioId)
                .single();
            
            if (!error && socio) {
                userPhone = socio.telefono;
                console.log('Teléfono del socio obtenido:', userPhone);
            } else {
                console.log('No se pudo obtener teléfono del socio, usando valor por defecto');
                userPhone = 'No especificado';
            }
        } catch (error) {
            console.log('Error al obtener teléfono del socio:', error);
            userPhone = 'No especificado';
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
            
            // Preparar datos para la BD (CORREGIDO - sin campo es_socio)
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
                socio_id: socioId  // Este campo ya identifica que es un socio
            };
            
            console.log('Datos de donación del socio:', donacionData);
            
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
        
        if (!cardNum || cardNum.length < 15 || cardNum.length > 16) {
            mostrarMensaje('Número de tarjeta inválido (15-16 dígitos)', 'error');
            cardNumber.focus();
            return false;
        }
        
        if (!expiryVal || !/^\d{2}\/\d{2}$/.test(expiryVal)) {
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
        
        if (!cvvVal || cvvVal.length < 3 || cvvVal.length > 4) {
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
            
            console.log('Guardando donación del socio en la base de datos...');
            
            const { data, error } = await window.supabaseClient
                .from('donaciones')
                .insert([datos])
                .select();
            
            if (error) {
                console.error('Error al guardar donación del socio:', error);
                console.error('Detalles del error:', error.message, error.details);
                mostrarMensaje(`Error al procesar la donación: ${error.message}`, 'error');
                return;
            }
            
            console.log('Donación del socio guardada exitosamente:', data);
            // Enviar comprobante por correo
   try {
       console.log('📧 Enviando comprobante...');
       const emailResponse = await fetch(`${EMAIL_SERVER_URL}/send-donation-receipt`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
               email: sessionStorage.getItem('userEmail'),
               nombre: sessionStorage.getItem('userName'),
               monto: datos.monto,
               fecha: datos.fecha_donacion,
               folio: datos.referencia_pago,
               metodo_pago: datos.metodo_pago
           })
       });
       
       if (emailResponse.ok) {
           console.log('✅ Comprobante enviado');
       }
   } catch (emailError) {
       console.log('⚠️ Error al enviar comprobante:', emailError);
   }




            mostrarMensajeExito(datos);
            
            setTimeout(() => {
                // Redirigir al dashboard del socio después del éxito
                window.location.href = 'socio-dashboard.html';
            }, 4000);
            
        } catch (error) {
            console.error('Error inesperado:', error);
            mostrarMensaje('Error inesperado al procesar la donación', 'error');
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
        
        let descripcion = `Donación ${tipo === 'unica' ? 'única' : 'mensual'} para ${destino} - Socio`;
        if (mensaje) {
            descripcion += ` - Mensaje: ${mensaje}`;
        }
        
        return descripcion;
    }
    
    function generarReferenciaPago() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `SOC-${timestamp}-${random}`;
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
                    ${tipo === 'error' ? '' : '✓'}
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
                    <strong>$${datos.monto.toLocaleString('es-MX')} MXN</strong> como socio
                </p>
                <p class="success-reference">
                    Referencia: <span>${datos.referencia_pago}</span>
                </p>
                <p class="success-email">
                    Recibirás un comprobante fiscal en <strong>${datos.donante_email}</strong>
                </p>
                <p class="success-impact">
                    Tu apoyo como socio fortalece nuestra comunidad 
                </p>
                <p class="success-redirect">
                    Redirigiendo al dashboard...
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
        }
    }
    
    // ============================================
    // CONFIGURAR EVENT LISTENERS ADICIONALES
    // ============================================
    function configurarEventListeners() {
        // Botón de cerrar sesión
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            });
        }
    }
    
    // Inicializar
    updateAmounts(0);
    configurarEventListeners();
    console.log('Sistema de donaciones para socios inicializado correctamente');
});

// ============================================
// ESTILOS ADICIONALES PARA SOCIO
// ============================================
const styles = document.createElement('style');
styles.textContent = `
    .message-container {
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
    
    .message-success {
        background: linear-gradient(135deg, #fad1eeff 0%, #f3a7e3ff 100%);
        color: #5f0d51;
        border: 1px solid #e76ed3ff;
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
    
    .success-redirect {
        margin: 0.75rem 0 0 0;
        font-size: 0.875rem;
        color: #5f0d51;
        font-style: italic;
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
        box-shadow: 0 4px 12px rgba(95, 13, 91, 0.3);
    }
    
    input[readonly] {
        background-color: #f3f4f6 !important;
        cursor: not-allowed !important;
        color: #6b7280;
    }
`;
document.head.appendChild(styles);