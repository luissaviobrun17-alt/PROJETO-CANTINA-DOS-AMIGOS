const InventoryStore = {
    products: [
        { id: 1, name: 'Salgado Especial', price: 8.50, cost: 4.25, category: 'Salgados', type: 'produto', stock: 15, minStock: 10, img: 'assets/salgado.jpg' },
        { id: 2, name: 'Refrigerante Lata', price: 5.00, cost: 2.50, category: 'Bebidas', type: 'produto', stock: 40, minStock: 20, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200' },
        { id: 3, name: 'Suco Natural', price: 7.00, cost: 3.50, category: 'Bebidas', type: 'produto', stock: 10, minStock: 15, img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200' },
        { id: 4, name: 'Bolo de Pote', price: 12.00, cost: 6.00, category: 'Doces', type: 'produto', stock: 3, minStock: 5, img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200' },
        { id: 101, name: 'Farinha de Trigo', price: 0, cost: 5.50, category: 'Insumos', type: 'insumo', stock: 10, minStock: 5, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200' },
        { id: 102, name: 'Óleo de Soja', price: 0, cost: 8.90, category: 'Insumos', type: 'insumo', stock: 20, minStock: 10, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200' }
    ],

    defaultProducts: [
        { id: 1, name: 'Salgado Especial (Frango)', price: 8.50, cost: 4.25, category: 'Salgados', type: 'produto', stock: 20, minStock: 10, img: 'assets/salgado.jpg' },
        { id: 2, name: 'Coxinha Tradicional', price: 6.00, cost: 2.50, category: 'Salgados', type: 'produto', stock: 30, minStock: 15, img: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=200' },
        { id: 3, name: 'Refrigerante Lata 350ml', price: 5.00, cost: 2.50, category: 'Bebidas', type: 'produto', stock: 48, minStock: 24, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200' },
        { id: 4, name: 'Suco Natural (Laranja)', price: 7.00, cost: 3.00, category: 'Bebidas', type: 'produto', stock: 15, minStock: 10, img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200' },
        { id: 5, name: 'Bolo de Pote (Chocolate)', price: 12.00, cost: 6.00, category: 'Doces', type: 'produto', stock: 10, minStock: 5, img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200' },
        { id: 6, name: 'Almoço Executivo', price: 25.00, cost: 12.00, category: 'Almoço', type: 'produto', stock: 50, minStock: 10, img: 'https://images.unsplash.com/photo-1574484284008-be967f055450?w=200' },
        { id: 101, name: 'Farinha de Trigo (Kg)', price: 0, cost: 4.50, category: 'Insumos', type: 'insumo', stock: 10, minStock: 5, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200' },
        { id: 102, name: 'Óleo de Soja (L)', price: 0, cost: 8.90, category: 'Insumos', type: 'insumo', stock: 20, minStock: 10, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200' }
    ],

    _isLoaded: false,
    getAll() {
        if (!this._isLoaded) {
            try {
                const local = localStorage.getItem('cantina_products');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed)) {
                        this.products = parsed;
                    }
                } else {
                    // Se não existe chave, iniciar com padrão apenas se for a primeira vez
                    this.products = [...this.defaultProducts];
                    this.save(this.products);
                }
                this._isLoaded = true;
            } catch (err) {
                console.error("Erro ao carregar produtos:", err);
            }
        }
        return this.products;
    },

    save(products) {
        try {
            this.products = products;
            localStorage.setItem('cantina_products', JSON.stringify(this.products));
            return true;
        } catch (err) {
            console.error("CRITICAL: Falha ao salvar no localStorage!", err);
            if (err.name === 'QuotaExceededError') {
                alert("ERRO: Memória cheia! Tente usar links de imagens em vez de fotos do computador.");
            }
            return false;
        }
    },

    restoreDefaults() {
        if (confirm("Isso apagará seus produtos atuais e voltará os itens padrão do sistema. Continuar?")) {
            this.save([...this.defaultProducts]);
            location.reload(); // Recarrega para limpar estados de UI
        }
    },

    removeStock(id, amount) {
        const product = this.products.find(p => p.id === id);
        if (product && product.stock >= amount) {
            product.stock -= amount;
            this.save(this.products);
            return true;
        }
        return false;
    },

    addStock(id, amount) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.stock += amount;
            this.save(this.products);
            return true;
        }
        return false;
    },

    getPurchaseReport(type = null) {
        const products = this.getAll();
        return products.filter(p => p.stock <= (p.minStock || 5) && (!type || type === 'all' || p.type === type));
    },

    getFullStockReport(type = null) {
        const products = this.getAll();
        return products.filter(p => !type || type === 'all' || p.type === type);
    },

    addProduct(product) {
        this.getAll(); // Garantir que carregou antes de dar push
        this.products.push({ ...product, id: Date.now() });
        this.save(this.products);
    },

    updateProduct(id, updatedData) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updatedData };
            this.save(this.products);
            return true;
        }
        return false;
    }
};


window.InventoryStore = InventoryStore;
// InventoryStore.getAll() removido para o bootstrap central
console.log("Módulo: inventory.js carregado.");
