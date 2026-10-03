/**
 * api.js - Capa de comunicación con Google Apps Script (Backend)
 */

const API_URL = "https://script.google.com/macros/s/AKfycbxJdd8w31jtDiwp3dV3WVFwL5izh6wkLMxUI2zp_afxUQuDjB_13zoNdNKTtbeMhJ-6Qw/exec"; // <-- Pega tu URL aquí

const TOKEN_KEY = "pf_moda_admin_token";

function getAdminToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
}

function setAdminToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
}

function limpiarAdminToken() {
    sessionStorage.removeItem(TOKEN_KEY);
}

/* =========================================================
   PETICIONES GET
========================================================= */
async function apiRequest(action) {
    try {
        const url =
            `${API_URL}?action=${action}`;
        const response =
            await fetch(url);
        if (!response.ok) {
            throw new Error(
                `Error HTTP: ${response.status}`
            );
        }
        const data =
            await response.json();
        return data;
    } catch (error) {
        console.error(
            "Error al conectar con la API:",
            error
        );
        return {
            error: error.message
        };
    }
}

/* =========================================================
   API
========================================================= */
const api = {

    /* ---------- INICIO TIENDA ---------- */
    getInicio: () =>
    apiRequest("inicio"),

    /* ---------- PRODUCTOS ---------- */
    getProductos: () =>
    apiRequest("productos"),

    /* ---------- CATEGORÍAS ---------- */
    getCategorias: () =>
    apiRequest("categorias"),

    /* ---------- SUBCATEGORÍAS ---------- */
    getSubcategorias: () =>
    apiRequest("subcategorias"),

    /* ---------- BANNERS ---------- */
    getBanners: () =>
    apiRequest("banners"),

    /* ---------- PROMOCIONES ---------- */
    getPromociones: () =>
    apiRequest("promociones"),

    /* ---------- CONFIGURACIÓN ---------- */
    getConfiguracion: () =>
    apiRequest("configuracion"),

    guardarConfiguracion: async function(configuracion) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "actualizarConfiguracion",
                    configuracion: configuracion,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error al guardar configuración:", error);
            return { error: "No se pudo guardar la configuración." };
        }
    },

    subirImagenConfiguracion: async function(base64Data, nombreArchivo, mimeType) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "subirImagenConfiguracion",
                    base64Data: base64Data,
                    nombreArchivo: nombreArchivo,
                    mimeType: mimeType,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error al subir imagen:", error);
            return { error: "No se pudo subir la imagen." };
        }
    },

    /* ---------- PEDIDOS ---------- */
    getPedidos: async function() {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "pedidos",
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error al obtener pedidos:", error);
            return { error: "No se pudieron cargar los pedidos." };
        }
    },
    
    /* ---------- DETALLES PEDIDO ---------- */
    getDetallePedido: async function(numeroPedido) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "detallePedido",
                    numeroPedido: numeroPedido,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error al obtener detalle del pedido:", error);
            return { error: "No se pudo cargar el detalle del pedido." };
        }
    },

    /* =====================================================
       MÓDULO PRODUCTOS ADMIN (AGREGADO)
    ===================================================== */
    getProductosAdmin: () =>
    apiRequest("productos"),

    /**
     * Crear producto
     */
    crearProductoAdmin: async function(producto) {
        try {
            const respuesta =
                await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify({
                        accion: "crearProductoAdmin",
                        producto: producto,
                        token: getAdminToken()
                    })
                });
            return await respuesta.json();
        } catch (error) {
            console.error(
                "Error al crear producto:",
                error
            );
            return {
                error:
                    "No se pudo crear el producto."
            };
        }
    },

    /**
     * Actualizar producto
     */
    actualizarProductoAdmin: async function(producto) {
        try {
            const respuesta =
                await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify({
                        accion:
                            "actualizarProductoAdmin",
                        producto:
                            producto,
                        token: getAdminToken()
                    })
                });
            return await respuesta.json();
        } catch (error) {
            console.error(
                "Error al actualizar producto:",
                error
            );
            return {
                error:
                    "No se pudo actualizar el producto."
            };
        }
    },

    /* =====================================================
       MÓDULO CATEGORÍAS ADMIN (NUEVO)
    ===================================================== */
    crearCategoria: async function(datos) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "crearCategoria",
                    categoria: datos,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error creando categoría:", error);
            return { error: "No se pudo crear la categoría." };
        }
    },

    actualizarCategoria: async function(datos) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "actualizarCategoria",
                    categoria: datos,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error actualizando categoría:", error);
            return { error: "No se pudo actualizar la categoría." };
        }
    },

        /* =====================================================
       MÓDULO BANNERS ADMIN (NUEVO)
    ===================================================== */
    crearBanner: async function(datos) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "crearBanner",
                    banner: datos,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error creando banner:", error);
            return { error: "No se pudo crear el banner." };
        }
    },

    actualizarBanner: async function(datos) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "actualizarBanner",
                    banner: datos,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error actualizando banner:", error);
            return { error: "No se pudo actualizar el banner." };
        }
    },

    /* =====================================================
       MÓDULO SUBCATEGORÍAS ADMIN (NUEVO)
    ===================================================== */
    crearSubcategoria: async function(datos) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "crearSubcategoria",
                    subcategoria: datos,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error creando subcategoría:", error);
            return { error: "No se pudo crear la subcategoría." };
        }
    },

    actualizarSubcategoria: async function(datos) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "actualizarSubcategoria",
                    subcategoria: datos,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error actualizando subcategoría:", error);
            return { error: "No se pudo actualizar la subcategoría." };
        }
    },

    /* =====================================================
       REGISTRAR PEDIDO
    ===================================================== */

    registrarPedido: async function(datosPedido) {
        try {
            const response =
                await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify(datosPedido)
                });
            const resultado =
                await response.json();
            return resultado;
        } catch (error) {
            console.error(
                "Error al registrar pedido:",
                error
            );
            return {
                error:
                    "No se pudo registrar el pedido."
            };
        }
    },

    /* =====================================================
       ACTUALIZAR ESTADO DEL PEDIDO
    ===================================================== */

    actualizarEstadoPedido: async function(datosEstado) {
        try {
            const response =
                await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify({
                        accion: "actualizarEstado",
                        numeroPedido:
                            datosEstado.numeroPedido,
                        estado:
                            datosEstado.estado,
                        token: getAdminToken()
                    })
                });
            const resultado =
                await response.json();
            return resultado;
        } catch (error) {
            console.error(
                "Error al actualizar estado:",
                error
            );
            return {
                error:
                    "No se pudo actualizar el estado del pedido."
            };
        }
    },
    
    /* =====================================================
       LOGIN ADMIN
    ===================================================== */
    loginAdmin: async function(usuario, password) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "loginAdmin",
                    usuario: usuario,
                    password: password
                })
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error en login:", error);
            return { ok: false, error: "No se pudo conectar con el servidor." };
        }
    },

    /* =====================================================
       verificarS esion Admin
    ===================================================== */

    verificarSesionAdmin: async function(token) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "verificarSesionAdmin",
                    token: token
                })
            });
            return await respuesta.json();
        } catch (error) {
            return { ok: false };
        }
    },

    /* =====================================================
       cerrar Sesion Admin
    ===================================================== */

    cerrarSesionAdmin: async function(token) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "cerrarSesionAdmin",
                    token: token
                })
            });
            return await respuesta.json();
        } catch (error) {
            return { ok: false };
        }
    },

    solicitarResetPassword: async function(usuarioOEmail) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "solicitarResetPassword",
                    usuarioOEmail: usuarioOEmail
                })
            });
            return await respuesta.json();
        } catch (error) {
            return { ok: false, error: "No se pudo conectar con el servidor." };
        }
    },

    validarTokenReset: async function(token) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ accion: "validarTokenReset", token: token })
            });
            return await respuesta.json();
        } catch (error) {
            return { ok: false, error: "No se pudo conectar con el servidor." };
        }
    },

    restablecerPassword: async function(token, nuevaPassword) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "restablecerPassword",
                    token: token,
                    nuevaPassword: nuevaPassword
                })
            });
            return await respuesta.json();
        } catch (error) {
            return { ok: false, error: "No se pudo conectar con el servidor." };
        }
    },

    listarUsuariosAdmin: async function() {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ accion: "listarUsuariosAdmin", token: getAdminToken() })
            });
            return await respuesta.json();
        } catch (error) {
            return { error: "No se pudo conectar con el servidor." };
        }
    },

    crearUsuarioAdmin: async function(nuevoUsuario) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "crearUsuarioAdmin",
                    nuevoUsuario: nuevoUsuario,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            return { error: "No se pudo conectar con el servidor." };
        }
    },

    cambiarEstadoUsuarioAdmin: async function(usuarioObjetivo, nuevoEstado) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "cambiarEstadoUsuarioAdmin",
                    usuarioObjetivo: usuarioObjetivo,
                    nuevoEstado: nuevoEstado,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            return { error: "No se pudo conectar con el servidor." };
        }
    },

    cambiarEstadoUsuarioAdmin: async function(usuarioObjetivo, nuevoEstado) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    accion: "cambiarEstadoUsuarioAdmin",
                    usuarioObjetivo: usuarioObjetivo,
                    nuevoEstado: nuevoEstado,
                    token: getAdminToken()
                })
            });
            return await respuesta.json();
        } catch (error) {
            return { error: "No se pudo conectar con el servidor." };
        }
    },

    /**
     * Método genérico: manda cualquier payload directo al backend.
     * Útil para probar acciones nuevas desde la consola sin tener que
     * escribir una función dedicada para cada una todavía.
     * El payload ya debe incluir "accion" y, si hace falta, "token".
     */
    request: async function(payload) {
        try {
            const respuesta = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            return await respuesta.json();
        } catch (error) {
            console.error("Error en api.request:", error);
            return { error: "No se pudo conectar con el servidor." };
        }
    }

};
    
