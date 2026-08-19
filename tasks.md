# 📋 Tasks - Sistema de Gestión Tienda de Ropa (Boutique POS & ERP SPA)

## 📌 Ruta de Desarrollo

- [x] **Fase 1: Configuración de Datos Iniciales (`data.js`)**
  - [x] Crear estructura de datos semilla para Productos, Categorías, Proveedores, Compras por Lote, Ventas/Transacciones, Devoluciones y Usuarios.
  - [x] Implementar script de inicialización con `localStorage`.

- [x] **Fase 2: Estilos y Sistema Visual (`styles.css`)**
  - [x] Integrar Tailwind CSS vía CDN y Google Fonts (Inter / Outfit).
  - [x] Definir temas personalizados para tienda de ropa moderna (paleta slate, indigo, emerald, rose).
  - [x] Estilos para animaciones de transición de SPA, scrollbar personalizado, badges de stock, modales y recibo/ticket impreso.

- [x] **Fase 3: Estructura HTML y Layout Principal (`index.html`)**
  - [x] Crear Header responsive con buscador global, selector de usuario activo y notificaciones.
  - [x] Diseñar Sidebar navegable fijo en Desktop y colapsable (Menú hamburguesa) para Mobile.
  - [x] Definir los contenedores de las 8 secciones de la aplicación.
  - [x] Construir los Modales HTML reusables (Producto, Proveedor, Compra Lote, Recibo Venta, Devolución, Usuario).

- [x] **Fase 4: Motor de Aplicación y Lógica SPA (`app.js`)**
  - [x] **Enrutador & Estado**: Manejar navegación por hash / data-attributes sin recargar la página.
  - [x] **Módulo 1 - Dashboard**: Cálculo de KPIs del día (Ventas $, Entradas/Salidas, Stock Bajo) y tabla de transacciones.
  - [x] **Módulo 2 - Inventario & Productos**: Tabla dinámica, filtros por SKU/Nombre/Categoría/Talla, CRUD completo modal, alertas de stock.
  - [x] **Módulo 3 - Punto de Venta (POS)**: Búsqueda rápida, carrito dinámico (+/-, IVA, descuento), métodos de pago (Efectivo / Transferencia con checkbox obligatorio de verificación), emisión y despliegue de ticket impreso.
  - [x] **Módulo 4 - Proveedores & Compras por Lote**: CRUD de proveedores, formulario de lotes multi-producto, actualización automática de stock e incremento de egresos contables.
  - [x] **Módulo 5 - Devoluciones**: Búsqueda por Ticket ID, reintegro parcial/total de stock y registro de nota de crédito.
  - [x] **Módulo 6 - Cuentas & Finanzas Mensuales**: Balance Ingresos vs. Egresos, cálculo de utilidad neta y margen %.
  - [x] **Módulo 7 - Gestión de Usuarios**: CRUD de usuarios y cambio rápido de perfil activo.
  - [x] **Módulo 8 - Reportes & Analítica**: Filtros de fecha (Desde - Hasta), Top 5 más vendidos y Reporte de Reabastecimiento Crítico.

- [x] **Fase 5: Pruebas y Verificación**
  - [x] Servidor local iniciado en `http://localhost:8080`.
  - [x] Verificado el ciclo comercial completo: Registro -> Inventario -> Compra por Lote -> Venta POS -> Ticket -> Devolución -> Balance Financiero.

- [x] **Fase 6: Nuevas Funcionalidades & Anexos**
  - [x] **Gráficas de Ventas Mensuales**: Integración de Chart.js en el Dashboard con evolución mensual comparativa (Barra/Línea) y distribución de ventas por categoría (Doughnut).
  - [x] **Tiquete Térmico de 2 Pulgadas (58mm)**: Reglas `@page` y `@media print` para impresión exacta en impresoras de caja POS estándar de 2 pulgadas sin desbordar en hojas carta.
  - [x] **Registro Manual de Compra / Entrada a Inventario**: Nuevo módulo y modal para ingresar compras manualmente con creación automática o actualización de stock por SKU y registro contable.
  - [x] **Paleta de Colores Confortable y Suave**: Diseño visual refinado con tonos pasteles descansados, excelente contraste (WCAG AA/AAA) y estética moderna.
  - [x] **Control de Roles y Permisos Estrictos**: Restricción de acceso para el rol Vendedor (ocultamiento en sidebar y bloqueo de rutas para Gestión de Usuarios, Reportes & Analítica, y Cuentas & Finanzas, exclusivos para Administrador).

