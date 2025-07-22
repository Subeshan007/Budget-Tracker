class BudgetTracker {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.budgetUpdates = JSON.parse(localStorage.getItem('budgetUpdates')) || [];
        this.currentBudget = parseFloat(localStorage.getItem('currentBudget')) || 0;
        this.totalSpent = this.calculateTotalSpent();
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateDisplay();
        this.addFabAnimation();
    }
    
    bindEvents() {
        document.getElementById('add-expense').addEventListener('click', () => this.addExpense());
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });
        
        document.getElementById('set-budget').addEventListener('click', () => this.setBudget());
        document.getElementById('budget').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setBudget();
        });
        
        document.getElementById('increase-budget-button').addEventListener('click', () => this.increaseBudget());
        document.getElementById('increase-budget').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.increaseBudget();
        });
        
        document.getElementById('download-pdf').addEventListener('click', () => this.downloadPDF());
        document.getElementById('download-excel').addEventListener('click', () => this.downloadExcel());
        
        document.getElementById('clear-all').addEventListener('click', () => this.clearAllData());
        
        document.getElementById('fab').addEventListener('click', () => this.focusExpenseInput());
        
        document.getElementById('expense').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('amount').focus();
        });
        
        document.getElementById('amount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addExpense();
        });
    }
    
    addExpense() {
        const expenseInput = document.getElementById('expense');
        const amountInput = document.getElementById('amount');
        
        const expense = expenseInput.value.trim();
        const amount = parseFloat(amountInput.value);
        
        if (!expense || !amount || amount <= 0) {
            this.showMessage('Please enter valid expense details! 🤔', 'error');
            return;
        }
        
        const newExpense = {
            id: Date.now(),
            name: expense,
            amount: amount,
            date: new Date().toISOString(),
            month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };
        
        this.expenses.push(newExpense);
        this.saveToStorage();
        this.updateDisplay();
        
        expenseInput.value = '';
        amountInput.value = '';
        expenseInput.focus();
        
        this.showMessage(`Expense "${expense}" added successfully! 🎉`, 'success');
        this.addItemAnimation();
    }
    
    setBudget() {
        const budgetInput = document.getElementById('budget');
        const budget = parseFloat(budgetInput.value);
        
        if (!budget || budget <= 0) {
            this.showMessage('Please enter a valid budget amount! 💰', 'error');
            return;
        }
        
        this.currentBudget = budget;
        
        const budgetUpdate = {
            id: Date.now(),
            type: 'set',
            amount: budget,
            date: new Date().toISOString(),
            description: `Budget set to ₹${budget.toLocaleString()}`
        };
        
        this.budgetUpdates.push(budgetUpdate);
        this.saveToStorage();
        this.updateDisplay();
        
        budgetInput.value = '';
        this.showMessage(`Budget set to ₹${budget.toLocaleString()}! 🎯`, 'success');
    }
    
    increaseBudget() {
        const increaseInput = document.getElementById('increase-budget');
        const increase = parseFloat(increaseInput.value);
        
        if (!increase || increase <= 0) {
            this.showMessage('Please enter a valid increase amount! 📈', 'error');
            return;
        }
        
        if (this.currentBudget === 0) {
            this.showMessage('Please set a budget first! 🎯', 'error');
            return;
        }
        
        this.currentBudget += increase;
        
        const budgetUpdate = {
            id: Date.now(),
            type: 'increase',
            amount: increase,
            date: new Date().toISOString(),
            description: `Budget increased by ₹${increase.toLocaleString()}`
        };
        
        this.budgetUpdates.push(budgetUpdate);
        this.saveToStorage();
        this.updateDisplay();
        
        increaseInput.value = '';
        this.showMessage(`Budget increased by ₹${increase.toLocaleString()}! 💪`, 'success');
    }
    
    updateDisplay() {
        this.totalSpent = this.calculateTotalSpent();
        this.updateSummaryCards();
        this.updateExpenseList();
        this.updateBudgetList();
    }
    
    calculateTotalSpent() {
        return this.expenses.reduce((total, expense) => total + expense.amount, 0);
    }
    
    updateSummaryCards() {
        const totalElement = document.getElementById('total');
        const remainingElement = document.getElementById('remaining');
        
        const remaining = this.currentBudget - this.totalSpent;
        
        totalElement.textContent = `₹${this.totalSpent.toLocaleString()}`;
        remainingElement.textContent = `₹${remaining.toLocaleString()}`;
        
        const remainingCard = remainingElement.closest('.summary-card');
        if (remaining < 0) {
            remainingCard.style.borderLeftColor = 'var(--danger-color)';
            remainingElement.style.color = 'var(--danger-color)';
        } else if (remaining < this.currentBudget * 0.2) {
            remainingCard.style.borderLeftColor = 'var(--warning-color)';
            remainingElement.style.color = 'var(--warning-color)';
        } else {
            remainingCard.style.borderLeftColor = 'var(--success-color)';
            remainingElement.style.color = 'var(--success-color)';
        }
    }
    
    updateExpenseList() {
        const expenseList = document.getElementById('expense-list');
        
        if (this.expenses.length === 0) {
            expenseList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart fa-3x"></i>
                    <p>No expenses recorded yet! 🛒</p>
                    <small>Add your first expense above</small>
                </div>
            `;
            return;
        }
        
        const expensesByMonth = this.groupExpensesByMonth();
        
        let html = '';
        for (const [month, expenses] of Object.entries(expensesByMonth)) {
            const monthTotal = expenses.reduce((total, exp) => total + exp.amount, 0);
            
            html += `
                <div class="month-title">
                    <i class="fas fa-calendar-alt"></i> ${month}
                </div>
            `;
            
            expenses.forEach(expense => {
                const date = new Date(expense.date).toLocaleDateString();
                html += `
                    <div class="expense-item">
                        <span>💸 ${expense.name}</span>
                        <span>${date}</span>
                        <span>₹${expense.amount.toLocaleString()}</span>
                    </div>
                `;
            });
            
            html += `
                <div class="monthly-total">
                    <i class="fas fa-calculator"></i> Monthly Total: ₹${monthTotal.toLocaleString()}
                </div>
            `;
        }
        
        expenseList.innerHTML = html;
    }
    
    updateBudgetList() {
        const budgetList = document.getElementById('budget-updates');
        
        if (this.budgetUpdates.length === 0) {
            budgetList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line fa-3x"></i>
                    <p>No budget updates yet! 📈</p>
                    <small>Set your budget to get started</small>
                </div>
            `;
            return;
        }
        
        let html = '';
        const sortedUpdates = [...this.budgetUpdates].reverse();
        
        sortedUpdates.forEach(update => {
            const date = new Date(update.date).toLocaleDateString();
            const icon = update.type === 'set' ? '🎯' : '📈';
            
            html += `
                <div class="budget-item">
                    <span>${icon} ${update.description}</span>
                    <span>${date}</span>
                    <span>₹${update.amount.toLocaleString()}</span>
                </div>
            `;
        });
        
        const remaining = this.currentBudget - this.totalSpent;
        const status = remaining >= 0 ? 'Within Budget 😊' : 'Over Budget 😰';
        const statusColor = remaining >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        
        html += `
            <div class="budget-item" style="border-left-color: ${statusColor}; margin-top: 1rem;">
                <span>📊 Current Status: ${status}</span>
                <span>Total Budget: ₹${this.currentBudget.toLocaleString()}</span>
                <span style="color: ${statusColor}">₹${Math.abs(remaining).toLocaleString()}</span>
            </div>
        `;
        
        budgetList.innerHTML = html;
    }
    
    groupExpensesByMonth() {
        const grouped = {};
        
        this.expenses.forEach(expense => {
            const month = expense.month;
            if (!grouped[month]) {
                grouped[month] = [];
            }
            grouped[month].push(expense);
        });
        
        Object.keys(grouped).forEach(month => {
            grouped[month].sort((a, b) => new Date(b.date) - new Date(a.date));
        });
        
        return grouped;
    }
    
    downloadPDF() {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {

            this.showMessage('PDF library not loaded! Please refresh the page and try again. 😞', 'error');
            return;
        }
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFont('helvetica');
            
            doc.setFontSize(24);
            doc.setTextColor(40, 40, 40);
            doc.text('Budget Tracker Report', 105, 30, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });
            
            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text('Financial Summary', 20, 60);
            
            doc.setLineWidth(0.5);
            doc.line(20, 65, 190, 65);
            
            doc.setFontSize(12);
            doc.setTextColor(60, 60, 60);
            const summaryStartY = 80;
            
            doc.text(`Total Budget: ₹${this.currentBudget.toLocaleString()}`, 20, summaryStartY);
            doc.text(`Total Spent: ₹${this.totalSpent.toLocaleString()}`, 20, summaryStartY + 10);
            
            const remaining = this.currentBudget - this.totalSpent;
            const remainingText = remaining >= 0 ? 'Remaining' : 'Over Budget';
            doc.text(`${remainingText}: ₹${Math.abs(remaining).toLocaleString()}`, 20, summaryStartY + 20);
            
            const status = remaining >= 0 ? 'Within Budget ✓' : 'Over Budget ✗';
            doc.text(`Status: ${status}`, 20, summaryStartY + 30);
            
            if (this.expenses.length > 0) {
                doc.setFontSize(18);
                doc.setTextColor(40, 40, 40);
                doc.text('Expense Details', 20, summaryStartY + 50);
                
                doc.line(20, summaryStartY + 55, 190, summaryStartY + 55);
                
                let currentY = summaryStartY + 70;
                
                const expensesByMonth = this.groupExpensesByMonth();
                
                for (const [month, expenses] of Object.entries(expensesByMonth)) {
                    if (currentY > 250) {
                        doc.addPage();
                        currentY = 20;
                    }
                    
                    doc.setFontSize(14);
                    doc.setTextColor(40, 40, 40);
                    doc.text(month, 20, currentY);
                    currentY += 10;
                    
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);
                    
                    expenses.forEach(expense => {
                        if (currentY > 280) {
                            doc.addPage();
                            currentY = 20;
                        }
                        
                        const date = new Date(expense.date).toLocaleDateString();
                        const expenseText = `${expense.name}`;
                        const dateText = `${date}`;
                        const amountText = `₹${expense.amount.toLocaleString()}`;
                        
                        doc.text(expenseText, 25, currentY);
                        doc.text(dateText, 105, currentY);
                        doc.text(amountText, 150, currentY);
                        
                        currentY += 6;
                    });
                    
                    const monthTotal = expenses.reduce((total, exp) => total + exp.amount, 0);
                    doc.setFontSize(11);
                    doc.setTextColor(40, 40, 40);
                    doc.text(`Month Total: ₹${monthTotal.toLocaleString()}`, 25, currentY + 5);
                    currentY += 15;
                }
                
                if (this.budgetUpdates.length > 0 && currentY < 240) {
                    doc.setFontSize(18);
                    doc.setTextColor(40, 40, 40);
                    doc.text('Budget Updates', 20, currentY + 10);
                    
                    doc.line(20, currentY + 15, 190, currentY + 15);
                    
                    currentY += 25;
                    
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);
                    
                    this.budgetUpdates.forEach(update => {
    if (currentY > 280) {
        doc.addPage();
        currentY = 20;
    }

    const descriptionText = String(update.description || 'No description');
    const dateText = new Date(update.date).toLocaleDateString();

    doc.text(descriptionText, 25, currentY);
    doc.text(dateText, 150, currentY);
    currentY += 6;
});

                }
            }
            
            doc.save('budget-report.pdf');
            this.showMessage('PDF downloaded successfully! 📄', 'success');
            
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showMessage('Error generating PDF. Please try again. 😞', 'error');
        }
    }
    
    downloadExcel() {
        if (typeof XLSX === 'undefined') {
            this.showMessage('Excel library not loaded! Please refresh the page and try again. 😞', 'error');
            return;
        }
        
        try {
            const workbook = XLSX.utils.book_new();
            
            const summaryData = [
                ['Budget Tracker Summary'],
                [''],
                ['Total Budget', this.currentBudget],
                ['Total Spent', this.totalSpent],
                ['Remaining', this.currentBudget - this.totalSpent],
                ['Status', this.currentBudget - this.totalSpent >= 0 ? 'Within Budget' : 'Over Budget'],
                ['Generated On', new Date().toLocaleDateString()]
            ];
            
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
            
            if (this.expenses.length > 0) {
                const expenseData = [
                    ['Expense Name', 'Amount', 'Date', 'Month']
                ];
                
                this.expenses.forEach(expense => {
                    expenseData.push([
                        expense.name,
                        expense.amount,
                        new Date(expense.date).toLocaleDateString(),
                        expense.month
                    ]);
                });
                
                const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
                XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Expenses');
            }
            
            if (this.budgetUpdates.length > 0) {
                const budgetData = [
                    ['Description', 'Amount', 'Type', 'Date']
                ];
                
                this.budgetUpdates.forEach(update => {
                    budgetData.push([
                        update.description,
                        update.amount,
                        update.type,
                        new Date(update.date).toLocaleDateString()
                    ]);
                });
                
                const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
                XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget Updates');
            }
            
            XLSX.writeFile(workbook, 'budget-report.xlsx');
            this.showMessage('Excel file downloaded successfully! 📊', 'success');
            
        } catch (error) {
            console.error('Excel generation error:', error);
            this.showMessage('Error generating Excel file. Please try again. 😞', 'error');
        }
    }
    
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone! 🗑️')) {
            this.expenses = [];
            this.budgetUpdates = [];
            this.currentBudget = 0;
            this.totalSpent = 0;
            
            localStorage.removeItem('expenses');
            localStorage.removeItem('budgetUpdates');
            localStorage.removeItem('currentBudget');
            
            this.updateDisplay();
            this.showMessage('All data cleared successfully! 🧹', 'success');
        }
    }
    
    focusExpenseInput() {
        document.getElementById('expense').focus();
        document.getElementById('expense').scrollIntoView({ behavior: 'smooth' });
    }
    
    saveToStorage() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        localStorage.setItem('budgetUpdates', JSON.stringify(this.budgetUpdates));
        localStorage.setItem('currentBudget', this.currentBudget.toString());
    }
    
    showMessage(message, type) {
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, 3000);
    }
    
    addItemAnimation() {
        const items = document.querySelectorAll('.expense-item, .budget-item');
        if (items.length > 0) {
            const latestItem = items[items.length - 1];
            latestItem.style.animation = 'slideInRight 0.5s ease-out';
        }
    }
    
    addFabAnimation() {
        const fab = document.getElementById('fab');
        
        setInterval(() => {
            fab.style.animation = 'fabPulse 2s infinite';
        }, 5000);
        
        fab.addEventListener('click', () => {
            fab.style.animation = 'none';
            setTimeout(() => {
                fab.style.animation = 'fabPulse 2s infinite';
            }, 100);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BudgetTracker();
    
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    setTimeout(() => {
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'message success';
        welcomeMessage.textContent = 'Welcome to Budget Tracker! 🎉';
        document.body.appendChild(welcomeMessage);
        
        setTimeout(() => {
            welcomeMessage.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            welcomeMessage.classList.remove('show');
            setTimeout(() => {
                welcomeMessage.remove();
            }, 300);
        }, 2000);
    }, 1000);
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        document.getElementById('expense').focus();
    }
    
    if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        document.getElementById('budget').focus();
    }
    
    if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        document.getElementById('increase-budget').focus();
    }
});

document.documentElement.style.scrollBehavior = 'smooth';

window.addEventListener('load', () => {
    const jsPDFLoaded = typeof window.jsPDF !== 'undefined';
    const xlsxLoaded = typeof XLSX !== 'undefined';
    
    if (!jsPDFLoaded || !xlsxLoaded) {
        console.warn('Some libraries may not be loaded. PDF and Excel features might not work.');
        
        if (!jsPDFLoaded) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => console.log('jsPDF loaded successfully');
            script.onerror = () => console.error('Failed to load jsPDF');
            document.head.appendChild(script);
        }
        
        if (!xlsxLoaded) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => console.log('XLSX loaded successfully');
            script.onerror = () => console.error('Failed to load XLSX');
            document.head.appendChild(script);
        }
    }
});

window.addEventListener('resize', () => {
    const container = document.querySelector('.container');
    if (window.innerWidth <= 768) {
        container.style.gridTemplateColumns = '1fr';
    } else {
        container.style.gridTemplateColumns = '1fr 1fr';
    }
});

window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    console.log('Working offline');
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BudgetTracker;
}
