const ReportManager = {
    activeReport: 'vendas',

    init() {
        console.log("ReportManager inicializando...");
        this.renderVendasReport();
    },

    switchReportView(type) {
        console.log("Alternando relatório para:", type);
        this.activeReport = type;

        // Resetar botões de filtro
        document.querySelectorAll('.report-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.report === type);
        });

        // Garantir que o modal central esteja aberto
        const centralModal = document.getElementById('report-central-modal');
        if (centralModal) centralModal.classList.add('active');

        // Esconder todas as áreas de relatório
        document.querySelectorAll('.report-content-area').forEach(area => {
            area.style.display = 'none';
        });

        // Mostrar a área correta
        const targetArea = document.getElementById(`report-area-${type}`);
        if (targetArea) targetArea.style.display = 'block';

        // Carregar dados específicos
        switch (type) {
            case 'vendas': this.renderVendasReport(); break;
            case 'financeiro': this.renderFinanceReport(); break;
            case 'estoque': this.renderStockReport(); break;
            case 'clientes': this.renderCustomerReport(); break;
        }
    },

    renderVendasReport() {
        const container = document.getElementById('report-vendas-list');
        if (!container) return;
        const sales = window.SalesManager?.getSales() || [];
        if (sales.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="empty-msg">Nenhuma venda encontrada.</td></tr>';
            return;
        }
        container.innerHTML = sales.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.customerName}</td>
                <td>${s.date}</td>
                <td>R$ ${parseFloat(s.total).toFixed(2)}</td>
                <td><button onclick="ReportManager.viewSaleDetails('${s.id}')" class="view-btn">Ver</button></td>
            </tr>
        `).join('');
    },

    renderStockReport() {
        const container = document.getElementById('report-estoque-list');
        if (!container) return;
        const items = window.InventoryStore?.getAll() || [];
        container.innerHTML = items.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.stock}</td>
                <td>R$ ${parseFloat(p.cost).toFixed(2)}</td>
                <td>R$ ${parseFloat(p.price).toFixed(2)}</td>
                <td>${p.stock <= p.minStock ? '<span class="status-alert">Baixo</span>' : 'OK'}</td>
            </tr>
        `).join('');
    },

    renderFinanceReport() {
        const container = document.getElementById('report-finance-list');
        if (!container) return;
        const entries = window.FinanceStore?.transactions || [];
        if (entries.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="empty-msg">Nenhuma transação encontrada.</td></tr>';
            return;
        }
        container.innerHTML = entries.slice().reverse().map(e => `
            <tr>
                <td>${new Date(e.date).toLocaleDateString('pt-BR')}</td>
                <td>${e.desc}</td>
                <td class="${e.type}">${e.type === 'in' ? '+' : '-'} R$ ${parseFloat(e.amount).toFixed(2)}</td>
                <td>${e.category || 'Geral'}</td>
            </tr>
        `).join('');
    },

    renderCustomerReport() {
        const container = document.getElementById('report-clientes-list');
        if (!container) return;
        const clients = window.CustomerStore?.getAll() || [];
        container.innerHTML = clients.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.totalPurchases || 0}</td>
                <td>R$ ${parseFloat(c.balance || 0).toFixed(2)}</td>
            </tr>
        `).join('');
    },

    openReport(type) {
        // Gerar relatório diretamente sem modal de filtros
        this._directReport(type);
    },

    _directReport(type) {
        const typeEl = document.getElementById('filter-report-type');
        if (typeEl) {
            typeEl.value = type;
        }
        // Armazenar o tipo diretamente para garantir que processReportExport o receba
        window._directReportType = type;
        if (window.processReportExport) {
            window.processReportExport();
        } else {
            alert('Função de relatório não disponível. Recarregue a página.');
        }
    },

    generateStockReport(type) {
        window.activeInventoryType = type;
        openA4ReportView(type, true);
    },

    generateSalesReport() {
        this._directReport('vendas');
    },

    generateCustomerConsumptionReport() {
        this._directReport('consumo');
    },

    generateBillingReport() {
        this._directReport('faturamento');
    },

    generateReportFromFilters(e) {
        e.preventDefault();
        const type = document.getElementById('filter-report-type').value;
        const modal = document.getElementById('report-filter-modal');
        if (modal) modal.classList.remove('active');

        // Todos os tipos usam processReportExport diretamente
        if (window.processReportExport) {
            window.processReportExport(e);
        } else {
            alert('Função de exportação não disponível. Recarregue a página.');
        }
    },

    openReportFilterModal(type) {
        const modal = document.getElementById('report-filter-modal');
        const form = document.getElementById('report-filter-form');
        if (!modal || !form) return;

        modal.classList.add('active');
        form.reset();

        const typeEl = document.getElementById('filter-report-type');
        if (typeEl) typeEl.value = type;

        // Mostrar/Esconder grupos de filtros baseados no tipo
        const clientGroup = document.getElementById('filter-client-group');
        const invGroup = document.getElementById('filter-inventory-type-group');
        const catGroup = document.getElementById('filter-category-group');
        const payGroup = document.getElementById('filter-payment-group');
        const stockGroup = document.getElementById('filter-stock-group');

        if (clientGroup) clientGroup.style.display = (type === 'consumo' || type === 'clientes') ? 'block' : 'none';
        if (invGroup) invGroup.style.display = (type === 'estoque') ? 'block' : 'none';
        if (catGroup) catGroup.style.display = (type === 'estoque') ? 'block' : 'none';
        if (payGroup) payGroup.style.display = (type === 'vendas' || type === 'faturamento') ? 'block' : 'none';
        if (stockGroup) stockGroup.style.display = (type === 'estoque') ? 'block' : 'none';

        // Carregar clientes no select se necessário
        const clientSelect = document.getElementById('filter-client-id');
        if (clientSelect && window.CustomerStore) {
            const customers = window.CustomerStore.getAll();
            clientSelect.innerHTML = '<option value="">Todos os Clientes</option>' +
                customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        if (window.lucide) lucide.createIcons();
    },

    exportCurrent(format) {
        if (!window.currentExportData) return alert("Nenhum dado para exportar.");
        const { data, title, fileName, origin } = window.currentExportData;

        switch (format) {
            case 'xlsx':
                exportToXLSX(data, fileName + '.xlsx', title);
                break;
            case 'pdf':
                exportToPDF(data, fileName + '.pdf', title, origin);
                break;
            case 'csv':
                exportToCSV(data, fileName + '.csv');
                break;
        }
    },

    backToFilters() {
        document.getElementById('report-preview-modal').classList.remove('active');
        document.getElementById('report-filter-modal').classList.add('active');
    },

    viewSaleDetails(saleId) {
        console.log("Visualizando detalhes da venda:", saleId);
        const sales = window.SalesManager?.getSales ? window.SalesManager.getSales() : [];
        const sale = sales.find(s => s.id == saleId);
        if (!sale) return alert("Venda não encontrada.");

        // Formatar detalhes para exibir
        let itemsHtml = (sale.items || []).map(item =>
            `${item.qty}x ${item.name} - R$ ${(item.qty * item.price).toFixed(2)}`
        ).join('\n');

        alert(`DETALHES DA VENDA #${saleId}\n\nCliente: ${sale.customerName}\nData: ${sale.date}\nTotal: R$ ${parseFloat(sale.total).toFixed(2)}\n\nITENS:\n${itemsHtml}`);
    },

    processReportEmail() {
        alert("A função de envio por E-mail requer configuração de servidor SMTP. Por favor, utilize a exportação para PDF e anexe ao seu e-mail manualmente.");
    }
};

