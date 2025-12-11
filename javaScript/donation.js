// donation.js - Sistema de donaciones con validación de tarjetas y conexión a Supabase
const EMAIL_SERVER_URL = 'https://kuenikueniapp17-11-2-0.onrender.com';
const cardTypes = {
    visa: {
        pattern: /^4/,
        lengths: [13, 16, 19],
        cvvLength: 3,
        name: 'Visa',
       logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIxNy45ODI0MzkwMjQzOTAyNDIiIHZpZXdCb3g9IjAgMCAxMDI1IDc2OCI+PHBhdGggZmlsbD0iIzRmNDZlNSIgZD0iTTk2MC4zMSA3NjhoLTg5NnEtMjYgMC00NS0xOC41VCAuMzEgNzA0VjU3NmgxMDI0djEyOHEwIDI3LTE4LjUgNDUuNXQtNDUuNSAxOC41TS4zMSA2NHEwLTI2IDE4LjUtNDV0NDUuNS0xOWg4OTZxMjcgMCA0NS41IDE5dDE4LjUgNDV2NjRILjMxem0zMjkgNDQ4bDUyLTMyMGg4M2wtNTIgMzIwem01MjktMzIwaDY3bDY3IDMyMGgtNzdsLTE5LTMyaC05NmwtMTggMzJoLTg3bDEyNC0yOTZsMS0yLjVsNC02bDctN2wxMS02em0zOCAyMjRsLTI5LTEzN2wtMzUgMTM3em0tMzM4IDk2cS0yNSAwLTQ5LTQuNXQtMzQtOC41bC0xMS00bDEyLTcwcTE3IDE0IDUwIDE5LjV0NjAuNS0xdDI3LjUtMjYuNXEwLTEzLTE4LTI1LjV0LTQwLTIxLjV0LTQwLTI5dC0xOC00N3EwLTI5IDE1LjUtNTF0MzkuNS0zMnQ0NS0xNC41dDQwLTQuNXExNyAwIDM2IDMuNXQyOSA2LjVsMTAgM2wtMTIgNjdxLTI2LTE2LTcxLjUtMTQuNXQtNDUuNSAyNS41cTAgMTIgMTguNSAyMy41dDQwLjUgMjF0NDAgMzAuNXQxOCA0OHEwIDM2LTI0LjUgNjEuNXQtNTUuNSAzNXQtNjMgOS41bS00NTYtMzIwcTE2IDAgMjUuNSA3LjV0MTEuNSAxNC41bDIgN2wyOCAxNDRsMTAgNDdsNzktMjIwaDkwbC0xMzMgMzIwaC04N2wtNzItMjc4cS0yMi0xMy01Ni0yNHYtMTh6Ii8+PC9zdmc+'
    },
    mastercard: {
        pattern: /^(5[1-5]|2[2-7])/,
        lengths: [16],
        cvvLength: 3,
        name: 'Mastercard',
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAgMCA0MCAyNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iMjUiIHJ4PSIzIiBmaWxsPSIjRUIwMDFCIi8+CiAgPGNpcmNsZSBjeD0iMTUiIGN5PSIxMi41IiByPSI1IiBmaWxsPSIjRkY1RjAwIi8+CiAgPGNpcmNsZSBjeD0iMjUiIGN5PSIxMi41IiByPSI1IiBmaWxsPSIjRkY1RjAwIi8+CiAgPHBhdGggZD0iTSAyMCAxMi41IEEgNSA1IDAgMCAwIDE1IDE3LjUgQSA1IDUgMCAwIDAgMjUgMTcuNSBBIDUgNSAwIDAgMCAyMCAxMi41IFoiIGZpbGw9IiNGRjVGMDAiLz4KPC9zdmc+'
    },
    amex: {
        pattern: /^3[47]/,
        lengths: [15],
        cvvLength: 4,
        name: 'American Express',
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAgMCA0MCAyNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iMjUiIHJ4PSIzIiBmaWxsPSIjMDA2RkNGIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiPkFNRVg8L3RleHQ+Cjwvc3ZnPg=='
    },
    discover: {
        pattern: /^6(?:011|5)/,
        lengths: [16, 19],
        cvvLength: 3,
        name: 'Discover',
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAgMCA0MCAyNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iMjUiIHJ4PSIzIiBmaWxsPSIjRkY2MDAwIi8+CiAgPGNpcmNsZSBjeD0iMzIiIGN5PSIxMi41IiByPSI1IiBmaWxsPSIjRkZDRDAwIi8+Cjwvc3ZnPg=='
    }
};

