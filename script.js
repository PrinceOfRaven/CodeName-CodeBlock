"use strict";

const PanelBlock = () => {
    return (
        <div
            className="block"
            draggable={true}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', 'new-declaration');
                e.currentTarget.classList.add('dragging');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('dragging');
            }}
        >
            <input
                type="text"
                placeholder="имя"
                defaultValue=""
                style={{width: '60px'}}
            />
            <span>=</span>
            <input
                type="text"
                placeholder=""
                defaultValue="0"
                style={{width: '50px'}}
            />
        </div>
    );
};

const ValueInput = ({value, isVar, onValueChange,  onTypeChange}) => {
    return (
        <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            <select
                value={isVar ? 'var' : 'num'}
                onChange={(e) => onTypeChange(e.target.value === 'var')}
                style={{
                    padding: '4px',
                    borderRadius: '4px',
                    border: '1px solid #90caf9',
                    background:'white',
                    fontSize: '12px'
                }}
            >
                <option value="num">число</option>
                <option value="var">перем</option>
            </select>
            <input
                type="text"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder={isVar ? "имя" : " 0"}
                style={{
                    width: isVar ? '70px' : '50px',
                    padding: '6px',
                    border: '1px solid #90caf9',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}
            />
        </div>
    );
};

const PanelPlusBlock = () => {
    return (
        <div
            className="block plus-panel"
            draggable={true}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', 'new-plus');
                e.currentTarget.classList.add('dragging');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('dragging');
            }}
        >
            <span style={{ fontWeight: 'bold', color: '#4caf50',marginRight: '8px'}}>+</span>
            <span>Блок сложения</span>  
        </div>
    );
};

const PanelMinusBlock = () => {
    return(
        <div
            className="block minus-panel"
            draggable={true}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', 'new-minus');
                e.currentTarget.classList.add('gragging');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('dragging');
            }}
        >
            <span style={{ fontWeight: 'bold', color: '#f44336', marginRight: '8px'}}>-</span>
            <span>Блок вычитания</span>
        </div>
    );
};


const PanelWhileBlock = () => {
    return(
        <div
            className="block while-panel"
            draggable={true}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', 'new-while');
                e.currentTarget.classList.add('dragging');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('dragging');
            }}
        >
            <span style={{ fontWeight: 'bold', color: '#9c27b0', marginRight: '8px' }}>↺</span>
            <span>Блок цикла while</span>
        </div>
    );
};


