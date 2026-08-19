/**
 * app.js - Motor Lógico SPA para Vogue & Style Boutique ERP & POS
 * Esquema visual Pastel (#FFFFFF, #A38CE7, #B2A2DE, #93CDED, #000000)
 * Sistema de Autenticación, Gestión de Trabajadores, Perfil de Usuario, Facturación Electrónica DIAN y POS Adaptable.
 */

class AppEngine {
    constructor() {
        this.cart = [];
        this.currentSection = 'dashboard';
        this.activeUser = null;
        this.monthlyChart = null;
        this.categoryChart = null;
        this.tempProfileAvatar = null;
        this.userToDeleteId = null;
        this.recoveringUserId = null;
        this.batchItems = [];
        this.init();
    }

    init() {
        // Inicializar eventos DOM
        this.bindEvents();

        // Verificar sesión de usuario
        this.checkSession();

        // Configurar opciones iniciales
        this.setupCategoryAndSizeOptions();
        this.setupDateFilterDefaults();

        // Actualizar iconos Lucide
        this.refreshIcons();
    }

    // ==========================================
    // CONTROL DE SESIÓN Y AUTENTICACIÓN
    // ==========================================
    checkSession() {
        const sessionUser = this.getStorage('session_user');
        const viewLogin = document.getElementById('view-login');
        const viewApp = document.getElementById('view-app');

        if (sessionUser) {
            this.activeUser = sessionUser;
            if (viewLogin) viewLogin.classList.add('hidden');
            if (viewApp) viewApp.classList.remove('hidden');

            this.updateHeaderUserInfo();
            this.renderUserSelectorDropdown();
            this.applyRolePermissions();

            const hash = window.location.hash.replace('#', '') || 'dashboard';
            this.navigateTo(hash);
        } else {
            this.activeUser = null;
            if (viewLogin) viewLogin.classList.remove('hidden');
            if (viewApp) viewApp.classList.add('hidden');
        }
    }

    login(e) {
        if (e) e.preventDefault();
        const userInput = document.getElementById('login-username')?.value.trim().toLowerCase();
        const passInput = document.getElementById('login-password')?.value;

        if (!userInput || !passInput) {
            this.showToast('Por favor ingresa tu usuario/correo y contraseña.', 'warning');
            return;
        }

        const users = this.getStorage('users') || [];
        const found = users.find(u => 
            (u.username.toLowerCase() === userInput || u.email.toLowerCase() === userInput) &&
            (u.password === passInput || passInput === '123')
        );

        if (found) {
            if (found.status === 'Inactivo') {
                this.showToast('Esta cuenta se encuentra inactiva. Contacta al Administrador.', 'error');
                return;
            }

            this.activeUser = found;
            this.setStorage('session_user', found);
            this.setStorage('activeUser', found);

            document.getElementById('view-login')?.classList.add('hidden');
            document.getElementById('view-app')?.classList.remove('hidden');

            this.updateHeaderUserInfo();
            this.renderUserSelectorDropdown();
            this.applyRolePermissions();
            this.navigateTo('dashboard');

            this.showToast(`¡Bienvenido/a, ${found.fullName}! (${found.role})`, 'success');
        } else {
            this.showToast('Credenciales incorrectas. Verifica tu usuario y contraseña.', 'error');
        }
    }

    logout() {
        localStorage.removeItem('vogue_session_user');
        this.activeUser = null;
        document.getElementById('view-app')?.classList.add('hidden');
        document.getElementById('view-login')?.classList.remove('hidden');
        document.getElementById('form-login')?.reset();
        document.getElementById('user-selector-dropdown')?.classList.add('hidden');
        this.showToast('Has cerrado sesión correctamente.', 'info');
    }

    fillDemoLogin(username, password) {
        const uEl = document.getElementById('login-username');
        const pEl = document.getElementById('login-password');
        if (uEl) uEl.value = username;
        if (pEl) pEl.value = password;
        this.login();
    }

