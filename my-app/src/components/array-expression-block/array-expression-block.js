import { useState, useEffect, useCallback } from "react";
import { Store } from "../backend/store.js";
import "./array-expression-block.css";

const ArrayExpressionBlock = ({ block, embedded = false, onDelete }) => {
    const [arrayName, setArrayName] = useState(block.arrayName || '');
    const [indexExpr, setIndexExpr] = useState(block.indexExpr || '');
    const [valueExpr, setValueExpr] = useState(block.valueExpr || '');
    const [error, setError] = useState('');


    const updateAvailableArrays = useCallback(() => {
        const arrays = Store.arrayList ? Object.keys(Store.arrayList).map(name => ({
            name,
            display: `${name} [${Store.arrayList[name].length}]`,
            array: Store.arrayList[name]
        })) : [];
        return arrays;
    }, []);

    const [availableArrays, setAvailableArrays] = useState(updateAvailableArrays());


    useEffect(() => {
        const handleStoreChange = () => {
            setAvailableArrays(updateAvailableArrays());
            

            const storeBlock = Store.blocks ? Store.blocks.find(b => b.id === block.id) : null;
            if (storeBlock) {
                setArrayName(storeBlock.arrayName || '');
                setIndexExpr(storeBlock.indexExpr || '');
                setValueExpr(storeBlock.valueExpr || '');
            }
        };

        window.addEventListener('store-changed', handleStoreChange);
        handleStoreChange();

        return () => {
            window.removeEventListener('store-changed', handleStoreChange);
        };
    }, [block.id, updateAvailableArrays]);


    const updateBlockInStore = useCallback((updates) => {
        const blockIndex = Store.blocks ? Store.blocks.findIndex(b => b.id === block.id) : -1;
        if (blockIndex !== -1) {
            Store.blocks[blockIndex] = {
                ...Store.blocks[blockIndex],
                ...updates
            };

            window.dispatchEvent(new Event('store-changed'));
        }
    }, [block.id]);

    const handleArrayChange = (e) => {
        const newValue = e.target.value;
        setArrayName(newValue);
        updateBlockInStore({ arrayName: newValue });
    };

    const handleIndexChange = (e) => {
        const newValue = e.target.value;
        setIndexExpr(newValue);
        updateBlockInStore({ indexExpr: newValue });
    };

    const handleValueChange = (e) => {
        const newValue = e.target.value;
        setValueExpr(newValue); 
        updateBlockInStore({ valueExpr: newValue });
    };

    const handleDrag = (e) => {
        if (embedded) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', block.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const attributes = embedded ? {
        className: "array-assignment-block embedded",
    } : {
        className: "array-assignment-block free",
        style: {
            left: block.x + 'px',
            top: block.y + 'px',
            border: error ? '2px solid #f44336' : '2px solid #9c27b0'
        }
    };

    return (
        <div {...attributes} draggable={!embedded} onDragStart={handleDrag}>
            <div className="array-assignment-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                    Присваивание элементу массива
                </span>
                {!embedded && (
                    <button 
                        className="block-delete-btn"
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
                            fontWeight: 'bold',
                            marginLeft: '8px'
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            <div className="array-assignment-form">
                <div className="form-row">
                    <select
                        value={arrayName}
                        onChange={handleArrayChange}
                        className="array-select"
                        style={{
                            border: error && !arrayName ? '2px solid #f44336' : '2px solid #9c27b0'
                        }}
                    >
                        <option value="">Выберите массив</option>
                        {availableArrays.map(arr => (
                            <option key={arr.name} value={arr.name}>
                                {arr.display}
                            </option>
                        ))}
                    </select>

                    <span className="bracket">[</span>

                    <div className="index-input-wrapper">
                        <input
                            type="text"
                            value={indexExpr}
                            onChange={handleIndexChange}
                            placeholder="индекс"
                            className="index-input"
                            style={{
                                border: error && error.includes('индекс') ? '2px solid #f44336' : '2px solid #9c27b0'
                            }}
                        />
                    </div>

                    <span className="bracket">]</span>
                    <span className="equals">=</span>

                    <div className="value-input-wrapper">
                        <input
                            type="text"
                            value={valueExpr}
                            onChange={handleValueChange}
                            placeholder="значение"
                            className="value-input"
                            style={{
                                border: error && error.includes('значение') ? '2px solid #f44336' : '2px solid #9c27b0'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArrayExpressionBlock;