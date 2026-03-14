import "./array-block.css";
import {Store} from "../backend/store.js";
import {useState, useEffect} from "react";

const ArrayBlock = ({block, embedded = false, onDelete}) => {
    const [arrayName, setArrayName] = useState(block.arrayName || '');
    const [arrayElements, setArrayElements] = useState(block.arrayElements || '');
    const [error, setError] = useState('');
    const [parsedElements, setParsedElements] = useState([]);

    const parseElements = (text) => {
        if (!text.trim()) return [];
        return text.split(',')
            .map(v => v.trim())
            .filter(v => v.length > 0)
            .filter(v => /^-?\d+$/.test(v))
            .map(v => parseInt(v, 10));
    };

    const validateArrayName = (name) => {
        if (!name.trim()) return false;
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    };

    const createArray = () => {
        
        if (!arrayName.trim() || !validateArrayName(arrayName)) {
            setError('Некорректное имя массива');
            return;
        }

        const elements = parseElements(arrayElements);
        if (elements.length === 0) {
            setError('Укажите элементы массива');
            return;
        }

        elements.forEach((value, index) => {
            const elementName = `${arrayName}[${index}]`;
            Store.variables[elementName] = value;
        });

        Store.arrayList[arrayName] = elements;

        const blockInd = Store.blocks.findIndex(b => b.id === block.id);
        if (blockInd !== -1) {
            Store.blocks[blockInd] = {
                ...Store.blocks[blockInd],
                arrayName: arrayName,
                arrayElements: arrayElements,
                arrayLength: elements.length
            };
        }

        window.dispatchEvent(new Event('store-changed'));
        setError('');
    };


    useEffect(() => {
        if (arrayName.trim() && validateArrayName(arrayName) && parsedElements.length > 0) {
       
            const timer = setTimeout(() => {
                createArray();
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [arrayName, parsedElements]); 

    const handleArrayNameChange = (e) => {
        const name = e.target.value;
        setArrayName(name);
        setError('');

        const blockInd = Store.blocks.findIndex(b => b.id === block.id);
        if (blockInd !== -1) {
            Store.blocks[blockInd] = {
                ...Store.blocks[blockInd],
                arrayName: name
            };
        }
    };

    const handleElementsChange = (e) => {
        const text = e.target.value;
        setArrayElements(text);

        const elements = parseElements(text);
        setParsedElements(elements);

        const blockInd = Store.blocks.findIndex(b => b.id === block.id);
        if (blockInd !== -1) {
            Store.blocks[blockInd] = {
                ...Store.blocks[blockInd],
                arrayElements: text
            };
        }

        if (elements.length > 0 || !text.trim()) {
            setError('');
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
        className: "block array-block array-block-embedded",
    } : {
        className: "block array-block array-block-free",
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
            <div className="array-block-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Массив</span>
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

            <input 
                type="text"
                placeholder="Название массива"
                value={arrayName}
                onChange={handleArrayNameChange}
                className="array-block-name-input"
                style={{width: '100%', padding: '8px', 
                    marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px'}}
            />

            <input
                type="text"
                placeholder="Элементы (через запятую)"
                value={arrayElements}
                onChange={handleElementsChange}
                className="array-block-input"
                style={{
                    border: error ? '2px solid #f44336' : '2px solid #4caf50',
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '10px'
                }}
            />
            
            {parsedElements.length > 0 && !error && (
                <div className="array-block-preview">
                    <div className="array-block-var">
                        {arrayName ? `${arrayName} = [ ` : '[ '}
                        {parsedElements.map((val, idx) => (
                            <span key={idx}>
                                {val}{idx < parsedElements.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                        <span> ]</span>
                    </div>
                    <div className="array-block-length">
                        Длина: {parsedElements.length}
                    </div>
                </div>
            )}   
        </div>
    );
};

export default ArrayBlock;