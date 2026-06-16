// ESTADO GLOBAL
let productos = [];
let carrito = [];
let clienteSeleccionado = null;
let metodoPago = 'efectivo';

// INICIAR APP
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    restaurarCarrito();
    restaurarCliente();
    restaurarTema();
    renderizarProductos();
    actualizarNombreCliente();
});

// CARGAR PRODUCTOS DESDE config.js
function cargarProductos() {
    if (typeof PRODUCTOS_CONFIG !== 'undefined' && PRODUCTOS_CONFIG.length > 0) {
        productos = PRODUCTOS_CONFIG;
        console.log(`✓ Cargados ${productos.length} productos desde config.js`);
    } else {
        console.log('⚠️ No hay productos configurados');
        productos = [];
    }
}

// RENDERIZAR CUADRÍCULA DE PRODUCTOS
function renderizarProductos() {
    const grid = document.getElementById('productos-grid');
    grid.innerHTML = '';

    productos.forEach((producto, index) => {
        const itemCarrito = carrito.find(item => item.nombre === producto.nombre);
        const cantidad = itemCarrito ? itemCarrito.cantidad : 0;
        const estaSeleccionado = cantidad > 0;

        const btn = document.createElement('button');
        btn.className = `producto-btn ${estaSeleccionado ? 'seleccionado' : ''}`;

        const emoji = producto.emoji || '🥬';
        const nombreCorto = producto.nombre.length > 25 ? producto.nombre.substring(0, 25) + '...' : producto.nombre;
        const subtotal = producto.precio * cantidad;

        let subtotalHTML = '';
        if (estaSeleccionado) {
            subtotalHTML = `<div class="producto-subtotal">$${subtotal.toLocaleString()}</div>`;
        } else {
            subtotalHTML = `<div class="producto-subtotal" style="visibility: hidden;">$0</div>`;
        }

        let cantidadHTML = '';
        if (estaSeleccionado) {
            cantidadHTML = `<div class="producto-cantidad-badge">${cantidad}</div>`;
        }

        btn.innerHTML = `
            <div class="producto-emoji">${emoji}</div>
            <div class="producto-nombre-short">${nombreCorto}</div>
            <div class="producto-precio">$${producto.precio.toLocaleString()}</div>
            ${subtotalHTML}
            ${cantidadHTML}
        `;

        // Crear botón MENOS
        const btnMenos = document.createElement('button');
        btnMenos.className = 'btn-menos';
        btnMenos.innerHTML = '−';
        btnMenos.title = 'Quitar uno';
        if (!estaSeleccionado) btnMenos.disabled = true;
        btnMenos.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            restarUno(null, producto.nombre);
        };
        btn.appendChild(btnMenos);

        // Crear botón MAS
        const btnMas = document.createElement('button');
        btnMas.className = 'btn-mas';
        btnMas.innerHTML = '+';
        btnMas.title = 'Agregar uno';
        btnMas.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            sumarUno(null, producto.nombre);
        };
        btn.appendChild(btnMas);

        // Onclick principal del producto
        btn.onclick = (e) => {
            if (!e.target.classList.contains('btn-menos') && !e.target.classList.contains('btn-mas')) {
                abrirSelectorCantidad(producto, index);
            }
        };

        grid.appendChild(btn);
    });
}

// RESTAR UNO
function restarUno(event, nombre) {
    const index = carrito.findIndex(item => item.nombre === nombre);
    if (index === -1) return;

    const nuevaCantidad = carrito[index].cantidad - 1;

    if (nuevaCantidad <= 0) {
        carrito.splice(index, 1);
    } else {
        carrito[index].cantidad = nuevaCantidad;
    }

    guardarCarrito();
    actualizarBadgeCarrito();
    renderizarProductos();
}

// SUMAR UNO
function sumarUno(event, nombre) {
    const index = carrito.findIndex(item => item.nombre === nombre);
    if (index === -1) {
        // Si no existe, crear nuevo item
        const producto = productos.find(p => p.nombre === nombre);
        if (producto) {
            carrito.push({
                nombre: producto.nombre,
                precio: producto.precio,
                unidad: producto.unidad,
                peso: producto.peso,
                cantidad: 1
            });
        }
    } else {
        carrito[index].cantidad += 1;
    }

    guardarCarrito();
    actualizarBadgeCarrito();
    renderizarProductos();
}

// ABRIR MODAL PARA SELECCIONAR CANTIDAD
function abrirSelectorCantidad(producto, index) {
    // Buscar si ya existe en carrito
    const itemExistente = carrito.find(item => item.nombre === producto.nombre);
    const cantidadActual = itemExistente ? itemExistente.cantidad : 0;

    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${producto.nombre}</h2>
                <button class="modal-cerrar" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body">
                <p class="modal-info">${producto.peso} - $${producto.precio.toLocaleString()}</p>

                <div class="selector-cantidad">
                    <label>Cantidad (${producto.unidad}):</label>
                    <div class="cantidad-control">
                        <button onclick="restarCantidad(this.parentElement)">−</button>
                        <input type="number" class="cantidad-input" value="${cantidadActual}" min="0" step="0.5">
                        <button onclick="sumarCantidad(this.parentElement)">+</button>
                    </div>
                </div>

                <div class="modal-total">
                    <span>Total:</span>
                    <span class="modal-total-precio">$${(producto.precio * cantidadActual).toLocaleString()}</span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-modal-cancelar" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button class="btn-modal-agregar" onclick="confirmarCantidad('${producto.nombre}', ${producto.precio}, '${producto.unidad}', '${producto.peso}', this.closest('.modal-overlay'))">Agregar al Carrito</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Actualizar total en tiempo real
    const input = modal.querySelector('.cantidad-input');
    input.addEventListener('change', () => {
        const cantidad = parseFloat(input.value) || 0;
        const total = producto.precio * cantidad;
        modal.querySelector('.modal-total-precio').textContent = `$${total.toLocaleString()}`;
    });

    input.focus();
}

