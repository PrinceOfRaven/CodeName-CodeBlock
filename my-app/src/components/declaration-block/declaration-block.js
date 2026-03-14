import "./declaration-block.css";
import { Store } from "../backend/store.js";
import { useState } from "react";

const DeclarationBlock = ({ block, embedded = false, onUpdate, onDelete }) => {
    const [inputText, setInputText] = useState(block.variablesString || '');
    const [parsedVariables, setParsedVariables] = useState([]);
    const [error, setError] = useState('');
    const [renderTrigger, setRenderTrigger] = useState(0);

    const parseVar = (text) => {
        if (!text.trim()) return [];
        return text.split(',').map(v => v.trim()).filter(v => v.length > 0)
        .filter(v => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v));
    };

    const handleInputChange = (e) => {
        const text = e.target.value;
        setInputText(text);
        const vars = parseVar(text);
        setParsedVariables(vars);
        if (vars.length > 0 || !text.trim()) setError('');
    };

    const applyDeclaration = () => {
        const vars = parseVar(inputText);
        if (vars.length === 0) {
            setError('Укажите переменные');
            return;
        }
        const allParts = inputText.split(',').map(v => v.trim()).filter(v => v.length > 0);
        const invalidVars = allParts.filter(v => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v));
        if (invalidVars.length > 0) {
            setError(`Недопустимые имена: ${invalidVars.join(', ')}`);
            return;
        }


        vars.forEach(v => { Store.variables[v] = 0; });


        const updates = {
            variablesString: inputText
        };

        if (onUpdate) {
            onUpdate(block.id, updates);
        } 
        else {
            const blockIndex = Store.blocks.findIndex(b => b.id === block.id);
            if (blockIndex !== -1) {
                Store.blocks[blockIndex] = { ...Store.blocks[blockIndex], ...updates };
                setRenderTrigger(prev => prev + 1);
            }
        }
        setError('');
    };

    const handleBlur = () => {
        applyDeclaration();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            applyDeclaration();
        }
    };

    const handleDragStart = (e) => {
        if (embedded) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', block.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const attributes = embedded ? {
        className: "block declaration-block dec-block-embedded",
    } : {
        className: "block declaration-block dec-block-free",
        style: {
            left: block.x + 'px',
            top: block.y + 'px',
        }
    };

    return (
        <div
            {...attributes}
            draggable={!embedded}
            onDragStart={handleDragStart}
        >
            <div className="declaration-block-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="declaration-block-head">Переменные</div>
                {!embedded && (
                    <button
                        className="declaration-block-delete"
                        onClick={() => onDelete?.()}
                        style={{
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        ×
                    </button>
                )}
            </div>
            <input
                type="text"
                placeholder="x, y, count"
                value={inputText}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="declaration-block-input"
                style={{ border: error ? '1px solid #f44336' : '1px solid #4caf50' }}
            />
            {error && <div className="declaration-block-error">{error}</div>}
            {parsedVariables.length > 0 && !error && (
                <div className="declaration-block-var">
                    {parsedVariables.map(v => `${v}=0`).join(', ')}
                </div>
            )}
        </div>
    );
};

export default DeclarationBlock;