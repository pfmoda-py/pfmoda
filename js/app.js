/**
 * app.js - Lógica principal del Frontend PF Moda
 * Compatible con la API en formato camelCase
 */

let todosLosProductos = [];
let categoriaActual = "todos";
let subcategoriaActual = "todos";
let textoBusqueda = "";

let carrito = [];
try {
    const guardado = localStorage.getItem("pf_moda_carrito");

    if (guardado) {
        const datos = JSON.parse(guardado);

        if (Array.isArray(datos)) {
            carrito = datos;
        }
    }
} catch (error) {
    console.warn("No se pudo recuperar el carrito guardado:", error);
}

let productoModalActual = null;
let imagenesModal = [];
let indiceImagenModal = 0;
let visorImagenActivo = false;
let todasLasSubcategorias = [];
let ordenActual = "recientes";
let precioMaximoFiltro = Infinity;
let carritoPasoActual = 1; // Paso actual del carrito: 1 = Resumen, 2 = Datos del cliente
let itiWhatsapp = null; // instancia del selector de país/WhatsApp
let WHATSAPP_NUMERO = "595983208288"; // Se sobrescribe con el valor real de Configuracion al cargar

// Objeto de estado encapsulado para variantes en lugar de variables sueltas
const varianteSeleccionada = {
  color: null,
  talle: null,
  
  reset() {
    this.color = null;
    this.talle = null;
    document.querySelectorAll('.opcion-variante.seleccionada').forEach(el => {
      el.classList.remove('seleccionada');
    });
  }
};

// --- Variables táctiles para Swipe Móvil ---
let touchInicioX = 0;
let touchInicioY = 0;
let touchFinX = 0;
let touchFinY = 0;

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", async () => {
    await aplicarConfiguracionSitio();
    await inicializarTienda();
    configurarEventos();
    configurarValidacionWhatsapp();
    actualizarCarritoUI();
    configurarWhatsAppFlotante();
    configurarFooterUI();
    configurarEnlacesFooter();
    configurarHeaderDinamico();
    
});

/* =========================================
   VALIDACIÓN INTERNACIONAL DEL WHATSAPP (con selector de país)
========================================= */

function configurarValidacionWhatsapp() {
    const input = document.getElementById("cliente-whatsapp");
    const error = document.getElementById("error-cliente-whatsapp");

    if (!input || !error || typeof window.intlTelInput === "undefined") return;

    itiWhatsapp = window.intlTelInput(input, {
        initialCountry: "py",
        preferredCountries: ["py", "ar", "br", "uy", "bo", "us","pe","co","ec","cl","es"],
        separateDialCode: true,
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js"
    });

    function limpiarError() {
        input.classList.remove("campo-invalido");
        error.style.display = "none";
    }

    function mostrarError(mensaje) {
        input.classList.add("campo-invalido");
        error.textContent = mensaje;
        error.style.display = "block";
    }

    input.addEventListener("input", limpiarError);

    input.addEventListener("blur", () => {
        if (!input.value.trim()) {
            limpiarError();
            return;
        }

        if (!itiWhatsapp.isValidNumber()) {
            mostrarError("Revisá tu número de WhatsApp: parece incompleto o no es válido.");
        } else {
            limpiarError();
        }
    });
}

// Devuelve el número completo en formato internacional (+51920254509),
// o "" si no hay librería cargada / el campo está vacío.
function obtenerWhatsappCompleto() {
    if (itiWhatsapp) {
        return itiWhatsapp.getNumber() || "";
    }
    return document.getElementById("cliente-whatsapp")?.value.trim() || "";
}
/* =========================================
   COMPARTIR PRODUCTO (ETAPA 6.3)
========================================= */

function obtenerURLProducto(producto) {
    const codigo = String(producto.codigo || producto.id || "").trim();
    const urlActual = window.location.origin + window.location.pathname;
    return urlActual + "?producto=" + encodeURIComponent(codigo);
}

function generarTextoProducto(producto) {
    const nombre = producto.nombre || "Producto PF Moda";
    const codigo = producto.codigo || producto.id || "";
    const precio = producto.precio ? `₲ ${Number(producto.precio).toLocaleString("es-PY")}` : "";

    let texto = `🛍️ ${nombre}\n`;
    if (codigo) texto += `📌 Código: ${codigo}\n`;
    if (precio) texto += `💰 Precio: ${precio}\n`;

    return texto;
}

function consultarProductoWhatsApp(producto) {
    if (!producto) return;

    const nombre = String(producto.nombre || "Producto").trim();
    const codigo = String(producto.codigo || producto.id || "").trim();
    const precio = Number(
        producto.precioOferta || producto.precioNormal || producto.precio || 0
    );

    const precioFormateado =
        precio > 0 ? `₲ ${precio.toLocaleString("es-PY")}` : "";

    let mensaje = `Hola PF Moda 👋\n\nQuiero consultar por este producto:\n\n*${nombre}*\n`;
    if (codigo) mensaje += `Código: ${codigo}\n`;
    if (precioFormateado) mensaje += `Precio: ${precioFormateado}\n`;
    mensaje += `\n¿Podrían brindarme más información?`;

    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
}

