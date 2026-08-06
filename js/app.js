/**
 * app.js - Lógica principal del Frontend
 */

document.addEventListener("DOMContentLoaded", async () => {
    await cargarProductosCatalogo();
});

async function cargarProductosCatalogo() {
    const contenedor = document.getElementById("productos-contenedor");
    
    // Llamada a la API mediante api.js
    const respuesta = await api.getProductos();

    if (respuesta.error) {
        contenedor.innerHTML = `<p style="text-align: center; color: red; grid-column: 1 / -1;">Error al cargar los productos: ${respuesta.error}</p>`;
        return;
    }

    const productos = respuesta.items;

    if (!productos || productos.length === 0) {
        contenedor.innerHTML = `<p style="text-align: center; grid-column: 1 / -1;">No hay productos disponibles en este momento.</p>`;
        return;
    }

    // Limpiar contenedor y renderizar productos
    contenedor.innerHTML = "";

    productos.forEach(prod => {
        // Formatear precio en Guaraníes (o general)
        const precioFormateado = Number(prod.precio).toLocaleString('es-PY');

        const card = document.createElement("div");
        card.className = "producto-card";
        
        card.innerHTML = `
            <img src="${prod.imagen}" alt="${prod.nombre}" class="producto-imagen" onerror="this.src='https://via.placeholder.com/600?text=PF+Moda'">
            <div class="producto-info">
                <span class="producto-categoria">${prod.categoria}</span>
                <h3 class="producto-nombre">${prod.nombre}</h3>
                <span class="producto-precio">₲ ${precioFormateado}</span>
            </div>
        `;

        contenedor.appendChild(card);
    });
}