// CONTROLES DEL SELECTOR
function sumarCantidad(container) {
    const input = container.querySelector('.cantidad-input');
    input.value = (parseFloat(input.value) || 0) + 0.5;
    input.dispatchEvent(new Event('change'));
}

function restarCantidad(container) {
    const input = container.querySelector('.cantidad-input');
    const valor = parseFloat(input.value) || 0;
    if (valor > 0) {
        input.value = Math.max(0, valor - 0.5);
        input.dispatchEvent(new Event('change'));
    }
}

// CONFIRMAR CANTIDAD Y AGREGAR
function confirmarCantidad(nombre, precio, unidad, peso, modalElement) {
    const cantidad = parseFloat(modalElement.querySelector('.cantidad-input').value) || 0;

    if (cantidad <= 0) {
        alert('La cantidad debe ser mayor a 0');
        return;
    }

    agregarAlCarrito({ nombre, precio, unidad, peso }, cantidad);
    renderizarProductos();
    modalElement.remove();
}

// AGREGAR AL CARRITO
function agregarAlCarrito(producto, cantidad) {
    const itemExistente = carrito.find(item => item.nombre === producto.nombre);

    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        carrito.push({
            nombre: producto.nombre,
            precio: producto.precio,
            unidad: producto.unidad,
            peso: producto.peso,
            cantidad: cantidad
        });
    }

    guardarCarrito();
    actualizarBadgeCarrito();
    console.log('🛒 Carrito actualizado:', carrito);
}

// ACTUALIZAR BADGE DEL CARRITO
function actualizarBadgeCarrito() {
    const badge = document.getElementById('total-items');
    badge.textContent = carrito.length;
}

// GUARDAR CARRITO EN LOCALSTORAGE
function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// RESTAURAR CARRITO DESDE LOCALSTORAGE
function restaurarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
    }
}

// IR A RESUMEN
function irAResumen() {
    if (carrito.length === 0) {
        alert('❌ El carrito está vacío');
        return;
    }

    renderizarResumen();
    mostrarPantalla('pantalla-resumen');
}

// RENDERIZAR RESUMEN
function renderizarResumen() {
    // Mostrar cliente
    const clienteDiv = document.getElementById('resumen-cliente');
    if (clienteSeleccionado) {
        clienteDiv.innerHTML = `
            <div style="background: var(--gris-claro); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid var(--verde);">
                <strong>👤 Cliente:</strong> ${clienteSeleccionado.nombre}
            </div>
        `;
    } else {
        clienteDiv.innerHTML = '';
    }

    const contenedor = document.getElementById('resumen-items');
    contenedor.innerHTML = '';

    let subtotal = 0;

    carrito.forEach((item, index) => {
        const total = item.precio * item.cantidad;
        subtotal += total;

        const div = document.createElement('div');
        div.className = 'resumen-item';

        // Info del producto
        const info = document.createElement('div');
        info.className = 'resumen-item-info';
        info.innerHTML = `
            <div class="resumen-item-nombre">${item.nombre}</div>
            <div class="resumen-item-detalles">
                ${item.cantidad} ${item.unidad} × $${item.precio.toLocaleString()}
            </div>
        `;
        div.appendChild(info);

        // Precio total
        const controles = document.createElement('div');
        controles.className = 'resumen-item-controles';

        const precio = document.createElement('div');
        precio.className = 'resumen-item-precio';
        precio.textContent = `$${total.toLocaleString()}`;
        controles.appendChild(precio);

        div.appendChild(controles);

        // Botón menos
        const btnMenos = document.createElement('button');
        btnMenos.className = 'resumen-btn-menos';
        btnMenos.textContent = '−';
        btnMenos.type = 'button';
        btnMenos.onclick = (e) => {
            e.stopPropagation();
            const idx = carrito.indexOf(item);
            if (idx !== -1) {
                carrito[idx].cantidad -= 1;
                if (carrito[idx].cantidad <= 0) {
                    carrito.splice(idx, 1);
                }
                guardarCarrito();
                actualizarBadgeCarrito();
                renderizarResumen();
            }
        };
        div.appendChild(btnMenos);

        // Botón más
        const btnMas = document.createElement('button');
        btnMas.className = 'resumen-btn-mas';
        btnMas.textContent = '+';
        btnMas.type = 'button';
        btnMas.onclick = (e) => {
            e.stopPropagation();
            const idx = carrito.indexOf(item);
            if (idx !== -1) {
                carrito[idx].cantidad += 1;
                guardarCarrito();
                actualizarBadgeCarrito();
                renderizarResumen();
            }
        };
        div.appendChild(btnMas);

        // Botón eliminar
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'carrito-eliminar';
        btnEliminar.textContent = '✕';
        btnEliminar.type = 'button';
        btnEliminar.onclick = (e) => {
            e.stopPropagation();
            eliminarDelCarrito(index);
        };
        div.appendChild(btnEliminar);

        contenedor.appendChild(div);
    });

    document.getElementById('subtotal').textContent = `$${subtotal.toLocaleString()}`;

    // Si es Cuenta DNI, mostrar total completo (sin descuento - lo devuelve CuentaDNI)
    if (metodoPago === 'cuenta-dni') {
        document.getElementById('total-final').innerHTML = `
            <div style="font-size: 1.2rem; font-weight: bold;">$${subtotal.toLocaleString()}</div>
            <div style="font-size: 0.75rem; color: var(--naranja); margin-top: 0.5rem; font-style: italic;">
                CuentaDNI devolverá 40%
            </div>
        `;
    } else {
        document.getElementById('total-final').textContent = `$${subtotal.toLocaleString()}`;
    }
}

// ELIMINAR DEL CARRITO
function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    guardarCarrito();
    renderizarResumen();
    actualizarBadgeCarrito();
}