function configurarWhatsAppFlotante() {
    const boton = document.getElementById("whatsapp-flotante");
    if (!boton) return;

    const mensaje = encodeURIComponent(
        "Hola PF Moda 👋 Quisiera realizar una consulta sobre sus productos."
    );

    boton.href = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensaje}`;
    boton.target = "_blank";
    boton.rel = "noopener noreferrer";
}

function compartirProductoWhatsApp(producto) {
    const url = obtenerURLProducto(producto);
    const nombre = producto.nombre || "Producto PF Moda";
    const codigo = producto.codigo || producto.id || "";
    const precio = producto.precio ? `₲ ${Number(producto.precio).toLocaleString("es-PY")}` : "";

    // Formato con negritas (*texto*) exclusivo de WhatsApp
    let mensaje = `🛍️ *${nombre}*\n`;
    if (codigo) mensaje += `📌 *Código:* ${codigo}\n`;
    if (precio) mensaje += `💰 *Precio:* ${precio}\n`;
    mensaje += `\nVer producto en la tienda:\n👇\n${url}`;

    const enlace = "https://wa.me/?text=" + encodeURIComponent(mensaje);
    window.open(enlace, "_blank");
}

function compartirProductoFacebook(producto) {
    const url = obtenerURLProducto(producto);
    // Facebook Sharer utiliza la URL para la publicación
    const enlace = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
    window.open(enlace, "_blank", "width=600,height=500");
}

async function compartirProductoInstagram(producto) {
    const url = obtenerURLProducto(producto);
    const info = generarTextoProducto(producto);
    const mensaje = `${info}\nVer producto:\n${url}`;

    try {
        await navigator.clipboard.writeText(mensaje);
        alert("¡Datos y enlace del producto copiados!\n\nAbre Instagram para pegarlo en tus Historias o Mensajes.");
        window.open("https://www.instagram.com/", "_blank");
    } catch (error) {
        console.error("Error al copiar para Instagram:", error);
    }
}

async function compartirProductoTikTok(producto) {
    const url = obtenerURLProducto(producto);
    const info = generarTextoProducto(producto);
    const mensaje = `${info}\nVer producto:\n${url}`;

    try {
        await navigator.clipboard.writeText(mensaje);
        alert("¡Datos y enlace del producto copiados!\n\nAbre TikTok para pegarlo en tus mensajes o publicaciones.");
        window.open("https://www.tiktok.com/", "_blank");
    } catch (error) {
        console.error("Error al copiar para TikTok:", error);
    }
}

async function copiarEnlaceProducto(producto) {
    const url = obtenerURLProducto(producto);

    try {
        await navigator.clipboard.writeText(url);
        alert("¡Enlace del producto copiado al portapapeles!");
    } catch (error) {
        console.error("Error al copiar enlace:", error);
        alert("No se pudo copiar el enlace.");
    }
}

function abrirProductoDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);
    const codigo = parametros.get("producto");

    if (!codigo) return;

    if (!Array.isArray(todosLosProductos) || todosLosProductos.length === 0) return;

    const producto = todosLosProductos.find(
        item => String(item.codigo || item.id || "").trim() === String(codigo).trim()
    );

    if (!producto) {
        console.warn("Producto indicado en URL no encontrado:", codigo);
        return;
    }

    abrirModal(producto);
}

async function inicializarTienda() {
    const contenedor = document.getElementById("productos-contenedor");

    try {
        const datos = await api.getInicio();

        if (datos.error || datos.productos?.error) {
            throw new Error(datos.error || datos.productos.error);
        }

        // Extraer datos según la estructura actual de la API
        todosLosProductos = datos.productos?.items || [];
        todasLasSubcategorias = datos.subcategorias?.items || [];

        const categoriasItems = datos.categorias?.items || [];
        const bannersItems = datos.banners?.items || [];

        // Guardar datos frescos para poder usarlos si falla la conexión
        guardarDatosEnCache(datos);

        // Renderizar normalmente
        renderizarCategorias(categoriasItems);
        renderizarBannerPortada(bannersItems);
        filtrarYRenderizar();
        abrirProductoDesdeURL();
        iniciarActualizacionInventario();

    } catch (error) {
        console.warn(
            "Error al conectar con la API, intentando usar caché local...",
            error
        );

        const datosCache = obtenerDatosDeCache();

        if (
            datosCache &&
            Array.isArray(datosCache.productos?.items) &&
            datosCache.productos.items.length > 0
        ) {
            console.warn("Usando catálogo guardado en caché.");

            todosLosProductos = datosCache.productos.items;
            todasLasSubcategorias =
                datosCache.subcategorias?.items || [];

            renderizarCategorias(
                datosCache.categorias?.items || []
            );

            renderizarBannerPortada(
                datosCache.banners?.items || []
            );

            filtrarYRenderizar();
            abrirProductoDesdeURL();
            iniciarActualizacionInventario();

            if (typeof mostrarNotificacionUI === "function") {
                mostrarNotificacionUI(
                    "Conexión inestable. Mostrando catálogo guardado.",
                    "advertencia"
                );
            }

        } else {
            if (contenedor) {
                contenedor.innerHTML = `
                    <div style="text-align:center; grid-column:1/-1; padding:20px;">
                        <p style="color:red; margin-bottom:15px;">
                            No pudimos conectar con el servidor para cargar los productos.
                        </p>

                        <button
                            id="btn-reintentar-carga"
                            class="btn-reintentar"
                            style="padding:10px 20px; cursor:pointer;">
                            Reintentar conexión
                        </button>
                    </div>
                `;

                document
                    .getElementById("btn-reintentar-carga")
                    ?.addEventListener("click", () => {
                        inicializarTienda();
                    });
            }
        }
    }
}

function renderizarCategorias(categorias) {
    const contenedor = document.getElementById("categorias-botones");
    const contenedorFooter = document.getElementById("footer-categorias-list");

    if (!Array.isArray(categorias)) {
        return;
    }
    // =====================================================
    // A. BARRA DE FILTROS DEL CATÁLOGO
    // =====================================================
    if (contenedor) {
        contenedor.innerHTML =
            '<button class="btn-categoria activo" data-categoria="todos">Todos</button>';
        categorias.forEach(cat => {
            const boton = document.createElement("button");
            boton.className = "btn-categoria";
            const valorCategoria =
                cat.nombre ||
                cat.categoria ||
                cat.id;
            boton.dataset.categoria = valorCategoria;
            boton.dataset.id = cat.id || valorCategoria;
            boton.textContent =
                cat.nombre ||
                cat.categoria;
            contenedor.appendChild(boton);
        });
    }
    // =====================================================
    // B. FOOTER - 5 PRIMERAS CATEGORÍAS
    // =====================================================
    if (contenedorFooter) {
        contenedorFooter.innerHTML = "";
        const top5Categorias = categorias.slice(0, 5);
        top5Categorias.forEach(cat => {
            const valorCategoria =
                cat.nombre ||
                cat.categoria ||
                cat.id;
            const nombreMostrar =
                cat.nombre ||
                cat.categoria;
            const li = document.createElement("li");
            li.innerHTML = `
                <a href="#"
                   class="link-categoria"
                   data-categoria="${escapeHTML(valorCategoria)}">
                    ${escapeHTML(nombreMostrar)}
                </a>
            `;
            contenedorFooter.appendChild(li);
        });
    }

    
}

async function cargarCategorias() {

    try {
        const respuesta =
            await api.getCategorias();

        if (
            !respuesta ||
            respuesta.error ||
            !Array.isArray(respuesta.items)
        ) {
            return;
        }
        renderizarCategorias(respuesta.items);

    } catch (error) {
        console.error(
            "Error al cargar categorías:",
            error
        );
    }
}

function cargarSubcategorias(categoriaIdentificador) {
    const contenedor = document.getElementById("subcategorias-botones");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!categoriaIdentificador || categoriaIdentificador === "todos") {
        return;
    }

    const targetCat = normalizarTexto(categoriaIdentificador);

    // Filtrar desde la memoria (instantáneo)
    const subcategoriasFiltradas = todasLasSubcategorias.filter(sub => {
        const subCatRel = normalizarTexto(sub.categoria || sub.categoriaId || sub.categoriaNombre);
        return subCatRel === targetCat;
    });

    if (subcategoriasFiltradas.length === 0) return;

    // Botón TODAS
    const botonTodas = document.createElement("button");
    botonTodas.className = "btn-categoria activo";
    botonTodas.dataset.subcategoria = "todos";
    botonTodas.textContent = "Todas";
    contenedor.appendChild(botonTodas);

    botonTodas.addEventListener("click", () => {
        subcategoriaActual = "todos";
        actualizarActivoSubcategoria();
        filtrarYRenderizar();
    });

    // Botones de subcategorías
    subcategoriasFiltradas.forEach(sub => {
        const boton = document.createElement("button");
        boton.className = "btn-categoria";
        const valorSubcat = sub.nombre || sub.id;
        boton.dataset.subcategoria = valorSubcat;
        boton.textContent = sub.nombre;

        contenedor.appendChild(boton);

        boton.addEventListener("click", () => {
            subcategoriaActual = valorSubcat;
            actualizarActivoSubcategoria();
            filtrarYRenderizar();
        });
    });
}
// ==========================================
// CARGAR BANNER ACTIVO DE LA PORTADA
// ==========================================
function renderizarBannerPortada(banners) {
    banners = (banners || [])
        .filter(b => b.estado === "Activo")
        .sort((a, b) =>
            Number(a.orden) - Number(b.orden)
        );

    if (banners.length === 0) {
        return;
    }

    const banner = banners[0];

    const imgHero =
        document.getElementById("hero-imagen-portada");

    const tituloHero =
        document.getElementById("hero-titulo-texto");

    const btnHero =
        document.getElementById("hero-btn-coleccion");

    if (imgHero && banner.imagenURL) {
        imgHero.src = banner.imagenURL;
    }

    if (tituloHero && banner.titulo) {
        tituloHero.textContent = banner.titulo;
    }

    if (btnHero && banner.enlace) {
        btnHero.dataset.enlace = banner.enlace;
    }
}

async function cargarBannerPortada() {
    try {
        const respuesta =
            await api.getBanners();

        if (
            !respuesta ||
            respuesta.error ||
            !Array.isArray(respuesta.items)
        ) {
            return;
        }
        renderizarBannerPortada(
            respuesta.items
        );

    } catch (error) {
        console.warn(
            "No se pudo cargar el banner de portada:",
            error
        );
    }
}

function actualizarActivoSubcategoria() {
    const botones = document.querySelectorAll("#subcategorias-botones .btn-categoria");
    botones.forEach(boton => {
        boton.classList.toggle(
            "activo",
            boton.dataset.subcategoria === String(subcategoriaActual)
        );
    });
}

function debounce(funcion, tiempo = 250) {
    let temporizador;
    return function (...args) {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => funcion.apply(this, args), tiempo);
    };
}

function resetearFiltroCategoriaPorBusqueda() {
    if (categoriaActual === "todos" && subcategoriaActual === "todos") return;

    document
        .querySelectorAll("#categorias-botones .btn-categoria")
        .forEach(btn => btn.classList.remove("activo"));

    document
        .querySelector('#categorias-botones .btn-categoria[data-categoria="todos"]')
        ?.classList.add("activo");

    categoriaActual = "todos";
    subcategoriaActual = "todos";

    cargarSubcategorias("todos");
}

function configurarEventos() {    

    // ==========================================
    // BUSCADOR
    // ==========================================
    const inputBuscar = document.getElementById("input-buscar");
    const headerBuscador = document.getElementById("header-buscador");
    const btnLimpiarBusqueda = document.getElementById("btn-limpiar-busqueda");
    // Botón de búsqueda móvil
    const btnBuscarMovil = document.getElementById("btn-buscar-movil");

    if (inputBuscar) {

        inputBuscar.addEventListener("input", e => {
            textoBusqueda = e.target.value.toLowerCase().trim();

            if (textoBusqueda !== "") {
                resetearFiltroCategoriaPorBusqueda();
            }
        
            filtrarYRenderizar();
            
            if (btnLimpiarBusqueda) {
                btnLimpiarBusqueda.classList.toggle(
                    "visible",
                    inputBuscar.value.trim() !== ""
                );
            }
           
        });
    }

    // ==========================================
    // LIMPIAR BÚSQUEDA
    // ==========================================
    if (btnLimpiarBusqueda) {
        btnLimpiarBusqueda.addEventListener("click", () => {
            inputBuscar.value = "";
            textoBusqueda = "";
            
            filtrarYRenderizar();
            btnLimpiarBusqueda.classList.remove("visible");
            inputBuscar.focus();
        });
    }

    // ==========================================
    // BUSCADOR MOVIL
    // ==========================================
    if (btnBuscarMovil && headerBuscador) {
        btnBuscarMovil.addEventListener("click", () => {
            headerBuscador.classList.toggle("activo");
            if (headerBuscador.classList.contains("activo")) {
                document.getElementById("input-buscar").focus();
            }
        });
    }

    document
        .getElementById("categorias-botones")
        .addEventListener("click", async e => {

            if (!e.target.classList.contains("btn-categoria")) return;

            document
                .querySelectorAll("#categorias-botones .btn-categoria")
                .forEach(btn => btn.classList.remove("activo"));

            e.target.classList.add("activo");

            categoriaActual = e.target.dataset.categoria;
            subcategoriaActual = "todos";

            cargarSubcategorias(categoriaActual);
            filtrarYRenderizar();

        });

    // Evento del selector de Ordenamiento
    const selectorOrden = document.getElementById("orden-productos");
    if (selectorOrden) {
        selectorOrden.addEventListener("change", () => {
            ordenActual = selectorOrden.value;
            filtrarYRenderizar();
        });
    }

    // Abrir carrito
    document
        .getElementById("btn-abrir-carrito")
        .addEventListener("click", toggleCarrito);
    // Cerrar carrito
    document
        .getElementById("btn-cerrar-carrito")
        .addEventListener("click", toggleCarrito);
    // Cerrar haciendo clic fuera
    document
        .getElementById("carrito-overlay")
        .addEventListener("click", toggleCarrito);
    // Volver del paso 2 al paso 1
    const btnVolverCarrito = document.getElementById("btn-volver-carrito");
    if (btnVolverCarrito) {
        btnVolverCarrito.addEventListener("click", () => cambiarPasoCarrito(1));
    }
    // Botón principal: avanza de paso o envía el pedido
    document
        .getElementById("btn-procesar-pedido")
        .addEventListener("click", manejarClickBotonCarrito);
    
    // ==========================================
    // Sincronizar botón "Ver Colección" del hero con el catálogo
    // ==========================================
    const btnHeroColeccion = document.getElementById("hero-btn-coleccion");
    if (btnHeroColeccion) {
        btnHeroColeccion.addEventListener("click", e => {
            e.preventDefault();

            const enlace = btnHeroColeccion.dataset.enlace || "";
            const nombreCategoria = enlace.startsWith("categoria=")
                ? enlace.split("=")[1]
                : null;

            const btnCategoria = nombreCategoria
                ? [...document.querySelectorAll("#categorias-botones .btn-categoria")]
                    .find(b => b.textContent.trim().toLowerCase() === nombreCategoria.toLowerCase())
                : document.querySelector('#categorias-botones .btn-categoria[data-categoria="todos"]');

            if (btnCategoria) btnCategoria.click();
            document.getElementById("productos-contenedor").scrollIntoView({ behavior: "smooth" });
        });
    }

    // ==========================================
    // Sincronizar botón "Ver Colección" del hero con el catálogo
    // ==========================================
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();

            const destino = document.querySelector(link.getAttribute("href"));
            if (!destino) return;

            navLinks.forEach(l => l.classList.remove("activo"));
            link.classList.add("activo");

            destino.scrollIntoView({ behavior: "smooth" });
            cerrarMenuMovil();
        });
    });

    // Logo: siempre lleva al inicio de la tienda
    const logoHome = document.getElementById("logo-home");
    if (logoHome) {
        logoHome.addEventListener("click", e => {
            e.preventDefault();
            document.getElementById("inicio").scrollIntoView({ behavior: "smooth" });
            cerrarMenuMovil();
        });
    }

    // Resaltar automáticamente el link activo según la sección visible
    const seccionesNav = ["inicio", "filtros-container", "contacto"]
        .map(id => document.getElementById(id))
        .filter(Boolean);

    const observador = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const link = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
                if (link) {
                    navLinks.forEach(l => l.classList.remove("activo"));
                    link.classList.add("activo");
                }
            }
        });
    }, { rootMargin: "-100px 0px -70% 0px" });

    seccionesNav.forEach(seccion => observador.observe(seccion));

    // ==========================================
    // MOSTRAR / OCULTAR DATOS DE FACTURA
    // ==========================================
    const selectFactura =
        document.getElementById("cliente-factura");        
    const datosFactura =
        document.getElementById("datos-factura");
    if (selectFactura && datosFactura) {
        
        selectFactura.addEventListener("change", function () {        
            if (this.value === "Sí") {            
                datosFactura.style.display = "block";            
            } else {            
                datosFactura.style.display = "none";            
                
                const nombreFactura =
                    document.getElementById("cliente-razon-social");            
                const rucFactura =
                    document.getElementById("cliente-ruc");
            
                if (nombreFactura) {
                    nombreFactura.value = "";
                }            
                if (rucFactura) {
                    rucFactura.value = "";
                }            
            }        
        });        
    }

    // ==========================================
    // MOSTRAR / OCULTAR DIRECCIÓN SEGÚN TIPO DE ENTREGA
    // ==========================================
    const selectEntrega =
        document.getElementById("cliente-entrega");
    const campoDireccion =
        document.getElementById("campo-direccion");
    if (selectEntrega && campoDireccion) {
        selectEntrega.addEventListener("change", function () {
            campoDireccion.style.display =
                (this.value === "Envío a domicilio") ? "block" : "none";
        });
        // Estado inicial (por si el navegador recuerda una selección previa)
        campoDireccion.style.display =
            (selectEntrega.value === "Envío a domicilio") ? "block" : "none";
    }

    document
        .getElementById("btn-cerrar-modal")
        .addEventListener("click", cerrarModal);
    document
        .getElementById("modal-overlay")
        .addEventListener("click", cerrarModal);

    // Flechas de navegación de la Galería
    const btnAnterior = document.getElementById("galeria-anterior");
    if (btnAnterior) {
        btnAnterior.addEventListener("click", imagenAnterior);
    }

    const btnSiguiente = document.getElementById("galeria-siguiente");
    if (btnSiguiente) {
        btnSiguiente.addEventListener("click", imagenSiguiente);
    }
    configurarGestosGaleria();

    // ==========================================
    // EVENTOS DEL VISOR DE ZOOM (ETAPA 4.5)
    // ==========================================
    const modalImg = document.getElementById("modal-img");
    if (modalImg) {
        modalImg.addEventListener("click", abrirVisorImagen);
    }

    const cerrarVisor = document.getElementById("visor-cerrar");
    if (cerrarVisor) {
        cerrarVisor.addEventListener("click", cerrarVisorImagen);
    }

    const visorAnterior = document.getElementById("visor-anterior");
    if (visorAnterior) {
        visorAnterior.addEventListener("click", visorImagenAnterior);
    }

    const visorSiguiente = document.getElementById("visor-siguiente");
    if (visorSiguiente) {
        visorSiguiente.addEventListener("click", visorImagenSiguiente);
    }

    // Cerrar haciendo clic en el fondo oscuro
    const visor = document.getElementById("visor-imagen");
    if (visor) {
        visor.addEventListener("click", function (event) {
            if (event.target === visor) {
                cerrarVisorImagen();
            }
        });
    }

    // Cerrar con la tecla ESC
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && visorImagenActivo) {
            cerrarVisorImagen();
        }
    });

    // ==========================================
    // CERRAR MENU MOVIL
    // ==========================================
    function cerrarMenuMovil() {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const navMenu = document.querySelector('.nav-menu') || document.querySelector('nav');
        if (hamburgerBtn && navMenu) {
            hamburgerBtn.classList.remove('activo');
            navMenu.classList.remove('activo');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // ==========================================
    // BOTÓN CERRAR MENÚ MÓVIL
    // ==========================================
    document.getElementById('btn-cerrar-nav')?.addEventListener(
        'click',
        cerrarMenuMovil
    );

    // ==========================================
    // MENÚ HAMBURGUESA MÓVIL
    // ==========================================
    const hamburgerBtn = document.getElementById('hamburger-btn') || document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu') || document.querySelector('nav');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
            hamburgerBtn.classList.toggle('activo');
            navMenu.classList.toggle('activo');
            hamburgerBtn.setAttribute('aria-expanded', (!isExpanded).toString());
        });

        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                cerrarMenuMovil();
            }
        });
    }

    // ==========================================
    // EVENTOS DE COMPARTIR PRODUCTO (ETAPA 6.3)
    // ==========================================
    const btnCompartirWhatsApp = document.getElementById("btn-compartir-whatsapp");
    const btnCompartirFacebook = document.getElementById("btn-compartir-facebook");
    const btnCompartirInstagram = document.getElementById("btn-compartir-instagram");
    const btnCompartirTikTok = document.getElementById("btn-compartir-tiktok");
    const btnCopiarEnlace = document.getElementById("btn-copiar-enlace");

    if (btnCompartirWhatsApp) {
        btnCompartirWhatsApp.addEventListener("click", () => {
            if (productoModalActual) compartirProductoWhatsApp(productoModalActual);
        });
    }

    if (btnCompartirFacebook) {
        btnCompartirFacebook.addEventListener("click", () => {
            if (productoModalActual) compartirProductoFacebook(productoModalActual);
        });
    }

    if (btnCompartirInstagram) {
        btnCompartirInstagram.addEventListener("click", () => {
            if (productoModalActual) compartirProductoInstagram(productoModalActual);
        });
    }

    if (btnCompartirTikTok) {
        btnCompartirTikTok.addEventListener("click", () => {
            if (productoModalActual) compartirProductoTikTok(productoModalActual);
        });
    }

    if (btnCopiarEnlace) {
        btnCopiarEnlace.addEventListener("click", () => {
            if (productoModalActual) copiarEnlaceProducto(productoModalActual);
        });
    }

    const btnConsultarWhatsApp = document.getElementById("btn-consultar-whatsapp");
    if (btnConsultarWhatsApp) {
        btnConsultarWhatsApp.addEventListener("click", () => {
            if (!productoModalActual) return;
            consultarProductoWhatsApp(productoModalActual);
        });
    }

}

function configurarHeaderDinamico() {
    const header = document.querySelector("header");
    if (!header) return;

    const esMobile = () => window.matchMedia("(max-width: 900px)").matches;

    function ajustarEspacioHeader() {
        if (esMobile()) {
            document.body.style.paddingTop = header.offsetHeight + "px";
        } else {
            document.body.style.paddingTop = "";
        }
    }

    ajustarEspacioHeader();
    window.addEventListener("resize", ajustarEspacioHeader);

    const UMBRAL_SCROLL = 60;
    let ultimoScrollY = window.scrollY;
    let compacto = false;
    let ticking = false;

    function actualizarHeader() {
        const scrollActual = window.scrollY;

        const debeCompactarse = scrollActual > UMBRAL_SCROLL;
        if (debeCompactarse !== compacto) {
            header.classList.toggle("header-compacto", debeCompactarse);
            compacto = debeCompactarse;
            if (esMobile()) ajustarEspacioHeader();
        }

        if (scrollActual > UMBRAL_SCROLL) {
            const bajando = scrollActual > ultimoScrollY;
            header.classList.toggle("header-oculto", bajando);
            
        } else {
            header.classList.remove("header-oculto");
        }

        ultimoScrollY = scrollActual;
        ticking = false;
    }

    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(actualizarHeader);
            ticking = true;
        }
    }, { passive: true });
}

/* =========================================
   CONFIGURACIÓN DE ELEMENTOS ESTÁTICOS
========================================= */

function configurarFooterUI() {
    // Acordeón responsivo para el footer
    const columnasFooter = document.querySelectorAll('.footer-col');
    columnasFooter.forEach(col => {
        const titulo = col.querySelector('.col-title');
        if (titulo) {
            titulo.addEventListener('click', () => {
                if (window.innerWidth <= 600) {
                    const estaActivo = col.classList.contains('activo');
                    columnasFooter.forEach(c => c.classList.remove('activo'));
                    if (!estaActivo) col.classList.add('activo');
                }
            });
        }
    });

    // Formulario de suscripción
    const suscripcionForm = document.getElementById('form-suscribir');
    if (suscripcionForm) {
        suscripcionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('¡Gracias por tu interés en PF Moda! 🖤 Te informamos que por el momento este espacio de registro se encuentra en desarrollo, por lo que tu correo no ha sido guardado. Muy pronto habilitaremos las notificaciones de novedades.');
            suscripcionForm.reset();
        });
    }
}

/* =========================================
   APLICAR CONFIGURACIÓN DEL NEGOCIO (desde el panel admin)
========================================= */

async function aplicarConfiguracionSitio() {
    try {

        const config = await api.getConfiguracion();

        if (!config || config.error) {
            console.error("No se pudo cargar la configuración del sitio:", config?.error);
            return;
        }

        // --- LOGO ---
        if (config.LogoURL) {
            const logoHome = document.getElementById("logo-home");
            const logoFooter = document.getElementById("logo-footer");
            const alt = escapeHTML(config.NombreNegocio || "Logo");

            if (logoHome) logoHome.innerHTML = `<img src="${escapeHTML(config.LogoURL)}" alt="${alt}" class="logo-img">`;
            if (logoFooter) logoFooter.innerHTML = `<img src="${escapeHTML(config.LogoURL)}" alt="${alt}" class="logo-img">`;
        }

        // --- FAVICON ---
        if (config.FaviconURL) {
            const favicon = document.getElementById("favicon-link");
            if (favicon) favicon.href = config.FaviconURL;
        }

        // --- COLORES DE MARCA ---
        if (config.ColorPrincipal) {
            document.documentElement.style.setProperty("--color-negro", config.ColorPrincipal);
        }
        if (config.ColorSecundario) {
            document.documentElement.style.setProperty("--color-dorado", config.ColorSecundario);
        }

        // --- WHATSAPP (número usado para pedidos y el botón flotante) ---
        if (config.WhatsAppNumero) {
            WHATSAPP_NUMERO = String(config.WhatsAppNumero).replace(/\D/g, "");

            const linkWhatsapp = document.getElementById("contacto-whatsapp-link");
            const textoWhatsapp = document.getElementById("contacto-whatsapp-texto");
            if (linkWhatsapp) linkWhatsapp.href = `https://wa.me/${WHATSAPP_NUMERO}`;
            if (textoWhatsapp) textoWhatsapp.textContent = "+" + WHATSAPP_NUMERO;
        }

        // --- EMAIL DE CONTACTO ---
        if (config.EmailContacto) {
            const linkEmail = document.getElementById("contacto-email-link");
            const textoEmail = document.getElementById("contacto-email-texto");
            if (linkEmail) linkEmail.href = "mailto:" + config.EmailContacto;
            if (textoEmail) textoEmail.textContent = config.EmailContacto;
        }

        // --- DIRECCIÓN ---
        if (config.Direccion) {
            const linkDireccion = document.getElementById("contacto-direccion-link");
            const textoDireccion = document.getElementById("contacto-direccion-texto");
            if (linkDireccion) {
                linkDireccion.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.Direccion)}`;
            }
            if (textoDireccion) textoDireccion.textContent = config.Direccion;
        }

        // --- REDES SOCIALES ---
        if (config.InstagramURL) {
            const linkInsta = document.getElementById("footer-instagram-link");
            if (linkInsta) linkInsta.href = config.InstagramURL;
        }
        if (config.FacebookURL) {
            const linkFacebook = document.getElementById("footer-facebook-link");
            if (linkFacebook) linkFacebook.href = config.FacebookURL;
        }

        // --- BANNER DE ENVÍO GRATIS ---
        const banner = document.getElementById("banner-promo");
        if (banner && config.MensajeEnvioGratis) {
            banner.textContent = config.MensajeEnvioGratis;
            banner.style.display = "block";
        }

        // --- NOMBRE DEL NEGOCIO (título de la pestaña) ---
        if (config.NombreNegocio) {
            document.title = document.title.replace(/^PF Moda/, config.NombreNegocio);
        }
    } catch (error) {
        console.error("Error al aplicar la configuración del sitio:", error);
      // No relanzamos el error: aunque algo de la configuración falle,
      // el resto del sitio (inicializarTienda, banners, catálogo) tiene
      // que seguir cargando igual.
    }
}

/* =========================================
   VINCULACIÓN DE ENLACES DEL FOOTER
========================================= */

function configurarEnlacesFooter() {
    // 1. Enlaces de Categorías
    // Filtrar, sincronizar botón superior y hacer scroll al catálogo    
    const linksCategorias = document.querySelectorAll(".link-categoria");
    linksCategorias.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const categoria = link.dataset.categoria;
            // =========================================
            // ACTUALIZAR ESTADO GLOBAL
            // =========================================
            categoriaActual = categoria;
            subcategoriaActual = "todos";
            // =========================================
            // SINCRONIZAR BOTÓN ACTIVO DEL CATÁLOGO
            // =========================================
            const botonesCat = document.querySelectorAll(
                "#categorias-botones .btn-categoria"
            );
            botonesCat.forEach(btn => {
                btn.classList.toggle(
                    "activo",
                    btn.dataset.categoria === categoria
                );
            });
            // =========================================
            // CARGAR SUBCATEGORÍAS Y FILTRAR
            // =========================================
            cargarSubcategorias(categoriaActual);
            filtrarYRenderizar();
            // =========================================
            // SCROLL SUAVE AL CATÁLOGO
            // =========================================
            const catalogo =
                document.getElementById("catalogo") ||
                document.querySelector("main");
            if (catalogo) {
                catalogo.scrollIntoView({
                    behavior: "smooth"
                });
            }
        });
    });

    // 2. Enlaces de Información (Scroll directo + Desplegar FAQ)
    const linksInfo = document.querySelectorAll(".link-info");
    linksInfo.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = link.getAttribute("href").replace("#", "");
            const elementoDestino = document.getElementById(targetId);

            if (elementoDestino) {
                elementoDestino.scrollIntoView({ behavior: "smooth", block: "center" });

                // Si es un acordeón/FAQ, abrilo automáticamente
                if (elementoDestino.tagName === "DETAILS") {
                    elementoDestino.open = true;
                }
            }
        });
    });

    // 3. Abrir Modal para la Guía de Talles
    const modalOverlay = document.getElementById("modal-informacion");
    const modalTitulo = document.getElementById("modal-info-titulo");
    const modalBody = document.getElementById("modal-info-body");
    const btnCerrar = document.getElementById("btn-cerrar-info-modal");

    const linksModal = document.querySelectorAll(".link-info-modal");
    linksModal.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            if (link.dataset.modal === "talles") {
                modalTitulo.textContent = "Guía de Talles y Medidas";
                modalBody.innerHTML = `
                    <p>Trabajamos con colecciones importadas (Brasil, Perú y China), por lo que <strong>unificamos las etiquetas a las medidas estándar de Paraguay</strong> para facilitarte la compra.</p>

                    <p style="margin-top: 1rem; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px; color: #111;">Talles Estándar</p>
                    <ul style="padding-left: 1.2rem; line-height: 1.8; margin-top: 0.5rem;">
                        <li><strong>Talle S (P):</strong> Busto 85-90 cm | Cintura 65-70 cm</li>
                        <li><strong>Talle M (M):</strong> Busto 90-95 cm | Cintura 70-75 cm</li>
                        <li><strong>Talle L (G):</strong> Busto 95-100 cm | Cintura 75-80 cm</li>
                        <li><strong>Talle XL:</strong> Busto 100-105 cm | Cintura 80-85 cm</li>
                        <li><strong>Talle XXL:</strong> Busto 105-110 cm | Cintura 85-90 cm</li>
                    </ul>

                    <p style="margin-top: 1.2rem; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px; color: #111;">Línea Talles Plus</p>
                    <ul style="padding-left: 1.2rem; line-height: 1.8; margin-top: 0.5rem;">
                        <li><strong>Talle G1 / G2:</strong> Busto 110-118 cm | Cadera 115-122 cm</li>
                        <li><strong>Talle G3 / G4:</strong> Busto 118-126 cm | Cadera 122-130 cm</li>
                        <li><strong>Talle G5 / G6:</strong> Busto 126-135 cm | Cadera 130-140 cm</li>
                    </ul>

                    <p style="margin-top: 1rem; background: #f9f9f9; padding: 10px; border-left: 3px solid #111; font-size: 0.9rem;">
                        💡 <strong>¿Dudas con la horma de una prenda?</strong> Al ser prendas importadas, el calce puede variar según la tela. Escribinos por WhatsApp y te enviamos la medida exacta de la prenda en centímetros.
                    </p>
                `;
                modalOverlay.classList.add("active");
            }
            else if (link.dataset.modal === "terminos") {
                modalTitulo.textContent = "Términos y Condiciones";
                modalBody.innerHTML = `
                    <p style="margin-bottom:1rem; font-size:0.85rem; color:#777;">Última actualización: ${new Date().toLocaleDateString("es-PY", { year: "numeric", month: "long" })}</p>

                    <p>Bienvenido/a a PF Moda. Al realizar un pedido a través de nuestro sitio, aceptás los siguientes términos:</p>

                    <p style="margin-top:1rem; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; color:#111;">1. Pedidos y confirmación</p>
                    <p>Los pedidos realizados desde la tienda se confirman por WhatsApp. El precio final es el que figura en nuestro sistema al momento de procesar el pedido, independientemente de lo mostrado en pantalla en caso de error técnico.</p>

                    <p style="margin-top:1rem; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; color:#111;">2. Disponibilidad de stock</p>
                    <p>Los productos están sujetos a disponibilidad. Si un artículo se agota antes de confirmar tu pedido, te avisaremos por WhatsApp para ofrecerte una alternativa o el reembolso correspondiente.</p>

                    <p style="margin-top:1rem; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; color:#111;">3. Medios de pago</p>
                    <p>Aceptamos efectivo, transferencia bancaria y pago contra entrega, según se coordine por WhatsApp.</p>

                    <p style="margin-top:1rem; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; color:#111;">4. Envíos y retiro en tienda</p>
                    <p>Podés elegir envío a domicilio o retiro en nuestro local (Avda. Ana Díaz N° 1677, Asunción). Los tiempos y costos de envío se coordinan por WhatsApp al confirmar el pedido.</p>

                    <p style="margin-top:1rem; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; color:#111;">5. Cambios y devoluciones</p>
                    <p>Consultá nuestra política de cambios y devoluciones en la sección correspondiente del sitio. Los productos deben estar sin uso, con etiquetas originales, dentro del plazo informado.</p>

                    <p style="margin-top:1rem; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; color:#111;">6. Modificaciones</p>
                    <p>PF Moda puede actualizar estos términos en cualquier momento. Te recomendamos revisarlos periódicamente.</p>

                    <p style="margin-top:1.2rem; background:#f9f9f9; padding:10px; border-left:3px solid #111; font-size:0.9rem;">
                        📩 ¿Tenés dudas? Escribinos a <strong>pf.moda.py@gmail.com</strong> o por WhatsApp al <strong>+595 983 208 288</strong>.
                    </p>
                `;
                modalOverlay.classList.add("active");

            } else if (link.dataset.modal === "privacidad") {
                modalTitulo.textContent = "Política de Privacidad";
                modalBody.innerHTML = `
                    <p style="margin-bottom:1rem; font-size:0.85rem; color:#777;">Última actualización: ${new Date().toLocaleDateString("es-PY", { year: "numeric", month: "long" })}</p>

                    <p>En PF Moda respetamos tu privacidad. Esta política explica qué datos recopilamos y cómo los usamos.</p>

                    <p style="margin-top:1rem; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; color:#111;">1. Datos que recopilamos</p>
                    <p>Al realizar un pedido, solicitamos: nombre, número de WhatsApp, ciudad, barrio, dirección de entrega (si aplica), y datos de facturación (razón social y RUC) si los necesitás.</p>

                    <p style="margin-top:1rem; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; color:#111;">2. Para qué usamos tus datos</p>
                    <p>Usamos esta información únicamente para procesar y entregar tu pedido, y para comunicarnos con vos por WhatsApp sobre el estado del mismo. No vendemos ni compartimos tus datos con terceros para fines publicitarios.</p>

                    <p style="margin-top:1rem; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; color:#111;">3. Dónde se almacenan tus datos</p>
                    <p>Tus datos se guardan en nuestro sistema interno de gestión de pedidos, con medidas de seguridad para proteger tu información.</p>

                    <p style="margin-top:1rem; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; color:#111;">4. Cookies y almacenamiento local</p>
                    <p>Usamos el almacenamiento local de tu navegador para recordar el contenido de tu carrito de compras entre visitas. No usamos cookies de rastreo publicitario.</p>

                    <p style="margin-top:1rem; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:4px; color:#111;">5. Tus derechos</p>
                    <p>Podés solicitarnos en cualquier momento que corrijamos o eliminemos tus datos personales, escribiéndonos por los medios de contacto de abajo.</p>

                    <p style="margin-top:1.2rem; background:#f9f9f9; padding:10px; border-left:3px solid #111; font-size:0.9rem;">
                        📩 Para consultas sobre tus datos, escribinos a <strong>pf.moda.py@gmail.com</strong> o por WhatsApp al <strong>+595 983 208 288</strong>.
                    </p>
                `;
                modalOverlay.classList.add("active");
            }
        });
    });

    if (btnCerrar) {
        btnCerrar.addEventListener("click", () => modalOverlay.classList.remove("active"));
    }

    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) modalOverlay.classList.remove("active");
        });
    }
}

/* =========================================
   ETIQUETAS COMERCIALES (ETAPA 6.2)
========================================= */
function obtenerEtiquetaProducto(producto) {
    const etiqueta = String(producto.etiqueta || producto.Etiqueta || "").trim();
    if (!etiqueta) return null;
    return etiqueta;
}

function generarEtiquetaProducto(producto) {
    const etiqueta = obtenerEtiquetaProducto(producto);
    if (!etiqueta) return "";

    const etiquetaNormalizada = etiqueta.toLowerCase().trim();
    let clase = "etiqueta-producto";

    if (etiquetaNormalizada === "nuevo") {
        clase += " etiqueta-nuevo";
    } else if (etiquetaNormalizada === "oferta") {
        clase += " etiqueta-oferta";
    } else if (
        etiquetaNormalizada === "más vendido" ||
        etiquetaNormalizada === "mas vendido"
    ) {
        clase += " etiqueta-mas-vendido";
    } else if (etiquetaNormalizada === "destacado") {
        clase += " etiqueta-destacado";
    } else if (
        etiquetaNormalizada === "últimas unidades" ||
        etiquetaNormalizada === "ultimas unidades"
    ) {
        clase += " etiqueta-stock";
    }

    return `<span class="${clase}">${escapeHTML(etiqueta)}</span>`;
}

/* =========================================
   ESTADO DE STOCK (ETAPA 5.5)
========================================= */
function obtenerEstadoStock(stock) {
    const cantidad = Number(stock) || 0;

    if (cantidad <= 0) {
        return {
            clase: "agotado",
            texto: "🔴 Agotado"
        };
    }

    if (cantidad <= 5) {
        return {
            clase: "ultimas-unidades",
            texto: "🟠 Últimas unidades"
        };
    }

    return {
        clase: "disponible",
        texto: "🟢 Disponible"
    };
}

function normalizarTexto(valor) {
    return String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/* =========================================
   ORDENAR PRODUCTOS (ETAPA 5.4)
========================================= */
function ordenarProductos(productos) {
    if (!Array.isArray(productos)) return [];

    // Creamos una copia para no alterar el array original
    const copia = [...productos];

    switch (ordenActual) {
        case "precio-menor":
            copia.sort((a, b) => {
                const precioA = Number(a.precioOferta || a.precio || 0);
                const precioB = Number(b.precioOferta || b.precio || 0);
                return precioA - precioB;
            });
            break;

        case "precio-mayor":
            copia.sort((a, b) => {
                const precioA = Number(a.precioOferta || a.precio || 0);
                const precioB = Number(b.precioOferta || b.precio || 0);
                return precioB - precioA;
            });
            break;

        case "nombre-az":
            copia.sort((a, b) =>
                normalizarTexto(a.nombre).localeCompare(normalizarTexto(b.nombre))
            );
            break;

        case "nombre-za":
            copia.sort((a, b) =>
                normalizarTexto(b.nombre).localeCompare(normalizarTexto(a.nombre))
            );
            break;

        case "recientes":
        default:
            copia.sort((a, b) => {
                const fechaA = new Date(a.fechaCreacion || a.createdAt || 0).getTime();
                const fechaB = new Date(b.fechaCreacion || b.createdAt || 0).getTime();
                return fechaB - fechaA; // De más reciente a más antiguo
            });
            break;
    }

    return copia;
}

function filtrarYRenderizar() {

    const contenedor = document.getElementById("productos-contenedor");
    if (!contenedor) return;

    const maxPrecioVal = Number.isFinite(precioMaximoFiltro) ? precioMaximoFiltro : Infinity;
    const busqueda = normalizarTexto(textoBusqueda);

    const productosFiltrados = todosLosProductos.filter(prod => {

        const catBuscada = normalizarTexto(categoriaActual);
        const coincideCategoria =
            categoriaActual === "todos" ||
            normalizarTexto(prod.categoria) === catBuscada ||
            normalizarTexto(prod.categoriaId) === catBuscada;

        const subCatBuscada = normalizarTexto(subcategoriaActual);
        const coincideSubcategoria =
            subcategoriaActual === "todos" ||
            normalizarTexto(prod.subcategoria) === subCatBuscada ||
            normalizarTexto(prod.subcategoriaId) === subCatBuscada;

        const coincideTexto =
            !busqueda ||
            [
                prod.nombre,
                prod.codigo,
                prod.categoria,
                prod.subcategoria,
                prod.descripcion,
                prod.material,
                prod.color,
                prod.talles
            ]
            .filter(valor => valor !== undefined && valor !== null)
            .some(valor => normalizarTexto(valor).includes(busqueda));

        const precioReal = (prod.precioOferta && Number(prod.precioOferta) > 0) ? Number(prod.precioOferta) : Number(prod.precio || 0);
        const coincidePrecio = precioReal <= maxPrecioVal;

        return coincideCategoria && coincideSubcategoria && coincideTexto && coincidePrecio;
    });

    const productos = ordenarProductos(productosFiltrados);

    // =========================================
    // SIN PRODUCTOS
    // =========================================
    if (productos.length === 0) {
        contenedor.innerHTML = `
            <p style="text-align:center; grid-column:1/-1;">
                No se encontraron productos.
            </p>
        `;
        return;
    }


    contenedor.innerHTML = "";


    // =========================================
    // RENDERIZAR PRODUCTOS
    // =========================================
    productos.forEach(prod => {

        // 1. Declarar variables de Stock seguras
        const stock = Number(prod.stock || 0);
        const agotado = stock <= 0;

        // 2. Generar HTML de la etiqueta comercial
        const etiquetaHTML = generarEtiquetaProducto(prod);

        // 3. Generar HTML del precio (incluye badge de % OFF)
        const precioHTML = generarHTMLPrecio(prod);

        // 4. Imagen predeterminada
        const imagen = prod.imagenPrincipal || "https://via.placeholder.com/600?text=PF+Moda";

        // 5. Crear elemento Tarjeta
        const card = document.createElement("div");
        card.className = "producto-card";

        // Evento al hacer click en la tarjeta
        card.addEventListener("click", () => {
            if (typeof abrirModal === "function") {
                abrirModal(prod);
            }
        });

        // 6. Construir el HTML de Stock
        let stockHTML = "";
        if (agotado) {
            stockHTML = `
                <span class="producto-agotado">
                    Agotado
                </span>
            `;
        } else {
            stockHTML = `
                <span class="producto-stock">
                    Stock disponible: ${stock}
                </span>
            `;
        }

        // 7. Construir Botón
        let botonHTML = "";
        if (agotado) {
            botonHTML = `
                <button class="btn-agregar btn-agotado" disabled style="opacity: 0.6; cursor: not-allowed;">
                    Agotado
                </button>
            `;
        } else {
            botonHTML = `
                <button 
                    class="btn-agregar" 
                    onclick="event.stopPropagation(); if(typeof abrirModal === 'function') abrirModal(todosLosProductos.find(p => String(p.codigo) === '${prod.codigo}'));">
                    Agregar al carrito
                </button>
            `;
        }

        const descuentoVal = calcularDescuento(prod.precioNormal || prod.precio, prod.precioOferta);
        const badgeDescuento = descuentoVal 
            ? `<span class="badge-descuento">${descuentoVal}% OFF</span>` 
            : "";

        
        // Renderizar el HTML interno de la tarjeta con el contenedor de imagen
        card.innerHTML = `
            
            <div class="producto-imagen-container">
                ${etiquetaHTML}
                <img 
                    src="${escapeHTML(imagen)}" 
                    alt="${escapeHTML(prod.nombre || "Producto")}" 
                    class="producto-imagen"
                    loading="lazy" 
                    decoding="async"
                    draggable="false"
                    onerror="this.onerror=null; this.classList.add('imagen-error');"
            </div>            

            <div class="producto-info">
                <span class="producto-categoria">${escapeHTML(prod.categoria || "")}</span>
                <h3 class="producto-nombre">${escapeHTML(prod.nombre || "Sin nombre")}</h3>
                <div class="producto-precio-contenedor">
                    ${precioHTML}
                    ${badgeDescuento}
                </div>
                ${stockHTML}
                ${botonHTML}
            </div>
        `;

        contenedor.appendChild(card);
    });
}

function agregarAlCarrito(codigoProducto,colorSeleccionado="",talleSeleccionado="") {

    const producto = todosLosProductos.find(
        p => String(p.codigo) === String(codigoProducto)
    );

    if (!producto) return;

    const index = carrito.findIndex(
        item => String(item.codigo) === String(codigoProducto)
    );

    if (index >= 0) {

        carrito[index].cantidad++;

    } else {

        carrito.push({

            codigo: producto.codigo,
            nombre: producto.nombre,
            precio: Number(producto.precioOferta || producto.precio),
            imagen: producto.imagenPrincipal,
            color: colorSeleccionado,
            talle: talleSeleccionado,
            cantidad:1
        });

    }

    guardarYActualizarCarrito();

}

function guardarCarrito() {
    try {
        localStorage.setItem(
            "pf_moda_carrito",
            JSON.stringify(carrito)
        );
        return true;
    } catch (error) {
        console.error("No se pudo guardar el carrito:", error);
        return false;
    }
}

function guardarYActualizarCarrito() {
    guardarCarrito();
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const contador =
        document.getElementById("carrito-contador");
    const items =
        document.getElementById("carrito-items");
    const subtotal =
        document.getElementById("carrito-subtotal");
    if (!contador || !items || !subtotal) {
        return;
    }

    // ==============================
    // CONTADOR
    // ==============================
    const totalUnidades = carrito.reduce(
        (suma, item) => suma + Number(item.cantidad || 0),
        0
    );
    contador.textContent = totalUnidades;

    // ==============================
    // CARRITO VACÍO
    // ==============================
    if (carrito.length === 0) {
        items.innerHTML = `
            <p class="carrito-vacio">
                Tu carrito está vacío.
            </p>
        `;
        subtotal.textContent = "₲ 0";
        return;
    }

    // ==============================
    // LIMPIAR
    // ==============================
    items.innerHTML = "";
    let totalGeneral = 0;

    // ==============================
    // MOSTRAR PRODUCTOS
    // ==============================
    carrito.forEach(item => {
        const cantidad =
            Number(item.cantidad || 0);
        const precio =
            Number(item.precio || 0);
        const totalItem =
            precio * cantidad;
        totalGeneral += totalItem;

        const div =
            document.createElement("div");
        div.className =
            "carrito-item-card";

        // ==============================
        // CONTENIDO
        // ==============================
        div.innerHTML = `
            <img
                src="${escapeHTML(item.imagen || "https://placehold.co/150x150?text=PF+Moda")}"
                class="carrito-item-img"
                alt="${escapeHTML(item.nombre || "Producto")}"
            onerror="this.onerror=null; this.classList.add('imagen-error');">

            <div class="carrito-item-info">
                <h4>
                    ${escapeHTML(item.nombre || "Producto")}
                </h4>
                <div class="carrito-item-detalles">
                    <span>
                        Código: ${escapeHTML(item.codigo || "-")}
                    </span>
                    ${
                        item.color
                        ? `<span>Color: ${escapeHTML(item.color)}</span>`
                        : ""
                    }
                    ${
                        item.talle
                        ? `<span>Talle: ${escapeHTML(item.talle)}</span>`
                        : ""
                    }

                </div>
                <span>
                    ₲ ${precio.toLocaleString("es-PY")}
                </span>
                <div class="carrito-item-actions-row">
                    <div class="carrito-item-acciones">
                        <button
                            type="button"
                            class="btn-restar">
                            -
                        </button>
                        <span>
                            ${cantidad}
                        </span>
                        <button
                            type="button"
                            class="btn-sumar">
                            +
                        </button>
                    </div>
                    <button
                        type="button"
                        class="btn-eliminar-item">
                        Eliminar
                    </button>
                </div>
            </div>
        `;

        // ==============================
        // BOTÓN MENOS
        // ==============================
        const btnRestar =
            div.querySelector(".btn-restar");
        btnRestar.addEventListener("click", () => {
            cambiarCantidad(
                item.codigo,
                item.color,
                item.talle,
                -1
            );
        });

        // ==============================
        // BOTÓN MÁS
        // ==============================
        const btnSumar =
            div.querySelector(".btn-sumar");
        btnSumar.addEventListener("click", () => {
            cambiarCantidad(
                item.codigo,
                item.color,
                item.talle,
                1
            );
        });

        // ==============================
        // BOTÓN ELIMINAR
        // ==============================
        const btnEliminar =
            div.querySelector(".btn-eliminar-item");
        btnEliminar.addEventListener("click", () => {
            eliminarDelCarrito(
                item.codigo,
                item.color,
                item.talle
            );
        });
        items.appendChild(div);
    });

    // ==============================
    // SUBTOTAL
    // ==============================
    subtotal.textContent =
        "₲ " +
        totalGeneral.toLocaleString("es-PY");
}

function cambiarCantidad(codigo, color, talle, cambio) {

    // =========================================
    // 1. BUSCAR ÍTEM ESPECÍFICO EN EL CARRITO
    // =========================================
    const index = carrito.findIndex(item =>
        String(item.codigo) === String(codigo) &&
        String(item.color || "") === String(color || "") &&
        String(item.talle || "") === String(talle || "")
    );

    if (index === -1) {
        return;
    }

    const item = carrito[index];

    // =========================================
    // 2. BUSCAR PRODUCTO ORIGINAL EN CATÁLOGO
    // =========================================
    const producto = todosLosProductos.find(
        prod => String(prod.codigo) === String(codigo)
    );

    if (!producto) {
        return;
    }

    // =========================================
    // 3. OBTENER STOCK DISPONIBLE
    // =========================================
    const stockDisponible = Number(producto.stock || 0);
    const nuevaCantidad = item.cantidad + cambio;

    // =========================================
    // 4. SI REDUCE A 0 O MENOS -> ELIMINAR DEL CARRITO
    // =========================================
    if (nuevaCantidad <= 0) {
        carrito.splice(index, 1);
        guardarYActualizarCarrito();
        return;
    }

    // =========================================
    // 5. CONTROL DE STOCK (SI SE INTENTA SUMAR)
    // =========================================
    if (stockDisponible <= 0) {
        alert("Este producto ya no tiene stock disponible.");
        return;
    }

    if (nuevaCantidad > stockDisponible) {
        alert(`Solo hay ${stockDisponible} unidades disponibles de "${producto.nombre}".`);
        return;
    }

    // =========================================
    // 6. ACTUALIZAR CANTIDAD Y GUARDAR
    // =========================================
    carrito[index].cantidad = nuevaCantidad;
    guardarYActualizarCarrito();
}

function toggleCarrito() {

    document
        .getElementById("carrito-drawer")
        .classList.toggle("activo");

    const overlayCarrito = document
        .getElementById("carrito-overlay");
    overlayCarrito.classList.toggle("activo");

    // Si se está cerrando el drawer, volvemos siempre al paso 1
    const estaAbierto = overlayCarrito.classList.contains("activo");
    if (!estaAbierto) {
        cambiarPasoCarrito(1);
    }

    document.body.classList.toggle("carrito-abierto", estaAbierto);
}

// ==========================================
// CAMBIAR ENTRE PASO 1 (Resumen) Y PASO 2 (Datos)
// ==========================================
function cambiarPasoCarrito(paso) {
    carritoPasoActual = paso;

    const steps = document.getElementById("carrito-steps");
    const btnVolver = document.getElementById("btn-volver-carrito");
    const titulo = document.getElementById("carrito-titulo-header");
    const btnAccion = document.getElementById("btn-procesar-pedido");
    const footerSubtotal = document.getElementById("carrito-footer-subtotal");
    const footerAyuda = document.getElementById("carrito-footer-ayuda");
    const progresoStep1 = document.getElementById("carrito-step-1");
    const progresoStep2 = document.getElementById("carrito-step-2");
    const progresoLinea = document.getElementById("carrito-line-1");

    if (!steps || !btnVolver || !titulo || !btnAccion) {
        return;
    }

    if (paso === 2) {
        steps.classList.add("mostrar-paso-2");
        btnVolver.classList.remove("hidden");
        titulo.textContent = "Tus Datos";
        btnAccion.textContent = "Realizar Pedido por WhatsApp";
        if (footerSubtotal) footerSubtotal.style.display = "none";
        if (footerAyuda) footerAyuda.innerHTML = "📋 Completa tus datos para finalizar el pedido.";
        if (progresoStep1) progresoStep1.classList.remove("active");
        if (progresoStep2) progresoStep2.classList.add("active");
        if (progresoLinea) progresoLinea.classList.remove("active");
    } else {
        steps.classList.remove("mostrar-paso-2");
        btnVolver.classList.add("hidden");
        titulo.textContent = "Tu Carrito";
        btnAccion.textContent = "Continuar Pedido";
        if (footerSubtotal) footerSubtotal.style.display = "flex";
        if (footerAyuda) footerAyuda.innerHTML = "💬 ¿Necesitas ayuda? Escríbenos por WhatsApp.<br>";
        if (progresoStep1) progresoStep1.classList.add("active");
        if (progresoStep2) progresoStep2.classList.remove("active");
        if (progresoLinea) progresoLinea.classList.add("active");
    }
}

// ==========================================
// CLIC EN EL BOTÓN PRINCIPAL DEL FOOTER
// Paso 1 -> avanza al paso 2 (si hay items)
// Paso 2 -> envía el pedido por WhatsApp
// ==========================================
function manejarClickBotonCarrito() {
    if (carritoPasoActual === 1) {
        if (!carrito || carrito.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }
        cambiarPasoCarrito(2);
    } else {
        enviarPedidoWhatsApp();
    }
}

async function enviarPedidoWhatsApp() {

    // ==========================================
    // VERIFICAR CARRITO
    // ==========================================
    if (!carrito || carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    // =========================================
    // 2. VALIDAR STOCK ANTES DE REGISTRAR PEDIDO (NUEVO)
    // =========================================
    for (const item of carrito) {

        const productoActual = todosLosProductos.find(
            prod => String(prod.codigo) === String(item.codigo)
        );

        // Producto eliminado o ya no existe
        if (!productoActual) {
            alert(`El producto "${item.nombre || "Seleccionado"}" ya no está disponible.`);
            return;
        }

        const stockActual = Number(productoActual.stock || 0);

        // Producto sin stock en absoluto
        if (stockActual <= 0) {
            alert(`El producto "${item.nombre}" está agotado.`);
            return;
        }

        // El cliente solicita más de lo que queda en Google Sheets
        if (item.cantidad > stockActual) {
            alert(
                `No hay suficiente stock de "${item.nombre}".\n\n` +
                `Solicitado: ${item.cantidad}\n` +
                `Disponible: ${stockActual}`
            );
            return;
        }
    }

    // ==========================================
    // DATOS DEL CLIENTE
    // ==========================================
    
    const nombreCliente =
        document.getElementById("cliente-nombre")?.value.trim() || "";
    
    const whatsapp = obtenerWhatsappCompleto();
    
    const ciudad =
        document.getElementById("cliente-ciudad")?.value.trim() || "";
    
    const barrio =
        document.getElementById("cliente-barrio")?.value.trim() || "";
    
    const entrega =
        document.getElementById("cliente-entrega")?.value.trim() || "";
    
    const direccion =
        document.getElementById("cliente-direccion")?.value.trim() || "";
    
    const factura =
        document.getElementById("cliente-factura")?.value.trim() || "No";
    
    // 💡 LECTURA CON FALLBACK: Si no llenó la Razón Social específica, toma el Nombre del Cliente
    const razonSocialInput = document.getElementById("cliente-razon-social")?.value.trim();
    const razonSocial = factura === "Sí" ? (razonSocialInput || nombreCliente) : "-";
    
    const ruc =
        document.getElementById("cliente-ruc")?.value.trim() || "";
    
    const observaciones =
        document.getElementById("cliente-observaciones")?.value.trim() || "";

    // =====================================================
    // VALIDACIONES
    // =====================================================
    if (!nombreCliente) {
        alert("Por favor ingresa tu nombre.");
        return;
    }

    if (!whatsapp) {
        alert("Por favor ingresa tu número de WhatsApp.");
        return;
    }

    if (!whatsapp || !itiWhatsapp || !itiWhatsapp.isValidNumber()) {
        const errorWhatsapp = document.getElementById("error-cliente-whatsapp");
        if (errorWhatsapp) {
            errorWhatsapp.textContent = "Revisá tu número de WhatsApp: parece incompleto o no es válido.";
            errorWhatsapp.style.display = "block";
        }
        document.getElementById("cliente-whatsapp")?.classList.add("campo-invalido");
        document.getElementById("cliente-whatsapp")?.focus();
        return;
    }

    if (!ciudad) {
        alert("Por favor ingresa tu ciudad.");
        return;
    }

    if (!barrio) {
        alert("Por favor ingresa tu barrio.");
        return;
    }

    if (!entrega) {
        alert("Por favor selecciona el tipo de entrega.");
        return;
    }

    if (entrega === "Envío a domicilio" && !direccion) {
        alert("Por favor ingresa la dirección de entrega.");
        return;
    }

    // =====================================================
    // VALIDAR FACTURA
    // =====================================================
    if (factura === "Sí") {
        if (!razonSocial) {
            alert("Por favor ingresa la Razón Social para la factura.");
            return;
        }
        if (!ruc) {
            alert("Por favor ingresa el RUC para la factura.");
            return;
        }
    }

    // =====================================================
    // CALCULAR TOTAL
    // =====================================================
    let totalGeneral = 0;
    carrito.forEach(item => {
        const cantidad = Number(item.cantidad || 0);
        const precio = Number(item.precio || 0);
        totalGeneral += cantidad * precio;
    });

    // =====================================================
    // PREPARAR PRODUCTOS PARA GOOGLE SHEETS
    // =====================================================
    const productosPedido = carrito.map(item => ({
        codigo: item.codigo || "",
        nombre: item.nombre || "",
        color: item.color || "",
        talle: item.talle || "",
        cantidad: Number(item.cantidad || 0),
        precio: Number(item.precio || 0)
    }));

    // =====================================================
    // PREPARAR DATOS COMPLETOS DEL PEDIDO
    // =====================================================
    const datosPedido = {
        cliente: {
            nombre: nombreCliente,
            whatsapp: whatsapp,
            ciudad: ciudad,
            barrio: barrio,
            entrega: entrega,
            direccion: direccion,
            factura: factura,
            razonSocial: razonSocial,
            ruc: ruc,
            observaciones: observaciones
        },
        items: productosPedido
    };

    // =====================================================
    // DESHABILITAR BOTÓN MIENTRAS GUARDA
    // =====================================================
    const boton = document.getElementById("btn-procesar-pedido");
    if (boton) {
        boton.disabled = true;
        boton.textContent = "Registrando pedido...";
    }

    try {
        // =================================================
        // GUARDAR EN GOOGLE SHEETS
        // =================================================
        const respuesta = await api.registrarPedido(datosPedido);

        if (!respuesta || respuesta.error || respuesta.success === false) {
            throw new Error(respuesta?.error || "No se pudo registrar el pedido.");
        }

        // =================================================
        // ⚡ GESTIÓN SEGURA: GENERAR Y GUARDAR NÚMERO DE PEDIDO 
        // (SOLO TRAS LA CONFIRMACIÓN DE LA API)
        // =================================================
        const numeroPedido = respuesta.numeroPedido;
        if (!numeroPedido) {
            throw new Error("El servidor no devolvió el número de pedido.");
        }

        // =================================================
        // CREAR MENSAJE DE WHATSAPP
        // =================================================
        let mensaje = "Hola PF Moda.\n\n";
        mensaje += "Quiero realizar el siguiente pedido:\n\n";
        mensaje += "━━━━━━━━━━━━━━\n";

        const itemsReales = respuesta.items || carrito;

        itemsReales.forEach(item => {
            const cantidad = Number(item.cantidad || 0);
            const precio = Number(item.precio || 0);
            const totalItem = cantidad * precio;
            mensaje += `${item.nombre || ""}\n`;
            mensaje += `Código: ${item.codigo || "-"}\n`;
            mensaje += `Color: ${item.color || "-"}\n`;
            mensaje += `Talle: ${item.talle || "-"}\n`;
            mensaje += `Cantidad: ${cantidad}\n`;
            mensaje += `Precio: Gs. ${totalItem.toLocaleString("es-PY")}\n`;
            mensaje += "━━━━━━━━━━━━━━\n";
        });

        const totalReal = Number(respuesta.total || 0);
        mensaje += `\nTotal: Gs. ${totalReal.toLocaleString("es-PY")}\n`;
        mensaje += "━━━━━━━━━━━━━━\n\n";

        mensaje += `N° de pedido: ${numeroPedido}\n`;
        mensaje += `Cliente: ${nombreCliente}\n`;
        mensaje += `WhatsApp: ${whatsapp}\n`;
        mensaje += `Ciudad: ${ciudad}\n`;
        mensaje += `Barrio: ${barrio}\n`;
        mensaje += `Entrega: ${entrega}\n`;

        if (entrega === "Envío a domicilio") {
            mensaje += `Dirección: ${direccion}\n`;
        }

        mensaje += `Con factura: ${factura}\n`;

        if (factura === "Sí") {
            mensaje += `Razón Social: ${razonSocial}\n`;
            mensaje += `RUC: ${ruc}\n`;
        }

        if (observaciones) {
            mensaje += `Observaciones: ${observaciones}\n`;
        }

        mensaje += "\nMuchas gracias.";

        // =================================================
        // ABRIR WHATSAPP
        // =================================================
        const numeroWhatsAppTienda = "595983208288";
        const urlWhatsApp = `https://wa.me/${numeroWhatsAppTienda}?text=${encodeURIComponent(mensaje)}`;

        window.open(urlWhatsApp, "_blank");

        // =================================================
        // LIMPIAR CARRITO
        // =================================================
        carrito = [];
        localStorage.setItem("pf_moda_carrito", JSON.stringify(carrito));
        actualizarCarritoUI();

        // =================================================
        // LIMPIAR FORMULARIO
        // =================================================
        const campos = [
            "cliente-nombre",
            "cliente-razon-social",
            "cliente-whatsapp",
            "cliente-ciudad",
            "cliente-barrio",
            "cliente-direccion",
            "cliente-ruc",
            "cliente-observaciones"
        ];

        campos.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.value = "";
        });

        const campoEntrega = document.getElementById("cliente-entrega");
        if (campoEntrega) campoEntrega.value = "";

        const campoFactura = document.getElementById("cliente-factura");
        if (campoFactura) campoFactura.value = "No";

        // =================================================
        // CERRAR CARRITO
        // =================================================
        if (typeof toggleCarrito === "function") {
            toggleCarrito();
        }

    } catch (error) {
        console.error("Error procesando pedido:", error);
        alert(
            "No se pudo registrar el pedido.\n\n" +
            "El pedido NO fue enviado por WhatsApp.\n\n" +
            "Por favor intenta nuevamente."
        );
    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent = "Realizar Pedido por WhatsApp";
        }
    }
}

