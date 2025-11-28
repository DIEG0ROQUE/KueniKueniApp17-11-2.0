// coordinador-noticias.js - Sistema completo de gestión de noticias con almacenamiento de imágenes
console.log('Sistema de noticias del coordinador iniciando...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado');
    verificarAutenticacion();
    
    setTimeout(() => {
        if (window.supabaseClient) {
            console.log('Supabase conectado');
            inicializarStorage();
            cargarDatos();
        }
    }, 500);
    
    configurarEventos();
    configurarValidaciones();
});

let noticiasGlobal = [];
let noticiaEditando = null;
let imagenSubida = null;

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
            console.log('Bucket "noticias" disponible');
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

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

// ============================================
// CONFIGURACIÓN DE EVENTOS
// ============================================
function configurarEventos() {
    document.getElementById('btnCerrarSesion')?.addEventListener('click', cerrarSesion);
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

// ============================================
// MANEJO DE SUBIDA DE IMAGEN
// ============================================
async function handleImagenFileChange(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        mostrarMensajeModal('Por favor selecciona un archivo de imagen válido', 'error');
        event.target.value = '';
        return;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        mostrarMensajeModal('La imagen no debe exceder 5MB', 'error');
        event.target.value = '';
        return;
    }
    
    const progressDiv = document.getElementById('uploadProgress');
    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.innerHTML = '<div style="color:#0d5f3a;font-weight:500;">⏳ Subiendo imagen...</div>';
    }
    
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
        
        if (error) {
            throw error;
        }
        
        const { data: urlData } = window.supabaseClient
            .storage
            .from('noticias')
            .getPublicUrl(fileName);
        
        const publicUrl = urlData.publicUrl;
        
        imagenSubida = {
            fileName: fileName,
            url: publicUrl
        };
        
        document.getElementById('imagenUrl').value = publicUrl;
        mostrarPreviewImagen(publicUrl);
        
        if (progressDiv) {
            progressDiv.innerHTML = '<div style="color:#065f46;font-weight:500;">✅ Imagen subida exitosamente</div>';
            setTimeout(() => {
                progressDiv.style.display = 'none';
            }, 3000);
        }
        
        console.log('Imagen subida:', fileName);
        
    } catch (error) {
        console.error('Error al subir imagen:', error);
        
        let errorMsg = 'Error al subir la imagen';
        if (error.message.includes('Bucket not found')) {
            errorMsg = 'El bucket "noticias" no existe. Créalo en Supabase Storage con acceso público.';
        } else if (error.message.includes('permission')) {
            errorMsg = 'No tienes permisos para subir archivos. Configura las políticas RLS.';
        }
        
        mostrarMensajeModal(errorMsg, 'error');
        
        if (progressDiv) {
            progressDiv.innerHTML = `<div style="color:#dc2626;">${errorMsg}</div>`;
        }
        
        event.target.value = '';
    }
}

function mostrarPreviewImagen(url) {
    const preview = document.getElementById('imagenPreview');
    const img = document.getElementById('imagenPreviewImg');
    
    if (url) {
        img.src = url;
        preview.style.display = 'block';
        
        img.onerror = function() {
            preview.style.display = 'none';
        };
    } else {
        preview.style.display = 'none';
    }
}

async function eliminarImagenStorage(imagenUrl) {
    if (!imagenUrl) return;
    
    try {
        if (!imagenUrl.includes('supabase.co/storage')) {
            console.log('La imagen no está en Supabase Storage, omitiendo eliminación');
            return;
        }
        
        const fileName = imagenUrl.split('/').pop().split('?')[0];
        
        if (!fileName) {
            console.log('No se pudo extraer el nombre del archivo');
            return;
        }
        
        const { error } = await window.supabaseClient
            .storage
            .from('noticias')
            .remove([fileName]);
        
        if (error) {
            console.error('Error al eliminar imagen:', error);
        } else {
            console.log('Imagen eliminada del storage:', fileName);
        }
        
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
    }
}

// ============================================
// VALIDACIONES
// ============================================
function configurarValidaciones() {
    const tituloInput = document.getElementById('titulo');
    const contenidoInput = document.getElementById('contenido');
    
    if (tituloInput) {
        tituloInput.addEventListener('blur', validarTitulo);
    }
    
    if (contenidoInput) {
        contenidoInput.addEventListener('blur', validarContenido);
    }
}

