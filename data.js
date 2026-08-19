/**
 * data.js - Datos Iniciales de Prueba para la Tienda de Ropa "Vogue & Style Boutique"
 * Carga automáticamente la información a localStorage si no existe.
 */

const INITIAL_DATA = {
    // Configuración de la tienda
    storeInfo: {
        name: "Vogue & Style Boutique",
        nit: "900.854.123-7",
        address: "Av. Principal #45-18, Zona Rosa",
        phone: "+57 (601) 555-0199",
        email: "contacto@voguestyle.com",
        taxRate: 0.19 // IVA 19%
    },

    // Categorías de prendas de vestir
    categories: [
        "Camisetas & Tops",
        "Pantalones & Jeans",
        "Chaquetas & Abrigos",
        "Vestidos & Faldas",
        "Ropa Interior & Sleepwear",
        "Accesorios & Calzado"
    ],

    // Tallas estándar
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],

    // Inventario Inicial de Productos / Prendas
    products: [
        {
            id: "PROD-001",
            sku: "CAM-NE-M",
            name: "Camiseta Oversize Algodón Premium",
            brand: "Urban Chic",
            category: "Camisetas & Tops",
            size: "M",
            color: "Negro Mate",
            stock: 24,
            minStock: 5,
            costPrice: 25000,
            salePrice: 65000,
            image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80"
        },
        {
            id: "PROD-002",
            sku: "JEA-AZ-32",
            name: "Jean Slim Fit Stretch Denim",
            brand: "Denim Co.",
            category: "Pantalones & Jeans",
            size: "L",
            color: "Azul Índigo",
            stock: 12,
            minStock: 5,
            costPrice: 55000,
            salePrice: 139000,
            image: "https://images.unsplash.com/photo-1542272604-780c36856842?w=300&q=80"
        },
        {
            id: "PROD-003",
            sku: "CHA-CU-L",
            name: "Chaqueta de Cuero Sintético Biker",
            brand: "Vogue Black",
            category: "Chaquetas & Abrigos",
            size: "L",
            color: "Negro",
            stock: 3, // Stock bajo para probar alertas
            minStock: 5,
            costPrice: 95000,
            salePrice: 249000,
            image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80"
        },
        {
            id: "PROD-004",
            sku: "VES-RO-S",
            name: "Vestido de Noche Ajustado Satinado",
            brand: "Elegance Paris",
            category: "Vestidos & Faldas",
            size: "S",
            color: "Rojo Pasión",
            stock: 4, // Stock bajo
            minStock: 5,
            costPrice: 70000,
            salePrice: 185000,
            image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&q=80"
        },
        {
            id: "PROD-005",
            sku: "ACC-CI-UN",
            name: "Cinturón de Cuero Vacuno Elegante",
            brand: "Leather Craft",
            category: "Accesorios & Calzado",
            size: "L",
            color: "Café Habano",
            stock: 18,
            minStock: 5,
            costPrice: 18000,
            salePrice: 48000,
            image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=300&q=80"
        },
        {
            id: "PROD-006",
            sku: "CAM-BL-S",
            name: "Blusa de Lino Manga Larga Elegante",
            brand: "Breeze Fashion",
            category: "Camisetas & Tops",
            size: "S",
            color: "Blanco Marfil",
            stock: 2, // Stock crítico
            minStock: 5,
            costPrice: 32000,
            salePrice: 89000,
            image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=300&q=80"
        },
        {
            id: "PROD-007",
            sku: "PAN-CA-M",
            name: "Pantalón Jogger Utilitario Cargo",
            brand: "Streetwear X",
            category: "Pantalones & Jeans",
            size: "M",
            color: "Verde Olivo",
            stock: 15,
            minStock: 5,
            costPrice: 42000,
            salePrice: 110000,
            image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=300&q=80"
        },
        {
            id: "PROD-008",
            sku: "CHA-LA-XL",
            name: "Abrigo Largo de Lana para Invierno",
            brand: "Nordic Warmth",
            category: "Chaquetas & Abrigos",
            size: "XL",
            color: "Gris Marengo",
            stock: 8,
            minStock: 5,
            costPrice: 120000,
            salePrice: 299000,
            image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=300&q=80"
        }
    ],

    // Proveedores Registrados
    suppliers: [
        {
            id: "SUP-001",
            nit: "830.112.449-1",
            name: "Textiles & Confecciones Moda Global S.A.S.",
            phone: "+57 (601) 310-8899",
            email: "ventas@modaglobal.com",
            address: "Zona Industrial Calle 13 #68-20, Bogotá",
            city: "Bogotá"
        },
        {
            id: "SUP-002",
            nit: "901.334.876-5",
            name: "Denim & Casual Apparel Ltd.",
            phone: "+57 (604) 448-1200",
            email: "contacto@denimcasual.co",
            address: "Cra 43A #14-85, El Poblado",
            city: "Medellín"
        },
        {
            id: "SUP-003",
            nit: "800.778.223-9",
            name: "Importaciones de Calzado & Cuero Elite",
            phone: "+57 (602) 667-4321",
            email: "info@cueroelite.com",
            address: "Calle 15 #3-45, Centro",
            city: "Cali"
        }
    ],

    // Usuarios del Sistema con Credenciales y Datos Personales
    users: [
        {
            id: "USR-001",
            fullName: "Valeria Gómez",
            cedula: "1098765432",
            phone: "+57 (310) 456-7890",
            emergencyPhone: "+57 (311) 987-6543",
            email: "valeria.admin@voguestyle.com",
            address: "Carrera 45 # 12-34, Bogotá",
            username: "admin_valeria",
            password: "123",
            role: "Administrador",
            avatar: "",
            status: "Activo"
        },
        {
            id: "USR-002",
            fullName: "Carlos Mendoza",
            cedula: "1023456789",
            phone: "+57 (315) 678-9012",
            emergencyPhone: "+57 (317) 654-3210",
            email: "carlos.caja@voguestyle.com",
            address: "Calle 100 # 19-50, Bogotá",
            username: "vendedor_carlos",
            password: "123",
            role: "Vendedor",
            avatar: "",
            status: "Activo"
        },
        {
            id: "USR-003",
            fullName: "Sofía Ramírez",
            cedula: "1034567891",
            phone: "+57 (318) 765-4321",
            emergencyPhone: "+57 (316) 123-4567",
            email: "sofia.ventas@voguestyle.com",
            address: "Avenida 68 # 45-20, Bogotá",
            username: "vendedor_sofia",
            password: "123",
            role: "Vendedor",
            avatar: "",
            status: "Activo"
        }
    ],

    // Compras por Lote (Egresos de Inventario)
    batches: [
        {
            id: "LOT-2026-001",
            batchNumber: "FAC-TEX-9942",
            supplierId: "SUP-001",
            supplierName: "Textiles & Confecciones Moda Global S.A.S.",
            date: "2026-08-01",
            totalCost: 1850000,
            notes: "Lote de camisetas y blusas de temporada alta",
            items: [
                { productId: "PROD-001", sku: "CAM-NE-M", productName: "Camiseta Oversize Algodón Premium", quantity: 30, unitCost: 25000, totalCost: 750000 },
                { productId: "PROD-006", sku: "CAM-BL-S", productName: "Blusa de Lino Manga Larga Elegante", quantity: 20, unitCost: 32000, totalCost: 640000 }
            ]
        },
        {
            id: "LOT-2026-002",
            batchNumber: "FAC-DEN-4410",
            supplierId: "SUP-002",
            supplierName: "Denim & Casual Apparel Ltd.",
            date: "2026-08-05",
            totalCost: 2470000,
            notes: "Reposición de Jeans Slim Fit y Cargos",
            items: [
                { productId: "PROD-002", sku: "JEA-AZ-32", productName: "Jean Slim Fit Stretch Denim", quantity: 20, unitCost: 55000, totalCost: 1100000 },
                { productId: "PROD-007", sku: "PAN-CA-M", productName: "Pantalón Jogger Utilitario Cargo", quantity: 20, unitCost: 42000, totalCost: 840000 }
            ]
        }
    ],

    // Historial de Ventas (Transacciones POS mensuales para gráficas y analítica)
    sales: [
        // Enero 2026
        {
            id: "TCK-0985",
            ticketNumber: "TCK-0985",
            date: "2026-01-18T14:30:00-05:00",
            dateFormatted: "2026-01-18 02:30 PM",
            sellerName: "Carlos Mendoza",
            paymentMethod: "Efectivo",
            transferVerified: false,
            subtotal: 1540000,
            tax: 292600,
            discount: 0,
            total: 1832600,
            totalCost: 620000,
            status: "Completada",
            items: [
                { productId: "PROD-003", sku: "CHA-CU-L", name: "Chaqueta de Cuero Sintético Biker", quantity: 4, unitPrice: 249000, costPrice: 95000, subtotal: 996000 },
                { productId: "PROD-001", sku: "CAM-NE-M", name: "Camiseta Oversize Algodón Premium", quantity: 8, unitPrice: 65000, costPrice: 25000, subtotal: 520000 }
            ]
        },
        // Febrero 2026
        {
            id: "TCK-0988",
            ticketNumber: "TCK-0988",
            date: "2026-02-14T16:20:00-05:00",
            dateFormatted: "2026-02-14 04:20 PM",
            sellerName: "Sofía Ramírez",
            paymentMethod: "Transferencia",
            transferVerified: true,
            subtotal: 2190000,
            tax: 416100,
            discount: 50000,
            total: 2556100,
            totalCost: 880000,
            status: "Completada",
            items: [
                { productId: "PROD-004", sku: "VES-RO-S", name: "Vestido de Noche Ajustado Satinado", quantity: 6, unitPrice: 185000, costPrice: 70000, subtotal: 1110000 },
                { productId: "PROD-002", sku: "JEA-AZ-32", name: "Jean Slim Fit Stretch Denim", quantity: 7, unitPrice: 139000, costPrice: 55000, subtotal: 973000 }
            ]
        },
        // Marzo 2026
        {
            id: "TCK-0992",
            ticketNumber: "TCK-0992",
            date: "2026-03-22T11:15:00-05:00",
            dateFormatted: "2026-03-22 11:15 AM",
            sellerName: "Valeria Gómez",
            paymentMethod: "Efectivo",
            transferVerified: false,
            subtotal: 2850000,
            tax: 541500,
            discount: 0,
            total: 3391500,
            totalCost: 1150000,
            status: "Completada",
            items: [
                { productId: "PROD-008", sku: "CHA-LA-XL", name: "Abrigo Largo de Lana para Invierno", quantity: 5, unitPrice: 299000, costPrice: 120000, subtotal: 1495000 },
                { productId: "PROD-007", sku: "PAN-CA-M", name: "Pantalón Jogger Utilitario Cargo", quantity: 12, unitPrice: 110000, costPrice: 42000, subtotal: 1320000 }
            ]
        },
        // Abril 2026
        {
            id: "TCK-0995",
            ticketNumber: "TCK-0995",
            date: "2026-04-10T15:45:00-05:00",
            dateFormatted: "2026-04-10 03:45 PM",
            sellerName: "Carlos Mendoza",
            paymentMethod: "Transferencia",
            transferVerified: true,
            subtotal: 2640000,
            tax: 501600,
            discount: 30000,
            total: 3111600,
            totalCost: 1040000,
            status: "Completada",
            items: [
                { productId: "PROD-002", sku: "JEA-AZ-32", name: "Jean Slim Fit Stretch Denim", quantity: 10, unitPrice: 139000, costPrice: 55000, subtotal: 1390000 },
                { productId: "PROD-006", sku: "CAM-BL-S", name: "Blusa de Lino Manga Larga Elegante", quantity: 14, unitPrice: 89000, costPrice: 32000, subtotal: 1246000 }
            ]
        },
        // Mayo 2026 (Mes de las madres)
        {
            id: "TCK-0998",
            ticketNumber: "TCK-0998",
            date: "2026-05-15T18:00:00-05:00",
            dateFormatted: "2026-05-15 06:00 PM",
            sellerName: "Sofía Ramírez",
            paymentMethod: "Efectivo",
            transferVerified: false,
            subtotal: 3950000,
            tax: 750500,
            discount: 50000,
            total: 4650500,
            totalCost: 1560000,
            status: "Completada",
            items: [
                { productId: "PROD-004", sku: "VES-RO-S", name: "Vestido de Noche Ajustado Satinado", quantity: 12, unitPrice: 185000, costPrice: 70000, subtotal: 2220000 },
                { productId: "PROD-006", sku: "CAM-BL-S", name: "Blusa de Lino Manga Larga Elegante", quantity: 19, unitPrice: 89000, costPrice: 32000, subtotal: 1691000 }
            ]
        },
        // Junio 2026
        {
            id: "TCK-1000",
            ticketNumber: "TCK-1000",
            date: "2026-06-25T13:10:00-05:00",
            dateFormatted: "2026-06-25 01:10 PM",
            sellerName: "Valeria Gómez",
            paymentMethod: "Transferencia",
            transferVerified: true,
            subtotal: 3420000,
            tax: 649800,
            discount: 0,
            total: 4069800,
            totalCost: 1390000,
            status: "Completada",
            items: [
                { productId: "PROD-007", sku: "PAN-CA-M", name: "Pantalón Jogger Utilitario Cargo", quantity: 15, unitPrice: 110000, costPrice: 42000, subtotal: 1650000 },
                { productId: "PROD-003", sku: "CHA-CU-L", name: "Chaqueta de Cuero Sintético Biker", quantity: 7, unitPrice: 249000, costPrice: 95000, subtotal: 1743000 }
            ]
        },
        // Julio 2026
        {
            id: "TCK-1001",
            ticketNumber: "TCK-1001",
            date: "2026-07-28T16:40:00-05:00",
            dateFormatted: "2026-07-28 04:40 PM",
            sellerName: "Carlos Mendoza",
            paymentMethod: "Efectivo",
            transferVerified: false,
            subtotal: 3880000,
            tax: 737200,
            discount: 40000,
            total: 4577200,
            totalCost: 1530000,
            status: "Completada",
            items: [
                { productId: "PROD-001", sku: "CAM-NE-M", name: "Camiseta Oversize Algodón Premium", quantity: 20, unitPrice: 65000, costPrice: 25000, subtotal: 1300000 },
                { productId: "PROD-002", sku: "JEA-AZ-32", name: "Jean Slim Fit Stretch Denim", quantity: 18, unitPrice: 139000, costPrice: 55000, subtotal: 2502000 }
            ]
        },
        // Agosto 2026 (Mes Actual)
        {
            id: "TCK-1002",
            ticketNumber: "TCK-1002",
            date: "2026-08-12T10:15:00-05:00",
            dateFormatted: "2026-08-12 10:15 AM",
            sellerName: "Carlos Mendoza",
            paymentMethod: "Efectivo",
            transferVerified: false,
            subtotal: 204000,
            tax: 38760,
            discount: 0,
            total: 242760,
            totalCost: 80000,
            status: "Completada",
            items: [
                { productId: "PROD-001", sku: "CAM-NE-M", name: "Camiseta Oversize Algodón Premium", quantity: 1, unitPrice: 65000, costPrice: 25000, subtotal: 65000 },
                { productId: "PROD-002", sku: "JEA-AZ-32", name: "Jean Slim Fit Stretch Denim", quantity: 1, unitPrice: 139000, costPrice: 55000, subtotal: 139000 }
            ]
        },
        {
            id: "TCK-1003",
            ticketNumber: "TCK-1003",
            date: "2026-08-15T11:40:00-05:00",
            dateFormatted: "2026-08-15 11:40 AM",
            sellerName: "Carlos Mendoza",
            paymentMethod: "Transferencia",
            transferVerified: true,
            subtotal: 249000,
            tax: 47310,
            discount: 10000,
            total: 286310,
            totalCost: 95000,
            status: "Completada",
            items: [
                { productId: "PROD-003", sku: "CHA-CU-L", name: "Chaqueta de Cuero Sintético Biker", quantity: 1, unitPrice: 249000, costPrice: 95000, subtotal: 249000 }
            ]
        },
        {
            id: "TCK-1004",
            ticketNumber: "TCK-1004",
            date: "2026-08-18T14:20:00-05:00",
            dateFormatted: "2026-08-18 02:20 PM",
            sellerName: "Valeria Gómez",
            paymentMethod: "Efectivo",
            transferVerified: false,
            subtotal: 113000,
            tax: 21470,
            discount: 0,
            total: 134470,
            totalCost: 43000,
            status: "Completada",
            items: [
                { productId: "PROD-001", sku: "CAM-NE-M", name: "Camiseta Oversize Algodón Premium", quantity: 1, unitPrice: 65000, costPrice: 25000, subtotal: 65000 },
                { productId: "PROD-005", sku: "ACC-CI-UN", name: "Cinturón de Cuero Vacuno Elegante", quantity: 1, unitPrice: 48000, costPrice: 18000, subtotal: 48000 }
            ]
        }
    ],

    // Devoluciones procesadas
    returns: []
};