// CONFIRMAR PEDIDO (GUARDAR EN HISTORIAL)
function confirmarPedido() {
    if (carrito.length === 0) {
        alert('❌ El carrito está vacío');
        return;
    }

    // Calcular totales
    let subtotal = 0;
    const detalles = carrito.map(item => {
        const total = item.precio * item.cantidad;
        subtotal += total;
        return {
            nombre: item.nombre,
            cantidad: item.cantidad,
            unidad: item.unidad,
            precio: item.precio,
            total: total
        };
    });

    // Crear objeto del pedido
    const pedido = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-AR'),
        cliente: clienteSeleccionado ? clienteSeleccionado.nombre : 'Sin especificar',
        metodoPago: metodoPago,
        items: detalles,
        subtotal: subtotal,
        total: subtotal
    };

    // Guardar en historial
    let historial = JSON.parse(localStorage.getItem('historial') || '[]');
    historial.unshift(pedido); // Agregar al inicio
    localStorage.setItem('historial', JSON.stringify(historial));

    // Mostrar modal de comprobante
    mostrarModalConfirmacionPedido(pedido, subtotal);

    // Limpiar carrito
    limpiarCarrito();
    renderizarProductos();
}

// MOSTRAR MODAL DE CONFIRMACIÓN CON OPCIÓN DE ENVIAR COMPROBANTE
async function mostrarModalConfirmacionPedido(pedido, total) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '10000';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>✓ Pedido Guardado</h2>
            </div>
            <div class="modal-body" style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                <p style="font-size: 1.1rem; margin: 1rem 0;">
                    <strong>${pedido.cliente}</strong><br>
                    Total: <span style="color: var(--naranja); font-weight: bold; font-size: 1.3rem;">$${total.toLocaleString()}</span>
                </p>
                <p style="color: var(--texto-secundario);">¿Deseas enviar el comprobante?</p>
            </div>
            <div class="modal-footer">
                <button class="btn-modal-cancelar" onclick="this.closest('.modal-overlay').remove(); mostrarPantalla('pantalla-productos');">
                    Siguiente Venta
                </button>
                <button class="btn-modal-agregar" onclick="generarComprobantePedido('${JSON.stringify(pedido).replace(/"/g, '&quot;')}'); this.closest('.modal-overlay').remove();" style="background: #25d366;">
                    💬 Enviar Comprobante
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// GENERAR Y MOSTRAR COMPROBANTE DEL PEDIDO CONFIRMADO
async function generarComprobantePedido(pedidoJson) {
    const pedido = JSON.parse(pedidoJson.replace(/&quot;/g, '"'));

    // Mostrar loading
    alert('⏳ Generando comprobante...');

    // Generar detalles HTML para la imagen
    const detalles = pedido.items.map(item => `<tr>
        <td style="text-align: left; padding: 0.5rem;">${item.nombre}</td>
        <td style="text-align: center; padding: 0.5rem;">${item.cantidad} ${item.unidad}</td>
        <td style="text-align: right; padding: 0.5rem;">$${item.total.toLocaleString()}</td>
    </tr>`).join('');

    // Crear elemento HTML invisible con el comprobante (TIPO TICKET FISCAL)
    const comprobante = document.createElement('div');
    comprobante.style.cssText = 'position: fixed; top: 0; left: 0; width: 320px; padding: 15px; background: #ffffff; font-family: monospace; color: #000; z-index: 10000; font-size: 12px; line-height: 1.5;';
    comprobante.innerHTML = `
        <div style="text-align: center; background: #ffffff;">
            <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
                <div style="font-weight: bold; font-size: 13px;">EL HUERTO DE LUCAS</div>
                <div style="font-size: 10px; color: #000;">Los Sauces 264 - General Pinto</div>
            </div>

            <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; text-align: left; font-size: 11px;">
                <div>Fecha: ${pedido.fecha}</div>
                <div>Cliente: ${pedido.cliente}</div>
            </div>

            <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; text-align: left; font-size: 11px;">
                <div style="display: grid; grid-template-columns: 2fr 1fr 1.2fr; gap: 4px; margin-bottom: 4px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px;">
                    <span>PRODUCTO</span>
                    <span style="text-align: center;">CANT.</span>
                    <span style="text-align: right;">TOTAL</span>
                </div>
                ${pedido.items.map(item => `
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1.2fr; gap: 4px; margin-bottom: 4px;">
                        <span>${item.nombre.length > 16 ? item.nombre.substring(0, 16) : item.nombre}</span>
                        <span style="text-align: center;">${item.cantidad}</span>
                        <span style="text-align: right;">$${item.total.toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>

            <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; margin: 8px 0; text-align: right; font-weight: bold; font-size: 14px;">
                TOTAL: $${pedido.total.toLocaleString()}
            </div>

            <div style="text-align: center; font-size: 11px; margin-bottom: 8px;">
                💳 ${pedido.metodoPago === 'efectivo' ? 'EFECTIVO' : pedido.metodoPago === 'cuenta-dni' ? 'CUENTA DNI' : pedido.metodoPago === 'transferencia' ? 'TRANSFERENCIA' : 'OTRO'}
                ${pedido.metodoPago === 'cuenta-dni' ? '<br><span style="font-size: 9px; color: #666;">CuentaDNI devolverá 40%</span>' : ''}
            </div>

            <div style="border-top: 1px dashed #000; padding-top: 8px; text-align: center; font-size: 10px; color: #000;">
                Gracias por tu compra! 🌻<br><br>
                📱 +54 9 1125328861<br>
                📸 @elhuertodelucas
            </div>
        </div>
    `;

    document.body.appendChild(comprobante);

    // Convertir a imagen usando html2canvas
    try {
        const canvas = await html2canvas(comprobante, {
            backgroundColor: '#fef8f0',
            scale: 2,
            logging: false
        });

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `comprobante-${pedido.id}.jpg`;

            mostrarModalComprobante(url, link, pedido.total.toLocaleString(), pedido.fecha, pedido.cliente, pedido.metodoPago);

            document.body.removeChild(comprobante);
        }, 'image/jpeg', 0.95);
    } catch (error) {
        console.error('Error generando comprobante:', error);
        alert('❌ Error al generar el comprobante');
        document.body.removeChild(comprobante);
    }
}

// LIMPIAR CARRITO
function limpiarCarrito() {
    carrito = [];
    guardarCarrito();
    actualizarBadgeCarrito();
}

// ENVIAR POR WHATSAPP (como imagen JPG)
async function enviarPorWhatsapp() {
    if (carrito.length === 0) {
        alert('❌ El carrito está vacío');
        return;
    }

    if (!clienteSeleccionado) {
        alert('❌ Debe seleccionar un cliente primero');
        return;
    }

    // Mostrar loading
    alert('⏳ Generando comprobante...');

    // Calcular total
    let total = 0;
    const detalles = carrito.map(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        return `<tr>
            <td style="text-align: left; padding: 0.5rem;">${item.nombre}</td>
            <td style="text-align: center; padding: 0.5rem;">${item.cantidad} ${item.unidad}</td>
            <td style="text-align: right; padding: 0.5rem;">$${subtotal.toLocaleString()}</td>
        </tr>`;
    }).join('');

    // Generar fecha
    const fecha = new Date().toLocaleString('es-AR');

    // Crear elemento HTML invisible con el comprobante (formato tabla/comanda)
    const comprobante = document.createElement('div');
    comprobante.style.cssText = 'position: fixed; top: 0; left: 0; width: 420px; padding: 20px; background: white; font-family: Arial, sans-serif; color: #000; z-index: 10000;';

    const pedidoId = Date.now().toString().slice(-6);

    comprobante.innerHTML = `
        <div style="background: white; padding: 15px; font-size: 13px; line-height: 1.4;">

            <div style="text-align: center; margin-bottom: 15px;">
                <h1 style="margin: 0; font-size: 18px; font-weight: bold;">COMANDA</h1>
                <div style="font-size: 11px; color: #666;">El Huerto de Lucas</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #000;">
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; width: 30%; font-weight: bold;">FECHA</td>
                    <td style="border: 1px solid #000; padding: 6px; font-size: 12px;">${fecha.split(',')[0]}</td>
                    <td style="border: 1px solid #000; padding: 6px; width: 25%; text-align: right; font-weight: bold;">FOLIO</td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${pedidoId}</td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #000;">
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; width: 50%; font-weight: bold;">CLIENTE</td>
                    <td style="border: 1px solid #000; padding: 6px;">${clienteSeleccionado.nombre}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">MÉTODO PAGO</td>
                    <td style="border: 1px solid #000; padding: 6px;">${metodoPago === 'efectivo' ? 'Efectivo' : metodoPago === 'cuenta-dni' ? 'Cuenta DNI' : metodoPago === 'transferencia' ? 'Transferencia' : 'Otro'}</td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #000;">
                <thead>
                    <tr style="background: #90EE90;">
                        <th style="border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold; font-size: 12px;">CANTIDAD</th>
                        <th style="border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold; font-size: 12px;">CONCEPTO</th>
                        <th style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; font-size: 12px;">IMPORTE</th>
                    </tr>
                </thead>
                <tbody>
                    ${detalles.map(item => `
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.cantidad}</td>
                            <td style="border: 1px solid #000; padding: 8px;">${item.nombre.length > 30 ? item.nombre.substring(0, 30) + '...' : item.nombre}</td>
                            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">$${item.total.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                <tr>
                    <td style="border: 1px solid #000; padding: 10px; text-align: right; width: 70%; font-weight: bold;">TOTAL</td>
                    <td style="border: 1px solid #000; padding: 10px; text-align: right; background: #90EE90; font-weight: bold; font-size: 16px;">$${total.toLocaleString()}</td>
                </tr>
                ${metodoPago === 'cuenta-dni' ? `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; color: #d97706;">REINTEGRO 40%</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right; background: #FFF8DC; font-weight: bold; color: #d97706;">$${Math.min(Math.round(total * 0.40), 6000).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; background: #FFFACD;">TOTAL A RECIBIR</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right; background: #FFFACD; font-weight: bold; font-size: 16px;">$${(total + Math.min(Math.round(total * 0.40), 6000)).toLocaleString()}</td>
                    </tr>
                ` : ''}
            </table>

            <div style="margin-top: 15px; text-align: center; font-size: 10px; color: #666;">
                Los Sauces 264 - General Pinto, BA<br>
                📱 +54 9 1125328861<br>
                ¡Gracias por tu compra!
            </div>
        </div>
    `;

    document.body.appendChild(comprobante);

    // Convertir a imagen usando html2canvas
    try {
        const canvas = await html2canvas(comprobante, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false
        });

        // Convertir a blob y descargar
        canvas.toBlob((blob) => {
            // Crear URL para descargar
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `comprobante-${Date.now()}.jpg`;

            // Mostrar modal con opciones
            mostrarModalComprobante(url, link, total, fecha);

            // Limpiar
            document.body.removeChild(comprobante);
        }, 'image/jpeg', 0.95);
    } catch (error) {
        console.error('Error generando comprobante:', error);
        alert('❌ Error al generar el comprobante');
        document.body.removeChild(comprobante);
    }
}

// MOSTRAR MODAL CON COMPROBANTE Y OPCIONES
function mostrarModalComprobante(imagenUrl, linkDescarga, total, fecha, cliente, metodoPago) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>📋 Comprobante Generado</h2>
                <button class="modal-cerrar" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <img src="${imagenUrl}" style="max-width: 100%; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

                <p style="color: #6b7280; margin: 1rem 0;">El comprobante está listo para compartir</p>
            </div>
            <div class="modal-footer">
                <button class="btn-modal-cancelar" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
                <button class="btn-modal-agregar" onclick="descargarComprobante(this)" style="background: #4f46e5;">
                    ⬇️ Descargar JPG
                </button>
                <button class="btn-modal-agregar" onclick="abrirWhatsappConMensaje('${total}', '${fecha}', '${cliente}'); this.closest('.modal-overlay').remove();" style="background: #25d366;">
                    💬 Enviar por WhatsApp
                </button>
            </div>
        </div>
    `;

    // Guardar link de descarga en el botón
    modal.querySelector('.btn-modal-agregar:nth-of-type(2)').descargarLink = linkDescarga;

    document.body.appendChild(modal);
}

// DESCARGAR COMPROBANTE
function descargarComprobante(btn) {
    const link = btn.descargarLink || btn.closest('button').previousElementSibling;
    if (link && link.href) {
        link.click();
    }
}

// ABRIR WHATSAPP CON MENSAJE
function abrirWhatsappConMensaje(total, fecha, cliente) {
    // Si viene del historial, usar el cliente del parámetro
    // Si viene del carrito actual, usar clienteSeleccionado
    const clienteNombre = cliente || (clienteSeleccionado ? clienteSeleccionado.nombre : 'Sin especificar');

    // Generar mensaje
    let detallesTexto;

    // Si hay carrito actual, usar eso
    if (carrito.length > 0) {
        detallesTexto = carrito.map(item => {
            const subtotal = item.precio * item.cantidad;
            return `• ${item.nombre}: ${item.cantidad} ${item.unidad} = $${subtotal.toLocaleString()}`;
        }).join('\n');
    } else {
        // Si no hay carrito (viene del historial), mostrar mensaje genérico
        detallesTexto = '(Ver detalles en la imagen adjunta)';
    }

    let mensaje = `🌱 *El Huerto de Lucas*

👤 *Cliente:* ${clienteNombre}
📅 *Pedido del:* ${fecha}

🛒 *Productos:*
${detallesTexto}

💰 *Total: $${total}*`;

    // Si es Cuenta DNI, agregar descuento
    if (metodoPago === 'cuenta-dni') {
        const totalNum = parseInt(total.replace(/\./g, ''));
        mensaje += `

💳 *Pago: Cuenta DNI*
💰 Total a pagar: $${totalNum.toLocaleString('es-AR')}
ℹ️ CuentaDNI devolverá 40%`;
    }

    mensaje += `

Comprobante enviado en imagen 📸`;

    const mensajeEncoded = encodeURIComponent(mensaje);
    const numeroWhatsapp = '5491125328861';
    const urlWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${mensajeEncoded}`;

    window.open(urlWhatsapp, '_blank');
}

// CAMBIAR ENTRE PANTALLAS
function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(id).classList.add('activa');

    // Actualizar botones del footer
    document.querySelectorAll('.btn-footer').forEach(btn => btn.classList.remove('activo'));
    if (id === 'pantalla-productos') {
        document.querySelectorAll('.btn-footer')[0].classList.add('activo');
    } else if (id === 'pantalla-historial') {
        document.querySelectorAll('.btn-footer')[1].classList.add('activo');
    }

    // Si es historial, renderizar
    if (id === 'pantalla-historial') {
        renderizarHistorial();
    }
}

