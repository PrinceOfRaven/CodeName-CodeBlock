import { Store } from "../backend/store.js";

const Interpretator = {
    running: false,
    currentBlockId: null,
    Stack: [],

    run() {
        
        if (!Store) {
            console.error('store не загружен');
            return;
        }

        this.running = true;
        this.Stack = [];
        
        const logInfo = window.logInfo || console.log;
        logInfo('Запуск интерпретатора');

        const sortedBlocks = Store.blocks.filter(b => !b.parentId).sort((a, b) => a.y - b.y);

        if (sortedBlocks.length > 0) {
            this.currentBlockId = sortedBlocks[0].id;
            this.executeBlock(this.currentBlockId);
        } 
        else {
            const logError = window.logError || console.error;
            logError('Нет блоков для выполнения');
        }
    },

    executeBlock(blockId) {
        if (!this.running) return;

        const block = Store.blocks.find(b => b.id === blockId);
        if (!block) {
            console.log(`Блок ${blockId} не найден`);
            this.stop();
            return;
        }

        console.log(`Выполнение блока:`, { id: block.id, type: block.type });

        let nextBlockId = null;

        switch (block.type) {
            case 'declaration':
                nextBlockId = this.executeDeclaration(block);
                break;
            case 'expression':
                nextBlockId = this.executeExpression(block);
                break;
            case 'if':
                nextBlockId = this.executeIf(block);
                break;
            case 'while':
                nextBlockId = this.executeWhile(block);
                break;
            case 'array':
                nextBlockId = this.getNextBlockId(block.id);
                break;
            case 'array-assignment':
                nextBlockId = this.executeArrayAssignment(block);
                break;
        }
        
        if (window.renderApp) window.renderApp();
        window.dispatchEvent(new Event('store-changed'));

        if (nextBlockId) {
            setTimeout(() => this.executeBlock(nextBlockId), 500);
        } else {
            this.stop();
        }
    },

    executeDeclaration(block) {
        if (!block.variablesString) {
            window.logError('Имена переменных не указаны');
            return this.getNextBlockId(block.id);
        }

        const varNames = block.variablesString.split(',').map(v => v.trim()).filter(v => v.length > 0);

        varNames.forEach(varName => {
            Store.variables[varName] = 0;
            window.logSuccess(`Объявлена переменная: ${varName} = 0`);
        });

        return this.getNextBlockId(block.id);
    },

    executeExpression(block) {
        const { targetVariable, expression } = block;

        if (!targetVariable) {
            window.logError('Не выбрана переменная для присваивания');
            return this.getNextBlockId(block.id);
        }

        if (!expression || !expression.trim()) {
            window.logError('Не указано выражение');
            return this.getNextBlockId(block.id);
        }

        if (!(targetVariable in Store.variables)) {
            window.logError(`Переменная "${targetVariable}" не объявлена`);
            return this.getNextBlockId(block.id);
        }

        try {
            const tokens = this.tokenizeExpression(expression);
            const ast = this.parseTokens(tokens);
            const result = this.evaluateAST(ast);
            
            if (typeof result !== 'number' || isNaN(result)) {
                window.logError('Результат выражения должен быть числом');
                return this.getNextBlockId(block.id);
            }


            Store.variables[targetVariable] = result;
            
            block.result = result;
            block.executed = true;
            
            window.logSuccess(`${targetVariable} = ${result}`);
            
            return this.getNextBlockId(block.id);
            
        } 
        catch (err) {
            if (err.message.includes('Undefined symbol')) {
                const match = err.message.match(/Undefined symbol (\w+)/);
                const undefinedVar = match ? match[1] : 'неизвестная';
                window.logError(`Переменная "${undefinedVar}" не объявлена`);
            } 
            else {
                window.logError(`Ошибка в выражении: ${err.message}`);
            }
            return this.getNextBlockId(block.id);
        }
    },

    tokenizeExpression(expression) {
        const tokens = [];
        let i = 0;

        while (i < expression.length) {
            const char = expression[i];

            if (char === ' ') {
                i++;
                continue;
            }

            if (char >= '0' && char <= '9') {
                let numStr = '';
                while (i < expression.length && (expression[i] >= '0' && expression[i] <= '9')) {
                    numStr += expression[i];
                    i++;
                }
                tokens.push({type: 'intNum', value: parseInt(numStr)});
                continue;
            }

            if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) {
                let name = '';
                while (i < expression.length && 
                        ((expression[i] >= 'a' && expression[i] <= 'z') || 
                        (expression[i] >= 'A' && expression[i] <= 'Z') ||
                        (expression[i] >= '0' && expression[i] <= '9'))) {
                    name += expression[i];
                    i++;
                }

                if (i < expression.length && expression[i] === '[') {
                    tokens.push({type: 'array', name: name});
                    tokens.push({type: 'operator', op: '['});
                    i++; 
                } 
                else {
                    tokens.push({type: 'id', name: name});
                }
                continue;

            }
            
            switch (char) {
                case '+':
                    tokens.push({type: 'operator', op: '+'});
                    i++;
                    break;
                case '-':
                    tokens.push({type: 'operator', op: '-'});
                    i++;
                    break;
                case '*':
                    tokens.push({type: 'operator', op: '*'});
                    i++;
                    break;
                case '/':
                    tokens.push({type: 'operator', op: '/'});
                    i++;
                    break;
                case '%':
                    tokens.push({type: 'operator', op: '%'});
                    i++;
                    break;
                case '(':
                    tokens.push({type: 'lParen'});
                    i++;
                    break;
                case ')':
                    tokens.push({type: 'rParen'});
                    i++;
                    break;
                case ']':
                    tokens.push({type: 'operator', op: ']'});
                    i++;
                    continue;
            }
        }

        return tokens;
    },

    parseTokens(tokens) {
        let pos = 0;

        const peek = () => tokens[pos];
        const consume = () => tokens[pos++];

        const match = (type, op = null) => {
            const token = peek();
            if (!token) return false;
            if (token.type !== type) return false;
            if (op !== null && token.op !== op) return false;
            return true;
        };

        const parseExpression = () => {
            let node = parseTerm();
        
            while (match('operator', '+') || match('operator', '-')) {
                const op = consume().op;
                const right = parseTerm();
                node = {
                    type: 'binOp',
                    op: op,
                    left: node,
                    right: right
                };
            }
        
            return node;
        };

        const parseTerm = () => {
            let node = parseFactor();
            
            while (match('operator', '*') || match('operator', '/') || match('operator', '%')) {
                const op = consume().op;
                const right = parseFactor();
                node = {
                    type: 'binOp',
                    op: op,
                    left: node,
                    right: right
                };
            }
        
            return node;
        };

        const parseFactor = () => {
            let token = peek();

            if (token.type === 'intNum') {
                consume();
                return {type: 'number', value: token.value};
            }

            if (token.type === 'id') {
                consume();
                return {type: 'variable', name: token.name};
            }

            if (token.type === 'array') {
                const arrayName = token.name;
                consume(); 
            
                if (peek()?.type === 'operator' && peek()?.op === '[') {
                    consume();         
                    const indexExpr = parseExpression();
                    
                    if (peek()?.type === 'operator' && peek()?.op === ']') {
                        consume(); 
                        return {
                            type: 'arrayElement',
                            arrayName: arrayName,
                            index: indexExpr
                        };
                    }
                }
            }

            if (token.type === 'lParen') {
                consume();
                const node = parseExpression();

                consume();
                return node;
            }

            if (token.type === 'operator' && token.op === '-') {
                consume();
                return {type: 'unary-minus', op: '-', value: parseFactor()};
            }
        };

        const ast = parseExpression();

        return ast;
    },

    evaluateAST(node) {
        if (node.type === 'number') {
            return node.value;
        }

        if (node.type === 'variable') {
            return Store.variables[node.name];        
        }

        if (node.type === 'arrayElement') {
            const index = this.evaluateAST(node.index);
            const array = Store.arrayList[node.arrayName];

            return array[index];
        }

        if (node.type === 'unary-minus') {
            return -this.evaluateAST(node.value);
        }

        if (node.type === 'binOp') {
            const left = this.evaluateAST(node.left);
            const right = this.evaluateAST(node.right);

            switch(node.op) {
                case '+': return left+right;
                case '-': return left-right;
                case '*': return left*right;
                case '/': 
                    if (right !== 0) {
                        return left / right;
                    }
                    else {
                        window.logError('Хорошая попытка, но на 0 делить не стоит');
                        return NaN;
                    }
                case "%": 
                    if (right !== 0) {
                        return left % right;
                    }
                    else {
                        window.logError('Хорошая попытка, но брать остаток при делении на 0 не стоит');
                        return NaN;
                    }
            }
        }
    },

    executeIf(block) {
         const { conditionGroup, thenBlocksIds, hasElse, elseBlocksIds } = block;

        if (!conditionGroup || conditionGroup.length === 0) {
            window.logError('Нет условий в IF блоке');
            return this.getNextBlockId(block.id);
        }

        try {
            const condition = this.evaluateCondition(conditionGroup);
            window.logInfo(`Условие IF: ${condition ? 'ИСТИНА' : 'ЛОЖЬ'}`);

            let blockIdsToExecute = [];
            if (condition) {
                blockIdsToExecute = thenBlocksIds || [];
                window.logSuccess(`Выполняется THEN ветка (${blockIdsToExecute.length} блоков)`);
            }
            else if (hasElse) {
                blockIdsToExecute = elseBlocksIds || [];
                window.logSuccess(`Выполняется ELSE ветка (${blockIdsToExecute.length} блоков)`);
            } 
            else {
                window.logInfo('Нет блоков для выполнения');
                return this.getNextBlockId(block.id);
            }

            if (blockIdsToExecute.length === 0) {
                return this.getNextBlockId(block.id);
            }

            this.Stack.push({
                type: 'if',
                parentIfId: block.id,
                remainingBlockIds: blockIdsToExecute.slice(1),
                nextAfterIf: this.getNextBlockId(block.id)
            });

            return blockIdsToExecute[0];
            
        } 
        catch (err) {
            window.logError(`Ошибка в условии IF: ${err.message}`);
            return this.getNextBlockId(block.id);
        }
    },

    evaluateCondition(conditionGroup) {
        const cond = conditionGroup[0];
        
        const getValueFromExpr = (expr) => {
            if (expr.type === 'number') {
                return parseInt(expr.value, 10);
            } 
            else if (expr.type === 'variable') {
                return Store.variables[expr.value] || 0;
            }
            if (expr.type === 'array') {
                const [arrayName, rawIndex] = expr.value.split('|');
                
                let finalIndex;
          
                const tokens = this.tokenizeExpression(rawIndex);
                const ast = this.parseTokens(tokens);      
                finalIndex = this.evaluateAST(ast);

                if (Store.arrayList && Store.arrayList[arrayName]) {
                    const array = Store.arrayList[arrayName];
                    
                    if (finalIndex >= 0 && finalIndex < array.length) {
                        const value = array[finalIndex];
                        return value;
                    }
                    else {
                        window.logError(`Индекс ${finalIndex}  вне границ массива ${arrayName}`);
                        return 0;
                    }
                }

                return 0;
            }
            return 0;
        };

        try {
            const leftVal = getValueFromExpr(cond.leftExpr);
            const rightVal = getValueFromExpr(cond.rightExpr);
            
            console.log(`Сравнение: ${leftVal} ${cond.comparison} ${rightVal}`);
            
            switch(cond.comparison) {
                case '==': return leftVal == rightVal;
                case '!=': return leftVal != rightVal;
                case '>': return leftVal > rightVal;
                case '<': return leftVal < rightVal;
                case '>=': return leftVal >= rightVal;
                case '<=': return leftVal <= rightVal;
            }
        } catch (err) {
            window.logError(`Ошибка в условии: ${err.message}`);
            return false;
        }
    },

    executeArrayAssignment(block) {
        const { arrayName, indexExpr, valueExpr } = block;
        const array = Store.arrayList[arrayName];

        if (!array) {
            window.logError(`Массив "${arrayName}" не найден`);
            return this.getNextBlockId(block.id);
        }

        try {

            let index;
            if (typeof indexExpr === 'number') {
                index = indexExpr;
            } 
            else {
                const tokens = this.tokenizeExpression(indexExpr);
                const ast = this.parseTokens(tokens);
                index = this.evaluateAST(ast);
            }
            
            if (typeof index !== 'number' || isNaN(index)) {
                window.logError(`Индекс должен быть числом, получено: ${index}`);
                return this.getNextBlockId(block.id);
            }

            if (index < 0 || index >= array.length) {
                window.logError(`Индекс ${index} вне границ массива (0-${array.length - 1})`);
                return this.getNextBlockId(block.id);
            }

            let value;
            if (typeof valueExpr === 'number') {
                value = valueExpr;
            } 
            else {
                const tokens = this.tokenizeExpression(valueExpr);
                const ast = this.parseTokens(tokens);
                value = this.evaluateAST(ast);
            }
            
            if (typeof value !== 'number' || isNaN(value)) {
                window.logError(`Значение должно быть числом, получено: ${value}`);
                return this.getNextBlockId(block.id);
            }

            array[index] = value;
            
            Store.variables[`${arrayName}[${index}]`] = value;

            window.logSuccess(`${arrayName}[${index}] = ${value}`);

            return this.getNextBlockId(block.id);
            
        } catch (err) {
            window.logError(`Ошибка в операции с массивом: ${err.message}`);
            return this.getNextBlockId(block.id);
        }
    },

    executeWhile(block) {
        const { conditionGroup, bodyBlockIds } = block;

        if (!conditionGroup || conditionGroup.length === 0) {
            window.logError('Нет условий в WHILE блоке');
            return this.getNextBlockId(block.id);
        }

        try {
            const condition = this.evaluateCondition(conditionGroup);
            window.logInfo(`WHILE условие: ${condition ? 'ИСТИНА' : 'ЛОЖЬ'}`);

            if (condition) {
                if (bodyBlockIds && bodyBlockIds.length > 0) {
                    window.logSuccess(`Выполняется тело цикла (${bodyBlockIds.length} блоков)`);
                    
                    this.Stack.push({
                        type: 'while',
                        blockId: block.id,
                        remainingBlockIds: bodyBlockIds.slice(1)
                    });
                    
                    return bodyBlockIds[0];
                }
                else {
                    window.logInfo('Тело цикла пустое');
                    return block.id;
                }
            } 
            else {
                window.logInfo('Цикл завершен');
                return this.getNextBlockId(block.id);
            }
            
        } 
        catch (err) {
            window.logError(`Ошибка в условии WHILE: ${err.message}`);
            return this.getNextBlockId(block.id);
        }
    },

    getNextBlockId(currentId) {
        if (this.Stack.length > 0) {
            const currentContext = this.Stack[this.Stack.length - 1];
            
            if (currentContext.type === 'while') {
                if (currentContext.remainingBlockIds.length > 0) {
                    const nextId = currentContext.remainingBlockIds[0];
                    currentContext.remainingBlockIds = currentContext.remainingBlockIds.slice(1);
                    return nextId;
                } 
                else {
                    this.Stack.pop();
                    return currentContext.blockId;
                }
            }
            
            if (currentContext.type === 'if') {
                if (currentContext.remainingBlockIds.length > 0) {
                    const nextId = currentContext.remainingBlockIds[0];
                    currentContext.remainingBlockIds = currentContext.remainingBlockIds.slice(1);
                    return nextId;
                } 
                else {
                    const nextAfterIf = currentContext.nextAfterIf;
                    this.Stack.pop();
                    return nextAfterIf;
                }
            }
        }


        const rootBlocks = Store.blocks.filter(b => !b.parentId).sort((a, b) => a.y - b.y);
        const currentIndex = rootBlocks.findIndex(b => b.id === currentId);
        
        if (currentIndex < rootBlocks.length - 1) {
            return rootBlocks[currentIndex + 1].id;
        }
        
        return null; 
    },

    stop() {
        this.printAllVariables();
        
        this.running = false;
        this.currentBlockId = null;
        this.Stack = [];
        
        window.logInfo('Интерпретация завершена');
        
        if (window.renderApp) window.renderApp();
        window.dispatchEvent(new Event('store-changed'));
    },

    printAllVariables() {
        console.log('═══════════════════════════════');
        console.log('Состояние всех переменных:');
        console.log('═══════════════════════════════');
        
        const variables = Store.variables || {};
        const varNames = Object.keys(variables);
        
        if (varNames.length === 0) {
            console.log('Нет объявленных переменных');
        } 
        else {
            varNames.sort().forEach(name => {
                console.log(`${name} = ${variables[name]}`);
            });
            console.log(`   Всего переменных: ${varNames.length}`);
        }


        if (Store.arrayList) {
            const arrayNames = Object.keys(Store.arrayList);

            if (arrayNames.length > 0) {
                console.log('\nМассивы:');
                arrayNames.forEach(name => {
                    console.log(`${name} = [${Store.arrayList[name].join(', ')}]`);
                });
            }
        }
        
        console.log('═══════════════════════════════');
    },

    reset() {
        Store.variables = {};
        Store.blocks = [];
        Store.arrayList = {};
        
        
        this.running = false;
        this.currentBlockId = null;
        this.Stack = [];
        
        window.logInfo('Система полностью сброшена');
        
        if (window.renderApp) window.renderApp();
        window.dispatchEvent(new Event('store-changed'));
    }
};

export default Interpretator;