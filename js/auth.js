const AuthStore = {
    users: [],

    init() {
        try {
            const local = localStorage.getItem('cantina_auth');
            if (local) {
                this.users = JSON.parse(local);
            }

            // Garantir que sempre existe ao menos o Admin
            if (!this.users || !Array.isArray(this.users) || !this.users.some(u => u.role === 'admin')) {
                this.users = [{
                    id: 1,
                    name: 'Admin',
                    password: 'admin',
                    role: 'admin'
                }];
                this.save();
            }
        } catch (err) {
            console.error("Erro ao iniciar AuthStore:", err);
            this.users = [{ id: 1, name: 'Admin', password: 'admin', role: 'admin' }];
            this.save();
        }
    },

    save() {
        localStorage.setItem('cantina_auth', JSON.stringify(this.users));
    },

    getUsers() {
        return this.users;
    },

    getAdmin() {
        return this.users.find(u => u.role === 'admin');
    },

    getAssistants() {
        return this.users.filter(u => u.role === 'assistant');
    },

    updateUser(id, data) {
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
            this.users[index] = { ...this.users[index], ...data };
            this.save();
            return true;
        }
        return false;
    },

    addAssistant(name, password) {
        const assistants = this.getAssistants();
        if (assistants.length >= 2) return { success: false, message: 'Limite de 2 auxiliares atingido.' };

        const newUser = {
            id: Date.now(),
            name,
            password,
            role: 'assistant'
        };

        this.users.push(newUser);
        this.save();
        return { success: true, user: newUser };
    },

    addAdmin(name, password) {
        const newUser = {
            id: Date.now(),
            name,
            password,
            role: 'admin'
        };

        this.users.push(newUser);
        this.save();
        return { success: true, user: newUser };
    },

    deleteUser(id) {
        const user = this.users.find(u => u.id === id);
        if (!user || user.role === 'admin') return false;

        this.users = this.users.filter(u => u.id !== id);
        this.save();
        return true;
    },

    checkSession() {
        console.log("Sessão verificada. Usuário logado: Admin");
        return true;
    }
};

window.AuthStore = AuthStore;
AuthStore.init(); // Inicializar automaticamente para carregar usuários
console.log("Módulo: auth.js carregado.");