/* =========================================
   LÓGICA DE LA GALERÍA DEL MODAL 
========================================= */
function renderizarGaleriaModal() {
    const imagenPrincipal = document.getElementById("modal-img");
    const miniaturas = document.getElementById("modal-miniaturas");

    if (!imagenPrincipal || !miniaturas) return;

    // 1. Cargar imagen principal activa
    imagenPrincipal.src = imagenesModal[indiceImagenModal] || "https://via.placeholder.com/600?text=PF+Moda";
    imagenPrincipal.alt = productoModalActual?.nombre || "Producto";
    
    // 2. Si solo hay 1 imagen (o ninguna extra), no mostramos miniaturas
    if (imagenesModal.length <= 1) {
        miniaturas.innerHTML = "";
        const anterior = document.getElementById("galeria-anterior");
        const siguiente = document.getElementById("galeria-siguiente");
        if (anterior) anterior.style.display = "none";
        if (siguiente) siguiente.style.display = "none";
        return;
    }

    // 3. Renderizar miniaturas solo de imágenes válidas
    miniaturas.innerHTML = "";

    imagenesModal.forEach((imagen, indice) => {
        const miniatura = document.createElement("div");
        miniatura.className = "modal-miniatura";

        if (indice === indiceImagenModal) {
            miniatura.classList.add("activa");
        }

        const imgElement = document.createElement("img");
        imgElement.src = imagen;
        imgElement.alt = `Vista ${indice + 1}`;
        imgElement.loading = "lazy";
        imgElement.decoding = "async";
        imgElement.draggable = false;

        // SI LA IMAGEN FALLA EN CARGAR: eliminar la miniatura del DOM de inmediato
        imgElement.onerror = function () {
            console.warn(`Miniatura ${indice + 1} falló al renderizar:`, imagen);
            miniatura.remove();
        };

        miniatura.appendChild(imgElement);

        miniatura.addEventListener("click", () => {
            indiceImagenModal = indice;
            renderizarGaleriaModal();
        });

        miniaturas.appendChild(miniatura);
    });

    // 4. Mostrar u ocultar flechas
    const anterior = document.getElementById("galeria-anterior");
    const siguiente = document.getElementById("galeria-siguiente");
    const mostrarFlechas = imagenesModal.length > 1;

    if (anterior) anterior.style.display = mostrarFlechas ? "flex" : "none";
    if (siguiente) siguiente.style.display = mostrarFlechas ? "flex" : "none";
}

