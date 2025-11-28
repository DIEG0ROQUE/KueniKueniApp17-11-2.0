// noticias.js - Sistema de noticias página pública (misma lógica que socio)
// ============================================================================

let config = {};

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando vista de noticias...');
    
    if (!window.supabaseClient) {
        console.error('Error: Cliente Supabase no inicializado');
        mostrarMensajeError('Error de configuración. Por favor, recarga la página.');
        return;
    }
    
    await cargarConfiguracion();
    await inicializarNoticias();
    actualizarFooter();
});

// ============================================================================
// CARGAR CONFIGURACIÓN
// ============================================================================

async function cargarConfiguracion() {
    const { data, error } = await window.supabaseClient
        .from('configuracion')
        .select('*');
    
    if (error) throw error;
    
    if (data) {
        data.forEach(item => {
            config[item.clave] = item.valor;
        });
    }
}

// ============================================================================
// INICIALIZACIÓN DE LA VISTA DE NOTICIAS
// ============================================================================

async function inicializarNoticias() {
    mostrarLoaderNoticias();
    
    try {
        const noticias = await cargarNoticias();
        
        if (noticias && noticias.length > 0) {
            mostrarNoticias(noticias);
        } else {
            mostrarSinNoticias();
        }
        
        console.log('Vista de noticias cargada exitosamente');
        
    } catch (error) {
        console.error('Error al cargar noticias:', error);
        mostrarMensajeError('Ocurrió un error al cargar las noticias. Por favor, intenta actualizar la página.');
    }
}

// ============================================================================
// CARGAR NOTICIAS DESDE SUPABASE
// ============================================================================

async function cargarNoticias() {
    console.log('Cargando noticias publicadas...');
    
    try {
        const { data: noticias, error } = await window.supabaseClient
            .from('noticias')
            .select('*')
            .eq('estado', 'publicado')
            .order('fecha_publicacion', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('Error al cargar noticias:', error);
            
            if (error.message.includes('permission')) {
                mostrarMensajeError('No tienes permiso para ver las noticias. Contacta al administrador.');
            }
            
            return [];
        }
        
        console.log('Noticias cargadas:', noticias.length);
        return noticias;
        
    } catch (error) {
        console.error('Error inesperado:', error);
        return [];
    }
}

// ============================================================================
// MOSTRAR NOTICIAS EN UI
// ============================================================================

function mostrarNoticias(noticias) {
    const container = document.querySelector('.noticias-container');
    
    if (!container) {
        console.warn('Contenedor de noticias no encontrado');
        return;
    }
    
    container.innerHTML = noticias.map(noticia => {
        const badge = obtenerBadgeCategoria(noticia.categoria);
        
        return `
            <article class="noticia-article" data-noticia-id="${noticia.id}">
                <div class="noticia-imagen">
                    ${noticia.imagen_url ? 
                        `<img src="${noticia.imagen_url}" alt="${noticia.titulo}" style="width: 100%; height: 100%; object-fit: cover;">` :
                        `<svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#d4d4d8"/>
                        </svg>`
                    }
                </div>
                <div class="noticia-contenido">
                    <span class="noticia-badge ${badge.clase}">${badge.texto}</span>
                    <h2 class="noticia-titulo">${noticia.titulo}</h2>
                    <p class="noticia-texto">${truncarTexto(noticia.contenido, 300)}</p>
                    <div class="noticia-meta">
                        <span>${formatearFechaNoticia(noticia.fecha_publicacion)}</span>
                        <span>${noticia.autor_nombre}</span>
                        <span>${noticia.vistas || 0} vistas</span>
                    </div>
                    <button class="btn-leer-mas" data-noticia-id="${noticia.id}">
                        Leer más →
                    </button>
                </div>
            </article>
        `;
    }).join('');
    
    configurarBotonesLeerMas();
    
    console.log('Noticias mostradas en UI');
}

// ============================================================================
// MOSTRAR SIN NOTICIAS
// ============================================================================

