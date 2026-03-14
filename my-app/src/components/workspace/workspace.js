import "./workspace.css";
import { useState } from "react";
import DeclarationBlock from "../declaration-block/declaration-block";
import ExpressionBlock from "../expresion-block/expression-block";
import WhileBlock from "../while-block/while-block.js";
import IfBlock from "../if-block/if-block";
import ArrayBlock from "../array-block/array-block.js";
import { Store } from "../backend/store.js"; 
import ArrayExpressionBlock from "../array-expression-block/array-expression-block.js";


const Workspace = () => {
    const [renderTrigger, setRenderTrigger] = useState(0);


    const handleDeleteBlock = (blockId) => {
        const collectIds = (id, ids = []) => {
            const block = Store.blocks.find(b => b.id === id);
            if (!block) return ids;
            ids.push(id);

            if (block.type === 'if') {
                (block.thenBlocks || []).forEach(b => collectIds(b.id, ids));
                (block.elseBlocks || []).forEach(b => collectIds(b.id, ids));
            } 
            else if (block.type === 'while') {
                (block.bodyBlocks || []).forEach(b => collectIds(b.id, ids));
            }
            return ids;
        };

        const idsToDelete = collectIds(blockId);
        Store.blocks = Store.blocks.filter(b => !idsToDelete.includes(b.id));
        setRenderTrigger(prev => prev + 1);
    };

    const createBlock = (type, x, y) => {
        const newBlock = {
            id: Store.nextId++,
            type: type,
            x: Math.max(0, x),
            y: Math.max(0, y),
            parentId: null
        };

        switch(type) {
            case 'declaration':
                newBlock.variablesString = '';
                break;
            case 'expression':
                newBlock.targetVariable = '';
                newBlock.expression = '';
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
                newBlock.hasElse = false;
                newBlock.elseBlockIds = [];
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
            case "array":
                newBlock.arrayName = '';
                newBlock.arrayElements = '';
                newBlock.arrayLength = 0;
                break;
            case 'array-assignment':
                newBlock.arrayName = '';
                newBlock.indexExpr = '';
                newBlock.valueExpr = '';
                break;
        }

        Store.blocks.push(newBlock);
        setRenderTrigger(prev => prev + 1);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - 100;
        const y = e.clientY - rect.top - 25;

        if (data.startsWith('new-')) {
            const type = data.replace('new-', '');
            createBlock(type, x, y);
        } 
        else {
            const blockId = parseInt(data);
            const blockIndex = Store.blocks.findIndex(b => b.id === blockId);
            if (blockIndex !== -1 && !Store.blocks[blockIndex].parentId) {
                Store.blocks[blockIndex].x = Math.max(0, x);
                Store.blocks[blockIndex].y = Math.max(0, y);
                setRenderTrigger(prev => prev + 1);
            }
        }
    };

    const FreeBlocks = Store.blocks.filter(b => !b.parentId);

    return (
        <div className="workspace">
            <h2>Рабочая область</h2>
            <div className="workspace-content">
                <div
                    id="workspaceBlocks"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {FreeBlocks.map(block => {
                        switch(block.type) {
                            case 'declaration':
                                return <DeclarationBlock key={block.id} block={block} onDelete={() => handleDeleteBlock(block.id)} />;
                            case 'expression':
                                return <ExpressionBlock key={block.id} block={block} onDelete={() => handleDeleteBlock(block.id)} />;
                            case 'if':
                                return <IfBlock key={block.id} block={block} level={0} onDelete={() => handleDeleteBlock(block.id)} />;
                            case 'while':
                                return <WhileBlock key={block.id} block={block} level={0} onDelete={() => handleDeleteBlock(block.id)} />;
                            case 'array-assignment':
                                return <ArrayExpressionBlock key={block.id} block={block} onDelete={() => handleDeleteBlock(block.id)}/>;
                            case "array":
                                return <ArrayBlock key={block.id} block={block} onDelete={() => handleDeleteBlock(block.id)} />;
                            default:
                                return null;
                        }
                    })}
                </div>
            </div>
        </div>
    );
};

export default Workspace;