function imagenAnterior() {
    if (imagenesModal.length <= 1) return;

    indiceImagenModal--;
    if (indiceImagenModal < 0) {
        indiceImagenModal = imagenesModal.length - 1;
    }

    renderizarGaleriaModal();
}

function imagenSiguiente() {
    if (imagenesModal.length <= 1) return;

    indiceImagenModal++;
    if (indiceImagenModal >= imagenesModal.length) {
        indiceImagenModal = 0;
    }

    renderizarGaleriaModal();
}

function configurarGestosGaleria() {
    const galeria = document.querySelector(".modal-imagen-principal");

    if (!galeria) {
        return;
    }

    galeria.addEventListener(
        "touchstart",
        function (event) {
            if (!event.touches.length) {
                return;
            }
            touchInicioX = event.touches[0].clientX;
            touchInicioY = event.touches[0].clientY;
        },
        { passive: true }
    );

    galeria.addEventListener(
        "touchend",
        function (event) {
            if (!event.changedTouches.length) {
                return;
            }
            touchFinX = event.changedTouches[0].clientX;
            touchFinY = event.changedTouches[0].clientY;

            procesarSwipeGaleria();
        },
        { passive: true }
    );
}

function procesarSwipeGaleria() {
    const diferenciaX = touchFinX - touchInicioX;
    const diferenciaY = touchFinY - touchInicioY;

    // Distancia mínima en píxeles para detectar un swipe
    const distanciaMinima = 50;

    // Si el movimiento vertical es mayor al horizontal, ignoramos el gesto.
    // Esto preserva el desplazamiento (scroll) vertical normal de la página.
    if (Math.abs(diferenciaY) > Math.abs(diferenciaX)) {
        return;
    }

    // Si el deslizamiento fue muy corto, no hace nada
    if (Math.abs(diferenciaX) < distanciaMinima) {
        return;
    }

    // Deslizó a la izquierda -> Siguiente imagen
    if (diferenciaX < 0) {
        imagenSiguiente();
    } 
    // Deslizó a la derecha -> Imagen anterior
    else {
        imagenAnterior();
    }
}

