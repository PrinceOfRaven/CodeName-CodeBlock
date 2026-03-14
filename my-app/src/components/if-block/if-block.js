import { useState, useEffect } from "react";
import { Store } from "../backend/store.js";
import ExpressionBlock from "../expresion-block/expression-block.js";
import DeclarationBlock from "../declaration-block/declaration-block.js";
import ArrayBlock from "../array-block/array-block.js"; 
import ArrayExpressionBlock from "../array-expression-block/array-expression-block.js"; 
import WhileBlock from "../while-block/while-block.js";
import { ConditionGroup } from "./condition-group.js";
import "./if-block.css";

const IfBlock = ({ 
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
    const conditionGroup = currentBlock.conditionGroup || [];
    const thenBlocksIds = currentBlock.thenBlocksIds || [];
    const hasElse = currentBlock.hasElse || false;
    const elseBlocksIds = currentBlock.elseBlocksIds || [];
    const activeBranch = currentBlock.activeBranch || 'none';

    const handleUpdateBlock = (updates) => {
        if (onUpdate) {
            onUpdate(block.id, updates);
        } 
        else {
            const blockIndex = Store.blocks.findIndex(b => b.id === block.id);
            if (blockIndex !== -1) {
                Store.blocks[blockIndex] = {
                    ...Store.blocks[blockIndex],
                    ...updates
                };
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

    useEffect(() => {
        let newActiveBranch = 'none';
        if (conditionGroup.length > 0) {
            newActiveBranch = 'if';
        } 
        else if (hasElse) {
            newActiveBranch = 'else';
        }

        if (newActiveBranch !== activeBranch) {
            handleUpdateBlock({ activeBranch: newActiveBranch });
        }
    }, [conditionGroup, hasElse, activeBranch]);


    const createNestedBlock = (type) => {
        const newBlock = {
            id: Date.now() + Math.random(),
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
                newBlock.thenBlocksIds = [];
                newBlock.hasElse = false;
                newBlock.elseBlocksIds = [];
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

    const addBlockInBranch = (type, branchIdentifier) => {

        const newBlock = createNestedBlock(type);

        Store.blocks.push(newBlock);

        if (branchIdentifier === 'if') {
            handleUpdateBlock({ thenBlocksIds: [...thenBlocksIds, newBlock.id] });
        } 
        else if (branchIdentifier === 'else') {
            handleUpdateBlock({ elseBlocksIds: [...elseBlocksIds, newBlock.id] });
        }
    };

    const deleteBlockFromBranch = (blockId, branchIdentifier) => {
        Store.blocks = Store.blocks.filter(b => b.id !== blockId);

        if (branchIdentifier === 'if') {
            handleUpdateBlock({ thenBlocksIds: thenBlocksIds.filter(id => id !== blockId) });
        } 
        else if (branchIdentifier === 'else') {
            handleUpdateBlock({ elseBlocksIds: elseBlocksIds.filter(id => id !== blockId) });
        } 
    };

    const updateNestedBlock = (blockId, updatedData) => {

        const blockIndex = Store.blocks.findIndex(b => b.id === blockId);
        if (blockIndex !== -1) {
            Store.blocks[blockIndex] = { ...Store.blocks[blockIndex], ...updatedData};
        }

        setRenderTrigger(prev => prev + 1);
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

    const handleThenDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const data = e.dataTransfer.getData('text/plain');
        if (data === 'new-declaration') addBlockInBranch('declaration', 'if');
        else if (data === 'new-expression') addBlockInBranch('expression', 'if');
        else if (data === 'new-if') addBlockInBranch('if', 'if');
        else if (data === 'new-while') addBlockInBranch('while', 'if');
        else if (data === 'new-array') addBlockInBranch('array', 'if');
        else if (data === 'new-array-assignment') addBlockInBranch('array-assignment', 'if');
    };

    const handleElseDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const data = e.dataTransfer.getData('text/plain');
        if (data === 'new-declaration') addBlockInBranch('declaration', 'else');
        else if (data === 'new-expression') addBlockInBranch('expression', 'else');
        else if (data === 'new-if') addBlockInBranch('if', 'else');
        else if (data === 'new-while') addBlockInBranch('while', 'else');
        else if (data === 'new-array') addBlockInBranch('array', 'else');
        else if (data === 'new-array-assignment') addBlockInBranch('array-assignment', 'else');
    };

    const getBorderColor = (level) => {
        const colors = ['#03a9f4', '#ff9800', '#9c27b0', '#4caf50', '#ff5722'];
        return colors[level % colors.length];
    };

    const renderNestedBlock = (nestedBlock, branchType, index, branchId = null) => {
        return (
            <div key={nestedBlock.id} className="nested-block">
                <div className="nested-header">
                    <span className={`nested-step ${branchType}`}>
                        {branchType === 'if' ? 'THEN' : branchType === 'else' ? 'ELSE' : `ELSE-IF ${index+1}`} шаг {index + 1}
                    </span>
                    <button
                        className="nested-remove"
                        onClick={() => deleteBlockFromBranch(nestedBlock.id, branchType)}
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
                {nestedBlock.type === 'array' && (
                    <ArrayBlock
                        block={nestedBlock}
                        embedded={true}
                        onUpdate={updateNestedBlock}
                        onDelete={() => deleteBlockFromBranch(nestedBlock.id, branchId )}
                    />
                )}
                {nestedBlock.type === 'array-assignment' && (
                    <ArrayExpressionBlock
                        block={nestedBlock}
                        embedded={true}
                        onUpdate={updateNestedBlock}
                        onDelete={() => deleteBlockFromBranch(nestedBlock.id, branchId )}
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
            </div>
        );
    };

    return (
        <div
            id={`block-${block.id}`}
            className={`block if-block level-${level % 5} ${embedded ? 'embedded' : ''}
                ${activeBranch !== 'none' ? 'active' : 'inactive'}`}
            style={!embedded ? {
                left: block.x + 'px',
                top: block.y + 'px'
            } : {}}
            draggable={!embedded}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            

            <div className="if-header">
                <div className={`if-header-title level-${level % 5}`}>
                    IF-ELSE {level > 0 && `(ур.${level})`}
                    <span className={`if-status ${activeBranch}`}>
                        {activeBranch === 'if' && 'IF'}
                        {activeBranch === 'else' && 'ELSE'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {!embedded && (
                        <button
                            className="if-delete-btn"
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
                                fontWeight: 'bold',
                                marginLeft: 'auto'
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {(
                <>
                    <div className={`if-conditions level-${level % 5}`}>
                        <div className="if-conditions-title">УСЛОВИЯ IF:</div>
                        <ConditionGroup
                            conditions={conditionGroup}
                            onUpdate={(newGroup) => handleUpdateBlock({ conditionGroup: newGroup })}
                            onAdd={addNewCondition}
                            variables={variables || Store.variables}
                            borderColor={getBorderColor(level)}
                        />
                    </div>

                    <div className={`if-branch ${activeBranch === 'if' ? 'active' : 'inactive'}`}>
                        <div className="if-branch-header then">
                            <span>ТОГДА</span>
                            <span>(блоков: {thenBlocksIds.length})</span>
                        </div>
                        <div
                            className={`if-branch-content ${activeBranch === 'if' ? 'active-then' : 'inactive'}`}
                            onDragOver={handleDragOver}
                            onDrop={handleThenDrop}
                        >
                            {thenBlocksIds.map((blockId, index) => {
                                const nestedBlock = Store.blocks.find(b => b.id === blockId);
                                return nestedBlock ? renderNestedBlock(nestedBlock, 'if', index) : null;
                            })}
                        </div>
                    </div>

                    {hasElse && (
                        <div className={`if-branch ${activeBranch === 'else' ? 'active' : 'inactive'}`}>
                            <div className="if-branch-header else">
                                <span>ИНАЧЕ</span>
                                <span>(блоков: {elseBlocksIds.length})</span>
                            </div>
                            <div
                                className={`if-branch-content ${activeBranch === 'else' ? 'active-else' : 'inactive'}`}
                                onDragOver={handleDragOver}
                                onDrop={handleElseDrop}
                            >
                                {elseBlocksIds.map((blockId, index) => {
                                    const nestedBlock = Store.blocks.find(b => b.id === blockId);
                                    return nestedBlock ? renderNestedBlock(nestedBlock, 'else', index) : null;
                                })}
                            </div>
                        </div>
                    )}

                    <div className="if-btn-group">
                        {!hasElse && (
                            <button 
                                className="if-btn blue" 
                                onClick={() => handleUpdateBlock({ hasElse: true })}
                            >
                                + ELSE
                            </button>
                        )}
                    </div>
                </>
            )}

            {error && <div className="if-error">{error}</div>}
        </div>
    );
};

export default IfBlock;
