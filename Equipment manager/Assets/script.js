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
                    <td><input type="text" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="Equipment name"></td>
                    <td><input type="text" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="Supplier"></td>
                    <td><input type="number" step="0.01" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="0.00"></td>
                    <td><input type="date" class="date-text w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"></td>
                    <td><input type="number" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="12"></td>
                    <td><button class="remove-btn px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200" style="display:none;">Remove</button></td>
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

                // Update dropdowns
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
                tabButton.className = 'tab-button py-2 px-1 border-b-2 font-medium text-sm relative';
                tabButton.id = `${tab.id}Tab`;
                tabButton.innerHTML = `
                    ${tab.name}
                    <button class="close-tab ml-2 text-red-500 hover:text-red-700" data-tab-id="${tab.id}">×</button>
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
                tabContent.className = 'tab-content p-6 hidden';
                tabContent.innerHTML = `
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-semibold">${tab.name}</h2>
                        <div class="flex items-center gap-4">
                            <label class="flex items-center">
                                <input type="checkbox" ${tab.active ? 'checked' : ''} class="tab-active-checkbox mr-2" data-tab-id="${tab.id}">
                                Active
                            </label>
                            <div class="text-lg font-semibold">
                                Total: Php <span class="tab-total">0.00</span>
                            </div>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead>
                                <tr class="border-b border-gray-200 dark:border-gray-700">
                                    <th class="text-left py-3 px-2">Name</th>
                                    <th class="text-left py-3 px-2">Quantity</th>
                                    <th class="text-left py-3 px-2">Monthly Cost</th>
                                    <th class="text-left py-3 px-2">Action</th>
                                </tr>
                            </thead>
                            <tbody class="tab-table">
                                <tr>
                                    <td>
                                        <select class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
                                            <option value="">Select equipment...</option>
                                        </select>
                                    </td>
                                    <td><input type="number" class="quantity-input w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="1" min="1"></td>
                                    <td class="monthly-cost p-2">Php 0.00</td>
                                    <td><button class="remove-btn px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200" style="display:none;">Remove</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;

                document.getElementById('tabContent').appendChild(tabContent);

                this.setupTabEventListeners(tab.id);
                this.updateEquipmentDropdowns();
            }

            setupTabEventListeners(tabId) {
                const content = document.getElementById(`${tabId}Content`);

                // Checkbox
                content.querySelector('.tab-active-checkbox').addEventListener('change', (e) => {
                    const tab = this.tabs.find(t => t.id === tabId);
                    tab.active = e.target.checked;
                    this.updateTotalMonthly();
                });

                // Table
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

                    monthlyCostCell.textContent = `Php ${monthlyCost.toFixed(2)}`;

                    const removeBtn = row.querySelector('.remove-btn');
                    removeBtn.style.display = 'inline-block';

                    if (row === row.parentNode.lastElementChild) {
                        this.addEmptyTabRow(tabId);
                    }
                } else {
                    monthlyCostCell.textContent = 'Php0.00';
                }

                this.updateTabTotal(tabId);
                this.updateTotalMonthly();
            }

            addEmptyTabRow(tabId) {
                const tbody = document.querySelector(`#${tabId}Content .tab-table`);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <select class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
                            <option value="">Select equipment...</option>
                        </select>
                    </td>
                    <td><input type="number" class="quantity-input w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="1" min="1"></td>
                    <td class="monthly-cost p-2">Php 0.00</td>
                    <td><button class="remove-btn px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200" style="display:none;">-</button></td>
                `;
                tbody.appendChild(row);

                // Update equipment dropdown
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
                    const cost = parseFloat(monthlyCostText.replace('Php', '')) || 0;
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
                this.tabs.forEach(tab => this.removeTab(tab.id));
                this.equipmentList = [];

                this.loadEquipmentList(data.equipmentList || []);

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
                        <td><input type="text" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="Equipment name" value="${equipment.name}"></td>
                        <td><input type="text" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="Supplier" value="${equipment.supplier}"></td>
                        <td><input type="number" step="0.01" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="0.00" value="${equipment.price}"></td>
                        <td><input type="date" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" value="${equipment.priceDate}"></td>
                        <td><input type="number" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="12" value="${equipment.monthsAmortization}"></td>
                        <td><button class="remove-btn px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">-</button></td>
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

                const content = document.getElementById(`${tab.id}Content`);
                const tbody = content.querySelector('.tab-table');
                tbody.innerHTML = '';

                tab.items.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <select class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
                                <option value="">Select equipment...</option>
                            </select>
                        </td>
                        <td><input type="number" class="quantity-input w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="1" min="1" value="${item.quantity}"></td>
                        <td class="monthly-cost p-2">Php 0.00</td>
                        <td><button class="remove-btn px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">-</button></td>
                    `;

                    const select = row.querySelector('select');
                    this.equipmentList.forEach(equipment => {
                        const option = document.createElement('option');
                        option.value = equipment.name;
                        option.textContent = equipment.name;
                        select.appendChild(option);
                    });
                    select.value = item.name;

                    const equipment = this.equipmentList.find(eq => eq.name === item.name);
                    if (equipment) {
                        const monthlyCost = (equipment.price / equipment.monthsAmortization) * item.quantity;
                        row.querySelector('.monthly-cost').textContent = `Php ${monthlyCost.toFixed(2)}`;
                    }

                    tbody.appendChild(row);
                });

                this.addEmptyTabRow(tab.id);
                this.updateTabTotal(tab.id);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            new InvoiceManager();
        });