/* =========================================
   LÓGICA DEL VISOR DE IMAGEN AMPLIADA (ZOOM)
========================================= */
function abrirVisorImagen() {
    if (!imagenesModal.length) return;

    const visor = document.getElementById("visor-imagen");
    const imagen = document.getElementById("visor-img");

    if (!visor || !imagen) return;

    imagen.src = imagenesModal[indiceImagenModal];
    imagen.alt = productoModalActual?.nombre || "Imagen ampliada";

    // Ocultar flechas si solo hay una imagen
    if (imagenesModal.length <= 1) {
        visor.classList.add("single-image");
    } else {
        visor.classList.remove("single-image");
    }

    visor.classList.add("activo");
    visorImagenActivo = true;
    document.body.style.overflow = "hidden";
}

function cerrarVisorImagen() {
    const visor = document.getElementById("visor-imagen");
    if (!visor) return;

    visor.classList.remove("activo");
    visorImagenActivo = false;
    document.body.style.overflow = "";
}

function actualizarVisorImagen() {
    const imagen = document.getElementById("visor-img");
    if (!imagen) return;

    imagen.src = imagenesModal[indiceImagenModal];
    imagen.alt = productoModalActual?.nombre || "Imagen ampliada";
}

function visorImagenAnterior() {
    if (imagenesModal.length <= 1) return;

    indiceImagenModal--;
    if (indiceImagenModal < 0) {
        indiceImagenModal = imagenesModal.length - 1;
    }

    renderizarGaleriaModal();
    actualizarVisorImagen();
}