// ============================================
// FUNCIONES DE VALIDACIÓN DE TARJETA
// ============================================

// Detectar tipo de tarjeta
function detectCardType(number) {
    const cleanNumber = number.replace(/\s/g, '');
    
    for (const [type, config] of Object.entries(cardTypes)) {
        if (config.pattern.test(cleanNumber)) {
            return { type, config };
        }
    }
    
    return null;
}

function getCardType(number) {
    number = number.replace(/\s+/g, '');

    if (/^4/.test(number)) return "visa";
    if (/^5[1-5]/.test(number)) return "mastercard";
    if (/^3[47]/.test(number)) return "amex";
    if (/^6(?:011|5)/.test(number)) return "discover";

    return "";
}

// Validar usando algoritmo de Luhn
function luhnCheck(number) {
    const cleanNumber = number.replace(/\s/g, '');
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// Formatear número de tarjeta
function formatCardNumber(value, cardType) {
    const cleanValue = value.replace(/\s/g, '');
    
    if (cardType?.type === 'amex') {
        // American Express: 4-6-5
        return cleanValue.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim();
    } else {
        // Otras tarjetas: 4-4-4-4
        return cleanValue.replace(/(\d{4})/g, '$1 ').trim();
    }
}

// Formatear fecha de expiración
function formatExpiry(value) {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length >= 2) {
        return cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4);
    }
    
    return cleanValue;
}

function validateExpiry(value) {
    const parts = value.split('/');
    if (parts.length !== 2) return false;

    const month = parseInt(parts[0]);
    const year = parseInt('20' + parts[1]);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

  
    if (year < currentYear) return false;

  
    if (year === currentYear && month < currentMonth) return false;

    
    if (year > currentYear + 15) return false;

    return true;
}


