import { useState, useEffect } from "react";
import { Store } from "../backend/store.js";
import DeclarationBlock from "../declaration-block/declaration-block";
import ExpressionBlock from "../expresion-block/expression-block";
import IfBlock from "../if-block/if-block";
import ArrayBlock from "../array-block/array-block"; 
import ArrayExpressionBlock from "../array-expression-block/array-expression-block"; 
import { ConditionGroup } from "../if-block/condition-group.js";
import "./while-block.css";

const WhileBlock = ({ 
    block, 
    level = 0, 
    embedded = false,
    onDelete,
    onUpdate,
    variables
}) => {
    const [error, setError] = useState('');
    const [renderTrigger, setRenderTrigger] = useState(0);

    const getBlockData = () => {
        if (onUpdate) return block;
        return Store.blocks.find(b => b.id === block.id) || block;
    };

    const currentBlock = getBlockData();
    const conditionGroup = currentBlock.conditionGroup || [{
        id: Date.now(),
        leftExpr: { type: 'variable', value: '' },
        rightExpr: { type: 'number', value: '0' },
        comparison: '>',
        logicalOp: '&&'
    }];
    const bodyBlockIds = currentBlock.bodyBlockIds || [];

    const handleUpdateBlock = (updates) => {
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
    };

    const addNewCondition = () => {
        const newCondition = {
            id: Date.now() + Math.random(),
            leftExpr: { type: 'number', value: '0' },
            rightExpr: { type: 'number', value: '0' },
            comparison: '==',
            logicalOp: '&&'
        };
        handleUpdateBlock({ conditionGroup: [...conditionGroup, newCondition] });
    };

    const createNestedBlock = (type) => {
        const newId = Date.now() + Math.random();
        const newBlock = {
            id: newId,
            type: type,
            parentId: block.id
        };
        switch(type) {
            case 'declaration':
                newBlock.variablesString = '';
                break;
            case 'expression':
                newBlock.targetVariable = '';
                newBlock.expression = '';
                newBlock.result = 0;
                break;
            case 'if':
                newBlock.conditionGroup = [{
                    id: Date.now(),
                    leftExpr: { type: 'number', value: '0' },
                    rightExpr: { type: 'number', value: '0' },
                    comparison: '==',
                    logicalOp: '&&'
                }];
                newBlock.thenBlockIds = [];
                newBlock.elseIfBranches = [];
                newBlock.hasElse = false;
                break;
            case 'while':
                newBlock.conditionGroup = [{
                    id: Date.now(),
                    leftExpr: { type: 'variable', value: '' },
                    rightExpr: { type: 'number', value: '0' },
                    comparison: '>',
                    logicalOp: '&&'
                }];
                newBlock.bodyBlockIds = [];
                break;
            case 'array':
                newBlock.arrayName = '';
                newBlock.arrayElements = '';
                break;
            case 'array-assignment':
                newBlock.arrayName = '';
                newBlock.indexExpr = '';
                newBlock.valueExpr = '';
                break;
        }
        return newBlock;
    };

    const addBodyBlock = (type) => {
        const newBlock = createNestedBlock(type);
        
        newBlock.x = (block.x || 0) + 20;
        newBlock.y = (block.y || 0) + 50;
        
        Store.blocks.push(newBlock);
        
        handleUpdateBlock({ bodyBlockIds: [...bodyBlockIds, newBlock.id] });
    };

    const deleteBodyBlock = (blockId) => {
        Store.blocks = Store.blocks.filter(b => b.id !== blockId);
        handleUpdateBlock({ bodyBlockIds: bodyBlockIds.filter(id => id !== blockId) });
    };

    const updateNestedBlock = (blockId, updatedData) => {
        const blockIndex = Store.blocks.findIndex(b => b.id === blockId);
        if (blockIndex !== -1) {
            Store.blocks[blockIndex] = { ...Store.blocks[blockIndex], ...updatedData };
            setRenderTrigger(prev => prev + 1);
        }
    };

    const handleDragStart = (e) => {
        if (embedded) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', block.id);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        if (!embedded) e.currentTarget.classList.remove('dragging');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleBodyDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (e._processed) return;
        e._processed = true;
        
        const data = e.dataTransfer.getData('text/plain');
        
        if (data.startsWith('new-')) {
            const type = data.replace('new-', '');
            addBodyBlock(type);
            return;
        }
        
        const draggedBlock = Store.blocks.find(b => b.id === data);
        if (!draggedBlock || draggedBlock.type === 'while') return; 
        
        const newBlock = { 
            ...draggedBlock, 
            id: Date.now() + Math.random(),
            parentId: block.id,
            isNested: true,
            x: (block.x || 0) + 20,
            y: (block.y || 0) + 50
        };
        
        Store.blocks.push(newBlock);
        handleUpdateBlock({ bodyBlockIds: [...bodyBlockIds, newBlock.id] });
    };

    const renderNestedBlock = (blockId, index) => {
        const nestedBlock = Store.blocks.find(b => b.id === blockId);
        if (!nestedBlock) return null;
        
        return (
            <div key={nestedBlock.id} className="nested-block">
                <div className="nested-header">
                    <span className="nested-step">шаг {index + 1}</span>
                    <button
                        className="nested-remove"
                        onClick={() => deleteBodyBlock(nestedBlock.id)}
                    >
                        ×
                    </button>
                </div>
                {nestedBlock.type === 'declaration' && (
                    <DeclarationBlock
                        block={nestedBlock}
                        onUpdate={updateNestedBlock}
                        embedded={true}
                    />
                )}
                {nestedBlock.type === 'expression' && (
                    <ExpressionBlock
                        block={nestedBlock}
                        onUpdate={updateNestedBlock}
                        variables={variables || Store.variables}
                        embedded={true}
                    />
                )}
                {nestedBlock.type === 'if' && (
                    <IfBlock
                        block={nestedBlock}
                        level={level + 1}
                        embedded={true}
                        onUpdate={updateNestedBlock}
                        onDelete={onDelete}
                        variables={variables || Store.variables}
                    />
                )}
                {nestedBlock.type === 'while' && (
                    <WhileBlock
                        block={nestedBlock}
                        level={level + 1}
                        embedded={true}
                        onUpdate={updateNestedBlock}
                        onDelete={onDelete}
                        variables={variables || Store.variables}
                    />
                )}
                {nestedBlock.type === 'array' && (
                    <ArrayBlock
                        block={nestedBlock}
                        embedded={true}
                        onUpdate={updateNestedBlock}
                        onDelete={() => deleteBodyBlock(nestedBlock.id)}
                    />
                )}
                {nestedBlock.type === 'array-assignment' && (
                    <ArrayExpressionBlock
                        block={nestedBlock}
                        embedded={true}
                        onUpdate={updateNestedBlock}
                        onDelete={() => deleteBodyBlock(nestedBlock.id)}
                    />
                )}
            </div>
        );
    };

    const getBorderColor = (level) => {
        const colors = ['#03a9f4', '#ff9800', '#9c27b0', '#4caf50', '#ff5722'];
        return colors[level % colors.length];
    };

    return (
        <div
            id={`block-${block.id}`}
            className={`block while-block level-${level % 5} ${embedded ? 'while-block-embedded' : 'while-block-free'}`}
            style={!embedded ? {
                left: block.x + 'px',
                top: block.y + 'px',
            } : {}}
            draggable={!embedded}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="while-block-header">
                <div className="while-block-title">
                    ЦИКЛ WHILE {level > 0 && `(ур.${level})`}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {!embedded && (
                        <button
                            className="while-block-delete-btn"
                            onClick={() => onDelete?.()}
                            style={{
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            <div className="while-block-condition">
                <span className="while-block-keyword">while</span>
                <ConditionGroup
                    conditions={conditionGroup}
                    onUpdate={(newGroup) => handleUpdateBlock({ conditionGroup: newGroup })}
                    onAdd={addNewCondition}
                    variables={variables || Store.variables}
                    borderColor={getBorderColor(level)}
                />
            </div>

            <div className="while-block-body">
                <div className="while-block-body-header">
                    ТЕЛО ЦИКЛА (блоков: {bodyBlockIds.length})
                </div>
                <div
                    className="while-block-body-content"
                    onDragOver={handleDragOver}
                    onDrop={handleBodyDrop}
                >
                    {bodyBlockIds.map((blockId, index) => renderNestedBlock(blockId, index))}
                </div>
            </div>

            {error && <div className="while-block-error">{error}</div>}
        </div>
    );
};

export default WhileBlock;