
window.interpretator = {
    running:false,
    currentBlockId: null,

    run() {
        if (!window.store || !window.logInfo) {
            console.error('store или console не загружены');
            return;
        }

        this.running = true;
        logInfo('Запуск интерпретатора');

        const sortedBlocks = [...store.blocks].sort((a,b) => a.y - b.y);

        if (sortedBlocks.length > 0) {
            this.currentBlockId = sortedBlocks[0].id;
            this.executeBlock(this.currentBlockId);
        }
        else{
            logError('нет блоков для выполнения');
        }
    },

    executeBlock(blockId) {
        if (!this.running) return;

        const block = store.blocks.find(b => b.id === blockId);
        if (!block) {
            this.stop();
            return;
        }

        logInfo(`Выполнение блока ${block.id} (${block.type})`);

        let nextBlockId = null;
        const parentWhile = store.blocks.find(b =>
            b.type === 'while' &&
            b.bodyBlocks &&
            b.bodyBlocks.includes(block.id)
        );

        switch(block.type) {
            case 'declaration':
                nextBlockId =this.executeDeclaration(block);
                break;
            case 'plus':
                nextBlockId = this.executeOperation(block);
                break;
            case 'minus':
                nextBlockId = this.executeOperation(block);
                break;
            case 'while':
                nextBlockId = this.executeWhile(block);
                break;
            default:
                logError(`Неизветсный тип блока ${block.type}`);
        }


        if (parentWhile) {
            const bodyBlocks = parentWhile.bodyBlocks || [];
            const currentIndex = bodyBlocks.indexOf(block.id);

            if (currentIndex >= 0 && currentIndex < bodyBlocks.length - 1){
                nextBlockId = bodyBlocks[currentIndex + 1];
            }
            else{
                nextBlockId = parentWhile.id;
            }
        }

        if (window.renderApp) renderApp();

        setTimeout(() => {
            if (nextBlockId){
                this.executeBlock(nextBlockId);     
            }
            else {
                this.stop();
            }
        }, 800);
    },

    executeDeclaration(block) {
        if (!block.variables || block.variables.length === 0) {
            logError('Имя переменной не указано');
            return this.findNextBlock(block.id);
        }

        const varName = block.variables[0];
        store.variables[varName] = block.value || 0;
        logSuccess(`Объявлена переменная ${varName} = ${store.variables[varName]}`);

        return this.findNextBlock(block.id);
    },

    executeOperation(block) {

        const getActualValue = (val, isVar) => {
            if (!isVar) return Number(val) || 0;
            return store.variables[val] !== undefined ? store.variables[val] : 0;
        };

        const leftActual = getActualValue(block.leftValue, block.leftIsVar);
        const rightActual = getActualValue(block.rightValue, block.rightIsVar);
        let result, operation;

        switch(block.type) {
            case 'plus':
                result = leftActual + rightActual;
                operation = '+';
                break;
            case 'minus':
                result = leftActual - rightActual;
                operation = '-';
                break;
        }

        logInfo(`${leftActual} ${operation} ${rightActual} = ${result}`);


        if (!block.leftIsVar && block.leftValue) {
            const varName =block.leftValue;
            if (typeof varName === 'string' && varName.trim()) {
                store.variables[varName] = result;
                logSuccess(`Переменная ${varName} обновлена = ${result}`);
            }
        }
        else if (block.leftIsVar && block.leftValue) {
            const varName = block.leftValue;
            store.variables[varName] = result;
            logSuccess(`переменная ${varName} обновлена = ${result}`);
        }

        if (block.targetVar) {
            store.variables[block.targetVar] = result;
            logSuccess(`Результат сохранен в ${block.targetVar} = ${result}`);
        }

        return this.findNextBlock(block.id);
    },

    executeWhile(block) {
        const { varName, operator, value} = block.condition;

        if (!(varName in store.variables)) {
            logError(`Переменная ${varName} не объявлена`);
            return this.findNextBlock(block.id);
        }

        const varValue = store.variables[varName];
        const compareValue = Number(value) || 0;

        let condition = false;
        switch(operator) {
            case '>': 
                condition = varValue > compareValue;
                break;
            case '<':
                condition = varValue < compareValue;
                break;
            case '==':
                condition = varValue == compareValue;
                break;
            case '!=':
                condition = varValue != compareValue;
                break;
            case '>=':
                condition = varValue >= compareValue;
                break;
            case '<=':
                condition = varValue <= compareValue;
                break;
        }

        logInfo(`while: ${varName} (${varValue}) ${operator} ${compareValue} = ${condition}`);

        if (condition) {
            block.loopCount = (block.loopCount || 0) + 1;

            block.currentBodyIndex = 0;
            block.isLooping = true;

            if (block.bodyBlocks && block.bodyBlocks.length > 0) {
                return block.bodyBlocks[0];
            }
            else {
                return block.id;
            }
        }
        else {
            block.loopCount = 0;
            block.isLooping = false;
            block.currentBodyIndex = 0;
            return this.findNextBlock(block.id);
        }
    },

    findNextBlock(currentId) {
        const block = store.blocks.find(b => b.id === currentId);
        if (block && block.nextBlock) {
            return block.nextBlock;
        }

        const sortedBlocks = [...store.blocks].sort((a,b) => a.y - b.y);
        const currentIndex = sortedBlocks.findIndex(b => b.id === currentId);

        if (currentIndex < sortedBlocks.length - 1) {
            return sortedBlocks[currentIndex + 1].id;
        }
        return null;
    },

    stop() {
        this.running = false;
        this.currentBlockId = null;
        logInfo('Интерпретация завершена');
    },

    reset() {
        store.variables = {};
        store.blocks = [];
        store.nextId = 1;
        store.consoleLogs = [];

        this.running = false;
        this.currentBlockId = null;
        if (window.renderApp) renderApp();
    }
};

console.log('interpretator.js запущен');