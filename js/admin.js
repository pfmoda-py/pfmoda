/**
 * PF MODA
 * Panel Administrativo (Optimizado)
 * admin.js
 */

// Variable global para guardar los pedidos cargados y no volver a pedirlos al servidor
let pedidosCargadosGlobal = [];
let listaCategoriasAdmin = [];
let listaSubcategoriasAdmin = [];
let modoEdicionCategoria = false;
let modoEdicionSubcategoria = false;

let listaBannersAdmin = [];
let modoEdicionBanner = false;

let productosAdmin = [];
let productoEditando = null;

function escaparHTML(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", async () => {
    await iniciarControlDeAcceso();
});

/* =========================================================
   CONTROL DE ACCESO
========================================================= */

function mostrarLogin(mensajeError) {
    const overlay = document.getElementById("login-overlay");
    const header = document.querySelector(".admin-header");
    const main = document.querySelector("main.admin-main");
    const sidebar = document.getElementById("admin-sidebar");

    if (overlay) overlay.style.display = "flex";
    if (header) header.style.display = "none";
    if (main) main.style.display = "none";
    if (sidebar) sidebar.style.display = "none";

    const errorEl = document.getElementById("login-error");
    if (errorEl) errorEl.textContent = mensajeError || "";
}

function ocultarLogin() {
    const overlay = document.getElementById("login-overlay");
    const header = document.querySelector(".admin-header");
    const main = document.querySelector("main.admin-main");
    const sidebar = document.getElementById("admin-sidebar");

    if (overlay) overlay.style.display = "none";
    if (header) header.style.display = "";
    if (main) main.style.display = "";
    if (sidebar) sidebar.style.display = "";
}

async function iniciarControlDeAcceso() {

    const esPantallaReset = await verificarSiHayTokenDeReset();
    if (esPantallaReset) return; // se queda en la pantalla de "nueva contraseña"

    const token = getAdminToken();

    if (token) {
        const overlay = document.getElementById("login-overlay");
        if (overlay) overlay.style.display = "none";

        const sesion = await api.verificarSesionAdmin(token);
        if (sesion && sesion.ok) {
            ocultarLogin();
            cargarPanelCompleto();
            return;
        }
        limpiarAdminToken();
    }

    mostrarLogin();
    configurarFormularioLogin();
}

function configurarFormularioLogin() {
    const form = document.getElementById("form-login-admin");
    if (form) {
        form.addEventListener("submit", async (evento) => {
            evento.preventDefault();

            const usuario = document.getElementById("login-usuario").value.trim();
            const password = document.getElementById("login-password").value;
            const boton = document.getElementById("btn-login-admin");
            const errorEl = document.getElementById("login-error");

            if (boton) { boton.disabled = true; boton.textContent = "Ingresando..."; }
            if (errorEl) errorEl.textContent = "";

            const resultado = await api.loginAdmin(usuario, password);

            if (resultado && resultado.ok) {
                setAdminToken(resultado.token);
                sessionStorage.setItem("pf_moda_rol_actual", resultado.rol);
                ocultarLogin();
                cargarPanelCompleto();
            } else {
                if (errorEl) errorEl.textContent = resultado?.error || "Usuario o contraseña incorrectos.";
                if (boton) { boton.disabled = false; boton.textContent = "Ingresar"; }
            }
        });
    }

    const linkOlvide = document.getElementById("link-olvide-clave");
    const linkVolver = document.getElementById("link-volver-login");
    const formOlvide = document.getElementById("form-olvide-clave");

    if (linkOlvide) {
        linkOlvide.addEventListener("click", (e) => {
            e.preventDefault();
            form.style.display = "none";
            formOlvide.style.display = "flex";
        });
    }

    if (linkVolver) {
        linkVolver.addEventListener("click", (e) => {
            e.preventDefault();
            formOlvide.style.display = "none";
            form.style.display = "flex";
        });
    }

    if (formOlvide) {
        formOlvide.addEventListener("submit", async (evento) => {
            evento.preventDefault();

            const valor = document.getElementById("olvide-usuario-email").value.trim();
            const mensajeEl = document.getElementById("olvide-mensaje");
            const boton = formOlvide.querySelector("button");

            boton.disabled = true;
            boton.textContent = "Enviando...";

            await api.solicitarResetPassword(valor);

            // Mensaje SIEMPRE igual, exista o no el usuario (seguridad).
            mensajeEl.style.color = "#2e7d32";
            mensajeEl.textContent = "Si el usuario existe, te enviamos un enlace por email.";
            boton.disabled = false;
            boton.textContent = "Enviar enlace";
        });
    }
}

async function verificarSiHayTokenDeReset() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("resetToken");

    if (!token) return false;

    const overlay = document.getElementById("login-overlay");
    const formLogin = document.getElementById("form-login-admin");
    const formOlvide = document.getElementById("form-olvide-clave");
    const formNueva = document.getElementById("form-nueva-clave");
    const mensajeEl = document.getElementById("nueva-clave-mensaje");

    overlay.style.display = "flex";
    formLogin.style.display = "none";
    formOlvide.style.display = "none";
    formNueva.style.display = "flex";

    const validacion = await api.validarTokenReset(token);

    if (!validacion.ok) {
        mensajeEl.textContent = validacion.error || "Enlace inválido.";
        formNueva.querySelector("button").disabled = true;
        return true;
    }

    formNueva.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const clave1 = document.getElementById("nueva-clave-1").value;
        const clave2 = document.getElementById("nueva-clave-2").value;

        if (clave1 !== clave2) {
            mensajeEl.textContent = "Las contraseñas no coinciden.";
            return;
        }
        if (clave1.length < 8) {
            mensajeEl.textContent = "La contraseña debe tener al menos 8 caracteres.";
            return;
        }

        const boton = formNueva.querySelector("button");
        boton.disabled = true;
        boton.textContent = "Guardando...";

        const resultado = await api.restablecerPassword(token, clave1);

        if (resultado.ok) {
            mensajeEl.style.color = "#2e7d32";
            mensajeEl.textContent = "Contraseña actualizada. Redirigiendo al login...";
            setTimeout(() => {
                window.location.href = window.location.pathname; // saca el ?resetToken de la URL
            }, 2000);
        } else {
            mensajeEl.textContent = resultado.error || "No se pudo actualizar la contraseña.";
            boton.disabled = false;
            boton.textContent = "Guardar contraseña";
        }
    });

    return true;
}

function cargarPanelCompleto() {
    inicializarPanel();
    configurarMenuAdmin();
    configurarProductosAdmin();
    configurarEventosCategorias();
    configurarEventosBanners();
    configurarLogout(); 
    configurarSeccionUsuariosAdmin();  
    
}

