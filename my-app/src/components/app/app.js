import "./app.css"
import "../console/console.js";
import Workspace from "../workspace/workspace";
import PanelBlock from "../panel-block/panel-block";

import Interpretator from "../backend/interpretor.js"; 
import { useState, useEffect } from "react";


const App = () => {
    const [renderTrigger, setRenderTrigger] = useState(0);

    useEffect(() => {
        window.renderApp = () => {
            setRenderTrigger(prev => prev + 1);
        };
    }, []);

    const ConsoleComponent = window.ConsolePanel;

    const handleRun = () => {
        Interpretator.run();
    };

    const handleStop = () => {
        Interpretator.stop();
    };

    const handleReset = () => {
        Interpretator.reset();
    };
    const panels = [
        {id: 1, description: "Переменные", b_color: "#e3f2fd", border_c: "#2196f3", transfer: "new-declaration"},
        {id: 2, description: "Блок выражений", b_color: "#fff3e0", border_c: "#ff9800", transfer: "new-expression"},
        {id: 3, description: "Условие IF", b_color: "#e1f5fe", border_c: "#03a9f4", transfer: "new-if"},
        {id: 4, description: "Цикл while", b_color: "#f3e5f5", border_c: "#9c27b0", transfer: "new-while"},
        {id: 5, description: "Блок массива", b_color: "#fff3e0", border_c: "#ff9800", transfer: "new-array"},
        {id: 6, description: "Присвоить массиву", b_color: "#f3e5f5", border_c: "#9c27b0", transfer: "new-array-assignment"},
    ]

    const btns = [
        {id: 1, description: "Запустить", b_color: "#4caf50", btnFunc: handleRun},
        {id: 2, description: "Остановить", b_color: "#ff9800", btnFunc: handleStop},
        {id: 3, description: "Сбросить всё", b_color: "#f44336", btnFunc: handleReset},
    ]
    return (
        <div className="app">
            <div className="panel">
                <h1>Блоки</h1>
                {panels.map(item => (
                    <PanelBlock {...item}/>
                ))}
                
                <div className="app-btns">
                    {btns.map(({id, description, b_color, btnFunc}) => (
                        <button 
                            key={id}
                            onClick={btnFunc}
                            className="app-button"
                            style={{background: b_color}}
                        >
                            {description}
                        </button>
                    ))}
                </div>
            </div>

            <div className="right-container">
                <div className="workspace-container">
                    <Workspace />
                </div>
                
                <div className="console-wrapper">
                    {ConsoleComponent ? (
                        <ConsoleComponent />) : (
                        <div className="console-loading">Загрузка консоли...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;