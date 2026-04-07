const CustomerStore = {
    customers: [],

    init() {
        const local = localStorage.getItem('cantina_customers');
        if (local) {
            this.customers = JSON.parse(local);
        } else {
            // Seed initial data if empty
            this.customers = [
                { id: 1, name: 'Caixa', address: 'Interno', phone: '', email: '', orders: [] }
            ];
            this.save();
        }
    },

    save() {
        localStorage.setItem('cantina_customers', JSON.stringify(this.customers));
    },

    getAll() {
        return this.customers;
    },

    addCustomer(data) {
        const customer = {
            id: Date.now(),
            name: data.name,
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            orders: []
        };
        this.customers.push(customer);
        this.save();
        return customer;
    },

    updateCustomer(id, data) {
        const index = this.customers.findIndex(c => c.id === id);
        if (index !== -1) {
            this.customers[index] = { ...this.customers[index], ...data };
            this.save();
        }
    },

    deleteCustomer(id) {
        this.customers = this.customers.filter(c => c.id !== id);
        this.save();
    },

    addOrderToCustomer(customerId, order) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            if (!customer.orders) customer.orders = [];
            customer.orders.push(order);
            this.save();
        }
    }
};

window.CustomerStore = CustomerStore;
// CustomerStore.init() movido para o bootstrap no index.html
console.log("Módulo: customers.js carregado.");
