/**
 * api.js - Capa de comunicación con Google Apps Script (Backend)
 */

const API_URL = "https://script.google.com/macros/s/AKfycbxJdd8w31jtDiwp3dV3WVFwL5izh6wkLMxUI2zp_afxUQuDjB_13zoNdNKTtbeMhJ-6Qw/exec"; // <-- Pega tu URL aquí

async function apiRequest(action) {
    try {
        const response = await `${API_URL}?action=${action}`;
        const res = await fetch(response);
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Error al conectar con la API:", error);
        return { error: error.message };
    }
}

// Funciones específicas para consumir cada endpoint
const api = {
    getProductos: () => apiRequest("productos"),
    getCategorias: () => apiRequest("categorias"),
    getSubcategorias: () => apiRequest("subcategorias"),
    getBanners: () => apiRequest("banners"),
    getPromociones: () => apiRequest("promociones"),
    getConfiguracion: () => apiRequest("configuracion")
};