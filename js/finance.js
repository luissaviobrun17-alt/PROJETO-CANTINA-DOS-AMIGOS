const FinanceStore = {
    transactions: [],
    accountsPayable: [],
    accountsReceivable: [],
    settings: {
        accessCode: '1234', // Default access code
        backupEnabled: true
    },

    // Helper para tratar números com vírgula e evitar NaN
    parseNumericValue(val) {
        if (val === null || val === undefined || val === '') return 0;
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        const parsed = parseFloat(String(val).replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    },

    init() {
        const local = localStorage.getItem('cantina_finance_erp');
        if (local) {
            const data = JSON.parse(local);
            this.transactions = data.transactions || [];
            this.accountsPayable = data.accountsPayable || [];
            this.accountsReceivable = data.accountsReceivable || [];
            this.deletedTransactions = data.deletedTransactions || [];
            this.settings = { ...this.settings, ...(data.settings || {}) };
        } else {
            // Migrar dados do sistema antigo se existirem
            const old = localStorage.getItem('cantina_finance');
            if (old) {
                const oldData = JSON.parse(old);
                this.transactions = oldData.transactions || [];
                this.save();
            }
        }
    },

    getAll() {
        return this.transactions;
    },

    save() {
        try {
            localStorage.setItem('cantina_finance_erp', JSON.stringify({
                transactions: this.transactions,
                accountsPayable: this.accountsPayable,
                accountsReceivable: this.accountsReceivable,
                deletedTransactions: this.deletedTransactions || [],
                settings: this.settings
            }));
            return true;
        } catch (err) {
            console.error("CRITICAL: Falha ao salvar no localStorage (Finance)!", err);
            if (err.name === 'QuotaExceededError') {
                if (window.NotificationManager) {
                    window.NotificationManager.notify("ERRO", "Memória do navegador cheia! Tente limpar o histórico ou backups antigos.", 'error');
                } else {
                    alert("ERRO: Memória cheia!");
                }
            }
            return false;
        }
    },

    addTransaction(type, amount, method, desc, category = 'Geral', metadata = null) {
        const transaction = {
            id: Date.now(),
            date: new Date().toISOString(),
            type, // 'in' or 'out'
            amount,
            method, // 'pix', 'card_debit', 'card_credit', 'cash'
            desc,
            category,
            metadata
        };

        this.transactions.push(transaction);
        this.save();
        this.syncWithProvida(transaction);
        return transaction;
    },

    deleteTransaction(id, deletedBy = 'Admin', reason = 'Não informado') {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            const t = this.transactions[index];

            // Retornar ao estoque se for uma venda e tiver itens no metadata
            if (t.type === 'in' && t.metadata && Array.isArray(t.metadata.items)) {
                t.metadata.items.forEach(item => {
                    if (window.InventoryStore) {
                        window.InventoryStore.addStock(item.id, item.qty);
                    }
                });
            }

            const deleted = {
                ...t,
                deletedAt: new Date().toISOString(),
                deletedBy: deletedBy,
                reason: reason
            };
            if (!this.deletedTransactions) this.deletedTransactions = [];
            this.deletedTransactions.push(deleted);
            this.transactions.splice(index, 1);
            this.save();
        }
    },

    getSummary() {
        const now = new Date();
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalBalance = this.transactions.reduce((acc, t) => t.type === 'in' ? acc + (this.parseNumericValue(t.amount)) : acc - (this.parseNumericValue(t.amount)), 0);

        const monthlyIn = this.transactions
            .filter(t => t.type === 'in' && t.date && !isNaN(new Date(t.date)))
            .filter(t => new Date(t.date) >= firstDayMonth)
            .reduce((acc, t) => acc + (this.parseNumericValue(t.amount)), 0);

        const monthlyOut = this.transactions
            .filter(t => t.type === 'out' && t.date && !isNaN(new Date(t.date)))
            .filter(t => new Date(t.date) >= firstDayMonth)
            .reduce((acc, t) => acc + (this.parseNumericValue(t.amount)), 0);

        return { totalBalance, monthlyIn, monthlyOut };
    },

    addAccount(type, data) {
        const account = {
            id: Date.now(),
            type, // 'payable' or 'receivable'
            desc: data.desc,
            amount: this.parseNumericValue(data.amount),
            dueDate: data.dueDate,
            category: data.category || 'Geral',
            status: 'pending' // 'pending', 'paid', 'overdue'
        };

        if (type === 'payable') this.accountsPayable.push(account);
        else this.accountsReceivable.push(account);

        this.save();
        return account;
    },

    deleteAccount(type, id) {
        const list = type === 'payable' ? this.accountsPayable : this.accountsReceivable;
        const index = list.findIndex(a => a.id === id);
        if (index !== -1) {
            list.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    },

    markAsPaid(type, id) {
        const list = type === 'payable' ? this.accountsPayable : this.accountsReceivable;
        const item = list.find(a => a.id === id);
        if (item) {
            item.status = 'paid';
            const transType = type === 'payable' ? 'out' : 'in';
            this.addTransaction(transType, item.amount, 'cash', `Pagamento: ${item.desc}`, item.category);
            this.save();
        }
    },

    // Security & Backup
    getBackup() {
        return JSON.stringify({
            transactions: this.transactions,
            accountsPayable: this.accountsPayable,
            accountsReceivable: this.accountsReceivable,
            date: new Date().toISOString()
        });
    },

    async syncWithProvida(transaction) {
        console.log('Sincronizando com sistema Provida...', transaction);
    },

    closeDay() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const todayTrans = this.transactions.filter(t => t.date && t.date.startsWith(todayStr));
        const report = {
            date: now.toLocaleDateString('pt-BR'),
            total: todayTrans.reduce((acc, t) => t.type === 'in' ? acc + (this.parseNumericValue(t.amount)) : acc - (this.parseNumericValue(t.amount)), 0),
            transactions: todayTrans.length
        };
        console.log('Fechamento do dia:', report);
        return report;
    },

    async processBradescoPayment(method, amount) {
        console.log(`Processando pagamento Bradesco (${method}): R$ ${amount}`);
        // Simulação de gateway de pagamento
        return new Promise(resolve => {
            setTimeout(() => resolve({ success: true, transactionId: Date.now() }), 1500);
        });
    }
};