function validarTitulo() {
    const titulo = document.getElementById('titulo').value.trim();
    const error = document.getElementById('tituloError');
    
    if (!titulo) {
        error.textContent = 'El título es obligatorio';
        return false;
    }
    
    if (titulo.length < 10) {
        error.textContent = 'El título debe tener al menos 10 caracteres';
        return false;
    }
    
    if (titulo.length > 255) {
        error.textContent = 'El título no puede exceder 255 caracteres';
        return false;
    }
    
    error.textContent = '';
    return true;
}

function validarContenido() {
    const contenido = document.getElementById('contenido').value.trim();
    const error = document.getElementById('contenidoError');
    
    if (!contenido) {
        error.textContent = 'El contenido es obligatorio';
        return false;
    }
    
    if (contenido.length < 50) {
        error.textContent = 'El contenido debe tener al menos 50 caracteres';
        return false;
    }
    
    error.textContent = '';
    return true;
}

// ============================================
// CARGAR DATOS
// ============================================
async function cargarDatos() {
    if (!window.supabaseClient) return;
    
    try {
        await cargarEstadisticas();
        await cargarNoticias();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar datos', 'error');
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
        console.error('Error al cargar estadísticas:', error);
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
        mostrarNoticias(noticias || []);
        
        console.log(`${noticias?.length || 0} noticias cargadas`);
    } catch (error) {
        console.error('Error al cargar noticias:', error);
        mostrarMensaje('Error al cargar noticias', 'error');
    }
}

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
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        ${noticia.imagen_url ? 
                            `<img src="${noticia.imagen_url}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">` :
                            `<div style="width:60px;height:60px;background:#f4f4f5;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#a1a1aa">
                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                </svg>
                            </div>`
                        }
                        <div>
                            <div style="font-weight:600;margin-bottom:0.25rem;">${noticia.titulo}</div>
                            <div style="font-size:0.875rem;color:#71717a;">${truncarTexto(noticia.contenido, 60)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge-categoria ${categoriaBadge.clase}">${categoriaBadge.texto}</span></td>
                <td style="color:#71717a;">${noticia.autor_nombre}</td>
                <td style="color:#71717a;">${formatearFecha(noticia.fecha_publicacion)}</td>
                <td><span class="badge-estado ${estadoBadge.clase}">${estadoBadge.texto}</span></td>
                <td style="text-align:center;font-weight:600;">${noticia.vistas || 0}</td>
                <td>
                    <div style="display:flex;gap:0.5rem;">
                        <button onclick="editarNoticia('${noticia.id}')" class="btn-icon" title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button onclick="eliminarNoticia('${noticia.id}', '${noticia.imagen_url || ''}')" class="btn-icon btn-danger" title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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
    
    let filtradas = noticiasGlobal;
    
    if (busqueda) {
        filtradas = filtradas.filter(n => 
            n.titulo.toLowerCase().includes(busqueda) ||
            n.contenido.toLowerCase().includes(busqueda) ||
            n.autor_nombre.toLowerCase().includes(busqueda)
        );
    }
    
    if (estado) {
        filtradas = filtradas.filter(n => n.estado === estado);
    }
    
    if (categoria) {
        filtradas = filtradas.filter(n => n.categoria === categoria);
    }
    
    mostrarNoticias(filtradas);
    console.log(`Filtrado: ${filtradas.length} de ${noticiasGlobal.length}`);
}

// ============================================
// MODAL
// ============================================
function abrirModalNueva() {
    noticiaEditando = null;
    imagenSubida = null;
    document.getElementById('modalTitulo').textContent = 'Nueva Noticia';
    document.getElementById('formNoticia').reset();
    document.getElementById('imagenPreview').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
    
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaPublicacion').value = hoy;
    
    abrirModal();
}

function abrirModal() {
    const modal = document.getElementById('modalNoticia');
    if (modal) {
        modal.style.display = 'flex';
        limpiarFormulario();
    }
}

function cerrarModal() {
    const modal = document.getElementById('modalNoticia');
    if (modal) modal.style.display = 'none';
    limpiarFormulario();
    noticiaEditando = null;
    imagenSubida = null;
}

function limpiarFormulario() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.getElementById('modalMessage').innerHTML = '';
}

