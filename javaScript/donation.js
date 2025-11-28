// donation.js - Sistema de donaciones con conexión a Supabase

document.addEventListener('DOMContentLoaded', function() {
    let selectedAmount = 0;
    let isCustomAmount = false;

    // Elementos del DOM
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    const donationForm = document.getElementById('donationForm');
    const summaryAmount = document.getElementById('summaryAmount');
    const donateAmountBtn = document.getElementById('donateAmount');
    const impactAmount = document.getElementById('impactAmount');
    const destinoSelect = document.getElementById('destino');
    const tipoDonacion = document.querySelectorAll('input[name="tipo-donacion"]');
    
    // Card inputs
    const cardNumber = document.getElementById('card-number');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');

    // ============================================
    // MANEJO DE SELECCIÓN DE MONTOS
    // ============================================
    amountButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover selección previa
            amountButtons.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');

            const amount = this.dataset.amount;

            if (amount === 'custom') {
                isCustomAmount = true;
                customAmountInput.style.display = 'block';
                customAmountInput.focus();
                selectedAmount = parseFloat(customAmountInput.value) || 0;
            } else {
                isCustomAmount = false;
                customAmountInput.style.display = 'none';
                selectedAmount = parseFloat(amount);
            }

            updateSummary();
        });
    });

    // Monto personalizado
    customAmountInput.addEventListener('input', function() {
        selectedAmount = parseFloat(this.value) || 0;
        updateSummary();
    });

    // Actualizar resumen cuando cambia destino o tipo
    destinoSelect.addEventListener('change', updateSummary);
    tipoDonacion.forEach(radio => {
        radio.addEventListener('change', updateSummary);
    });

    // ============================================
    // FORMATEO DE CAMPOS DE TARJETA
    // ============================================
    cardNumber.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });

    expiry.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    });

    cvv.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    // ============================================
    // ACTUALIZAR RESUMEN
    // ============================================
    function updateSummary() {
        const formattedAmount = selectedAmount.toLocaleString('es-MX');
        summaryAmount.textContent = `$${formattedAmount} MXN`;
        donateAmountBtn.textContent = formattedAmount;
        impactAmount.textContent = formattedAmount;

        // Actualizar tipo
        const tipoSeleccionado = document.querySelector('input[name="tipo-donacion"]:checked').value;
        const tipoBadge = document.querySelector('.summary-badge');
        tipoBadge.textContent = tipoSeleccionado === 'unica' ? 'Única' : 'Mensual';

        // Actualizar destino
        const destinoText = destinoSelect.options[destinoSelect.selectedIndex].text;
        document.querySelector('.summary-value-small').textContent = destinoText;
    }

    // ============================================
    // ENVIAR FORMULARIO
    // ============================================
    donationForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validar que se haya seleccionado un monto
        if (selectedAmount <= 0) {
            mostrarMensaje('Por favor selecciona un monto de donación', 'error');
            return;
        }

        // Validar campos de tarjeta
        if (!validarTarjeta()) {
            return;
        }

        // Obtener datos del formulario
        const formData = {
            donante_nombre: document.getElementById('nombre').value.trim(),
            donante_email: document.getElementById('email').value.trim(),
            donante_telefono: null, // Opcional, puedes agregarlo al form si lo necesitas
            monto: selectedAmount,
            moneda: 'MXN',
            metodo_pago: 'tarjeta',
            estado_pago: 'completado', // En producción esto vendría del procesador de pago
            descripcion: obtenerDescripcionDonacion(),
            referencia_pago: generarReferenciaPago(),
            socio_id: obtenerSocioId() // Si está logueado como socio
        };

        console.log('Datos de donación:', formData);

        // Guardar en Supabase
        await guardarDonacion(formData);
    });

    // ============================================
    // VALIDAR TARJETA
    // ============================================
    function validarTarjeta() {
        const cardNum = cardNumber.value.replace(/\s/g, '');
        const expiryVal = expiry.value;
        const cvvVal = cvv.value;

        if (cardNum.length < 15 || cardNum.length > 16) {
            mostrarMensaje('Número de tarjeta inválido', 'error');
            return false;
        }

        if (!/^\d{2}\/\d{2}$/.test(expiryVal)) {
            mostrarMensaje('Fecha de expiración inválida (MM/AA)', 'error');
            return false;
        }

        // Validar que no esté vencida
        const [month, year] = expiryVal.split('/');
        const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        if (expDate < new Date()) {
            mostrarMensaje('La tarjeta está vencida', 'error');
            return false;
        }

        if (cvvVal.length < 3 || cvvVal.length > 4) {
            mostrarMensaje('CVV inválido', 'error');
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

            console.log('Guardando donación...');

            const { data, error } = await window.supabaseClient
                .from('donaciones')
                .insert([datos])
                .select();

            if (error) {
                console.error('Error al guardar donación:', error);
                mostrarMensaje('Error al procesar la donación. Intenta nuevamente.', 'error');
                return;
            }

            console.log('Donación guardada exitosamente:', data);

            // Mostrar mensaje de éxito
            mostrarMensajeExito(datos);

            // Limpiar formulario después de 3 segundos
            setTimeout(() => {
                donationForm.reset();
                selectedAmount = 0;
                updateSummary();
                amountButtons.forEach(btn => btn.classList.remove('selected'));
                customAmountInput.style.display = 'none';
            }, 3000);

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
        const tipo = document.querySelector('input[name="tipo-donacion"]:checked').value;
        const mensaje = document.getElementById('mensaje').value.trim();
        
        let descripcion = `Donación ${tipo === 'unica' ? 'única' : 'mensual'} para ${destino}`;
        if (mensaje) {
            descripcion += ` - Mensaje: ${mensaje}`;
        }
        
        return descripcion;
    }

    function generarReferenciaPago() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `DON-${timestamp}-${random}`;
    }

    function obtenerSocioId() {
        // Si el usuario está logueado como socio, obtener su ID
        return sessionStorage.getItem('socioId') || null;
    }

    // ============================================
    // MENSAJES Y UI
    // ============================================
    function mostrarMensaje(mensaje, tipo) {
        // Crear o actualizar el contenedor de mensajes
        let container = document.querySelector('.message-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'message-container';
            donationForm.insertBefore(container, donationForm.firstChild);
        }

        container.innerHTML = `
            <div class="message message-${tipo}">
                ${tipo === 'error' ? '⚠️' : '✓'} ${mensaje}
            </div>
        `;

        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            const msg = container.querySelector('.message');
            if (msg) {
                msg.style.opacity = '0';
                setTimeout(() => msg.remove(), 300);
            }
        }, 5000);
    }

    function mostrarMensajeExito(datos) {
        const container = document.querySelector('.message-container') || (() => {
            const el = document.createElement('div');
            el.className = 'message-container';
            donationForm.insertBefore(el, donationForm.firstChild);
            return el;
        })();

        container.innerHTML = `
            <div class="message message-success">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎉</div>
                <h4 style="margin: 0 0 0.5rem 0;">¡Donación exitosa!</h4>
                <p style="margin: 0;">Gracias <strong>${datos.donante_nombre}</strong> por tu donación de <strong>$${datos.monto.toLocaleString('es-MX')} MXN</strong></p>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; opacity: 0.8;">
                    Referencia: ${datos.referencia_pago}
                </p>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem;">
                    Recibirás un correo de confirmación en <strong>${datos.donante_email}</strong>
                </p>
            </div>
        `;
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
            submitBtn.innerHTML = `Donar $<span id="donateAmount">${selectedAmount.toLocaleString('es-MX')}</span> MXN`;
        }
    }

    // Inicializar resumen
    updateSummary();
});

// ============================================
// ESTILOS PARA MENSAJES
// ============================================
const styles = document.createElement('style');
styles.textContent = `
    .message-container {
        margin-bottom: 1.5rem;
    }

    .message {
        padding: 1rem 1.25rem;
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
        background: #f9d1faff;
        color: #58065fff;
        border: 1px solid #f3a7e0ff;
        text-align: center;
    }

    .message-success h4 {
        color: #5f0d51;
        font-size: 1.1rem;
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

    .amount-btn.selected {
        background: #5f0d51;
        color: white;
        border-color: #5f0d51;
        transform: scale(1.05);
    }
`;
document.head.appendChild(styles);