/**
 * Notification Manager v1.0
 * Handles alerts and status updates for automated payments.
 */
const NotificationManager = {
    alerts: [],

    createContainer() {
        if (document.getElementById('quantum-notifications')) return;
        const container = document.createElement('div');
        container.id = 'quantum-notifications';
        container.style = "position:fixed; top:20px; right:20px; z-index:10000; display:flex; flex-direction:column; gap:10px; max-width:300px;";
        document.body.appendChild(container);
    },

    notify(title, message, type = 'info') {
        this.createContainer(); // Garantir que o container existe
        const container = document.getElementById('quantum-notifications');
        const alert = document.createElement('div');

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };

        alert.className = 'glass quantum-card';
        alert.style = `
            padding: 15px;
            color: white;
            border-left: 4px solid ${colors[type]};
            animation: slideIn 0.3s ease-out;
            box-shadow: var(--quantum-glow);
        `;

        alert.innerHTML = `
            <div style="font-family:'Orbitron'; font-size:0.7rem; color:${colors[type]}; margin-bottom:5px;">${title.toUpperCase()}</div>
            <div style="font-size:0.85rem;">${message}</div>
            <div style="font-size:0.6rem; margin-top:5px; color:#aaa;">PQC Secure Channel</div>
        `;

        container.appendChild(alert);

        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    }
};

// Add animations to CSS
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

window.NotificationManager = NotificationManager;
console.log("Módulo: notifications.js carregado.");
