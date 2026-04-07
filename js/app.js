function filterHomeProducts(query) {
    const products = window.InventoryStore.getAll();
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
    );
    renderProducts(filtered);
}




// --- CORE FUNCTIONALITIES (Restored & Direct Exposure) ---
window.activeInventoryType = 'produto';
var editingProductId = null;

window.openProductModal = function () {
    console.log("Executando: openProductModal");
    editingProductId = null;
    const modal = document.getElementById('product-modal');
    if (!modal) return console.error("Modal de produto não encontrado!");

    modal.classList.add('active');
    // Limpar inline pointer-events que restoreAllButtons() pode ter adicionado
    modal.style.pointerEvents = '';
    modal.style.display = '';
    document.querySelector('#product-modal h2').innerText = 'Novo Produto';
    document.querySelector('#product-form .submit-btn-new').innerText = 'Salvar Item';
    document.getElementById('p-img-preview').src = 'https://via.placeholder.com/150?text=Prévia';
    document.getElementById('product-form').reset();

    const invBtn = document.getElementById('invoice-btn-modal');
    if (invBtn) {
        invBtn.style.borderColor = "";
        invBtn.style.color = "";
        invBtn.querySelector('span').innerText = "Anexar Nota";
    }
    document.getElementById('p-invoice').value = '';
    document.getElementById('p-type').value = window.activeInventoryType || 'produto';
    updateModalFieldsByType(window.activeInventoryType || 'produto');
};

window.closeProductModal = function () {
    document.getElementById('product-modal').classList.remove('active');
};

function updateModalFieldsByType(type) {
    const priceGroup = document.getElementById('p-price-group');
    const priceInput = document.getElementById('p-price');
    const categorySelect = document.getElementById('p-category');

    if (type === 'insumo' || type === 'geral') {
        if (priceGroup) priceGroup.style.display = 'none';
        if (priceInput) {
            priceInput.required = false;
            if (!editingProductId) priceInput.value = 0;
        }
        if (categorySelect) {
            Array.from(categorySelect.options).forEach(opt => {
                if (type === 'insumo') {
                    opt.style.display = (opt.value === 'Insumos') ? 'block' : 'none';
                    if (opt.value === 'Insumos') categorySelect.value = opt.value;
                } else {
                    opt.style.display = 'block';
                }
            });
        }
    } else {
        if (priceGroup) priceGroup.style.display = 'block';
        if (priceInput) priceInput.required = true;
        if (categorySelect) {
            Array.from(categorySelect.options).forEach(opt => {
                opt.style.display = (opt.value === 'Insumos') ? 'none' : 'block';
            });
            if (categorySelect.value === 'Insumos') categorySelect.value = 'Salgados';
        }
    }
}

// NOTA: previewNewImage e pasteFromClipboard definidas abaixo com versão completa (linha ~912)

window.searchProductImage = function () {
    const name = document.getElementById('p-name').value;
    if (!name) return alert('Digite o nome do produto!');
    window.open(`https://www.google.com/search?q=${encodeURIComponent(name + " png fundo transparente")}&tbm=isch`, '_blank');
};


