// ============================================
// DONANTE-DONAR.JS - VERSIÓN CON VALIDACIONES AVANZADAS
// ============================================

let montoSeleccionado = 0;
let tipoDonacion = 'unica';
let currentCardType = null;

// ============================================
// TIPOS DE TARJETAS CON PATRONES Y VALIDACIONES
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

// Bancos detectables mexicanos
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
// FUNCIONES DE VALIDACIÓN AVANZADA
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

// Algoritmo de Luhn mejorado
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

// Formatear número de tarjeta según tipo
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

// Validar fecha de expiración mejorada
function validateExpiry(value) {
    const parts = value.split('/');
    if (parts.length !== 2) return false;

    const month = parseInt(parts[0]);
    const year = parseInt('20' + parts[1]);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Validar que no esté vencida
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    // Validar que no sea muy futura (15 años máximo)
    if (year > currentYear + 15) return false;

    return true;
}

// ============================================
// INICIALIZACIÓN
// ============================================

const EMAIL_SERVER_URL = 'http://localhost:3000';


document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando formulario de donación...');
    
    if (!verificarSesion()) {
        window.location.href = 'login.html';
        return;
    }
    
    cargarDatosDonante();
    detectarTipoDonacion();
    configurarEventListeners();
    llenarSelectorDiaCargo();
    inicializarValidacionesTarjeta();
});

function verificarSesion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    return (isLoggedIn === 'true' && userType === 'donante');
}

// ============================================
// DETECTAR TIPO DE DONACIÓN
// ============================================

function detectarTipoDonacion() {
    const urlParams = new URLSearchParams(window.location.search);
    const tipo = urlParams.get('tipo');
    
    if (tipo === 'mensual') {
        tipoDonacion = 'mensual';
        configurarFormularioMensual();
    } else {
        tipoDonacion = 'unica';
        configurarFormularioUnica();
    }
}

function configurarFormularioUnica() {
    document.getElementById('tipoDonacion').value = 'unica';
    document.getElementById('tipoTexto').textContent = 'Donación Única';
    document.getElementById('pageTitle').textContent = 'Hacer una Donación Única';
    document.getElementById('pageSubtitle').textContent = 'Realiza una contribución puntual a la comunidad';
    document.getElementById('diaCargoGroup').style.display = 'none';
    document.getElementById('summaryType').textContent = 'Única';
    document.getElementById('summaryDiaCargoItem').style.display = 'none';
    document.getElementById('btnText').textContent = 'Realizar Donación';
    document.getElementById('impactTipo').textContent = 'donación';
    document.getElementById('impactFrecuencia').textContent = '';
    
    const badge = document.getElementById('tipoBadge');
    badge.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
    badge.style.color = '#1e40af';
}

function configurarFormularioMensual() {
    document.getElementById('tipoDonacion').value = 'mensual';
    document.getElementById('tipoTexto').textContent = 'Suscripción Mensual';
    document.getElementById('pageTitle').textContent = 'Configurar Suscripción Mensual';
    document.getElementById('pageSubtitle').textContent = 'Apoya continuamente con una donación automática cada mes';
    document.getElementById('diaCargoGroup').style.display = 'block';
    document.getElementById('summaryType').textContent = 'Mensual';
    document.getElementById('summaryDiaCargoItem').style.display = 'flex';
    document.getElementById('btnText').textContent = 'Activar Suscripción';
    document.getElementById('impactTipo').textContent = 'suscripción mensual';
    document.getElementById('impactFrecuencia').textContent = 'cada mes';
    
    const badge = document.getElementById('tipoBadge');
    badge.style.background = 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)';
    badge.style.color = '#7c3aed';
}

// ============================================
// CARGAR DATOS
// ============================================

function cargarDatosDonante() {
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    
    document.getElementById('nombre').value = userName || '';
    document.getElementById('email').value = userEmail || '';
}