// ==========================================
// MENÚ LATERAL (SIDEBAR) Y HAMBURGUESA MÓVIL
// ==========================================
function configurarMenuAdmin() {
    const btnMenu = document.getElementById("btn-menu-admin");
    const sidebar = document.getElementById("admin-sidebar");
    const overlay = document.getElementById("admin-overlay");

    if (!btnMenu || !sidebar || !overlay || btnMenu.dataset.listo) return;
    btnMenu.dataset.listo = "true";

    function abrirMenu() {
        sidebar.classList.add("activo");
        overlay.classList.add("activo");
    }

    function cerrarMenu() {
        sidebar.classList.remove("activo");
        overlay.classList.remove("activo");
    }

    btnMenu.addEventListener("click", abrirMenu);
    overlay.addEventListener("click", cerrarMenu);

    // Botones del sidebar: cambian de sección
    document.querySelectorAll(".admin-nav-btn[data-view]").forEach(btn => {
        btn.addEventListener("click", () => {
            setViewAdmin(btn.dataset.view);
            cerrarMenu();
        });
    });
}

// ==========================================
// CAMBIAR DE SECCIÓN (Pedidos / Productos / Categorías / Subcategorías / Banners / Usuarios)
// ==========================================
// Controla qué secciones ya pidieron sus datos al servidor,
// para no volver a cargarlas cada vez que el usuario hace clic
const seccionesYaCargadas = {};

function setViewAdmin(view) {
    document.querySelectorAll(".admin-nav-btn[data-view]").forEach(btn => {
        btn.classList.toggle("activo", btn.dataset.view === view);
    });

    document.querySelectorAll(".admin-view[data-view-panel]").forEach(seccion => {
        seccion.classList.toggle("activo", seccion.dataset.viewPanel === view);
    });

    // Carga diferida: recién se pide al servidor la primera vez que se entra a la sección
    if (!seccionesYaCargadas[view]) {
        seccionesYaCargadas[view] = true;

        if (view === "banners") {
            cargarBannersAdmin();
        } else if (view === "usuarios") {
            cargarUsuariosAdmin();
        }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================
   GESTIÓN DE USUARIOS ADMIN
========================================================= */

async function configurarSeccionUsuariosAdmin() {
    const sesionGuardada = sessionStorage.getItem("pf_moda_rol_actual");
    // El rol lo vamos a guardar en el login (ver ajuste abajo)

    const seccion = document.getElementById("seccion-usuarios-admin");
    const navUsuarios = document.getElementById("admin-nav-usuarios");

    if (sesionGuardada !== "superadmin") {
        if (seccion) seccion.style.display = "none";
        if (navUsuarios) navUsuarios.style.display = "none";
        return;
    }

    if (seccion) seccion.style.display = "";
    if (navUsuarios) navUsuarios.style.display = "flex";
    // La carga de la lista de usuarios se difiere: recién se pide al servidor
    // la primera vez que el usuario entra a la sección (ver setViewAdmin).

    const btnNuevo = document.getElementById("btn-nuevo-usuario-admin");
    const modal = document.getElementById("modal-usuario-admin");
    const btnCerrar = document.getElementById("btn-cerrar-usuario-admin");
    const btnCancelar = document.getElementById("btn-cancelar-usuario-admin");
    const form = document.getElementById("form-usuario-admin");

    if (btnNuevo) btnNuevo.addEventListener("click", () => {
        form.reset();
        document.getElementById("usuario-admin-mensaje").textContent = "";
        modal.classList.add("activo");
    });

    [btnCerrar, btnCancelar].forEach(btn => {
        if (btn) btn.addEventListener("click", () => modal.classList.remove("activo"));
    });

    if (form && !form.dataset.listo) {
        form.dataset.listo = "true";
        form.addEventListener("submit", async (evento) => {
            evento.preventDefault();

            const nuevoUsuario = {
                usuario: document.getElementById("nuevo-admin-usuario").value.trim(),
                nombre: document.getElementById("nuevo-admin-nombre").value.trim(),
                email: document.getElementById("nuevo-admin-email").value.trim(),
                password: document.getElementById("nuevo-admin-password").value,
                rol: document.getElementById("nuevo-admin-rol").value
            };

            const mensajeEl = document.getElementById("usuario-admin-mensaje");
            const boton = form.querySelector("button[type=submit]");
            boton.disabled = true;
            boton.textContent = "Creando...";

            const resultado = await api.crearUsuarioAdmin(nuevoUsuario);

            if (resultado && resultado.ok) {
                modal.classList.remove("activo");
                await cargarUsuariosAdmin();
            } else {
                mensajeEl.textContent = resultado?.error || "No se pudo crear el usuario.";
            }

            boton.disabled = false;
            boton.textContent = "Crear Usuario";
        });
    }
}

async function cargarUsuariosAdmin() {
    const body = document.getElementById("usuarios-admin-body");
    if (!body) return;

    const resultado = await api.listarUsuariosAdmin();

    if (!resultado || !resultado.ok) {
        body.innerHTML = `<tr><td colspan="6" class="tabla-vacia">${resultado?.error || "No se pudo cargar."}</td></tr>`;
        return;
    }

    if (resultado.usuarios.length === 0) {
        body.innerHTML = `<tr><td colspan="6" class="tabla-vacia">No hay usuarios.</td></tr>`;
        return;
    }

    body.innerHTML = "";

    resultado.usuarios.forEach(u => {
        const activo = u.activo === true || String(u.activo).toLowerCase() === "true";

        const fila = document.createElement("tr");
            fila.innerHTML = `
            <td>${escaparHTML(u.usuario)}</td>
            <td>${escaparHTML(u.nombre)}</td>
            <td>${escaparHTML(u.email)}</td>
            <td>${escaparHTML(u.rol)}</td>
            <td>${activo ? "Activo" : "Deshabilitado"}</td>
            <td>
                <button type="button" class="btn-admin-secundario btn-toggle-usuario" data-usuario="${escaparHTML(u.usuario)}" data-activo="${activo}">
                    ${activo ? "Deshabilitar" : "Habilitar"}
                </button>
            </td>
        `;
        body.appendChild(fila);
    });

    body.querySelectorAll(".btn-toggle-usuario").forEach(btn => {
        btn.addEventListener("click", async () => {
            const usuario = btn.dataset.usuario;
            const activoActual = btn.dataset.activo === "true";

            btn.disabled = true;
            const resultado = await api.cambiarEstadoUsuarioAdmin(usuario, !activoActual);

            if (resultado && resultado.ok) {
                await cargarUsuariosAdmin();
            } else {
                alert(resultado?.error || "No se pudo cambiar el estado.");
                btn.disabled = false;
            }
        });
    });
}

function configurarLogout() {
    const btn = document.getElementById("btn-logout-admin");
    if (!btn || btn.dataset.listo) return;
    btn.dataset.listo = "true";

    btn.addEventListener("click", async () => {
        const token = getAdminToken();
        await api.cerrarSesionAdmin(token);
        limpiarAdminToken();
        sessionStorage.removeItem("pf_moda_rol_actual");
        window.location.reload();
    });
}

/* =========================================================
   INICIALIZAR PANEL (OPTIMIZADO CON PROMISE.ALL)
========================================================= */

async function inicializarPanel() {
    console.log("Inicializando panel administrativo de forma optimizada...");

    const tbody = document.getElementById("tabla-pedidos");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="admin-cargando">Cargando panel...</td>
            </tr>
        `;
    }

    try {
        // Carga PEDIDOS, PRODUCTOS, CATEGORÍAS y SUBCATEGORÍAS al mismo tiempo (Paralelo)
        const [resultadoPedidos, resultadoProductos, resultadoCategorias, resultadoSubcategorias] = await Promise.all([
            api.getPedidos(),
            api.getProductos(),
            api.getCategorias(),
            api.getSubcategorias()
        ]);

        /* 1. ACTUALIZAR TARJETAS DE RESUMEN */
        const totalPedidos = resultadoPedidos && Array.isArray(resultadoPedidos.items) ? resultadoPedidos.items.length : 0;
        const totalProductos = resultadoProductos && Array.isArray(resultadoProductos.items) ? resultadoProductos.items.length : 0;
        
        listaCategoriasAdmin = resultadoCategorias && Array.isArray(resultadoCategorias.items) ? resultadoCategorias.items : [];
        listaSubcategoriasAdmin = resultadoSubcategorias && Array.isArray(resultadoSubcategorias.items) ? resultadoSubcategorias.items : [];
        
        const elPedidos = document.getElementById("total-pedidos");
        const elProductos = document.getElementById("total-productos");
        const elCategorias = document.getElementById("total-categorias");

        if (elPedidos) elPedidos.textContent = totalPedidos;
        if (elProductos) elProductos.textContent = totalProductos;
        if (elCategorias) elCategorias.textContent = listaCategoriasAdmin.length;

        /* 2. GUARDAR PEDIDOS EN MEMORIA LOCAL Y RENDERIZAR TABLA */
        pedidosCargadosGlobal = Array.isArray(resultadoPedidos?.items) ? resultadoPedidos.items : [];
        renderizarTablaPedidos(pedidosCargadosGlobal);

                /* 3. PINTAR PRODUCTOS, CATEGORÍAS Y SUBCATEGORÍAS CON LOS DATOS YA TRAÍDOS (sin repetir el pedido) */
        cargarProductosAdmin(resultadoProductos && Array.isArray(resultadoProductos.items) ? resultadoProductos.items : []);
        cargarCategoriasAdmin(listaCategoriasAdmin);
        cargarSubcategoriasAdmin(listaSubcategoriasAdmin);
    } catch (error) {
        console.error("Error al cargar el panel:", error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8">No se pudieron cargar los datos del panel.</td></tr>`;
        }
    }

    configurarEventos();
}   

