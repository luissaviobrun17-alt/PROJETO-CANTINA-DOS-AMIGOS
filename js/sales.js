const SalesManager = {
    cart: [],
    selectedCustomerId: null,

    init() {
        // 1. Recuperar carrinho salvo (Novo recurso de persistência)
        try {
            const savedCart = localStorage.getItem('pdv-cart');
            this.cart = savedCart ? JSON.parse(savedCart) : [];
        } catch (e) {
            console.error("Erro ao carregar carrinho:", e);
            this.cart = [];
        }

        const savedCustomer = localStorage.getItem('pdv_selected_customer');
        if (savedCustomer && savedCustomer !== "null" && savedCustomer !== "undefined" && savedCustomer !== "") {
            this.selectedCustomerId = savedCustomer;
        }

        this.populateCustomerSelect();
        this.renderSalesProducts();
        this.updateCartUI();
        this.updateIndicators();
        this.updateOrderNumber();

        if (this.selectedCustomerId) {
            this.selectCustomerById(this.selectedCustomerId);
        } else {
            // Padrão automático: Caixa (ID 1)
            this.selectCustomerById(1);
        }

        if (!this.eventsInitialized) {
            this.setupEventListeners();
            this.startClock();
            this.eventsInitialized = true;
        }
        console.log("SalesManager inicializado com sucesso.");
    },

    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 10000); // Atualiza a cada 10 seg
    },

    updateClock() {
        const now = new Date();
        const dateEl = document.getElementById('dt-date');
        const timeEl = document.getElementById('dt-time');

        if (dateEl) {
            dateEl.innerText = now.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        if (timeEl) {
            timeEl.innerText = now.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    },

    updateOrderNumber() {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const todayStr = `${now.getFullYear()}-${mm}-${dd}`;
        const lastDate = localStorage.getItem('pdv_last_order_date');
        let sequence = parseInt(localStorage.getItem('pdv_order_sequence') || '0');

        if (lastDate !== todayStr) {
            sequence = 1;
            localStorage.setItem('pdv_last_order_date', todayStr);
            localStorage.setItem('pdv_order_sequence', '1');
        } else {
            // Se a sequência ainda não existe (primeira vez no dia), inicia em 1
            if (sequence === 0) sequence = 1;
        }

        const ss = String(sequence).padStart(2, '0');
        const orderId = `${mm}${dd}${ss}`;

        const orderIdEl = document.getElementById('pdv-order-id');
        if (orderIdEl) {
            orderIdEl.innerText = `Nº ${orderId}`;
        }

        return orderId;
    },

    incrementOrderSequence() {
        let sequence = parseInt(localStorage.getItem('pdv_order_sequence') || '1');
        sequence++;
        localStorage.setItem('pdv_order_sequence', sequence.toString());
        this.updateOrderNumber();
    },

    setupEventListeners() {
        const customerSearch = document.getElementById('pdv-customer-search');
        if (customerSearch) {
            customerSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.confirmCustomerSelection(true);
                }
            });
        }

        // Tornar o ícone de usuário clicável se houver algum no novo wrapper
        const userIcon = document.querySelector('.cart-customer-compact-search i');
        if (userIcon) {
            userIcon.style.cursor = 'pointer';
            userIcon.addEventListener('click', () => {
                this.confirmCustomerSelection(true);
            });
        }

        const customerSelect = document.getElementById('pdv-customer-select');
        if (customerSelect) {
            customerSelect.addEventListener('change', () => {
                this.confirmCustomerSelection(true);
            });
        }
    },

    confirmCustomerSelection(shouldFocusProducts = false) {
        const select = document.getElementById('pdv-customer-select');
        if (select && select.value) {
            this.selectCustomerById(select.value);
            if (shouldFocusProducts) {
                this.focusSearch();
            }
        }
    },

    populateCustomerSelect() {
        const select = document.getElementById('pdv-customer-select');
        if (!select) return;

        const customers = window.CustomerStore.getAll();
        select.innerHTML = customers.map(c => `
            <option value="${c.id}">${c.name}</option>
        `).join('');
    },

    selectCustomerById(id) {
        const display = document.getElementById('selected-customer-name');
        const select = document.getElementById('pdv-customer-select');

        if (!id || id === "" || id === "null") return;

        // Atualizar o select se ele existir na página atual
        if (select) {
            select.value = id;
        }

        const customer = window.CustomerStore.getAll().find(c => c.id == id);
        if (customer) {
            this.selectedCustomerId = id;
            localStorage.setItem('pdv_selected_customer', id);

            if (display) {
                display.innerText = customer.name;
            }
        }
    },

    renderSalesProducts(filteredProducts = null) {
        const grid = document.getElementById('sales-product-grid');
        if (!grid) return;

        const allProducts = window.InventoryStore.getAll();
        const products = (filteredProducts || allProducts)
            .filter(p => p.type === 'produto')
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

        let html = `
            <table class="pdv-products-table">
                <thead>
                    <tr>
                        <th style="width: 50%;">Produto</th>
                        <th style="width: 20%; text-align: right; padding-right: 0.75rem;">Preço</th>
                        <th style="width: 15%; text-align: center;">Qtde</th>
                        <th style="width: 15%; text-align: center;">Ação</th>
                    </tr>
                </thead>
                <tbody>
        `;

        html += products.map(p => `
            <tr onclick="SalesManager.addToCart(${p.id})">
                <td class="td-name">
                    <span class="p-name">${p.name}</span>
                    <span class="p-stock-info">Estoque: ${p.stock}</span>
                </td>
                <td class="td-price">R$ ${p.price.toFixed(2)}</td>
                <td class="td-qty" onclick="event.stopPropagation()">
                    <input type="number" id="qty-${p.id}" class="sales-qty-input" value="1" min="1" max="${p.stock}">
                </td>
                <td class="td-action">
                    <button class="add-item-btn-modern" title="Adicionar" onclick="event.stopPropagation(); SalesManager.addToCart(${p.id})">
                        <i data-lucide="plus"></i>
                    </button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="empty-msg">Nenhum produto encontrado</td></tr>';

        html += `
                </tbody>
            </table>
        `;
        grid.innerHTML = html;

        if (window.lucide) {
            window.lucide.createIcons();
        }
    },

    filterProducts(query) {
        const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const allProducts = window.InventoryStore.getAll().filter(p => p.type === 'produto');

        const filtered = allProducts.filter(p => {
            const name = (p.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const category = (p.category || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return name.includes(normalizedQuery) || category.includes(normalizedQuery);
        });

        this.renderSalesProducts(filtered);
    },

    focusSearch() {
        const input = document.querySelector('.sales-search-box input');
        if (input) input.focus();
    },

    filterCustomers(query) {
        const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const customers = window.CustomerStore.getAll();
        const filtered = customers.filter(c => {
            const name = (c.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return name.includes(normalizedQuery);
        });

        const select = document.getElementById('pdv-customer-select');
        if (select) {
            select.innerHTML = (filtered.length === 0 ? '<option value="" disabled selected>Nenhum encontrado</option>' : '') +
                filtered.map((c, i) => `<option value="${c.id}" ${i === 0 ? 'selected' : ''}>${c.name}</option>`).join('');

            // Sincronizar resumo imediatamente se houver resultados
            if (filtered.length > 0) {
                this.confirmCustomerSelection();
            }
        }
    },

    openCustomerSearch() {
        const input = document.getElementById('pdv-customer-search');
        if (input) input.focus();
    },

    filterByCategory(category) {
        const allProducts = window.InventoryStore.getAll().filter(p => p.type === 'produto');
        let filtered;

        if (category === 'all') {
            filtered = allProducts;
        } else if (category === 'Almoço / Jantar') {
            filtered = allProducts.filter(p => p.category === 'Almoço' || p.category === 'Jantar');
        } else {
            filtered = allProducts.filter(p => p.category === category);
        }

        this.renderSalesProducts(filtered);

        // Update active button state
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`.category-btn[data-category="${category}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    },

    addToCart(productId) {
        const products = window.InventoryStore.getAll();
        const product = products.find(p => p.id == productId);
        if (!product) return;

        // Get quantity from input if it exists
        const qtyInput = document.getElementById(`qty-${productId}`);
        const qtyToAdd = qtyInput ? parseInt(qtyInput.value) : 1;

        if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
            alert('Quantidade inválida!');
            return;
        }

        if (product.stock < qtyToAdd) {
            alert('Estoque insuficiente!');
            return;
        }

        const existing = this.cart.find(item => item.id == productId);
        if (existing) {
            if ((existing.qty + qtyToAdd) > product.stock) {
                alert('Quantidade máxima atingida (estoque limitado).');
                return;
            }
            existing.qty += qtyToAdd;
        } else {
            this.cart.push({ ...product, qty: qtyToAdd });
        }
        this.updateCartUI();

        // Reset input to 1
        if (qtyInput) qtyInput.value = 1;
    },

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id != productId);
        this.updateCartUI();
    },

    updateCartUI() {
        // Persistir estado atual
        localStorage.setItem('pdv-cart', JSON.stringify(this.cart));

        const list = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total');
        if (!list || !totalEl) return;

        list.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <span>${item.qty}x ${item.name}</span>
                <div class="flex items-center gap-2">
                    <span>R$ ${(item.price * item.qty).toFixed(2)}</span>
                    <button onclick="SalesManager.removeFromCart(${item.id})" class="action-btn delete" style="padding:0; width:20px; height:20px;">×</button>
                </div>
            </div>
        `).join('') || '<p class="empty-msg">Pedido vazio</p>';

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        totalEl.innerText = `R$ ${total.toFixed(2)}`;
    },

    async generateOrder() {
        if (this.cart.length === 0) {
            if (window.NotificationManager) window.NotificationManager.notify('Atenção', 'O carrinho está vazio!', 'warning');
            else alert('Carrinho vazio!');
            return;
        }

        const customerSelect = document.getElementById('pdv-customer-select');
        const customerId = customerSelect.value;
        const customerName = customerSelect.options[customerSelect.selectedIndex]?.text || 'Consumidor Final';

        const now = new Date();
        const deliveryDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const paymentMethodEl = document.getElementById('pdv-payment-method');
        const paymentMethod = paymentMethodEl.value;

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        if (!confirm(`Confirmar pedido no valor de R$ ${total.toFixed(2)}?`)) return;

        try {
            const orderId = Date.now();
            const formattedOrderId = this.updateOrderNumber();

            const orderData = {
                id: orderId,
                formattedId: formattedOrderId,
                date: new Date().toISOString(),
                deliveryDate: deliveryDate || 'Imediata',
                customerId: customerId || 'Consumidor Final',
                paymentMethod: paymentMethod,
                total: total,
                items: [...this.cart]
            };

            // Subtract Stock
            this.cart.forEach(item => {
                window.InventoryStore.removeStock(item.id, item.qty);
            });

            // Financial Update
            window.FinanceStore.addTransaction(
                'in',
                total,
                paymentMethod,
                `Pedido Nº ${formattedOrderId} ${customerName !== 'Caixa' ? '(Cliente: ' + customerName + ')' : ''}`,
                'Vendas',
                {
                    items: [...this.cart],
                    customerName: customerName
                }
            );

            // Customer History Update
            if (customerId) {
                window.CustomerStore.addOrderToCustomer(parseInt(customerId), orderData);
            }

            // --- CRITICAL CLEARING SECTION ---

            // 1. Success Message
            if (window.NotificationManager) {
                window.NotificationManager.notify('Sucesso', `Pedido Nº ${formattedOrderId} gerado!`, 'success');
            } else {
                alert(`Pedido Nº ${formattedOrderId} gerado com sucesso!`);
            }

            // 2. FORCE CLEAR
            this.cart = [];
            localStorage.removeItem('pdv-cart');

            // 3. Reset Inputs
            if (paymentMethodEl) paymentMethodEl.value = 'pix';
            this.selectCustomerById(1);

            // 4. UI Updates
            try {
                this.incrementOrderSequence();
                if (window.renderProducts) window.renderProducts();
                if (window.updateFinanceUI) window.updateFinanceUI();
                this.updateIndicators();
                this.renderSalesProducts(); // Updates stock display
                this.updateCartUI();        // Updates cart list to empty
            } catch (err) {
                console.error("Non-critical UI error:", err);
                document.getElementById('cart-items').innerHTML = '<div class="empty-msg">Pedido vazio</div>';
                document.getElementById('cart-total').innerText = 'R$ 0.00';
            }

        } catch (error) {
            console.error("CRITICAL ORDER ERROR:", error);
            if (window.NotificationManager) window.NotificationManager.notify('Erro Crítico', 'Erro ao salvar pedido.', 'error');
            else alert("Erro crítico ao salvar pedido.");
        }
    },

    updateIndicators() {
        const indicators = document.querySelectorAll('#sales .stat-card .value');
        if (indicators.length < 3) return;

        const summary = window.FinanceStore.getSummary();

        // Vendas Hoje (Simplificado para o resumo do mês no indicador principal de vendas)
        const todaySales = summary.monthlyIn;

        // Saldo Atual
        const currentBalance = summary.totalBalance;

        // Estoque Baixo (Count)
        const lowStockCount = window.InventoryStore.getAll()
            .filter(p => p.stock <= p.minStock).length;

        indicators[0].innerText = `R$ ${todaySales.toFixed(2)}`;
        indicators[1].innerText = `R$ ${currentBalance.toFixed(2)}`;
        indicators[2].innerText = `${lowStockCount} Itens`;
    },

    getSales() {
        try {
            const sales = localStorage.getItem('cantina_sales_history');
            return sales ? JSON.parse(sales) : [];
        } catch (e) {
            console.error("Erro ao buscar histórico de vendas:", e);
            return [];
        }
    }
};

window.SalesManager = SalesManager;
// SalesManager.init() movido para o bootstrap no index.html
console.log("SalesManager carregado.");
