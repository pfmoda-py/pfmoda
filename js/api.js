/**
 * api.js - Capa de comunicación con Google Apps Script (Backend)
 */

const API_URL = "https://script.google.com/macros/s/AKfycbxJdd8w31jtDiwp3dV3WVFwL5izh6wkLMxUI2zp_afxUQuDjB_13zoNdNKTtbeMhJ-6Qw/exec"; // <-- Pega tu URL aquí

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
    getPedidos: () => apiRequest("pedidos"),
    /* ---------- PEDIDOS ---------- */
    getDetallePedido: (numeroPedido) =>
    apiRequest(
        `detallePedido&numeroPedido=${encodeURIComponent(numeroPedido)}`
    ),

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

                        accion:
                            "crearProductoAdmin",

                        producto:
                            producto

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
                            producto

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
                    categoria: datos
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
                    categoria: datos
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
                    banner: datos
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
                    banner: datos
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
                    subcategoria: datos
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
                    subcategoria: datos
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
                            datosEstado.estado

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

    }
};
    