/* =========================================================
   RENDERIZAR TABLA DE PEDIDOS
========================================================= */

function renderizarTablaPedidos(pedidos) {
    const tbody = document.getElementById("tabla-pedidos");
    if (!tbody) return;

    if (pedidos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="admin-sin-datos">No hay pedidos registrados</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = "";
    const opcionesEstado = ["Pendiente", "Confirmado", "Preparando", "Enviado", "Entregado", "Cancelado"];

    pedidos.forEach(pedido => {
        const fila = document.createElement("tr");

        const numeroPedido = pedido.numeroPedido || "-";
        const fecha = pedido.fecha || "-";
        const cliente = pedido.nombreCliente || "-";
        const whatsapp = pedido.whatsApp || pedido.whatsapp || "-";
        const ciudad = pedido.ciudad || "-";
        const total = Number(pedido.total || 0);
        const estadoActual = pedido.estado || "Pendiente";

        const optionsHTML = opcionesEstado
            .map(estado => `<option value="${estado}" ${estadoActual === estado ? "selected" : ""}>${estado}</option>`)
            .join("");

        fila.innerHTML = `
            <td>${escaparHTML(numeroPedido)}</td>
            <td>${formatearFecha(fecha)}</td>
            <td>${escaparHTML(cliente)}</td>
            <td>${escaparHTML(whatsapp)}</td>
            <td>${escaparHTML(ciudad)}</td>
            <td>₲ ${total.toLocaleString("es-PY")}</td>
            <td>
                <select class="select-estado-pedido" data-numero-pedido="${numeroPedido}">
                    ${optionsHTML}
                </select>
            </td>
            <td>
                <button type="button" class="btn-ver-pedido" data-numero-pedido="${numeroPedido}">
                    Ver
                </button>
            </td>
        `;

        tbody.appendChild(fila);
    });

    // Eventos para botones "Ver"
    tbody.querySelectorAll(".btn-ver-pedido").forEach(boton => {
        boton.addEventListener("click", () => {
            const numeroPedido = boton.dataset.numeroPedido;
            abrirDetallePedido(numeroPedido);
        });
    });

    // Eventos para select de "Estado" en la tabla
    tbody.querySelectorAll(".select-estado-pedido").forEach(select => {
        select.addEventListener("change", async () => {
            const numeroPedido = select.dataset.numeroPedido;
            const nuevoEstado = select.value;
            await actualizarEstadoPedido(numeroPedido, nuevoEstado);
        });
    });
}

/* =========================================================
   ABRIR DETALLE DEL PEDIDO (CORREGIDO Y ORGANIZADO)
========================================================= */

function abrirDetallePedido(numeroPedido) {
    const overlay = document.getElementById("modal-pedido-overlay");
    const contenido = document.getElementById("detalle-pedido-contenido");

    if (!overlay || !contenido) return;

    // 1. Mostrar el modal inmediatamente
    overlay.classList.add("activo");

    // 2. Buscar el pedido guardado en la memoria local
    const pedido = pedidosCargadosGlobal.find(p => String(p.numeroPedido) === String(numeroPedido));

    if (!pedido) {
        contenido.innerHTML = `<p class="admin-error">No se encontró la información del pedido.</p>`;
        return;
    }

    const detalles = Array.isArray(pedido.detalles) ? pedido.detalles : [];
    const opcionesEstado = ["Pendiente", "Confirmado", "Preparando", "Enviado", "Entregado", "Cancelado"];
    // ✅ LÍNEA CORREGIDA
    const numWhatsapp = String(pedido.whatsApp || pedido.whatsapp || "").replace(/\D/g, '');

    let html = `
        <!-- 1. ENCABEZADO Y RESUMEN DEL PEDIDO -->
        <div class="modal-pedido-cabecera">
            <div>
                <span class="badge-num-pedido">${pedido.numeroPedido || "-"}</span>
                <span class="fecha-modal">📅 ${formatearFecha(pedido.fecha)}</span>
            </div>
            <div class="monto-destacado-modal">
                <small>Total del Pedido</small>
                <strong>₲ ${Number(pedido.total || 0).toLocaleString("es-PY")}</strong>
            </div>
        </div>

        <!-- 2. BARRA DE CAMBIO DE ESTADO -->
        <div class="panel-accion-estado">
            <label for="select-estado-pedido"><strong>Estado del pedido:</strong></label>
            <div class="controles-estado-modal">
                <select id="select-estado-pedido" class="select-estado-modal">
                    ${opcionesEstado.map(e => `<option value="${e}" ${(pedido.estado || 'Pendiente') === e ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
                <button type="button" id="btn-guardar-estado" class="btn-guardar-estado-modal">
                    Guardar Estado
                </button>
            </div>
        </div>

        <!-- 3. BLOQUES DE INFORMACIÓN ORGANIZADOS -->
        <div class="grid-modal-info">

            <!-- BLOQUE: CLIENTE -->
            <div class="card-info-modal">
                <h4>👤 Cliente</h4>
                <div class="fila-info"><strong>Nombre:</strong> <span>${escaparHTML(pedido.nombreCliente) || "-"}</span></div>
                <div class="fila-info">
                    <strong>WhatsApp:</strong> 
                    <span>
                        ${numWhatsapp ? `
                            <a href="https://wa.me/595${numWhatsapp}" target="_blank" class="link-wa-modal">
                                💬 ${pedido.whatsApp || pedido.whatsapp}
                            </a>
                        ` : '-'}
                    </span>
                </div>
            </div>

            <!-- BLOQUE: ENVÍO -->
            <div class="card-info-modal">
                <h4>🚚 Entrega y Dirección</h4>
                <div class="fila-info"><strong>Tipo:</strong> <span class="badge-tipo-entrega">${escaparHTML(pedido.entrega) || "-"}</span></div>
                <div class="fila-info"><strong>Ubicación:</strong> <span>${escaparHTML(pedido.ciudad) || "-"} ${pedido.barrio ? `(${escaparHTML(pedido.barrio)})` : ""}</span></div>
                <div class="fila-info"><strong>Dirección:</strong> <span>${escaparHTML(pedido.direccion) || "-"}</span></div>
            </div>

            <!-- BLOQUE: FACTURACIÓN -->
            <div class="card-info-modal">
                <h4>📄 Facturación</h4>
                <div class="fila-info">
                    <strong>Requiere Factura:</strong> 
                    <span>${(pedido.factura || "No").toLowerCase() === "sí" || (pedido.factura || "No").toLowerCase() === "si" ? "✅ Sí" : "❌ No"}</span>
                </div>

                <div class="fila-info">
                    <strong>Razón Social:</strong> 
                    <span>${escaparHTML(pedido.razonSocial || pedido.rAzonSocial || pedido.nombreFactura) || "-"}</span>
                </div>

                <div class="fila-info">
                    <strong>RUC / CI:</strong> 
                    <span>${escaparHTML(pedido.rUC || pedido.RUC || pedido.ruc) || "-"}</span>
                </div>
            </div>

        </div>

        <!-- OBSERVACIONES (Si existen) -->
        ${pedido.observaciones ? `
            <div class="card-info-modal observaciones-block">
                <h4>📝 Observaciones del Cliente</h4>
                <p>${escaparHTML(pedido.observaciones)}</p>
            </div>
        ` : ""}

        <!-- 4. TABLA DE PRODUCTOS -->
        <div class="seccion-productos-modal">
            <h4>🛍️ Productos Solicitados (${detalles.length})</h4>
            ${detalles.length === 0 ? '<p class="sin-productos">No hay detalles registrados para este pedido.</p>' : `
                <div class="wrapper-tabla-modal">
                    <table class="tabla-modal-detalles">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Variantes</th>
                                <th>Cant.</th>
                                <th>Precio Un.</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${detalles.map(item => {
                                const precio = Number(item.precio || 0);
                                const cantidad = Number(item.cantidad || 0);
                                const total = Number(item.total || (precio * cantidad));
                                return `
                                    <tr>
                                        <td><code>${escaparHTML(item.codigo) || "-"}</code></td>
                                        <td><strong>${escaparHTML(item.nombre) || "-"}</strong></td>
                                        <td>${item.color ? `Color: ${escaparHTML(item.color)}` : ''} ${item.talle ? `| Talle: ${escaparHTML(item.talle)}` : ''}</td>
                                        <td>${cantidad}</td>
                                        <td>₲ ${precio.toLocaleString("es-PY")}</td>
                                        <td><strong>₲ ${total.toLocaleString("es-PY")}</strong></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;

    contenido.innerHTML = html;

    // Evento del botón guardar estado
    const btnGuardarEstado = document.getElementById("btn-guardar-estado");
    const selectEstadoModal = document.getElementById("select-estado-pedido");

    if (btnGuardarEstado && selectEstadoModal) {
        btnGuardarEstado.addEventListener("click", async () => {
            const nuevoEstado = selectEstadoModal.value;
            btnGuardarEstado.disabled = true;
            btnGuardarEstado.textContent = "Guardando...";

            await actualizarEstadoPedido(pedido.numeroPedido, nuevoEstado);

            btnGuardarEstado.disabled = false;
            btnGuardarEstado.textContent = "Guardar Estado";
        });
    }
}

/* =========================================================
   ACTUALIZAR ESTADO DEL PEDIDO
========================================================= */

async function actualizarEstadoPedido(numeroPedido, nuevoEstado) {
    try {
        const resultado = await api.actualizarEstadoPedido({
            numeroPedido: numeroPedido,
            estado: nuevoEstado
        });

        if (!resultado || resultado.error) {
            alert(resultado?.error || "No se pudo actualizar el estado.");
            return;
        }

        // Actualizar el estado en la memoria local
        const pedido = pedidosCargadosGlobal.find(p => String(p.numeroPedido) === String(numeroPedido));
        if (pedido) {
            pedido.estado = nuevoEstado;
        }

        // Volver a dibujar la tabla localmente sin llamar al servidor
        renderizarTablaPedidos(pedidosCargadosGlobal);

    } catch (error) {
        console.error("Error actualizando estado:", error);
        alert("No se pudo actualizar el estado del pedido.");
    }
}

/* =========================================================
   CERRAR MODAL
========================================================= */

function cerrarDetallePedido() {
    const overlay = document.getElementById("modal-pedido-overlay");
    if (overlay) overlay.classList.remove("activo");
}

/* =========================================================
   EVENTOS DEL PANEL
========================================================= */

function configurarEventos() {
    const botonCerrar = document.getElementById("btn-cerrar-modal-pedido");
    if (botonCerrar) {
        botonCerrar.addEventListener("click", cerrarDetallePedido);
    }

    const overlay = document.getElementById("modal-pedido-overlay");
    if (overlay) {
        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                cerrarDetallePedido();
            }
        });
    }

    const botonActualizar = document.getElementById("btn-recargar-pedidos");
    if (botonActualizar) {
        botonActualizar.addEventListener("click", async () => {
            botonActualizar.disabled = true;
            botonActualizar.textContent = "Actualizando...";

            await inicializarPanel();

            botonActualizar.disabled = false;
            botonActualizar.textContent = "↻ Actualizar";
        });
    }
}

