/**
 * NFEScanner - Componente para escaneamento de nota fiscal e extração de itens
 */
const NFEScanner = {
    modal: null,
    onImportCallback: null,

    init() {
        if (document.getElementById('nfe-scan-modal')) return; // Idempotency check
        this.createModal();
    },

    createModal() {
        const modalHtml = `
            <div id="nfe-scan-modal" class="modal">
                <div class="modal-content glass scan-modal-content">
                    <div class="scan-header">
                        <h2 class="gold-text"><i data-lucide="scan"></i> Escanear Nota Fiscal (NF-e)</h2>
                        <button class="modal-close-btn" onclick="NFEScanner.close()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    
                    <div id="scan-dropzone" class="scan-dropzone">
                        <div class="scan-tabs">
                            <button class="scan-tab active" onclick="NFEScanner.switchTab('file')">Arquivo / Foto</button>
                            <button class="scan-tab" onclick="NFEScanner.switchTab('text')">Colar Texto da Nota</button>
                        </div>

                        <div id="tab-file" class="tab-content active">
                            <i data-lucide="file-up" class="drop-icon"></i>
                            <p>Arraste a foto/PDF da nota ou clique abaixo</p>
                            <input type="file" id="nfe-file-input" hidden accept="image/*,application/pdf" capture="environment">
                            <button class="gold-btn-outline" onclick="document.getElementById('nfe-file-input').click()">
                                Selecionar Arquivo
                            </button>
                        </div>

                        <div id="tab-text" class="tab-content" style="display:none;">
                            <textarea id="nfe-text-input" class="modern-textarea" placeholder="Cole aqui o texto copiado da sua NF-e ou DANFE..."></textarea>
                            <button class="gold-btn-outline mt-2" onclick="NFEScanner.processText()">
                                Processar Texto Copiado
                            </button>
                        </div>
                    </div>

                    <div id="scan-processing" class="scan-processing" style="display: none;">
                        <div class="scanner-line"></div>
                        <div class="processing-content">
                            <i data-lucide="cpu" class="processing-icon spin"></i>
                            <h3>Lendo Dados da Nota...</h3>
                            <p>Extraindo itens, preços e quantidades</p>
                        </div>
                    </div>

                    <div id="scan-results" class="scan-results" style="display: none;">
                        <div class="results-header">
                            <h3>Itens Detectados</h3>
                            <span class="badge" id="scanned-count">0 itens</span>
                        </div>
                        <div class="results-table-container">
                            <table class="modern-table compact">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Qtd</th>
                                        <th>Custo (Un)</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody id="scanned-items-body">
                                    <!-- Injetado por JS -->
                                </tbody>
                            </table>
                        </div>
                        <div class="scan-actions">
                            <button class="cancel-btn" onclick="NFEScanner.reset()">Novo Escaneamento</button>
                            <button class="submit-btn-new" onclick="NFEScanner.import()">Confirmar Importação no Estoque</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('nfe-scan-modal');

        document.getElementById('nfe-file-input').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processFile(e.target.files[0]);
            }
        });

        if (window.lucide) window.lucide.createIcons();
    },

    open(callback) {
        this.onImportCallback = callback;
        this.reset();
        this.modal.classList.add('active');
    },

    close() {
        this.modal.classList.remove('active');
    },

    reset() {
        document.getElementById('scan-dropzone').style.display = 'flex';
        document.getElementById('scan-processing').style.display = 'none';
        document.getElementById('scan-results').style.display = 'none';
        document.getElementById('nfe-file-input').value = '';
    },

    async processFile(file) {
        // Exibir processamento
        document.getElementById('scan-dropzone').style.display = 'none';
        document.getElementById('scan-processing').style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();

        // Simular delay de processamento (OCR/API)
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Mock de dados extraídos para arquivos (Pode ser expandido no futuro)
        const mockItems = [
            { name: 'Coca-Cola 350ml Lata', qty: 24, cost: 2.15, category: 'Bebidas', type: 'produto' },
            { name: 'Pão de Hambúrguer Gergelim', qty: 50, cost: 0.85, category: 'Lanches', type: 'insumo' }
        ];

        this.renderResults(mockItems);
    },

    switchTab(tab) {
        document.querySelectorAll('.scan-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

        const btn = document.querySelector(`.scan-tab[onclick*="${tab}"]`);
        if (btn) btn.classList.add('active');

        const content = document.getElementById(`tab-${tab}`);
        if (content) content.style.display = 'flex';
    },

    async processText() {
        const textArea = document.getElementById('nfe-text-input');
        const text = textArea ? textArea.value : '';
        if (!text.trim()) return alert('Por favor, cole o texto da nota primeiro.');

        document.getElementById('scan-dropzone').style.display = 'none';
        document.getElementById('scan-processing').style.display = 'flex';

        await new Promise(r => setTimeout(r, 1000));

        const items = this.parseNFText(text);
        if (items.length === 0) {
            alert('Não foi possível identificar itens no texto colado. Tente copiar a tabela de produtos da nota.');
            this.reset();
            return;
        }

        this.renderResults(items);
    },

    parseNFText(text) {
        const lines = text.split('\n');
        const items = [];

        const productPattern = /(.*?)\s+(\d{8})\s+(\d{4})\s+([A-Z]{2})\s+([\d,.]+)\s+([\d,.]+)/g;

        lines.forEach(line => {
            const matches = [...line.matchAll(productPattern)];
            if (matches.length > 0) {
                matches.forEach(m => {
                    const name = m[1].replace(/^\d+\s+/, '').trim();
                    const qty = parseFloat(m[5].replace('.', '').replace(',', '.'));
                    const totalVal = parseFloat(m[6].replace('.', '').replace(',', '.'));

                    if (name && !isNaN(qty) && !isNaN(totalVal)) {
                        items.push({
                            name: name,
                            qty: qty,
                            cost: totalVal / qty,
                            total: totalVal,
                            category: 'Importado',
                            type: 'produto'
                        });
                    }
                });
            } else {
                const simpleMatch = line.match(/^(.+?)\s+(\d+)\s+([0-9,.]{3,})$/);
                if (simpleMatch) {
                    const name = simpleMatch[1].trim();
                    const qty = parseFloat(simpleMatch[2]);
                    const costString = simpleMatch[3].replace('.', '').replace(',', '.');
                    const cost = parseFloat(costString);
                    if (name.length > 3 && !isNaN(qty) && !isNaN(cost)) {
                        items.push({
                            name: name,
                            qty: qty,
                            cost: cost,
                            total: qty * cost,
                            category: 'Importado',
                            type: 'produto'
                        });
                    }
                }
            }
        });

        return items;
    },

    renderResults(items) {
        this.scannedItems = items;
        document.getElementById('scan-processing').style.display = 'none';
        document.getElementById('scan-results').style.display = 'block';

        const body = document.getElementById('scanned-items-body');
        const countSpan = document.getElementById('scanned-count');
        if (countSpan) countSpan.innerText = `${items.length} itens`;

        if (body) {
            body.innerHTML = items.map((item, index) => `
                <tr>
                    <td><input type="text" value="${item.name}" class="scanner-edit-input" onchange="NFEScanner.updateItem(${index}, 'name', this.value)"></td>
                    <td><input type="number" value="${item.qty}" class="scanner-edit-input qty" onchange="NFEScanner.updateItem(${index}, 'qty', this.value)"></td>
                    <td><input type="number" value="${item.cost.toFixed(2)}" step="0.01" class="scanner-edit-input cost" onchange="NFEScanner.updateItem(${index}, 'cost', this.value)"></td>
                    <td class="gold-text">R$ ${(item.qty * item.cost).toFixed(2)}</td>
                </tr>
            `).join('');
        }
    },

    updateItem(index, field, value) {
        if (field === 'qty' || field === 'cost') {
            this.scannedItems[index][field] = parseFloat(value) || 0;
        } else {
            this.scannedItems[index][field] = value;
        }
        this.renderResults(this.scannedItems);
    },

    import() {
        if (this.onImportCallback && this.scannedItems) {
            this.onImportCallback(this.scannedItems);
        }
        this.close();

        const toast = document.createElement('div');
        toast.className = 'toast-success';
        toast.innerHTML = `<i data-lucide="check-circle"></i> ${this.scannedItems ? this.scannedItems.length : 0} Itens importados com sucesso!`;
        document.body.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        setTimeout(() => toast.remove(), 3000);
    }
};

window.NFEScanner = NFEScanner;
console.log("Módulo: nfe-scanner.js carregado.");