function llenarSelectorDiaCargo() {
    const select = document.getElementById('diaCargo');
    if (!select) return;
    
    for (let i = 1; i <= 28; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Día ${i} de cada mes`;
        select.appendChild(option);
    }
}

// ============================================
// VALIDACIONES AVANZADAS DE TARJETA
// ============================================

function inicializarValidacionesTarjeta() {
    const cardNumber = document.getElementById('cardNumber');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');
    
    if (!cardNumber || !expiry || !cvv) {
        console.error('Campos de tarjeta no encontrados');
        return;
    }
    
    // Crear contenedor para indicador de tipo de tarjeta
    const cardWrapper = cardNumber.parentElement;
    if (!cardWrapper.querySelector('.card-type-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'card-type-indicator';
        indicator.id = 'cardTypeIndicator';
        cardWrapper.appendChild(indicator);
    }
    
    // Validación de número de tarjeta
    cardNumber.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        
        // Limitar solo a números
        value = value.replace(/\D/g, '');
        
        // Detectar tipo de tarjeta
        const detectedCard = detectCardType(value);
        currentCardType = detectedCard;
        
        // Mostrar indicador de tipo
        const indicator = document.getElementById('cardTypeIndicator');
        if (detectedCard && indicator) {
            indicator.textContent = detectedCard.config.name;
            indicator.style.color = detectedCard.config.color;
            indicator.style.display = 'block';
        } else if (indicator) {
            indicator.style.display = 'none';
        }
        
        // Actualizar placeholder según tipo
        if (detectedCard) {
            let placeholder = '';
            switch (detectedCard.type) {
                case 'amex':
                    placeholder = '#### ###### #####';
                    break;
                default:
                    placeholder = '#### #### #### ####';
            }
            cardNumber.placeholder = placeholder;
        } else {
            cardNumber.placeholder = '#### #### #### ####';
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
        
        // Actualizar longitud de CVV según tipo de tarjeta
        if (detectedCard) {
            cvv.maxLength = detectedCard.config.cvvLength;
            cvv.placeholder = detectedCard.config.cvvLength === 4 ? '1234' : '123';
        }
    });
    
    // Validación de fecha de expiración
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
    
    document.getElementById('customAmount').addEventListener('input', function() {
        montoSeleccionado = parseInt(this.value) || 0;
        actualizarResumen();
    });
    
    document.getElementById('destino').addEventListener('change', function() {
        const destinos = {
            'general': 'Apoyo General',
            'reforestacion': 'Reforestación',
            'artesanias': 'Artesanías',
            'deportivo': 'Deportivo',
            'asistencia': 'Asistencia Social',
            'cuota': 'Cuota de Socio'
        };
        document.getElementById('summaryDestino').textContent = destinos[this.value] || 'Apoyo General';
    });
    
    const diaCargo = document.getElementById('diaCargo');
    if (diaCargo) {
        diaCargo.addEventListener('change', function() {
            if (this.value) {
                document.getElementById('summaryDiaCargo').textContent = `Día ${this.value} de cada mes`;
            }
        });
    }
    
    document.getElementById('donationForm').addEventListener('submit', procesarDonacion);
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de cerrar sesión?')) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }
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
// VALIDACIÓN COMPLETA DE TARJETA
// ============================================

function validarTarjetaCompleta() {
    const cardNumber = document.getElementById('cardNumber');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');
    
    const cardNum = cardNumber.value.replace(/\s/g, '');
    const expiryVal = expiry.value;
    const cvvVal = cvv.value;
    
    // Validar número de tarjeta con Luhn
    if (cardNum.length < 13 || !luhnCheck(cardNum)) {
        mostrarMensaje('Número de tarjeta inválido', 'error');
        cardNumber.classList.add('invalid');
        cardNumber.focus();
        return false;
    }
    
    // Validar longitud según tipo de tarjeta
    if (currentCardType) {
        if (!currentCardType.config.lengths.includes(cardNum.length)) {
            mostrarMensaje(`Número de tarjeta ${currentCardType.config.name} debe tener ${currentCardType.config.lengths.join(' o ')} dígitos`, 'error');
            cardNumber.focus();
            return false;
        }
    }
    

    // Validar formato de fecha
    if (!/^\d{2}\/\d{2}$/.test(expiryVal)) {
        mostrarMensaje('Fecha de expiración inválida (MM/AA)', 'error');
        expiry.classList.add('invalid');
        expiry.focus();
        return false;

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
                limpiarFormulario();
            }, 4000);
            
        } catch (error) {
            console.error('Error inesperado:', error);
            mostrarMensaje('Error al procesar la donación', 'error');
        } finally {
            mostrarCargando(false);
        }
 }
    
    // Validar que no esté vencida
    if (!validateExpiry(expiryVal)) {
        mostrarMensaje('La tarjeta está vencida', 'error');
        expiry.classList.add('invalid');
        expiry.focus();
        return false;
    }
    
    // Validar CVV según tipo de tarjeta
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
// PROCESAR DONACIÓN
// ============================================

async function procesarDonacion(e) {
    e.preventDefault();
    
    // Validar monto
    if (montoSeleccionado < 50) {
        mostrarMensaje('El monto mínimo de donación es $50 MXN', 'error');
        return;
    }
    
    // Validar campos de tarjeta con validación completa
    if (!validarTarjetaCompleta()) {
        return;
    }
    
    // Validar día de cargo si es mensual
    if (tipoDonacion === 'mensual') {
        const diaCargo = document.getElementById('diaCargo');
        if (diaCargo && !diaCargo.value) {
            mostrarMensaje('Por favor selecciona el día de cargo mensual', 'error');
            return;
        }
    }
    
    const donanteId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    const tipoTarjeta = document.querySelector('input[name="tipoTarjeta"]:checked').value;
    const numeroTarjeta = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const ultimos4 = numeroTarjeta.slice(-4);
    const banco = currentCardType?.config.name || 'Otro';
    
    try {
        await guardarDonacionUnica({
            donanteId,
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
// GUARDAR DONACIÓN ÚNICA
// ============================================
async function guardarDonacionUnica(datos) {
    const destinoSelect = document.getElementById('destino').value;
    const mensajeUsuario = document.getElementById('mensaje').value.trim();
    
    const destinosTexto = {
        'general': 'Apoyo General',
        'reforestacion': 'Programa de Reforestación',
        'artesanias': 'Taller de Artesanías',
        'deportivo': 'Torneo Deportivo',
        'asistencia': 'Asistencia Social',
        'cuota': 'Cuota de Socio'
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
        monto: parseFloat(datos.monto),
        moneda: 'MXN',
        metodo_pago: 'tarjeta',
        estado_pago: 'completado',
        descripcion: descripcionCompleta,
        tipo_donacion: 'unica',
        fecha_donacion: new Date().toISOString()
    };
    
    console.log('Guardando donación única:', dataDonacion);
    
    const { data, error } = await window.supabaseClient
        .from('donaciones')
        .insert(dataDonacion)
        .select();
    
    if (error) {
        console.error('Error al guardar donación:', error);
        throw new Error(error.message);
    }
    
    console.log('Donación guardada exitosamente:', data);
    
    mostrarMensaje('¡Donación realizada exitosamente!', 'success');
    
    // Limpiar formulario
    limpiarFormulario();
    
    setTimeout(() => {
        window.location.href = 'donante-dashboard.html';
    }, 2000);
}

// ============================================
// LIMPIAR FORMULARIO
// ============================================
function limpiarFormulario() {
    // Limpiar monto
    montoSeleccionado = 0;
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('customAmount').value = '';
    document.getElementById('customAmount').style.display = 'none';
    
    // Limpiar destino
    document.getElementById('destino').value = 'general';
    
    // Limpiar mensaje
    document.getElementById('mensaje').value = '';
    
    // Limpiar tarjeta
    const cardNumber = document.getElementById('cardNumber');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');
    
    cardNumber.value = '';
    expiry.value = '';
    cvv.value = '';
    
    // Limpiar estados de validación
    cardNumber.classList.remove('valid', 'invalid');
    expiry.classList.remove('valid', 'invalid');
    cvv.classList.remove('valid', 'invalid');
    
    // Limpiar indicador de tipo de tarjeta
    const indicator = document.getElementById('cardTypeIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
    
    currentCardType = null;
    
    // Actualizar resumen
    actualizarResumen();
    
    console.log('Formulario limpiado');
}

// ============================================
// MENSAJES
// ============================================

function mostrarMensaje(mensaje, tipo) {
    const colores = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    
    const mensajeDiv = document.createElement('div');
    mensajeDiv.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${colores[tipo] || colores.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        font-weight: 500;
    `;
    mensajeDiv.textContent = mensaje;
    document.body.appendChild(mensajeDiv);
    
    setTimeout(() => {
        mensajeDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => mensajeDiv.remove(), 300);
    }, 4000);
}

// ============================================
// ESTILOS ADICIONALES PARA VALIDACIONES
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .card-type-indicator {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.25rem 0.5rem;
        background: white;
        border-radius: 4px;
        display: none;
    }
    
    .form-input.valid {
        border-color: #22c55e !important;
    }
    
    .form-input.invalid {
        border-color: #ef4444 !important;
    }
    
    .form-input.valid:focus {
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1) !important;
    }
    
    .form-input.invalid:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
`;
document.head.appendChild(style);}
