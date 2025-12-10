// ============================================
// DONANTE-DONAR.JS - VERSIÓN MEJORADA SIN MENSUAL
// ============================================

const EMAIL_SERVER_URL = 'https://kuenikueniapp17-11-2-0.onrender.com';

let montoSeleccionado = 0;
let currentCardType = null;

// ============================================
// BANCOS DETECTABLES POR BIN
// ============================================
const BANCOS_MEXICO = {
    'BBVA': { bins: ['4152', '4772'], color: '#004481' },
    'Santander': { bins: ['5579'], color: '#EC0000' },
    'Banorte': { bins: ['5465', '5492'], color: '#DA291C' },
    'HSBC': { bins: ['4051', '5469'], color: '#DB0011' },
    'Citibanamex': { bins: ['5256', '4915'], color: '#003B71' },
    'ScotiaBank': { bins: ['4571'], color: '#EC1C24' },
    'Inbursa': { bins: ['5204'], color: '#C8102E' }
};

// ============================================
// TIPOS DE TARJETAS
// ============================================
const cardTypes = {
    visa: {
        pattern: /^4/,
        lengths: [13, 16, 19],
        cvvLength: 3,
        name: 'Visa',
        color: '#1434CB'
    },
    mastercard: {
        pattern: /^(5[1-5]|2[2-7])/,
        lengths: [16],
        cvvLength: 3,
        name: 'Mastercard',
        color: '#EB001B'
    },
    amex: {
        pattern: /^3[47]/,
        lengths: [15],
        cvvLength: 4,
        name: 'American Express',
        color: '#006FCF'
    },
    discover: {
        pattern: /^6(?:011|5)/,
        lengths: [16, 19],
        cvvLength: 3,
        name: 'Discover',
        color: '#FF6000'
    }
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando formulario de donación...');
    
    if (!verificarSesion()) {
        window.location.href = 'login.html';
        return;
    }
    
    cargarDatosDonante();
    configurarEventListeners();
});

function verificarSesion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    return (isLoggedIn === 'true' && userType === 'donante');
}

// ============================================
// CARGAR DATOS DEL DONANTE
// ============================================

function cargarDatosDonante() {
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    
    document.getElementById('nombre').value = userName || '';
    document.getElementById('email').value = userEmail || '';
}

// ============================================
// EVENT LISTENERS
// ============================================

function configurarEventListeners() {
    // Botones de monto
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = this.dataset.amount;
            
            document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
            
            if (amount === 'otro') {
                this.classList.add('active');
                document.getElementById('customAmount').style.display = 'block';
                document.getElementById('customAmount').focus();
                montoSeleccionado = 0;
            } else {
                this.classList.add('active');
                document.getElementById('customAmount').style.display = 'none';
                montoSeleccionado = parseInt(amount);
            }
            
            actualizarResumen();
        });
    });
    
    // Monto personalizado
    document.getElementById('customAmount').addEventListener('input', function() {
        montoSeleccionado = parseInt(this.value) || 0;
        actualizarResumen();
    });
    
    // Cambio de destino
    document.getElementById('destino').addEventListener('change', function() {
        const destinos = {
            'general': 'Apoyo General',
            'reforestacion': 'Reforestación',
            'artesanias': 'Artesanías',
            'deportivo': 'Deportivo',
            'asistencia': 'Asistencia Social'
        };
        document.getElementById('summaryDestino').textContent = destinos[this.value] || 'Apoyo General';
    });
    
    // Validaciones de tarjeta
    configurarValidacionesTarjeta();
    
    // Submit del formulario
    document.getElementById('donationForm').addEventListener('submit', procesarDonacion);
    

}

// ============================================
// VALIDACIONES DE TARJETA
// ============================================

function configurarValidacionesTarjeta() {
    const cardNumber = document.getElementById('cardNumber');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');
    
    // Validación de número de tarjeta
    cardNumber.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        value = value.replace(/\D/g, '');
        
        // Detectar tipo de tarjeta
        const detectedCard = detectCardType(value);
        currentCardType = detectedCard;
        
        // Detectar banco
        detectarBanco(value);
        
        // Formatear
        const formatted = formatCardNumber(value, detectedCard);
        e.target.value = formatted;
        
        // Validar
        if (value.length >= 13) {
            const isValidLength = detectedCard ? 
                detectedCard.config.lengths.includes(value.length) : 
                value.length === 16;
            
            const isValidLuhn = luhnCheck(value);
            
            if (isValidLength && isValidLuhn) {
                e.target.classList.add('valid');
                e.target.classList.remove('invalid');
            } else {
                e.target.classList.add('invalid');
                e.target.classList.remove('valid');
            }
        } else {
            e.target.classList.remove('valid', 'invalid');
        }
        
        // Actualizar CVV
        if (detectedCard) {
            cvv.maxLength = detectedCard.config.cvvLength;
            cvv.placeholder = detectedCard.config.cvvLength === 4 ? '1234' : '123';
        }
    });
    
    // Validación de fecha
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
    
    // Validación de CVV
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
// DETECTAR BANCO
// ============================================

