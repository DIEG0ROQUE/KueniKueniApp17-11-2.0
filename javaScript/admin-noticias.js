// admin-noticias.js - VERSIÓN SOLO LECTURA
// Admin solo puede VER noticias, NO crear/editar/eliminar

document.addEventListener('DOMContentLoaded', function() {
    console.log('Panel de Noticias (Solo Lectura) inicializado');
    
    verificarAutenticacion();
    
    setTimeout(() => {
        if (window.supabaseClient) {
            console.log('Supabase conectado');
            cargarDatos();
        }
    }, 500);
    
    configurarEventos();
    configurarPaginacion();
});

// ================= CONFIGURACIÓN DE PAGINACIÓN =================

function configurarPaginacion() {
    document.getElementById('btnPrevNoticias')?.addEventListener('click', () => cambiarPaginaNoticias(-1));
    document.getElementById('btnNextNoticias')?.addEventListener('click', () => cambiarPaginaNoticias(1));
    document.getElementById('selectItemsPorPaginaNoticias')?.addEventListener('change', (e) => {
        itemsPorPaginaNoticias = parseInt(e.target.value) || 10;
        paginaActualNoticias = 1;
        filtrarNoticias();
    });
}

function cambiarPaginaNoticias(delta) {
    const total = calcularTotalPaginasNoticias();
    paginaActualNoticias += delta;
    if (paginaActualNoticias < 1) paginaActualNoticias = 1;
    if (paginaActualNoticias > total) paginaActualNoticias = total;
    mostrarNoticiasPaginadas();
    actualizarPaginacionNoticias();
}

function calcularTotalPaginasNoticias() {
    return Math.max(1, Math.ceil(noticiasFiltradas.length / itemsPorPaginaNoticias));
}

function actualizarPaginacionNoticias() {
    const total = calcularTotalPaginasNoticias();
    document.getElementById('paginaActualNoticias').textContent = String(paginaActualNoticias);
    document.getElementById('totalPaginasNoticias').textContent = String(total);
    
    const btnPrev = document.getElementById('btnPrevNoticias');
    const btnNext = document.getElementById('btnNextNoticias');
    
    if (btnPrev) btnPrev.disabled = paginaActualNoticias <= 1;
    if (btnNext) btnNext.disabled = paginaActualNoticias >= total;
}

let noticiasGlobal = [];
let noticiasFiltradas = [];
let paginaActualNoticias = 1;
let itemsPorPaginaNoticias = 10;

function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (!isLoggedIn || userType !== 'admin') {
        window.location.href = 'login.html';
    }
}

function configurarEventos() {
    document.getElementById('inputBuscar')?.addEventListener('input', filtrarNoticias);
    document.getElementById('filtroEstado')?.addEventListener('change', filtrarNoticias);
    document.getElementById('filtroCategoria')?.addEventListener('change', filtrarNoticias);
    
    // ELIMINADO: btnAgregarNoticia - Solo lectura
}

