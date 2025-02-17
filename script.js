class Calculator {
    constructor() {
        this.currentInput = '';
        this.firstOperand = null;
        this.operation = null;
        this.ERROR_MESSAGE = "Error";
        this.MAX_DISPLAY_DIGITS = 10;
        this.INITIAL_DISPLAY = '0';
        this.history = [];
        this.undoStack = [];
        this.redoStack = [];
        this.ERROR_MESSAGES = {
            DIVIDE_BY_ZERO: "Cannot divide by zero",
            INVALID_INPUT: "Invalid input",
            OVERFLOW: "Number too large",
            UNDERFLOW: "Number too small"
        };
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
        
        if (this.operation && this.currentInput === '') {
            this.currentInput = number;
        } else {
            this.currentInput += number;
        }
        this.updateDisplay();
    }

    setOperation(op) {
        const validOperations = ['add', 'subtract', 'multiply', 'divide'];
        if (!validOperations.includes(op)) {
            return;
        }

        if (this.currentInput === '' && this.firstOperand !== null) {
            this.operation = op;
            return;
        }

        if (this.firstOperand === null) {
            this.firstOperand = parseFloat(this.currentInput);
        } else {
            this.calculateResult();
            this.firstOperand = parseFloat(this.currentInput);
        }
        this.operation = op;
        this.currentInput = '';
    }

    calculateResult() {
        const secondOperand = parseFloat(this.currentInput);
        if (this.operation && !isNaN(secondOperand)) {
            const firstOp = this.firstOperand;
            try {
                switch (this.operation) {
                    case 'add':
                        this.currentInput = (this.firstOperand + secondOperand).toString();
                        break;
                    case 'subtract':
                        this.currentInput = (this.firstOperand - secondOperand).toString();
                        break;
                    case 'multiply':
                        this.currentInput = (this.firstOperand * secondOperand).toString();
                        break;
                    case 'divide':
                        if (secondOperand === 0) {
                            this.setError('DIVIDE_BY_ZERO');
                            return;
                        }
                        this.currentInput = (this.firstOperand / secondOperand).toString();
                        break;
                }
                
                // Check for overflow/underflow
                if (Math.abs(parseFloat(this.currentInput)) > 1e308) {
                    this.setError('OVERFLOW');
                    return;
                }
                
                // Add calculation to history
                this.history.push({
                    firstOperand: firstOp,
                    secondOperand: secondOperand,
                    operation: this.operation,
                    result: this.currentInput
                });
                updateHistoryDisplay();
            } catch (error) {
                this.setError('INVALID_INPUT');
            }
            this.firstOperand = null;
            this.operation = null;
        }
        this.updateDisplay();
    }

    applyPercentage() {
        if (this.currentInput !== '') {
            this.currentInput = (parseFloat(this.currentInput) / 100).toString();
            this.updateDisplay();
        }
    }

    applySquareRoot() {
        if (this.currentInput !== '') {
            const number = parseFloat(this.currentInput);
            if (number < 0) {
                this.currentInput = this.ERROR_MESSAGE;
            } else {
                this.currentInput = Math.sqrt(number).toString();
            }
            this.updateDisplay();
        }
    }

    clearDisplay() {
        this.currentInput = '';
        this.firstOperand = null;
        this.operation = null;
        this.updateDisplay();
    }

    updateDisplay() {
        const display = document.getElementById('display');
        if (!display) {
            console.error('Display element not found!');
            return;
        }
        
        if (this.currentInput === this.ERROR_MESSAGE) {
            display.value = this.ERROR_MESSAGE;
        } else {
            const numberToDisplay = this.currentInput || this.INITIAL_DISPLAY;
            display.value = Number(numberToDisplay).toLocaleString('en-US', {
                maximumFractionDigits: this.MAX_DISPLAY_DIGITS,
                useGrouping: false
            });
        }
    }

    showHistory() {
        return this.history.map(entry => 
            `${entry.firstOperand} ${this.getOperationSymbol(entry.operation)} ${entry.secondOperand} = ${entry.result}`
        );
    }
    
    getOperationSymbol(op) {
        const symbols = {
            add: '+',
            subtract: '-',
            multiply: '×',
            divide: '÷'
        };
        return symbols[op] || op;
    }

    saveState() {
        this.undoStack.push({
            currentInput: this.currentInput,
            firstOperand: this.firstOperand,
            operation: this.operation
        });
        this.redoStack = []; // Clear redo stack on new action
    }
    
    undo() {
        if (this.undoStack.length > 0) {
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
    }
    
    redo() {
        if (this.redoStack.length > 0) {
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
    }

    setError(errorType) {
        this.currentInput = this.ERROR_MESSAGES[errorType] || this.ERROR_MESSAGE;
        this.updateDisplay();
    }

    clearHistory() {
        this.history = [];
        updateHistoryDisplay();
    }
}

// Create calculator instance
const calculator = new Calculator();

// Add keyboard support
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
    }
});

function updateHistoryDisplay() {
    const historyPanel = document.getElementById('history');
    const historyItems = calculator.showHistory().reverse().slice(0, 10);
    historyPanel.innerHTML = historyItems.map(item => 
        `<div class="history-item">${item}</div>`
    ).join('');
}