document.addEventListener('DOMContentLoaded', function() {
    let selectedAmount = 0;
    let isCustomAmount = false;
    let currentCardType = null;

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
    // AGREGAR CONTENEDOR PARA LOGO DE TARJETA
    // ============================================
    if (cardNumber) {
        const wrapper = document.createElement('div');
        wrapper.className = 'card-input-wrapper';
        cardNumber.parentNode.insertBefore(wrapper, cardNumber);
        wrapper.appendChild(cardNumber);
        
        const logoContainer = document.createElement('div');
        logoContainer.className = 'card-logo';
        logoContainer.id = 'card-logo';
        wrapper.appendChild(logoContainer);
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.id = 'card-error';
        wrapper.appendChild(errorMsg);
    }

    // ============================================
    // MANEJO DE SELECCIÓN DE MONTOS
    // ============================================
    amountButtons.forEach(btn => {
        btn.addEventListener('click', function() {
           
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
    // FORMATEO Y VALIDACIÓN DE TARJETA
    // ============================================
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            
            // Limitar solo a números
            value = value.replace(/\D/g, '');
            
            // Detectar tipo de tarjeta
            const detectedCard = detectCardType(value);
            currentCardType = detectedCard;
            
            // ==== PLACEHOLDER DINÁMICO SEGÚN TIPO DE TARJETA ====
if (detectedCard) {
    let placeholder = '';

    switch (detectedCard.type) {
        case 'visa':
        case 'mastercard':
        case 'discover':
            placeholder = '#### #### #### ####';
            break;
        case 'amex':
            placeholder = '#### ###### #####';
            break;
    }

    cardNumber.placeholder = placeholder;
} else {
    // Placeholder genérico cuando aún no detecta tarjeta
    cardNumber.placeholder = '#### #### #### ####';
}


            // Mostrar logo
            const logoContainer = document.getElementById('card-logo');
            if (detectedCard && logoContainer) {
                logoContainer.innerHTML = `<img src="${detectedCard.config.logo}" alt="${detectedCard.config.name}">`;
                logoContainer.classList.add('active');
            } else if (logoContainer) {
                logoContainer.classList.remove('active');
            }
            
            // Limitar longitud según tipo de tarjeta
            let maxLength = 16;
            if (detectedCard) {
                maxLength = Math.max(...detectedCard.config.lengths);
            }
            
            if (value.length > maxLength) {
                value = value.slice(0, maxLength);
            }
            
            // Formatear
            const formatted = formatCardNumber(value, detectedCard);
            e.target.value = formatted;
            
            // Validar
            const errorMsg = document.getElementById('card-error');
            
            if (value.length >= 13) {
                const isValidLength = detectedCard ? 
                    detectedCard.config.lengths.includes(value.length) : 
                    value.length === 16;
                
                const isValidLuhn = luhnCheck(value);
                
                if (isValidLength && isValidLuhn) {
                    e.target.classList.add('valid');
                    e.target.classList.remove('invalid');
                    if (errorMsg) {
                        errorMsg.classList.remove('active');
                    }
                } else {
                    e.target.classList.add('invalid');
                    e.target.classList.remove('valid');
                    if (errorMsg) {
                        errorMsg.textContent = 'Número de tarjeta inválido';
                        errorMsg.classList.add('active');
                    }
                }
            } else {
                e.target.classList.remove('valid', 'invalid');
                if (errorMsg) {
                    errorMsg.classList.remove('active');
                }
            }
            
            // Actualizar longitud de CVV
            if (cvv && detectedCard) {
                cvv.maxLength = detectedCard.config.cvvLength;
                cvv.placeholder = detectedCard.config.cvvLength === 4 ? '1234' : '123';
            }
        });
    }

    // Validar fecha de expiración
    if (expiry) {
        expiry.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 4) {
                value = value.slice(0, 4);
            }
            
            e.target.value = formatExpiry(value);
            
            if (value.length === 4) {
                if (validateExpiry(e.target.value)) {
                    e.target.classList.add('valid');
                    e.target.classList.remove('invalid');
                } else {
                    e.target.classList.add('invalid');
                    e.target.classList.remove('valid');
                }
            } else {
                e.target.classList.remove('valid', 'invalid');
            }
        });
    }

    // Validar CVV
    if (cvv) {
        cvv.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            const expectedLength = currentCardType?.config.cvvLength || 3;
            
            if (value.length > expectedLength) {
                value = value.slice(0, expectedLength);
            }
            
            e.target.value = value;
            
            if (value.length === expectedLength) {
                e.target.classList.add('valid');
                e.target.classList.remove('invalid');
            } else if (value.length > 0) {
                e.target.classList.add('invalid');
                e.target.classList.remove('valid');
            } else {
                e.target.classList.remove('valid', 'invalid');
            }
        });
    }

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
    // VALIDAR TARJETA MEJORADO
    // ============================================
    function validarTarjeta() {
        const cardNum = cardNumber.value.replace(/\s/g, '');
        const expiryVal = expiry.value;
        const cvvVal = cvv.value;

        // Validar número de tarjeta con Luhn
        if (cardNum.length < 13 || !luhnCheck(cardNum)) {
            mostrarMensaje('Número de tarjeta inválido', 'error');
            cardNumber.classList.add('invalid');
            return false;
        }

        // Validar longitud según tipo de tarjeta
        if (currentCardType) {
            if (!currentCardType.config.lengths.includes(cardNum.length)) {
                mostrarMensaje(`Número de tarjeta ${currentCardType.config.name} debe tener ${currentCardType.config.lengths.join(' o ')} dígitos`, 'error');
                return false;
            }
        }

        // Validar formato de fecha
        if (!/^\d{2}\/\d{2}$/.test(expiryVal)) {
            mostrarMensaje('Fecha de expiración inválida (MM/AA)', 'error');
            expiry.classList.add('invalid');
            return false;
        }

        // Validar que no esté vencida
        if (!validateExpiry(expiryVal)) {
            mostrarMensaje('La tarjeta está vencida', 'error');
            expiry.classList.add('invalid');
            return false;
        }

        // Validar CVV según tipo de tarjeta
        const expectedCvvLength = currentCardType?.config.cvvLength || 3;
        if (cvvVal.length !== expectedCvvLength) {
            mostrarMensaje(`CVV debe tener ${expectedCvvLength} dígitos`, 'error');
            cvv.classList.add('invalid');
            return false;
        }

        return true;
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
            donante_telefono: null,
            monto: selectedAmount,
            moneda: 'MXN',
            metodo_pago: 'tarjeta',
            estado_pago: 'completado',
            descripcion: obtenerDescripcionDonacion(),
            referencia_pago: generarReferenciaPago(),
            socio_id: obtenerSocioId()
        };

        console.log('Datos de donación:', formData);

        // Guardar en Supabase
        await guardarDonacion(formData);
    });

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

        // 1. Guardar donación en Supabase
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

        // 2. Preparar datos para los correos
        const fechaFormateada = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const destinoTexto = document.getElementById('destino').options[document.getElementById('destino').selectedIndex].text;
        const mensajeOpcional = document.getElementById('mensaje').value.trim();

        // 3. Enviar correo de agradecimiento al donante
        try {
            console.log('Enviando correo de agradecimiento al donante...');
            const thankYouResponse = await fetch(`${EMAIL_SERVER_URL}/send-donation-thank-you`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: datos.donante_email,
                    nombre: datos.donante_nombre,
                    monto: datos.monto,
                    moneda: datos.moneda,
                    referencia: datos.referencia_pago,
                    destino: destinoTexto,
                    fecha: fechaFormateada
                })
            });

            if (thankYouResponse.ok) {
                console.log('Correo de agradecimiento enviado al donante');
            } else {
                console.log('No se pudo enviar correo al donante (no crítico)');
            }
        } catch (emailError) {
            console.log('Error al enviar correo al donante (no crítico):', emailError);
        }


        // 4. Enviar notificación al administrador
        try {
            console.log('Enviando notificación al administrador...');
            const notificationResponse = await fetch(`${EMAIL_SERVER_URL}/send-donation-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    donante_nombre: datos.donante_nombre,
                    donante_email: datos.donante_email,
                    donante_telefono: datos.donante_telefono,
                    monto: datos.monto,
                    moneda: datos.moneda,
                    referencia: datos.referencia_pago,
                    destino: destinoTexto,
                    fecha: fechaFormateada,
                    metodo_pago: datos.metodo_pago,
                    mensaje: mensajeOpcional || null
                })
            });

            if (notificationResponse.ok) {
                console.log('Notificación enviada al administrador');
            } else {
                console.log('No se pudo enviar notificación al administrador (no crítico)');
            }
        } catch (emailError) {
            console.log('Error al enviar notificación al administrador (no crítico):', emailError);
        }

        // 5. Mostrar mensaje de éxito
        mostrarMensajeExito(datos);

        // 6. Limpiar formulario después de 3 segundos
        setTimeout(() => {
            donationForm.reset();
            selectedAmount = 0;
            currentCardType = null;
            updateSummary();
            amountButtons.forEach(btn => btn.classList.remove('selected'));
            customAmountInput.style.display = 'none';
            
            // Limpiar estados de validación
            cardNumber.classList.remove('valid', 'invalid');
            expiry.classList.remove('valid', 'invalid');
            cvv.classList.remove('valid', 'invalid');
            
            const logoContainer = document.getElementById('card-logo');
            if (logoContainer) {
                logoContainer.classList.remove('active');
            }
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
        return sessionStorage.getItem('socioId') || null;
    }

    // ============================================
    // MENSAJES Y UI
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
                ${tipo === 'error' ? '⚠️' : '✓'} ${mensaje}
            </div>
        `;

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
                 Recibirás un correo de confirmación con el comprobante en <strong>${datos.donante_email}</strong>
            </p>
            <p style="margin: 0.3rem 0 0 0; font-size: 0.8rem; color: #666;">
                También hemos notificado a nuestro equipo sobre tu generosa contribución
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
// ESTILOS PARA MENSAJES Y VALIDACIÓN
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

    /* Estilos de validación de tarjeta */
    .card-input-wrapper {
        position: relative;
    }

    .card-input-wrapper .form-input {
        padding-right: 50px;
    }

    .card-logo {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 25px;
        display: none;
        align-items: center;
        justify-content: center;
    }

    .card-logo.active {
        display: flex;
    }

    .card-logo img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }

    .form-input.valid {
        border-color: #22c55e;
    }

    .form-input.invalid {
        border-color: #ef4444;
    }

    .form-input.valid:focus {
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
    }

    .form-input.invalid:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .error-message {
        font-size: 12px;
        color: #ef4444;
        margin-top: 4px;
        display: none;
    }

    .error-message.active {
        display: block;
    }
`;
document.head.appendChild(styles);