async function cargarDatos() {
    try {
        await cargarEstadisticas();
        await cargarNoticias();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cargarEstadisticas() {
    try {
        const { data: noticias } = await window.supabaseClient
            .from('noticias')
            .select('estado, vistas');
        
        if (!noticias) return;
        
        const total = noticias.length;
        const publicadas = noticias.filter(n => n.estado === 'publicado').length;
        const borradores = noticias.filter(n => n.estado === 'borrador').length;
        const totalVistas = noticias.reduce((sum, n) => sum + (n.vistas || 0), 0);
        
        document.getElementById('totalNoticias').textContent = total;
        document.getElementById('noticiasPublicadas').textContent = publicadas;
        document.getElementById('noticiasBorradores').textContent = borradores;
        document.getElementById('totalVistas').textContent = totalVistas.toLocaleString('es-MX');
        
        console.log('Estadísticas cargadas');
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cargarNoticias() {
    try {
        const { data: noticias, error } = await window.supabaseClient
            .from('noticias')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        noticiasGlobal = noticias || [];
        noticiasFiltradas = noticias || [];
        paginaActualNoticias = 1;
        mostrarNoticiasPaginadas();
        actualizarPaginacionNoticias();
        
        console.log(`${noticias?.length || 0} noticias cargadas`);
    } catch (error) {
        console.error('Error:', error);
    }
}

function mostrarNoticiasPaginadas() {
    const tbody = document.getElementById('tablaNoticias');
    if (!tbody) return;
    
    if (!noticiasFiltradas || noticiasFiltradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">No hay noticias</td></tr>';
        return;
    }
    
    // Calcular noticias a mostrar
    const inicio = (paginaActualNoticias - 1) * itemsPorPaginaNoticias;
    const fin = inicio + itemsPorPaginaNoticias;
    const noticiasPagina = noticiasFiltradas.slice(inicio, fin);
    
    tbody.innerHTML = noticiasPagina.map(noticia => {
        const estadoBadge = obtenerEstadoBadge(noticia.estado);
        const categoriaBadge = obtenerCategoriaBadge(noticia.categoria);
        
        const imagenHTML = noticia.imagen_url ? 
            `<div style="width:70px;height:70px;border-radius:8px;overflow:hidden;">
                <img src="${noticia.imagen_url}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';">
            </div>` :
            `<div style="width:70px;height:70px;background:#f4f4f5;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#a1a1aa">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
            </div>`;
        
        return `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:1rem;">
                        ${imagenHTML}
                        <div style="flex:1;">
                            <div style="font-weight:600;margin-bottom:0.25rem;">${noticia.titulo}</div>
                            <div style="font-size:0.875rem;color:#71717a;">${truncarTexto(noticia.contenido, 60)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge-categoria ${categoriaBadge.clase}">${categoriaBadge.texto}</span></td>
                <td style="color:#71717a;">${noticia.autor_nombre}</td>
                <td style="color:#71717a;">${formatearFecha(noticia.fecha_publicacion)}</td>
                <td><span class="badge-estado ${estadoBadge.clase}">${estadoBadge.texto}</span></td>
                <td>
                    <button onclick="verDetalleNoticia('${noticia.id}')" class="btn-icon" title="Ver Detalles">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filtrarNoticias() {
    const busqueda = document.getElementById('inputBuscar').value.toLowerCase();
    const estado = document.getElementById('filtroEstado').value;
    const categoria = document.getElementById('filtroCategoria').value;
    
    let filtradas = noticiasGlobal;
    
    if (busqueda) {
        filtradas = filtradas.filter(n => 
            n.titulo.toLowerCase().includes(busqueda) ||
            n.contenido.toLowerCase().includes(busqueda)
        );
    }
    
    if (estado) {
        filtradas = filtradas.filter(n => n.estado === estado);
    }
    
    if (categoria) {
        filtradas = filtradas.filter(n => n.categoria === categoria);
    }
    
    noticiasFiltradas = filtradas;
    
    // Ajustar página actual si es necesario
    const totalPaginas = calcularTotalPaginasNoticias();
    if (paginaActualNoticias > totalPaginas) paginaActualNoticias = totalPaginas;
    if (paginaActualNoticias < 1) paginaActualNoticias = 1;
    
    mostrarNoticiasPaginadas();
    actualizarPaginacionNoticias();
}

async function verDetalleNoticia(id) {
    try {
        const { data: noticia, error } = await window.supabaseClient
            .from('noticias')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Agregar estilos del modal si no existen
        if (!document.getElementById('modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'modal-styles';
            styles.textContent = `
                .modal-noticia {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                }
                .modal-content-noticia {
                    position: relative;
                    background: white;
                    border-radius: 16px;
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                }
                .modal-close {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: white;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10001;
                    transition: all 0.2s;
                }
                .modal-close:hover {
                    background: #f4f4f5;
                    transform: scale(1.1);
                }
                .modal-body-noticia {
                    padding: 2rem;
                }
                .noticia-badge {
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 600;
                }
            `;
            document.head.appendChild(styles);
        }
        
        const badge = obtenerCategoriaBadge(noticia.categoria);
        
        const modal = document.createElement('div');
        modal.className = 'modal-noticia';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="cerrarModalNoticia()"></div>
            <div class="modal-content-noticia">
                <button class="modal-close" onclick="cerrarModalNoticia()">×</button>
                
                ${noticia.imagen_url ? `
                    <img src="${noticia.imagen_url}" alt="${noticia.titulo}" style="width:100%;height:300px;object-fit:cover;border-radius:16px 16px 0 0;margin-bottom:0;">
                ` : ''}
                
                <div class="modal-body-noticia">
                    <span class="noticia-badge ${badge.clase}">${badge.texto}</span>
                    <h1 style="font-size:2rem;font-weight:700;margin:1rem 0;color:#18181b;">${noticia.titulo}</h1>
                    
                    <div style="display:flex;gap:1.5rem;padding:1rem 0;border-bottom:1px solid #e5e7eb;font-size:0.875rem;color:#71717a;flex-wrap:wrap;">
                        <span> ${formatearFecha(noticia.fecha_publicacion)}</span>
                        <span> ${noticia.autor_nombre}</span>
                        <span> ${noticia.vistas || 0} vistas</span>
                    </div>
                    
                    <div style="margin-top:2rem;color:#3f3f46;line-height:1.8;font-size:1.05rem;white-space:pre-wrap;word-wrap:break-word;">
                        ${formatearContenido(noticia.contenido)}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la noticia');
    }
}

window.verDetalleNoticia = verDetalleNoticia;

function cerrarModalNoticia() {
    const modal = document.querySelector('.modal-noticia');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

window.cerrarModalNoticia = cerrarModalNoticia;

function obtenerEstadoBadge(estado) {
    const badges = {
        'publicado': { clase: 'estado-publicado', texto: 'Publicado' },
        'borrador': { clase: 'estado-borrador', texto: 'Borrador' },
        'archivado': { clase: 'estado-archivado', texto: 'Archivado' }
    };
    return badges[estado] || { clase: '', texto: estado };
}

function obtenerCategoriaBadge(categoria) {
    const badges = {
        'Medio Ambiente': { clase: 'cat-ambiente', texto: 'Medio Ambiente' },
        'Deportes': { clase: 'cat-deportes', texto: 'Deportes' },
        'Cultura': { clase: 'cat-cultura', texto: 'Cultura' },
        'Emprendimiento': { clase: 'cat-emprendimiento', texto: 'Emprendimiento' },
        'General': { clase: 'cat-general', texto: 'General' }
    };
    return badges[categoria] || { clase: '', texto: categoria };
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function truncarTexto(texto, max) {
    if (!texto) return '';
    if (texto.length <= max) return texto;
    return texto.substring(0, max) + '...';
}

function formatearContenido(contenido) {
    if (!contenido) return '';
    
    // Reemplazar saltos de línea múltiples por párrafos
    const parrafos = contenido
        .split(/\n\n+/) // Divide por dobles saltos de línea
        .map(p => p.trim())
        .filter(p => p !== '');
    
    // Si no hay párrafos separados, dividir por saltos simples
    if (parrafos.length === 1) {
        return contenido
            .split('\n')
            .map(linea => linea.trim())
            .filter(linea => linea !== '')
            .map(linea => `<p style="margin-bottom:1rem;">${linea}</p>`)
            .join('');
    }
    
    return parrafos.map(p => `<p style="margin-bottom:1.5rem;">${p.replace(/\n/g, '<br>')}</p>`).join('');
}