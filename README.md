# 🍽️ Cantina dos Amigos — Sistema ERP

> Sistema de gestão completo para cantinas e pequenos estabelecimentos alimentares. Desenvolvido com HTML, CSS e JavaScript puro, sem dependências externas.

![Versão](https://img.shields.io/badge/versão-2.0-gold)
![Linguagem](https://img.shields.io/badge/tecnologia-HTML%20%7C%20CSS%20%7C%20JS-green)
![Status](https://img.shields.io/badge/status-ativo-brightgreen)

---

## 📋 Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| 🛒 **PDV / Vendas** | Ponto de venda com carrinho, múltiplas formas de pagamento (PIX, cartão, dinheiro) |
| 📦 **Estoque** | Controle de produtos e insumos com alertas de estoque mínimo |
| 💰 **Financeiro (ERP)** | Dashboard financeiro, contas a pagar/receber e fluxo de caixa |
| 👥 **Clientes** | Cadastro de clientes e histórico de compras |
| 📊 **Relatórios** | Relatórios de vendas, estoque e desempenho |
| 🔐 **Autenticação** | Login com controle de acesso por perfil (admin/operador) |
| 🔔 **Notificações** | Sistema de alertas em tempo real |
| 🧾 **Nota Fiscal** | Scanner de NF-e integrado |

---

## 🚀 Como Usar

### Opção 1 — Abrir Diretamente
Basta abrir o arquivo `index.html` no seu navegador. O sistema redireciona automaticamente para a aplicação.

### Opção 2 — Instalação no PC (Windows)
Execute o arquivo `CLIQUE_PARA_INSTALAR.bat` como Administrador. Ele cria um atalho na área de trabalho.

### Opção 3 — Atualização
Execute `ATUALIZAR_NO_PC.bat` para baixar e aplicar a versão mais recente do GitHub.

---

## 🗂️ Estrutura do Projeto

```
cantina-dos-amigos/
├── index.html              # Entrada principal (redireciona para cantina.html)
├── cantina.html            # Aplicação principal (SPA completa)
├── css/
│   └── style.css           # Estilos com tema escuro e glassmorphism
├── js/
│   ├── app.js              # Bootstrap e lógica central
│   ├── auth.js             # Autenticação e controle de acesso
│   ├── finance.js          # Módulo financeiro (ERP)
│   ├── inventory.js        # Controle de estoque
│   ├── sales.js            # PDV e vendas
│   ├── customers.js        # Gestão de clientes
│   ├── reports.js          # Relatórios e análises
│   ├── payments.js         # Processamento de pagamentos
│   ├── notifications.js    # Sistema de notificações
│   └── nfe-scanner.js      # Leitor de Nota Fiscal Eletrônica
├── assets/
│   ├── logo_3d.png         # Logo do sistema
│   └── salgado.jpg         # Imagem padrão de produto
└── service/
    ├── app.py              # Backend Python (opcional)
    └── requirements.txt    # Dependências do backend
```

---

## 🎨 Tecnologias

- **Frontend:** HTML5, CSS3 Vanilla, JavaScript ES6+
- **Armazenamento:** localStorage (dados persistem no navegador)
- **Ícones:** [Lucide Icons](https://lucide.dev/)
- **Fontes:** Google Fonts (Inter, Orbitron)
- **Backend (opcional):** Python / Flask

---

## 💾 Dados e Backup

Todos os dados são armazenados localmente no navegador via `localStorage`. O sistema oferece:
- **Exportar Backup** — gera um arquivo `.json` com todos os dados
- **Restaurar Backup** — importa um arquivo de backup previamente exportado

> ⚠️ Limpar o cache/histórico do navegador apagará os dados. Use o backup regularmente!

---

## 🔑 Acesso Padrão

| Usuário | Senha | Perfil |
|---------|-------|--------|
| admin | admin | Administrador |

> Altere a senha após o primeiro acesso nas configurações do sistema.

---

## 📞 Suporte

Projeto desenvolvido para gestão interna da **Cantina dos Amigos**.

---

*© 2026 Cantina dos Amigos — Todos os direitos reservados*