function detectarBanco(numero) {
    const primeros4 = numero.substring(0, 4);
    let bancoDetectado = null;
    
    for (const [nombre, info] of Object.entries(BANCOS_MEXICO)) {
        if (info.bins.some(bin => primeros4.startsWith(bin))) {
            bancoDetectado = { nombre, color: info.color };
            break;
        }
    }
    
    const bancoLogo = document.getElementById('bancoLogo');
    const bancoNombre = document.getElementById('bancoNombre');
    
    if (bancoDetectado && bancoLogo && bancoNombre) {
        bancoLogo.style.display = 'flex';
        bancoNombre.textContent = bancoDetectado.nombre;
        bancoNombre.style.color = bancoDetectado.color;
    } else if (bancoLogo) {
        bancoLogo.style.display = 'none';
    }
}

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

function detectCardType(number) {
    const cleanNumber = number.replace(/\s/g, '');
    
    for (const [type, config] of Object.entries(cardTypes)) {
        if (config.pattern.test(cleanNumber)) {
            return { type, config };
        }
    }
    
    return null;
}

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

function formatCardNumber(value, cardType) {
    const cleanValue = value.replace(/\s/g, '');
    
    if (cardType?.type === 'amex') {
        return cleanValue.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim();
    } else {
        return cleanValue.replace(/(\d{4})/g, '$1 ').trim();
    }
}

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

function validarTarjetaCompleta() {
    const cardNumber = document.getElementById('cardNumber');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');
    
    const cardNum = cardNumber.value.replace(/\s/g, '');
    const expiryVal = expiry.value;
    const cvvVal = cvv.value;
    
    if (cardNum.length < 13 || !luhnCheck(cardNum)) {
        mostrarMensaje('Número de tarjeta inválido', 'error');
        cardNumber.classList.add('invalid');
        cardNumber.focus();
        return false;
    }
    
    if (currentCardType) {
        if (!currentCardType.config.lengths.includes(cardNum.length)) {
            mostrarMensaje(`Número de tarjeta ${currentCardType.config.name} debe tener ${currentCardType.config.lengths.join(' o ')} dígitos`, 'error');
            cardNumber.focus();
            return false;
        }
    }
    
    if (!/^\d{2}\/\d{2}$/.test(expiryVal)) {
        mostrarMensaje('Fecha de expiración inválida (MM/AA)', 'error');
        expiry.classList.add('invalid');
        expiry.focus();
        return false;
    }
    
    if (!validateExpiry(expiryVal)) {
        mostrarMensaje('La tarjeta está vencida', 'error');
        expiry.classList.add('invalid');
        expiry.focus();
        return false;
    }
    
    const expectedCvvLength = currentCardType?.config.cvvLength || 3;
    if (cvvVal.length !== expectedCvvLength) {
        mostrarMensaje(`CVV debe tener ${expectedCvvLength} dígitos`, 'error');
        cvv.classList.add('invalid');
        cvv.focus();
        return false;
    }
    
    return true;
}

// ============================================
// ACTUALIZAR RESUMEN
// ============================================

function actualizarResumen() {
    document.getElementById('summaryAmount').textContent = `$${montoSeleccionado.toLocaleString('es-MX')} MXN`;
    document.getElementById('donationAmount').textContent = montoSeleccionado.toLocaleString('es-MX');
    document.getElementById('impactAmount').textContent = montoSeleccionado.toLocaleString('es-MX');
}

// ============================================
// PROCESAR DONACIÓN
// ============================================

async function procesarDonacion(e) {
    e.preventDefault();
    
    if (montoSeleccionado < 50) {
        mostrarMensaje('El monto mínimo de donación es $50 MXN', 'error');
        return;
    }
    
    if (!validarTarjetaCompleta()) {
        return;
    }
    
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    const tipoTarjeta = document.querySelector('input[name="tipoTarjeta"]:checked').value;
    const numeroTarjeta = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const ultimos4 = numeroTarjeta.slice(-4);
    const banco = document.getElementById('bancoNombre')?.textContent || 'Otro';
    
    try {
        await guardarDonacionUnica({
            userName,
            userEmail,
            monto: montoSeleccionado,
            tipoTarjeta,
            ultimos4,
            banco
        });
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Ocurrió un error: ' + error.message, 'error');
    }
}

// ============================================
// GUARDAR DONACIÓN
// ============================================

