const InventoryStore = {
    products: [],

    defaultProducts: [
        { id: 1,   name: 'Salgado Especial (Frango)',  price: 8.50,  cost: 4.25, category: 'Salgados', type: 'produto', stock: 20, minStock: 10, img: 'assets/salgado.jpg' },
        { id: 2,   name: 'Coxinha Tradicional',        price: 6.00,  cost: 2.50, category: 'Salgados', type: 'produto', stock: 30, minStock: 15, img: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=200' },
        { id: 3,   name: 'Refrigerante Lata 350ml',    price: 5.00,  cost: 2.50, category: 'Bebidas',  type: 'produto', stock: 48, minStock: 24, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200' },
        { id: 4,   name: 'Suco Natural (Laranja)',      price: 7.00,  cost: 3.00, category: 'Bebidas',  type: 'produto', stock: 15, minStock: 10, img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200' },
        { id: 5,   name: 'Bolo de Pote (Chocolate)',   price: 12.00, cost: 6.00, category: 'Doces',    type: 'produto', stock: 10, minStock: 5,  img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200' },
        { id: 6,   name: 'Almoço Executivo',            price: 25.00, cost: 12.00,category: 'Almoço',   type: 'produto', stock: 50, minStock: 10, img: 'https://images.unsplash.com/photo-1574484284008-be967f055450?w=200' },
        { id: 101, name: 'Farinha de Trigo (Kg)',       price: 0,     cost: 4.50, category: 'Insumos',  type: 'insumo',  stock: 10, minStock: 5,  img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200' },
        { id: 102, name: 'Óleo de Soja (L)',            price: 0,     cost: 8.90, category: 'Insumos',  type: 'insumo',  stock: 20, minStock: 10, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200' }
    ],

    _isLoaded: false,
    _saveCount: 0,
    _indicatorTimer: null,

    // ════════════════════════════════════════
    // CAMADA 1: Carregamento com fallback automático
    // ════════════════════════════════════════
    getAll() {
        if (!this._isLoaded) {
            const loaded = this._tryLoad();
            if (!loaded) {
                console.warn('[InventoryStore] Nenhuma fonte válida. Usando padrão.');
                this.products = [...this.defaultProducts];
                this.save(this.products);
            }
            this._isLoaded = true;
        }
        return this.products;
    },

    _tryLoad() {
        // Tenta carregar do slot principal
        if (this._loadFromKey('cantina_products')) {
            this._migrateShowcaseFlags();
            return true;
        }

        // Fallback: tenta os backups rotativos
        const backupResult = this._loadFromBackup();
        if (backupResult) {
            console.warn('[InventoryStore] Dados recuperados do backup automático!');
            this._migrateShowcaseFlags();
            this.save(this.products);
            return true;
        }
        return false;
    },

    /**
     * Migração: normaliza os flags de destaque para o novo sistema.
     * Produtos sem inShowcase definido → inShowcase = true (visíveis por padrão).
     * Produtos com hideInShowcase = true → inShowcase = false (respeita escolha antiga).
     */
    _migrateShowcaseFlags() {
        let changed = false;
        this.products.forEach(p => {
            if (p.type === 'produto' && p.inShowcase === undefined) {
                p.inShowcase = (p.hideInShowcase !== true); // herda decisão antiga
                changed = true;
            }
        });
        if (changed) {
            console.log('[InventoryStore] Migração de flags de destaque aplicada.');
            // Salva silenciosamente sem disparar o indicador de UI
            try { localStorage.setItem('cantina_products', JSON.stringify(this.products)); } catch(e) {}
        }
    },

    _loadFromKey(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                this.products = parsed;
                console.log(`[InventoryStore] ${parsed.length} produtos carregados de "${key}".`);
                return true;
            }
        } catch (e) {
            console.error(`[InventoryStore] Erro ao ler "${key}":`, e.message);
        }
        return false;
    },

    _loadFromBackup() {
        const keys = ['cantina_products_bkp_a', 'cantina_products_bkp_b'];
        let best = null;

        for (const key of keys) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) continue;
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    if (!best || parsed.length > best.length) best = parsed;
                }
            } catch (e) {}
        }

        if (best) { this.products = best; return true; }
        return false;
    },

    // ════════════════════════════════════════
    // CAMADA 2: Salvamento em 3 chaves + verificação pós-gravação
    // ════════════════════════════════════════
    save(products) {
        try {
            this.products = products;
            const data = JSON.stringify(this.products);
            const sizeKB = Math.round(new Blob([data]).size / 1024);

            // Aviso preventivo se estiver chegando no limite (> 4MB)
            if (sizeKB > 4096) {
                console.warn(`[InventoryStore] Atenção: uso de armazenamento alto (${sizeKB}KB). Limite do browser ~5-10MB.`);
            }

            // Salvar no slot principal
            localStorage.setItem('cantina_products', data);

            // CAMADA DE BACKUP ROTATIVO (A e B alternados)
            this._saveCount++;
            const bkpKey = this._saveCount % 2 === 0 ? 'cantina_products_bkp_a' : 'cantina_products_bkp_b';
            try { localStorage.setItem(bkpKey, data); } catch (e) { /* backup falhou, tudo bem */ }

            // Salvar metadados
            try {
                localStorage.setItem('cantina_products_meta', JSON.stringify({
                    lastSaved: new Date().toISOString(),
                    count: this.products.length,
                    saveNumber: this._saveCount,
                    sizeKB
                }));
            } catch (e) {}

            // ── VERIFICAÇÃO PÓS-GRAVAÇÃO ──
            const verify = localStorage.getItem('cantina_products');
            if (!verify) throw new Error('Verificação falhou: dado não encontrado após salvar.');
            const verifyArr = JSON.parse(verify);
            if (verifyArr.length !== this.products.length) {
                throw new Error(`Verificação falhou: esperava ${this.products.length} itens, encontrou ${verifyArr.length}.`);
            }

            // Atualizar indicador visual
            this._updateSaveIndicator(sizeKB);
            return true;

        } catch (err) {
            console.error('[InventoryStore] FALHA ao salvar:', err);

            if (err.name === 'QuotaExceededError') {
                // CAMADA DE EMERGÊNCIA: exportar automaticamente antes de perder tudo
                this._emergencyExport();
                alert(
                    '⚠️ MEMÓRIA DO NAVEGADOR CHEIA!\n\n' +
                    'Um arquivo de EMERGÊNCIA foi baixado automaticamente.\n\n' +
                    'Para liberar espaço:\n' +
                    '• Use links de imagem da internet em vez de fotos do computador\n' +
                    '• Remova imagens antigas (editar produto → trocar foto por link)\n\n' +
                    'Seus dados estão no arquivo baixado e podem ser restaurados via "Recuperar Backup".'
                );
            } else {
                alert('ERRO ao salvar produto: ' + err.message);
            }
            return false;
        }
    },

    // ════════════════════════════════════════
    // CAMADA DE EMERGÊNCIA: download imediato de backup
    // ════════════════════════════════════════
    _emergencyExport() {
        try {
            const data = JSON.stringify({ cantina_products: this.products, exportDate: new Date().toISOString(), source: 'emergency' }, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CANTINA_EMERGENCIA_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('[InventoryStore] Exportação de emergência falhou:', e);
        }
    },

    // Indicador visual de status de salvamento
    _updateSaveIndicator(sizeKB) {
        const el = document.getElementById('inventory-save-status');
        if (!el) return;
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        el.innerHTML = `✅ Salvo às ${time} &nbsp;·&nbsp; ${this.products.length} itens &nbsp;·&nbsp; ${sizeKB}KB usados`;
        el.style.color = '#10b981';
        clearTimeout(this._indicatorTimer);
        this._indicatorTimer = setTimeout(() => { if (el) el.style.color = '#64748b'; }, 4000);
    },

    // ════════════════════════════════════════
    // CRUD padrão
    // ════════════════════════════════════════
    restoreDefaults() {
        if (confirm('Isso apagará seus produtos atuais e voltará os itens padrão do sistema. Continuar?')) {
            this.save([...this.defaultProducts]);
            location.reload();
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
        this.getAll(); // Garante carregamento antes de push
        const newProduct = { ...product, id: Date.now() };
        this.products.push(newProduct);
        const saved = this.save(this.products);
        if (!saved) {
            // Reverter o push em memória se falhou
            this.products.pop();
            console.error('[InventoryStore] addProduct revertido por falha no save.');
        }
        return saved;
    },

    updateProduct(id, updatedData) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updatedData };
            return this.save(this.products);
        }
        return false;
    }
};

window.InventoryStore = InventoryStore;
console.log('Módulo: inventory.js carregado — mecanismo de save em 3 camadas ativo.');