/* =========================================================
   FORMATEAR FECHA
========================================================= */

function formatearFecha(fecha) {
    if (!fecha) return "-";
    const fechaObjeto = new Date(fecha);
    if (isNaN(fechaObjeto.getTime())) return fecha;

    return fechaObjeto.toLocaleDateString("es-PY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

/* ============================================================
   GESTIÓN DE PRODUCTOS
============================================================ */

/**
 * Cargar productos
 */
async function cargarProductosAdmin(datosPrecargados) {
    const tbody =
        document.getElementById(
            "productos-admin-body"
        );
    if (!tbody) return;
    let items;

    if (datosPrecargados) {
        items = datosPrecargados;
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="tabla-vacia">
                    Cargando productos...
                </td>
            </tr>
        `;
        const respuesta =
            await api.getProductosAdmin();
        if (respuesta.error) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="tabla-vacia">
                        ${respuesta.error}
                    </td>
                </tr>
            `;
            return;
        }
        items = respuesta.items || [];
    }

    productosAdmin = items;
    renderizarProductosAdmin();
}

/**
 * Renderizar tabla
 */
function renderizarProductosAdmin() {

    const tbody =
        document.getElementById(
            "productos-admin-body"
        );

    if (!tbody) return;


    if (productosAdmin.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="tabla-vacia">

                    No hay productos registrados.

                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML = "";


    productosAdmin.forEach(producto => {

        const fila =
            document.createElement("tr");


        const imagen =
            producto.imagenPrincipal ||
            "https://via.placeholder.com/70?text=PF";


        const precio =
            Number(
                producto.precio || 0
            );


        const oferta =
            Number(
                producto.precioOferta || 0
            );


        fila.innerHTML = `
            <td>
                <img
                    src="${escaparHTML(imagen)}"
                    class="producto-admin-miniatura"
                    onerror="
                        this.src='https://via.placeholder.com/70?text=PF'
                    ">
            </td>
            <td>
                ${escaparHTML(producto.codigo || "-")}
            </td>
            <td>
                <strong>
                    ${escaparHTML(producto.nombre || "-")}
                </strong>
            </td>
            <td>
                ${producto.categoria || "-"}
            </td>
            <td>
                ₲ ${precio.toLocaleString("es-PY")}
            </td>
            <td>
                ${
                    oferta > 0
                    ? "₲ " +
                      oferta.toLocaleString("es-PY")
                    : "-"
                }
            </td>
            <td>
                ${producto.stock ?? 0}
            </td>
            <td>
                <span
                    class="estado-producto
                    ${producto.estado === "Activo"
                        ? "activo"
                        : "inactivo"
                    }">
                    ${producto.estado || "-"}
                </span>
            </td>
            <td>
                <button
                    class="btn-editar-producto"
                    data-codigo="${producto.codigo}">
                    Editar
                </button>
            </td>
        `;
        tbody.appendChild(fila);
    });

    document
        .querySelectorAll(
            ".btn-editar-producto"
        )
    .forEach(btn => {
        btn.addEventListener(
            "click",
            function() {
                const codigo =
                    this.dataset.codigo;
                editarProductoAdmin(
                    codigo
                );
            }
        );
    });
}

/* ============================================================
   FUNCIONES AUXILIARES DE DESPLEGABLES (CATEGORÍAS Y SUBCATEGORÍAS)
============================================================ */

function cargarSelectCategoriasModal(categoriaSeleccionada = '') {
    const selectCat = document.getElementById("admin-categoria");
    if (!selectCat) return;

    selectCat.innerHTML = `<option value="">Selecciona una categoría...</option>`;

    listaCategoriasAdmin.forEach(cat => {
        const idCat = cat.id || cat.ID || cat.iD || cat.nombre;
        const nombreCat = cat.nombre || idCat;
        
        if (cat.estado === 'Activo' || String(idCat) === String(categoriaSeleccionada) || String(nombreCat) === String(categoriaSeleccionada)) {
            const selected = (String(idCat) === String(categoriaSeleccionada) || String(nombreCat) === String(categoriaSeleccionada)) ? 'selected' : '';
            selectCat.innerHTML += `<option value="${nombreCat}" data-id="${idCat}" ${selected}>${nombreCat}</option>`;
        }
    });
}

/**
 * Llena el selector de Subcategorías filtrado por la Categoría elegida
 */
function cargarSelectSubcategoriasModal(categoriaPadre = '', subcategoriaSeleccionada = '') {
    const selectSub = document.getElementById("admin-subcategoria");
    if (!selectSub) return;

    if (!categoriaPadre) {
        selectSub.innerHTML = `<option value="">Selecciona primero una categoría...</option>`;
        selectSub.disabled = true;
        return;
    }

    // Buscar objeto de categoría padre para obtener su ID
    const catPadreObj = listaCategoriasAdmin.find(c => 
        String(c.nombre) === String(categoriaPadre) || String(c.id || c.ID || c.iD) === String(categoriaPadre)
    );

    const idPadre = catPadreObj ? (catPadreObj.id || catPadreObj.ID || catPadreObj.iD) : categoriaPadre;

    // Filtrar subcategorías pertenecientes a la categoría elegida
    const subFiltradas = listaSubcategoriasAdmin.filter(sub => {
        const idCatPadre = sub.categoriaID || sub.categoriaId || sub.CategoriaID || sub.categoriaid;
        return String(idCatPadre) === String(idPadre) || String(idCatPadre) === String(categoriaPadre);
    });

    if (subFiltradas.length === 0) {
        selectSub.innerHTML = `<option value="">Sin subcategorías disponibles</option>`;
        selectSub.disabled = true;
    } else {
        selectSub.innerHTML = `<option value="">Selecciona una subcategoría...</option>`;
        
        subFiltradas.forEach(sub => {
            const idSub = sub.id || sub.ID || sub.iD || sub.nombre;
            const nombreSub = sub.nombre || idSub;

            if (sub.estado === 'Activo' || String(idSub) === String(subcategoriaSeleccionada) || String(nombreSub) === String(subcategoriaSeleccionada)) {
                const selected = (String(idSub) === String(subcategoriaSeleccionada) || String(nombreSub) === String(subcategoriaSeleccionada)) ? 'selected' : '';
                selectSub.innerHTML += `<option value="${nombreSub}" ${selected}>${nombreSub}</option>`;
            }
        });
        
        selectSub.disabled = false;
    }
}

/**
 * Abrir formulario nuevo
 */
function nuevoProductoAdmin() {

    productoEditando = null;

    document.getElementById("titulo-modal-producto").textContent = "Nuevo Producto";

    document.getElementById("form-producto-admin").reset();

    document.getElementById("admin-codigo").disabled = false;

    // 📌 LLENAR DESPLEGABLES DE CATEGORÍA Y SUBCATEGORÍA
    cargarSelectCategoriasModal('');
    cargarSelectSubcategoriasModal('', '');

    refrescarTodosLosPreviews();

    document.getElementById("modal-producto-admin").classList.add("activo");

}

/**
 * Editar producto
 */
function editarProductoAdmin(codigo) {

    const producto = productosAdmin.find(item => String(item.codigo) === String(codigo));

    if (!producto) {
        alert("No se encontró el producto.");
        return;
    }

    productoEditando = producto;

    document.getElementById("titulo-modal-producto").textContent = "Editar Producto";

    document.getElementById("admin-codigo").value = producto.codigo || "";
    document.getElementById("admin-codigo").disabled = true;
    document.getElementById("admin-nombre").value = producto.nombre || "";

    // 📌 AUTOCOMPLETAR Y SELECCIONAR CATEGORÍA Y SUBCATEGORÍA
    const catActual = producto.categoria || "";
    const subcatActual = producto.subcategoria || "";

    cargarSelectCategoriasModal(catActual);
    cargarSelectSubcategoriasModal(catActual, subcatActual);

    document.getElementById("admin-precio").value = producto.precio || "";
    document.getElementById("admin-precio-oferta").value = producto.precioOferta || "";
    document.getElementById("admin-color").value = producto.color || "";
    document.getElementById("admin-talles").value = producto.talles || "";
    document.getElementById("admin-stock").value = producto.stock || "";
    document.getElementById("admin-descripcion").value = producto.descripcion || "";
    document.getElementById("admin-material").value = producto.material || "";
    document.getElementById("admin-estado").value = producto.estado || "Activo";
    document.getElementById("admin-etiqueta").value = producto.etiqueta || "";

    document.getElementById("admin-imagen-principal").value = producto.imagenPrincipal || "";
    document.getElementById("admin-imagen-2").value = producto.imagen2 || "";
    document.getElementById("admin-imagen-3").value = producto.imagen3 || "";
    document.getElementById("admin-imagen-4").value = producto.imagen4 || "";

    refrescarTodosLosPreviews();

    document.getElementById("modal-producto-admin").classList.add("activo");

}

/**
 * Cerrar modal
 */
function cerrarModalProductoAdmin() {

    document.getElementById(
        "modal-producto-admin"
    ).classList.remove("activo");

}

/**
 * Obtener datos del formulario
 */
function obtenerDatosProductoAdmin() {

    return {

        codigo:
            document.getElementById(
                "admin-codigo"
            ).value.trim(),

        nombre:
            document.getElementById(
                "admin-nombre"
            ).value.trim(),

        categoria:
            document.getElementById(
                "admin-categoria"
            ).value.trim(),

        subcategoria:
            document.getElementById(
                "admin-subcategoria"
            ).value.trim(),

        precio:
            Number(
                document.getElementById(
                    "admin-precio"
                ).value || 0
            ),

        precioOferta:
            Number(
                document.getElementById(
                    "admin-precio-oferta"
                ).value || 0
            ),

        color:
            document.getElementById(
                "admin-color"
            ).value.trim(),

        talles:
            document.getElementById(
                "admin-talles"
            ).value.trim(),

        stock:
            Number(
                document.getElementById(
                    "admin-stock"
                ).value || 0
            ),

        descripcion:
            document.getElementById(
                "admin-descripcion"
            ).value.trim(),

        material:
            document.getElementById(
                "admin-material"
            ).value.trim(),

        estado:
            document.getElementById(
                "admin-estado"
            ).value,

        etiqueta:
            document.getElementById(
                "admin-etiqueta"
            ).value.trim(),

        imagenPrincipal:
            document.getElementById(
                "admin-imagen-principal"
            ).value.trim(),

        imagen2:
            document.getElementById(
                "admin-imagen-2"
            ).value.trim(),

        imagen3:
            document.getElementById(
                "admin-imagen-3"
            ).value.trim(),

        imagen4:
            document.getElementById(
                "admin-imagen-4"
            ).value.trim()

    };

}

/**
 * Guardar producto
 */
async function guardarProductoAdmin(event) {

    event.preventDefault();


    const producto =
        obtenerDatosProductoAdmin();


    if (
        !producto.codigo ||
        !producto.nombre
    ) {

        alert(
            "Código y nombre son obligatorios."
        );

        return;

    }


    const boton =
        event.submitter;


    boton.disabled = true;

    boton.textContent =
        "Guardando...";


    let resultado;


    if (productoEditando) {

        resultado =
            await api.actualizarProductoAdmin(
                producto
            );

    } else {

        resultado =
            await api.crearProductoAdmin(
                producto
            );

    }


    boton.disabled = false;

    boton.textContent =
        "Guardar Producto";


    if (resultado.error) {

        alert(
            resultado.error
        );

        return;

    }


    alert(
        resultado.mensaje ||
        "Producto guardado correctamente."
    );


    cerrarModalProductoAdmin();


    await cargarProductosAdmin();

}

/**
 * Eventos
 */
function configurarProductosAdmin() {

    const btnNuevo = document.getElementById("btn-nuevo-producto");
    if (btnNuevo) {
        btnNuevo.addEventListener("click", nuevoProductoAdmin);
    }

    const btnCerrar = document.getElementById("btn-cerrar-producto-admin");
    if (btnCerrar) {
        btnCerrar.addEventListener("click", cerrarModalProductoAdmin);
    }

    const btnCancelar = document.getElementById("btn-cancelar-producto");
    if (btnCancelar) {
        btnCancelar.addEventListener("click", cerrarModalProductoAdmin);
    }

    const formulario = document.getElementById("form-producto-admin");
    if (formulario) {
        formulario.addEventListener("submit", guardarProductoAdmin);
    }

    // 📌 EVENTO: Escuchar cambio en el desplegable de categoría
    const selectCategoria = document.getElementById("admin-categoria");
    if (selectCategoria) {
        selectCategoria.addEventListener("change", (e) => {
            const categoriaElegida = e.target.value;
            cargarSelectSubcategoriasModal(categoriaElegida, '');
        });
    }

        ['admin-imagen-principal', 'admin-imagen-2', 'admin-imagen-3', 'admin-imagen-4'].forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            inputElement.addEventListener('input', () => {
                actualizarPreviewImagenAdmin(id);
            });
        }
    });
}