// ============================================
// CRUD NOTICIAS
// ============================================
async function guardarNoticia() {
    const tituloValido = validarTitulo();
    const contenidoValido = validarContenido();
    
    if (!tituloValido || !contenidoValido) {
        mostrarMensajeModal('Por favor corrige los errores', 'error');
        return;
    }
    
    const titulo = document.getElementById('titulo').value.trim();
    const contenido = document.getElementById('contenido').value.trim();
    const categoria = document.getElementById('categoria').value;
    const estado = document.getElementById('estado').value;
    const fechaPublicacion = document.getElementById('fechaPublicacion').value;
    const imagenUrl = document.getElementById('imagenUrl').value.trim();
    
    if (!categoria) {
        mostrarMensajeModal('Selecciona una categoría', 'error');
        return;
    }
    
    const btnGuardar = document.getElementById('btnGuardarNoticia');
    const btnText = document.getElementById('btnGuardarText');
    const btnLoader = document.getElementById('btnGuardarLoader');
    const loader = document.getElementById('loader');
    
    try {
        btnGuardar.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        if (loader) loader.style.display = 'flex';
        
        const autorNombre = sessionStorage.getItem('userName') || 'Coordinador';
        const autorId = sessionStorage.getItem('userId');
        
        const noticiaData = {
            titulo,
            contenido,
            categoria,
            estado,
            fecha_publicacion: fechaPublicacion || new Date().toISOString().split('T')[0],
            imagen_url: imagenUrl || null,
            autor_nombre: autorNombre,
            autor_id: autorId
        };
        
        let error;
        
        if (noticiaEditando) {
            const result = await window.supabaseClient
                .from('noticias')
                .update(noticiaData)
                .eq('id', noticiaEditando);
            error = result.error;
            console.log('Noticia actualizada');
        } else {
            const result = await window.supabaseClient
                .from('noticias')
                .insert([noticiaData]);
            error = result.error;
            console.log('Nueva noticia creada');
        }
        
        if (error) throw error;
        
        mostrarMensajeModal('¡Noticia guardada exitosamente!', 'success');
        
        await cargarDatos();
        setTimeout(cerrarModal, 1500);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeModal(error.message || 'Error al guardar', 'error');
    } finally {
        btnGuardar.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        if (loader) loader.style.display = 'none';
    }
}

async function editarNoticia(id) {
    try {
        const { data: noticia, error } = await window.supabaseClient
            .from('noticias')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        noticiaEditando = id;
        imagenSubida = null;
        document.getElementById('modalTitulo').textContent = '✏️ Editar Noticia';
        
        document.getElementById('titulo').value = noticia.titulo;
        document.getElementById('contenido').value = noticia.contenido;
        document.getElementById('categoria').value = noticia.categoria;
        document.getElementById('estado').value = noticia.estado;
        document.getElementById('fechaPublicacion').value = noticia.fecha_publicacion;
        document.getElementById('imagenUrl').value = noticia.imagen_url || '';
        
        if (noticia.imagen_url) {
            mostrarPreviewImagen(noticia.imagen_url);
        }
        
        abrirModal();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar noticia', 'error');
    }
}

async function eliminarNoticia(id, imagenUrl) {
    if (!confirm('¿Estás seguro de eliminar esta noticia? Esta acción eliminará también la imagen asociada y no se puede deshacer.')) {
        return;
    }
    
    const loader = document.getElementById('loader');
    
    try {
        if (loader) loader.style.display = 'flex';
        
        if (imagenUrl) {
            await eliminarImagenStorage(imagenUrl);
        }
        
        const { error } = await window.supabaseClient
            .from('noticias')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        mostrarMensaje('Noticia e imagen eliminadas exitosamente', 'success');
        await cargarDatos();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al eliminar noticia', 'error');
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

window.editarNoticia = editarNoticia;
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
    const [year, month, day] = fecha.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function truncarTexto(texto, max) {
    if (!texto) return '';
    if (texto.length <= max) return texto;
    return texto.substring(0, max) + '...';
}

function mostrarMensaje(texto, tipo) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;';
    container.innerHTML = `<div style="padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);background:${tipo === 'success' ? '#d1fae5' : '#fee2e2'};color:${tipo === 'success' ? '#065f46' : '#dc2626'};border:1px solid ${tipo === 'success' ? '#a7f3d0' : '#fecaca'};">${texto}</div>`;
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 3000);
}

function mostrarMensajeModal(texto, tipo) {
    const container = document.getElementById('modalMessage');
    container.innerHTML = `<div style="padding:1rem;border-radius:8px;margin-bottom:1rem;background:${tipo === 'success' ? '#d1fae5' : '#fee2e2'};color:${tipo === 'success' ? '#065f46' : '#dc2626'};border:1px solid ${tipo === 'success' ? '#a7f3d0' : '#fecaca'};">${texto}</div>`;
    if (tipo === 'success') setTimeout(() => container.innerHTML = '', 3000);
}

console.log('Sistema de noticias del coordinador cargado');