window.processReportEmail = () => ReportManager.processReportEmail();


// --- LÓGICA DE RELATÓRIO A4 INTERATIVO RESTAURADA ---

window.currentReportItems = [];
window.isFullStockReport = false;

function openA4ReportView(type, isFull = true) {
    window.activeInventoryType = type || 'produto';
    generateReport(isFull);
}

function generateReport(isFullStock = false) {
    window.isFullStockReport = isFullStock;
    const data = isFullStock
        ? window.InventoryStore.getFullStockReport(window.activeInventoryType)
        : window.InventoryStore.getPurchaseReport(window.activeInventoryType);

    window.currentReportItems = data.map(p => ({
        id: p.id,
        name: p.name,
        qty: isFullStock ? p.stock : Math.max(1, (p.minStock || 0) - (p.stock || 0)),
        cost: p.cost || 0,
        price: p.price || 0,
        isManual: false,
        type: p.type
    }));

    renderReportPages();
}

function renderReportPages() {
    const container = document.getElementById('report-pages-container') || document.getElementById('report-preview-body');
    const modal = document.getElementById('report-modal');
    if (!container || !modal) return;

    if (window.currentReportItems.length === 0) {
        container.innerHTML = '<p class="empty-msg" style="text-align:center; padding: 2rem; color: #fff;">Nenhum item na lista de compras.</p>';
        modal.classList.add('active');
        return;
    }

    const itemsPerPage = 30;
    const totalPages = Math.ceil(window.currentReportItems.length / itemsPerPage);
    let html = '';

    for (let i = 0; i < totalPages; i++) {
        const pageItems = window.currentReportItems.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
        const isLastPage = (i === totalPages - 1);

        html += `
            <div class="a4-page" style="position: relative; height: 265mm; page-break-after: ${isLastPage ? 'avoid' : 'always'}; box-sizing: border-box; overflow: hidden; margin: 0 auto; background: white; color: black; padding: 10mm; font-family: Arial, sans-serif;">
                <header class="a4-header" style="${i > 0 ? 'margin-bottom: 0.2rem;' : ''}">
                    ${i === 0 ? `
                    ${window.isFullStockReport ? `
                    <div style="text-align: center; margin-bottom: 0.3rem;">
                        <div style="font-size: 16pt; font-weight: 900; color: #0f172a; letter-spacing: 2px; text-transform: uppercase;">ESTOQUE COMPLETO</div>
                        <div style="height: 2px; background: linear-gradient(90deg, transparent, #0f172a, transparent); margin-top: 0.2rem;"></div>
                    </div>
                    ` : ''}
                    <div class="a4-logos-wrapper" style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-bottom: 5mm; border-bottom: 2px solid #000; padding-bottom: 2mm;">
                        <div class="a4-logo-col left" style="display: flex; align-items: center; gap: 10px;">
                            <img src="assets/logo_3d.png" alt="Cozinha Logo" class="a4-logo" style="height: 60px; width: auto;">
                            <div class="a4-logo-title-small" style="font-size: 12pt; font-weight: 800; line-height: 1.2;">CANTINA<br>DOS AMIGOS</div>
                        </div>
                        <div class="a4-logo-col center">
                            <img src="https://www.provida.net/wp-content/uploads/2021/01/Logo_PVPT@2x.png" alt="Provida Logo" class="a4-logo" style="height: 60px; width: auto;">
                        </div>
                         <div class="a4-logo-col right" style="text-align: right;">
                             <div class="flex flex-row gap-2" style="display: flex; justify-content: flex-end; align-items: center; gap: 10px;">
                                <button class="a4-print-icon-btn no-print" onclick="printReport()" title="Imprimir Relat\u00f3rio" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
                                    IMPRIMIR
                                </button>
                                <button class="a4-back-icon-btn no-print" onclick="closeReportModal()" title="Fechar" style="background: #64748b; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
                                    VOLTAR
                                </button>
                            </div>
                        </div>
                    </div>
                    ` : `
                    <div class="a4-logos-wrapper" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; border-bottom: 1px solid #000;">
                         <div style="font-weight: 800; font-size: 8pt; color: #1e293b; text-transform: uppercase;">CANTINA DOS AMIGOS - Solicitação de Compras</div>
                    </div>
                    `}

                    <div class="a4-subheader-row" style="${(i > 0 || window.isFullStockReport) ? 'display: none;' : 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5mm;'}">
                        <div class="a4-subtitle-center" style="font-size: 16pt; font-weight: 800; text-align: center; flex: 1;">
                            ${`SOLICITAÇÃO DE COMPRAS${window.activeInventoryType === 'insumo' ? ' - INSUMOS' : ''}`}
                        </div>
                        <div class="a4-metadata-right" style="text-align: right; font-size: 9pt;">
                            <span class="a4-date-ref">${new Date().toLocaleDateString('pt-BR')}</span><br>
                            <span class="a4-time-ref">Hora: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    ${window.isFullStockReport ? `
                    <div style="text-align: right; font-size: 9pt; color: #64748b; margin-bottom: 2mm;">
                        ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    ` : ''}
                </header>

                ${(i === 0 && !window.isFullStockReport) ? `
                <div class="a4-add-item-bar no-print" style="margin-bottom: 5mm; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <div class="add-item-inputs" style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" id="manual-item-name" placeholder="Nome do Produto" style="flex: 1; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
                        <input type="number" id="manual-item-qty" placeholder="Qtd" style="width: 60px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
                        <input type="number" id="manual-item-cost" placeholder="Custo R$" style="width: 90px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
                        <button class="add-manual-btn" onclick="addManualItemToReport()" style="background: #d4af37; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600;">
                            + Item
                        </button>
                    </div>
                </div>
                ` : ''}

                <div class="a4-table-container">
                    <table class="a4-table" style="width: 100%; border-collapse: collapse; font-size: 12pt;">
                        <thead>
                            <tr style="border-bottom: 2px solid #000; background: #f1f5f9;">
                                <th style="width: 40px; padding: 2mm; text-align: center;">#</th>
                                <th style="text-align: left; padding: 2mm;">Produto</th>
                                <th style="text-align: center; padding: 2mm;">${window.isFullStockReport ? 'Qtd. Estoque' : 'Qtd. Compra'}</th>
                                <th style="text-align: right; padding: 2mm;">Custo Unit.</th>
                                <th style="text-align: right; padding: 2mm;">Subtotal (Custo)</th>
                                ${!window.isFullStockReport ? '<th class="no-print" style="text-align: center; width: 60px; padding: 2mm;">Ações</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${pageItems.map((p, index) => {
            const rowNumber = (i * itemsPerPage) + index + 1;
            const subtotal = p.qty * p.cost;
            return `
                                    <tr style="border-bottom: 1px solid #e2e8f0; line-height: 1.0;">
                                        <td style="font-weight: 700; text-align: center; padding: 1mm;">${rowNumber}</td>
                                        <td style="padding: 1mm;"><strong>${p.name}</strong></td>
                                        <td style="text-align:center; padding: 1mm;">
                                            ${!window.isFullStockReport ? `
                                                <input type="number" value="${p.qty}" onchange="updatePageItemQty(${rowNumber - 1}, this.value)" style="width: 45px; text-align: center; border: 1px solid #cbd5e1; border-radius: 3px; font-family: Arial;">
                                            ` : `<span style="font-weight: 600;">${p.qty}</span>`}
                                        </td>
                                        <td style="text-align:right; padding: 1mm; white-space: nowrap;">R$ ${p.cost.toFixed(2)}</td>
                                        <td style="text-align:right; padding: 1mm; white-space: nowrap; font-weight: 700;">R$ ${subtotal.toFixed(2)}</td>
                                        ${!window.isFullStockReport ? `
                                            <td class="no-print" style="text-align:center; padding: 1mm;">
                                                <button onclick="removeReportItem(${rowNumber - 1})" title="Excluir" style="color: #ef4444; background: none; border: none; cursor: pointer; font-size: 1rem; padding: 2px;">🗑️</button>
                                            </td>
                                        ` : ''}
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>

                ${isLastPage ? `
                    <div style="text-align:right; margin-top: 10mm; font-size: 14pt; font-weight: 800; border-top: 2px solid #000; padding-top: 2mm;">
                        TOTAL ESTIMADO: R$ ${calculateReportTotalValue()}
                    </div>

                    ${!window.isFullStockReport ? `
                    <div style="position: absolute; bottom: 30mm; left: 10mm; right: 10mm; display: flex; justify-content: space-around; gap: 20mm;">
                        <div style="flex: 1; text-align: center; border-top: 1px solid #000; padding-top: 2mm; font-size: 10pt; font-weight: 700;">Responsável pela Compra</div>
                        <div style="flex: 1; text-align: center; border-top: 1px solid #000; padding-top: 2mm; font-size: 10pt; font-weight: 700;">Autorização Provida</div>
                    </div>
                    ` : ''}
                ` : ''}

                <div style="position: absolute; bottom: 5mm; right: 10mm; font-size: 8pt; color: #64748b;">Página ${i + 1} de ${totalPages}</div>
            </div>
        `;
    }

    container.innerHTML = html;
    modal.classList.add('active');
    // Limpar qualquer pointer-events inline que restoreAllButtons() possa ter adicionado
    modal.style.pointerEvents = '';
    modal.style.display = '';
    if (window.lucide) lucide.createIcons();
}

function addManualItemToReport() {
    const name = document.getElementById('manual-item-name').value;
    const qty = parseInt(document.getElementById('manual-item-qty').value) || 0;
    const cost = parseFloat(document.getElementById('manual-item-cost').value) || 0;

    if (!name || qty <= 0) {
        alert('Preencha o nome e a quantidade do item!');
        return;
    }

    window.currentReportItems.push({
        id: Date.now(),
        name: name,
        qty: qty,
        cost: cost,
        isManual: true,
        type: window.activeInventoryType || 'produto'
    });

    document.getElementById('manual-item-name').value = '';
    document.getElementById('manual-item-qty').value = '';
    document.getElementById('manual-item-cost').value = '';

    renderReportPages();
}


function calculateReportTotalValue() {
    let total = window.currentReportItems.reduce((acc, item) => acc + (item.qty * item.cost), 0);
    return total.toFixed(2);
}

function removeReportItem(index) {
    window.currentReportItems.splice(index, 1);
    renderReportPages();
}

function updatePageItemQty(index, val) {
    window.currentReportItems[index].qty = parseInt(val) || 0;
    renderReportPages();
}

function closeReportModal() {
    const modal = document.getElementById('report-modal');
    if (modal) {
        modal.classList.remove('active');
        // Restaurar o header para quando o estoque/compras for aberto novamente
        const reportHeader = modal.querySelector('.report-header');
        if (reportHeader) reportHeader.style.display = '';
    }
}

// Global Print Engine (Iframe Isolation)
window._originalPrint = window.print; // Salvar referencia original
window.print = function () {
    const content = document.getElementById('report-pages-container');
    if (!content) {
        if (window._originalPrint) return window._originalPrint.call(window);
        return;
    }

    let iframe = document.getElementById('print-iframe') || document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.display = 'none';
    if (!iframe.parentElement) document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
            <head><style>
                @page { size: A4; margin: 0; }
                body { margin: 0; padding: 0; background: white; }
                .no-print { display: none !important; }
                .a4-page { width: 210mm; min-height: 297mm; box-sizing: border-box; }
            </style></head>
            <body>${content.innerHTML}</body>
        </html>
    `);
    doc.close();
    // Usar contentWindow.print() diretamente para evitar recursão infinita
    iframe.contentWindow.onload = function () {
        setTimeout(() => iframe.contentWindow.print(), 500);
    };
};

