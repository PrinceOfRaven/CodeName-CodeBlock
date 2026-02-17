
"use strict";

const store = {
    variables: {},
    blocks: [],
    nextId: 1,
    draggingBlock: null,
    dragOffset: {x: 0, y: 0}
};

const rootElement = document.getElementById('root');

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
                defaultValue="x"
                style={{ width: '60px' }}
            />
            <span>=</span>
            <input
                type="text"
                placeholder="0"
                defaultValue="0"
                style={{ width: '50px' }}
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
            <span style={{ fontWeight: 'bold', color: '#4caf50', marginRight: '8px' }}>+</span>
            <span>Блок сложения</span>
        </div>
    );
};

const PanelMinusBlock = () => {
    return (
        <div
            className="block minus-panel"
            draggable={true}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', 'new-minus');
                e.currentTarget.classList.add('dragging');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('dragging');
            }}
        >
            <span style={{ fontWeight: 'bold', color: '#f44336', marginRight: '8px' }}>-</span>
            <span>Блок вычитания</span>
        </div>
    );
};

const DeclarationBlock = ({block}) => {
    const handleDeclare = (e) => {
        e.stopPropagation();

        const blockDiv = e.currentTarget.closest('.block');
        const nameInput = blockDiv.querySelector('.varNameInput');
        const valueInput = blockDiv.querySelector('.varValueInput');
        
        const varName = nameInput.value.trim();
        const varValue = parseInt(valueInput.value) || 0;

        if (varName.length === 0) return;

        const storedBlock = store.blocks.find(b => b.id === block.id);
        if (storedBlock) {
            storedBlock.variables = [varName];
            storedBlock.value = varValue;
            store.variables[varName] = varValue;
            
            renderApp();
        }
    };

    return (
        <div
            className="block declaration-block"
            style={{
                position: 'absolute',
                left: block.x + 'px',
                top: block.y + 'px'
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
            <input
                type="text"
                className="varNameInput"
                placeholder="имя"
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
};

const PlusBlock = ({block}) => {
    const [leftValue, setLeftValue] = React.useState(block.leftValue || 0);
    const [rightValue, setRightValue] = React.useState(block.rightValue || 0);
    const [result, setResult] = React.useState(block.result || 0);

    React.useEffect(() => {
        const sum = (Number(leftValue) || 0) + (Number(rightValue) || 0);
        setResult(sum);
        
        const storedBlock = store.blocks.find(b => b.id === block.id);
        if (storedBlock) {
            storedBlock.leftValue = leftValue;
            storedBlock.rightValue = rightValue;
            storedBlock.result = sum;
        }
    }, [leftValue, rightValue]);

    return (
        <div
            className="block operation-block plus-operation"
            style={{
                position: 'absolute',
                left: block.x + 'px',
                top: block.y + 'px'
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
            {/* <span className="operation-symbol">+</span> */}
            <input
                type="number"
                className="operation-input left-input"
                value={leftValue}
                onChange={(e) => setLeftValue(e.target.value)}
                placeholder="0"
            />
            <span className="operation-operator">+</span>
            <input
                type="number"
                className="operation-input right-input"
                value={rightValue}
                onChange={(e) => setRightValue(e.target.value)}
                placeholder="0"
            />
            <span className="equals">=</span>
            <span className="operation-result">{result}</span>
        </div>
    );
};

const MinusBlock = ({block}) => {
    const [leftValue, setLeftValue] = React.useState(block.leftValue || 0);
    const [rightValue, setRightValue] = React.useState(block.rightValue || 0);
    const [result, setResult] = React.useState(block.result || 0);

    React.useEffect(() => {
        const difference = (Number(leftValue) || 0) - (Number(rightValue) || 0);
        setResult(difference);
        
        const storedBlock = store.blocks.find(b => b.id === block.id);
        if (storedBlock) {
            storedBlock.leftValue = leftValue;
            storedBlock.rightValue = rightValue;
            storedBlock.result = difference;
        }
    }, [leftValue, rightValue]);

    return (
        <div
            className="block operation-block minus-operation"
            style={{
                position: 'absolute',
                left: block.x + 'px',
                top: block.y + 'px'
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
            <input
                type="number"
                className="operation-input left-input"
                value={leftValue}
                onChange={(e) => setLeftValue(e.target.value)}
                placeholder="0"
            />
            <span className="operation-operator">-</span>
            <input
                type="number"
                className="operation-input right-input"
                value={rightValue}
                onChange={(e) => setRightValue(e.target.value)}
                placeholder="0"
            />
            <span className="equals">=</span>
            <span className="operation-result">{result}</span>
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
            renderApp();
        } else if (data === 'new-plus') {
            const newBlock = {
                id: store.nextId++,
                type: 'plus',
                x: Math.max(0, x),
                y: Math.max(0, y),
                leftValue: 0,
                rightValue: 0,
                result: 0
            };
            store.blocks.push(newBlock);
            renderApp();
        } else if (data === 'new-minus') {
            const newBlock = {
                id: store.nextId++,
                type: 'minus',
                x: Math.max(0, x),
                y: Math.max(0, y),
                leftValue: 0,
                rightValue: 0,
                result: 0
            };
            store.blocks.push(newBlock);
            renderApp();
        } else {
            const blockId = parseInt(data);
            const block = store.blocks.find(b => b.id === blockId);
            if (block) {
                block.x = Math.max(0, x);
                block.y = Math.max(0, y);
                renderApp();
            }
        }
    };

    const renderBlock = (block) => {
        switch(block.type) {
            case 'declaration':
                return <DeclarationBlock key={block.id} block={block} />;
            case 'plus':
                return <PlusBlock key={block.id} block={block} />;
            case 'minus':
                return <MinusBlock key={block.id} block={block} />;
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
        <div className="app" style={{ display: 'flex', gap: '20px' }}>
            <div className="panel" style={{ width: '250px' }}>
                <h2>Блоки</h2>
                <h3 style={{ marginBottom: '5px', color: '#666' }}>Переменные</h3>
                <PanelBlock />
                <h3 style={{ marginTop: '15px', marginBottom: '5px', color: '#666' }}>Операции</h3>
                <PanelPlusBlock />
                <PanelMinusBlock />
            </div>
            <Workspace />
        </div>
    );
};

const renderApp = () => {
    ReactDOM.render(
        <App />,
        rootElement
    );
};

renderApp();