/**
 * Inicializador de LocalStorage
 */
function initStorage() {
    const keys = ["storeInfo", "categories", "sizes", "products", "suppliers", "users", "batches", "sales", "returns"];
    const currentVersion = "v3_auth_pastel";
    const storedVersion = localStorage.getItem("vogue_store_initialized");
    
    if (!storedVersion || storedVersion !== currentVersion) {
        console.log("Actualizando / inicializando base de datos local en localStorage con versión " + currentVersion);
        keys.forEach(key => {
            if (INITIAL_DATA[key]) {
                // Si ya existían productos/ventas, podemos preservarlos o actualizar si no existen
                const existing = localStorage.getItem(`vogue_${key}`);
                if (!existing || key === "users" || key === "storeInfo") {
                    localStorage.setItem(`vogue_${key}`, JSON.stringify(INITIAL_DATA[key]));
                }
            }
        });

        // Asegurar que los usuarios tengan contraseñas y campos nuevos
        const currentUsers = JSON.parse(localStorage.getItem("vogue_users") || "[]");
        if (currentUsers.length === 0 || !currentUsers[0].password) {
            localStorage.setItem("vogue_users", JSON.stringify(INITIAL_DATA.users));
        }

        // Si no hay usuario activo o le falta password, setear admin
        const activeUser = JSON.parse(localStorage.getItem("vogue_activeUser") || "null");
        if (!activeUser || !activeUser.password) {
            localStorage.setItem("vogue_activeUser", JSON.stringify(INITIAL_DATA.users[0]));
        }

        localStorage.setItem("vogue_store_initialized", currentVersion);
    }
}

// Ejecutar inicialización inmediatamente
initStorage();