function mostrarSinNoticias() {
    const container = document.querySelector('.noticias-container');
    
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 4rem 2rem; background: white; border-radius: 12px; border: 1px solid #e4e4e7;">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 1.5rem; opacity: 0.3;">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor"/>
            </svg>
            <h2 style="font-size: 1.5rem; font-weight: 600; color: #18181b; margin-bottom: 0.5rem;">No hay noticias disponibles</h2>
            <p style="color: #71717a; font-size: 1rem;">Vuelve pronto para ver las últimas actualizaciones de la organización</p>
        </div>
    `;
}

// ============================================================================
// MOSTRAR LOADER
// ============================================================================

function mostrarLoaderNoticias() {
    const container = document.querySelector('.noticias-container');
    
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 4rem 2rem;">
            <div class="spinner-large"></div>
            <p style="margin-top: 1.5rem; color: #71717a; font-size: 1rem;">Cargando noticias...</p>
        </div>
    `;
}

// ============================================================================
// INCREMENTAR VISTAS DE NOTICIA
// ============================================================================

async function incrementarVistas(noticiaId) {
    try {
        const { data: noticia, error: errorGet } = await window.supabaseClient
            .from('noticias')
            .select('vistas')
            .eq('id', noticiaId)
            .single();
        
        if (errorGet) {
            console.error('Error al obtener vistas:', errorGet);
            return;
        }
        
        const { error: errorUpdate } = await window.supabaseClient
            .from('noticias')
            .update({ vistas: (noticia.vistas || 0) + 1 })
            .eq('id', noticiaId);
        
        if (errorUpdate) {
            console.error('Error al incrementar vistas:', errorUpdate);
        } else {
            console.log('Vistas incrementadas para noticia:', noticiaId);
        }
        
    } catch (error) {
        console.error('Error al actualizar vistas:', error);
    }
}

// ============================================================================
// MOSTRAR DETALLE DE NOTICIA (MODAL)
// ============================================================================

async function mostrarDetalleNoticia(noticiaId) {
    try {
        const { data: noticia, error } = await window.supabaseClient
            .from('noticias')
            .select('*')
            .eq('id', noticiaId)
            .single();
        
        if (error) {
            console.error('Error al cargar noticia:', error);
            mostrarMensajeError('Error al cargar el detalle de la noticia');
            return;
        }
        
        await incrementarVistas(noticiaId);
        
        const badge = obtenerBadgeCategoria(noticia.categoria);
        
        const modal = document.createElement('div');
        modal.className = 'modal-noticia';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content-noticia">
                <button class="modal-close" onclick="cerrarModalNoticia()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                    </svg>
                </button>
                
                ${noticia.imagen_url ? `
                    <img src="${noticia.imagen_url}" alt="${noticia.titulo}" class="modal-imagen-noticia">
                ` : ''}
                
                <div class="modal-body-noticia">
                    <span class="noticia-badge ${badge.clase}">${badge.texto}</span>
                    <h1 class="modal-titulo-noticia">${noticia.titulo}</h1>
                    
                    <div class="modal-meta-noticia">
                        <span>${formatearFechaNoticia(noticia.fecha_publicacion)}</span>
                        <span>${noticia.autor_nombre}</span>
                        <span>${(noticia.vistas || 0) + 1} vistas</span>
                    </div>
                    
                    <div class="modal-contenido-noticia">
                        ${formatearContenido(noticia.contenido)}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        document.addEventListener('keydown', handleEscapeKey);
        modal.querySelector('.modal-overlay').addEventListener('click', cerrarModalNoticia);
        
        console.log('Modal de noticia mostrado');
        
    } catch (error) {
        console.error('Error al mostrar detalle:', error);
        mostrarMensajeError('Error al mostrar el detalle de la noticia');
    }
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        cerrarModalNoticia();
    }
}

function cerrarModalNoticia() {
    const modal = document.querySelector('.modal-noticia');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscapeKey);
    }
}

window.cerrarModalNoticia = cerrarModalNoticia;

// ============================================================================
// CONFIGURAR EVENT LISTENERS
// ============================================================================

function configurarBotonesLeerMas() {
    const botones = document.querySelectorAll('.btn-leer-mas');
    
    botones.forEach(boton => {
        boton.addEventListener('click', function() {
            const noticiaId = this.dataset.noticiaId;
            if (noticiaId) {
                mostrarDetalleNoticia(noticiaId);
            }
        });
    });
}

// ============================================================================
// ACTUALIZAR FOOTER
// ============================================================================

