import { useState, useEffect } from "react";
import { Store } from "../backend/store.js";
import "./expression-block.css";

const ExpressionBlock = ({ block, embedded = false }) => {
    const [targetVariable, setTargetVariable] = useState(block.targetVariable || '');
    const [expression, setExpression] = useState(block.expression || '');
    const [error, setError] = useState('');
    const [renderTrigger, setRenderTrigger] = useState(0);

    const availableVariables = Object.keys(Store.variables || {}).map(name => ({
        name,
        display: `${name}`,
        value: Store.variables[name]
    }));

    const updateBlockInStore = (updates) => {
        const blockIndex = Store.blocks.findIndex(b => b.id === block.id);
        if (blockIndex !== -1) {
            Store.blocks[blockIndex] = {
                ...Store.blocks[blockIndex],
                ...updates
            };
            setRenderTrigger(prev => prev + 1);
        }
    };

    const handleTargetChange = (e) => {
        const newValue = e.target.value;
        setTargetVariable(newValue);
        updateBlockInStore({ targetVariable: newValue });
    };

    const handleExpressionChange = (e) => {
        const newValue = e.target.value;
        setExpression(newValue);
        updateBlockInStore({ expression: newValue });
        setError('');
    };

    const handleDrag = (e) => {
        if (embedded) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', block.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    useEffect(() => {
        const storeBlock = Store.blocks.find(b => b.id === block.id);
        if (storeBlock) {
            setTargetVariable(storeBlock.targetVariable || '');
            setExpression(storeBlock.expression || '');
        }
    }, [renderTrigger, block.id]);

    const attributes = embedded ? {
        className: "expression-block exp-block-embedded",
    } : {
        className: "expression-block exp-block-free",
        style: {
            left: block.x + 'px',
            top: block.y + 'px',
            border: error ? '2px solid #f44336' : '2px solid #ff9800'
        }
    };

    return (
        <div {...attributes} draggable={!embedded} onDragStart={handleDrag}>
            <div className="expression-block-head">Присваивание</div>

            <div className="expression-block-form">
                <div className="expression-block-select-body">
                    <select
                        value={targetVariable}
                        onChange={handleTargetChange}
                        className="expression-block-select"
                    >
                        <option value="">Выберите переменную</option>
                        {availableVariables.map(v => (
                            <option key={v.name} value={v.name}>
                                {v.display}
                            </option>
                        ))}
                    </select>
                </div>

                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>=</span>

                <div style={{ flex: '1', minWidth: '200px' }}>
                    <input
                        type="text"
                        value={expression}
                        onChange={handleExpressionChange}
                        placeholder=""
                        className="expression-block-input"
                        style={{border: `2px solid ${error ? '#f44336' : '#ff9800'}`}}
                    />
                </div>
            </div>

            {error && <div className="expression-block-error">{error}</div>}
        </div>
    );
};

export default ExpressionBlock;