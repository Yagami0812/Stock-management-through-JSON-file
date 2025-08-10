class InvoiceManager {
    constructor() {
        this.equipmentList = [];
        this.tabs = [];
        this.activeTab = 'equipment';
        this.init();
    }
    init() {
        this.setupEventListeners();
        this.updateTotalMonthly();
        this.setupScrollIndicators();
        this.initializeDarkMode();
    }
    setupScrollIndicators() {
        // Add scroll indicators for mobile tables
        const tables = document.querySelectorAll('.table-container');
        tables.forEach(container => {
            const table = container.querySelector('table');
            if (table) {
                container.addEventListener('scroll', () => {
                    if (container.scrollLeft > 0) {
                        container.classList.add('table-scrolled');
                    } else {
                        container.classList.remove('table-scrolled');
                    }
                });
            }
        });
    }
    setupEventListeners() {
        document.getElementById('equipmentTable').addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT') {
                this.handleEquipmentInput(e.target);
            }
        });
        document.getElementById('equipmentTable').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                this.removeEquipmentRow(e.target);
            }
        });
        document.getElementById('equipmentTab').addEventListener('click', () => {
            this.switchTab('equipment');
        });
        document.getElementById('addTabBtn').addEventListener('click', () => {
            this.showAddTabModal();
        });
        document.getElementById('confirmAddTab').addEventListener('click', () => {
            this.addNewTab();
        });
        document.getElementById('cancelAddTab').addEventListener('click', () => {
            this.hideAddTabModal();
        });
        document.getElementById('tabNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewTab();
            }
        });
        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
        // Close modal on backdrop click
        document.getElementById('addTabModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideAddTabModal();
            }
        });
        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });
    }
    initializeDarkMode() {
        // Check if user has a saved preference, otherwise use system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
            this.updateDarkModeButton(true);
        } else {
            document.documentElement.classList.remove('dark');
            this.updateDarkModeButton(false);
        }
    }
    toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateDarkModeButton(isDark);
    }
    updateDarkModeButton(isDark) {
        const icon = document.getElementById('darkModeIcon');
        const text = document.getElementById('darkModeText');
        
        if (isDark) {
            icon.textContent = '☀️';
            text.textContent = 'Light Mode';
        } else {
            icon.textContent = '🌙';
            text.textContent = 'Dark Mode';
        }
    }
    handleEquipmentInput(input) {
        const row = input.closest('tr');
        const inputs = row.querySelectorAll('input');
        const hasData = Array.from(inputs).some(inp => inp.value.trim() !== '');
        if (hasData) {
            const removeBtn = row.querySelector('.remove-btn');
            removeBtn.style.display = 'inline-block';
            if (row === row.parentNode.lastElementChild) {
                this.addEmptyEquipmentRow();
            }
        }
        this.updateEquipmentList();
    }
    addEmptyEquipmentRow() {
        const tbody = document.getElementById('equipmentTable');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-1 px-1 sm:px-2"><input type="text" class="w-full min-w-28 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" placeholder="Equipment name"></td>
            <td class="py-1 px-1 sm:px-2"><input type="text" class="w-full min-w-24 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" placeholder="Supplier"></td>
            <td class="py-1 px-1 sm:px-2"><input type="number" step="0.01" class="w-full min-w-20 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" placeholder="0.00"></td>
            <td class="py-1 px-1 sm:px-2"><input type="date" class="date-text w-full min-w-28 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm"></td>
            <td class="py-1 px-1 sm:px-2"><input type="number" class="w-full min-w-16 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" placeholder="12"></td>
            <td class="py-1 px-1 sm:px-2"><button class="remove-btn px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-xs sm:text-sm" style="display:none;">Remove</button></td>
        `;
        tbody.appendChild(row);
    }
    removeEquipmentRow(btn) {
        const row = btn.closest('tr');
        row.remove();
        this.updateEquipmentList();
        this.updateTotalMonthly();
    }
    updateEquipmentList() {
        const rows = document.getElementById('equipmentTable').querySelectorAll('tr');
        this.equipmentList = [];
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const name = inputs[0].value.trim();
            if (name) {
                this.equipmentList.push({
                    name,
                    supplier: inputs[1].value.trim(),
                    price: parseFloat(inputs[2].value) || 0,
                    priceDate: inputs[3].value,
                    monthsAmortization: parseInt(inputs[4].value) || 12
                });
            }
        });
        this.updateEquipmentDropdowns();
    }
    updateEquipmentDropdowns() {
        this.tabs.forEach(tab => {
            const selects = document.querySelectorAll(`#${tab.id}Content select`);
            selects.forEach(select => {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Select equipment...</option>';
                this.equipmentList.forEach(equipment => {
                    const option = document.createElement('option');
                    option.value = equipment.name;
                    option.textContent = equipment.name;
                    select.appendChild(option);
                });
                select.value = currentValue;
            });
        });
    }
    showAddTabModal() {
        document.getElementById('addTabModal').classList.remove('hidden');
        document.getElementById('addTabModal').classList.add('flex');
        document.getElementById('tabNameInput').focus();
    }
    hideAddTabModal() {
        document.getElementById('addTabModal').classList.add('hidden');
        document.getElementById('addTabModal').classList.remove('flex');
        document.getElementById('tabNameInput').value = '';
    }
    addNewTab() {
        const name = document.getElementById('tabNameInput').value.trim();
        if (!name) return;
        const tabId = 'tab_' + Date.now();
        const tab = {
            id: tabId,
            name,
            active: true,
            items: []
        };
        this.tabs.push(tab);
        this.renderTab(tab);
        this.switchTab(tabId);
        this.hideAddTabModal();
    }
    renderTab(tab) {
        const tabsContainer = document.getElementById('customTabs');
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm relative whitespace-nowrap';
        tabButton.id = `${tab.id}Tab`;
        tabButton.innerHTML = `
            <span class="mr-2">${tab.name}</span>
            <button class="close-tab text-red-500 hover:text-red-700 text-xs" data-tab-id="${tab.id}">×</button>
        `;
        tabButton.addEventListener('click', (e) => {
            if (!e.target.classList.contains('close-tab')) {
                this.switchTab(tab.id);
            }
        });
        tabButton.querySelector('.close-tab').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeTab(tab.id);
        });
        tabsContainer.appendChild(tabButton);
        const tabContent = document.createElement('div');
        tabContent.id = `${tab.id}Content`;
        tabContent.className = 'tab-content p-3 sm:p-4 lg:p-6 hidden';
        tabContent.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <h2 class="text-lg sm:text-xl font-semibold">${tab.name}</h2>
                <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label class="flex items-center text-sm">
                        <input type="checkbox" ${tab.active ? 'checked' : ''} class="tab-active-checkbox mr-2" data-tab-id="${tab.id}">
                        Active
                    </label>
                    <div class="text-base sm:text-lg font-semibold">
                        Total: ₱<span class="tab-total">0.00</span>
                    </div>
                </div>
            </div>
            <div class="table-container overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                            <th class="text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm min-w-32">Name</th>
                            <th class="text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm min-w-20">Quantity</th>
                            <th class="text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm min-w-28">Monthly Cost</th>
                            <th class="text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm min-w-20">Action</th>
                        </tr>
                    </thead>
                    <tbody class="tab-table">
                        <tr>
                            <td class="py-1 px-1 sm:px-2">
                                <select class="w-full min-w-28 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm">
                                    <option value="">Select equipment...</option>
                                </select>
                            </td>
                            <td class="py-1 px-1 sm:px-2"><input type="number" class="quantity-input w-full min-w-16 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" placeholder="1" min="1"></td>
                            <td class="monthly-cost py-1 px-1 sm:px-2 text-xs sm:text-sm">₱0.00</td>
                            <td class="py-1 px-1 sm:px-2"><button class="remove-btn px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-xs sm:text-sm" style="display:none;">Remove</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('tabContent').appendChild(tabContent);
        this.setupTabEventListeners(tab.id);
        this.updateEquipmentDropdowns();
        this.setupScrollIndicators();
    }
    setupTabEventListeners(tabId) {
        const content = document.getElementById(`${tabId}Content`);
        content.querySelector('.tab-active-checkbox').addEventListener('change', (e) => {
            const tab = this.tabs.find(t => t.id === tabId);
            tab.active = e.target.checked;
            this.updateTotalMonthly();
        });
        content.querySelector('.tab-table').addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT' || e.target.classList.contains('quantity-input')) {
                this.handleTabInput(e.target, tabId);
            }
        });
        content.querySelector('.tab-table').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                this.removeTabRow(e.target, tabId);
            }
        });
    }
    handleTabInput(input, tabId) {
        const row = input.closest('tr');
        const select = row.querySelector('select');
        const quantityInput = row.querySelector('.quantity-input');
        const monthlyCostCell = row.querySelector('.monthly-cost');
        if (select.value && quantityInput.value) {
            const equipment = this.equipmentList.find(eq => eq.name === select.value);
            const quantity = parseInt(quantityInput.value) || 1;
            const monthlyCost = equipment ? (equipment.price / equipment.monthsAmortization) * quantity : 0;
            monthlyCostCell.textContent = `₱${monthlyCost.toFixed(2)}`;
            const removeBtn = row.querySelector('.remove-btn');
            removeBtn.style.display = 'inline-block';
            if (row === row.parentNode.lastElementChild) {
                this.addEmptyTabRow(tabId);
            }
        } else {
            monthlyCostCell.textContent = '₱0.00';
        }
        this.updateTabTotal(tabId);
        this.updateTotalMonthly();
    }
    addEmptyTabRow(tabId) {
        const tbody = document.querySelector(`#${tabId}Content .tab-table`);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-1 px-1 sm:px-2">
                <select class="w-full min-w-28 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm">
                    <option value="">Select equipment...</option>
                </select>
            </td>
            <td class="py-1 px-1 sm:px-2"><input type="number" class="quantity-input w-full min-w-16 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" placeholder="1" min="1"></td>
            <td class="monthly-cost py-1 px-1 sm:px-2 text-xs sm:text-sm">₱0.00</td>
            <td class="py-1 px-1 sm:px-2"><button class="remove-btn px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-xs sm:text-sm" style="display:none;">Remove</button></td>
        `;
        tbody.appendChild(row);
        const select = row.querySelector('select');
        this.equipmentList.forEach(equipment => {
            const option = document.createElement('option');
            option.value = equipment.name;
            option.textContent = equipment.name;
            select.appendChild(option);
        });
    }
    removeTabRow(btn, tabId) {
        const row = btn.closest('tr');
        row.remove();
        this.updateTabTotal(tabId);
        this.updateTotalMonthly();
    }
    updateTabTotal(tabId) {
        const content = document.getElementById(`${tabId}Content`);
        const rows = content.querySelectorAll('.tab-table tr');
        let total = 0;
        rows.forEach(row => {
            const monthlyCostText = row.querySelector('.monthly-cost').textContent;
            const cost = parseFloat(monthlyCostText.replace('₱', '')) || 0;
            total += cost;
        });
        content.querySelector('.tab-total').textContent = total.toFixed(2);
    }
    updateTotalMonthly() {
        let total = 0;
        this.tabs.forEach(tab => {
            if (tab.active) {
                const content = document.getElementById(`${tab.id}Content`);
                const tabTotal = parseFloat(content.querySelector('.tab-total').textContent) || 0;
                total += tabTotal;
            }
        });
        document.getElementById('totalMonthly').textContent = total.toFixed(2);
    }
    removeTab(tabId) {
        document.getElementById(`${tabId}Tab`).remove();
        document.getElementById(`${tabId}Content`).remove();
        this.tabs = this.tabs.filter(tab => tab.id !== tabId);
        if (this.activeTab === tabId) {
            this.switchTab('equipment');
        }
        this.updateTotalMonthly();
    }
    switchTab(tabId) {
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        if (tabId === 'equipment') {
            document.getElementById('equipmentTab').classList.add('active');
            document.getElementById('equipmentContent').classList.remove('hidden');
        } else {
            document.getElementById(`${tabId}Tab`).classList.add('active');
            document.getElementById(`${tabId}Content`).classList.remove('hidden');
        }
        this.activeTab = tabId;
    }
    exportData() {
        const data = {
            equipmentList: this.equipmentList,
            tabs: this.tabs.map(tab => ({
                ...tab,
                items: this.getTabItems(tab.id)
            }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'invoice_data.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    getTabItems(tabId) {
        const content = document.getElementById(`${tabId}Content`);
        const rows = content.querySelectorAll('.tab-table tr');
        const items = [];
        rows.forEach(row => {
            const select = row.querySelector('select');
            const quantity = row.querySelector('.quantity-input');
            if (select.value && quantity.value) {
                items.push({
                    name: select.value,
                    quantity: parseInt(quantity.value) || 1
                });
            }
        });
        return items;
    }
    importData(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.loadData(data);
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    loadData(data) {
        // Clear existing tabs
        this.tabs.forEach(tab => this.removeTab(tab.id));
        this.equipmentList = [];
        // Load equipment list
        this.loadEquipmentList(data.equipmentList || []);
        // Load tabs
        (data.tabs || []).forEach(tabData => {
            this.addNewTabFromData(tabData);
        });
        this.updateTotalMonthly();
    }
    loadEquipmentList(equipmentData) {
        const tbody = document.getElementById('equipmentTable');
        tbody.innerHTML = '';
        equipmentData.forEach(equipment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-1 px-1 sm:px-2"><input type="text" class="w-full min-w-28 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" placeholder="Equipment name" value="${equipment.name || ''}"></td>
                <td class="py-1 px-1 sm:px-2"><input type="text" class="w-full min-w-24 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" placeholder="Supplier" value="${equipment.supplier || ''}"></td>
                <td class="py-1 px-1 sm:px-2"><input type="number" step="0.01" class="w-full min-w-20 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" placeholder="0.00" value="${equipment.price || ''}"></td>
                <td class="py-1 px-1 sm:px-2"><input type="date" class="w-full min-w-28 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" value="${equipment.priceDate || ''}"></td>
                <td class="py-1 px-1 sm:px-2"><input type="number" class="w-full min-w-16 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" placeholder="12" value="${equipment.monthsAmortization || 12}"></td>
                <td class="py-1 px-1 sm:px-2"><button class="remove-btn px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-xs sm:text-sm">Remove</button></td>
            `;
            tbody.appendChild(row);
        });
        this.addEmptyEquipmentRow();
        this.updateEquipmentList();
    }
    addNewTabFromData(tabData) {
        const tab = {
            id: tabData.id || 'tab_' + Date.now(),
            name: tabData.name,
            active: tabData.active !== false,
            items: tabData.items || []
        };
        this.tabs.push(tab);
        this.renderTab(tab);
        // Add items to the tab
        const content = document.getElementById(`${tab.id}Content`);
        if (content) {
            const tbody = content.querySelector('.tab-table');
            if (tbody) {
                tbody.innerHTML = '';
                tab.items.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="py-1 px-1 sm:px-2">
                            <select class="w-full min-w-28 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm">
                                <option value="">Select equipment...</option>
                            </select>
                        </td>
                        <td class="py-1 px-1 sm:px-2"><input type="number" class="quantity-input w-full min-w-16 p-1 sm:p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs sm:text-sm" placeholder="1" min="1" value="${item.quantity || 1}"></td>
                        <td class="monthly-cost py-1 px-1 sm:px-2 text-xs sm:text-sm">₱0.00</td>
                        <td class="py-1 px-1 sm:px-2"><button class="remove-btn px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-xs sm:text-sm">Remove</button></td>
                    `;
                    const select = row.querySelector('select');
                    this.equipmentList.forEach(equipment => {
                        const option = document.createElement('option');
                        option.value = equipment.name;
                        option.textContent = equipment.name;
                        select.appendChild(option);
                    });
                    select.value = item.name || '';
                    // Calculate monthly cost
                    const equipment = this.equipmentList.find(eq => eq.name === item.name);
                    if (equipment && item.quantity) {
                        const monthlyCost = (equipment.price / equipment.monthsAmortization) * item.quantity;
                        row.querySelector('.monthly-cost').textContent = `₱${monthlyCost.toFixed(2)}`;
                    }
                    tbody.appendChild(row);
                });
                this.addEmptyTabRow(tab.id);
                this.updateTabTotal(tab.id);
            }
        }
    }
}
// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InvoiceManager();
});