// ═══════ RENDERIZADOR A4 GENÉRICO PARA RELATÓRIOS TABULARES ═══════
function renderGenericA4Report(data, reportTitle) {
    const container = document.getElementById('report-pages-container') || document.getElementById('report-preview-body');
    const modal = document.getElementById('report-modal');
    if (!container || !modal) {
        console.error('renderGenericA4Report: container ou modal não encontrado!');
        alert('Erro: Modal de relatório não encontrado. Recarregue a página.');
        return;
    }

    // Ocultar o header fixo do report-modal (que diz "Planilha de Compras")
    const reportHeader = modal.querySelector('.report-header');
    if (reportHeader) reportHeader.style.display = 'none';

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="a4-page" style="position: relative; height: 265mm; box-sizing: border-box; overflow: hidden; margin: 0 auto; background: white; color: black; padding: 10mm; font-family: Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 0.3rem;">
                    <div style="font-size: 16pt; font-weight: 900; color: #0f172a; letter-spacing: 2px; text-transform: uppercase;">${reportTitle}</div>
                    <div style="height: 2px; background: linear-gradient(90deg, transparent, #0f172a, transparent); margin-top: 0.2rem;"></div>
                </div>
                <div class="a4-logos-wrapper" style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-bottom: 5mm; border-bottom: 2px solid #000; padding-bottom: 2mm;">
                    <div class="a4-logo-col left" style="display: flex; align-items: center; gap: 10px;">
                        <img src="assets/logo_3d.png" alt="Logo" style="height: 60px; width: auto;">
                        <div style="font-size: 12pt; font-weight: 800; line-height: 1.2;">CANTINA<br>DOS AMIGOS</div>
                    </div>
                    <div class="a4-logo-col center">
                        <img src="https://www.provida.net/wp-content/uploads/2021/01/Logo_PVPT@2x.png" alt="Provida" style="height: 60px; width: auto;">
                    </div>
                    <div style="text-align: right;">
                        <button class="no-print" onclick="closeReportModal()" style="background: #64748b; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600;">VOLTAR</button>
                    </div>
                </div>
                <div style="text-align: center; padding: 4rem 1rem; color: #64748b;">
                    <p style="font-size: 1.3rem; font-weight: 700;">📋 Nenhum registro encontrado</p>
                    <p style="font-size: 0.95rem; margin-top: 0.5rem;">Não há dados disponíveis para este relatório.</p>
                </div>
            </div>
        `;
        modal.classList.add('active');
        modal.style.pointerEvents = '';
        return;
    }

    const headers = Object.keys(data[0]).filter(k => k !== 'id');
    const itemsPerPage = 25;
    const totalPages = Math.ceil(data.length / itemsPerPage);
    let html = '';

    for (let i = 0; i < totalPages; i++) {
        const pageItems = data.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
        const isLastPage = (i === totalPages - 1);

        html += `
            <div class="a4-page" style="position: relative; height: 265mm; page-break-after: ${isLastPage ? 'avoid' : 'always'}; box-sizing: border-box; overflow: hidden; margin: 0 auto; background: white; color: black; padding: 10mm; font-family: Arial, sans-serif;">
                <header class="a4-header">
                    ${i === 0 ? `
                    <div style="text-align: center; margin-bottom: 0.3rem;">
                        <div style="font-size: 16pt; font-weight: 900; color: #0f172a; letter-spacing: 2px; text-transform: uppercase;">${reportTitle}</div>
                        <div style="height: 2px; background: linear-gradient(90deg, transparent, #0f172a, transparent); margin-top: 0.2rem;"></div>
                    </div>
                    <div class="a4-logos-wrapper" style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-bottom: 5mm; border-bottom: 2px solid #000; padding-bottom: 2mm;">
                        <div class="a4-logo-col left" style="display: flex; align-items: center; gap: 10px;">
                            <img src="assets/logo_3d.png" alt="Logo" style="height: 60px; width: auto;">
                            <div style="font-size: 12pt; font-weight: 800; line-height: 1.2;">CANTINA<br>DOS AMIGOS</div>
                        </div>
                        <div class="a4-logo-col center">
                            <img src="https://www.provida.net/wp-content/uploads/2021/01/Logo_PVPT@2x.png" alt="Provida" style="height: 60px; width: auto;">
                        </div>
                        <div style="text-align: right;">
                            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px;">
                                <button class="no-print" onclick="printReport()" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">IMPRIMIR</button>
                                <button class="no-print" onclick="closeReportModal()" style="background: #64748b; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">VOLTAR</button>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 9pt; color: #64748b; margin-bottom: 2mm;">
                        ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    ` : `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; border-bottom: 1px solid #000; padding-bottom: 1mm;">
                        <div style="font-weight: 800; font-size: 8pt; text-transform: uppercase;">CANTINA DOS AMIGOS - ${reportTitle}</div>
                        <button class="no-print" onclick="printReport()" style="background: #10b981; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 0.65rem;">IMPRIMIR</button>
                    </div>
                    `}
                </header>

                <div class="a4-table-container">
                    <table class="a4-table" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                        <thead>
                            <tr style="border-bottom: 2px solid #000; background: #f1f5f9;">
                                <th style="width: 35px; padding: 2mm; text-align: center;">#</th>
                                ${headers.map(h => `<th style="text-align: left; padding: 2mm; font-size: 9pt;">${h}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${pageItems.map((row, index) => {
            const rowNumber = (i * itemsPerPage) + index + 1;
            return `
                                    <tr style="border-bottom: 1px solid #e2e8f0; line-height: 1.1;">
                                        <td style="font-weight: 700; text-align: center; padding: 1.5mm; font-size: 9pt;">${rowNumber}</td>
                                        ${headers.map(h => `<td style="padding: 1.5mm; font-size: 9pt;">${row[h] || '-'}</td>`).join('')}
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>

                ${isLastPage ? `
                    <div style="text-align: right; margin-top: 5mm; font-size: 11pt; font-weight: 800; border-top: 2px solid #000; padding-top: 2mm;">
                        TOTAL DE REGISTROS: ${data.length}
                    </div>
                ` : ''}

                <div style="position: absolute; bottom: 5mm; right: 10mm; font-size: 8pt; color: #64748b;">Página ${i + 1} de ${totalPages}</div>
            </div>
        `;
    }

    container.innerHTML = html;
    modal.classList.add('active');
    modal.style.pointerEvents = '';
    modal.style.display = '';
    if (window.lucide) lucide.createIcons();
}

// ═══════ GERADORES DE RELATÓRIOS DIRETOS (A4) ═══════

function openSalesA4Report() {
    const sales = window.FinanceStore?.transactions?.filter(t => t.type === 'in' && (t.category === 'Vendas' || t.category === 'Venda' || t.category === 'Consumo')) || [];
    const data = sales.map(s => {
        const items = s.metadata?.items || [];
        const itemsStr = items.map(it => `${it.qty}x ${it.name}`).join(', ') || 'Venda Geral';
        return {
            "Data": new Date(s.date).toLocaleDateString('pt-BR'),
            "Descrição": s.desc || itemsStr,
            "Itens": itemsStr,
            "Valor (R$)": `R$ ${parseFloat(s.amount).toFixed(2)}`,
            "Pagamento": (s.method || 'PIX').toUpperCase()
        };
    });
    renderGenericA4Report(data, 'RELATÓRIO DE VENDAS');
}

function openDeletedA4Report() {
    const deleted = window.FinanceStore?.deletedTransactions || [];
    const data = deleted.map(t => {
        const items = t.metadata?.items || [];
        const itemsStr = items.map(it => `${it.qty}x ${it.name}`).join(', ') || t.desc || 'N/A';
        return {
            "Data Original": new Date(t.date).toLocaleDateString('pt-BR'),
            "Cancelado em": new Date(t.deletedAt).toLocaleString('pt-BR'),
            "Cliente": t.metadata?.customerName || "Não informado",
            "Itens": itemsStr,
            "Valor": `R$ ${parseFloat(t.amount).toFixed(2)}`,
            "Motivo": t.reason || "Não informado"
        };
    });
    renderGenericA4Report(data, 'AUDITORIA DE CANCELAMENTOS');
}

function openCustomersA4Report() {
    const customers = window.CustomerStore?.getAll() || [];
    const data = customers.map(c => ({
        "Nome": c.name || '-',
        "Telefone": c.phone || '-',
        "Email": c.email || '-',
        "Endereço": c.address || '-'
    }));
    renderGenericA4Report(data, 'LISTA DE CLIENTES');
}

function openBillingA4Report() {
    const sales = window.FinanceStore?.transactions?.filter(t => t.type === 'in' && (t.category === 'Vendas' || t.category === 'Venda' || t.category === 'Consumo' || t.category === 'Almoço' || t.category === 'Jantar')) || [];
    const data = sales.map(s => {
        const items = s.metadata?.items || [];
        const itemsStr = items.map(it => `${it.qty}x ${it.name}`).join(', ') || 'Venda Geral';
        return {
            "Data": new Date(s.date).toLocaleDateString('pt-BR'),
            "Descrição": s.desc || '-',
            "Itens": itemsStr,
            "Valor (R$)": `R$ ${parseFloat(s.amount).toFixed(2)}`,
            "Pagamento": (s.method || 'PIX').toUpperCase()
        };
    });
    renderGenericA4Report(data, 'FATURAMENTO DETALHADO');
}

function openConsumptionA4Report() {
    const sales = window.FinanceStore?.transactions?.filter(t => {
        if (t.type !== 'in') return false;
        const cat = (t.category || '').toLowerCase();
        return cat === 'vendas' || cat === 'venda' || cat === 'consumo';
    }) || [];
    const data = sales.map(s => {
        const items = s.metadata?.items || [];
        const itemsStr = items.map(it => `${it.qty}x ${it.name}`).join(', ') || 'Consumo';
        return {
            "Data": new Date(s.date).toLocaleDateString('pt-BR'),
            "Cliente": s.metadata?.customerName || s.desc || '-',
            "Itens": itemsStr,
            "Valor (R$)": `R$ ${parseFloat(s.amount).toFixed(2)}`,
            "Pagamento": (s.method || 'PIX').toUpperCase()
        };
    });
    renderGenericA4Report(data, 'CONSUMO POR CLIENTE');
}


// --- EXPOSIÇÃO GLOBAL DIRETA ---
window.ReportManager = ReportManager;
window.switchReportView = (type) => ReportManager.switchReportView(type);
window.openA4ReportView = openA4ReportView;
window.closeReportModal = closeReportModal;
window.removeReportItem = removeReportItem;
window.updatePageItemQty = updatePageItemQty;
window.generateReport = generateReport;
window.calculateReportTotalValue = calculateReportTotalValue;
window.renderReportPages = renderReportPages;
window.printReport = window.print; // Alias para compatibilidade
window.addManualItemToReport = addManualItemToReport;
window.renderGenericA4Report = renderGenericA4Report;
window.openSalesA4Report = openSalesA4Report;
window.openDeletedA4Report = openDeletedA4Report;
window.openCustomersA4Report = openCustomersA4Report;
window.openBillingA4Report = openBillingA4Report;
window.openConsumptionA4Report = openConsumptionA4Report;
console.log("Módulo: reports.js carregado com Premium A4 UI.");

