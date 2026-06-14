# 🌱 Botonera de Ventas - El Huerto de Lucas

App web rápida y offline para gestionar ventas en ferias y eventos.

## ✨ Características

- **📱 Responsive** - Funciona en cualquier celular sin necesidad de internet
- **🛒 Carrito dinámico** - Agrega/resta productos con botones + y -
- **👤 Control de clientes** - Selecciona cliente para cada pedido
- **📊 Resumen de pedido** - Ve totales en tiempo real
- **📜 Historial** - Guarda todos los pedidos localmente
- **💬 WhatsApp** - Envía comprobantes por WhatsApp
- **📸 Comprobante JPG** - Descarga y comparte la factura como imagen
- **💾 Sin internet** - Funciona 100% offline

## 🚀 Cómo usar

### Online (GitHub Pages)
Abre en cualquier celular: **[https://tijuanatipu-ctrl.github.io/botonera-ventas/](https://tijuanatipu-ctrl.github.io/botonera-ventas/)**

### Localmente
1. Clona el repo: `git clone https://github.com/tijuanatipu-ctrl/botonera-ventas.git`
2. Abre `index.html` en tu navegador

## ⚙️ Configuración

### Actualizar productos
Edita `config.js` con tus productos:
```javascript
{ nombre: 'Acelga', precio: 2800, unidad: 'atado', peso: '800g', emoji: '🥬' }
```

### Actualizar clientes
Edita `clientes.js`:
```javascript
{ nombre: 'Cliente 1', tipo: 'Minorista', telefono: '1100000000' }
```

### Cambiar número de WhatsApp
En `app.js`, busca `numeroWhatsapp` y reemplaza:
```javascript
const numeroWhatsapp = '5491125328861'; // Tu número aquí
```

## 📊 Pantallas

1. **Productos** - Cuadrícula con botones +/- para agregar
2. **Resumen** - Detalle del carrito, cliente y total
3. **Historial** - Lista de pedidos guardados

## 📝 Funciones principales

- **Seleccionar cliente** - Click en "👤 Seleccionar"
- **Ajustar cantidad** - Click en producto → modal o botones +/-
- **Ver total** - Botón "💰 TOTAL" → va a resumen
- **Enviar por WhatsApp** - Genera JPG y abre WhatsApp
- **Descargar comprobante** - Descarga como imagen JPG
- **Historial** - Ver, repetir o eliminar pedidos
- **Resetear** - Botón 🔄 para limpiar carrito

## 🎨 Colores

- Verde: `#2d5016` (primario)
- Naranja: `#d97706` (acentos)
- Blanco: `#f9faf8` (fondo)

## 📦 Stack

- HTML5
- CSS3 (responsive)
- JavaScript vanilla (sin dependencias)
- html2canvas (para generar imágenes)
- LocalStorage (almacenamiento local)

## 💡 Tips

- Los datos se guardan localmente en tu dispositivo
- No necesita conexión a internet
- Perfecta para ventas offline
- Comprobantes profesionales en JPG

## 📞 Contacto

**El Huerto de Lucas**
- 📍 Los Sauces 264, General Pinto
- 📱 WhatsApp: [+54 9 1125328861](https://wa.me/5491125328861)
- 📸 Instagram: [@elhuertodelucas](https://instagram.com/elhuertodelucas)

---

Hecho con ❤️ para vender mejor en la feria