function visorImagenSiguiente() {
    if (imagenesModal.length <= 1) return;

    indiceImagenModal++;
    if (indiceImagenModal >= imagenesModal.length) {
        indiceImagenModal = 0;
    }

    renderizarGaleriaModal();
    actualizarVisorImagen();
}

function abrirModal(prod) {

    varianteSeleccionada.reset();    
    productoModalActual = prod;
    actualizarSEOProducto(prod);
    const candidatas = [
        prod.imagenPrincipal,
        prod.imagen2,
        prod.imagen3,
        prod.imagen4
    ];

    // Solo guardamos URLs que tengan texto válido y empiecen con http/https o data:
    imagenesModal = candidatas.filter(url => {
        if (!url) return false;
        const limpia = String(url).trim();
        return limpia.length > 5 && (limpia.startsWith("http") || limpia.startsWith("data:"));
    }).map(url => String(url).trim());

    // Si no hay ninguna imagen válida, ponemos la por defecto
    if (imagenesModal.length === 0) {
        imagenesModal = ["https://via.placeholder.com/600?text=PF+Moda"];
    }

    indiceImagenModal = 0;
    renderizarGaleriaModal();

    document.getElementById("modal-nombre").textContent =
        prod.nombre || "";

    document.getElementById("modal-categoria").textContent =
        prod.categoria || "";

    document.getElementById("modal-descripcion").textContent =
        prod.descripcion || "";

    const contenedorPrecio = document.getElementById("modal-precio");
    if (contenedorPrecio) {
        const htmlPrecio = generarHTMLPrecio(prod);
        const descuentoVal = calcularDescuento(prod.precio, prod.precioOferta);
        
        const badgeModal = descuentoVal 
            ? `<span class="precio-descuento" style="background:#e74c3c; color:#fff; padding:2px 6px; border-radius:3px; font-size:0.85em; font-weight:bold; margin-left:8px;">${descuentoVal}% OFF</span>` 
            : "";

        contenedorPrecio.innerHTML = `
            <div style="display: flex; align-items: center;">
                ${htmlPrecio}
                ${badgeModal}
            </div>
        `;
    }

    const selectColor =
        document.getElementById("modal-color");

    selectColor.innerHTML = "";

    if (prod.color) {

        const colores =
            prod.color.split(",");

        colores.forEach(color => {
            const option = document.createElement("option");
            option.value = color.trim();
            option.textContent = color.trim();
            selectColor.appendChild(option);
        });
        varianteSeleccionada.color = colores[0].trim();
    }

    const selectTalle = document.getElementById("modal-talle");
    selectTalle.innerHTML = "";

    if (prod.talles) {

        const talles =
            String(prod.talles)
            .split(",")
            .map(t => t.trim())
            .filter(t => t);

        talles.forEach(talle => {
            const option = document.createElement("option");
            option.value = talle.trim();
            option.textContent = talle.trim();
            selectTalle.appendChild(option);
        });

        varianteSeleccionada.talle = talles[0].trim();
    }

    document.getElementById(
        "modal-detalles-tecnicos"
    ).innerHTML = `
        <div>
            <strong>Código:</strong>
            ${escapeHTML(prod.codigo || "-")}
        </div>
        <div>
            <strong>Material:</strong>
            ${escapeHTML(prod.material || "-")}
        </div>
        <div>
            <strong>Stock:</strong>
            ${Number(prod.stock || 0)}
        </div>
    `;
    
    selectColor.onchange = function () {
        varianteSeleccionada.color = this.value;
    };

    selectTalle.onchange = function () {
        varianteSeleccionada.talle = this.value;
    };

    const btnAgregarModal = document.getElementById("btn-agregar-modal");
    if (btnAgregarModal) {
        const estaAgotado = Number(prod.stock || 0) <= 0;
        btnAgregarModal.disabled = estaAgotado;
        btnAgregarModal.textContent = estaAgotado ? "Agotado" : "Agregar al carrito";
        btnAgregarModal.onclick = function () {
            agregarAlCarritoDesdeModal();
        };
    }

    document
        .getElementById("modal-overlay")
        .classList.add("activo");

    document
        .getElementById("modal-producto")
        .classList.add("activo");

        renderizarProductosRelacionados(prod);
}