function renderProducts(filteredList = null) {
    const list = document.getElementById('product-list');
    const tableBody = document.getElementById('inventory-table-body');
    const viewTitle = document.getElementById('inventory-view-title');

    if (!list && !tableBody) return;

    const allProducts = window.InventoryStore.getAll()
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    // 1. Vitrine do Painel (Sempre produtos para venda)
    if (list) {
        const showcaseProducts = allProducts
            .filter(p => p.type === 'produto' && p.hideInShowcase !== true)
            .slice(0, 20);

        list.innerHTML = showcaseProducts.map((p, i) => {
            const price = parseFloat(p.price) || 0;
            return `
            <div class="product-card" onclick="openPayment(${p.id})" style="animation-delay: ${i * 0.05}s">
                <div class="product-img">
                    <img src="${p.img}" alt="${p.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/200x180?text=Produto'">
                    ${p.stock <= p.minStock ? '<span class="stock-badge">Estoque Baixo</span>' : ''}
                    <div class="product-price-badge">R$ ${price.toFixed(2)}</div>
                    <button class="showcase-delete-btn" onclick="event.stopPropagation(); removeFromShowcase(${p.id})" title="Remover dos Destaques">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
                <div class="product-name-bottom">${p.name}</div>
            </div>
        `}).join('');
    }

    // 2. Tabela de Inventário (Filtrada pelo tipo ativo)
    if (tableBody) {
        let inventoryProducts = (filteredList || allProducts)
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

        // Definir se estamos na visão de estoque para aplicar filtros de tipo
        const isInventoryView = document.getElementById('inventory').classList.contains('active');

        // Se for a visão normal de estoque, aplicar filtro de tipo (Produtos/Insumos)
        if (isInventoryView && !filteredList) {
            const targetType = window.activeInventoryType || 'produto';
            if (targetType === 'all') {
                // Modo completo: não filtra por tipo
            } else {
                let filtered = inventoryProducts.filter(p => p.type === targetType);
                if (filtered.length === 0 && inventoryProducts.length > 0) {
                    console.warn(`Nenhum item do tipo ${targetType} encontrado. Mostrando todos.`);
                } else {
                    inventoryProducts = filtered;
                }
            }
        }

        if (viewTitle) {
            const currentType = window.activeInventoryType || 'produto';
            viewTitle.innerText = currentType === 'all' ? 'ESTOQUE COMPLETO' :
                currentType === 'produto' ? 'Estoque: Produtos para Vendas' :
                    currentType === 'insumo' ? 'Estoque: Insumos (Cozinha)' : 'Estoque: Materiais Gerais';
        }

        // Mostrar cabeçalho de valores (sempre visível agora, mas muda o rótulo)
        const sellHead = document.getElementById('col-venda-head');
        if (sellHead) {
            sellHead.innerText = (window.activeInventoryType === 'produto' || window.activeInventoryType === 'all') ? 'Valores (V/C)' : 'Custo';
            sellHead.style.display = '';
        }

        tableBody.innerHTML = inventoryProducts.map(p => {
            const price = parseFloat(p.price) || 0;
            const cost = parseFloat(p.cost) || 0;
            const isProduct = window.activeInventoryType === 'produto';
            return `
            <tr>
                <td>
                    <div class="table-img-container" onclick="editProductImg(${p.id})">
                        <img src="${p.img}" class="table-img" onerror="this.onerror=null;this.src='https://via.placeholder.com/60x60?text=Figura'">
                    </div>
                </td>
                <td>
                    <div class="flex items-center gap-2">
                        <strong class="gold-text">${p.name}</strong>
                        ${p.invoice ? `
                            <button class="action-btn invoice" onclick="viewInvoice('${p.invoice}')" title="Ver Nota Fiscal">
                                <i data-lucide="file-text"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
                <td>${p.category}</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        ${p.type === 'produto' ? `
                            <span style="color:var(--gold); font-weight:600; font-size:0.85rem;">V: R$ ${price.toFixed(2)}</span>
                            <span style="color:#aaa; font-size:0.75rem;">C: R$ ${cost.toFixed(2)}</span>
                        ` : `
                            <span style="color:#aaa; font-size:0.85rem;">C: R$ ${cost.toFixed(2)}</span>
                        `}
                    </div>
                </td>
                <td>
                    <input type="number" value="${p.stock}" class="spreadsheet-input" 
                           onchange="updateProductStock(${p.id}, this.value)">
                </td>
                <td>${p.minStock} uni</td>
                <td>
                    <span class="status-chip ${p.stock > p.minStock ? 'ok' : 'low'}">
                        ${p.stock > p.minStock ? 'ESTÁVEL' : 'REPOR'}
                    </span>
                </td>
                <td>
                    <div class="flex items-center gap-2">
                        <button class="action-btn edit" onclick="editProduct(${p.id})">
                            <i data-lucide="edit-3"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteProduct(${p.id})">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    if (window.lucide) window.lucide.createIcons();
}


function editProduct(id) {
    const products = window.InventoryStore.getAll();
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;

    // Abrir modal e preencher dados
    document.getElementById('product-modal').classList.add('active');
    document.querySelector('#product-modal h2').innerText = 'Editar Produto';

    document.getElementById('p-name').value = product.name;
    document.getElementById('p-price').value = product.price;
    document.getElementById('p-cost').value = product.cost || 0;
    document.getElementById('p-category').value = product.category;
    document.getElementById('p-stock').value = product.stock;
    document.getElementById('p-min').value = product.minStock;
    document.getElementById('p-type').value = product.type || 'produto';
    updateModalFieldsByType(product.type || 'produto');
    document.getElementById('p-img').value = product.img;
    const invInput = document.getElementById('p-invoice');
    invInput.value = product.invoice || '';

    // Atualizar visual do botão na barra lateral se houver nota
    const invBtn = document.getElementById('invoice-btn-modal');
    if (product.invoice) {
        invBtn.style.borderColor = "#27ae60";
        invBtn.style.color = "#27ae60";
        invBtn.querySelector('span').innerText = "✅ Nota Anexada!";
    } else {
        invBtn.style.borderColor = "";
        invBtn.style.color = "";
        invBtn.querySelector('span').innerText = "Anexar Nota";
    }

    previewNewImage(product.img);

    // Ajustar texto do botão
    document.querySelector('#product-form .submit-btn-new').innerText = 'Atualizar Alterações';
}

function updateProductStock(id, newStock) {
    const products = window.InventoryStore.getAll();
    const product = products.find(p => p.id === id);
    if (product) {
        product.stock = parseInt(newStock);
        window.InventoryStore.save(products);
        renderProducts();
    }
}

function deleteProduct(id) {
    if (confirm('Deseja excluir este item permanentemente do sistema?')) {
        const products = window.InventoryStore.getAll();
        const filtered = products.filter(p => p.id !== id);
        window.InventoryStore.save(filtered);
        renderProducts();
    }
}

function removeFromShowcase(id) {
    if (confirm('Ocultar este produto da tela inicial? Ele continuará disponível no seu estoque.')) {
        window.InventoryStore.updateProduct(id, { hideInShowcase: true });
        renderProducts();
    }
}

function editProductImg(id) {
    const products = window.InventoryStore.getAll();
    const product = products.find(p => p.id === id);
    if (!product) return;

    const action = confirm('Deseja escolher uma imagem do seu COMPUTADOR?\n\n(Clique em Cancelar para inserir um link da internet)');

    if (action) {
        const fileInput = document.getElementById('file-input');
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    product.img = ev.target.result;
                    window.InventoryStore.save(products);
                    renderProducts();
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    } else {
        const newImg = prompt('Cole o link da imagem da internet:', product.img);
        if (newImg !== null && newImg.trim() !== "") {
            product.img = newImg;
            window.InventoryStore.save(products);
            renderProducts();
        }
    }
}


// FinanceManager moved to js/finance.js

// ReportManager moved to js/reports.js

function closeReportFilterModal() {
    const modal = document.getElementById('report-filter-modal');
    if (modal) modal.classList.remove('active');
}

/**
 * Processa a exportação baseada nos filtros e no tipo de relatório
 */
async function processReportExport(e) {
    if (e) e.preventDefault();
    const type = document.getElementById('filter-report-type')?.value || window._directReportType || '';
    // Limpar tipo direto após uso
    window._directReportType = null;
    const start = document.getElementById('filter-date-start')?.value || '';
    const end = document.getElementById('filter-date-end')?.value || '';
    const clientId = document.getElementById('filter-client-id')?.value || '';
    const category = document.getElementById('filter-category')?.value || '';
    const payment = document.getElementById('filter-payment')?.value || '';
    const lowStock = (document.getElementById('filter-low-stock')?.value || '') === 'true';
    const inventorySubtype = document.getElementById('filter-inventory-subtype')?.value || '';

    let data = [];
    let fileName = `RELATORIO_${type.toUpperCase()}_${new Date().getTime()}`;
    let title = `RELATÓRIO - ${type.toUpperCase()}`;

    // Adicionar período ao título se houver
    if (start && end) title += ` (${start} a ${end})`;

    switch (type) {
        case 'consumo':
            data = generateConsumptionData(start, end, clientId);
            break;
        case 'estoque':
            if (inventorySubtype === 'abc') {
                data = generateABCAnalysisData(start, end);
                title = `ANÁLISE CURVA ABC - SAÍDA DE PRODUTOS`;
                fileName += '_ABC';
            } else if (inventorySubtype === 'compras') {
                // Retornado ao modelo anterior (Preview Escuro) conforme solicitado
                data = generateInventoryData(category, true);
                title = `SOLICITAÇÃO DE COMPRAS${category ? ' - ' + category.toUpperCase() : ''}`;
                fileName += '_COMPRAS';
            } else {
                data = generateInventoryData(category, lowStock);
                const invType = category === 'Insumos' ? 'insumo' : (window.activeInventoryType || 'produto');
                title = lowStock ? `SOLICITAÇÃO DE COMPRAS` : (invType === 'insumo' ? 'ESTOQUE GERAL - INSUMOS' : 'ESTOQUE GERAL - PRODUTOS');
            }
            break;
        case 'vendas':
            data = generateSalesData(start, end, payment);
            break;
        case 'clientes':
            data = generateCustomerData(clientId);
            break;
        case 'faturamento':
            data = generateBillingData(start, end);
            break;
        case 'cashflow':
            data = generateCashFlowData(start, end);
            title = "RELATÓRIO DE FLUXO DE CAIXA";
            break;
        case 'dre':
            data = generateDREData(start, end);
            title = "DRE - DEMONSTRATIVO DE RESULTADOS";
            break;
        case 'inventory':
            // Balanço Patrimonial se vier do financeiro
            data = generateBalanceData();
            title = "BALANÇO PATRIMONIAL SIMPLIFICADO";
            break;
        case 'deleted':
            data = generateDeletedTransactionsData();
            fileName += '_EXCLUIDOS';
            title = "RELATÓRIO DE AUDITORIA - PEDIDOS EXCLUÍDOS";
            break;
    }

    if (data.length > 0) {
        showReportPreview(data, title, fileName, type === 'estoque' ? 'ESTOQUE' : 'GERAL', type === 'faturamento');
    } else {
        // Mostrar o relatório mesmo vazio, com mensagem clara
        const body = document.getElementById('report-preview-body');
        if (body) {
            body.innerHTML = `
                <div class="preview-header" style="position: relative;">
                    <img src="assets/logo_3d.png" alt="Logo">
                    <h1>CANTINA DOS AMIGOS</h1>
                    <p>${title}</p>
                    <small>Gerado em: ${new Date().toLocaleString()}</small>
                    <div class="no-print" style="position: absolute; top: 10px; right: 10px;">
                        <button onclick="document.getElementById('report-preview-modal').classList.remove('active')" style="background: #64748b; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">VOLTAR</button>
                    </div>
                </div>
                <div style="text-align: center; padding: 3rem 1rem; color: #94a3b8;">
                    <p style="font-size: 1.2rem; font-weight: 700;">📋 Nenhum registro encontrado</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Não há dados disponíveis para este relatório no momento.</p>
                </div>
            `;
            document.getElementById('report-preview-modal').classList.add('active');
            if (window.lucide) lucide.createIcons();
        } else {
            alert("Nenhum dado encontrado para os filtros selecionados.");
        }
    }

    closeReportFilterModal();
}

/**
 * Exibe a prévia do relatório na tela
 */
function showReportPreview(data, title, fileName, origin, showDelete = false) {
    if (!data || data.length === 0) {
        alert("O relatório não contém dados para os filtros selecionados.");
        return;
    }
    window.currentExportData = { data, title, fileName, origin };
    const body = document.getElementById('report-preview-body');
    if (!body) return;

    // Remover campo ID da visualização mas manter para exclusão
    const firstRow = data[0] || {};
    const headers = Object.keys(firstRow).filter(k => k !== 'id');

    let html = `
        <div class="preview-header" style="position: relative;">
            <img src="assets/logo_3d.png" alt="Logo">
            <h1>CANTINA DOS AMIGOS</h1>
            <p>${title}</p>
            <small>Gerado em: ${new Date().toLocaleString()}</small>
            <div class="no-print" style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px;">
                <button onclick="printReport()" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">IMPRIMIR</button>
                <button onclick="document.getElementById('report-preview-modal').classList.remove('active')" style="background: #64748b; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">VOLTAR</button>
            </div>
        </div>
        <table class="preview-table">
            <thead>
                <tr>
                    ${headers.map(k => `<th>${k}</th>`).join('')}
                    ${showDelete ? '<th class="no-print" style="width: 50px;">Ações</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>
                        ${headers.map(h => `<td>${row[h]}</td>`).join('')}
                        ${showDelete ? `
                            <td class="no-print">
                                <button class="action-btn delete" onclick="deleteTransactionFromReport(${row.id})" title="Excluir Venda">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </td>
                        ` : ''}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    body.innerHTML = html;
    document.getElementById('report-preview-modal').classList.add('active');
    if (window.lucide) lucide.createIcons();
}

window.deleteTransactionFromReport = (id) => {
    if (confirm("Confirmar exclusão desta venda? (Obrigatório autorização Admin)")) {
        FinanceManager.deleteTransaction(id);
        // Não fechamos, apenas avisamos ou recarregamos se possível
        // Por simplicidade, fechamos a prévia para o usuário gerar de novo se quiser
        document.getElementById('report-preview-modal').classList.remove('active');
    }
}

/**
 * Gera dados de faturamento detalhado
 */
function generateBillingData(start, end) {
    let sales = window.FinanceStore.transactions.filter(t => t.type === 'in' && (t.category === 'Vendas' || t.category === 'Venda' || t.category === 'Consumo' || t.category === 'Almoço' || t.category === 'Jantar'));
    if (start) sales = sales.filter(s => s.date.split('T')[0] >= start);
    if (end) sales = sales.filter(s => s.date.split('T')[0] <= end);

    return sales.map(s => {
        const items = s.metadata?.items || [];
        const itemsStr = items.map(it => `${it.qty}x ${it.name}`).join(', ') || 'Venda Geral';
        return {
            "Data": new Date(s.date).toLocaleDateString(),
            "Descrição": s.desc,
            "Itens": itemsStr,
            "Valor (R$)": s.amount.toFixed(2),
            "Método": (s.method || 'PIX').toUpperCase(),
            "id": s.id
        };
    });
}

window.generateA4BillingReport = function (start, end) {
    window.isFullStockReport = true; // Use simple layout with icons
    const data = generateBillingData(start, end);

    // Adaptar dados do faturamento para o formato da tabela A4
    window.currentReportItems = data.map(item => ({
        id: Date.now(),
        name: item["Descrição"],
        qty: 1,
        cost: parseFloat(item["Valor (R$)"]) || 0,
        price: 0,
        isManual: false,
        type: 'faturamento'
    }));

    renderReportPages();
}

/**
 * Gera dados para Curva ABC baseada nas saídas (vendas)
 */
function generateABCAnalysisData(start, end) {
    let sales = window.FinanceStore.transactions.filter(t => t.type === 'in' && (t.category === 'Vendas' || t.category === 'Venda' || t.category === 'Consumo'));
    if (start) sales = sales.filter(s => s.date.split('T')[0] >= start);
    if (end) sales = sales.filter(s => s.date.split('T')[0] <= end);

    // Agrupar por produto
    const groups = {};
    sales.forEach(s => {
        // Remover prefixos comuns para agrupar corretamente
        let name = s.desc.replace('Venda: ', '').replace('Consumo: ', '').split('(Cliente:')[0].trim();
        if (!groups[name]) groups[name] = { name, total: 0, qty: 0 };
        groups[name].total += s.amount;
        groups[name].qty += 1;
    });

    const list = Object.values(groups).sort((a, b) => b.total - a.total);
    const totalGeneral = list.reduce((acc, item) => acc + item.total, 0);

    let cumulative = 0;
    return list.map(item => {
        cumulative += item.total;
        const percent = (item.total / totalGeneral) * 100;
        const cumulativePercent = (cumulative / totalGeneral) * 100;

        let classification = 'C';
        if (cumulativePercent <= 70) classification = 'A';
        else if (cumulativePercent <= 90) classification = 'B';

        return {
            "Produto": item.name,
            "Qtd Saídas": item.qty,
            "Valor Total (R$)": item.total.toFixed(2),
            "% Vendas": percent.toFixed(2) + "%",
            "% Acumulado": cumulativePercent.toFixed(2) + "%",
            "Classe ABC": classification
        };
    });
}

/**
 * Abre o cliente de e-mail com resumo do relatório
 */
function processReportEmail() {
    const defaultType = document.getElementById('filter-report-type')?.value || 'RELATÓRIO';
    const title = window.currentExportData?.title || `Relatório de ${defaultType.toUpperCase()}`;

    const email = prompt("Digite o e-mail do destinatário:", "");
    if (!email) return;

    const subject = `${title} - Cantina dos Amigos`;
    const body = `Olá,\n\nSegue resumo do relatório: ${title}.\nO arquivo completo foi gerado e deve ser anexado a este e-mail.\n\nAtenciosamente,\nEquipe Cantina.`;

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Funções de Extração de Dados
function generateDeletedTransactionsData() {
    const deleted = window.FinanceStore.deletedTransactions || [];
    return deleted.map(t => {
        const items = t.metadata?.items || [];
        const itemsStr = items.map(it => `${it.qty}x ${it.name}`).join(', ') || t.desc || 'N/A';
        return {
            "Data Original": new Date(t.date).toLocaleDateString(),
            "Cancelado em": new Date(t.deletedAt).toLocaleString(),
            "Cliente": t.metadata?.customerName || "Não informado",
            "Quem Excluiu": t.deletedBy || "Admin",
            "Motivo": t.reason || "Não informado",
            "Itens Cancelados": itemsStr,
            "Valor Original": `R$ ${t.amount.toFixed(2)}`,
            "Método": (t.method || 'PIX').toUpperCase()
        };
    });
}

function generateConsumptionData(start, end, clientId) {
    let sales = window.FinanceStore.transactions.filter(t => {
        if (t.type !== 'in') return false;
        const cat = (t.category || '').toLowerCase();
        return cat === 'vendas' || cat === 'venda' || cat === 'consumo';
    });
    if (start) sales = sales.filter(s => s.date.split('T')[0] >= start);
    if (end) sales = sales.filter(s => s.date.split('T')[0] <= end);

    if (clientId) {
        sales = sales.filter(s => s.desc.includes(`(Cliente: ${clientId})`));
    }

    return sales.map(s => {
        const items = s.metadata?.items || [];
        const itemsStr = items.map(it => `${it.qty}x ${it.name}`).join(', ') || 'Consumo';
        return {
            "Data": new Date(s.date).toLocaleDateString(),
            "Descrição": s.desc,
            "Itens Detalhados": itemsStr,
            "Valor": s.amount.toFixed(2),
            "Pagamento": (s.method || 'PIX').toUpperCase(),
            "Status": "Concluído"
        };
    });
}

function generateInventoryData(category, onlyLow) {
    let items = window.InventoryStore.getAll();
    if (category) {
        const catLower = category.toLowerCase();
        items = items.filter(i => i.category.toLowerCase() === catLower);
    }
    if (onlyLow) items = items.filter(i => i.stock <= (i.minStock || 5));

    return items.map(i => {
        const row = {
            "Item": i.name,
            "Descrição": i.category,
            "Estoque": i.stock
        };

        if (i.type === 'insumo') {
            row["Custo (Un)"] = (i.cost || 0).toFixed(2);
            row["Total (Custo)"] = (i.stock * (i.cost || 0)).toFixed(2);
        } else {
            row["Preço (Un)"] = (i.price || 0).toFixed(2);
            row["Total (Venda)"] = (i.stock * (i.price || 0)).toFixed(2);
        }

        return row;
    });
}

function generateCashFlowData(start, end) {
    let trans = [...window.FinanceStore.transactions];
    if (start) trans = trans.filter(t => t.date.split('T')[0] >= start);
    if (end) trans = trans.filter(t => t.date.split('T')[0] <= end);

    return trans.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => ({
        "Data": new Date(t.date).toLocaleDateString(),
        "Descrição": t.desc,
        "Categoria": t.category,
        "Método": (t.method || 'PIX').toUpperCase(), // FIX: proteção contra null
        "Tipo": t.type === 'in' ? 'ENTRADA' : 'SAÍDA',
        "Valor (R$)": (t.type === 'in' ? '' : '-') + (parseFloat(t.amount) || 0).toFixed(2)
    }));
}

function generateDREData(start, end) {
    let trans = window.FinanceStore.transactions;
    if (start) trans = trans.filter(t => t.date.split('T')[0] >= start);
    if (end) trans = trans.filter(t => t.date.split('T')[0] <= end);

    const revenue = trans.filter(t => t.type === 'in').reduce((acc, t) => acc + t.amount, 0);
    const expenses = trans.filter(t => t.type === 'out').reduce((acc, t) => acc + t.amount, 0);

    // Estimativa de CMV baseada no custo dos itens vendidos (se disponível no metadata)
    let cmv = 0;
    trans.filter(t => t.type === 'in' && t.metadata && t.metadata.items).forEach(t => {
        t.metadata.items.forEach(item => {
            cmv += (item.cost || 0) * item.qty;
        });
    });

    const grossProfit = revenue - cmv;
    const netProfit = grossProfit - expenses;

    return [
        { "Descrição": "RECEITA BRUTA DE VENDAS", "Valor (R$)": revenue.toFixed(2) },
        { "Descrição": "(-) CUSTO DE MERCADORIA (CMV)", "Valor (R$)": cmv.toFixed(2) },
        { "Descrição": "LUCRO BRUTO", "Valor (R$)": grossProfit.toFixed(2) },
        { "Descrição": "(-) DESPESAS OPERACIONAIS", "Valor (R$)": expenses.toFixed(2) },
        { "Descrição": "LUCRO LÍQUIDO DO PERÍODO", "Valor (R$)": netProfit.toFixed(2) }
    ];
}

function generateBalanceData() {
    const summary = window.FinanceStore.getSummary();
    const assetsReceivable = window.FinanceStore.accountsReceivable
        .filter(a => a.status === 'pending')
        .reduce((acc, a) => acc + a.amount, 0);

    const liabilitiesPayable = window.FinanceStore.accountsPayable
        .filter(a => a.status === 'pending')
        .reduce((acc, a) => acc + a.amount, 0);

    const totalAssets = summary.totalBalance + assetsReceivable;
    const equity = totalAssets - liabilitiesPayable;

    return [
        { "Conta": "ATIVO: Disponibilidades (Caixa/Banco)", "Valor (R$)": summary.totalBalance.toFixed(2) },
        { "Conta": "ATIVO: Contas a Receber", "Valor (R$)": assetsReceivable.toFixed(2) },
        { "Conta": "TOTAL DE ATIVOS", "Valor (R$)": totalAssets.toFixed(2) },
        { "Conta": "PASSIVO: Contas a Pagar", "Valor (R$)": liabilitiesPayable.toFixed(2) },
        { "Conta": "PATRIMÔNIO LÍQUIDO", "Valor (R$)": equity.toFixed(2) }
    ];
}

function generateSalesData(start, end, method) {
    let sales = window.FinanceStore.transactions.filter(t => t.type === 'in' && (t.category === 'Vendas' || t.category === 'Venda' || t.category === 'Consumo'));
    if (start) sales = sales.filter(s => s.date.split('T')[0] >= start);
    if (end) sales = sales.filter(s => s.date.split('T')[0] <= end);
    if (method) sales = sales.filter(s => s.method.toLowerCase() === method.toLowerCase());

    return sales.map(s => ({
        "Data": new Date(s.date).toLocaleDateString(),
        "Valor": s.amount.toFixed(2),
        "Pagamento": s.method,
        "Status": "Pago"
    }));
}

function generateCustomerData(id) {
    let customers = window.CustomerStore.getAll();
    if (id) customers = customers.filter(c => c.id == id);
    return customers.map(c => ({
        "Nome": c.name,
        "Telefone": c.phone,
        "Email": c.email,
        "Endereço": c.address
    }));
}

// Funções de Exportação com showSaveFilePicker
async function exportToXLSX(data, fileName, title) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    await saveFileWithPicker(buf, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

async function exportToCSV(data, fileName) {
    if (data.length === 0) return alert("Sem dados para exportar.");
    const headers = Object.keys(data[0]).join(";");
    const rows = data.map(obj => Object.values(obj).join(";")).join("\n");
    const content = headers + "\n" + rows;

    await saveFileWithPicker(content, fileName, 'text/csv');
}

async function exportToPDF(data, fileName, title, origin) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`RELATÓRIO - ${origin}`, 14, 22);
    doc.setFontSize(11);
    doc.text(title, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 36);

    const headers = [Object.keys(data[0])];
    const body = data.map(obj => Object.values(obj));

    doc.autoTable({
        startY: 40,
        head: headers,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [212, 175, 55] }
    });

    const buf = doc.output('arraybuffer');
    await saveFileWithPicker(buf, fileName, 'application/pdf');
}

async function saveFileWithPicker(content, fileName, mimeType) {
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            alert('Arquivo salvo com sucesso!');
        } catch (err) {
            if (err.name === 'AbortError') return;
            downloadFallback(content, fileName, mimeType);
        }
    } else {
        downloadFallback(content, fileName, mimeType);
    }
}

function downloadFallback(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    alert('Arquivo baixado via navegador.');
}

window.openReportFilterModal = (type) => ReportManager.openReportFilterModal(type);
window.openReport = (type) => ReportManager.openReport(type);
window.processReportExport = processReportExport;
window.processReportEmail = processReportEmail;
window.closeReportFilterModal = closeReportFilterModal;

// Deprecated link for old UI
function updateFinanceUI() { FinanceManager.updateUI(); }
function handleCloseDay() { FinanceManager.handleCloseDay(); }

/**
 * Manipula o upload de imagem do computador para o preview
 */
window.handleFileUpload = function (input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const inputField = document.getElementById('p-img');
            if (inputField) inputField.value = dataUrl;
            previewNewImage(dataUrl);
        };
        reader.readAsDataURL(file);
    }
}

window.handleInvoiceUpload = function (input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('p-invoice').value = e.target.result;
            const btn = document.getElementById('invoice-btn-modal');
            btn.style.borderColor = "#27ae60";
            btn.style.color = "#27ae60";
            btn.querySelector('span').innerText = "✅ Nota Anexada!";
        };
        reader.readAsDataURL(file);
    }
}

function viewInvoice(invoiceData) {
    const modal = document.getElementById('invoice-view-modal');
    const display = document.getElementById('invoice-display');
    if (modal && display) {
        display.src = invoiceData;
        modal.classList.add('active');
    }
}

// Modal Handlers
// openProductModal consolidada no início do arquivo como window.openProductModal.


// closeProductModal consolidada no início.
// updateModalFieldsByType consolidada no início.
// Código redundante removido.

// Listener para mudança de tipo no modal
document.getElementById('p-type')?.addEventListener('change', (e) => {
    updateModalFieldsByType(e.target.value);
});

/**
 * Atualiza a prévia da imagem no modal com validação suave
 */
window.previewNewImage = function (url) {
    const preview = document.getElementById('p-img-preview');
    if (!preview) return;

    if (!url || url.trim() === "" || url === 'undefined') {
        preview.src = 'https://via.placeholder.com/150?text=Sem+Foto';
        return;
    }

    // Se for data:image, carrega direto
    if (url.startsWith('data:image')) {
        preview.src = url;
        return;
    }

    preview.src = url;

    // Tratamento de erro na própria imagem via atributo onerror que já existe no HTML da renderização,
    // mas aqui para o preview do modal:
    preview.onerror = () => {
        preview.src = 'https://via.placeholder.com/150?text=Link+Bloqueado';
        console.warn("A imagem não pôde ser carregada: " + url);
    };
}

// Função duplicada removida

window.pasteFromClipboard = async function () {
    const inputField = document.getElementById('p-img');
    if (!inputField) return;

    try {
        // Tenta usar a Clipboard API se disponível (HTTPS ou localhost)
        if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text) {
                inputField.value = text;
                previewNewImage(text);
                showPasteSuccess();
                return;
            }
        }

        // Fallback: Se não puder ler automaticamente, foca no campo e avisa o usuário
        throw new Error('Necessário colar manualmente');
    } catch (err) {
        inputField.focus();
        // Abre um pequeno prompt amigável para colar
        const manualLink = prompt('Não foi possível ler sua área de transferência automaticamente por segurança.\n\nPor favor, cole o link da imagem (Ctrl+V) abaixo:', "");
        if (manualLink !== null && manualLink.trim() !== "") {
            inputField.value = manualLink;
            previewNewImage(manualLink);
        }
    }
}

function showPasteSuccess() {
    const btn = document.querySelector('.action-form-btn.paste');
    if (btn) {
        btn.classList.add('success');
        setTimeout(() => btn.classList.remove('success'), 2000);
    }
}

// Função searchProductImage consolidada no início do arquivo.


// Estado global do relatório para permitir adições manuais
window.currentReportItems = [];
window.isFullStockReport = false;

window.generateA4Report = function (isFullStock = false) {
    window.isFullStockReport = isFullStock;
    const data = isFullStock
        ? window.InventoryStore.getFullStockReport(window.activeInventoryType || 'produto')
        : window.InventoryStore.getPurchaseReport(window.activeInventoryType || 'produto');

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

// Função para abrir vista de relatório A4 (Legado/Edição)
// openA4ReportView centralizada em js/reports.js para evitar conflitos.


function renderReportPages() {
    const container = document.getElementById('report-preview-body');
    const modal = document.getElementById('report-modal');

    if (window.currentReportItems.length === 0) {
        container.innerHTML = '<p class="empty-msg" style="text-align:center; padding: 2rem; color: #fff;">Nenhum item na lista de compras.</p>';
        modal.classList.add('active');
        return;
    }

    const itemsPerPage = 20;
    const totalPages = Math.ceil(window.currentReportItems.length / itemsPerPage);
    let html = '';

    for (let i = 0; i < totalPages; i++) {
        const pageItems = window.currentReportItems.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
        const isLastPage = (i === totalPages - 1);

        html += `
            <div class="a4-page" style="position: relative; height: 265mm; page-break-after: ${isLastPage ? 'avoid' : 'always'}; box-sizing: border-box; overflow: hidden; margin: 0 auto;">
                <header class="a4-header" style="${i > 0 ? 'margin-bottom: 0.2rem;' : ''}">
                    ${i === 0 ? `
                    ${window.isFullStockReport ? `
                    <div style="text-align: center; margin-bottom: 0.3rem;">
                        <div style="font-size: 16pt; font-weight: 900; color: #0f172a; letter-spacing: 2px; text-transform: uppercase;">ESTOQUE COMPLETO</div>
                        <div style="height: 2px; background: linear-gradient(90deg, transparent, #0f172a, transparent); margin-top: 0.2rem;"></div>
                    </div>
                    ` : ''}
                    <div class="a4-logos-wrapper">
                        <div class="a4-logo-col left">
                            <img src="assets/logo_3d.png" alt="Cozinha Logo" class="a4-logo" style="height: 60px; width: auto;">
                            <div class="a4-logo-title-small" style="font-size: 11pt; font-weight: 800; line-height: 1.2;">CANTINA<br>DOS AMIGOS</div>
                        </div>
                        <div class="a4-logo-col center">
                            <img src="https://www.provida.net/wp-content/uploads/2021/01/Logo_PVPT@2x.png" alt="Provida Logo" class="a4-logo" style="height: 60px; width: auto;">
                        </div>
                        <div class="a4-logo-col right">
                            <div class="flex flex-row gap-2" style="align-items: center; margin-top: 0;">
                                <button class="a4-print-icon-btn no-print" onclick="printReport()" title="Imprimir Relatório" style="background: #10b981; border-color: #10b981;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                                    <i data-lucide="printer"></i>
                                    <span>IMPRIMIR</span>
                                </button>
                                ${window.isFullStockReport ? `
                                <button class="a4-save-icon-btn no-print" onclick="saveReportToSystem()" title="Salvar no Histórico">
                                    <i data-lucide="save"></i>
                                    <span>SALVAR</span>
                                </button>
                                ` : ''}
                                <button class="a4-back-icon-btn no-print" onclick="closeReportModal()" title="Fechar">
                                    <i data-lucide="corner-up-left"></i>
                                    <span>VOLTAR</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    ` : `
                    <div class="a4-logos-wrapper" style="grid-template-columns: 1fr auto; align-items: center; margin-bottom: 2mm;">
                         <div style="font-weight: 800; font-size: 8pt; color: #1e293b; text-transform: uppercase;">CANTINA DOS AMIGOS - Solicitação de Compras</div>
                         <div class="no-print" style="display: flex; flex-direction: column; gap: 4px;">
                            <button class="a4-print-icon-btn" onclick="printReport()" style="margin-top: 0; padding: 2px 6px; font-size: 0.6rem;">
                                <i data-lucide="printer" style="width: 12px; height: 12px;"></i>
                            </button>
                         </div>
                    </div>
                    `}

                    <div class="a4-subheader-row" style="${(i > 0 || window.isFullStockReport) ? 'display: none;' : ''}">
                        <div class="a4-sub-col"></div>
                        <div class="a4-sub-col center">
                        <div class="a4-subtitle-center" style="font-size: 14pt; font-weight: 800;">
                                ${window.currentReportItems[0]?.type === 'faturamento' ? 'RELATÓRIO DE FATURAMENTO' :
                `SOLICITAÇÃO DE COMPRAS${(window.activeInventoryType || activeInventoryType) === 'insumo' ? ' - INSUMOS' : ''}`}
                            </div>
                        </div>
                        <div class="a4-sub-col right">
                            <div class="a4-metadata-right">
                                <span class="a4-date-ref">${new Date().toLocaleDateString('pt-BR')}</span><br>
                                <span class="a4-time-ref">Hora: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                    ${window.isFullStockReport ? `
                    <div style="text-align: right; font-size: 11px; color: #64748b; margin-top: 0.1rem;">
                        ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    ` : ''}
                </header>

                <div class="a4-separator moderna"></div>

                ${(i === 0 && !window.isFullStockReport) ? `
                <div class="a4-add-item-bar no-print">
                    <div class="add-item-inputs">
                        <input type="text" id="manual-item-name" placeholder="Nome do Produto">
                        <input type="number" id="manual-item-qty" placeholder="Qtd" style="width: 60px;">
                        <input type="number" id="manual-item-cost" placeholder="Custo R$" style="width: 90px;">
                        <button class="add-manual-btn" onclick="addManualItemToReport()">
                            <i data-lucide="plus"></i> Novo Item
                        </button>
                        <button class="a4-save-icon-btn no-print" onclick="saveReportToSystem()" 
                                style="margin-top: 0; height: 32px; background: #059669; border-color: #047857; color: white;">
                            <i data-lucide="save"></i> SALVAR
                        </button>
                    </div>
                </div>
                ` : ''}

                <div class="a4-table-container">
                    <table class="a4-table">
                        <thead>
                            <tr>
                                <th style="width: 60px">#</th>
                                <th>${window.currentReportItems[0]?.type === 'faturamento' ? 'Descrição' : 'Produto'}</th>
                                <th style="text-align:center">${window.currentReportItems[0]?.type === 'faturamento' ? '-' : (window.isFullStockReport ? 'Quantidade' : 'Qtd. Compra')}</th>
                                <th style="text-align:right">${window.currentReportItems[0]?.type === 'faturamento' ? 'Valor' : 'Custo Unit.'}</th>
                                <th style="text-align:right">${window.currentReportItems[0]?.type === 'faturamento' ? 'Total' : 'Subtotal (Custo)'}</th>
                                ${(!window.isFullStockReport && window.currentReportItems[0]?.type !== 'faturamento') ? '<th class="no-print" style="text-align:center; width: 60px;">Ações</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${pageItems.map((p, index) => {
                    const rowNumber = (i * itemsPerPage) + index + 1;
                    const subtotal = p.qty * p.cost;
                    return `
                                    <tr>
                                        <td style="font-weight: 700; color: #000; width: 40px; text-align: center;">${rowNumber}</td>
                                        <td><strong>${p.name}</strong></td>
                                        <td style="text-align:center">
                                            ${!window.isFullStockReport ? `
                                                <input type="number" class="a4-qty-input" value="${p.qty}" 
                                                       onchange="updatePageItemQty(${rowNumber - 1}, this.value)">
                                            ` : `
                                                <span style="font-weight: 600;">${p.qty}</span>
                                            `}
                                        </td>
                                        <td style="text-align:right; white-space: nowrap;">R$ ${p.cost.toFixed(2)}</td>
                                        <td style="text-align:right; white-space: nowrap; font-weight: 700;">R$ ${subtotal.toFixed(2)}</td>
                                        ${!window.isFullStockReport ? `
                                            <td class="no-print" style="text-align:center">
                                                <div class="a4-actions-cell-flex">
                                                    <button class="a4-action-btn edit" onclick="editReportItem(${rowNumber - 1})" title="Alterar" style="padding: 0.4rem; cursor: pointer;">
                                                        <i data-lucide="edit-2" style="width: 20px; height: 20px;"></i>
                                                    </button>
                                                    <button class="a4-action-btn delete" onclick="removeReportItem(${rowNumber - 1})" title="Excluir" style="padding: 0.4rem; cursor: pointer;">
                                                        <i data-lucide="trash" style="width: 20px; height: 20px;"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        ` : ''}
                                    </tr>
                                `;
                }).join('')}
                        </tbody>
                    </table>
                </div>

                ${isLastPage ? `
                    <div id="report-footer-total" style="text-align:right; margin-top: 0.75rem; font-size: 11px; font-weight: 700; border-top: 2px solid #000000; padding-top: 0.5rem;">
                        TOTAL ESTIMADO: <span id="report-total-value">R$ ${calculateReportTotalValue()}</span>
                    </div>

                ` : ''}

    <div class="a4-page-footer">Página ${i + 1} de ${totalPages}</div>
            </div >
        `;
    }

    container.innerHTML = html;
    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

function removeReportItem(index) {
    window.currentReportItems.splice(index, 1);
    renderReportPages();
}

function updatePageItemQty(index, val) {
    const qty = parseInt(val) || 0;
    if (window.currentReportItems[index]) {
        window.currentReportItems[index].qty = qty;
        renderReportPages();
    }
}

let editingReportItemIndex = null;

function editReportItem(index) {
    const item = window.currentReportItems[index];
    if (!item) return;

    editingReportItemIndex = index;
    const modal = document.getElementById('edit-report-item-modal');
    if (!modal) return;

    // Preencher campos
    document.getElementById('edit-ri-index').value = index;
    document.getElementById('edit-ri-name').value = item.name;
    document.getElementById('edit-ri-qty').value = item.qty;
    document.getElementById('edit-ri-cost').value = item.cost;
    document.getElementById('edit-ri-price').value = item.price || 0;

    // Atualizar displays
    updateEditReportItemCalculations();

    // Adicionar listeners para cálculo em tempo real
    ['edit-ri-qty', 'edit-ri-cost', 'edit-ri-price'].forEach(id => {
        document.getElementById(id).oninput = updateEditReportItemCalculations;
    });

    modal.classList.add('active');

    // Ocultar campos desnecessários para insumos
    const priceGroup = document.getElementById('edit-ri-price')?.closest('.form-group');
    const marginGroup = document.getElementById('edit-ri-margin-display');
    if (item.type === 'insumo') {
        if (priceGroup) priceGroup.style.display = 'none';
        if (marginGroup) marginGroup.style.display = 'none';
    } else {
        if (priceGroup) priceGroup.style.display = 'block';
        if (marginGroup) marginGroup.style.display = 'block';
    }
}

function updateEditReportItemCalculations() {
    const qty = parseInt(document.getElementById('edit-ri-qty').value) || 0;
    const cost = parseFloat(document.getElementById('edit-ri-cost').value) || 0;
    const price = parseFloat(document.getElementById('edit-ri-price').value) || 0;

    const subtotal = qty * cost;
    document.getElementById('edit-ri-subtotal-value').innerText = `R$ ${subtotal.toFixed(2)}`;

    let margin = 0;
    if (cost > 0 && price > 0) {
        margin = ((price - cost) / cost) * 100;
    }
    const marginEl = document.getElementById('edit-ri-margin-value');
    marginEl.innerText = `${margin.toFixed(1)}%`;

    if (margin < 0) marginEl.style.color = '#ef4444';
    else if (margin < 30) marginEl.style.color = '#eab308';
    else marginEl.style.color = '#10b981';
}

function saveEditReportItem(e) {
    e.preventDefault();
    if (editingReportItemIndex === null) return;

    const name = document.getElementById('edit-ri-name').value;
    const qty = parseInt(document.getElementById('edit-ri-qty').value) || 0;
    const cost = parseFloat(document.getElementById('edit-ri-cost').value) || 0;
    const price = parseFloat(document.getElementById('edit-ri-price').value) || 0;

    if (!name || qty < 0) {
        alert("Por favor, preencha os campos corretamente.");
        return;
    }

    // Atualizar item na lista temporária do relatório
    const item = window.currentReportItems[editingReportItemIndex];
    item.name = name;
    item.qty = qty;
    item.cost = cost;
    item.price = price;

    // Atualizar também no banco de dados principal (InventoryStore) para persistir
    // Se o item tiver ID, buscamos ele
    const products = window.InventoryStore.getAll();
    const product = products.find(p => p.id === item.id);

    if (product) {
        product.name = name;
        // Não atualizamos o estoque (qty do relatório é quanto comprar, não o estoque atual)
        // Mas atualizamos custos e preços se mudou
        product.cost = cost;
        product.price = price;
        window.InventoryStore.save(products);
    }

    renderReportPages();
    closeEditReportItemModal();
}

function closeEditReportItemModal() {
    document.getElementById('edit-report-item-modal').classList.remove('active');
    editingReportItemIndex = null;
}

function calculateReportTotalValue() {
    let total = 0;
    if (!window.currentReportItems) return "0.00";
    window.currentReportItems.forEach(item => {
        const qty = parseInt(item.qty) || 0;
        const cost = parseFloat(String(item.cost).replace(',', '.')) || 0;
        total += (qty * cost);
    });
    return total.toFixed(2);
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
        type: window.activeInventoryType || 'produto' // Associar o item manual ao tipo atual
    });

    // Limpar campos
    document.getElementById('manual-item-name').value = '';
    document.getElementById('manual-item-qty').value = '';
    document.getElementById('manual-item-cost').value = '';

    renderReportPages();
}

async function saveReportToSystem() {
    if (!window.currentReportItems || window.currentReportItems.length === 0) {
        alert('Nenhum item para salvar!');
        return;
    }

    const reportData = {
        id: Date.now(),
        date: new Date().toLocaleString('pt-BR'),
        items: [...window.currentReportItems],
        total: calculateReportTotalValue()
    };

    // Obter histórico existente
    let history = JSON.parse(localStorage.getItem('saved_compras_history') || '[]');
    history.push(reportData);
    localStorage.setItem('saved_compras_history', JSON.stringify(history));

    const fileName = `RELATÓRIO - COMPRAS - ${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`;
    let content = `RELATÓRIO - COMPRAS - CANTINA DOS AMIGOS\n`;
    content += `Data: ${new Date().toLocaleString('pt-BR')} \n`;
    content += `Origem: ESTOQUE / COMPRAS\n`;
    content += `--------------------------------------------------\n\n`;

    window.currentReportItems.forEach(p => {
        content += `${p.name.padEnd(30)} | Qtd: ${String(p.qty).padEnd(4)} | R$ ${p.cost.toFixed(2)} \n`;
    });

    content += `\n--------------------------------------------------\n`;
    const total = window.currentReportItems.reduce((acc, p) => acc + (p.qty * p.cost), 0);
    content += `TOTAL ESTIMADO: R$ ${total.toFixed(2)} \n`;

    // Modern File System Access API
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                    description: 'Arquivo de Texto',
                    accept: { 'text/plain': ['.txt'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            alert('Relatório exportado com sucesso!');
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Erro ao salvar relatório:', err);
        }
    } else {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        alert(`Arquivo salvo em Downloads!\nSalvo como: ${fileName} `);
    }

    const btn = document.querySelector('.a4-actions .action-btn-new');
    if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Exportado!';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    }
}

async function exportFullBackup() {
    try {
        const data = {
            inventory: window.InventoryStore.getAll(),
            finance: {
                transactions: window.FinanceStore.transactions,
                payable: window.FinanceStore.accountsPayable,
                receivable: window.FinanceStore.accountsReceivable,
                settings: window.FinanceStore.settings
            },
            customers: window.CustomerStore?.getAll() || [],
            auth: window.AuthStore?.users || [],
            timestamp: new Date().toISOString()
        };

        const content = JSON.stringify(data, null, 2);
        const fileName = `BACKUP_CANTINA_GERAL_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;

        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        alert('Backup gerado e salvo na pasta de Downloads!');
    } catch (err) {
        console.error('Erro ao exportar backup:', err);
        alert('Falha ao gerar backup: ' + err.message);
    }
}

async function importFullBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async event => {
            try {
                const data = JSON.parse(event.target.result);
                if (!confirm('Isso irá SOBRESCREVER todos os dados atuais do sistema com os dados do backup. Continuar?')) return;

                if (data.inventory) {
                    window.InventoryStore.save(data.inventory);
                }
                if (data.finance) {
                    window.FinanceStore.transactions = data.finance.transactions || [];
                    window.FinanceStore.accountsPayable = data.finance.payable || [];
                    window.FinanceStore.accountsReceivable = data.finance.receivable || [];
                    window.FinanceStore.settings = data.finance.settings || window.FinanceStore.settings;
                    window.FinanceStore.save();
                }
                if (data.customers) {
                    window.CustomerStore.customers = data.customers;
                    window.CustomerStore.save();
                }
                if (data.auth) {
                    window.AuthStore.users = data.auth;
                    window.AuthStore.save();
                }

                alert('SISTEMA RESTAURADO COM SUCESSO! O programa será reiniciado.');
                location.reload();
            } catch (err) {
                console.error('Erro ao importar backup:', err);
                alert('O arquivo de backup é inválido ou está corrompido.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}



function updateReportSubtotal(input, cost) {
    const qty = parseInt(input.value) || 0;
    const row = input.closest('tr');
    const subtotalEl = row.querySelector('.row-subtotal');
    const subtotal = qty * cost;
    subtotalEl.innerText = `R$ ${subtotal.toFixed(2)} `;
    calculateReportTotal();
}


/**
 * IFRAME ISOLATION PRINT ENGINE (Advanced & Global Strategy)
 * Resolve definitivamente o problema de "espelhamento" e "fantasmas" 
 * imprimindo qualquer conteúdo ativo em um documento isolado.
 */
function printReport() {
    let printableContent = null;
    let isA4Report = false;

    // Prioridade 1: Relatório Interativo (A4) se estiver aberto
    const reportModal = document.getElementById('report-modal');
    if (reportModal && reportModal.classList.contains('active')) {
        printableContent = document.getElementById('report-pages-container');
        isA4Report = true;
    }

    // Prioridade 2: Preview do Relatório Geral (Preview Escuro)
    if (!printableContent) {
        const previewModal = document.getElementById('report-preview-modal');
        if (previewModal && previewModal.classList.contains('active')) {
            printableContent = document.getElementById('report-preview-body');
            isA4Report = false;
        }
    }

    // Prioridade 3: Qualquer outro modal ativo
    if (!printableContent) {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            printableContent = activeModal.querySelector('.modal-content') || activeModal;
            isA4Report = false;
        }
    }

    // Fallback Final
    if (!printableContent) {
        printableContent = document.querySelector('.content') || document.body;
        isA4Report = false;
    }

    // Criar um iframe oculto
    let iframe = document.getElementById('print-iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.outerHTML).join('');

    // HTML Limpo para o Iframe
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Impressão Sistema - Cantina</title>
            ${styleLinks}
            <style>
                /* Correcão de escala e reset para o Iframe */
                @page { size: A4; margin: 10mm; }
                body { background: white !important; margin: 0 !important; padding: 0 !important; visibility: visible !important; color: black !important; }
                .a4-page { width: 100% !important; border: none !important; box-shadow: none !important; margin: 0 !important; min-height: auto !important; }
                .no-print, .close-modal-btn, .modal-header .close-btn, .close-btn { display: none !important; }
                .modal-content { background: white !important; box-shadow: none !important; border: none !important; width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; display: block !important; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                ${!isA4Report ? 'table { width: 100% !important; border-collapse: collapse !important; border: none !important; } th, td { border: none !important; border-bottom: 1px solid #000 !important; padding: 5px !important; color: #000 !important; }' : ''}
            </style>
        </head>
        <body>
            <div class="${isA4Report ? '' : 'modal-content'}">
                ${printableContent.innerHTML}
            </div>
            <script>
                window.onload = function() {
                    // Remover botões de fechar e UI que não deveriam estar no PDF
                    document.querySelectorAll('.no-print, .close-modal-btn, .close-btn, button:not(.keep-print)').forEach(b => b.style.display = 'none');
                    setTimeout(() => {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    doc.close();
}

// Override global para capturar todos os botões de imprimir existentes
window.print = function () {
    printReport();
};

function closeReportModal() {
    const modal = document.getElementById('report-modal');
    if (modal) {
        modal.classList.remove('active');
        // Restaurar o header para quando o estoque/compras for aberto novamente
        const reportHeader = modal.querySelector('.report-header');
        if (reportHeader) reportHeader.style.display = '';
    }
    window.currentReportItems = []; // Limpar lista ao fechar
    if (window.reportClockInterval) {
        clearInterval(window.reportClockInterval);
        window.reportClockInterval = null;
    }
}

function calculateReportTotal() {
    const rowSubtotals = document.querySelectorAll('.row-subtotal');
    let total = 0;
    rowSubtotals.forEach(el => {
        const val = parseFloat(el.innerText.replace('R$ ', '').replace(',', '.')) || 0;
        total += val;
    });
    const totalEl = document.getElementById('report-total-value');
    if (totalEl) totalEl.innerText = `R$ ${total.toFixed(2)} `;
}

// Event Listeners
document.getElementById('product-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    console.log("Iniciando submissão de formulário...");

    try {
        // Verificação extra de validade (especialmente para campos ocultos)
        if (!this.checkValidity()) {
            console.error("Erro de validação nativa do formulário.");
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        // Helper para extrair valores numéricos com segurança (suporta vírgula)
        const secureParse = (id, isInt = false) => {
            const el = document.getElementById(id);
            if (!el) return 0;
            const val = el.value || '0';
            if (isInt) return parseInt(val) || 0;
            const parsed = parseFloat(String(val).replace(',', '.'));
            return isNaN(parsed) ? 0 : parsed;
        };

        const productData = {
            name: document.getElementById('p-name').value,
            price: secureParse('p-price'),
            cost: secureParse('p-cost'),
            category: document.getElementById('p-category').value,
            type: document.getElementById('p-type').value,
            stock: secureParse('p-stock', true),
            minStock: secureParse('p-min', true),
            img: document.getElementById('p-img').value || 'https://via.placeholder.com/200x180?text=Produto',
            invoice: document.getElementById('p-invoice').value || null
        };

        console.log("Tentando salvar dados:", productData);

        if (editingProductId) {
            window.InventoryStore.updateProduct(editingProductId, productData);
        } else {
            window.InventoryStore.addProduct(productData);
        }

        renderProducts();

        // Feedback de sucesso no botão
        const btn = this.querySelector('.submit-btn-new');
        const originalText = editingProductId ? 'Atualizar Alterações' : 'Salvar Item';
        btn.innerText = '✅ PROCESSANDO...';
        btn.style.background = '#27ae60';

        setTimeout(async () => {
            btn.innerText = editingProductId ? '✅ Alterações Salvas!' : '✅ Produto Salvo!';

            // Pergunta se deseja exportar backup após salvar
            if (confirm('Deseja exportar um backup atualizado para um arquivo?')) {
                await exportFullBackup();
            }

            setTimeout(() => {
                if (!editingProductId) {
                    this.reset();
                    document.getElementById('p-img-preview').src = 'https://via.placeholder.com/150?text=Próximo+Item';
                    document.getElementById('p-type').value = window.activeInventoryType;
                    updateModalFieldsByType(window.activeInventoryType);
                    document.getElementById('p-name').focus();
                } else {
                    closeProductModal();
                }
                btn.innerText = originalText;
                btn.style.background = '';
                renderProducts(); // Refresh final
            }, 800);
        }, 500);

    } catch (err) {
        console.error("CRITICAL ERROR NO SUBMIT:", err);
        alert("Ocorreu um erro ao salvar: " + err.message);
    }
});


function openPayment(productId) {
    const modal = document.getElementById('payment-modal');
    if (!modal) return;
    modal.classList.add('active');
    modal.dataset.productId = productId;
}

async function processSale(productId, type) {
    try {
        const products = window.InventoryStore.getAll();
        const product = products.find(p => p.id == productId);
        if (!product) return;

        const res = await window.PaymentManager.processDigitalPayment({ total: product.price, id: productId });
        if (res && res.success) {
            window.InventoryStore.removeStock(product.id, 1);
            window.FinanceStore.addTransaction('in', product.price, type, `Venda (Digital): ${product.name}`, 'Vendas');
            renderProducts();
            if (window.updateFinanceUI) updateFinanceUI();
        }
    } catch (err) {
        console.error("Erro ao processar venda:", err);
        alert("Ocorreu um erro técnico ao processar o pagamento.");
    }
}

// === SAFETY NET: Restaurar TODOS os botões a cada navegação ===
function restoreAllButtons() {
    document.querySelectorAll('.add-btn, .header-actions, #btn-new-product, #btn-compras, #btn-scanner').forEach(function (btn) {
        if (btn) {
            btn.style.removeProperty('pointer-events');
            btn.style.removeProperty('opacity');
            btn.style.removeProperty('visibility');
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
            btn.style.visibility = 'visible';
        }
    });
}
window.restoreAllButtons = restoreAllButtons;

document.querySelectorAll('.nav-links li').forEach(li => {
    li.addEventListener('click', (e) => {
        const sectionId = li.dataset.section;
        if (!sectionId) return;

        // SAFETY NET: Restaurar todos os botões a cada clique de navegação
        restoreAllButtons();

        if (sectionId.startsWith('inventory-')) {
            window.activeInventoryType = li.dataset.type;
            // FIX: garantir referência global consistente

            const parent = li.closest('.nav-parent');
            document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
            if (parent) parent.classList.add('active');
            li.classList.add('active');

            document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
            document.getElementById('inventory').classList.add('active');
            renderProducts();
            e.stopPropagation();
            return;
        }

        document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
        li.classList.add('active');
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.add('active');
            if (sectionId === 'payments' && window.PaymentManager) {
                window.PaymentManager.renderMethods();
            }
            if (sectionId === 'admin' && window.AdminManager) {
                FinanceManager.init();
            }
            if (sectionId === 'customers') {
                CustomerManager.renderCustomers();
            }
            if (sectionId === 'sales' && window.SalesManager) {
                window.SalesManager.init();
            }
            if (sectionId === 'finance') {
                FinanceManager.init();
            }
            if (sectionId === 'admin') {
                AdminManager.renderUsers();
            }
            if (sectionId === 'reports') {
                window.switchReportView('vendas');
            }
            if (sectionId === 'inventory') {
                window.activeInventoryType = 'all';
                renderProducts();
            }
        }
    });
});

document.querySelectorAll('.pay-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const method = btn.dataset.type;
        const productId = document.getElementById('payment-modal').dataset.productId;
        processSale(productId, method);
        document.getElementById('payment-modal').classList.remove('active');
    });
});

document.getElementById('close-pay-modal')?.addEventListener('click', () => {
    document.getElementById('payment-modal').classList.remove('active');
});

function navigateToSection(sectionId) {
    const navItem = document.querySelector(`.nav-links li[data-section="${sectionId}"]`);
    if (navItem) {
        navItem.click();
    }
}

// Customer Management logic consolidated at the end



// --- FUNÇÕES DO RELATÓRIO INTERATIVO CONSOLIDADAS (MODO QUANTUM) ---
// FIX: Exportar versões canônicas (com edição/histórico) para override das versões do reports.js
window.renderReportPages = renderReportPages;
window.removeReportItem = removeReportItem;
window.updatePageItemQty = updatePageItemQty;
window.calculateReportTotalValue = calculateReportTotalValue;
window.addManualItemToReport = addManualItemToReport;
window.closeReportModal = closeReportModal;
window.saveReportToSystem = saveReportToSystem;
window.editReportItem = editReportItem;
window.closeEditReportItemModal = closeEditReportItemModal;
window.saveEditReportItem = saveEditReportItem;
window.updateEditReportItemCalculations = updateEditReportItemCalculations;
if (typeof NFEScanner !== 'undefined') window.NFEScanner = NFEScanner;
if (typeof importFullBackup !== 'undefined') window.importFullBackup = importFullBackup;
if (typeof exportFullBackup !== 'undefined') window.exportFullBackup = exportFullBackup;

// Suporte a colar link diretamente no campo
document.getElementById('p-img')?.addEventListener('paste', (e) => {
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    if (paste) {
        setTimeout(() => previewNewImage(paste), 10);
    }
});

/**
 * Importa itens extraídos de um escaneamento de nota fiscal
 */
function importScannedItems(items) {
    const products = window.InventoryStore.getAll();
    let newItemsAdded = 0;

    items.forEach(scanned => {
        const existing = products.find(p => p.name.toLowerCase().trim() === scanned.name.toLowerCase().trim());
        if (existing) {
            existing.stock = (parseInt(existing.stock) || 0) + scanned.qty;
            existing.cost = scanned.cost;
        } else {
            // Criar novo item se não existir
            const newProduct = {
                id: Date.now() + Math.random(),
                name: scanned.name,
                price: scanned.cost * 1.5, // Sugestão: markup de 50%
                cost: scanned.cost,
                category: scanned.category || 'Geral',
                type: scanned.type || 'produto',
                stock: scanned.qty,
                minStock: Math.ceil(scanned.qty * 0.2) || 5,
                img: 'https://via.placeholder.com/200x180?text=' + encodeURIComponent(scanned.name)
            };
            products.push(newProduct);
            newItemsAdded++;
        }
    });

    // Salvar a lista completa e atualizada
    window.InventoryStore.save(products);

    if (typeof renderProducts === 'function') renderProducts();
    if (window.FinanceManager) window.FinanceManager.updateUI();

    console.log(`Importação concluída: ${items.length} itens processados. ${newItemsAdded} novos cadastros.`);
}

// Histórico de Solicitações
window.openHistoryModal = () => {
    document.getElementById('history-modal').classList.add('active');
    loadHistoryTable();
};

window.closeHistoryModal = () => document.getElementById('history-modal').classList.remove('active');

function loadHistoryTable() {
    const tbody = document.getElementById('history-table-body');
    const history = JSON.parse(localStorage.getItem('saved_compras_history') || '[]');
    if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">Nenhum pedido salvo encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = [...history].reverse().map((report, index) => {
        const realIndex = history.length - 1 - index;
        return `
        <tr>
            <td><strong>${report.date}</strong></td>
            <td class="gold-text">R$ ${report.total}</td>
            <td>${report.items.length} itens</td>
            <td style="text-align:right">
                <button class="action-form-btn search" onclick="downloadSavedReport(${realIndex})" title="Baixar Novamente">
                    <i data-lucide="download"></i>
                </button>
                <button class="action-form-btn delete" onclick="deleteHistoryItem(${realIndex})" title="Excluir do Histórico">
                    <i data-lucide="trash"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
    if (window.lucide) window.lucide.createIcons();
}

window.downloadSavedReport = (index) => {
    const history = JSON.parse(localStorage.getItem('saved_compras_history') || '[]');
    const report = history[index];
    if (!report) return;
    const fileName = `SOLICITAÇÃO DE COMPRAS - ${report.date.split(' ')[0].replace(/\//g, '-')}.txt`;
    let content = `SOLICITAÇÃO DE COMPRAS - CANTINA DOS AMIGOS\nData: ${report.date}\n--------------------------------------------------\n`;
    report.items.forEach(p => {
        content += `${p.name.padEnd(30)} | Qtd: ${String(p.qty).padEnd(4)} | R$ ${p.cost.toFixed(2)}\n`;
    });
    content += `--------------------------------------------------\nTOTAL ESTIMADO: R$ ${report.total}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
};

window.deleteHistoryItem = (index) => {
    if (!confirm('Deseja realmente excluir este registro do histórico?')) return;
    let history = JSON.parse(localStorage.getItem('saved_compras_history') || '[]');
    history.splice(index, 1);
    localStorage.setItem('saved_compras_history', JSON.stringify(history));
    loadHistoryTable();
};

const CustomerManager = {
    renderCustomers() {
        const tableBody = document.getElementById('customer-table-body');
        const pdvSelect = document.getElementById('pdv-customer-select');
        if (!tableBody) return;
        const customers = window.CustomerStore.getAll();
        tableBody.innerHTML = customers.map(c => `
        <tr onclick="SalesManager.selectCustomerById(${c.id}); navigateToSection('sales')" style="cursor:pointer">
            <td><strong class="gold-text">${c.name}</strong></td>
            <td><div class="flex flex-col"><span>${c.phone || '-'}</span><small class="text-muted">${c.email || '-'}</small></div></td>
            <td>${c.address || 'Sem endereço'}</td>
            <td><div class="flex gap-2">
                <button class="action-btn edit" onclick="event.stopPropagation(); CustomerManager.openCustomerModal(${c.id})"><i data-lucide="edit"></i></button>
                <button class="action-btn delete" onclick="event.stopPropagation(); CustomerManager.deleteCustomer(${c.id})"><i data-lucide="trash-2"></i></button>
            </div></td>
        </tr>`).join('') || '<tr><td colspan="4" style="text-align:center">Nenhum cliente cadastrado.</td></tr>';

        if (window.lucide) lucide.createIcons();
    },
    openCustomerModal(id = null) {
        const modal = document.getElementById('customer-modal');
        const form = document.getElementById('customer-form');
        if (!modal || !form) return;
        form.reset();
        if (id) {
            const customer = window.CustomerStore.getAll().find(c => c.id === id);
            if (customer) {
                document.getElementById('c-name').value = customer.name;
                document.getElementById('c-address').value = customer.address;
                document.getElementById('c-phone').value = customer.phone;
                document.getElementById('c-email').value = customer.email;
                modal.dataset.editingId = id;
            }
        } else {
            delete modal.dataset.editingId;
        }
        modal.classList.add('active');
    },
    async saveCustomer(e) {
        e.preventDefault();
        const modal = document.getElementById('customer-modal');
        const id = modal.dataset.editingId;
        const data = {
            name: document.getElementById('c-name').value,
            address: document.getElementById('c-address').value,
            phone: document.getElementById('c-phone').value,
            email: document.getElementById('c-email').value
        };
        if (id) window.CustomerStore.updateCustomer(parseInt(id), data);
        else window.CustomerStore.addCustomer(data);
        modal.classList.remove('active');
        this.renderCustomers();
    },
    deleteCustomer(id) {
        if (confirm('Excluir este cliente?')) {
            window.CustomerStore.deleteCustomer(id);
            this.renderCustomers();
        }
    }
};

window.CustomerManager = CustomerManager;
window.openCustomerModal = (id) => CustomerManager.openCustomerModal(id);
window.closeCustomerModal = () => document.getElementById('customer-modal')?.classList.remove('active');
document.getElementById('customer-form')?.addEventListener('submit', (e) => CustomerManager.saveCustomer(e));

const AdminManager = {
    renderUsers() {
        try {
            const adminContainer = document.getElementById('admin-card-container');
            const assistantsContainer = document.getElementById('assistants-container');
            if (!adminContainer || !assistantsContainer) return;

            const admins = window.AuthStore.users.filter(u => u.role === 'admin') || [{ name: 'Admin', id: 1 }];
            const assistants = window.AuthStore.getAssistants() || [];

            let adminsHTML = admins.map(admin => `
            <div class="user-card admin-card glass">
                    <div class="user-icon"><i data-lucide="shield-check"></i></div>
                    <div class="user-info"><h4>Administrador</h4><span class="user-name">${admin.name}</span><span class="user-status">Acesso Total</span></div>
                    <div class="flex gap-2">
                        <button class="action-btn edit" onclick="AdminManager.openEditModal(${admin.id})"><i data-lucide="edit"></i></button>
                        ${admins.length > 1 ? `<button class="action-btn delete" onclick="AdminManager.deleteUser(${admin.id})"><i data-lucide="trash-2"></i></button>` : ''}
                    </div>
            </div>`).join('');

            if (admins.length < 3) { // Limite de 3 admins por segurança
                adminsHTML += `<div class="user-card add-user-card glass dashed admin-style" onclick="AdminManager.addNewAdmin()"><i data-lucide="shield-plus"></i><span>Novo Admin</span></div>`;
            }
            adminContainer.innerHTML = adminsHTML;

            let assistantsHTML = assistants.map(a => `
            <div class="user-card glass">
                    <div class="user-icon small"><i data-lucide="user"></i></div>
                    <div class="user-info"><h4>Auxiliar</h4><span class="user-name">${a.name}</span></div>
                    <div class="flex gap-2"><button class="action-btn edit" onclick="AdminManager.openEditModal(${a.id})"><i data-lucide="edit"></i></button><button class="action-btn delete" onclick="AdminManager.deleteAssistant(${a.id})"><i data-lucide="trash-2"></i></button></div>
            </div>`).join('');

            if (assistants.length < 2) {
                assistantsHTML += `<div class="user-card add-user-card glass dashed" onclick="AdminManager.addNewAssistant()"><i data-lucide="user-plus"></i><span>Adicionar Auxiliar</span></div>`;
            }
            assistantsContainer.innerHTML = assistantsHTML;
            if (window.lucide) lucide.createIcons();
        } catch (err) {
            console.error("Erro ao renderizar usuários:", err);
        }
    },
    openEditModal(userId) {
        const user = window.AuthStore.users.find(u => u.id === userId);
        if (!user) return;
        document.getElementById('u-id').value = user.id;
        document.getElementById('u-name').value = user.name;
        document.getElementById('u-password').value = user.password;
        document.getElementById('user-modal').classList.add('active');
    },
    addNewAdmin() {
        const name = prompt('Nome do Novo Administrador:');
        const pass = prompt('Defina a Senha:');
        if (name && pass) {
            const res = window.AuthStore.addAdmin(name, pass);
            if (!res.success) alert(res.message);
            this.renderUsers();
        }
    },
    deleteUser(id) {
        if (confirm('Excluir este usuário permanentemente?')) {
            window.AuthStore.deleteUser(id);
            this.renderUsers();
        }
    },
    deleteAssistant(id) {
        this.deleteUser(id);
    },
    saveUser(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('u-id').value);
        const data = {
            name: document.getElementById('u-name').value,
            password: document.getElementById('u-password').value
        };
        window.AuthStore.updateUser(id, data);
        window.closeUserModal();
        this.renderUsers();
    }
};

window.AdminManager = AdminManager;
window.closeUserModal = () => document.getElementById('user-modal').classList.remove('active');
document.getElementById('user-form')?.addEventListener('submit', (e) => AdminManager.saveUser(e));


// --- HELP TUTORIAL LOGIC (Fixed v9.0) ---
// FIX CRÍTICO: NÃO usar pointer-events:none globalmente!
// Antes, essa função desabilitava TODOS os botões .add-btn da página inteira.
window.openHelpTutorial = () => {
    // NÃO esconder botões — o modal z-index já cobre tudo
    // (A versão anterior causava bloqueio permanente de TODOS os botões)

    // Abrir Modal (Criar se não existir)
    let modal = document.getElementById('help-tutorial-modal');
    if (!modal) {
        console.log("⚡ Criando Modal de Ajuda Dinamicamente...");
        modal = document.createElement('div');
        modal.id = 'help-tutorial-modal';
        modal.className = 'modal';
        modal.style.zIndex = '9999999';
        modal.style.background = 'rgba(0,0,0,0.98)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';

        modal.innerHTML = `
            <div class="modal-content glass" style="max-width:800px; width:90%; color:white; padding:2rem; position:relative; border: 1px solid var(--gold);">
                <button onclick="closeHelpTutorial()" style="position:absolute; top:10px; right:10px; background:transparent; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
                <div class="report-header">
                    <h2 class="gold-text"><i data-lucide="book-open"></i> MANUAL DO SISTEMA</h2>
                </div>
                <div class="manual-body" style="margin-top:20px; line-height:1.6; max-height:70vh; overflow-y:auto;">
                    <h3>1. Gestão de Estoque</h3>
                    <p>Utilize os botões no topo para adicionar produtos, escanear notas fiscais ou gerar relatórios de compras.</p>
                    <hr class="modern-divider-horizon">
                    <h3>2. Scanner de Notas</h3>
                    <p>Clique em "Escanear NF-e" e aponte a câmera para o QR Code da nota fiscal. O sistema importará os itens automaticamente.</p>
                    <hr class="modern-divider-horizon">
                    <h3>3. Vendas e Pedidos</h3>
                    <p>Acesse a aba "Gerar Pedido" para realizar vendas rápidas. Utilize o leitor de código de barras ou pesquise pelo nome.</p>
                    <div style="margin-top:2rem; text-align:center;">
                        <button onclick="closeHelpTutorial()" class="submit-btn gold-gradient">Entendi, Voltar ao Sistema</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) window.lucide.createIcons();
    }

    setTimeout(() => modal.classList.add('active'), 10);
};

window.closeHelpTutorial = () => {
    // Fechar modal
    const modal = document.getElementById('help-tutorial-modal');
    if (modal) modal.classList.remove('active');

    // SAFETY NET: Restaurar TODOS os botões (caso versão antiga tenha desabilitado)
    if (window.restoreAllButtons) window.restoreAllButtons();
};

// --- FINALIZAÇÃO DE EVENTOS E INICIALIZAÇÃO ---
// Bloco de inicialização movido para o bootstrap no index.html para garantir ordem de dependências.


// --- FINALIZAÇÃO DE EVENTOS E INICIALIZAÇÃO ---

document.getElementById('p-type')?.addEventListener('change', (e) => updateModalFieldsByType(e.target.value));

// --- EXPOSIÇÃO GLOBAL EXPLÍCITA v9.3 (SAFE) ---
// Garante que todas as funções críticas ficam acessíveis via window
// Usa typeof para não crashar se a função não existir neste escopo
try {
    window.renderProducts = renderProducts;
    if (typeof filterHomeProducts !== 'undefined') window.filterHomeProducts = filterHomeProducts;
    if (typeof editProduct !== 'undefined') window.editProduct = editProduct;
    if (typeof deleteProduct !== 'undefined') window.deleteProduct = deleteProduct;
    if (typeof updateProductStock !== 'undefined') window.updateProductStock = updateProductStock;
    if (typeof removeFromShowcase !== 'undefined') window.removeFromShowcase = removeFromShowcase;
    if (typeof editProductImg !== 'undefined') window.editProductImg = editProductImg;
    if (typeof updateFinanceUI !== 'undefined') window.updateFinanceUI = updateFinanceUI;
    if (typeof handleCloseDay !== 'undefined') window.handleCloseDay = handleCloseDay;
    if (typeof viewInvoice !== 'undefined') window.viewInvoice = viewInvoice;
    if (typeof printReport !== 'undefined') window.printReport = printReport;
    if (typeof closeReportModal !== 'undefined') window.closeReportModal = closeReportModal;
    if (typeof openPayment !== 'undefined') window.openPayment = openPayment;
    if (typeof importScannedItems !== 'undefined') window.importScannedItems = importScannedItems;
    if (typeof loadHistoryTable !== 'undefined') window.loadHistoryTable = loadHistoryTable;
    if (typeof navigateToSection !== 'undefined') window.navigateToSection = navigateToSection;
    if (typeof processReportExport !== 'undefined') window.processReportExport = processReportExport;
    if (typeof showReportPreview !== 'undefined') window.showReportPreview = showReportPreview;
    if (typeof closeReportFilterModal !== 'undefined') window.closeReportFilterModal = closeReportFilterModal;
} catch (e) {
    console.warn('⚠️ Exposição global parcial:', e.message);
}

// --- FUNÇÃO DE LIMPEZA DE EMERGÊNCIA ---
window.emergencyReset = function () {
    if (!confirm('⚠️ ATENÇÃO: Isso vai limpar TODOS os dados do sistema (estoque, clientes, financeiro). Deseja continuar?')) return;
    if (!confirm('🔴 ÚLTIMA CHANCE: Todos os dados serão PERMANENTEMENTE apagados. Tem CERTEZA?')) return;
    localStorage.clear();
    alert('Dados limpos. A página será recarregada.');
    location.reload();
};

console.log("✅ app.js v9.3 carregado com exposições globais seguras.");
