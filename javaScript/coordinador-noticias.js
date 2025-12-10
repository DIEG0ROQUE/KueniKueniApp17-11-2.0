// coordinador-noticias.js - CON PAGINACIÓN 5 EN 5 Y ALERTAS PERSONALIZADAS
console.log('✅ Sistema de noticias del coordinador iniciando...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado');
    verificarAutenticacion();
    
    setTimeout(() => {
        if (window.supabaseClient) {
            console.log('✅ Supabase conectado');
            inicializarStorage();
            cargarDatos();
        }
    }, 500);
    
    configurarEventos();
    configurarValidaciones();
});

let noticiasGlobal = [];
let noticiasFiltradas = [];
let noticiaEditando = null;
let imagenSubida = null;

// Variables de paginación
let paginaActual = 1;
const noticiasPorPagina = 5;

// ============================================
// COMPONENTE DE ALERTA PERSONALIZADA
// ============================================

function mostrarAlertaPersonalizada(titulo, mensaje, textoAceptar = 'Aceptar', textoCancelar = 'Cancelar', onAceptar = null) {
    const alertaExistente = document.getElementById('alertaPersonalizada');
    if (alertaExistente) alertaExistente.remove();

    const alertaHTML = `
        <div id="alertaPersonalizada" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        ">
            <div style="
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
                padding: 2rem;
                animation: slideUp 0.3s ease;
            ">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="
                        width: 56px;
                        height: 56px;
                        background: linear-gradient(135deg, #5f0d51 0%, #7d1166 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1rem;
                    ">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </div>
                    <h3 style="font-size: 1.5rem; font-weight: 700; color: #18181b; margin: 0 0 0.5rem 0;">${titulo}</h3>
                    <p style="font-size: 1rem; color: #71717a; margin: 0;">${mensaje}</p>
                </div>
                <div style="display: flex; gap: 0.75rem; margin-top: 2rem;">
                    <button id="btnCancelarAlerta" style="
                        flex: 1;
                        padding: 0.875rem;
                        background: #f3f4f6;
                        color: #52525b;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">${textoCancelar}</button>
                    <button id="btnAceptarAlerta" style="
                        flex: 1;
                        padding: 0.875rem;
                        background: linear-gradient(135deg, #5f0d51 0%, #7d1166 100%);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: 0 4px 12px rgba(95, 13, 81, 0.3);
                    ">${textoAceptar}</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertaHTML);
    document.body.style.overflow = 'hidden';

    const alerta = document.getElementById('alertaPersonalizada');
    const btnAceptar = document.getElementById('btnAceptarAlerta');
    const btnCancelar = document.getElementById('btnCancelarAlerta');

    btnAceptar.addEventListener('mouseenter', () => {
        btnAceptar.style.transform = 'translateY(-2px)';
        btnAceptar.style.boxShadow = '0 6px 16px rgba(95, 13, 81, 0.4)';
    });
    btnAceptar.addEventListener('mouseleave', () => {
        btnAceptar.style.transform = 'translateY(0)';
        btnAceptar.style.boxShadow = '0 4px 12px rgba(95, 13, 81, 0.3)';
    });

    btnCancelar.addEventListener('mouseenter', () => {
        btnCancelar.style.background = '#e5e7eb';
        btnCancelar.style.transform = 'translateY(-2px)';
    });
    btnCancelar.addEventListener('mouseleave', () => {
        btnCancelar.style.background = '#f3f4f6';
        btnCancelar.style.transform = 'translateY(0)';
    });

    const cerrarAlerta = () => {
        alerta.style.opacity = '0';
        setTimeout(() => {
            alerta.remove();
            document.body.style.overflow = '';
        }, 200);
    };

    btnCancelar.addEventListener('click', cerrarAlerta);
    btnAceptar.addEventListener('click', () => {
        if (onAceptar) onAceptar();
        cerrarAlerta();
    });

    alerta.addEventListener('click', (e) => {
        if (e.target === alerta) cerrarAlerta();
    });
}

// CSS para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// ============================================
// INICIALIZAR SUPABASE STORAGE
// ============================================
async function inicializarStorage() {
    try {
        const { data: buckets, error: listError } = await window.supabaseClient
            .storage
            .listBuckets();
        
        if (listError) {
            console.error('Error al listar buckets:', listError);
            return;
        }
        
        const bucketExists = buckets?.some(b => b.name === 'noticias');
        
        if (!bucketExists) {
            console.log('Bucket "noticias" no existe. Debes crearlo manualmente en Supabase.');
        } else {
            console.log('✅ Bucket "noticias" disponible');
        }
    } catch (error) {
        console.error('Error al inicializar storage:', error);
    }
}

// ============================================
// AUTENTICACIÓN
// ============================================
function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (!isLoggedIn || userType !== 'coordinador') {
        window.location.href = 'login.html';
    }
}

// ============================================
// CONFIGURACIÓN DE EVENTOS
// ============================================
function configurarEventos() {
    document.getElementById('btnCerrarSesion')?.addEventListener('click', () => {
        mostrarAlertaPersonalizada(
            '¿Cerrar sesión?',
            'Se cerrará tu sesión actual',
            'Aceptar',
            'Cancelar',
            () => {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        );
    });
    
    document.getElementById('btnAgregarNoticia')?.addEventListener('click', abrirModalNueva);
    document.getElementById('btnCerrarModal')?.addEventListener('click', cerrarModal);
    document.getElementById('btnCancelarModal')?.addEventListener('click', cerrarModal);
    document.querySelector('.modal-overlay')?.addEventListener('click', cerrarModal);
    
    document.getElementById('formNoticia')?.addEventListener('submit', function(e) {
        e.preventDefault();
        guardarNoticia();
    });
    
    document.getElementById('inputBuscar')?.addEventListener('input', filtrarNoticias);
    document.getElementById('filtroEstado')?.addEventListener('change', filtrarNoticias);
    document.getElementById('filtroCategoria')?.addEventListener('change', filtrarNoticias);
    
    document.getElementById('imagenFile')?.addEventListener('change', handleImagenFileChange);
    
    document.getElementById('imagenUrl')?.addEventListener('input', function() {
        const url = this.value.trim();
        mostrarPreviewImagen(url);
    });
}

function configurarValidaciones() {
    const titulo = document.getElementById('titulo');
    const contenido = document.getElementById('contenido');
    
    if (titulo) {
        titulo.addEventListener('input', function() {
            if (this.value.length > 200) {
                this.value = this.value.substring(0, 200);
            }
        });
    }
    
    if (contenido) {
        contenido.addEventListener('input', function() {
            if (this.value.length > 5000) {
                this.value = this.value.substring(0, 5000);
            }
        });
    }
}

// ============================================
// MANEJO DE SUBIDA DE IMAGEN
// ============================================
async function handleImagenFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        mostrarMensaje('❌ La imagen debe ser menor a 2MB', 'error');
        event.target.value = '';
        return;
    }
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        mostrarMensaje('❌ Solo se permiten imágenes JPG, PNG o WEBP', 'error');
        event.target.value = '';
        return;
    }
    
    try {
        const reader = new FileReader();
        reader.onload = function(e) {
            mostrarPreviewImagen(e.target.result);
        };
        reader.readAsDataURL(file);
        
        imagenSubida = file;
        console.log('✅ Imagen seleccionada:', file.name);
        
    } catch (error) {
        console.error('Error al procesar imagen:', error);
        mostrarMensaje('❌ Error al procesar imagen', 'error');
    }
}

function mostrarPreviewImagen(url) {
    const preview = document.getElementById('imagenPreview');
    if (preview && url) {
        preview.innerHTML = `
            <img src="${url}" style="width:100%;height:200px;object-fit:cover;border-radius:8px;">
        `;
    }
}

async function subirImagen(file) {
    try {
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const fileName = `noticia_${timestamp}.${extension}`;
        
        const { data, error } = await window.supabaseClient
            .storage
            .from('noticias')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        const { data: { publicUrl } } = window.supabaseClient
            .storage
            .from('noticias')
            .getPublicUrl(fileName);
        
        console.log('✅ Imagen subida:', publicUrl);
        return publicUrl;
        
    } catch (error) {
        console.error('Error al subir imagen:', error);
        throw error;
    }
}

// ============================================
// CARGAR DATOS
// ============================================
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
        document.getElementById('totalVistas').textContent = totalVistas;
        
        console.log('✅ Estadísticas cargadas');
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cargarNoticias() {
    try {
        const { data: noticias, error } = await window.supabaseClient
            .from('noticias')
            .select('*')
            .order('fecha_publicacion', { ascending: false });
        
        if (error) throw error;
        
        noticiasGlobal = noticias || [];
        noticiasFiltradas = noticias || [];
        paginaActual = 1;
        mostrarNoticiasPaginadas();
        
        console.log('✅ Noticias cargadas:', noticias?.length);
    } catch (error) {
        console.error('Error:', error);
    }
}

// ============================================
// PAGINACIÓN DE 5 EN 5
// ============================================

function mostrarNoticiasPaginadas() {
    const inicio = (paginaActual - 1) * noticiasPorPagina;
    const fin = inicio + noticiasPorPagina;
    const noticiasPagina = noticiasFiltradas.slice(inicio, fin);
    
    mostrarNoticias(noticiasPagina);
    mostrarControlesPaginacion();
}

function mostrarControlesPaginacion() {
    const totalPaginas = Math.ceil(noticiasFiltradas.length / noticiasPorPagina);
    const tbody = document.getElementById('tablaNoticias');
    
    if (totalPaginas <= 1) return;
    
    const paginacionHTML = `
        <tr>
            <td colspan="7" style="padding: 1.5rem; text-align: center; background: #f9fafb; border-top: 2px solid #e5e7eb;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
                    <button onclick="cambiarPagina(${paginaActual - 1})" 
                        ${paginaActual === 1 ? 'disabled' : ''}
                        style="
                            padding: 0.5rem 1rem;
                            background: ${paginaActual === 1 ? '#f3f4f6' : '#5f0d51'};
                            color: ${paginaActual === 1 ? '#9ca3af' : 'white'};
                            border: none;
                            border-radius: 8px;
                            cursor: ${paginaActual === 1 ? 'not-allowed' : 'pointer'};
                            font-weight: 600;
                            transition: all 0.2s;
                        ">
                        ← Anterior
                    </button>
                    
                    <span style="font-weight: 600; color: #18181b;">
                        Página ${paginaActual} de ${totalPaginas}
                    </span>
                    
                    <button onclick="cambiarPagina(${paginaActual + 1})" 
                        ${paginaActual === totalPaginas ? 'disabled' : ''}
                        style="
                            padding: 0.5rem 1rem;
                            background: ${paginaActual === totalPaginas ? '#f3f4f6' : '#5f0d51'};
                            color: ${paginaActual === totalPaginas ? '#9ca3af' : 'white'};
                            border: none;
                            border-radius: 8px;
                            cursor: ${paginaActual === totalPaginas ? 'not-allowed' : 'pointer'};
                            font-weight: 600;
                            transition: all 0.2s;
                        ">
                        Siguiente →
                    </button>
                </div>
            </td>
        </tr>
    `;
    
    tbody.insertAdjacentHTML('beforeend', paginacionHTML);
}

function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(noticiasFiltradas.length / noticiasPorPagina);
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    paginaActual = nuevaPagina;
    mostrarNoticiasPaginadas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.cambiarPagina = cambiarPagina;

// ============================================
// MOSTRAR NOTICIAS
// ============================================

function mostrarNoticias(noticias) {
    const tbody = document.getElementById('tablaNoticias');
    if (!tbody) return;
    
    if (!noticias || noticias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;">No hay noticias</td></tr>';
        return;
    }
    
    tbody.innerHTML = noticias.map(noticia => {
        const estadoBadge = obtenerEstadoBadge(noticia.estado);
        const categoriaBadge = obtenerCategoriaBadge(noticia.categoria);
        
        return `
            <tr>
                <td>
                    <div class="noticia-card">
                        ${noticia.imagen_url ? `
                            <img src="${noticia.imagen_url}" class="noticia-imagen" alt="${noticia.titulo}">
                        ` : ''}
                        <div class="noticia-info">
                            <h3 class="noticia-titulo">${noticia.titulo}</h3>
                            <p class="noticia-descripcion">${truncarTexto(noticia.contenido, 80)}</p>
                        </div>
                    </div>
                </td>
                <td><span class="badge-categoria ${categoriaBadge.clase}">${categoriaBadge.texto}</span></td>
                <td style="font-size:0.875rem;color:#6b7280;">${noticia.autor || 'Coordinador'}</td>
                <td style="font-size:0.875rem;color:#6b7280;">${formatearFecha(noticia.fecha_publicacion)}</td>
                <td><span class="badge-estado ${estadoBadge.clase}">${estadoBadge.texto}</span></td>
                <td style="text-align:center;font-weight:600;color:#18181b;">${noticia.vistas || 0}</td>
                <td>
                    <div style="display:flex;gap:0.5rem;justify-content:center;">
                        <button onclick="editarNoticia('${noticia.id}')" class="btn-icon" title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button onclick="eliminarNoticia('${noticia.id}')" class="btn-icon btn-danger" title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filtrarNoticias() {
    const busqueda = document.getElementById('inputBuscar').value.toLowerCase();
    const estado = document.getElementById('filtroEstado').value;
    const categoria = document.getElementById('filtroCategoria').value;
    
    noticiasFiltradas = noticiasGlobal;
    
    if (busqueda) {
        noticiasFiltradas = noticiasFiltradas.filter(n => 
            n.titulo.toLowerCase().includes(busqueda) ||
            n.contenido?.toLowerCase().includes(busqueda)
        );
    }
    if (estado) noticiasFiltradas = noticiasFiltradas.filter(n => n.estado === estado);
    if (categoria) noticiasFiltradas = noticiasFiltradas.filter(n => n.categoria === categoria);
    
    paginaActual = 1;
    mostrarNoticiasPaginadas();
}

// ============================================
// MODAL
// ============================================

function abrirModalNueva() {
    noticiaEditando = null;
    imagenSubida = null;
    document.getElementById('modalTitulo').textContent = 'Nueva Noticia';
    document.getElementById('formNoticia').reset();
    document.getElementById('imagenPreview').innerHTML = '';
    abrirModal();
}

function abrirModal() {
    const modal = document.getElementById('modalNoticia');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal() {
    const modal = document.getElementById('modalNoticia');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    noticiaEditando = null;
    imagenSubida = null;
}

// ============================================
// GUARDAR NOTICIA - CORREGIDO SIN CAMPO 'autor'
// ============================================

async function guardarNoticia() {
    const btnGuardar = document.getElementById('btnGuardarNoticia');
    const btnText = document.getElementById('btnGuardarText');
    const btnLoader = document.getElementById('btnGuardarLoader');
    
    btnGuardar.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';

    try {
        let imagenUrl = document.getElementById('imagenUrl').value.trim();
        
        if (imagenSubida) {
            imagenUrl = await subirImagen(imagenSubida);
        }
        
        // Leer la fecha del campo o usar la fecha actual
        let fechaPublicacion = document.getElementById('fechaPublicacion').value;
        if (!fechaPublicacion) {
            fechaPublicacion = new Date().toISOString().split('T')[0];
        }
        
        // CAMBIO IMPORTANTE: Se eliminó el campo 'autor' porque no existe en la tabla de Supabase
        const datos = {
            titulo: document.getElementById('titulo').value.trim(),
            categoria: document.getElementById('categoria').value,
            contenido: document.getElementById('contenido').value.trim(),
            imagen_url: imagenUrl || null,
            estado: document.getElementById('estado').value,
            fecha_publicacion: fechaPublicacion
        };

        // Validar que los campos requeridos no estén vacíos
        if (!datos.titulo || !datos.categoria || !datos.contenido || !datos.estado) {
            throw new Error('Todos los campos requeridos deben estar completos');
        }

        let error;
        if (noticiaEditando) {
            const result = await window.supabaseClient
                .from('noticias')
                .update(datos)
                .eq('id', noticiaEditando);
            error = result.error;
        } else {
            datos.vistas = 0;
            const result = await window.supabaseClient
                .from('noticias')
                .insert([datos]);
            error = result.error;
        }

        if (error) {
            console.error('Error de Supabase:', error);
            throw error;
        }

        mostrarMensaje(noticiaEditando ? '✅ Noticia actualizada correctamente' : '✅ Noticia creada correctamente', 'success');
        cerrarModal();
        await cargarDatos();
    } catch (error) {
        console.error('Error completo:', error);
        mostrarMensaje('❌ Error al guardar: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
        btnGuardar.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// ============================================
// EDITAR NOTICIA
// ============================================

async function editarNoticia(id) {
    try {
        const { data: noticia, error } = await window.supabaseClient
            .from('noticias')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        noticiaEditando = id;
        document.getElementById('modalTitulo').textContent = '✏️ Editar Noticia';
        document.getElementById('titulo').value = noticia.titulo;
        document.getElementById('categoria').value = noticia.categoria;
        document.getElementById('contenido').value = noticia.contenido;
        document.getElementById('imagenUrl').value = noticia.imagen_url || '';
        document.getElementById('estado').value = noticia.estado;
        
        // Cargar la fecha de publicación en el campo
        if (noticia.fecha_publicacion) {
            document.getElementById('fechaPublicacion').value = noticia.fecha_publicacion;
        }
        
        if (noticia.imagen_url) {
            mostrarPreviewImagen(noticia.imagen_url);
        }
        
        abrirModal();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error al cargar noticia', 'error');
    }
}

window.editarNoticia = editarNoticia;

// ============================================
// ELIMINAR NOTICIA
// ============================================

async function eliminarNoticia(id) {
    mostrarAlertaPersonalizada(
        '¿Eliminar noticia?',
        'Esta acción no se puede deshacer',
        'Eliminar',
        'Cancelar',
        async () => {
            try {
                const { error } = await window.supabaseClient
                    .from('noticias')
                    .delete()
                    .eq('id', id);
                
                if (error) throw error;
                
                mostrarMensaje('✅ Noticia eliminada', 'success');
                await cargarDatos();
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('❌ Error al eliminar', 'error');
            }
        }
    );
}

window.eliminarNoticia = eliminarNoticia;

// ============================================
// UTILIDADES
// ============================================

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
        'Cultura': { clase: 'cat-cultura', texto: 'Cultura' },
        'Medio Ambiente': { clase: 'cat-medio-ambiente', texto: 'Medio Ambiente' },
        'Deportes': { clase: 'cat-deportes', texto: 'Deportes' },
        'Emprendimiento': { clase: 'cat-emprendimiento', texto: 'Emprendimiento' },
        'General': { clase: 'cat-general', texto: 'General' }
    };
    return badges[categoria] || { clase: 'cat-general', texto: categoria };
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function truncarTexto(texto, max) {
    if (!texto) return '';
    if (texto.length <= max) return texto;
    return texto.substring(0, max) + '...';
}

function mostrarMensaje(texto, tipo) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;animation:slideIn 0.3s ease;';
    container.innerHTML = `<div style="padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);background:${tipo === 'success' ? '#d1fae5' : '#fee2e2'};color:${tipo === 'success' ? '#065f46' : '#dc2626'};border:1px solid ${tipo === 'success' ? '#a7f3d0' : '#fecaca'};">${texto}</div>`;
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 3000);
}

console.log('✅ Sistema MEJORADO cargado');
console.log('✅ Paginación: 5 noticias por página');
console.log('✅ Alertas personalizadas');
console.log('✅ Animaciones sutiles');
console.log('✅ CORREGIDO: Campo "autor" eliminado de guardarNoticia()');