function cerrarModal() {
    const overlay = document.getElementById("modal-overlay");
    const modal = document.getElementById("modal-producto");

    if (overlay) {
        overlay.classList.remove("activo");
    }

    if (modal) {
        modal.classList.remove("activo");
    }

    // Cerrar también el visor de imagen si estuviera activo
    if (visorImagenActivo) {
        cerrarVisorImagen();
    }

    // Liberar referencias de imágenes del modal
    imagenesModal = [];
    indiceImagenModal = 0;
    productoModalActual = null;

    // Limpiar imágenes para reducir memoria utilizada en móviles
    const modalImg = document.getElementById("modal-img");
    if (modalImg) {
        modalImg.src = "";
    }
    const visorImg = document.getElementById("visor-img");
    if (visorImg) {
        visorImg.src = "";
    }

    // Restaurar scroll de la página
    document.body.style.overflow = "";
    restaurarSEOPrincipal();
}

/* =========================================
   GESTIÓN Y CÁLCULO DE PRECIOS CON DESCUENTO
========================================= */
function formatearPrecio(precio) {
    const num = Number(precio) || 0;
    return `₲ ${num.toLocaleString("es-PY")}`;
}

// 1. Crear función para calcular descuento
function calcularDescuento(precioNormal, precioOferta) {
    const normal = Number(precioNormal) || 0;
    const oferta = Number(precioOferta) || 0;

    if (normal <= 0 || oferta <= 0 || oferta >= normal) {
        return null;
    }

    const descuento = Math.round(((normal - oferta) / normal) * 100);
    return descuento;
}

// 2. Crear función para mostrar el precio en HTML
function generarHTMLPrecio(producto) {
    const precioNormal = Number(producto.precioNormal || producto.precio) || 0;
    const precioOferta = Number(producto.precioOferta) || 0;

    if (precioOferta > 0 && precioNormal > 0 && precioOferta < precioNormal) {
        return `
            <div class="precio-producto">
                <span class="precio-anterior">
                    ${formatearPrecio(precioNormal)}
                </span>
                <span class="precio-oferta">
                    ${formatearPrecio(precioOferta)}
                </span>
            </div>
        `;
    }

    return `
        <div class="precio-producto">
            <span class="precio-normal">
                ${formatearPrecio(precioNormal || producto.precio)}
            </span>
        </div>
    `;
}

function agregarAlCarritoDesdeModal() {

    // Verificar que exista un producto seleccionado
    if (!productoModalActual) {
        return;
    }

    if (Number(productoModalActual.stock || 0) <= 0) {
        alert("Este producto se encuentra agotado.");
        return;
    }

    // ==============================
    // OBTENER VARIANTES SELECCIONADAS
    // ==============================

    const color = varianteSeleccionada.color || "";
    const talle = varianteSeleccionada.talle || "";

    // ==============================
    // PRECIO
    // ==============================

    const precio = Number(
        productoModalActual.precioOferta ||
        productoModalActual.precio ||
        0
    );

    // ==============================
    // BUSCAR SI YA EXISTE
    // MISMO PRODUCTO + COLOR + TALLE
    // ==============================

    const index = carrito.findIndex(item =>
        String(item.codigo) === String(productoModalActual.codigo) &&
        String(item.color || "") === String(color) &&
        String(item.talle || "") === String(talle)
    );

    // ==============================
    // SI YA EXISTE → AUMENTAR CANTIDAD
    // ==============================

    if (index !== -1) {
        carrito[index].cantidad += 1;
    }
    else {
        carrito.push({
            codigo: productoModalActual.codigo,
            nombre: productoModalActual.nombre,
            color: color,
            talle: talle,
            precio: precio,
            imagen:
                productoModalActual.imagenPrincipal ||
                "https://via.placeholder.com/600?text=PF+Moda",
            cantidad: 1
        });
    }

    guardarYActualizarCarrito();
    cerrarModal();
}

function eliminarDelCarrito(codigo, color, talle) {

    carrito = carrito.filter(item => {

        const mismoCodigo =
            String(item.codigo) === String(codigo);

        const mismoColor =
            String(item.color || "") === String(color || "");

        const mismoTalle =
            String(item.talle || "") === String(talle || "");

        return !(mismoCodigo && mismoColor && mismoTalle);
    });

    guardarYActualizarCarrito();
}

