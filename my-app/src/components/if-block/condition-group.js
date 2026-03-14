import "./condition-group.css";
import {Store} from "../backend/store.js";

export const ConditionGroup = ({ conditions, onUpdate, onAdd, variables, borderColor = '#03a9f4' }) => {
    const comparisons = ['==', '!=', '>', '<', '>=', '<='];
    const logicalOps = ['&&', '||'];

    const updateCondition = (index, field, value) => {
        const updated = [...conditions];

        if (field === 'leftExpr' || field === 'rightExpr') {
            updated[index] = { 
                ...updated[index], 
                [field]: { ...updated[index][field], ...value } 
            };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        onUpdate(updated);
    };

    const removeCondition = (index) => {
        if (conditions.length > 1) {
            onUpdate(conditions.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="condition-group">
            {conditions.map((cond, index) => (
                <div key={cond.id || index} className="condition-row">
                    {index > 0 && (
                        <select
                            value={cond.logicalOp || '&&'}
                            onChange={(e) => updateCondition(index, 'logicalOp', e.target.value)}
                            className="logical-op-select"
                            style={{ borderColor }}
                        >
                            {logicalOps.map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                    )}

                    <ExpressionInput
                        expr={cond.leftExpr}
                        onChange={(updates) => updateCondition(index, 'leftExpr', updates)}
                        variables={variables}
                        borderColor={borderColor}
                    />

                    <select
                        value={cond.comparison}
                        onChange={(e) => updateCondition(index, 'comparison', e.target.value)}
                        className="comparison-select"
                        style={{ borderColor }}
                    >
                        {comparisons.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <ExpressionInput
                        expr={cond.rightExpr}
                        onChange={(updates) => updateCondition(index, 'rightExpr', updates)}
                        variables={variables}
                        borderColor={borderColor}
                    />

                    {conditions.length > 1 && (
                        <button onClick={() => removeCondition(index)} className="remove-condition-btn">×</button>
                    )}
                </div>
            ))}
            <button onClick={onAdd} className="add-condition-btn">+ Добавить условие</button>
        </div>
    );
};


const ExpressionInput = ({ expr, onChange, variables, borderColor }) => {
    const availableVariables = Object.keys(variables || {});
    const availableArrays = Store.arrayList ? Object.keys(Store.arrayList) : [];
    const [name, index] = expr.type === 'array' ? (expr.value || '').split('|') : ['', ''];
    const arrayName = name || '';
    const arrayIndex = index || '';

    const handleTypeChange = (e) => {
        const newType = e.target.value;

        onChange({ 
            type: newType, 
            value: newType === 'number' ? '0' : '' 
        });
    };

    return (
        <div className="expression-input" style={{ display: 'flex', gap: '5px' }}>
            <select
                value={expr.type || 'number'}
                onChange={handleTypeChange}
                className="type-select"
                style={{ borderColor }}
            >
                <option value="number">Число</option>
                <option value="variable">Переменная</option>
                <option value="array">Элемент массива</option>
            </select>

            {expr.type === 'number' && (
                <input
                    type="text"
                    value={expr.value}
                    onChange={(e) => onChange({ value: e.target.value })}
                    className="number-input"
                    style={{ borderColor }}
                    placeholder="0"
                />
            )}

            {expr.type === 'variable' && (
                <select
                    value={expr.value || ''}
                    onChange={(e) => onChange({ value: e.target.value })}
                    className="variable-select"
                    style={{ borderColor }}
                >
                    <option value="">Выберите переменную</option>
                    {availableVariables.map(varName => (
                        <option key={varName} value={varName}>
                            {varName} ({variables[varName]})
                        </option>
                    ))}
                </select>
            )}

            {expr.type === 'array' && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <select
                        value={arrayName}
                        onChange={(e) => {
                            const newName = e.target.value;
                            onChange({value: `${newName}|${arrayIndex || ''}`})
                        }}
                        className="array-select"
                        style={{ borderColor, padding: '4px' }}
                    >
                        <option value="">Массив</option>
                        {availableArrays.map(arrName => (<option key={arrName} value={arrName}>{arrName}</option>))}
                    </select>
                    <span>[</span>
                    <input
                        type="text"
                        value={arrayIndex}
                        onChange={(e) => onChange({ value: `${arrayName}|${e.target.value}` })}
                        placeholder="индекс"
                        style={{ width: '60px', border: `1px solid ${borderColor}`, borderRadius: '4px', padding: '4px' }}
                    />
                    <span>]</span>
                </div>
            )}
        </div>
    );
};