function actualizarFooter() {
    const nombre = config.nombre_organizacion || 'Kueni Kueni';
    const direccion = (config.direccion || 'Abasolo 27, Barrio las Flores, Asunción Nochixtlán, Oaxaca').replace(/,\s*/g, '<br>');
    
    document.getElementById('org-nombre-header').textContent = nombre;
    document.getElementById('footer-nombre').textContent = nombre;
    document.getElementById('footer-nombre-copy').textContent = nombre;
    document.getElementById('footer-descripcion').textContent = 'Asociación Civil sin fines de lucro';
    document.getElementById('footer-direccion').innerHTML = direccion;
    document.getElementById('footer-email-extra').textContent = config.email || 'contacto@kuenikueni.org';
    document.getElementById('footer-telefono-extra').textContent = config.telefono || '+52 951 123 4567';
    document.getElementById('year').textContent = new Date().getFullYear();
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function obtenerBadgeCategoria(categoria) {
    const badges = {
        'Medio Ambiente': { clase: 'ambiente', texto: 'Medio Ambiente' },
        'Deportes': { clase: 'deportes', texto: 'Deportes' },
        'Cultura': { clase: 'cultura', texto: 'Cultura' },
        'Emprendimiento': { clase: 'emprendimiento', texto: 'Emprendimiento' },
        'General': { clase: 'general', texto: 'General' }
    };
    
    return badges[categoria] || { clase: 'general', texto: categoria };
}

function formatearFechaNoticia(fecha) {
    const date = new Date(fecha + 'T00:00:00');
    const opciones = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    return date.toLocaleDateString('es-MX', opciones);
}

function truncarTexto(texto, maxLength) {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
}

function formatearContenido(contenido) {
    if (!contenido) return '';
    const parrafos = contenido.split('\n').filter(p => p.trim() !== '');
    return parrafos.map(p => `<p>${p}</p>`).join('');
}

// ============================================================================
// FUNCIONES DE UI - MENSAJES
// ============================================================================

function mostrarMensajeError(mensaje) {
    mostrarMensaje(mensaje, 'error');
}

function mostrarMensajeExito(mensaje) {
    mostrarMensaje(mensaje, 'success');
}

function mostrarMensaje(mensaje, tipo) {
    let container = document.getElementById('messageContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'messageContainer';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(container);
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${tipo}`;
    messageDiv.textContent = mensaje;
    messageDiv.style.cssText = `
        padding: 1rem 1.5rem;
        margin-bottom: 0.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
        min-width: 300px;
        ${tipo === 'error' ? 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;' : ''}
        ${tipo === 'success' ? 'background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;' : ''}
    `;
    
    container.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 5000);
}

// ============================================================================
// ESTILOS ADICIONALES
// ============================================================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    
    .spinner-large {
        width: 50px;
        height: 50px;
        margin: 0 auto;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #5f0d51;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .btn-leer-mas {
        margin-top: 1rem;
        padding: 0.625rem 1.25rem;
        background: #5e0652;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 0.875rem;
    }
    
    .btn-leer-mas:hover {
        background: #4d094d;
        transform: translateX(4px);
    }
    
    .modal-noticia {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
    }
    
    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
    }
    
    .modal-content-noticia {
        position: relative;
        background: white;
        border-radius: 16px;
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease-out;
    }
    
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 40px;
        height: 40px;
        background: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s;
    }
    
    .modal-close:hover {
        background: #f4f4f5;
        transform: rotate(90deg);
    }
    
    .modal-imagen-noticia {
        width: 100%;
        height: 300px;
        object-fit: cover;
        border-radius: 16px 16px 0 0;
    }
    
    .modal-body-noticia {
        padding: 2rem;
    }
    
    .modal-titulo-noticia {
        font-size: 2rem;
        font-weight: 700;
        color: #18181b;
        margin: 1rem 0;
        line-height: 1.3;
    }
    
    .modal-meta-noticia {
        display: flex;
        gap: 1.5rem;
        padding: 1rem 0;
        border-bottom: 1px solid #e4e4e7;
        font-size: 0.875rem;
        color: #71717a;
        flex-wrap: wrap;
    }
    
    .modal-contenido-noticia {
        margin-top: 1.5rem;
        color: #3f3f46;
        line-height: 1.8;
        font-size: 1.0625rem;
    }
    
    .modal-contenido-noticia p {
        margin-bottom: 1rem;
    }
    
    .modal-contenido-noticia p:last-child {
        margin-bottom: 0;
    }
    
    .noticia-badge.general {
        background: #f4f4f5;
        color: #3f3f46;
    }
`;
document.head.appendChild(style);