// =========================================
// ACTUALIZACIÓN AUTOMÁTICA DEL INVENTARIO
// =========================================
let intervaloInventario = null;

async function actualizarInventarioAutomaticamente() {
    try {
        const respuesta = await api.getProductos();

        if (!respuesta || respuesta.error || !Array.isArray(respuesta.items)) {
            console.warn("No se pudo actualizar el inventario automáticamente.");
            return;
        }

        // 1. Actualizamos el catálogo local
        todosLosProductos = respuesta.items;

        // 2. Volvemos a renderizar las tarjetas visibles sin recargar la página
        filtrarYRenderizar();

        // 3. Ajustamos el carrito en caso de que el stock haya bajado
        validarCarritoContraStock();

        // 4. Actualizamos la interfaz del carrito
        actualizarCarritoUI();

        console.log("Inventario sincronizado automáticamente:", new Date().toLocaleTimeString());

    } catch (error) {
        console.error("Error actualizando inventario:", error);
    }
}

// =========================================
// INICIAR ACTUALIZACIÓN CADA 30 SEGUNDOS
// =========================================
function iniciarActualizacionInventario() {
    if (intervaloInventario) {
        clearInterval(intervaloInventario);
    }

    // Polling activo solo si la pestaña está visible
    intervaloInventario = setInterval(() => {
        if (!document.hidden) {
            actualizarInventarioAutomaticamente();
        }
    }, 30000);
}

// Escuchar cambios de visibilidad de la pestaña para ahorrar batería/datos
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        // Al volver a la pestaña, actualizamos inmediatamente el inventario
        actualizarInventarioAutomaticamente();
    }
});

// =========================================
// VALIDAR CARRITO CONTRA STOCK ACTUALIZADO
// =========================================
function validarCarritoContraStock() {
    let huboAjuste = false;
    let mensajesAjuste = [];

    carrito.forEach(item => {
        const producto = todosLosProductos.find(
            prod => String(prod.codigo) === String(item.codigo)
        );

        // Si el producto fue eliminado de la tienda
        if (!producto) {
            item.cantidad = 0;
            huboAjuste = true;
            mensajesAjuste.push(`- "${item.nombre}" ya no está disponible.`);
            return;
        }

        const stockDisponible = Number(producto.stock || 0);

        // Si el producto se agotó por completo
        if (stockDisponible <= 0) {
            item.cantidad = 0;
            huboAjuste = true;
            mensajesAjuste.push(`- "${item.nombre}" se ha agotado.`);
            return;
        }

        // Si la cantidad en el carrito supera el nuevo stock
        if (item.cantidad > stockDisponible) {
            item.cantidad = stockDisponible;
            huboAjuste = true;
            mensajesAjuste.push(`- "${item.nombre}" ajustado a ${stockDisponible} un. por límite de stock.`);
        }
    });

    // Filtramos los items que quedaron en 0
    carrito = carrito.filter(item => item.cantidad > 0);

    // Si hubo algún ajuste, guardamos, actualizamos y notificamos
    if (huboAjuste) {
        guardarYActualizarCarrito();
        alert(
            "⚠️ Atención: El inventario cambió recientemente y ajustamos tu carrito:\n\n" +
            mensajesAjuste.join("\n")
        );
    }
}

/* =========================================
   ETAPA 5.7 — PRODUCTOS RELACIONADOS
========================================= */

function obtenerProductosRelacionados(productoActual) {
    if (!productoActual || !todosLosProductos || todosLosProductos.length === 0) {
        return [];
    }

    const categoria = String(productoActual.categoria || "").trim().toLowerCase();
    const subcategoria = String(productoActual.subcategoria || "").trim().toLowerCase();
    const idActual = String(productoActual.id || productoActual.codigo || "").trim();

    // 1. Todos los productos disponibles (diferentes al actual y con stock > 0)
    const disponibles = todosLosProductos.filter(producto => {
        const idProd = String(producto.id || producto.codigo || "").trim();
        const stock = Number(producto.stock) || 0;
        return idProd !== idActual && stock > 0;
    });

    if (disponibles.length === 0) return [];

    // 2. Coincidencia de subcategoría
    const mismaSubcategoria = disponibles.filter(p => {
        const cat = String(p.categoria || "").trim().toLowerCase();
        const subcat = String(p.subcategoria || "").trim().toLowerCase();
        return cat === categoria && subcategoria !== "" && subcat === subcategoria;
    });

    // 3. Coincidencia de categoría
    const mismaCategoria = disponibles.filter(p => {
        const cat = String(p.categoria || "").trim().toLowerCase();
        return cat === categoria && !mismaSubcategoria.includes(p);
    });

    // 4. Otros productos (de respaldo por si no hay suficientes en la misma categoría)
    const otrosProductos = disponibles.filter(p => 
        !mismaSubcategoria.includes(p) && !mismaCategoria.includes(p)
    );

    // Prioridad: Subcategoría -> Categoría -> Otros productos
    const listaCompleta = [...mismaSubcategoria, ...mismaCategoria, ...otrosProductos];

    return listaCompleta.slice(0, 4);
}

function renderizarProductosRelacionados(productoActual) {
    const contenedor = document.getElementById("productos-relacionados");
    if (!contenedor) return;

    const relacionados = obtenerProductosRelacionados(productoActual);

    if (relacionados.length === 0) {
        contenedor.innerHTML = "";
        return;
    }

    contenedor.innerHTML = `
        <div class="relacionados-titulo">
            <h3>También te puede interesar</h3>
        </div>
        <div class="productos-relacionados-grid">
            ${relacionados.map(prod => {
                const imagen = prod.imagenPrincipal || "https://placehold.co/300x300?text=PF+Moda";
                const precioNormal = Number(prod.precio || 0);
                const precioOferta = Number(prod.precioOferta || 0);
                const tieneOferta = precioOferta > 0 && precioOferta < precioNormal;
                const precioMostrar = tieneOferta ? precioOferta : precioNormal;

                // Calcular el descuento
                const descuentoVal = calcularDescuento(precioNormal, precioOferta);
                const badgeDescuento = descuentoVal 
                    ? `<span class="badge-descuento">${descuentoVal}% OFF</span>` 
                    : "";

                return `
                    <div class="relacionado-card" 
                         onclick="abrirModal(todosLosProductos.find(p => String(p.codigo) === '${prod.codigo}'))">
                        <div class="relacionado-img-wrapper producto-imagen-container">
                            <img src="${escapeHTML(imagen)}" alt="${escapeHTML(prod.nombre || 'Producto')}" loading="lazy" decoding="async">
                        </div>
                        <div class="relacionado-info">
                            <span class="relacionado-categoria">${escapeHTML(prod.categoria || '')}</span>
                            <h4 class="relacionado-nombre">${escapeHTML(prod.nombre || 'Sin nombre')}</h4>
                            <div class="producto-precio-contenedor">
                                <span class="relacionado-precio">₲ ${precioMostrar.toLocaleString("es-PY")}</span>
                                ${badgeDescuento}
                            </div>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

/* =========================================
   SEO DINÁMICO DE PRODUCTOS (ETAPA 6.4)
========================================= */

function actualizarMeta(atributo, nombre, contenido) {
    let meta = document.querySelector(`meta[${atributo}="${nombre}"]`);
    if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(atributo, nombre);
        document.head.appendChild(meta);
    }
    meta.setAttribute("content", contenido || "");
}

function crearSchemaProducto(datos) {
    const existente = document.getElementById("schema-producto");
    if (existente) {
        existente.remove();
    }

    const producto = datos.producto;
    const urlProducto = typeof obtenerURLProducto === "function" 
        ? obtenerURLProducto(producto) 
        : window.location.href;

    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": datos.nombre,
        "description": datos.descripcion,
        "sku": datos.codigo,
        "image": datos.imagen ? [datos.imagen] : [],
        "brand": {
            "@type": "Brand",
            "name": "PF Moda"
        },
        "offers": {
            "@type": "Offer",
            "url": urlProducto,
            "priceCurrency": "PYG",
            "price": datos.precio,
            "availability": Number(producto.stock || 0) > 0 
                ? "https://schema.org/InStock" 
                : "https://schema.org/OutOfStock"
        }
    };

    const script = document.createElement("script");
    script.id = "schema-producto";
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema, null, 4);
    document.head.appendChild(script);
}

function actualizarSEOProducto(producto) {
    if (!producto) return;

    const nombre = String(producto.nombre || "Producto PF Moda").trim();
    const descripcion = String(
        producto.descripcionCompleta ||
        producto.descripcion ||
        producto.descripcionCorta ||
        ""
    ).trim();

    const precio = Number(
        producto.precioOferta ||
        producto.precioNormal ||
        producto.precio ||
        0
    );

    const imagen = producto.imagenPrincipal || producto.imagen || "";
    const codigo = String(producto.codigo || producto.id || "").trim();
    const urlProducto = typeof obtenerURLProducto === "function" 
        ? obtenerURLProducto(producto) 
        : window.location.href;

    // 1. Title
    document.title = `${nombre} | PF Moda`;

    // 2. Meta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    const descripcionSEO = descripcion 
        ? descripcion.substring(0, 155) 
        : `Compra ${nombre} en PF Moda.`;

    if (metaDescription) {
        metaDescription.setAttribute("content", descripcionSEO);
    }

    // 3. Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
        canonical.setAttribute("href", urlProducto);
    }

    // 4. Open Graph
    actualizarMeta("property", "og:title", `${nombre} | PF Moda`);
    actualizarMeta("property", "og:description", descripcionSEO);
    actualizarMeta("property", "og:url", urlProducto);
    if (imagen) {
        actualizarMeta("property", "og:image", imagen);
    }

    // 5. Twitter Card
    actualizarMeta("name", "twitter:title", `${nombre} | PF Moda`);
    actualizarMeta("name", "twitter:description", descripcionSEO);
    if (imagen) {
        actualizarMeta("name", "twitter:image", imagen);
    }

    // 6. Schema JSON-LD
    crearSchemaProducto({
        producto: producto,
        nombre: nombre,
        descripcion: descripcionSEO,
        codigo: codigo,
        imagen: imagen,
        precio: precio
    });
}

function restaurarSEOPrincipal() {
    document.title = "PF Moda — Tienda de Moda";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute(
            "content",
            "PF Moda — Tienda online de moda. Descubre nuestras prendas, novedades y ofertas."
        );
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
        canonical.setAttribute("href", "https://pfmoda-py.github.io/pfmoda/");
    }

    actualizarMeta("property", "og:title", "PF Moda — Tienda de Moda");
    actualizarMeta("property", "og:description", "Descubre productos de PF Moda, novedades y ofertas.");
    actualizarMeta("property", "og:url", "https://pfmoda-py.github.io/pfmoda/");
    actualizarMeta("property", "og:image", "https://pfmoda-py.github.io/pfmoda/images/og-image.jpg");

    actualizarMeta("name", "twitter:title", "PF Moda — Tienda de Moda");
    actualizarMeta("name", "twitter:description", "Descubre productos de PF Moda, novedades y ofertas.");
    actualizarMeta("name", "twitter:image", "https://pfmoda-py.github.io/pfmoda/images/og-image.jpg");

    // Eliminar datos estructurados dinámicos del producto si existen
    const schemaExistente = document.getElementById("schema-producto");
    if (schemaExistente) {
        schemaExistente.remove();
    }
}

/* =========================================
   CACHE PARA LAS CONEXIONES LENTAS
========================================= */
const CACHE_KEY_PRODUCTOS = 'pfmoda_cache_productos';
const CACHE_KEY_ESTRUCTURA = 'pfmoda_cache_estructura'; 

function guardarDatosEnCache(datos) {
    try {
        localStorage.setItem(CACHE_KEY_PRODUCTOS, JSON.stringify(datos));
    } catch (e) {
        console.warn("No se pudo guardar la caché en localStorage", e);
    }
}

function obtenerDatosDeCache() {
    try {
        const data = localStorage.getItem(CACHE_KEY_PRODUCTOS);
        return data ? JSON.parse(data) : null; 
    } catch (e) {
        return null;
    }
}