const WhileBlock = ({block}) => {
    const [varName, setVarName] = React.useState(block.condition?.varName || '');
    const [operator, setOperator] = React.useState(block.condition?.operator || '>');
    const [value, setValue] = React.useState(block.condition?.value || 0);
    const [loopCount, setLoopCount] = React.useState(block.loopCount || 0);
    const [isOverBody, setIsOverBody] = React.useState(false);

    React.useEffect(() => {
        const storedBlock = store.blocks.find(b => b.id === block.id);
        if (storedBlock) {
            storedBlock.condition = { varName, operator, value};
            storedBlock.loopCount = loopCount;
        }
    }, [varName, operator, value, loopCount]);

    const handleBodyDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverBody(true);
    };

    const handleBodyDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverBody(false);
    };

    const handleBodyDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverBody(false);

        const data = e.dataTransfer.getData('text/plain');
        if (!data) return;

        const workspaceBlocks = document.getElementById('workspaceBlocks');
        const workspaceRect = workspaceBlocks.getBoundingClientRect();

        const relX = e.clientX - workspaceRect.left + workspaceBlocks.scrollLeft - block.x;
        const relY = e.clientY - workspaceRect.top + workspaceBlocks.scrollTop - block.y;

        let newBlock;
        if (data === 'new-declaration') {
            newBlock = {
                id: store.nextId++,
                type: 'declaration',
                x: relX,
                y: relY,
                variables: [],
                value: 0,
                parentWhile: block.id
            };
        }
        else if (data === 'new-plus') {
            newBlock ={
                id:store.nextId++,
                type: 'plus',
                x: relX,
                y: relY,
                leftValue: 0,
                leftIsVar: false,
                rightValue: 0,
                rightIsVar: false,
                parentWhile: block.id
            };
        }
        else if (data === 'new-minus') {
            newBlock = {
                id: store.nextId++,
                type: 'minus',
                x: relX,
                y: relY,
                leftValue: 0,
                leftIsVar: false,
                rightValue: 0,
                rightIsVar: false,
                parentWhile: block.id
            };
        }
        else{
            const existingBlockId = parseInt(data);
            const existingBlock = store.blocks.find(b => b.id  === existingBlockId);
            if (existingBlock) {
                store.blocks.forEach(b => {
                    if (b.bodyBlocks) {
                        b.bodyBlocks = b.bodyBlocks.filter(id => id !== existingBlockId);
                    }
                });

                existingBlock.x = relX;
                existingBlock.y = relY;
                existingBlock.parentWhile = block.id;

                if (!block.bodyBlocks) block.bodyBlocks = [];
                if (!block.bodyBlocks.includes(existingBlockId)) {
                    block.bodyBlocks.push(existingBlockId);
                }

                renderApp();
                return;
            }
        }

        if (newBlock) {
            store.blocks.push(newBlock);
            if (!block.bodyBlocks) block.bodyBlocks = [];
            block.bodyBlocks.push(newBlock.id);
            renderApp();
        }
    };

    return (
        <div
            id={`block-${block.id}`}
            className="block while-block"
            style={{
                position: 'absolute',
                left: block.x + 'px',
                top: block.y + 'px',
                background: '#f3e5f5',
                borderColor: '#9c27b0',
                padding: '15px',
                minWidth: '350px',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '10px',
                zIndex: 1000
            }}
            draggable={true}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', block.id);
                e.dataTransfer.effectAllowed = 'move';
                e.currentTarget.classList.add('dragging');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('dragging');
            }}
        >
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px'}}>
                <span style={{fontWeight: 'bold', color: '#9c27b0'}}>while</span>
                <span>(</span>
                <input
                    type="text"
                    value={varName}
                    onChange={(e) => setVarName(e.target.value)}
                    placeholder="перем"
                    style={{width: '60px', padding: '4px'}}
                />
                <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    style={{padding: '4px'}}
                >
                    <option value=">">{'>'}</option>
                    <option value="<">{'<'}</option>
                    <option value="==">{'=='}</option>
                    <option value="!=">{'!='}</option>
                    <option value=">=">{'>='}</option>
                    <option value="<=">{'<='}</option>
                </select>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0"
                    style={{ width: '50px', padding: '4px'}}
                />
                <span>)</span>
            </div>

            <div
                style={{
                    border: `2px ${isOverBody ? 'solid' : 'dashed'} #9c27b0`,
                    borderRadius: '8px',
                    padding: '15px',
                    margin: '5px 0',
                    background: isOverBody ? 'rgba(156,39,176,0.15)' : 'rgba(156,39,176,0.05)',
                    minHeight: '150px',
                    position: 'relative',
                    transition: 'all 0.2s',
                    cursor: 'copy'
                }} 
         
                onDragOver={handleBodyDragOver}
                onDragLeave={handleBodyDragLeave}
                onDrop={handleBodyDrop}
                
            >
                <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '10px',
                    background: '#f3e5f5',
                    padding: '0 5px',
                    fontSize: '12px',
                    color: '#9c27b0'
                }}>
                </div>

                {block.bodyBlocks && block.bodyBlocks.map(bodyBlockId => {
                    const bodyBlock = store.blocks.find(b => b.id === bodyBlockId);
                    if (!bodyBlock) return null;

                    const blockStyle = {
                        position: 'absolute',
                        left: (bodyBlock.x || 0) + 'px',
                        top: (bodyBlock.y || 0) + 'px',
                        zIndex: 1001
                    };

                    return (
                        <div key={bodyBlock.id} style={blockStyle}>
                            {bodyBlock.type === 'declaration' && <DeclarationBlock block={bodyBlock} />}
                            {bodyBlock.type === 'plus' && <PlusBlock block={bodyBlock} />}
                            {bodyBlock.type === 'minus' && <MinusBlock block={bodyBlock} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const DeclarationBlock = ({block}) => {
    const  handleDeclare = (e) => {
        e.stopPropagation();

        const blockDiv = e.currentTarget.closest('.block');
        const nameInput = blockDiv.querySelector('.varNameInput');
        const valueInput = blockDiv.querySelector('.varValueInput');

        const varName = nameInput.value.trim();
        const varValue = parseInt(valueInput.value) || 0;

        if (varName.length ===0) return;

        const storedBlock = store.blocks.find(b => b.id === block.id);
        if (storedBlock) {
            storedBlock.variables = [varName];
            storedBlock.value = varValue;
            store.variables[varName] = varValue;
            logSuccess(`Переменная ${varName} = ${varValue} объявлена`);

            renderApp();
        }
    };

    return (
        <div
            id={`block-${block.id}`}
            className="block declaration-block"
            style={{
                position: 'absolute',
                left: block.x + 'px',
                top: block.y + 'px'
            }}
            draggable={true}
            onDragStart ={(e) =>{
                e.dataTransfer.setData('text/plain', block.id.toString());
                e.dataTransfer.effectAllowed = 'move';
                e.currentTarget.classList.add('dragging');
            }}
            onDragEnd ={(e) => {
                e.currentTarget.classList.remove('dragging');
            }}
        >
            <input
                type="text"
                className="varNameInput"
                placeholder=""
                defaultValue={block.variables ? block.variables[0] : ''}
            />
            <span className="equals">=</span>
            <input
                type="text"
                className="varValueInput"
                placeholder="0"
                defaultValue={block.value !== undefined ? block.value : ''}
            />
            <button
                className="declareBtn"
                onClick={handleDeclare}
            >✓</button>
        </div>
    );
}


const PlusBlock = ({block}) => {
    const [leftValue, setLeftValue] = React.useState(block.leftValue || 0);
    const [leftIsVar, setLeftIsVar] = React.useState(block.leftIsVar || false);
    const [rightValue, setRightValue] = React.useState(block.rightValue || 0);
    const [rightIsVar, setRightIsVar] = React.useState(block.rightIsVar || false);

    const getActualValue = (val, isVar) => {
        if (!isVar) return Number(val) || 0;
        return store.variables[val] !== undefined ? store.variables[val] : 0;
    };

    React.useEffect(() => {
        const storedBlock = store.blocks.find(b => b.id === block.id);
        if (storedBlock) {
            storedBlock.leftValue = leftValue;
            storedBlock.leftIsVar = leftIsVar;
            storedBlock.rightValue = rightValue;
            storedBlock.rightIsVar = rightIsVar;
        }
    }, [leftValue, leftIsVar, rightValue, rightIsVar]);

    return (
        <div
            id={`block-${block.id}`}
            className="block operation-block plus-operation"
            style={{
                position: 'absolute',
                left: block.x + 'px',
                top: block.y + 'px',
                background: '#e8f5e9',
                borderColor: '#4caf50',
                padding: '12px',
                gap: '8px'
            }}
            draggable={true}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', block.id);
                e.dataTransfer.effectAllowed = 'move';
                e.currentTarget.classList.add('dragging');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('dragging');
            }}
        >
            <ValueInput
                value={leftValue}
                isVar={leftIsVar}
                onValueChange={setLeftValue}
                onTypeChange={setLeftIsVar}
            />
            
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50' }}>+</span>
            
            <ValueInput
                value={rightValue}
                isVar={rightIsVar}
                onValueChange={setRightValue}
                onTypeChange={setRightIsVar}
            />
        </div>
    );
};

const MinusBlock = ({block}) => {
    const [leftValue, setLeftValue] = React.useState(block.leftValue || 0);
    const [leftIsVar, setLeftIsVar] = React.useState(block.leftIsVar || false);
    const [rightValue, setRightValue] = React.useState(block.rightValue || 0);
    const [rightIsVar, setRightIsVar] = React.useState(block.rightIsVar || false);

    const getActualValue = (val, isVar) => {
        if (!isVar) return Number(val) || 0;
        return store.variables[val] !== undefined ? store.variables[val] : 0;
    };

    React.useEffect(() => {
        const storedBlock = store.blocks.find(b => b.id === block.id);
        if (storedBlock) {
            storedBlock.leftValue = leftValue;
            storedBlock.leftIsVar = leftIsVar;
            storedBlock.rightValue = rightValue;
            storedBlock.rightIsVar = rightIsVar;
        }
    }, [leftValue, leftIsVar, rightValue, rightIsVar]);

    return (
        <div
            id={`block-${block.id}`}
            className="block operation-block minus-operation"
            style={{
                position: 'absolute',
                left: block.x + 'px',
                top: block.y + 'px',
                background: '#ffebee',
                borderColor: '#f44336',
                padding: '12px',
                gap: '8px'
            }}
            draggable={true}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', block.id);
                e.dataTransfer.effectAllowed = 'move';
                e.currentTarget.classList.add('dragging');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('dragging');
            }}
        >
            <ValueInput
                value={leftValue}
                isVar={leftIsVar}
                onValueChange={setLeftValue}
                onTypeChange={setLeftIsVar}
            />
            
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>-</span>
            
            <ValueInput
                value={rightValue}
                isVar={rightIsVar}
                onValueChange={setRightValue}
                onTypeChange={setRightIsVar}
            />
        </div>
    );
};



const Workspace = () => {
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();

        const data = e.dataTransfer.getData('text/plain');
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();

        const x = e.clientX - rect.left + container.scrollLeft - 100;
        const y = e.clientY - rect.top + container.scrollTop - 25;

        if (data === 'new-declaration') {
            const newBlock = {
                id: store.nextId++,
                type: 'declaration',
                x: Math.max(0, x),
                y: Math.max(0, y),
                variables: [],
                value: 0
            };
            store.blocks.push(newBlock);
            logInfo(`Добавлен блок объявления`);
            renderApp();
        } 
        else if (data === 'new-plus') {
            const newBlock = {
                id: store.nextId++,
                type: 'plus',
                x: Math.max(0, x),
                y: Math.max(0, y),
                leftValue: 0,
                leftIsVar: false,
                rightValue: 0,
                rightIsVar: false,
                result: 0
            };
            store.blocks.push(newBlock);
            logInfo(`Добавлен блок сложения`);
            renderApp();
        } 
        else if (data === 'new-minus') {
            const newBlock = {
                id: store.nextId++,
                type: 'minus',
                x: Math.max(0, x),
                y: Math.max(0, y),
                leftValue: 0,
                leftIsVar: false,
                rightValue: 0,
                rightIsVar: false,
                result: 0
            };
            store.blocks.push(newBlock);
            logInfo(`Добавлен блок вычитания`);
            renderApp();
        } 

        else if (data === 'new-while') {
            const newBlock = {
                id: store.nextId++,
                type: 'while',
                x: Math.max(0,x),
                y: Math.max(0,y),
                condition: {
                    varName: 'x',
                    operator: '>',
                    value: 0
                },
                bodyBlocks: [],
                loopCount: 0
            };
            store.blocks.push(newBlock);
            logInfo(`Добавлен блок цикла while`);
            renderApp();
        }
        else {
            const blockId = parseInt(data);
            const block = store.blocks.find(b => b.id === blockId);
            if (block) {
                if (block.parentWhile){
                    const oldParent = store.blocks.find(b => b.id === block.parentWhile);
                    if (oldParent && oldParent.bodyBlocks) {
                        oldParent.bodyBlocks = oldParent.bodyBlocks.filter(id => id !== blockId);
                    }
                    delete block.parentWhile;
                }

                block.x = Math.max(0, x);
                block.y = Math.max(0, y);
                renderApp();
            }
        }
    };

    const renderBlock = (block) => {
        if (block.parentWhile) return null;

        switch(block.type) {
            case 'declaration':
                return <DeclarationBlock key={block.id} block={block} />;
            case 'plus':
                return <PlusBlock key={block.id} block={block} />;
            case 'minus':
                return <MinusBlock key={block.id} block={block} />;
            case 'while':
                return <WhileBlock key = {block.id} block = {block} />;
            default:
                return null;
        }
    };

    return (
        <div className="workspace">
            <h2>Рабочая область</h2>
            <div className="workspace-content">
                <div
                    id="workspaceBlocks"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {store.blocks.map(block => renderBlock(block))}
                </div>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <div className="app">
            <div className="panel">
                <h2>Блоки</h2>
                <h3>Переменные:</h3>
                <PanelBlock />
                <h3>Операции:</h3>
                <PanelPlusBlock />
                <PanelMinusBlock />
                <h3>Циклы:</h3>
                <PanelWhileBlock />

                <button onClick={() => interpretator.run()}>
                    ЗАПУСТИТЬ
                </button>
                <button onClick={() => interpretator.reset()}>
                    СБРОС
                </button>
            </div>
            
            <div className="right-container">
                <Workspace />
                {ConsolePanel()}
            </div>
        </div>
    );
};

const rootElement = document.getElementById('root');
const root =ReactDOM.createRoot(rootElement);
const renderApp = () => {
    root.render(<App />);
}

renderApp();