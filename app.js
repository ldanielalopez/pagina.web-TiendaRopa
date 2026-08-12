/**
 * app.js - Motor Lógico SPA para Vogue & Style Boutique ERP / POS
 * Maneja estado en localStorage, enrutamiento interno, modales, POS, inventario, finanzas y reportes.
 */

class AppEngine {
    constructor() {
        this.cart = [];
        this.currentSection = 'dashboard';
        this.activeUser = null;
        this.init();
    }

    init() {
        // Cargar usuario activo
        this.activeUser = this.getStorage('activeUser') || { fullName: "Valeria Gómez", role: "Administrador", username: "admin_valeria" };
        
        // Escuchar eventos DOM
        this.bindEvents();
        
        // Inicializar interfaz
        this.updateHeaderUserInfo();
        this.renderUserSelectorDropdown();
        this.setupCategoryAndSizeOptions();
        this.setupDateFilterDefaults();

        // Enrutamiento inicial según hash de la URL
        const hash = window.location.hash.replace('#', '');
        this.navigateTo(hash || 'dashboard');

        // Actualizar iconos Lucide
        this.refreshIcons();
    }

    // ==========================================
    // HELPERS DE LOCALSTORAGE Y UTILIDADES
    // ==========================================
    getStorage(key) {
        try {
            const data = localStorage.getItem(`vogue_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error("Error leyendo localStorage", e);
            return null;
        }
    }

    setStorage(key, value) {
        try {
            localStorage.setItem(`vogue_${key}`, JSON.stringify(value));
        } catch (e) {
            console.error("Error escribiendo en localStorage", e);
        }
    }

    formatMoney(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount || 0);
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        toast.innerHTML = `
            <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5"></i>
            <span class="text-xs font-semibold text-slate-800">${message}</span>
        `;

        container.appendChild(toast);
        this.refreshIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    refreshIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // ==========================================
    // NAVEGACIÓN SPA & EVENTOS
    // ==========================================
    bindEvents() {
        // Enlaces de navegación sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetSec = link.getAttribute('data-section');
                if (targetSec) {
                    this.navigateTo(targetSec);
                }
            });
        });

        // Menú Hamburguesa Móvil
        const openBtn = document.getElementById('open-mobile-menu');
        const closeBtn = document.getElementById('close-mobile-menu');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-overlay');

        const toggleMobile = (show) => {
            if (show) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        };

        if (openBtn) openBtn.addEventListener('click', () => toggleMobile(true));
        if (closeBtn) closeBtn.addEventListener('click', () => toggleMobile(false));
        if (overlay) overlay.addEventListener('click', () => toggleMobile(false));

        // Selector de Usuario Trigger
        const userTrigger = document.getElementById('user-selector-trigger');
        const userDropdown = document.getElementById('user-selector-dropdown');
        if (userTrigger && userDropdown) {
            userTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', () => userDropdown.classList.add('hidden'));
        }

        // Buscador de inventario en tiempo real
        const invSearch = document.getElementById('inv-search-input');
        const invCat = document.getElementById('inv-category-filter');
        const invSize = document.getElementById('inv-size-filter');

        if (invSearch) invSearch.addEventListener('input', () => this.renderInventory());
        if (invCat) invCat.addEventListener('change', () => this.renderInventory());
        if (invSize) invSize.addEventListener('change', () => this.renderInventory());

        // POS Buscador y Controles de Carrito
        const posSearch = document.getElementById('pos-search-input');
        if (posSearch) posSearch.addEventListener('input', () => this.renderPosProducts());

        const posTaxToggle = document.getElementById('pos-tax-toggle');
        const posDiscountInput = document.getElementById('pos-discount-input');
        if (posTaxToggle) posTaxToggle.addEventListener('change', () => this.updateCartTotals());
        if (posDiscountInput) posDiscountInput.addEventListener('input', () => this.updateCartTotals());

        // Cambio de método de pago POS (Verificación de transferencia)
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const box = document.getElementById('pos-transfer-verification-box');
                if (e.target.value === 'Transferencia') {
                    box.classList.remove('hidden');
                } else {
                    box.classList.add('hidden');
                    document.getElementById('pos-transfer-check').checked = false;
                }
            });
        });

        // Eventos de Formularios Modales
        const formProd = document.getElementById('form-product');
        if (formProd) formProd.addEventListener('submit', (e) => this.saveProduct(e));

        const formSup = document.getElementById('form-supplier');
        if (formSup) formSup.addEventListener('submit', (e) => this.saveSupplier(e));

        const formBatch = document.getElementById('form-batch');
        if (formBatch) formBatch.addEventListener('submit', (e) => this.saveBatch(e));

        const formUser = document.getElementById('form-user');
        if (formUser) formUser.addEventListener('submit', (e) => this.saveUser(e));
    }

    navigateTo(sectionId) {
        const secElement = document.getElementById(`sec-${sectionId}`);
        if (!secElement) return;

        this.currentSection = sectionId;
        window.location.hash = sectionId;

        // Ocultar todas las secciones y mostrar la seleccionada
        document.querySelectorAll('.section-page').forEach(sec => {
            sec.classList.remove('active-section');
        });
        secElement.classList.add('active-section');

        // Actualizar links activos en sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Actualizar título en header
        const titles = {
            dashboard: '📊 Dashboard Principal',
            inventario: '📦 Inventario & Catálogo de Prendas',
            pos: '🛒 Punto de Venta (POS / Caja)',
            proveedores: '🚚 Proveedores & Compras por Lote',
            devoluciones: '🔄 Módulo de Devoluciones',
            finanzas: '💰 Cuentas & Finanzas Mensuales',
            usuarios: '👥 Gestión de Usuarios',
            reportes: '📈 Reportes & Analítica de Ventas'
        };
        const headerTitle = document.getElementById('header-current-section-title');
        if (headerTitle) headerTitle.textContent = titles[sectionId] || 'Vogue & Style';

        // Renderizar la sección específica
        switch (sectionId) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'inventario':
                this.renderInventory();
                break;
            case 'pos':
                this.renderPosProducts();
                this.updateCartTotals();
                break;
            case 'proveedores':
                this.renderSuppliers();
                this.renderBatchesHistory();
                break;
            case 'devoluciones':
                this.renderReturnsHistory();
                break;
            case 'finanzas':
                this.renderFinanceLedger();
                break;
            case 'usuarios':
                this.renderUsers();
                break;
            case 'reportes':
                this.renderReports();
                break;
        }

        this.updateLowStockBadge();
        this.refreshIcons();
    }

    updateHeaderUserInfo() {
        const nameEl = document.getElementById('user-active-name');
        const roleEl = document.getElementById('user-active-role');
        const avatarEl = document.getElementById('user-avatar-badge');
        const dashName = document.getElementById('dash-user-name');
        const dateEl = document.getElementById('current-date-display');

        if (this.activeUser) {
            if (nameEl) nameEl.textContent = this.activeUser.fullName;
            if (roleEl) roleEl.textContent = this.activeUser.role;
            if (avatarEl) avatarEl.textContent = this.activeUser.fullName.charAt(0).toUpperCase();
            if (dashName) dashName.textContent = this.activeUser.fullName.split(' ')[0];
        }

        if (dateEl) {
            const now = new Date();
            dateEl.textContent = now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
        }
    }

    renderUserSelectorDropdown() {
        const list = document.getElementById('user-dropdown-list');
        if (!list) return;

        const users = this.getStorage('users') || [];
        list.innerHTML = users.map(user => `
            <button onclick="app.setActiveUser('${user.id}')" class="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 flex items-center justify-between transition-colors">
                <div>
                    <p class="font-bold text-slate-800">${user.fullName}</p>
                    <p class="text-[10px] text-slate-400">${user.role}</p>
                </div>
                ${user.id === this.activeUser?.id ? '<i data-lucide="check" class="w-4 h-4 text-indigo-600"></i>' : ''}
            </button>
        `).join('');

        this.refreshIcons();
    }

    setActiveUser(userId) {
        const users = this.getStorage('users') || [];
        const found = users.find(u => u.id === userId);
        if (found) {
            this.activeUser = found;
            this.setStorage('activeUser', found);
            this.updateHeaderUserInfo();
            this.renderUserSelectorDropdown();
            this.showToast(`Perfil cambiado a: ${found.fullName} (${found.role})`, 'info');
        }
    }

    setupCategoryAndSizeOptions() {
        const categories = this.getStorage('categories') || [];
        const sizes = this.getStorage('sizes') || [];

        // Filtro de categorías en inventario
        const invCat = document.getElementById('inv-category-filter');
        const prodCat = document.getElementById('prod-category');
        if (invCat) {
            invCat.innerHTML = '<option value="">Todas las Categorías</option>' + 
                categories.map(c => `<option value="${c}">${c}</option>`).join('');
        }
        if (prodCat) {
            prodCat.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
        }

        // Filtro y select de tallas
        const invSize = document.getElementById('inv-size-filter');
        const prodSize = document.getElementById('prod-size');
        if (invSize) {
            invSize.innerHTML = '<option value="">Todas las Tallas</option>' + 
                sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        }
        if (prodSize) {
            prodSize.innerHTML = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        }
    }

    setupDateFilterDefaults() {
        const dateFrom = document.getElementById('rep-date-from');
        const dateTo = document.getElementById('rep-date-to');
        if (dateFrom && dateTo) {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFrom.value = firstDay.toISOString().split('T')[0];
            dateTo.value = now.toISOString().split('T')[0];
        }
    }

    updateLowStockBadge() {
        const products = this.getStorage('products') || [];
        const lowStockCount = products.filter(p => p.stock < (p.minStock || 5)).length;
        
        const badge = document.getElementById('header-low-stock-count');
        const kpiLow = document.getElementById('kpi-low-stock');
        
        if (badge) badge.textContent = lowStockCount;
        if (kpiLow) kpiLow.textContent = `${lowStockCount} prendas`;
    }

    // ==========================================
    // SECCIÓN 1: DASHBOARD
    // ==========================================
    renderDashboard() {
        const sales = this.getStorage('sales') || [];
        const batches = this.getStorage('batches') || [];
        const products = this.getStorage('products') || [];

        const todayStr = new Date().toISOString().split('T')[0];

        // Ventas de hoy
        const todaySalesList = sales.filter(s => s.date.startsWith(todayStr));
        const todayTotalSales = todaySalesList.reduce((acc, s) => acc + (s.total || 0), 0);
        const todayOutputsCount = todaySalesList.reduce((acc, s) => acc + (s.items ? s.items.reduce((iAcc, item) => iAcc + item.quantity, 0) : 0), 0);

        // Lotes de hoy (Entradas)
        const todayBatchesList = batches.filter(b => b.date.startsWith(todayStr));
        const todayInputsCount = todayBatchesList.reduce((acc, b) => acc + (b.items ? b.items.reduce((iAcc, item) => iAcc + item.quantity, 0) : 0), 0);

        // Actualizar KPIs
        const kpiSales = document.getElementById('kpi-today-sales');
        const kpiCount = document.getElementById('kpi-today-count');
        const kpiInputs = document.getElementById('kpi-today-inputs');
        const kpiOutputs = document.getElementById('kpi-today-outputs');

        if (kpiSales) kpiSales.textContent = this.formatMoney(todayTotalSales);
        if (kpiCount) kpiCount.textContent = `${todaySalesList.length} ventas hoy`;
        if (kpiInputs) kpiInputs.textContent = `${todayInputsCount} unid`;
        if (kpiOutputs) kpiOutputs.textContent = `${todayOutputsCount} unid`;

        // Renderizar tabla de últimas transacciones del día
        const tbody = document.getElementById('dash-recent-sales-tbody');
        if (!tbody) return;

        if (sales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-400">No hay ventas registradas aún.</td></tr>`;
            return;
        }

        const recent = [...sales].reverse().slice(0, 5);
        tbody.innerHTML = recent.map(sale => `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-5 font-bold text-slate-900">
                    ${sale.ticketNumber}
                    <span class="block text-[11px] text-slate-400 font-normal">${new Date(sale.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td class="py-3 px-5 text-slate-700 font-medium">${sale.sellerName || 'Vendedor'}</td>
                <td class="py-3 px-5">
                    <span class="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${sale.paymentMethod === 'Transferencia' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                        ${sale.paymentMethod === 'Transferencia' ? '📱 Transfer' : '💵 Efectivo'}
                    </span>
                </td>
                <td class="py-3 px-5 font-semibold text-slate-700">${sale.items ? sale.items.reduce((a, b) => a + b.quantity, 0) : 0} prendas</td>
                <td class="py-3 px-5 text-right font-extrabold text-slate-900">${this.formatMoney(sale.total)}</td>
                <td class="py-3 px-5 text-center">
                    <span class="text-xs px-2 py-0.5 rounded-full font-bold ${sale.status === 'Devuelta' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">
                        ${sale.status || 'Completada'}
                    </span>
                </td>
                <td class="py-3 px-5 text-right">
                    <button onclick="app.viewTicketModal('${sale.id}')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg">
                        Ver Ticket
                    </button>
                </td>
            </tr>
        `).join('');

        this.refreshIcons();
    }

    // ==========================================
    // SECCIÓN 2: INVENTARIO & PRODUCTOS
    // ==========================================
    renderInventory() {
        const products = this.getStorage('products') || [];
        const tbody = document.getElementById('inventory-tbody');
        if (!tbody) return;

        const searchText = (document.getElementById('inv-search-input')?.value || '').toLowerCase();
        const catFilter = document.getElementById('inv-category-filter')?.value || '';
        const sizeFilter = document.getElementById('inv-size-filter')?.value || '';

        const filtered = products.filter(p => {
            const matchesText = p.sku.toLowerCase().includes(searchText) || 
                                p.name.toLowerCase().includes(searchText) || 
                                (p.brand && p.brand.toLowerCase().includes(searchText));
            const matchesCat = catFilter === '' || p.category === catFilter;
            const matchesSize = sizeFilter === '' || p.size === sizeFilter;
            return matchesText && matchesCat && matchesSize;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400">No se encontraron prendas con los criterios de búsqueda.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(p => {
            let stockBadge = '';
            if (p.stock < 5) {
                stockBadge = `<span class="badge-stock-critical text-xs px-2.5 py-1 rounded-full font-bold">⚠️ Bajo (${p.stock})</span>`;
            } else if (p.stock <= 10) {
                stockBadge = `<span class="badge-stock-warning text-xs px-2.5 py-1 rounded-full font-bold">Medio (${p.stock})</span>`;
            } else {
                stockBadge = `<span class="badge-stock-ok text-xs px-2.5 py-1 rounded-full font-bold">Óptimo (${p.stock})</span>`;
            }

            return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3 px-5">
                        <div class="flex items-center gap-3">
                            <img src="${p.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&q=80'}" alt="${p.name}" class="w-10 h-10 rounded-lg object-cover border border-slate-200">
                            <div>
                                <strong class="text-slate-900 font-bold block">${p.name}</strong>
                                <span class="text-xs text-slate-400 font-mono">SKU: ${p.sku} • Marca: ${p.brand || 'Vogue'}</span>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-5 font-medium text-slate-700">${p.category}</td>
                    <td class="py-3 px-5 text-center">
                        <span class="bg-slate-100 text-slate-800 font-bold text-xs px-2 py-1 rounded-md">${p.size}</span>
                        <span class="text-xs text-slate-500 block mt-0.5">${p.color}</span>
                    </td>
                    <td class="py-3 px-5 text-center">${stockBadge}</td>
                    <td class="py-3 px-5 text-right font-semibold text-slate-500">${this.formatMoney(p.costPrice)}</td>
                    <td class="py-3 px-5 text-right font-extrabold text-slate-900">${this.formatMoney(p.salePrice)}</td>
                    <td class="py-3 px-5 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="app.openProductModal('${p.id}')" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Editar Prenda">
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                            <button onclick="app.deleteProduct('${p.id}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="Eliminar Prenda">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        this.refreshIcons();
    }

    openProductModal(productId = null) {
        const modal = document.getElementById('modal-product');
        const title = document.getElementById('modal-product-title');
        const form = document.getElementById('form-product');
        
        if (!modal || !form) return;

        form.reset();
        document.getElementById('prod-id').value = '';

        if (productId) {
            title.textContent = 'Editar Prenda de Inventario';
            const products = this.getStorage('products') || [];
            const prod = products.find(p => p.id === productId);
            if (prod) {
                document.getElementById('prod-id').value = prod.id;
                document.getElementById('prod-sku').value = prod.sku;
                document.getElementById('prod-name').value = prod.name;
                document.getElementById('prod-brand').value = prod.brand || '';
                document.getElementById('prod-category').value = prod.category;
                document.getElementById('prod-size').value = prod.size;
                document.getElementById('prod-color').value = prod.color;
                document.getElementById('prod-stock').value = prod.stock;
                document.getElementById('prod-cost').value = prod.costPrice;
                document.getElementById('prod-price').value = prod.salePrice;
            }
        } else {
            title.textContent = 'Nuevo Producto / Prenda';
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    saveProduct(e) {
        e.preventDefault();
        const id = document.getElementById('prod-id').value;
        const products = this.getStorage('products') || [];

        const prodData = {
            id: id || `PROD-${Date.now().toString().slice(-4)}`,
            sku: document.getElementById('prod-sku').value.toUpperCase().trim(),
            name: document.getElementById('prod-name').value.trim(),
            brand: document.getElementById('prod-brand').value.trim(),
            category: document.getElementById('prod-category').value,
            size: document.getElementById('prod-size').value,
            color: document.getElementById('prod-color').value.trim(),
            stock: parseInt(document.getElementById('prod-stock').value) || 0,
            minStock: 5,
            costPrice: parseFloat(document.getElementById('prod-cost').value) || 0,
            salePrice: parseFloat(document.getElementById('prod-price').value) || 0,
            image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80"
        };

        if (id) {
            const index = products.findIndex(p => p.id === id);
            if (index !== -1) products[index] = prodData;
            this.showToast('Prenda actualizada correctamente', 'success');
        } else {
            products.unshift(prodData);
            this.showToast('Nueva prenda agregada al inventario', 'success');
        }

        this.setStorage('products', products);
        this.closeModal('modal-product');
        this.renderInventory();
        this.updateLowStockBadge();
    }

    deleteProduct(id) {
        if (!confirm('¿Está seguro de eliminar esta prenda del inventario?')) return;
        let products = this.getStorage('products') || [];
        products = products.filter(p => p.id !== id);
        this.setStorage('products', products);
        this.renderInventory();
        this.updateLowStockBadge();
        this.showToast('Producto eliminado del inventario', 'info');
    }

    // ==========================================
    // SECCIÓN 3: PUNTO DE VENTA (POS / CAJA)
    // ==========================================
    renderPosProducts(categoryFilter = '') {
        const products = this.getStorage('products') || [];
        const grid = document.getElementById('pos-products-grid');
        const pillsContainer = document.getElementById('pos-category-pills');
        const searchText = (document.getElementById('pos-search-input')?.value || '').toLowerCase();

        // Renderizar pills de categoría
        const categories = this.getStorage('categories') || [];
        if (pillsContainer) {
            pillsContainer.innerHTML = `
                <button onclick="app.renderPosProducts('')" class="px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-colors ${categoryFilter === '' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">Todas</button>
            ` + categories.map(cat => `
                <button onclick="app.renderPosProducts('${cat}')" class="px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-colors ${categoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">${cat}</button>
            `).join('');
        }

        if (!grid) return;

        const filtered = products.filter(p => {
            const matchesText = p.sku.toLowerCase().includes(searchText) || p.name.toLowerCase().includes(searchText);
            const matchesCat = categoryFilter === '' || p.category === categoryFilter;
            return matchesText && matchesCat;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 text-xs">No hay prendas disponibles.</div>`;
            return;
        }

        grid.innerHTML = filtered.map(p => `
            <div onclick="app.addToCart('${p.id}')" class="pos-product-card bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm cursor-pointer hover:border-indigo-500 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start">
                        <span class="bg-indigo-50 text-indigo-700 font-bold text-[10px] px-2 py-0.5 rounded">${p.size}</span>
                        <span class="text-[10px] font-bold ${p.stock < 5 ? 'text-rose-600' : 'text-slate-400'}">Stock: ${p.stock}</span>
                    </div>
                    <h4 class="font-bold text-slate-800 text-xs mt-2 line-clamp-2">${p.name}</h4>
                    <p class="text-[10px] text-slate-400 font-mono">SKU: ${p.sku}</p>
                </div>
                <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <strong class="text-sm font-extrabold text-indigo-600">${this.formatMoney(p.salePrice)}</strong>
                    <span class="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">+</span>
                </div>
            </div>
        `).join('');
    }

    addToCart(productId) {
        const products = this.getStorage('products') || [];
        const product = products.find(p => p.id === productId);

        if (!product) return;
        if (product.stock <= 0) {
            this.showToast('¡Sin stock disponible para esta prenda!', 'warning');
            return;
        }

        const existing = this.cart.find(item => item.product.id === productId);
        if (existing) {
            if (existing.quantity + 1 > product.stock) {
                this.showToast(`No puedes añadir más de ${product.stock} unidades de esta prenda.`, 'warning');
                return;
            }
            existing.quantity++;
        } else {
            this.cart.push({ product, quantity: 1 });
        }

        this.renderCartItems();
        this.updateCartTotals();
    }

    updateCartQty(productId, delta) {
        const item = this.cart.find(i => i.product.id === productId);
        if (!item) return;

        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            this.removeFromCart(productId);
            return;
        }

        if (newQty > item.product.stock) {
            this.showToast(`Stock máximo alcanzado (${item.product.stock} unidades)`, 'warning');
            return;
        }

        item.quantity = newQty;
        this.renderCartItems();
        this.updateCartTotals();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(i => i.product.id !== productId);
        this.renderCartItems();
        this.updateCartTotals();
    }

    clearCart() {
        this.cart = [];
        this.renderCartItems();
        this.updateCartTotals();
    }

    renderCartItems() {
        const container = document.getElementById('pos-cart-items');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = `<div class="py-8 text-center text-slate-400 text-xs">El carrito está vacío. Haz clic en las prendas del catálogo para vender.</div>`;
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div class="flex-1 pr-2">
                    <strong class="text-xs font-bold text-slate-800 block line-clamp-1">${item.product.name}</strong>
                    <span class="text-[10px] text-slate-400">Talla: ${item.product.size} • ${this.formatMoney(item.product.salePrice)} c/u</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex items-center bg-white border border-slate-200 rounded-lg">
                        <button onclick="app.updateCartQty('${item.product.id}', -1)" class="w-6 h-6 text-slate-600 font-bold hover:bg-slate-100 rounded-l-lg">-</button>
                        <span class="w-6 text-center text-xs font-bold text-slate-800">${item.quantity}</span>
                        <button onclick="app.updateCartQty('${item.product.id}', 1)" class="w-6 h-6 text-slate-600 font-bold hover:bg-slate-100 rounded-r-lg">+</button>
                    </div>
                    <strong class="text-xs font-extrabold text-indigo-600 w-16 text-right">${this.formatMoney(item.product.salePrice * item.quantity)}</strong>
                    <button onclick="app.removeFromCart('${item.product.id}')" class="text-rose-500 hover:text-rose-700 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
        `).join('');

        this.refreshIcons();
    }

    updateCartTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
        const hasTax = document.getElementById('pos-tax-toggle')?.checked;
        const storeInfo = this.getStorage('storeInfo') || { taxRate: 0.19 };
        const discount = parseFloat(document.getElementById('pos-discount-input')?.value || 0);

        const taxAmount = hasTax ? Math.round(subtotal * storeInfo.taxRate) : 0;
        const total = Math.max(0, subtotal + taxAmount - discount);

        const subEl = document.getElementById('pos-subtotal');
        const taxEl = document.getElementById('pos-tax');
        const totEl = document.getElementById('pos-total');

        if (subEl) subEl.textContent = this.formatMoney(subtotal);
        if (taxEl) taxEl.textContent = this.formatMoney(taxAmount);
        if (totEl) totEl.textContent = this.formatMoney(total);
    }

    processSale() {
        if (this.cart.length === 0) {
            this.showToast('El carrito está vacío. Agrega prendas para procesar.', 'warning');
            return;
        }

        const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Efectivo';
        const transferChecked = document.getElementById('pos-transfer-check')?.checked;

        // VERIFICACIÓN MANUAL OBLIGATORIA PARA TRANSFERENCIAS
        if (selectedPayment === 'Transferencia' && !transferChecked) {
            this.showToast('⚠️ Requisito Obligatorio: Debe marcar la casilla de "Verificación Manual de Transferencia Confirmada".', 'error');
            return;
        }

        const products = this.getStorage('products') || [];
        const sales = this.getStorage('sales') || [];

        // Validar stock nuevamente
        for (const item of this.cart) {
            const prod = products.find(p => p.id === item.product.id);
            if (!prod || prod.stock < item.quantity) {
                this.showToast(`Stock insuficiente para ${item.product.name}`, 'error');
                return;
            }
        }

        // Descontar stock
        this.cart.forEach(item => {
            const prod = products.find(p => p.id === item.product.id);
            if (prod) {
                prod.stock -= item.quantity;
            }
        });
        this.setStorage('products', products);

        // Crear objeto Venta
        const subtotal = this.cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
        const totalCost = this.cart.reduce((sum, item) => sum + (item.product.costPrice * item.quantity), 0);
        const hasTax = document.getElementById('pos-tax-toggle')?.checked;
        const storeInfo = this.getStorage('storeInfo') || { taxRate: 0.19 };
        const discount = parseFloat(document.getElementById('pos-discount-input')?.value || 0);
        const tax = hasTax ? Math.round(subtotal * storeInfo.taxRate) : 0;
        const total = Math.max(0, subtotal + tax - discount);

        const ticketNum = `TCK-${(sales.length + 1001)}`;
        const now = new Date();

        const newSale = {
            id: ticketNum,
            ticketNumber: ticketNum,
            date: now.toISOString(),
            dateFormatted: now.toLocaleString('es-CO'),
            sellerName: this.activeUser ? this.activeUser.fullName : 'Carlos Mendoza',
            paymentMethod: selectedPayment,
            transferVerified: selectedPayment === 'Transferencia' ? true : false,
            subtotal,
            tax,
            discount,
            total,
            totalCost,
            status: 'Completada',
            items: this.cart.map(i => ({
                productId: i.product.id,
                sku: i.product.sku,
                name: i.product.name,
                quantity: i.quantity,
                unitPrice: i.product.salePrice,
                costPrice: i.product.costPrice,
                subtotal: i.product.salePrice * i.quantity
            }))
        };

        sales.unshift(newSale);
        this.setStorage('sales', sales);

        // Mostrar Ticket de Venta
        this.renderTicketContent(newSale);

        // Reset POS
        this.clearCart();
        document.getElementById('pos-transfer-check').checked = false;
        this.renderPosProducts();
        this.updateLowStockBadge();

        this.showToast(`¡Venta ${ticketNum} procesada con éxito! ($${this.formatMoney(total)})`, 'success');
    }

    renderTicketContent(sale) {
        const storeInfo = this.getStorage('storeInfo') || {};
        const container = document.getElementById('printable-ticket');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center font-bold text-sm uppercase tracking-wider border-b border-black pb-2 mb-2">
                ${storeInfo.name}<br>
                <span class="text-[10px] font-normal">NIT: ${storeInfo.nit}</span><br>
                <span class="text-[10px] font-normal">${storeInfo.address}</span>
            </div>
            <div class="mb-2 text-[11px]">
                <p><strong>TICKET N°:</strong> ${sale.ticketNumber}</p>
                <p><strong>FECHA:</strong> ${sale.dateFormatted}</p>
                <p><strong>VENDEDOR:</strong> ${sale.sellerName}</p>
                <p><strong>PAGO:</strong> ${sale.paymentMethod} ${sale.transferVerified ? '(Verificado Manual)' : ''}</p>
            </div>
            <table class="w-full text-left text-[11px] mb-2 border-t border-b border-black py-1">
                <thead>
                    <tr>
                        <th>CANT/PRENDA</th>
                        <th class="text-right">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map(i => `
                        <tr>
                            <td>${i.quantity}x ${i.name} (${i.sku})</td>
                            <td class="text-right">${this.formatMoney(i.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="text-right text-[11px] space-y-0.5 font-bold">
                <p>Subtotal: ${this.formatMoney(sale.subtotal)}</p>
                <p>IVA (19%): ${this.formatMoney(sale.tax)}</p>
                <p>Descuento: -${this.formatMoney(sale.discount)}</p>
                <p class="text-sm border-t border-black pt-1">TOTAL: ${this.formatMoney(sale.total)}</p>
            </div>
            <div class="text-center text-[10px] mt-4 pt-2 border-t border-dashed border-black">
                ¡Gracias por tu compra en Vogue & Style!<br>
                Conservar este ticket para cambios (Max 15 días).
            </div>
        `;

        this.openModal('modal-ticket');
    }

    viewTicketModal(saleId) {
        const sales = this.getStorage('sales') || [];
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
            this.renderTicketContent(sale);
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    // ==========================================
    // SECCIÓN 4: PROVEEDORES & COMPRAS POR LOTE
    // ==========================================
    renderSuppliers() {
        const suppliers = this.getStorage('suppliers') || [];
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;

        tbody.innerHTML = suppliers.map(s => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-2.5 px-3">
                    <strong class="text-slate-800 font-bold block">${s.name}</strong>
                    <span class="text-slate-400 font-mono text-[10px]">NIT: ${s.nit}</span>
                </td>
                <td class="py-2.5 px-3">
                    <p class="text-slate-700">${s.phone}</p>
                    <span class="text-slate-400 text-[10px] block">${s.email}</span>
                </td>
                <td class="py-2.5 px-3 text-slate-700">${s.city}</td>
                <td class="py-2.5 px-3 text-center">
                    <button onclick="app.deleteSupplier('${s.id}')" class="text-rose-600 hover:text-rose-800 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');

        this.refreshIcons();
    }

    renderBatchesHistory() {
        const batches = this.getStorage('batches') || [];
        const tbody = document.getElementById('batches-tbody');
        if (!tbody) return;

        tbody.innerHTML = batches.map(b => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-2.5 px-3 font-bold text-slate-800">${b.batchNumber}</td>
                <td class="py-2.5 px-3 text-slate-700">${b.supplierName}</td>
                <td class="py-2.5 px-3 text-slate-500">${b.date}</td>
                <td class="py-2.5 px-3 text-right font-extrabold text-slate-900">${this.formatMoney(b.totalCost)}</td>
            </tr>
        `).join('');
    }

    openSupplierModal() {
        document.getElementById('form-supplier')?.reset();
        this.openModal('modal-supplier');
    }

    saveSupplier(e) {
        e.preventDefault();
        const suppliers = this.getStorage('suppliers') || [];
        const newSup = {
            id: `SUP-${Date.now().toString().slice(-4)}`,
            name: document.getElementById('sup-name').value.trim(),
            nit: document.getElementById('sup-nit').value.trim(),
            phone: document.getElementById('sup-phone').value.trim(),
            city: document.getElementById('sup-city').value.trim(),
            email: document.getElementById('sup-email').value.trim()
        };

        suppliers.unshift(newSup);
        this.setStorage('suppliers', suppliers);
        this.closeModal('modal-supplier');
        this.renderSuppliers();
        this.showToast('Proveedor registrado con éxito', 'success');
    }

    deleteSupplier(id) {
        if (!confirm('¿Eliminar proveedor?')) return;
        let suppliers = this.getStorage('suppliers') || [];
        suppliers = suppliers.filter(s => s.id !== id);
        this.setStorage('suppliers', suppliers);
        this.renderSuppliers();
        this.showToast('Proveedor eliminado', 'info');
    }

    openBatchModal() {
        const form = document.getElementById('form-batch');
        if (form) form.reset();

        // Cargar proveedores en select
        const suppliers = this.getStorage('suppliers') || [];
        const select = document.getElementById('batch-supplier');
        if (select) {
            select.innerHTML = suppliers.map(s => `<option value="${s.id}">${s.name} (${s.nit})</option>`).join('');
        }

        // Limpiar filas de artículos
        const container = document.getElementById('batch-items-container');
        if (container) {
            container.innerHTML = '';
            this.addBatchRow(); // Fila inicial
        }

        this.openModal('modal-batch');
    }

    addBatchRow() {
        const container = document.getElementById('batch-items-container');
        if (!container) return;

        const products = this.getStorage('products') || [];
        const rowId = `batch-row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

        const row = document.createElement('div');
        row.className = 'grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200';
        row.id = rowId;

        row.innerHTML = `
            <div class="col-span-5">
                <select class="batch-row-prod w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs">
                    ${products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('')}
                </select>
            </div>
            <div class="col-span-3">
                <input type="number" min="1" value="10" placeholder="Cant" class="batch-row-qty w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-center" onchange="app.calculateBatchTotal()">
            </div>
            <div class="col-span-3">
                <input type="number" min="0" value="25000" placeholder="Costo Unit ($)" class="batch-row-cost w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-right" onchange="app.calculateBatchTotal()">
            </div>
            <div class="col-span-1 text-center">
                <button type="button" onclick="document.getElementById('${rowId}').remove(); app.calculateBatchTotal();" class="text-rose-500 hover:text-rose-700 font-bold text-sm">×</button>
            </div>
        `;

        container.appendChild(row);
        this.calculateBatchTotal();
    }

    calculateBatchTotal() {
        let total = 0;
        document.querySelectorAll('#batch-items-container > div').forEach(row => {
            const qty = parseFloat(row.querySelector('.batch-row-qty')?.value || 0);
            const cost = parseFloat(row.querySelector('.batch-row-cost')?.value || 0);
            total += qty * cost;
        });

        const display = document.getElementById('batch-total-cost-display');
        if (display) display.textContent = this.formatMoney(total);
    }

    saveBatch(e) {
        e.preventDefault();
        const suppliers = this.getStorage('suppliers') || [];
        const products = this.getStorage('products') || [];
        const batches = this.getStorage('batches') || [];

        const supId = document.getElementById('batch-supplier').value;
        const supplier = suppliers.find(s => s.id === supId);
        const batchRef = document.getElementById('batch-ref').value.trim();

        const itemRows = document.querySelectorAll('#batch-items-container > div');
        if (itemRows.length === 0) {
            this.showToast('Debe incluir al menos un producto en el lote.', 'warning');
            return;
        }

        const batchItems = [];
        let totalBatchCost = 0;

        itemRows.forEach(row => {
            const prodId = row.querySelector('.batch-row-prod').value;
            const qty = parseInt(row.querySelector('.batch-row-qty').value) || 0;
            const unitCost = parseFloat(row.querySelector('.batch-row-cost').value) || 0;

            const product = products.find(p => p.id === prodId);
            if (product && qty > 0) {
                // INCREMENTAR STOCK AUTOMÁTICAMENTE
                product.stock += qty;
                product.costPrice = unitCost; // Actualizar costo de compra de referencia

                const rowTotal = qty * unitCost;
                totalBatchCost += rowTotal;

                batchItems.push({
                    productId: prodId,
                    sku: product.sku,
                    productName: product.name,
                    quantity: qty,
                    unitCost,
                    totalCost: rowTotal
                });
            }
        });

        this.setStorage('products', products);

        const newBatch = {
            id: `LOT-${Date.now().toString().slice(-4)}`,
            batchNumber: batchRef,
            supplierId: supId,
            supplierName: supplier ? supplier.name : 'Proveedor',
            date: new Date().toISOString().split('T')[0],
            totalCost: totalBatchCost,
            items: batchItems
        };

        batches.unshift(newBatch);
        this.setStorage('batches', batches);

        this.closeModal('modal-batch');
        this.renderBatchesHistory();
        this.renderInventory();
        this.updateLowStockBadge();
        this.showToast(`Lote ${batchRef} guardado. ¡Stock incrementado y egreso registrado!`, 'success');
    }

    // ==========================================
    // SECCIÓN 5: DEVOLUCIONES
    // ==========================================
    searchTicketForReturn() {
        const ticketNum = (document.getElementById('return-search-ticket')?.value || '').trim().toUpperCase();
        if (!ticketNum) return;

        const sales = this.getStorage('sales') || [];
        const sale = sales.find(s => s.ticketNumber === ticketNum || s.id === ticketNum);

        const detailsBox = document.getElementById('return-ticket-details');
        if (!sale) {
            this.showToast(`No se encontró el ticket ${ticketNum}`, 'error');
            if (detailsBox) detailsBox.classList.add('hidden');
            return;
        }

        document.getElementById('return-ticket-num').textContent = sale.ticketNumber;
        document.getElementById('return-ticket-date').textContent = new Date(sale.date).toLocaleDateString('es-CO');
        document.getElementById('return-ticket-seller').textContent = sale.sellerName;
        document.getElementById('return-ticket-total').textContent = this.formatMoney(sale.total);

        const tbody = document.getElementById('return-items-tbody');
        if (tbody) {
            tbody.innerHTML = sale.items.map(item => `
                <tr class="hover:bg-slate-50">
                    <td class="py-2 px-3 text-center">
                        <input type="checkbox" class="return-item-check rounded text-indigo-600" data-prod-id="${item.productId}">
                    </td>
                    <td class="py-2 px-3 font-semibold text-slate-800">${item.name} (${item.sku})</td>
                    <td class="py-2 px-3 text-center font-bold">${item.quantity}</td>
                    <td class="py-2 px-3 text-center">
                        <input type="number" min="1" max="${item.quantity}" value="1" class="return-item-qty w-16 px-2 py-1 bg-slate-50 border rounded text-center" data-prod-id="${item.productId}">
                    </td>
                    <td class="py-2 px-3 text-right font-extrabold text-indigo-600">${this.formatMoney(item.unitPrice)}</td>
                </tr>
            `).join('');
        }

        detailsBox.classList.remove('hidden');
    }

    confirmReturn() {
        const ticketNum = document.getElementById('return-ticket-num').textContent;
        const sales = this.getStorage('sales') || [];
        const products = this.getStorage('products') || [];
        const returns = this.getStorage('returns') || [];

        const sale = sales.find(s => s.ticketNumber === ticketNum);
        if (!sale) return;

        const checkedBoxes = document.querySelectorAll('.return-item-check:checked');
        if (checkedBoxes.length === 0) {
            this.showToast('Seleccione al menos una prenda para devolver.', 'warning');
            return;
        }

        let totalRefund = 0;
        const returnedItems = [];

        checkedBoxes.forEach(chk => {
            const prodId = chk.getAttribute('data-prod-id');
            const qtyInput = document.querySelector(`.return-item-qty[data-prod-id="${prodId}"]`);
            const returnQty = parseInt(qtyInput?.value || 1);

            const saleItem = sale.items.find(i => i.productId === prodId);
            const product = products.find(p => p.id === prodId);

            if (saleItem && product) {
                // REINTEGRAR AL INVENTARIO
                product.stock += returnQty;
                const refundItemCost = saleItem.unitPrice * returnQty;
                totalRefund += refundItemCost;

                returnedItems.push({
                    productId: prodId,
                    sku: product.sku,
                    name: product.name,
                    quantity: returnQty,
                    unitPrice: saleItem.unitPrice,
                    refundTotal: refundItemCost
                });
            }
        });

        this.setStorage('products', products);

        // Registrar devolución
        const reason = document.getElementById('return-reason-select').value;
        const returnRecord = {
            id: `RET-${Date.now().toString().slice(-4)}`,
            ticketNumber: ticketNum,
            date: new Date().toISOString().split('T')[0],
            reason,
            refundAmount: totalRefund,
            items: returnedItems
        };

        returns.unshift(returnRecord);
        this.setStorage('returns', returns);

        // Actualizar estado de la venta
        sale.status = 'Devuelta';
        this.setStorage('sales', sales);

        document.getElementById('return-ticket-details').classList.add('hidden');
        this.renderReturnsHistory();
        this.renderInventory();
        this.showToast(`Devolución procesada. ¡Stock reintegrado! Reembolso: $${this.formatMoney(totalRefund)}`, 'success');
    }

    renderReturnsHistory() {
        const returns = this.getStorage('returns') || [];
        const tbody = document.getElementById('returns-history-tbody');
        if (!tbody) return;

        if (returns.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400">No hay devoluciones procesadas.</td></tr>`;
            return;
        }

        tbody.innerHTML = returns.map(r => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-2.5 px-3 font-bold text-slate-800">${r.ticketNumber}</td>
                <td class="py-2.5 px-3 text-slate-500">${r.date}</td>
                <td class="py-2.5 px-3 font-semibold text-amber-700">${r.reason}</td>
                <td class="py-2.5 px-3 text-right font-extrabold text-rose-600">${this.formatMoney(r.refundAmount)}</td>
            </tr>
        `).join('');
    }

    // ==========================================
    // SECCIÓN 6: CUENTAS & FINANZAS MENSUALES
    // ==========================================
    renderFinanceLedger() {
        const sales = this.getStorage('sales') || [];
        const batches = this.getStorage('batches') || [];
        const returns = this.getStorage('returns') || [];

        const totalIncome = sales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalExpenses = batches.reduce((sum, b) => sum + (b.totalCost || 0), 0);
        const totalRefunds = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);

        const netIncome = totalIncome - totalRefunds;
        const netProfit = netIncome - totalExpenses;
        const profitMargin = netIncome > 0 ? ((netProfit / netIncome) * 100).toFixed(1) : 0;

        document.getElementById('fin-total-income').textContent = this.formatMoney(netIncome);
        document.getElementById('fin-total-expenses').textContent = this.formatMoney(totalExpenses);
        
        const profitEl = document.getElementById('fin-net-profit');
        if (profitEl) {
            profitEl.textContent = this.formatMoney(netProfit);
            profitEl.className = `text-2xl font-extrabold mt-1 font-heading ${netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`;
        }

        document.getElementById('fin-profit-margin').textContent = `${profitMargin}%`;

        // Renderizar Libro Diario de Movimientos
        const movements = [];

        sales.forEach(s => {
            movements.push({
                date: s.dateFormatted || s.date,
                type: 'Ingreso (Venta)',
                ref: s.ticketNumber,
                amount: s.total,
                isIncome: true
            });
        });

        batches.forEach(b => {
            movements.push({
                date: b.date,
                type: 'Egreso (Lote)',
                ref: `${b.batchNumber} (${b.supplierName})`,
                amount: -b.totalCost,
                isIncome: false
            });
        });

        returns.forEach(r => {
            movements.push({
                date: r.date,
                type: 'Egreso (Devolución)',
                ref: `Reembolso ${r.ticketNumber}`,
                amount: -r.refundAmount,
                isIncome: false
            });
        });

        const tbody = document.getElementById('finance-ledger-tbody');
        if (!tbody) return;

        tbody.innerHTML = movements.map(m => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-2.5 px-3 text-slate-500 font-mono">${m.date}</td>
                <td class="py-2.5 px-3">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${m.isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                        ${m.type}
                    </span>
                </td>
                <td class="py-2.5 px-3 font-medium text-slate-800">${m.ref}</td>
                <td class="py-2.5 px-3 text-right font-extrabold ${m.isIncome ? 'text-emerald-600' : 'text-rose-600'}">
                    ${m.isIncome ? '+' : ''}${this.formatMoney(m.amount)}
                </td>
            </tr>
        `).join('');
    }

    // ==========================================
    // SECCIÓN 7: GESTIÓN DE USUARIOS
    // ==========================================
    renderUsers() {
        const users = this.getStorage('users') || [];
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;

        tbody.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-5 font-bold text-slate-900">${u.fullName}</td>
                <td class="py-3 px-5 text-slate-600">
                    <span class="font-mono text-xs block">${u.username}</span>
                    <span class="text-xs text-slate-400 block">${u.email}</span>
                </td>
                <td class="py-3 px-5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'Administrador' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}">
                        ${u.role}
                    </span>
                </td>
                <td class="py-3 px-5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        ${u.status || 'Activo'}
                    </span>
                </td>
                <td class="py-3 px-5 text-center">
                    <button onclick="app.setActiveUser('${u.id}')" class="text-xs font-bold text-indigo-600 hover:underline">
                        Usar Perfil
                    </button>
                </td>
            </tr>
        `).join('');
    }

    openUserModal() {
        document.getElementById('form-user')?.reset();
        this.openModal('modal-user');
    }

    saveUser(e) {
        e.preventDefault();
        const users = this.getStorage('users') || [];

        const newUser = {
            id: `USR-${Date.now().toString().slice(-4)}`,
            fullName: document.getElementById('usr-fullname').value.trim(),
            email: document.getElementById('usr-email').value.trim(),
            username: document.getElementById('usr-username').value.trim(),
            role: document.getElementById('usr-role').value,
            status: 'Activo'
        };

        users.push(newUser);
        this.setStorage('users', users);
        this.closeModal('modal-user');
        this.renderUsers();
        this.renderUserSelectorDropdown();
        this.showToast('Usuario registrado con éxito', 'success');
    }

    // ==========================================
    // SECCIÓN 8: REPORTES & ANALÍTICA
    // ==========================================
    renderReports() {
        const sales = this.getStorage('sales') || [];
        const products = this.getStorage('products') || [];

        // Top Productos vendidos
        const productSalesMap = {};
        sales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    if (!productSalesMap[item.name]) {
                        productSalesMap[item.name] = { qty: 0, revenue: 0, sku: item.sku };
                    }
                    productSalesMap[item.name].qty += item.quantity;
                    productSalesMap[item.name].revenue += item.subtotal;
                });
            }
        });

        const topProducts = Object.entries(productSalesMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        const topTbody = document.getElementById('report-top-products-tbody');
        if (topTbody) {
            topTbody.innerHTML = topProducts.map((p, idx) => `
                <tr class="hover:bg-slate-50">
                    <td class="py-2.5 px-3">
                        <span class="font-bold text-slate-800">#${idx + 1} ${p.name}</span>
                        <span class="text-[10px] text-slate-400 font-mono block">${p.sku}</span>
                    </td>
                    <td class="py-2.5 px-3 text-center font-extrabold text-indigo-600">${p.qty} unid</td>
                    <td class="py-2.5 px-3 text-right font-bold text-slate-900">${this.formatMoney(p.revenue)}</td>
                </tr>
            `).join('');
        }

        // Reporte de Stock Crítico
        const critical = products.filter(p => p.stock < (p.minStock || 5));
        const critTbody = document.getElementById('report-critical-stock-tbody');
        if (critTbody) {
            if (critical.length === 0) {
                critTbody.innerHTML = `<tr><td colspan="3" class="py-4 text-center text-emerald-600 font-bold text-xs">¡Excelente! No hay prendas con stock crítico.</td></tr>`;
            } else {
                critTbody.innerHTML = critical.map(p => `
                    <tr class="hover:bg-slate-50">
                        <td class="py-2.5 px-3">
                            <strong class="text-slate-800 block">${p.name}</strong>
                            <span class="text-[10px] text-slate-400 font-mono">${p.sku}</span>
                        </td>
                        <td class="py-2.5 px-3 text-center">
                            <span class="badge-stock-critical text-[10px] px-2 py-0.5 rounded-full font-bold">${p.stock} unid</span>
                        </td>
                        <td class="py-2.5 px-3 text-center font-bold text-indigo-600">
                            +${Math.max(15, (p.minStock || 5) * 3 - p.stock)} sugeridos
                        </td>
                    </tr>
                `).join('');
            }
        }
    }
}

// Instanciar motor globalmente al cargar ventana
window.addEventListener('DOMContentLoaded', () => {
    window.app = new AppEngine();
});