// RENDERIZAR HISTORIAL
function renderizarHistorial() {
    const contenedor = document.getElementById('historial-list');
    const historial = JSON.parse(localStorage.getItem('historial') || '[]');

    if (historial.length === 0) {
        contenedor.innerHTML = `
            <div class="historial-vacio">
                <div class="historial-vacio-icono">📭</div>
                <p>No hay pedidos registrados</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = '';

    historial.forEach((pedido, index) => {
        const div = document.createElement('div');
        div.className = 'historial-item';

        const productosHTML = pedido.items
            .map(item => `
                <div class="historial-producto-linea">
                    <span>${item.nombre}: ${item.cantidad} ${item.unidad}</span>
                    <span>$${item.total.toLocaleString()}</span>
                </div>
            `).join('');

        const clienteHTML = pedido.cliente ? `<div class="historial-cliente">👤 ${pedido.cliente}</div>` : '';

        div.innerHTML = `
            <div class="historial-fecha">
                <span>📅 ${pedido.fecha}</span>
                <span class="historial-total">$${pedido.total.toLocaleString()}</span>
            </div>
            ${clienteHTML}
            <div class="historial-productos">
                ${productosHTML}
            </div>
            <div class="historial-acciones">
                <button class="historial-btn historial-btn-repetir" onclick="repetirPedido(${index})">
                    🔄 Repetir
                </button>
                <button class="historial-btn historial-btn-whatsapp" onclick="enviarComprobantePedido(${index})">
                    💬 Enviar
                </button>
                <button class="historial-btn historial-btn-eliminar" onclick="eliminarPedido(${index})">
                    🗑️ Eliminar
                </button>
            </div>
        `;

        contenedor.appendChild(div);
    });
}

// REPETIR PEDIDO
function repetirPedido(index) {
    const historial = JSON.parse(localStorage.getItem('historial') || '[]');
    const pedido = historial[index];

    // Limpiar carrito
    carrito = [];

    // Agregar items del pedido anterior
    pedido.items.forEach(item => {
        carrito.push({
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad,
            unidad: item.unidad
        });
    });

    guardarCarrito();
    actualizarBadgeCarrito();
    mostrarPantalla('pantalla-productos');
    alert(`✓ Pedido anterior cargado al carrito`);
}

// ENVIAR COMPROBANTE DE PEDIDO DEL HISTORIAL
async function enviarComprobantePedido(index) {
    const historial = JSON.parse(localStorage.getItem('historial') || '[]');
    const pedido = historial[index];

    if (!pedido) return;

    // Mostrar loading
    alert('⏳ Generando comprobante...');

    // Generar detalles HTML para la imagen
    const detalles = pedido.items.map(item => `<tr>
        <td style="text-align: left; padding: 0.5rem;">${item.nombre}</td>
        <td style="text-align: center; padding: 0.5rem;">${item.cantidad} ${item.unidad}</td>
        <td style="text-align: right; padding: 0.5rem;">$${item.total.toLocaleString()}</td>
    </tr>`).join('');

    // Crear elemento HTML invisible con el comprobante (formato tabla/comanda)
    const comprobante = document.createElement('div');
    comprobante.style.cssText = 'position: fixed; top: 0; left: 0; width: 420px; padding: 20px; background: white; font-family: Arial, sans-serif; color: #000; z-index: 10000;';

    const pedidoId = pedido.id.toString().slice(-6);

    comprobante.innerHTML = `
        <div style="background: white; padding: 15px; font-size: 13px; line-height: 1.4;">

            <div style="text-align: center; margin-bottom: 15px;">
                <h1 style="margin: 0; font-size: 18px; font-weight: bold;">COMANDA</h1>
                <div style="font-size: 11px; color: #666;">El Huerto de Lucas</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #000;">
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; width: 30%; font-weight: bold;">FECHA</td>
                    <td style="border: 1px solid #000; padding: 6px; font-size: 12px;">${pedido.fecha.split(',')[0]}</td>
                    <td style="border: 1px solid #000; padding: 6px; width: 25%; text-align: right; font-weight: bold;">FOLIO</td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${pedidoId}</td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #000;">
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; width: 50%; font-weight: bold;">CLIENTE</td>
                    <td style="border: 1px solid #000; padding: 6px;">${pedido.cliente}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">MÉTODO PAGO</td>
                    <td style="border: 1px solid #000; padding: 6px;">${pedido.metodoPago === 'efectivo' ? 'Efectivo' : pedido.metodoPago === 'cuenta-dni' ? 'Cuenta DNI' : pedido.metodoPago === 'transferencia' ? 'Transferencia' : 'Otro'}</td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #000;">
                <thead>
                    <tr style="background: #90EE90;">
                        <th style="border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold; font-size: 12px;">CANTIDAD</th>
                        <th style="border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold; font-size: 12px;">CONCEPTO</th>
                        <th style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; font-size: 12px;">IMPORTE</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedido.items.map(item => `
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.cantidad}</td>
                            <td style="border: 1px solid #000; padding: 8px;">${item.nombre.length > 30 ? item.nombre.substring(0, 30) + '...' : item.nombre}</td>
                            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">$${item.total.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                <tr>
                    <td style="border: 1px solid #000; padding: 10px; text-align: right; width: 70%; font-weight: bold;">TOTAL</td>
                    <td style="border: 1px solid #000; padding: 10px; text-align: right; background: #90EE90; font-weight: bold; font-size: 16px;">$${pedido.total.toLocaleString()}</td>
                </tr>
                ${pedido.metodoPago === 'cuenta-dni' ? `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; color: #d97706;">REINTEGRO 40%</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right; background: #FFF8DC; font-weight: bold; color: #d97706;">$${Math.min(Math.round(pedido.total * 0.40), 6000).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; background: #FFFACD;">TOTAL A RECIBIR</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right; background: #FFFACD; font-weight: bold; font-size: 16px;">$${(pedido.total + Math.min(Math.round(pedido.total * 0.40), 6000)).toLocaleString()}</td>
                    </tr>
                ` : ''}
            </table>

            <div style="margin-top: 15px; text-align: center; font-size: 10px; color: #666;">
                Los Sauces 264 - General Pinto, BA<br>
                📱 +54 9 1125328861<br>
                ¡Gracias por tu compra!
            </div>
        </div>
    `;

    document.body.appendChild(comprobante);

    // Convertir a imagen usando html2canvas
    try {
        const canvas = await html2canvas(comprobante, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false
        });

        // Convertir a blob y mostrar modal
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `comprobante-${Date.now()}.jpg`;

            mostrarModalComprobante(url, link, pedido.total.toLocaleString(), pedido.fecha, pedido.cliente, pedido.metodoPago);

            document.body.removeChild(comprobante);
        }, 'image/jpeg', 0.95);
    } catch (error) {
        console.error('Error generando comprobante:', error);
        alert('❌ Error al generar el comprobante');
        document.body.removeChild(comprobante);
    }
}

// ELIMINAR PEDIDO
function eliminarPedido(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
        let historial = JSON.parse(localStorage.getItem('historial') || '[]');
        historial.splice(index, 1);
        localStorage.setItem('historial', JSON.stringify(historial));
        renderizarHistorial();
    }
}

// VOLVER A PRODUCTOS
function volverAProductos() {
    mostrarPantalla('pantalla-productos');
}

// RENDERIZAR LISTA DE PRECIOS
function renderizarListaPrecios() {
    const grid = document.getElementById('precios-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Ordenar productos alfabéticamente
    const productosOrdenados = [...productos].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es')
    );

    productosOrdenados.forEach(producto => {
        const emoji = producto.emoji || '🥬';
        const precio = producto.precio.toLocaleString();

        const item = document.createElement('div');
        item.className = 'precio-item';
        item.innerHTML = `
            <div class="precio-emoji">${emoji}</div>
            <div>
                <div class="precio-nombre">${producto.nombre}</div>
                <div class="precio-peso">${producto.peso}</div>
            </div>
            <div class="precio-valor">$${precio}</div>
        `;
        grid.appendChild(item);
    });
}

// MOSTRAR LISTA DE PRECIOS
function mostrarListaPrecios() {
    mostrarPantalla('pantalla-precios');
    renderizarListaPrecios();
}

// EXPORTAR LISTA DE PRECIOS COMO JPG
async function exportarListaPrecios() {
    const fecha = new Date().toLocaleDateString('es-AR') + ', ' + new Date().toLocaleTimeString('es-AR');

    // Generar tabla de productos ordenados
    const productosOrdenados = [...productos].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es')
    );

    const productosHTML = productosOrdenados.map(p => `
${p.nombre.padEnd(45)} $${p.precio.toString().padStart(8)}`).join('\n');

    // Crear elemento HTML invisible con el ticket
    const ticket = document.createElement('div');
    ticket.style.cssText = 'position: fixed; top: 0; left: 0; width: 580px; padding: 30px; background: #ffffff; font-family: monospace; color: #000; z-index: 10000; font-size: 13px; line-height: 1.6;';

    ticket.innerHTML = `
<div style="text-align: center; white-space: pre-wrap; word-wrap: break-word;">
<div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">EL HUERTO DE LUCAS</div>
<div style="font-size: 12px; margin-bottom: 15px;">Los Sauces 264 - General Pinto</div>

<div style="border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
Fecha: ${fecha}
</div>

<div style="text-align: left; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
PRODUCTO                                    PRECIO
</div>

<div style="text-align: left; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; white-space: pre;">
${productosHTML}
</div>

<div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 0; margin: 10px 0; text-align: right; font-weight: bold; font-size: 14px;">
TOTAL PRODUCTOS: ${productos.length}
</div>

<div style="text-align: center; margin: 15px 0;">
Gracias por tu compra! 🌻
</div>

<div style="border-top: 1px dashed #000; padding-top: 10px; text-align: center; font-size: 11px;">
📱 +54 9 1125328861
📸 @elhuertodelucas
</div>
</div>
    `;

    document.body.appendChild(ticket);

    try {
        const canvas = await html2canvas(ticket, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const filename = `lista-precios-${new Date().toISOString().split('T')[0]}.jpg`;

            // Crear link de descarga real
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;

            // Mostrar modal con opciones
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>📋 Lista de Precios Exportada</h2>
                        <button class="modal-cerrar" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body" style="text-align: center;">
                        <p style="margin-bottom: 1.5rem; color: #666;">✓ Lista lista para compartir</p>
                        <button id="btn-descargar" style="width: 100%; background: linear-gradient(135deg, #7cb342 0%, #558b2f 100%); color: white; border: none; padding: 0.75rem; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 0.5rem;">
                            📥 Descargar JPG
                        </button>
                        <button onclick="compartirListaPrecios()"
                                style="width: 100%; background: linear-gradient(135deg, #d97706 0%, #b8860b 100%); color: white; border: none; padding: 0.75rem; border-radius: 8px; font-weight: bold; cursor: pointer;">
                            💬 Abrir WhatsApp
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Evento de descarga
            document.getElementById('btn-descargar').onclick = () => {
                downloadLink.click();
            };
        });
    } catch (error) {
        console.error('Error al exportar:', error);
        alert('Error al generar la lista de precios');
    } finally {
        if (document.body.contains(ticket)) {
            document.body.removeChild(ticket);
        }
    }
}

function compartirListaPrecios() {
    const numeroWhatsapp = '5491125328861';
    const mensaje = encodeURIComponent('📋 Lista de Precios - El Huerto de Lucas\n\nPrecios vigentes\n\n⚠️ Nota: adjunta la imagen de la lista que descargaste');

    window.open(`https://wa.me/${numeroWhatsapp}?text=${mensaje}`, '_blank');
}