window.FinanceStore = FinanceStore;
FinanceStore.init(); // Initialize automatically to load data
console.log("FinanceStore initialized.");


const FinanceManager = {
    activeTab: 'fin-dashboard',

    init() {
        this.initTabs();
        this.updateUI();
    },

    initTabs() {
        document.querySelectorAll('.finance-tabs .tab-btn').forEach(btn => {
            btn.onclick = () => {
                const tabId = btn.dataset.tab;
                this.activeTab = tabId;

                // Toggle buttons
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Toggle contents
                document.querySelectorAll('.finance-tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');

                this.updateUI();
            };
        });
    },

    updateUI() {
        // Fallback for missing elements when running outside full app context
        const safeElement = (id) => document.getElementById(id) || { innerText: '', innerHTML: '', classList: { add: () => { }, remove: () => { } }, style: {} };

        const summary = window.FinanceStore.getSummary();

        // Update Dashboard Cards
        safeElement('total-balance').innerText = `R$ ${summary.totalBalance.toFixed(2)}`;
        safeElement('monthly-in').innerText = `R$ ${summary.monthlyIn.toFixed(2)}`;
        safeElement('monthly-out').innerText = `R$ ${summary.monthlyOut.toFixed(2)}`;

        // Update History (Single Line Layout)
        const historyEl = document.getElementById('transaction-history');
        if (historyEl) {
            historyEl.innerHTML = window.FinanceStore.transactions.slice().reverse().slice(0, 10).map(t => {
                const customer = t.metadata?.customerName ? ` • <span class="gold-text">${t.metadata.customerName}</span>` : '';
                return `
                <div class="transaction-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;">
                    <div style="display: flex; gap: 1rem; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                        <span style="color: #94a3b8; min-width: 80px;">${new Date(t.date).toLocaleDateString()}</span>
                        <span style="font-weight: 500;">${t.desc}${customer}</span>
                        <span style="color: #64748b; font-size: 0.8rem;">(${(t.method || 'PIX').toUpperCase()})</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span class="t-amount ${t.type}" style="font-weight: 700; min-width: 100px; text-align: right;">R$ ${t.amount.toFixed(2)}</span>
                        <button class="action-btn delete sm no-print" onclick="FinanceManager.deleteTransaction(${t.id})" title="Excluir" style="padding: 4px; opacity: 0.5;">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>
            `}).join('') || '<p class="empty-msg">Nenhuma transação registrada.</p>';
        }

        // Update Accounts Lists
        this.renderAccounts();
        this.renderCashFlow();

        if (window.lucide) lucide.createIcons();
    },

    renderAccounts() {
        const payableList = document.getElementById('payable-list');
        const receivableList = document.getElementById('receivable-list');

        if (payableList) {
            payableList.innerHTML = window.FinanceStore.accountsPayable.map(a => `
                <div class="account-item">
                    <div class="acc-info">
                        <b>${a.desc}</b>
                        <small>Vencimento: ${new Date(a.dueDate).toLocaleDateString()}</small>
                        <div class="acc-status ${a.status}">${a.status === 'pending' ? 'Pendente' : 'Pago'}</div>
                    </div>
                    <div class="acc-value">
                        <span class="acc-amount">R$ ${a.amount.toFixed(2)}</span>
                        <div class="flex gap-2">
                            ${a.status === 'pending' ? `<button onclick="FinanceManager.payAccount('payable', ${a.id})" class="submit-btn btn-sm">Pagar</button>` : ''}
                            <button onclick="FinanceManager.deleteAccount('payable', ${a.id})" class="action-btn delete sm" title="Excluir"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
                        </div>
                    </div>
                </div>
            `).join('') || '<p class="empty-msg">Sem contas a pagar.</p>';
        }

        if (receivableList) {
            receivableList.innerHTML = window.FinanceStore.accountsReceivable.map(a => `
                <div class="account-item">
                    <div class="acc-info">
                        <b>${a.desc}</b>
                        <small>Vencimento: ${new Date(a.dueDate).toLocaleDateString()}</small>
                        <div class="acc-status ${a.status}">${a.status === 'pending' ? 'Pendente' : 'Recebido'}</div>
                    </div>
                    <div class="acc-value">
                        <span class="acc-amount">R$ ${a.amount.toFixed(2)}</span>
                        <div class="flex gap-2">
                            ${a.status === 'pending' ? `<button onclick="FinanceManager.payAccount('receivable', ${a.id})" class="submit-btn btn-sm" style="background:#10b981">Receber</button>` : ''}
                            <button onclick="FinanceManager.deleteAccount('receivable', ${a.id})" class="action-btn delete sm" title="Excluir"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
                        </div>
                    </div>
                </div>
            `).join('') || '<p class="empty-msg">Sem contas a receber.</p>';
        }
    },

    renderCashFlow() {
        const body = document.getElementById('cash-flow-body');
        if (!body) return;

        const period = document.getElementById('cash-period-filter')?.value || 'monthly';
        const now = new Date();
        let filtered = window.FinanceStore.transactions;

        if (period === 'daily') {
            const todayStr = now.toISOString().split('T')[0];
            filtered = filtered.filter(t => t.date && t.date.split('T')[0] === todayStr);
        } else if (period === 'weekly') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(t => t.date && new Date(t.date) >= weekAgo);
        } else if (period === 'monthly') {
            filtered = filtered.filter(t => {
                if (!t.date) return false;
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        } else if (period === 'yearly') {
            filtered = filtered.filter(t => {
                if (!t.date) return false;
                return new Date(t.date).getFullYear() === now.getFullYear();
            });
        }

        body.innerHTML = filtered.slice().reverse().map(t => `
            <tr>
                <td>${new Date(t.date).toLocaleDateString()}</td>
                <td>${t.desc}</td>
                <td>${t.metadata?.customerName || '-'}</td>
                <td><span class="status-chip ok">${t.category}</span></td>
                <td>${(t.method || 'PIX').toUpperCase()}</td>
                <td class="${t.type}">R$ ${parseFloat(t.amount).toFixed(2)}</td>
                <td style="text-align:right">
                    <button class="action-btn delete" onclick="FinanceManager.deleteTransaction(${t.id})" title="Excluir Transação">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="7" style="text-align:center">Sem movimentações no período.</td></tr>';
        if (window.lucide) lucide.createIcons();
    },

    filterCashFlow() {
        this.renderCashFlow();
    },

    openTransactionModal(fixedType = null) {
        const desc = prompt("Descrição da despesa:");
        if (!desc) return;
        const amount = parseFloat(prompt("Valor (R$):")?.replace(',', '.'));
        if (isNaN(amount)) return;
        const category = prompt("Categoria (Luz, Aluguel, Insumo, etc):") || 'Geral';

        window.FinanceStore.addTransaction(fixedType || 'out', amount, 'cash', desc, category);
        this.updateUI();
    },

    openAccountModal(type) {
        const desc = prompt(`Descrição da conta a ${type === 'payable' ? 'pagar' : 'receber'}:`);
        if (!desc) return;
        const amount = parseFloat(prompt("Valor (R$):")?.replace(',', '.'));
        if (isNaN(amount)) return;
        const dueDate = prompt("Data de Vencimento (AAAA-MM-DD):", new Date().toISOString().split('T')[0]);
        if (!dueDate) return;

        window.FinanceStore.addAccount(type, { desc, amount, dueDate });
        this.updateUI();
    },

    payAccount(type, id) {
        if (confirm(`Confirmar ${type === 'payable' ? 'pagamento' : 'recebimento'}?`)) {
            window.FinanceStore.markAsPaid(type, id);
            this.updateUI();
        }
    },

    handleCloseDay() {
        const report = window.FinanceStore.closeDay();
        alert(`Fechamento Realizado!\n\nData: ${report.date}\nSaldo: R$ ${report.total.toFixed(2)}\nTransações: ${report.transactions}`);
        this.updateUI();
    },

    deleteTransaction(id) {
        if (!window.AuthStore) return alert("Erro: Sistema de autenticação não carregado.");

        // Busca todos os administradores cadastrados
        const admins = window.AuthStore.users.filter(u => u.role === 'admin');
        if (admins.length === 0) return alert("ERRO CRÍTICO: Nenhum administrador encontrado.");

        const inputPass = prompt("SISTEMA DE SEGURANÇA: Digite a senha do ADMINISTRADOR para autorizar a exclusão:");
        if (inputPass === null) return; // Usuário cancelou o prompt

        const typedClean = inputPass.trim().toLowerCase();

        // Validação flexível: busca qualquer admin cuja senha coincida (ignora maiúsculas/minúsculas para evitar erros comuns)
        const authorizedAdmin = admins.find(a => a.password.trim().toLowerCase() === typedClean);

        if (authorizedAdmin) {
            const reason = prompt("MOTIVO DA EXCLUSÃO (Obrigatório):");
            if (!reason || reason.trim() === "") return alert("A exclusão foi cancelada. É obrigatório informar o motivo.");

            if (confirm(`Confirma a exclusão permanente? \nAutorizado por: ${authorizedAdmin.name}\nOs itens desta venda retornarão ao estoque.`)) {
                window.FinanceStore.deleteTransaction(id, authorizedAdmin.name, reason);
                this.updateUI();

                // Forçar atualização de estoque e indicadores em todas as telas
                if (window.renderProducts) window.renderProducts();
                if (window.SalesManager) {
                    window.SalesManager.renderSalesProducts();
                    window.SalesManager.updateIndicators();
                }

                alert("Sucesso! Registro excluído, estoque atualizado e auditoria salva.");
            }
        } else {
            // Se falhar, dá uma dica caso a senha seja a padrão
            const tip = (typedClean === 'admin') ? "\nDica: Verifique se você alterou a senha padrão." : "";
            alert("SENHA INCORRETA! Acesso negado." + tip);
        }
    },

    deleteAccount(type, id) {
        if (confirm(`Deseja excluir permanentemente este registro de conta a ${type === 'payable' ? 'pagar' : 'receber'}?`)) {
            window.FinanceStore.deleteAccount(type, id);
            this.updateUI();
        }
    },

    generateReport(type) {
        if (window.ReportManager) {
            window.ReportManager.openReport(type);
        }
    }
};

window.FinanceManager = FinanceManager;
window.FinanceStore = FinanceStore;
console.log("Módulo: finance.js (Manager) carregado.");