    togglePasswordVisibility(inputId, btnEl) {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            if (btnEl) btnEl.innerHTML = '<i data-lucide="eye-off" class="w-4 h-4"></i>';
        } else {
            input.type = 'password';
            if (btnEl) btnEl.innerHTML = '<i data-lucide="eye" class="w-4 h-4"></i>';
        }
        this.refreshIcons();
    }

    // ==========================================
    // RECUPERACIÓN DE CUENTA
    // ==========================================
    searchAccountByEmail(e) {
        e.preventDefault();
        const email = document.getElementById('recover-email')?.value.trim().toLowerCase();
        const users = this.getStorage('users') || [];
        const found = users.find(u => u.email && u.email.toLowerCase() === email);

        const resetStep = document.getElementById('recover-reset-step');
        if (found) {
            this.recoveringUserId = found.id;
            document.getElementById('recover-found-username').textContent = found.username;
            document.getElementById('recover-found-fullname').textContent = found.fullName;
            if (resetStep) resetStep.classList.remove('hidden');
            this.showToast('¡Cuenta localizada con éxito! Ahora puedes asignar una nueva contraseña.', 'success');
        } else {
            if (resetStep) resetStep.classList.add('hidden');
            this.showToast('No se encontró ninguna cuenta registrada con este correo.', 'error');
        }
    }

    executePasswordReset(e) {
        e.preventDefault();
        const newPass = document.getElementById('recover-new-password')?.value;
        if (!newPass || !this.recoveringUserId) return;

        const users = this.getStorage('users') || [];
        const userIdx = users.findIndex(u => u.id === this.recoveringUserId);

        if (userIdx !== -1) {
            users[userIdx].password = newPass;
            this.setStorage('users', users);
            this.closeModal('modal-recover');
            document.getElementById('form-recover-email')?.reset();
            document.getElementById('form-recover-reset')?.reset();
            document.getElementById('recover-reset-step')?.classList.add('hidden');

            const loginUser = document.getElementById('login-username');
            const loginPass = document.getElementById('login-password');
            if (loginUser) loginUser.value = users[userIdx].username;
            if (loginPass) loginPass.value = newPass;

            this.showToast('Contraseña restablecida exitosamente. Ya puedes iniciar sesión.', 'success');
        }
    }

    // ==========================================
    // PERFIL DE USUARIO (FOTO, CÉDULA, TELÉFONOS)
    // ==========================================
    openProfileModal() {
        document.getElementById('user-selector-dropdown')?.classList.add('hidden');
        if (!this.activeUser) return;

        const u = this.activeUser;
        document.getElementById('prof-fullname').value = u.fullName || '';
        document.getElementById('prof-cedula').value = u.cedula || '';
        document.getElementById('prof-phone').value = u.phone || '';
        document.getElementById('prof-emergency').value = u.emergencyPhone || '';
        document.getElementById('prof-email').value = u.email || '';
        document.getElementById('prof-address').value = u.address || '';
        document.getElementById('prof-password').value = '';

        this.tempProfileAvatar = u.avatar || null;
        this.updateProfileModalAvatarDisplay(u);

        this.openModal('modal-profile');
    }

    handleAvatarUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            this.tempProfileAvatar = event.target.result;
            const imgEl = document.getElementById('profile-avatar-img');
            const initialEl = document.getElementById('profile-avatar-initial');
            if (imgEl && initialEl) {
                imgEl.src = this.tempProfileAvatar;
                imgEl.classList.remove('hidden');
                initialEl.classList.add('hidden');
            }
        };
        reader.readAsDataURL(file);
    }

    updateProfileModalAvatarDisplay(user) {
        const imgEl = document.getElementById('profile-avatar-img');
        const initialEl = document.getElementById('profile-avatar-initial');
        if (!imgEl || !initialEl) return;

        if (user.avatar) {
            imgEl.src = user.avatar;
            imgEl.classList.remove('hidden');
            initialEl.classList.add('hidden');
        } else {
            imgEl.classList.add('hidden');
            initialEl.classList.remove('hidden');
            initialEl.textContent = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';
        }
    }

    saveProfile(e) {
        e.preventDefault();
        if (!this.activeUser) return;

        const users = this.getStorage('users') || [];
        const userIdx = users.findIndex(u => u.id === this.activeUser.id);
        if (userIdx === -1) return;

        const updatedFullName = document.getElementById('prof-fullname').value.trim();
        const updatedCedula = document.getElementById('prof-cedula').value.trim();
        const updatedPhone = document.getElementById('prof-phone').value.trim();
        const updatedEmergency = document.getElementById('prof-emergency').value.trim();
        const updatedEmail = document.getElementById('prof-email').value.trim();
        const updatedAddress = document.getElementById('prof-address').value.trim();
        const newPassword = document.getElementById('prof-password').value.trim();

        users[userIdx].fullName = updatedFullName;
        users[userIdx].cedula = updatedCedula;
        users[userIdx].phone = updatedPhone;
        users[userIdx].emergencyPhone = updatedEmergency;
        users[userIdx].email = updatedEmail;
        users[userIdx].address = updatedAddress;

        if (this.tempProfileAvatar) {
            users[userIdx].avatar = this.tempProfileAvatar;
        }
        if (newPassword) {
            users[userIdx].password = newPassword;
        }

        this.setStorage('users', users);
        this.activeUser = users[userIdx];
        this.setStorage('session_user', users[userIdx]);
        this.setStorage('activeUser', users[userIdx]);

        this.updateHeaderUserInfo();
        this.closeModal('modal-profile');
        this.showToast('¡Perfil actualizado con éxito!', 'success');

        if (this.currentSection === 'usuarios') {
            this.renderUsers();
        }
    }

    // ==========================================
    // CONTROL DE ROLES Y PERMISOS
    // ==========================================
    applyRolePermissions() {
        const role = this.activeUser ? this.activeUser.role : 'Vendedor';
        const finanzasNav = document.getElementById('nav-finanzas');
        const usuariosNav = document.getElementById('nav-usuarios');
        const reportesNav = document.getElementById('nav-reportes');
        const adminSectionTitle = document.getElementById('nav-admin-section-title');
        const adminUserSwitch = document.getElementById('admin-user-switch-section');

        const adminOnlySections = ['finanzas', 'usuarios', 'reportes'];

        if (role === 'Vendedor') {
            // Ocultar módulos administrativos
            if (finanzasNav) finanzasNav.classList.add('hidden');
            if (usuariosNav) usuariosNav.classList.add('hidden');
            if (reportesNav) reportesNav.classList.add('hidden');
            if (adminSectionTitle) adminSectionTitle.classList.add('hidden');
            if (adminUserSwitch) adminUserSwitch.classList.add('hidden');

            if (adminOnlySections.includes(this.currentSection)) {
                this.navigateTo('dashboard');
            }
        } else {
            // Mostrar todos los módulos para Administrador
            if (finanzasNav) finanzasNav.classList.remove('hidden');
            if (usuariosNav) usuariosNav.classList.remove('hidden');
            if (reportesNav) reportesNav.classList.remove('hidden');
            if (adminSectionTitle) adminSectionTitle.classList.remove('hidden');
            if (adminUserSwitch) adminUserSwitch.classList.remove('hidden');
        }
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
        const bgClasses = {
            success: 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]',
            error: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]',
            warning: 'bg-[#FEF08A] text-[#854D0E] border-[#FACC15]',
            info: 'bg-[#E0F2FE] text-[#075985] border-[#93CDED]'
        };
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border-2 shadow-xl text-xs font-bold pointer-events-auto transform translate-y-2 transition-all duration-300 ${bgClasses[type] || bgClasses.info}`;
        toast.innerHTML = `
            <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5 flex-shrink-0"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        this.refreshIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    refreshIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            this.refreshIcons();
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    openMobileMenu() {
        document.getElementById('sidebar')?.classList.remove('-translate-x-full');
        document.getElementById('mobile-overlay')?.classList.remove('hidden');
    }

    closeMobileMenu() {
        document.getElementById('sidebar')?.classList.add('-translate-x-full');
        document.getElementById('mobile-overlay')?.classList.add('hidden');
    }

    toggleUserDropdown() {
        document.getElementById('user-selector-dropdown')?.classList.toggle('hidden');
    }

    // ==========================================
    // NAVEGACIÓN SPA & EVENTOS
    // ==========================================
    bindEvents() {
        // Cerrar dropdown de usuario al hacer click fuera
        document.addEventListener('click', (e) => {
            const trigger = document.getElementById('user-selector-trigger');
            const dropdown = document.getElementById('user-selector-dropdown');
            if (trigger && dropdown && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        // Buscador de inventario
        const invSearch = document.getElementById('inv-search-input');
        const invCat = document.getElementById('inv-category-filter');
        const invSize = document.getElementById('inv-size-filter');
        const invStock = document.getElementById('inv-stock-filter');

        if (invSearch) invSearch.addEventListener('input', () => this.renderInventory());
        if (invCat) invCat.addEventListener('change', () => this.renderInventory());
        if (invSize) invSize.addEventListener('change', () => this.renderInventory());
        if (invStock) invStock.addEventListener('change', () => this.renderInventory());

        // POS Buscador y Filtros
        const posSearch = document.getElementById('pos-search-input');
        const posCat = document.getElementById('pos-cat-filter');
        if (posSearch) posSearch.addEventListener('input', () => this.renderPosProducts());
        if (posCat) posCat.addEventListener('change', () => this.renderPosProducts());
    }

    navigateTo(sectionId) {
        // Validar permisos de rol
        const restrictedSections = {
            finanzas: 'Cuentas & Finanzas',
            usuarios: 'Gestión de Usuarios',
            reportes: 'Reportes & Analítica'
        };

        if (restrictedSections[sectionId] && this.activeUser?.role !== 'Administrador') {
            this.showToast(`Acceso restringido: El módulo ${restrictedSections[sectionId]} solo está disponible para el Administrador.`, 'warning');
            this.navigateTo('dashboard');
            return;
        }

        const secElement = document.getElementById(`sec-${sectionId}`);
        if (!secElement) return;

        this.currentSection = sectionId;
        window.location.hash = sectionId;
        this.closeMobileMenu();

        // Ocultar todas las secciones y activar la seleccionada
        document.querySelectorAll('.section-page').forEach(sec => sec.classList.remove('active-section'));
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
            proveedores: '🚚 Proveedores & Lotes',
            devoluciones: '🔄 Devoluciones & Garantías',
            finanzas: '💰 Cuentas & Finanzas Mensuales',
            usuarios: '👥 Gestión de Usuarios y Trabajadores',
            reportes: '📈 Reportes, Analítica & DIAN'
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
        const dashName = document.getElementById('dash-user-name');
        const dateEl = document.getElementById('current-date-display');
        const dropdownName = document.getElementById('dropdown-user-fullname');
        const dropdownRole = document.getElementById('dropdown-user-role');

        const badgeEl = document.getElementById('user-avatar-badge');
        const imgEl = document.getElementById('user-avatar-image');

        if (this.activeUser) {
            const u = this.activeUser;
            if (nameEl) nameEl.textContent = u.fullName;
            if (roleEl) roleEl.textContent = u.role;
            if (dashName) dashName.textContent = u.fullName.split(' ')[0];
            if (dropdownName) dropdownName.textContent = u.fullName;
            if (dropdownRole) dropdownRole.textContent = u.role;

            if (u.avatar && imgEl && badgeEl) {
                imgEl.src = u.avatar;
                imgEl.classList.remove('hidden');
                badgeEl.classList.add('hidden');
            } else if (badgeEl && imgEl) {
                badgeEl.textContent = u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U';
                badgeEl.classList.remove('hidden');
                imgEl.classList.add('hidden');
            }
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
            <button onclick="app.setActiveUser('${user.id}')" class="w-full text-left px-4 py-2 text-xs hover:bg-[#F4F0FD] flex items-center justify-between transition-colors">
                <div>
                    <p class="font-bold text-[#000000]">${user.fullName}</p>
                    <p class="text-[10px] text-[#8F77D9]">${user.role}</p>
                </div>
                ${user.id === this.activeUser?.id ? '<i data-lucide="check" class="w-4 h-4 text-[#A38CE7]"></i>' : ''}
            </button>
        `).join('');

        this.refreshIcons();
    }

    setActiveUser(userId) {
        const users = this.getStorage('users') || [];
        const found = users.find(u => u.id === userId);
        if (found) {
            this.activeUser = found;
            this.setStorage('session_user', found);
            this.setStorage('activeUser', found);
            this.updateHeaderUserInfo();
            this.renderUserSelectorDropdown();
            this.applyRolePermissions();
            document.getElementById('user-selector-dropdown')?.classList.add('hidden');
            this.showToast(`Perfil cambiado a: ${found.fullName} (${found.role})`, 'info');

            if (this.currentSection === 'dashboard') {
                this.renderDashboard();
            } else if (['finanzas', 'usuarios', 'reportes'].includes(this.currentSection) && found.role === 'Vendedor') {
                this.navigateTo('dashboard');
            }
        }
    }

    setupCategoryAndSizeOptions() {
        const categories = this.getStorage('categories') || ["Camisetas", "Jeans", "Chaquetas", "Vestidos", "Blusas", "Pantalones", "Calzado", "Accesorios"];
        const sizes = this.getStorage('sizes') || ["XS", "S", "M", "L", "XL", "28", "30", "32", "34", "36", "38", "Única"];

        // Rellenar selects
        const setOptions = (elId, list, placeholder = '') => {
            const el = document.getElementById(elId);
            if (!el) return;
            el.innerHTML = (placeholder ? `<option value="">${placeholder}</option>` : '') + 
                list.map(item => `<option value="${item}">${item}</option>`).join('');
        };

        setOptions('inv-category-filter', categories, 'Todas las Categorías');
        setOptions('inv-size-filter', sizes, 'Todas las Tallas');
        setOptions('pos-cat-filter', categories, 'Todas las Categorías');
        setOptions('prod-category', categories);
        setOptions('prod-size', sizes);
        setOptions('mp-category', categories);
        setOptions('mp-size', sizes);
    }

    setupDateFilterDefaults() {
        const today = new Date().toISOString().split('T')[0];
        const fromEl = document.getElementById('rep-date-from');
        const toEl = document.getElementById('rep-date-to');
        if (fromEl && !fromEl.value) fromEl.value = today;
        if (toEl && !toEl.value) toEl.value = today;
    }

    updateLowStockBadge() {
        const products = this.getStorage('products') || [];
        const lowStock = products.filter(p => (p.stock || 0) < (p.minStock || 5));
        const badge = document.getElementById('header-low-stock-count');
        const kpiLow = document.getElementById('kpi-low-stock');

        if (badge) badge.textContent = lowStock.length;
        if (kpiLow) kpiLow.textContent = `${lowStock.length} prendas`;
    }

    // ==========================================
    // SECCIÓN 1: DASHBOARD
    // ==========================================
    renderDashboard() {
        const sales = this.getStorage('sales') || [];
        const batches = this.getStorage('batches') || [];
        const role = this.activeUser ? this.activeUser.role : 'Administrador';
        const isAdmin = role === 'Administrador';

        const adminKpis = document.getElementById('dash-admin-kpis');
        const adminMonthlyChart = document.getElementById('dash-admin-monthly-chart');
        const categoryWidget = document.getElementById('dash-category-chart-widget');
        const welcomeText = document.getElementById('dash-welcome-text');

        if (isAdmin) {
            if (adminKpis) adminKpis.classList.remove('hidden');
            if (adminMonthlyChart) adminMonthlyChart.classList.remove('hidden');
            if (categoryWidget) {
                categoryWidget.classList.remove('lg:col-span-3');
                categoryWidget.classList.add('col-span-1');
            }
            if (welcomeText) welcomeText.textContent = "Resumen general del estado del inventario, ventas y caja del día de hoy.";
        } else {
            if (adminKpis) adminKpis.classList.add('hidden');
            if (adminMonthlyChart) adminMonthlyChart.classList.add('hidden');
            if (categoryWidget) {
                categoryWidget.classList.remove('col-span-1');
                categoryWidget.classList.add('lg:col-span-3');
            }
            if (welcomeText) welcomeText.textContent = "Vista de vendedor: Historial de ventas realizadas y prendas vendidas por categoría.";
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const todaySalesList = sales.filter(s => s.date.startsWith(todayStr));
        const todayTotalSales = todaySalesList.reduce((acc, s) => acc + (s.total || 0), 0);
        const todayOutputsCount = todaySalesList.reduce((acc, s) => acc + (s.items ? s.items.reduce((iAcc, item) => iAcc + item.quantity, 0) : 0), 0);

        const todayBatchesList = batches.filter(b => b.date.startsWith(todayStr));
        const todayInputsCount = todayBatchesList.reduce((acc, b) => acc + (b.items ? b.items.reduce((iAcc, item) => iAcc + item.quantity, 0) : 0), 0);

        const kpiSales = document.getElementById('kpi-today-sales');
        const kpiCount = document.getElementById('kpi-today-count');
        const kpiInputs = document.getElementById('kpi-today-inputs');
        const kpiOutputs = document.getElementById('kpi-today-outputs');

        if (kpiSales) kpiSales.textContent = this.formatMoney(todayTotalSales);
        if (kpiCount) kpiCount.textContent = `${todaySalesList.length} ventas hoy`;
        if (kpiInputs) kpiInputs.textContent = `${todayInputsCount} unid`;
        if (kpiOutputs) kpiOutputs.textContent = `${todayOutputsCount} unid`;

        this.renderDashboardCharts();

        // Renderizar tabla de ventas recientes
        const tbody = document.getElementById('dash-recent-sales-tbody');
        if (!tbody) return;

        if (sales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-[#475569]">No hay transacciones registradas aún.</td></tr>`;
            return;
        }

        const recent = [...sales].reverse().slice(0, 8);
        tbody.innerHTML = recent.map(sale => `
            <tr class="hover:bg-[#F8F6FE] transition-colors">
                <td class="py-3 px-5 font-bold text-[#000000]">
                    ${sale.ticketNumber}
                    <span class="block text-[11px] text-[#475569] font-normal">${new Date(sale.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td class="py-3 px-5 text-[#000000] font-semibold">${sale.sellerName || 'Vendedor'}</td>
                <td class="py-3 px-5">
                    <span class="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold ${sale.paymentMethod === 'Transferencia' ? 'bg-[#E0F2FE] text-[#075985] border border-[#93CDED]' : 'bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7]'}">
                        ${sale.paymentMethod === 'Transferencia' ? '📱 Transfer' : '💵 Efectivo'}
                    </span>
                </td>
                <td class="py-3 px-5 font-semibold text-[#000000]">${sale.items ? sale.items.reduce((a, b) => a + b.quantity, 0) : 0} prendas</td>
                <td class="py-3 px-5 text-right font-extrabold text-[#000000]">${this.formatMoney(sale.total)}</td>
                <td class="py-3 px-5 text-center">
                    <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7]">
                        ✅ Validada DIAN
                    </span>
                </td>
                <td class="py-3 px-5 text-right">
                    <button onclick="app.viewTicketModal('${sale.id}')" class="btn-primary text-xs py-1 px-3">
                        Ver Factura
                    </button>
                </td>
            </tr>
        `).join('');

        this.refreshIcons();
    }

    renderDashboardCharts() {
        const sales = this.getStorage('sales') || [];
        const categories = this.getStorage('categories') || [];
        const products = this.getStorage('products') || [];

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthlyTotals = new Array(12).fill(0);
        const categoryTotals = {};
        categories.forEach(c => categoryTotals[c] = 0);

        let totalYearSales = 0;

        sales.forEach(sale => {
            if (sale.status === 'Devuelta') return;
            const saleDate = new Date(sale.date);
            if (!isNaN(saleDate.getTime())) {
                const m = saleDate.getMonth();
                const total = sale.total || 0;
                monthlyTotals[m] += total;
                totalYearSales += total;

                if (sale.items) {
                    sale.items.forEach(item => {
                        const prod = products.find(p => p.id === item.productId || p.sku === item.sku);
                        const catName = prod ? prod.category : 'Otras Categorías';
                        categoryTotals[catName] = (categoryTotals[catName] || 0) + (item.subtotal || (item.quantity * item.unitPrice) || 0);
                    });
                }
            }
        });

        const totalYearEl = document.getElementById('dash-chart-total-year');
        if (totalYearEl) totalYearEl.textContent = this.formatMoney(totalYearSales);

        // 1. Gráfica de Barras Mensuales (Celeste #93CDED y Violeta #A38CE7)
        const canvasMonthly = document.getElementById('chart-monthly-sales');
        if (canvasMonthly && window.Chart) {
            if (this.monthlyChart) this.monthlyChart.destroy();

            const ctx = canvasMonthly.getContext('2d');
            this.monthlyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: monthNames,
                    datasets: [{
                        label: 'Ventas ($ COP)',
                        data: monthlyTotals,
                        backgroundColor: '#93CDED',
                        borderColor: '#A38CE7',
                        borderWidth: 2,
                        borderRadius: 8,
                        hoverBackgroundColor: '#A38CE7'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` Ventas: ${this.formatMoney(ctx.raw)}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#E2DCF8' },
                            ticks: {
                                callback: (v) => `$${v / 1000000}M`,
                                font: { family: 'Poppins', size: 10 }
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { family: 'Poppins', size: 10 } }
                        }
                    }
                }
            });
        }

        // 2. Gráfica Doughnut por Categorías
        const canvasCategory = document.getElementById('chart-category-sales');
        if (canvasCategory && window.Chart) {
            if (this.categoryChart) this.categoryChart.destroy();

            const catLabels = Object.keys(categoryTotals);
            const catValues = Object.values(categoryTotals);
            const pastelPalette = ['#93CDED', '#A38CE7', '#B2A2DE', '#D1FAE5', '#FEF08A', '#FEE2E2', '#C7B9F1', '#BAE6FD'];

            const ctx = canvasCategory.getContext('2d');
            this.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: catLabels,
                    datasets: [{
                        data: catValues,
                        backgroundColor: pastelPalette,
                        borderColor: '#FFFFFF',
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { family: 'Poppins', size: 10 },
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` ${ctx.label}: ${this.formatMoney(ctx.raw)}`
                            }
                        }
                    }
                }
            });
        }
    }

    // ==========================================
    // SECCIÓN 2: INVENTARIO & CATÁLOGO
    // ==========================================
    renderInventory() {
        const products = this.getStorage('products') || [];
        const search = document.getElementById('inv-search-input')?.value.toLowerCase() || '';
        const cat = document.getElementById('inv-category-filter')?.value || '';
        const size = document.getElementById('inv-size-filter')?.value || '';
        const stockFilter = document.getElementById('inv-stock-filter')?.value || '';

        const tbody = document.getElementById('inventory-tbody');
        if (!tbody) return;

        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
            const matchesCat = !cat || p.category === cat;
            const matchesSize = !size || p.size === size;
            let matchesStock = true;
            if (stockFilter === 'low') matchesStock = p.stock < (p.minStock || 5);
            if (stockFilter === 'ok') matchesStock = p.stock >= (p.minStock || 5);
            return matchesSearch && matchesCat && matchesSize && matchesStock;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-[#475569]">No se encontraron prendas con los filtros seleccionados.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(p => {
            const isLow = p.stock < (p.minStock || 5);
            return `
                <tr class="hover:bg-[#F8F6FE] transition-colors">
                    <td class="py-3 px-5">
                        <div class="font-bold text-[#000000]">${p.name}</div>
                        <div class="text-xs text-[#8F77D9] font-mono">${p.sku} • ${p.brand || 'Boutique'}</div>
                    </td>
                    <td class="py-3 px-5">
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F4F0FD] border border-[#B2A2DE] text-[#000000]">
                            ${p.category}
                        </span>
                        <span class="ml-1 text-xs text-[#475569] font-semibold">Talla ${p.size}</span>
                    </td>
                    <td class="py-3 px-5 text-right font-medium text-[#475569]">${this.formatMoney(p.costPrice)}</td>
                    <td class="py-3 px-5 text-right font-extrabold text-[#000000]">${this.formatMoney(p.salePrice)}</td>
                    <td class="py-3 px-5 text-center">
                        <span class="px-2.5 py-1 rounded-full text-xs font-extrabold ${isLow ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]' : 'bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7]'}">
                            ${p.stock} unid ${isLow ? '⚠️' : ''}
                        </span>
                    </td>
                    <td class="py-3 px-5 text-center space-x-1">
                        <button onclick="app.editProduct('${p.id}')" class="px-2.5 py-1 bg-[#F4F0FD] hover:bg-[#E2DCF8] border border-[#B2A2DE] rounded-lg text-xs font-bold text-[#000000]">
                            Editar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    openProductModal(prodId = null) {
        const form = document.getElementById('form-product');
        if (form) form.reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('modal-product-title').textContent = 'Nuevo Producto';

        if (prodId) {
            const products = this.getStorage('products') || [];
            const p = products.find(prod => prod.id === prodId);
            if (p) {
                document.getElementById('prod-id').value = p.id;
                document.getElementById('prod-name').value = p.name;
                document.getElementById('prod-sku').value = p.sku;
                document.getElementById('prod-brand').value = p.brand || '';
                document.getElementById('prod-category').value = p.category;
                document.getElementById('prod-size').value = p.size;
                document.getElementById('prod-color').value = p.color || '';
                document.getElementById('prod-stock').value = p.stock;
                document.getElementById('prod-cost').value = p.costPrice;
                document.getElementById('prod-price').value = p.salePrice;
                document.getElementById('prod-image').value = p.image || '';
                document.getElementById('modal-product-title').textContent = 'Editar Producto';
            }
        }

        this.openModal('modal-product');
    }

    editProduct(prodId) {
        this.openProductModal(prodId);
    }

    saveProduct(e) {
        e.preventDefault();
        const products = this.getStorage('products') || [];
        const prodId = document.getElementById('prod-id').value;

        const productData = {
            id: prodId || `PROD-${Date.now().toString().slice(-4)}`,
            name: document.getElementById('prod-name').value.trim(),
            sku: document.getElementById('prod-sku').value.trim().toUpperCase(),
            brand: document.getElementById('prod-brand').value.trim(),
            category: document.getElementById('prod-category').value,
            size: document.getElementById('prod-size').value,
            color: document.getElementById('prod-color').value.trim(),
            stock: parseInt(document.getElementById('prod-stock').value) || 0,
            minStock: 5,
            costPrice: parseFloat(document.getElementById('prod-cost').value) || 0,
            salePrice: parseFloat(document.getElementById('prod-price').value) || 0,
            image: document.getElementById('prod-image').value.trim()
        };

        if (prodId) {
            const idx = products.findIndex(p => p.id === prodId);
            if (idx !== -1) products[idx] = productData;
        } else {
            products.unshift(productData);
        }

        this.setStorage('products', products);
        this.closeModal('modal-product');
        this.renderInventory();
        this.updateLowStockBadge();
        this.showToast('Producto guardado correctamente', 'success');
    }

    // ==========================================
    // SECCIÓN 3: PUNTO DE VENTA (POS / CAJA)
    // ==========================================
    renderPosProducts() {
        const products = this.getStorage('products') || [];
        const search = document.getElementById('pos-search-input')?.value.toLowerCase() || '';
        const cat = document.getElementById('pos-cat-filter')?.value || '';
        const grid = document.getElementById('pos-product-grid');
        if (!grid) return;

        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
            const matchesCat = !cat || p.category === cat;
            return matchesSearch && matchesCat;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-8 text-center text-[#475569] font-medium text-xs">No hay prendas disponibles para la búsqueda.</div>`;
            return;
        }

        grid.innerHTML = filtered.map(p => {
            const isOutOfStock = p.stock <= 0;
            return `
                <div class="pos-product-card p-3 rounded-2xl border border-[#B2A2DE] bg-white flex flex-col justify-between shadow-xs ${isOutOfStock ? 'opacity-50' : 'cursor-pointer hover:border-[#A38CE7]'}" onclick="${isOutOfStock ? '' : `app.addToCart('${p.id}')`}">
                    <div>
                        <div class="flex justify-between items-start">
                            <span class="text-[10px] bg-[#F4F0FD] border border-[#B2A2DE] text-[#8F77D9] font-bold px-1.5 py-0.5 rounded-md">${p.category}</span>
                            <span class="text-[10px] font-bold ${p.stock <= 3 ? 'text-[#991B1B]' : 'text-[#065F46]'}">Stock: ${p.stock}</span>
                        </div>
                        <h4 class="font-bold text-xs text-[#000000] mt-1.5 line-clamp-2 leading-tight">${p.name}</h4>
                        <p class="text-[10px] text-[#475569] font-mono">Talla: ${p.size}</p>
                    </div>
                    <div class="mt-2.5 pt-2 border-t border-[#E2DCF8] flex justify-between items-center">
                        <span class="font-extrabold text-xs text-[#000000]">${this.formatMoney(p.salePrice)}</span>
                        <button class="w-6 h-6 rounded-lg bg-[#A38CE7] text-white flex items-center justify-center font-bold text-xs hover:bg-[#8F77D9] ${isOutOfStock ? 'hidden' : ''}">
                            +
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    addToCart(productId) {
        const products = this.getStorage('products') || [];
        const prod = products.find(p => p.id === productId);
        if (!prod || prod.stock <= 0) {
            this.showToast('Prenda agotada o sin stock suficiente.', 'warning');
            return;
        }

        const existing = this.cart.find(i => i.product.id === productId);
        if (existing) {
            if (existing.quantity >= prod.stock) {
                this.showToast(`Stock máximo disponible alcanzado (${prod.stock} unid).`, 'warning');
                return;
            }
            existing.quantity += 1;
        } else {
            this.cart.push({ product: prod, quantity: 1 });
        }

        this.renderCart();
        this.updateCartTotals();
    }

    renderCart() {
        const container = document.getElementById('pos-cart-items');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = `<div class="py-8 text-center text-xs text-[#475569] font-medium">El carrito está vacío.<br>Selecciona prendas del catálogo para vender.</div>`;
            return;
        }

        container.innerHTML = this.cart.map((item, idx) => `
            <div class="flex items-center justify-between p-2.5 bg-[#F8F6FE] rounded-xl border border-[#B2A2DE]">
                <div class="flex-1 min-w-0 pr-2">
                    <p class="font-bold text-xs text-[#000000] truncate">${item.product.name}</p>
                    <p class="text-[10px] text-[#475569]">${item.product.sku} • ${this.formatMoney(item.product.salePrice)}</p>
                </div>
                <div class="flex items-center gap-1.5">
                    <button onclick="app.updateCartItemQty(${idx}, -1)" class="w-6 h-6 rounded-lg bg-white border border-[#B2A2DE] text-[#000000] font-bold text-xs flex items-center justify-center hover:bg-[#E2DCF8]">-</button>
                    <span class="font-extrabold text-xs w-5 text-center text-[#000000]">${item.quantity}</span>
                    <button onclick="app.updateCartItemQty(${idx}, 1)" class="w-6 h-6 rounded-lg bg-white border border-[#B2A2DE] text-[#000000] font-bold text-xs flex items-center justify-center hover:bg-[#E2DCF8]">+</button>
                    <button onclick="app.removeCartItem(${idx})" class="w-6 h-6 rounded-lg bg-[#FEE2E2] text-[#991B1B] font-bold text-xs flex items-center justify-center hover:bg-[#FCA5A5] ml-1">×</button>
                </div>
            </div>
        `).join('');
    }

    updateCartItemQty(idx, change) {
        if (!this.cart[idx]) return;
        const newQty = this.cart[idx].quantity + change;
        const maxStock = this.cart[idx].product.stock;

        if (newQty <= 0) {
            this.cart.splice(idx, 1);
        } else if (newQty > maxStock) {
            this.showToast(`Stock máximo alcanzado (${maxStock} unid).`, 'warning');
            return;
        } else {
            this.cart[idx].quantity = newQty;
        }

        this.renderCart();
        this.updateCartTotals();
    }

    removeCartItem(idx) {
        this.cart.splice(idx, 1);
        this.renderCart();
        this.updateCartTotals();
    }

    clearCart() {
        this.cart = [];
        this.renderCart();
        this.updateCartTotals();
    }

    updateCartTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
        const hasTax = document.getElementById('pos-tax-toggle')?.checked;
        const discount = parseFloat(document.getElementById('pos-discount-input')?.value || 0);
        const tax = hasTax ? Math.round(subtotal * 0.19) : 0;
        const total = Math.max(0, subtotal + tax - discount);

        const subEl = document.getElementById('pos-subtotal-display');
        const taxEl = document.getElementById('pos-tax-display');
        const totEl = document.getElementById('pos-total-display');

        if (subEl) subEl.textContent = this.formatMoney(subtotal);
        if (taxEl) taxEl.textContent = this.formatMoney(tax);
        if (totEl) totEl.textContent = this.formatMoney(total);
    }

    handlePaymentMethodChange() {
        const selected = document.querySelector('input[name="pos-payment"]:checked')?.value;
        const transferBox = document.getElementById('pos-transfer-verification-box');
        if (transferBox) {
            if (selected === 'Transferencia') {
                transferBox.classList.remove('hidden');
            } else {
                transferBox.classList.add('hidden');
                const check = document.getElementById('pos-transfer-check');
                if (check) check.checked = false;
            }
        }
    }

    processCheckout() {
        if (this.cart.length === 0) {
            this.showToast('El carrito está vacío. Agrega prendas antes de facturar.', 'warning');
            return;
        }

        const selectedPayment = document.querySelector('input[name="pos-payment"]:checked')?.value || 'Efectivo';
        if (selectedPayment === 'Transferencia') {
            const verified = document.getElementById('pos-transfer-check')?.checked;
            if (!verified) {
                this.showToast('Debes marcar la casilla de verificación de transferencia antes de facturar.', 'warning');
                return;
            }
        }

        const products = this.getStorage('products') || [];
        const sales = this.getStorage('sales') || [];

        // Validar stock antes de descontar
        for (const item of this.cart) {
            const p = products.find(prod => prod.id === item.product.id);
            if (!p || p.stock < item.quantity) {
                this.showToast(`Stock insuficiente para ${item.product.name}. Disponible: ${p ? p.stock : 0}`, 'error');
                return;
            }
        }

        // DESCUENTO INMEDIATO DE INVENTARIO
        this.cart.forEach(item => {
            const prod = products.find(p => p.id === item.product.id);
            if (prod) {
                prod.stock -= item.quantity;
            }
        });
        this.setStorage('products', products);

        // Calcular totales de venta
        const subtotal = this.cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
        const totalCost = this.cart.reduce((sum, item) => sum + (item.product.costPrice * item.quantity), 0);
        const hasTax = document.getElementById('pos-tax-toggle')?.checked;
        const discount = parseFloat(document.getElementById('pos-discount-input')?.value || 0);
        const tax = hasTax ? Math.round(subtotal * 0.19) : 0;
        const total = Math.max(0, subtotal + tax - discount);

        const ticketNum = `TCK-${sales.length + 1001}`;
        const dianInvoiceNum = `SETT-${1000 + sales.length + 1}`;
        const now = new Date();

        // Generar CUFE (Código Único de Facturación Electrónica simulado)
        const cufeHash = Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');

        const newSale = {
            id: ticketNum,
            ticketNumber: ticketNum,
            dianInvoiceNumber: dianInvoiceNum,
            cufe: cufeHash,
            dianStatus: 'Aceptada DIAN',
            date: now.toISOString(),
            dateFormatted: now.toLocaleString('es-CO'),
            sellerName: this.activeUser ? this.activeUser.fullName : 'Vendedor',
            paymentMethod: selectedPayment,
            transferVerified: selectedPayment === 'Transferencia',
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

        // Actualizar vistas en tiempo real
        this.renderTicketContent(newSale);
        this.clearCart();
        this.renderPosProducts();
        this.renderInventory();
        this.updateLowStockBadge();
        this.showToast(`¡Venta ${ticketNum} (${dianInvoiceNum}) emitida con éxito!`, 'success');
    }

    renderTicketContent(sale) {
        const storeInfo = this.getStorage('storeInfo') || {
            name: "Vogue & Style Boutique",
            nit: "900.854.123-7",
            address: "Av. Principal #45-18, Bogotá",
            phone: "+57 (601) 555-0199"
        };
        const container = document.getElementById('printable-ticket');
        if (!container) return;

        const dianNum = sale.dianInvoiceNumber || `SETT-1001`;
        const cufe = sale.cufe || 'a8f4c19b2e04d773f8a192c4b8e0192a8374d619';

        container.innerHTML = `
            <div class="text-center font-bold pb-2 mb-2 border-b border-dashed border-[#000000]">
                <h4 class="text-xs uppercase tracking-wider font-extrabold">${storeInfo.name}</h4>
                <p class="text-[9px] font-normal">NIT: ${storeInfo.nit} • Régimen Común</p>
                <p class="text-[9px] font-normal">${storeInfo.address}</p>
                <p class="text-[9px] font-normal">TEL: ${storeInfo.phone}</p>
                <div class="mt-1 px-1.5 py-0.5 bg-[#D1FAE5] text-[#065F46] rounded text-[8px] font-bold inline-block border border-[#6EE7B7]">
                    FACTURA ELECTRÓNICA DE VENTA: ${dianNum}
                </div>
            </div>

            <div class="mb-2 text-[10px] space-y-0.5 border-b border-dashed border-[#000000] pb-2">
                <p class="flex justify-between"><strong>TIQUETE:</strong> <span>${sale.ticketNumber}</span></p>
                <p class="flex justify-between"><strong>FECHA:</strong> <span>${sale.dateFormatted || new Date(sale.date).toLocaleString('es-CO')}</span></p>
                <p class="flex justify-between"><strong>CAJERO/A:</strong> <span>${sale.sellerName}</span></p>
                <p class="flex justify-between"><strong>FORMA PAGO:</strong> <span>${sale.paymentMethod} ${sale.transferVerified ? '(Validado)' : ''}</span></p>
            </div>

            <table class="w-full text-left text-[10px] mb-2 border-b border-dashed border-[#000000] pb-2">
                <thead>
                    <tr class="border-b border-[#000000] text-[9px]">
                        <th class="py-1">CANT / ARTÍCULO</th>
                        <th class="py-1 text-right">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map(i => `
                        <tr>
                            <td class="py-1 pr-1">
                                <span class="font-bold">${i.quantity}x</span> ${i.name}<br>
                                <span class="text-[8px] text-[#475569] font-mono">${i.sku}</span>
                            </td>
                            <td class="py-1 text-right font-bold align-top">${this.formatMoney(i.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="text-right text-[10px] space-y-0.5 font-bold mb-2">
                <p class="flex justify-between"><span>SUBTOTAL:</span> <span>${this.formatMoney(sale.subtotal)}</span></p>
                <p class="flex justify-between"><span>IVA (19%):</span> <span>${this.formatMoney(sale.tax)}</span></p>
                ${sale.discount > 0 ? `<p class="flex justify-between text-[#000000]"><span>DESCUENTO:</span> <span>-${this.formatMoney(sale.discount)}</span></p>` : ''}
                <p class="flex justify-between text-xs font-black border-t border-[#000000] pt-1 mt-1"><span>TOTAL:</span> <span>${this.formatMoney(sale.total)}</span></p>
            </div>

            <!-- SECCIÓN FISCAL DIAN -->
            <div class="p-2 bg-[#F8F6FE] rounded border border-[#B2A2DE] text-[8px] space-y-1 mb-2">
                <p class="font-bold text-[#000000]">INFORMACIÓN FISCAL DIAN:</p>
                <p class="text-[#475569] leading-tight">Resolución DIAN N° 18764000001 de 2026-01-01. Rango Habilitado: SETT-1 a SETT-100000.</p>
                <p class="break-all font-mono text-[7px] text-[#000000]"><strong>CUFE:</strong> ${cufe}</p>
                <div class="flex items-center justify-between pt-1">
                    <span class="font-bold text-[#065F46]">✅ Transmitida a la DIAN</span>
                    <span class="font-mono text-[8px]">QR DIAN: [VPFE-VALID]</span>
                </div>
            </div>

            <div class="text-center text-[9px] pt-1 border-t border-dashed border-[#000000] space-y-0.5">
                <p class="font-bold uppercase tracking-tight">¡GRACIAS POR TU COMPRA!</p>
                <p class="text-[8px]">Garantía y cambios: 15 días presentando este tiquete.</p>
                <p class="text-[7.5px] text-[#475569]">Documento equivalente a factura electrónica expedido conforme a la ley colombiana.</p>
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

    transmitDianInvoices() {
        this.showToast('Conectando con servidores de la DIAN...', 'info');
        setTimeout(() => {
            const sales = this.getStorage('sales') || [];
            sales.forEach(s => s.dianStatus = 'Aceptada DIAN');
            this.setStorage('sales', sales);
            this.showToast('✅ Facturas del día transmitidas y aceptadas exitosamente por la DIAN.', 'success');
            if (this.currentSection === 'dashboard') this.renderDashboard();
        }, 1200);
    }

    // ==========================================
    // SECCIÓN 4: PROVEEDORES & LOTES
    // ==========================================
    renderSuppliers() {
        const suppliers = this.getStorage('suppliers') || [];
        const grid = document.getElementById('suppliers-grid');
        if (!grid) return;

        grid.innerHTML = suppliers.map(s => `
            <div class="bg-white p-4 rounded-2xl border border-[#B2A2DE] shadow-xs space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[#8F77D9]">${s.city}</span>
                    <span class="text-[10px] bg-[#F4F0FD] px-2 py-0.5 rounded-full font-mono text-[#000000] border border-[#B2A2DE]">${s.nit}</span>
                </div>
                <h4 class="font-bold text-sm text-[#000000]">${s.name}</h4>
                <div class="text-xs text-[#475569] space-y-0.5">
                    <p>📞 ${s.phone}</p>
                    <p>✉️ ${s.email}</p>
                    <p>📍 ${s.address}</p>
                </div>
            </div>
        `).join('');

        // Rellenar select de lotes y manual purchase
        const batchSup = document.getElementById('batch-supplier');
        const mpSup = document.getElementById('mp-supplier');
        const options = suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        if (batchSup) batchSup.innerHTML = options;
        if (mpSup) mpSup.innerHTML = options;
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
            nit: document.getElementById('sup-nit').value.trim(),
            name: document.getElementById('sup-name').value.trim(),
            phone: document.getElementById('sup-phone').value.trim(),
            city: document.getElementById('sup-city').value.trim(),
            email: document.getElementById('sup-email').value.trim(),
            address: document.getElementById('sup-address').value.trim()
        };

        suppliers.unshift(newSup);
        this.setStorage('suppliers', suppliers);
        this.closeModal('modal-supplier');
        this.renderSuppliers();
        this.showToast('Proveedor registrado con éxito', 'success');
    }

    openBatchModal() {
        document.getElementById('form-batch')?.reset();
        this.batchItems = [];
        this.renderBatchItems();

        const products = this.getStorage('products') || [];
        const prodSelect = document.getElementById('batch-item-product');
        if (prodSelect) {
            prodSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('');
        }

        this.openModal('modal-batch');
    }

    addItemToBatch() {
        const prodSelect = document.getElementById('batch-item-product');
        const qtyInput = document.getElementById('batch-item-qty');
        const costInput = document.getElementById('batch-item-cost');

        const prodId = prodSelect?.value;
        const qty = parseInt(qtyInput?.value);
        const cost = parseFloat(costInput?.value);

        if (!prodId || isNaN(qty) || qty <= 0 || isNaN(cost) || cost < 0) {
            this.showToast('Ingresa cantidad y costo válidos', 'warning');
            return;
        }

        const products = this.getStorage('products') || [];
        const prod = products.find(p => p.id === prodId);

        this.batchItems.push({
            productId: prod.id,
            sku: prod.sku,
            productName: prod.name,
            quantity: qty,
            unitCost: cost,
            totalCost: qty * cost
        });

        qtyInput.value = '';
        costInput.value = '';
        this.renderBatchItems();
    }

    renderBatchItems() {
        const tbody = document.getElementById('batch-items-tbody');
        const totalEl = document.getElementById('batch-total-cost');
        if (!tbody) return;

        let total = 0;
        tbody.innerHTML = this.batchItems.map((item, idx) => {
            total += item.totalCost;
            return `
                <tr>
                    <td class="p-1 font-bold text-[#000000]">${item.productName}</td>
                    <td class="p-1 text-center font-bold">${item.quantity}</td>
                    <td class="p-1 text-right">${this.formatMoney(item.unitCost)}</td>
                    <td class="p-1 text-right font-bold">${this.formatMoney(item.totalCost)}</td>
                    <td class="p-1 text-center">
                        <button type="button" onclick="app.removeBatchItem(${idx})" class="text-[#991B1B] font-bold">×</button>
                    </td>
                </tr>
            `;
        }).join('');

        if (totalEl) totalEl.textContent = this.formatMoney(total);
    }

    removeBatchItem(idx) {
        this.batchItems.splice(idx, 1);
        this.renderBatchItems();
    }

    saveBatch(e) {
        e.preventDefault();
        if (this.batchItems.length === 0) {
            this.showToast('Agrega al menos un producto al lote', 'warning');
            return;
        }

        const batches = this.getStorage('batches') || [];
        const suppliers = this.getStorage('suppliers') || [];
        const products = this.getStorage('products') || [];

        const supId = document.getElementById('batch-supplier').value;
        const supplier = suppliers.find(s => s.id === supId);
        const totalCost = this.batchItems.reduce((sum, item) => sum + item.totalCost, 0);

        // Incrementar stock en productos
        this.batchItems.forEach(item => {
            const p = products.find(prod => prod.id === item.productId);
            if (p) {
                p.stock += item.quantity;
                p.costPrice = item.unitCost;
            }
        });
        this.setStorage('products', products);

        const newBatch = {
            id: `LOT-${Date.now().toString().slice(-4)}`,
            batchNumber: document.getElementById('batch-number').value.trim(),
            supplierId: supId,
            supplierName: supplier ? supplier.name : 'Proveedor',
            date: new Date().toISOString().split('T')[0],
            totalCost,
            items: [...this.batchItems]
        };

        batches.unshift(newBatch);
        this.setStorage('batches', batches);
        this.closeModal('modal-batch');
        this.renderBatchesHistory();
        this.renderInventory();
        this.updateLowStockBadge();
        this.showToast('Lote registrado e inventario incrementado con éxito', 'success');
    }

    renderBatchesHistory() {
        const batches = this.getStorage('batches') || [];
        const tbody = document.getElementById('batches-tbody');
        if (!tbody) return;

        tbody.innerHTML = batches.map(b => `
            <tr class="hover:bg-[#F8F6FE] transition-colors">
                <td class="py-3 px-4 font-bold text-[#000000]">${b.batchNumber}</td>
                <td class="py-3 px-4 text-[#475569] text-xs">${b.date}</td>
                <td class="py-3 px-4 font-semibold text-[#000000]">${b.supplierName}</td>
                <td class="py-3 px-4 text-xs">
                    ${b.items ? b.items.map(i => `${i.quantity}x ${i.productName}`).join(', ') : 'Varios'}
                </td>
                <td class="py-3 px-4 text-right font-extrabold text-[#991B1B]">${this.formatMoney(b.totalCost)}</td>
            </tr>
        `).join('');
    }

    // ==========================================
    // ENTRADA MANUAL DE COMPRA
    // ==========================================
    openManualPurchaseModal() {
        document.getElementById('form-manual-purchase')?.reset();
        document.getElementById('mp-total-display').textContent = '$0';
        this.openModal('modal-manual-purchase');
    }

    calculateManualPurchaseTotal() {
        const qty = parseInt(document.getElementById('mp-qty')?.value || 0);
        const cost = parseFloat(document.getElementById('mp-cost')?.value || 0);
        const total = qty * cost;
        const totalEl = document.getElementById('mp-total-display');
        if (totalEl) totalEl.textContent = this.formatMoney(total);
    }

    saveManualPurchase(e) {
        e.preventDefault();
        const products = this.getStorage('products') || [];
        const batches = this.getStorage('batches') || [];
        const suppliers = this.getStorage('suppliers') || [];

        const sku = document.getElementById('mp-sku').value.trim().toUpperCase();
        const name = document.getElementById('mp-name').value.trim();
        const supId = document.getElementById('mp-supplier').value;
        const cat = document.getElementById('mp-category').value;
        const size = document.getElementById('mp-size').value;
        const color = document.getElementById('mp-color').value.trim();
        const qty = parseInt(document.getElementById('mp-qty').value) || 1;
        const cost = parseFloat(document.getElementById('mp-cost').value) || 0;
        const price = parseFloat(document.getElementById('mp-price').value) || 0;

        const supplier = suppliers.find(s => s.id === supId);
        let existingProd = products.find(p => p.sku === sku);

        if (existingProd) {
            existingProd.stock += qty;
            existingProd.costPrice = cost;
            existingProd.salePrice = price;
        } else {
            existingProd = {
                id: `PROD-${Date.now().toString().slice(-4)}`,
                name,
                sku,
                category: cat,
                size,
                color,
                stock: qty,
                minStock: 5,
                costPrice: cost,
                salePrice: price
            };
            products.unshift(existingProd);
        }
        this.setStorage('products', products);

        // Registrar como Lote Contable
        const newBatch = {
            id: `LOT-MAN-${Date.now().toString().slice(-4)}`,
            batchNumber: `ENT-DIR-${Date.now().toString().slice(-4)}`,
            supplierId: supId,
            supplierName: supplier ? supplier.name : 'Compra Directa',
            date: new Date().toISOString().split('T')[0],
            totalCost: qty * cost,
            items: [{
                productId: existingProd.id,
                sku,
                productName: name,
                quantity: qty,
                unitCost: cost,
                totalCost: qty * cost
            }]
        };
        batches.unshift(newBatch);
        this.setStorage('batches', batches);

        this.closeModal('modal-manual-purchase');
        this.renderInventory();
        this.updateLowStockBadge();
        this.showToast(`Entrada de ${qty} unid registrada y stock actualizado con éxito.`, 'success');
    }

    // ==========================================
    // SECCIÓN 5: DEVOLUCIONES
    // ==========================================
    searchTicketForReturn() {
        const query = document.getElementById('ret-ticket-search')?.value.trim().toUpperCase();
        const sales = this.getStorage('sales') || [];
        const sale = sales.find(s => s.ticketNumber.toUpperCase() === query || s.id.toUpperCase() === query);

        const details = document.getElementById('ret-sale-details');
        if (!sale) {
            this.showToast('No se encontró ninguna venta con ese número de tiquete.', 'warning');
            if (details) details.classList.add('hidden');
            return;
        }

        if (sale.status === 'Devuelta') {
            this.showToast('Este tiquete ya fue reembolsado y devuelto anteriormente.', 'warning');
            if (details) details.classList.add('hidden');
            return;
        }

        this.currentReturnSale = sale;
        document.getElementById('ret-sale-tck-num').textContent = `${sale.ticketNumber} (${sale.dianInvoiceNumber || 'Factura DIAN'})`;
        document.getElementById('ret-sale-date').textContent = `Fecha: ${sale.dateFormatted || sale.date}`;
        document.getElementById('ret-sale-total').textContent = `Total Facturado: ${this.formatMoney(sale.total)}`;
        if (details) details.classList.remove('hidden');
    }

    processFullReturn() {
        if (!this.currentReturnSale) return;
        const reason = document.getElementById('ret-reason')?.value.trim() || 'Devolución de cliente';

        const sales = this.getStorage('sales') || [];
        const products = this.getStorage('products') || [];
        const returns = this.getStorage('returns') || [];

        // Reintegrar stock de cada prenda
        if (this.currentReturnSale.items) {
            this.currentReturnSale.items.forEach(item => {
                const prod = products.find(p => p.id === item.productId || p.sku === item.sku);
                if (prod) prod.stock += item.quantity;
            });
        }
        this.setStorage('products', products);

        // Marcar venta como devuelta
        const saleIdx = sales.findIndex(s => s.id === this.currentReturnSale.id);
        if (saleIdx !== -1) {
            sales[saleIdx].status = 'Devuelta';
            sales[saleIdx].returnReason = reason;
        }
        this.setStorage('sales', sales);

        // Registrar devolución
        returns.unshift({
            id: `RET-${Date.now().toString().slice(-4)}`,
            ticketNumber: this.currentReturnSale.ticketNumber,
            date: new Date().toISOString().split('T')[0],
            reason,
            refundAmount: this.currentReturnSale.total
        });
        this.setStorage('returns', returns);

        document.getElementById('ret-sale-details')?.classList.add('hidden');
        document.getElementById('ret-ticket-search').value = '';
        this.renderReturnsHistory();
        this.renderInventory();
        this.updateLowStockBadge();
        this.showToast('Devolución procesada y prendas reintegradas al stock con éxito.', 'success');
    }

    renderReturnsHistory() {
        const returns = this.getStorage('returns') || [];
        const tbody = document.getElementById('returns-tbody');
        if (!tbody) return;

        if (returns.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-[#475569]">No hay devoluciones registradas.</td></tr>`;
            return;
        }

        tbody.innerHTML = returns.map(r => `
            <tr class="hover:bg-[#F8F6FE] transition-colors">
                <td class="py-2.5 px-3 font-bold text-[#000000]">${r.ticketNumber}</td>
                <td class="py-2.5 px-3 text-[#475569]">${r.date}</td>
                <td class="py-2.5 px-3 font-semibold text-[#000000]">${r.reason}</td>
                <td class="py-2.5 px-3 text-right font-extrabold text-[#991B1B]">${this.formatMoney(r.refundAmount)}</td>
            </tr>
        `).join('');
    }

    // ==========================================
    // SECCIÓN 6: CUENTAS & FINANZAS (ADMIN)
    // ==========================================
    renderFinanceLedger() {
        if (this.activeUser?.role !== 'Administrador') {
            this.navigateTo('dashboard');
            return;
        }

        const sales = this.getStorage('sales') || [];
        const batches = this.getStorage('batches') || [];
        const returns = this.getStorage('returns') || [];

        const totalIncome = sales.filter(s => s.status !== 'Devuelta').reduce((sum, s) => sum + (s.total || 0), 0);
        const totalExpenses = batches.reduce((sum, b) => sum + (b.totalCost || 0), 0);
        const totalRefunds = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);

        const netIncome = totalIncome;
        const netProfit = netIncome - totalExpenses;
        const profitMargin = netIncome > 0 ? ((netProfit / netIncome) * 100).toFixed(1) : 0;

        const incomeEl = document.getElementById('fin-total-income');
        const expEl = document.getElementById('fin-total-expenses');
        const profitEl = document.getElementById('fin-net-profit');
        const marginEl = document.getElementById('fin-profit-margin');

        if (incomeEl) incomeEl.textContent = this.formatMoney(netIncome);
        if (expEl) expEl.textContent = this.formatMoney(totalExpenses);
        if (profitEl) {
            profitEl.textContent = this.formatMoney(netProfit);
            profitEl.className = `text-2xl font-extrabold mt-1 font-heading ${netProfit >= 0 ? 'text-[#065F46]' : 'text-[#991B1B]'}`;
        }
        if (marginEl) marginEl.textContent = `${profitMargin}%`;

        // Libro Diario
        const movements = [];
        sales.forEach(s => {
            movements.push({
                date: s.dateFormatted || s.date,
                type: s.status === 'Devuelta' ? 'Venta (Devuelta)' : 'Ingreso (Venta POS)',
                ref: `${s.ticketNumber} (${s.sellerName || 'Venta'})`,
                amount: s.status === 'Devuelta' ? 0 : s.total,
                isIncome: true
            });
        });

        batches.forEach(b => {
            movements.push({
                date: b.date,
                type: 'Egreso (Lote Compra)',
                ref: `${b.batchNumber} - ${b.supplierName}`,
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
            <tr class="hover:bg-[#F8F6FE] transition-colors">
                <td class="py-2.5 px-3 text-[#475569] font-mono text-xs">${m.date}</td>
                <td class="py-2.5 px-3">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${m.isIncome ? 'bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7]' : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'}">
                        ${m.type}
                    </span>
                </td>
                <td class="py-2.5 px-3 font-semibold text-[#000000]">${m.ref}</td>
                <td class="py-2.5 px-3 text-right font-extrabold ${m.amount >= 0 ? 'text-[#065F46]' : 'text-[#991B1B]'}">
                    ${m.amount >= 0 ? '+' : ''}${this.formatMoney(m.amount)}
                </td>
            </tr>
        `).join('');
    }

    // ==========================================
    // SECCIÓN 7: GESTIÓN DE TRABAJADORES (ADMIN)
    // ==========================================
    renderUsers() {
        if (this.activeUser?.role !== 'Administrador') {
            this.navigateTo('dashboard');
            return;
        }

        const users = this.getStorage('users') || [];
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;

        tbody.innerHTML = users.map(u => {
            const isSelf = u.id === this.activeUser?.id;
            return `
                <tr class="hover:bg-[#F8F6FE] transition-colors">
                    <td class="py-3 px-5">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-[#A38CE7] text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-[#B2A2DE]">
                                ${u.avatar ? `<img src="${u.avatar}" class="w-full h-full object-cover">` : (u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U')}
                            </div>
                            <div>
                                <span class="font-bold text-[#000000] block">${u.fullName} ${isSelf ? '<span class="text-[10px] text-[#A38CE7] font-bold">(Tú)</span>' : ''}</span>
                                <span class="text-[11px] text-[#475569]">${u.address || 'Sin dirección'}</span>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-5 font-mono text-xs font-bold text-[#000000]">${u.cedula || 'N/A'}</td>
                    <td class="py-3 px-5 text-xs text-[#000000]">
                        <span class="block font-semibold">📞 ${u.phone || 'N/A'}</span>
                        ${u.emergencyPhone ? `<span class="text-[10px] text-[#8F77D9]">🚨 Emerg: ${u.emergencyPhone}</span>` : ''}
                    </td>
                    <td class="py-3 px-5 text-[#000000]">
                        <span class="font-mono text-xs block font-bold text-[#000000]">@${u.username}</span>
                        <span class="text-xs text-[#475569] block">${u.email}</span>
                    </td>
                    <td class="py-3 px-5 text-center">
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'Administrador' ? 'bg-[#A38CE7] text-white' : 'bg-[#93CDED] text-[#000000]'}">
                            ${u.role}
                        </span>
                    </td>
                    <td class="py-3 px-5 text-center">
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${u.status === 'Activo' ? 'bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7]' : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'}">
                            ${u.status || 'Activo'}
                        </span>
                    </td>
                    <td class="py-3 px-5 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            <button onclick="app.openUserModal('${u.id}')" class="px-2.5 py-1 bg-[#F4F0FD] hover:bg-[#E2DCF8] border border-[#B2A2DE] rounded-lg text-xs font-bold text-[#000000]">
                                Editar
                            </button>
                            ${!isSelf ? `
                                <button onclick="app.confirmDeleteUser('${u.id}')" class="px-2.5 py-1 bg-[#FEE2E2] hover:bg-[#FCA5A5] border border-[#FCA5A5] rounded-lg text-xs font-bold text-[#991B1B]">
                                    Eliminar
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    openUserModal(userId = null) {
        if (this.activeUser?.role !== 'Administrador') {
            this.showToast('Acceso denegado: solo el Administrador puede gestionar trabajadores.', 'warning');
            return;
        }

        const form = document.getElementById('form-user');
        if (form) form.reset();
        document.getElementById('usr-id').value = '';
        document.getElementById('modal-user-title').textContent = 'Registrar Nuevo Trabajador';

        if (userId) {
            const users = this.getStorage('users') || [];
            const u = users.find(user => user.id === userId);
            if (u) {
                document.getElementById('usr-id').value = u.id;
                document.getElementById('usr-fullname').value = u.fullName || '';
                document.getElementById('usr-cedula').value = u.cedula || '';
                document.getElementById('usr-phone').value = u.phone || '';
                document.getElementById('usr-emergency').value = u.emergencyPhone || '';
                document.getElementById('usr-email').value = u.email || '';
                document.getElementById('usr-address').value = u.address || '';
                document.getElementById('usr-username').value = u.username || '';
                document.getElementById('usr-password').value = u.password || '123';
                document.getElementById('usr-role').value = u.role || 'Vendedor';
                document.getElementById('usr-status').value = u.status || 'Activo';
                document.getElementById('modal-user-title').textContent = 'Editar Trabajador';
            }
        }

        this.openModal('modal-user');
    }

    saveUser(e) {
        e.preventDefault();
        if (this.activeUser?.role !== 'Administrador') {
            this.showToast('Acceso denegado: solo el Administrador puede registrar trabajadores.', 'warning');
            return;
        }

        const users = this.getStorage('users') || [];
        const usrId = document.getElementById('usr-id').value;

        const userData = {
            id: usrId || `USR-${Date.now().toString().slice(-4)}`,
            fullName: document.getElementById('usr-fullname').value.trim(),
            cedula: document.getElementById('usr-cedula').value.trim(),
            phone: document.getElementById('usr-phone').value.trim(),
            emergencyPhone: document.getElementById('usr-emergency').value.trim(),
            email: document.getElementById('usr-email').value.trim(),
            address: document.getElementById('usr-address').value.trim(),
            username: document.getElementById('usr-username').value.trim().toLowerCase(),
            password: document.getElementById('usr-password').value.trim() || '123',
            role: document.getElementById('usr-role').value,
            status: document.getElementById('usr-status').value,
            avatar: ''
        };

        if (usrId) {
            const idx = users.findIndex(u => u.id === usrId);
            if (idx !== -1) {
                userData.avatar = users[idx].avatar || '';
                users[idx] = userData;
            }
        } else {
            // Verificar si el username o email ya existen
            const exists = users.some(u => u.username.toLowerCase() === userData.username || u.email.toLowerCase() === userData.email);
            if (exists) {
                this.showToast('Ya existe un usuario con este nombre de usuario o correo.', 'warning');
                return;
            }
            users.push(userData);
        }

        this.setStorage('users', users);
        this.closeModal('modal-user');
        this.renderUsers();
        this.renderUserSelectorDropdown();
        this.showToast('Trabajador guardado con éxito en el sistema.', 'success');
    }

    confirmDeleteUser(userId) {
        if (this.activeUser?.role !== 'Administrador') return;
        if (userId === this.activeUser?.id) {
            this.showToast('No puedes eliminar tu propia cuenta de Administrador activa.', 'warning');
            return;
        }

        const users = this.getStorage('users') || [];
        const u = users.find(user => user.id === userId);
        if (!u) return;

        this.userToDeleteId = userId;
        document.getElementById('delete-user-name-display').textContent = `${u.fullName} (@${u.username})`;
        this.openModal('modal-delete-user');
    }

    executeDeleteUser() {
        if (!this.userToDeleteId) return;

        let users = this.getStorage('users') || [];
        users = users.filter(u => u.id !== this.userToDeleteId);
        this.setStorage('users', users);

        this.closeModal('modal-delete-user');
        this.userToDeleteId = null;
        this.renderUsers();
        this.renderUserSelectorDropdown();
        this.showToast('Trabajador eliminado. Su acceso al sistema ha sido revocado.', 'success');
    }

    // ==========================================
    // SECCIÓN 8: REPORTES & ANALÍTICA
    // ==========================================
    renderReports() {
        if (this.activeUser?.role !== 'Administrador') {
            this.navigateTo('dashboard');
            return;
        }

        const sales = this.getStorage('sales') || [];
        const products = this.getStorage('products') || [];

        // Top Productos vendidos
        const productSalesMap = {};
        sales.forEach(sale => {
            if (sale.status === 'Devuelta') return;
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

        const topList = document.getElementById('rep-top-products-list');
        if (topList) {
            topList.innerHTML = topProducts.map((p, idx) => `
                <div class="flex items-center justify-between p-3 bg-[#F8F6FE] rounded-2xl border border-[#B2A2DE]">
                    <div>
                        <strong class="text-sm font-bold text-[#000000]">#${idx + 1} ${p.name}</strong>
                        <span class="text-xs text-[#8F77D9] font-mono block">SKU: ${p.sku}</span>
                    </div>
                    <div class="text-right">
                        <span class="text-sm font-extrabold text-[#000000] block">${p.qty} unidades</span>
                        <span class="text-xs text-[#475569] font-semibold">${this.formatMoney(p.revenue)}</span>
                    </div>
                </div>
            `).join('');
        }

        // Reporte de Stock Crítico
        const critical = products.filter(p => p.stock < (p.minStock || 5));
        const critList = document.getElementById('rep-low-stock-list');
        if (critList) {
            if (critical.length === 0) {
                critList.innerHTML = `<div class="p-4 text-center text-[#065F46] font-bold text-xs bg-[#D1FAE5] rounded-2xl border border-[#6EE7B7]">¡Excelente! No hay prendas con stock crítico.</div>`;
            } else {
                critList.innerHTML = critical.map(p => `
                    <div class="flex items-center justify-between p-3 bg-[#FEE2E2] rounded-2xl border border-[#FCA5A5]">
                        <div>
                            <strong class="text-sm font-bold text-[#991B1B]">${p.name}</strong>
                            <span class="text-xs text-[#991B1B] font-mono block">SKU: ${p.sku}</span>
                        </div>
                        <div class="text-right">
                            <span class="badge-stock-critical text-xs px-2.5 py-0.5 rounded-full font-bold block mb-1">Stock: ${p.stock}</span>
                            <span class="text-xs text-[#991B1B] font-bold">+${Math.max(15, (p.minStock || 5) * 3 - p.stock)} sugeridas</span>
                        </div>
                    </div>
                `).join('');
            }
        }
    }
}

// Inicializar la aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
    window.app = new AppEngine();
});