/* ============================================================
   ETAPA 4: GESTIÓN Y CONVERSIÓN DE IMÁGENES DE PRODUCTOS
============================================================ */

/**
 * Convierte URLs de enlaces compartidos de Google Drive a URLs de imagen directa
 */
function convertirUrlGoogleDrive(url) {
    if (!url) return '';
    
    // Si es un link de Google Drive (file/d/ID/view o id=ID)
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    
    if (match && match[1]) {
        const fileId = match[1];
        // Retorna la URL directa de visualización de Google Drive
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    return url;
}

/**
 * Actualiza el recuadro de Vista Previa de una imagen
 */
function actualizarPreviewImagenAdmin(inputId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(`preview-${inputId}`);

    if (!input || !preview) return;

    let url = input.value.trim();

    // 📌 Convertir automáticamente si el usuario pega un enlace de Google Drive
    if (url.includes("drive.google.com")) {
        const urlConvertida = convertirUrlGoogleDrive(url);
        if (urlConvertida !== url) {
            url = urlConvertida;
            input.value = url; // Reemplazar en el input la URL usable
        }
    }

    if (!url) {
        preview.innerHTML = `<span>Sin imagen</span>`;
        return;
    }

    preview.innerHTML = `
        <img
            src="${url}"
            alt="Vista previa"
            class="imagen-preview"
            onerror="this.parentElement.innerHTML='<span style=\'color:#ef4444;\'>❌ Imagen no válida</span>';">
    `;
}

/**
 * Dispara la actualización de todos los previews de un producto
 */
function refrescarTodosLosPreviews() {
    ['admin-imagen-principal', 'admin-imagen-2', 'admin-imagen-3', 'admin-imagen-4'].forEach(id => {
        actualizarPreviewImagenAdmin(id);
    });
}

/* ============================================================
   GESTIÓN DE CATEGORÍAS Y SUBCATEGORÍAS
============================================================ */

/**
 * Cargar y renderizar Categorías
 */
async function cargarCategoriasAdmin(datosPrecargados) {
    const contenedor = document.getElementById("categorias-admin-body");
    const totalElemento = document.getElementById("total-categorias");

    if (!contenedor) return;

    try {
        if (datosPrecargados) {
            listaCategoriasAdmin = datosPrecargados;
        } else {
            const respuesta = await api.getCategorias();
            listaCategoriasAdmin = respuesta.items || [];
        }

        if (totalElemento) {
            totalElemento.textContent = listaCategoriasAdmin.length;
        }

        if (listaCategoriasAdmin.length === 0) {
            contenedor.innerHTML = `<tr><td colspan="5" class="tabla-vacia">No hay categorías registradas.</td></tr>`;
            return;
        }

        contenedor.innerHTML = listaCategoriasAdmin.map(cat => {
            const idCat = cat.id || cat.ID || cat.iD || '-';

            return `
                <tr>
                    <td><strong>${escaparHTML(idCat)}</strong></td>
                    <td>${escaparHTML(cat.nombre || '-')}</td>
                    <td>${escaparHTML(cat.orden || '1')}</td>
                    <td>
                        <span class="estado-producto ${cat.estado === 'Activo' ? 'activo' : 'inactivo'}">
                            ${escaparHTML(cat.estado || 'Activo')}
                        </span>
                    </td>
                    <td>
                        <!-- ✅ Cambiamos clase a btn-editar-categoria para evitar conflictos con productos -->
                        <button type="button" class="btn-editar-categoria" onclick="editarCategoriaAdmin('${idCat}')">
                            Editar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        actualizarSelectCategoriasEnSubcategoria();

    } catch (error) {
        console.error("Error cargando categorías:", error);
        contenedor.innerHTML = `<tr><td colspan="5" class="tabla-vacia">Error al cargar categorías.</td></tr>`;
    }
}

/**
 * Cargar y renderizar Subcategorías
 */
async function cargarSubcategoriasAdmin(datosPrecargados) {
    const contenedor = document.getElementById("subcategorias-admin-body");

    if (!contenedor) return;

    try {
        let listaFinal;
        if (datosPrecargados) {
            listaFinal = datosPrecargados;
        } else {
            const respuesta = await api.getSubcategorias();
            listaFinal = respuesta.items || [];
        }
        listaSubcategoriasAdmin = listaFinal;

        if (listaSubcategoriasAdmin.length === 0) {
            contenedor.innerHTML = `<tr><td colspan="6" class="tabla-vacia">No hay subcategorías registradas.</td></tr>`;
            return;
        }

        contenedor.innerHTML = listaSubcategoriasAdmin.map(sub => {
            const idSub = sub.id || sub.ID || sub.iD || '-';
            const catPadreID = sub.categoriaID || sub.categoriaId || sub.CategoriaID || sub.categoriaid || '';

            const catPadre = listaCategoriasAdmin.find(c => {
                const idC = c.id || c.ID || c.iD;
                return String(idC) === String(catPadreID);
            });

            const nombreCatPadre = catPadre ? catPadre.nombre : (catPadreID || '-');

            return `
                <tr>
                    <td><strong>${escaparHTML(idSub)}</strong></td>
                    <td>${escaparHTML(sub.nombre || '-')}</td>
                    <td>${escaparHTML(nombreCatPadre)}</td>
                    <td>${escaparHTML(sub.orden || '1')}</td>
                    <td>
                        <span class="estado-producto ${sub.estado === 'Activo' ? 'activo' : 'inactivo'}">
                            ${escaparHTML(sub.estado || 'Activo')}
                        </span>
                    </td>
                    <td>
                        <!-- ✅ Cambiamos la clase a btn-editar-subcategoria para evitar el conflicto con productos -->
                        <button type="button" class="btn-editar-subcategoria" onclick="editarSubcategoriaAdmin('${idSub}')">
                            Editar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error("Error cargando subcategorías:", error);
        contenedor.innerHTML = `<tr><td colspan="6" class="tabla-vacia">Error al cargar subcategorías.</td></tr>`;
    }
}

/**
 * Eventos y Listeners
 */
function configurarEventosCategorias() {
    // Categorías
    document.getElementById("btn-nueva-categoria")?.addEventListener("click", () => abrirModalCategoria());
    document.getElementById("btn-cerrar-categoria-admin")?.addEventListener("click", cerrarModalCategoria);
    document.getElementById("btn-cancelar-categoria")?.addEventListener("click", cerrarModalCategoria);
    document.getElementById("form-categoria-admin")?.addEventListener("submit", guardarCategoriaAdmin);

    // Subcategorías
    document.getElementById("btn-nueva-subcategoria")?.addEventListener("click", () => abrirModalSubcategoria());
    document.getElementById("btn-cerrar-subcategoria-admin")?.addEventListener("click", cerrarModalSubcategoria);
    document.getElementById("btn-cancelar-subcategoria")?.addEventListener("click", cerrarModalSubcategoria);
    document.getElementById("form-subcategoria-admin")?.addEventListener("submit", guardarSubcategoriaAdmin);
}

/**
 * Control Modal Categoría
 */
function abrirModalCategoria(categoria = null) {
    const modal = document.getElementById("modal-categoria-admin");
    const titulo = document.getElementById("titulo-modal-categoria");
    const inputID = document.getElementById("admin-cat-id");

    if (!modal) return;

    if (categoria) {
        const idCat = categoria.id || categoria.ID || categoria.iD || "";
        modoEdicionCategoria = true;
        titulo.textContent = "Editar Categoría";
        inputID.value = idCat;
        inputID.disabled = true;
        document.getElementById("admin-cat-nombre").value = categoria.nombre || "";
        document.getElementById("admin-cat-orden").value = categoria.orden || 1;
        document.getElementById("admin-cat-estado").value = categoria.estado || "Activo";
    } else {
        modoEdicionCategoria = false;
        titulo.textContent = "Nueva Categoría";
        document.getElementById("form-categoria-admin").reset();
        inputID.disabled = false;
    }

    modal.classList.add("activo");
}

function cerrarModalCategoria() {
    const modal = document.getElementById("modal-categoria-admin");
    if (modal) {
        modal.classList.remove("activo");
    }
}

/**
 * Control Modal Subcategoría
 */
function abrirModalSubcategoria(subcategoria = null) {
    const modal = document.getElementById("modal-subcategoria-admin");
    const titulo = document.getElementById("titulo-modal-subcategoria");
    const inputID = document.getElementById("admin-subcat-id");

    if (!modal) return;

    actualizarSelectCategoriasEnSubcategoria();

    if (subcategoria) {
        const idSub = subcategoria.id || subcategoria.ID || subcategoria.iD || "";
        const catPadreID = subcategoria.categoriaID || subcategoria.categoriaId || subcategoria.CategoriaID || "";

        modoEdicionSubcategoria = true;
        titulo.textContent = "Editar Subcategoría";
        inputID.value = idSub;
        inputID.disabled = true;
        document.getElementById("admin-subcat-nombre").value = subcategoria.nombre || "";
        document.getElementById("admin-subcat-categoria").value = catPadreID;
        document.getElementById("admin-subcat-orden").value = subcategoria.orden || 1;
        document.getElementById("admin-subcat-estado").value = subcategoria.estado || "Activo";
    } else {
        modoEdicionSubcategoria = false;
        titulo.textContent = "Nueva Subcategoría";
        document.getElementById("form-subcategoria-admin").reset();
        inputID.disabled = false;
    }

    modal.classList.add("activo");
}

function cerrarModalSubcategoria() {
    document.getElementById("modal-subcategoria-admin")?.classList.remove("activo");
}

/**
 * Guardar Categoría
 */
async function guardarCategoriaAdmin(e) {
    e.preventDefault();

    const datos = {
        id: document.getElementById("admin-cat-id").value.trim(),
        nombre: document.getElementById("admin-cat-nombre").value.trim(),
        orden: Number(document.getElementById("admin-cat-orden").value || 1),
        estado: document.getElementById("admin-cat-estado").value
    };

    let res;
    if (modoEdicionCategoria) {
        res = await api.actualizarCategoria(datos);
    } else {
        res = await api.crearCategoria(datos);
    }

    if (res && (res.ok || !res.error)) {
        alert(res.mensaje || "Categoría guardada con éxito.");
        cerrarModalCategoria();
        await cargarCategoriasAdmin();
    } else {
        alert(res.error || "Ocurrió un error al guardar la categoría.");
    }
}

/**
 * Guardar Subcategoría
 */
async function guardarSubcategoriaAdmin(e) {
    e.preventDefault();

    const datos = {
        id: document.getElementById("admin-subcat-id").value.trim(),
        nombre: document.getElementById("admin-subcat-nombre").value.trim(),
        categoriaID: document.getElementById("admin-subcat-categoria").value,
        orden: Number(document.getElementById("admin-subcat-orden").value || 1),
        estado: document.getElementById("admin-subcat-estado").value
    };

    let res;
    if (modoEdicionSubcategoria) {
        res = await api.actualizarSubcategoria(datos);
    } else {
        res = await api.crearSubcategoria(datos);
    }

    if (res && (res.ok || !res.error)) {
        alert(res.mensaje || "Subcategoría guardada con éxito.");
        cerrarModalSubcategoria();
        await cargarSubcategoriasAdmin();
    } else {
        alert(res.error || "Ocurrió un error al guardar la subcategoría.");
    }
}

/**
 * Helpers para los botones 'Editar' en la tabla
 */
function editarCategoriaAdmin(id) {
    const cat = listaCategoriasAdmin.find(c => {
        const idC = c.id || c.ID || c.iD;
        return String(idC) === String(id);
    });
    if (cat) abrirModalCategoria(cat);
}

function editarSubcategoriaAdmin(id) {
    const sub = listaSubcategoriasAdmin.find(s => {
        const idS = s.id || s.ID || s.iD;
        return String(idS) === String(id);
    });
    if (sub) abrirModalSubcategoria(sub);
}

function actualizarSelectCategoriasEnSubcategoria() {
    const select = document.getElementById("admin-subcat-categoria");
    if (!select) return;

    select.innerHTML = `<option value="">Selecciona una categoría...</option>` +
        listaCategoriasAdmin.map(c => {
            const idC = c.id || c.ID || c.iD;
            return `<option value="${idC}">${c.nombre}</option>`;
        }).join('');
}

/* =========================================================
   BANNERS - ADMINISTRACIÓN
========================================================= */

async function cargarBannersAdmin() {
    const contenedor = document.getElementById("banners-admin-body");

    try {
        const respuesta = await api.getBanners();
        listaBannersAdmin = respuesta.items || [];

        if (listaBannersAdmin.length === 0) {
            contenedor.innerHTML = `<tr><td colspan="6" class="tabla-vacia">No hay banners cargados.</td></tr>`;
            return;
        }

        contenedor.innerHTML = listaBannersAdmin.map(ban => {
            const idBan = ban.id || ban.ID || ban.iD || "";
            return `
                <tr>
                    <td>${escaparHTML(idBan)}</td>
                    <td>${escaparHTML(ban.titulo || "-")}</td>
                    <td>${escaparHTML(ban.enlace || "-")}</td>
                    <td>${escaparHTML(ban.orden || "-")}</td>
                    <td>${escaparHTML(ban.estado || "-")}</td>
                    <td>
                        <div class="acciones-tabla">
                        <button type="button"
                                class="btn-editar-banner"
                                onclick="editarBannerAdmin('${idBan}')">
                                Editar
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Error cargando banners:", error);
        contenedor.innerHTML = `<tr><td colspan="6" class="tabla-vacia">Error al cargar banners.</td></tr>`;
    }
}

function configurarEventosBanners() {
    document.getElementById("btn-nuevo-banner")?.addEventListener("click", () => abrirModalBanner());
    document.getElementById("btn-cerrar-banner-admin")?.addEventListener("click", cerrarModalBanner);
    document.getElementById("btn-cancelar-banner")?.addEventListener("click", cerrarModalBanner);
    document.getElementById("form-banner-admin")?.addEventListener("submit", guardarBannerAdmin);
}

function abrirModalBanner(banner = null) {
    const modal = document.getElementById("modal-banner-admin");
    const titulo = document.getElementById("titulo-modal-banner");

    if (banner) {
        const idBan = banner.id || banner.ID || banner.iD || "";
        modoEdicionBanner = true;
        titulo.textContent = "Editar Banner";

        document.getElementById("admin-ban-id").value = idBan;
        document.getElementById("admin-ban-id").disabled = true;
        document.getElementById("admin-ban-titulo").value = banner.titulo || "";
        document.getElementById("admin-ban-imagen").value = banner.imagenURL || "";
        document.getElementById("admin-ban-enlace").value = banner.enlace || "";
        document.getElementById("admin-ban-orden").value = banner.orden || 1;
        document.getElementById("admin-ban-estado").value = banner.estado || "Activo";
    } else {
        modoEdicionBanner = false;
        titulo.textContent = "Nuevo Banner";
        document.getElementById("form-banner-admin").reset();
        document.getElementById("admin-ban-id").disabled = false;
    }

    modal.classList.add("activo");
}

function cerrarModalBanner() {
    document.getElementById("modal-banner-admin").classList.remove("activo");
}

function editarBannerAdmin(id) {
    const banner = listaBannersAdmin.find(b => String(b.id || b.ID || b.iD) === String(id));
    if (banner) abrirModalBanner(banner);
}

async function guardarBannerAdmin(e) {
    e.preventDefault();

    const datosBanner = {
        id: document.getElementById("admin-ban-id").value.trim(),
        titulo: document.getElementById("admin-ban-titulo").value.trim(),
        imagenURL: document.getElementById("admin-ban-imagen").value.trim(),
        enlace: document.getElementById("admin-ban-enlace").value.trim(),
        orden: document.getElementById("admin-ban-orden").value,
        estado: document.getElementById("admin-ban-estado").value
    };

    const resultado = modoEdicionBanner
        ? await api.actualizarBanner(datosBanner)
        : await api.crearBanner(datosBanner);

    if (resultado.error) {
        alert(resultado.error);
        return;
    }

    cerrarModalBanner();
    await cargarBannersAdmin();
}