async function guardarDonacionUnica(datos) {
    const destinoSelect = document.getElementById('destino').value;
    const mensajeUsuario = document.getElementById('mensaje').value.trim();
    
    const destinosTexto = {
        'general': 'Apoyo General',
        'reforestacion': 'Programa de Reforestación',
        'artesanias': 'Taller de Artesanías',
        'deportivo': 'Torneo Deportivo',
        'asistencia': 'Asistencia Social'
    };
    
    let descripcionCompleta;
    if (mensajeUsuario) {
        descripcionCompleta = `Donación única para ${destinosTexto[destinoSelect]} - Donante - Mensaje: ${mensajeUsuario}`;
    } else {
        descripcionCompleta = `Donación única para ${destinosTexto[destinoSelect]} - Donante`;
    }
    
    const dataDonacion = {
        donante_nombre: datos.userName,
        donante_email: datos.userEmail,
        donante_telefono: 'No especificado', // Los donantes no registran teléfono
        monto: parseFloat(datos.monto),
        moneda: 'MXN',
        metodo_pago: 'tarjeta',
        estado_pago: 'completado',
        descripcion: descripcionCompleta,
        tipo_donacion: 'unica',
        fecha_donacion: new Date().toISOString(),
        referencia_pago: generarReferenciaPago()
    };
    
    console.log('📝 Guardando donación única:', dataDonacion);
    
    mostrarCargando(true);
    
    try {
        // 1. Guardar donación en Supabase
        const { data, error } = await window.supabaseClient
            .from('donaciones')
            .insert(dataDonacion)
            .select();
        
        if (error) {
            console.error('Error al guardar donación:', error);
            throw new Error(error.message);
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

        const destinoTextoCompleto = destinosTexto[destinoSelect];

        // 3. Enviar correo de agradecimiento al donante
        try {
            console.log('Enviando correo de agradecimiento al donante...');
            const thankYouResponse = await fetch(`${EMAIL_SERVER_URL}/send-donation-thank-you`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: dataDonacion.donante_email,
                    nombre: dataDonacion.donante_nombre,
                    monto: dataDonacion.monto,
                    moneda: dataDonacion.moneda,
                    referencia: dataDonacion.referencia_pago,
                    destino: destinoTextoCompleto,
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
            console.log('📬 Enviando notificación al administrador...');
            const notificationResponse = await fetch(`${EMAIL_SERVER_URL}/send-donation-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    donante_nombre: dataDonacion.donante_nombre,
                    donante_email: dataDonacion.donante_email,
                    donante_telefono: dataDonacion.donante_telefono,
                    monto: dataDonacion.monto,
                    moneda: dataDonacion.moneda,
                    referencia: dataDonacion.referencia_pago,
                    destino: destinoTextoCompleto,
                    fecha: fechaFormateada,
                    metodo_pago: dataDonacion.metodo_pago,
                    mensaje: mensajeUsuario || null
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
        
        console.log('=== PROCESO COMPLETADO EXITOSAMENTE ===');
        
        // 5. Mostrar mensaje de éxito
        mostrarMensajeExito(dataDonacion);
        
        // 6. Redireccionar después de 4 segundos
        setTimeout(() => {
            window.location.href = 'donante-dashboard.html';
        }, 4000);
        
    } catch (error) {
        console.error('Error inesperado:', error);
        mostrarMensaje('Error al procesar la donación. Por favor inténtalo de nuevo.', 'error');
    } finally {
        mostrarCargando(false);
    }
}
function generarReferenciaPago() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `DON-${timestamp}-${random}`;
}

// ============================================
// MENSAJES Y UI
// ============================================

function mostrarMensaje(mensaje, tipo) {
    let container = document.querySelector('.message-container');
    
    if (!container) {
        container = document.createElement('div');
        container.className = 'message-container';
        const form = document.getElementById('donationForm');
        form.insertBefore(container, form.firstChild);
    }
    
    container.innerHTML = `
        <div class="message message-${tipo}">
            <div class="message-icon">
                ${tipo === 'error' ? '⚠' : '✓'}
            </div>
            <div class="message-text">${mensaje}</div>
        </div>
    `;
    
    setTimeout(() => {
        const msg = container.querySelector('.message');
        if (msg) {
            msg.style.opacity = '0';
            setTimeout(() => container.innerHTML = '', 300);
        }
    }, 5000);
    
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function mostrarMensajeExito(datos) {
    let container = document.querySelector('.message-container');
    
    if (!container) {
        container = document.createElement('div');
        container.className = 'message-container';
        const form = document.getElementById('donationForm');
        form.insertBefore(container, form.firstChild);
    }
    
    container.innerHTML = `
        <div class="message message-success">
            <div class="success-icon">✓</div>
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
                Tu apoyo ayuda a fortalecer nuestra comunidad 💚
            </p>
            <p class="success-redirect">
                Redirigiendo al dashboard...
            </p>
        </div>
    `;
    
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mostrarCargando(mostrar) {
    const submitBtn = document.querySelector('.btn-submit-donation');
    
    if (mostrar) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="loader-inline"></span>
            Procesando donación...
        `;
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Donar $<span id="donationAmount">${montoSeleccionado.toLocaleString('es-MX')}</span> MXN`;
    }
}

console.log('Sistema de donaciones inicializado correctamente');