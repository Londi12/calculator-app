class Calculator {
    /**
     * Creates a new Calculator instance
     * @constructor
     */
    constructor() {
        this.currentInput = '';
        this.firstOperand = null;
        this.operation = null;
        this.history = [];
        this.currentHistoryIndex = -1;
        this.undoStack = [];
        this.redoStack = [];
        
        // Load history from localStorage
        this.loadHistory();
        this.updateHistoryDisplay();
        
        this.ERROR_MESSAGE = "Error";
        this.MAX_DISPLAY_DIGITS = 10;
        this.INITIAL_DISPLAY = '0';
    }
    
    loadHistory() {
        const savedHistory = localStorage.getItem('calculatorHistory');
        if (savedHistory) {
            this.history = JSON.parse(savedHistory);
        }
    }

    saveHistory() {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
        this.updateHistoryDisplay();
    }

    addToHistory(calculation) {
        this.history.unshift(calculation);
        if (this.history.length > 10) {
            this.history.pop();
        }
        this.saveHistory();
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        this.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = item;
            historyItem.onclick = () => this.recallFromHistory(index);
            historyList.appendChild(historyItem);
        });
    }

    recallFromHistory(index) {
        const calculation = this.history[index];
        const [result] = calculation.split(' = ');
        this.currentInput = result;
        this.updateDisplay();
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('calculatorHistory');
        this.updateHistoryDisplay();
    }

    saveState() {
        this.undoStack.push({
            currentInput: this.currentInput,
            firstOperand: this.firstOperand,
            operation: this.operation
        });
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;
        
        const currentState = {
            currentInput: this.currentInput,
            firstOperand: this.firstOperand,
            operation: this.operation
        };
        
        this.redoStack.push(currentState);
        const previousState = this.undoStack.pop();
        
        Object.assign(this, previousState);
        this.updateDisplay();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        
        const currentState = {
            currentInput: this.currentInput,
            firstOperand: this.firstOperand,
            operation: this.operation
        };
        
        this.undoStack.push(currentState);
        const nextState = this.redoStack.pop();
        
        Object.assign(this, nextState);
        this.updateDisplay();
    }

    appendNumber(number) {
        if (typeof number !== 'string' || !/^[0-9.]$/.test(number)) {
            return;
        }
        
        if (this.currentInput === this.ERROR_MESSAGE) {
            this.currentInput = '';
        }
        
        if (number === '.' && this.currentInput.includes('.')) {
            return;
        }
        
        // Limit the number of digits
        if (number !== '.' && this.currentInput.replace('.', '').length >= this.MAX_DISPLAY_DIGITS) {
            return;
        }
        
        this.currentInput += number;
        this.updateDisplay();
    }

    setOperation(op) {
        if (this.currentInput === '') return;

        if (this.firstOperand === null) {
            this.firstOperand = parseFloat(this.currentInput);
        } else if (this.operation) {
            this.calculateResult();
            this.firstOperand = parseFloat(this.currentInput);
        }
        this.operation = op;
        this.currentInput = '';
        this.updateCalculationHistory();
    }

    calculateResult() {
        if (!this.operation || !this.firstOperand) return;

        const secondOperand = parseFloat(this.currentInput);
        const calculation = `${this.firstOperand} ${this.getOperationSymbol()} ${secondOperand}`;
        
        try {
            let result;
            switch (this.operation) {
                case 'add': result = this.firstOperand + secondOperand; break;
                case 'subtract': result = this.firstOperand - secondOperand; break;
                case 'multiply': result = this.firstOperand * secondOperand; break;
                case 'divide': 
                    if (secondOperand === 0) throw new Error('Division by zero');
                    result = this.firstOperand / secondOperand;
                    break;
            }

            // Format the result to avoid overly long numbers
            if (result.toString().length > this.MAX_DISPLAY_DIGITS) {
                result = parseFloat(result.toPrecision(this.MAX_DISPLAY_DIGITS));
            }

            this.currentInput = result.toString();
            this.addToHistory(`${calculation} = ${result}`);
            this.firstOperand = null;
            this.operation = null;
            this.saveState();
            this.updateDisplay();
        } catch (error) {
            this.currentInput = 'Error';
            this.updateDisplay();
        }
    }

    getOperationSymbol() {
        const symbols = {
            add: '+',
            subtract: '-',
            multiply: '×',
            divide: '÷'
        };
        return symbols[this.operation] || '';
    }

    backspace() {
        this.currentInput = this.currentInput.slice(0, -1);
        if (this.currentInput === '') {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }

    percentage() {
        if (this.currentInput === '') return;
        const value = parseFloat(this.currentInput);
        this.currentInput = (value / 100).toString();
        this.updateDisplay();
    }

    clearDisplay() {
        this.currentInput = '';
        this.firstOperand = null;
        this.operation = null;
        this.updateDisplay();
        this.updateCalculationHistory();
    }

    updateDisplay() {
        const display = document.getElementById('display');
        if (!display) return;
        
        display.value = this.currentInput === this.ERROR_MESSAGE ? 
            this.ERROR_MESSAGE : 
            this.currentInput || this.INITIAL_DISPLAY;
            
        // Update ARIA attributes for accessibility
        display.setAttribute('aria-label', `Calculator display showing ${display.value}`);
    }

    updateCalculationHistory() {
        const historyDisplay = document.getElementById('calculation-history');
        if (!historyDisplay) return;

        if (this.firstOperand !== null && this.operation) {
            historyDisplay.textContent = `${this.firstOperand} ${this.getOperationSymbol()}`;
        } else {
            historyDisplay.textContent = '';
        }
    }

    /**
     * Toggle between light and dark mode
     */
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('calculator-theme', 
            document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    }
}

const calculator = new Calculator();

// Initialize theme from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('calculator-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    // Set up accessibility attributes
    const buttons = document.querySelectorAll('.buttons button');
    buttons.forEach(button => {
        const text = button.textContent.trim();
        button.setAttribute('aria-label', text);
    });
});

document.addEventListener('keydown', (event) => {
    if (/[0-9.]/.test(event.key)) {
        calculator.appendNumber(event.key);
    } else if (event.key === '+') {
        calculator.setOperation('add');
    } else if (event.key === '-') {
        calculator.setOperation('subtract');
    } else if (event.key === '*') {
        calculator.setOperation('multiply');
    } else if (event.key === '/') {
        calculator.setOperation('divide');
    } else if (event.key === 'Enter' || event.key === '=') {
        calculator.calculateResult();
    } else if (event.key === 'Escape') {
        calculator.clearDisplay();
    } else if (event.key === 'Backspace') {
        calculator.backspace();
    }
});