// GESTIÓN DE CLIENTES
function abrirSelectorCliente() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    // Clientes predefinidos
    let clientesHTML = '';
    if (typeof CLIENTES_CONFIG !== 'undefined' && CLIENTES_CONFIG.length > 0) {
        clientesHTML = CLIENTES_CONFIG.map((cliente, index) => `
            <button class="cliente-item ${clienteSeleccionado && clienteSeleccionado.nombre === cliente.nombre ? 'activo' : ''}"
                    onclick="seleccionarCliente(${index}, this.closest('.modal-overlay'))">
                <div class="cliente-nombre">${cliente.nombre}</div>
                <div class="cliente-tipo">${cliente.tipo}</div>
            </button>
        `).join('');
    }

    // Clientes guardados (localStorage)
    const clientesGuardados = obtenerClientesGuardados();
    let clientesGuardadosHTML = '';
    if (clientesGuardados.length > 0) {
        clientesGuardadosHTML = clientesGuardados.map((cliente, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f9faf8; border-radius: 8px; margin-bottom: 0.5rem;">
                <button class="cliente-item" style="flex: 1; text-align: left; background: transparent; border: none; padding: 0;"
                        onclick="seleccionarClienteGuardado('${cliente.nombre}', this.closest('.modal-overlay'))">
                    <div class="cliente-nombre" style="margin: 0;">${cliente.nombre}</div>
                    <div class="cliente-tipo" style="font-size: 10px; color: #999;">Mi Cliente</div>
                </button>
                <button onclick="eliminarClienteGuardado('${cliente.nombre}')"
                        style="background: #ff6b6b; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 11px; cursor: pointer;">
                    ✕
                </button>
            </div>
        `).join('');
    }

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header" style="justify-content: space-between;">
                <h2>👤 Seleccionar Cliente</h2>
                <div style="display: flex; gap: 0.5rem;">
                    ${clientesGuardados.length > 0 ? `<button onclick="exportarClientesGuardados()" style="background: #d97706; color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: bold;">📋 Exportar</button>` : ''}
                    <button class="modal-cerrar" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
            </div>
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem; max-height: 70vh; overflow-y: auto;">
                <div style="border-bottom: 2px solid #e0e0e0; padding-bottom: 1rem;">
                    <h3 style="margin-bottom: 0.75rem; font-size: 12px; color: #666;">Clientes Frecuentes</h3>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${clientesHTML}
                    </div>
                </div>

                ${clientesGuardadosHTML ? `
                <div style="border-bottom: 2px solid #e0e0e0; padding-bottom: 1rem;">
                    <h3 style="margin-bottom: 0.75rem; font-size: 12px; color: #666;">Mis Clientes</h3>
                    <div>
                        ${clientesGuardadosHTML}
                    </div>
                </div>
                ` : ''}

                <div>
                    <h3 style="margin-bottom: 0.75rem; font-size: 12px; color: #666;">Agregar Cliente Rápido</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" class="cliente-rapido-input" id="cliente-rapido-nombre"
                               placeholder="Nombre del cliente"
                               style="flex: 1; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 13px;">
                        <button class="btn-agregar-cliente" onclick="agregarClienteRapido(this.closest('.modal-overlay'))"
                                style="background: linear-gradient(135deg, #7cb342 0%, #558b2f 100%); color: white; border: none; padding: 0.75rem 1rem; border-radius: 8px; font-weight: bold; cursor: pointer;">
                            ✓ Usar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('cliente-rapido-nombre').focus();
}

function agregarClienteRapido(modalElement) {
    const nombreInput = document.getElementById('cliente-rapido-nombre');
    const nombre = nombreInput.value.trim();

    if (!nombre) {
        alert('Por favor ingresa un nombre de cliente');
        return;
    }

    clienteSeleccionado = {
        nombre: nombre,
        tipo: 'Cliente Rápido',
        telefono: ''
    };

    guardarCliente();
    guardarClienteEnHistorial(nombre);
    actualizarNombreCliente();
    modalElement.remove();
    console.log('✓ Cliente rápido seleccionado:', clienteSeleccionado.nombre);
}

function seleccionarClienteGuardado(nombre, modalElement) {
    const clientesGuardados = obtenerClientesGuardados();
    const cliente = clientesGuardados.find(c => c.nombre === nombre);

    if (cliente) {
        clienteSeleccionado = cliente;
        guardarCliente();
        actualizarNombreCliente();
        modalElement.remove();
        console.log('✓ Cliente guardado seleccionado:', cliente.nombre);
    }
}

function guardarClienteEnHistorial(nombre) {
    const clientesGuardados = obtenerClientesGuardados();
    const existe = clientesGuardados.find(c => c.nombre === nombre);

    if (!existe) {
        clientesGuardados.push({
            nombre: nombre,
            tipo: 'Mi Cliente',
            telefono: ''
        });
        localStorage.setItem('clientesGuardados', JSON.stringify(clientesGuardados));
    }
}

function obtenerClientesGuardados() {
    const guardados = localStorage.getItem('clientesGuardados');
    return guardados ? JSON.parse(guardados) : [];
}

function eliminarClienteGuardado(nombre) {
    if (confirm(`¿Eliminar cliente "${nombre}"?`)) {
        let clientesGuardados = obtenerClientesGuardados();
        clientesGuardados = clientesGuardados.filter(c => c.nombre !== nombre);
        localStorage.setItem('clientesGuardados', JSON.stringify(clientesGuardados));

        // Actualizar modal
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
        abrirSelectorCliente();
    }
}

function exportarClientesGuardados() {
    const clientesGuardados = obtenerClientesGuardados();

    if (clientesGuardados.length === 0) {
        alert('No hay clientes guardados para exportar');
        return;
    }

    const clientesCode = clientesGuardados.map(c =>
        `    { nombre: '${c.nombre}', tipo: '${c.tipo}', telefono: '${c.telefono}' },`
    ).join('\n');

    const textoExportar = `// Agregar estos clientes a clientes.js:
${clientesCode}`;

    // Mostrar modal con código para copiar
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>📋 Exportar Clientes</h2>
                <button class="modal-cerrar" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body">
                <p style="font-size: 12px; color: #666; margin-bottom: 1rem;">
                    Copia este código y pégalo en <strong>clientes.js</strong> dentro de CLIENTES_CONFIG:
                </p>
                <textarea readonly style="width: 100%; height: 200px; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-family: monospace; font-size: 11px; resize: vertical;">
${textoExportar}</textarea>
                <button onclick="copiarAlPortapapeles(this.previousElementSibling.value)"
                        style="width: 100%; margin-top: 1rem; background: linear-gradient(135deg, #7cb342 0%, #558b2f 100%); color: white; border: none; padding: 0.75rem; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    📋 Copiar Código
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function copiarAlPortapapeles(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert('✓ Código copiado al portapapeles');
    }).catch(() => {
        alert('Error al copiar. Copia manualmente.');
    });
}

function seleccionarCliente(index, modalElement) {
    if (typeof CLIENTES_CONFIG !== 'undefined' && CLIENTES_CONFIG[index]) {
        clienteSeleccionado = CLIENTES_CONFIG[index];
        guardarCliente();
        actualizarNombreCliente();
        modalElement.remove();
        console.log('✓ Cliente seleccionado:', clienteSeleccionado.nombre);
    }
}

function guardarCliente() {
    localStorage.setItem('clienteSeleccionado', JSON.stringify(clienteSeleccionado));
}

function restaurarCliente() {
    const clienteGuardado = localStorage.getItem('clienteSeleccionado');
    if (clienteGuardado) {
        clienteSeleccionado = JSON.parse(clienteGuardado);
    }
}

function actualizarNombreCliente() {
    const nombreElement = document.getElementById('cliente-nombre');
    if (nombreElement) {
        if (clienteSeleccionado) {
            nombreElement.textContent = clienteSeleccionado.nombre;
        } else {
            nombreElement.textContent = 'Seleccionar';
        }
    }
}

// GESTIÓN DE TEMA (CLARO/OSCURO)
function cambiarTema() {
    const html = document.documentElement;
    const icono = document.getElementById('icono-tema');

    if (html.classList.contains('dark-mode')) {
        html.classList.remove('dark-mode');
        localStorage.setItem('tema', 'claro');
        icono.textContent = '🌙';
    } else {
        html.classList.add('dark-mode');
        localStorage.setItem('tema', 'oscuro');
        icono.textContent = '☀️';
    }
}

function restaurarTema() {
    const temGuardado = localStorage.getItem('tema') || 'claro';
    const html = document.documentElement;
    const icono = document.getElementById('icono-tema');

    if (temGuardado === 'oscuro') {
        html.classList.add('dark-mode');
        icono.textContent = '☀️';
    } else {
        html.classList.remove('dark-mode');
        icono.textContent = '🌙';
    }
}

// GESTIÓN DE MÉTODO DE PAGO
function actualizarMetodoPago(valor) {
    metodoPago = valor;
    localStorage.setItem('metodoPago', metodoPago);
    renderizarResumen(); // Actualizar resumen para mostrar reintegro
    console.log('✓ Método de pago:', metodoPago);
}

// CALCULAR DESCUENTO CUENTA DNI (40% con tope de $6000)
function calcularDescuento(total) {
    if (metodoPago !== 'cuenta-dni') return 0;
    const descuento = Math.min(total * 0.40, 6000);
    return Math.round(descuento);
}

function restaurarMetodoPago() {
    metodoPago = localStorage.getItem('metodoPago') || 'efectivo';
    const select = document.getElementById('metodo-pago');
    if (select) {
        select.value = metodoPago;
    }
}

// Exportar para uso en console si es necesario
window.app = {
    carrito,
    productos,
    clienteSeleccionado,
    cargarProductos,
    limpiarCarrito
};
