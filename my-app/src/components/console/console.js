import "./console.css";
import React from "react";
import {Store} from "../backend/store.js";

window.consoleLog = function(text, type = 'info') {
    if (!Store) {
        console.error('store не найден');
        return;
    }

    Store.consoleLogs.push({
        text: text,
        type: type,
        timestamp: new Date().toLocaleTimeString()
    });

    if (typeof window.renderApp === 'function') {
        window.renderApp();
    }
};

window.logInfo = function(text) {
    window.consoleLog(text, 'info');
};

window.logSuccess = function(text) {
    window.consoleLog(text, 'success');
};

window.logError = function(text) {
    window.consoleLog(text, 'error');
};

window.clearConsole = function() {
    if (Store){
        Store.consoleLogs = [];
        if (window.renderApp) window.renderApp();
    }
};

const ConsolePanelBlock = () => {
    if (!Store) return React.createElement('div', {className: 'console-error'}, 'Ошибка: store не найден');

    const logElements = [];
    for (let i = 0; i < Store.consoleLogs.length; i++) {
        const log = Store.consoleLogs[i];
        
        let typeClass = 'log-info';
        if (log.type === 'error') typeClass = 'log-error';
        if (log.type === 'success') typeClass = 'log-success';
        
        logElements.push(
            React.createElement('div', {
                key: i,
                className: `log-entry ${typeClass}`  
            }, `[${log.timestamp}] ${log.text}`)
        );
    }

    return React.createElement('div', { className: 'console-panel' },  
        [
            React.createElement('div', {
                key: 'header',
                className: 'console-header'  
            }, [
                React.createElement('span', { key: 'title' }, 'Консоль вывода'),
                React.createElement('button', {
                    key: 'clear',
                    onClick: window.clearConsole,
                    className: 'console-clear-btn'  
                }, 'Очистить')
            ]),

            React.createElement('div', {
                key: 'logs',
                className: 'console-logs'  
            }, logElements.length > 0 ? logElements :
                React.createElement('div', {className: 'console-empty'  }, 'Нет сообщений')
            )
        ]
    );
};

window.ConsolePanel = ConsolePanelBlock;

console.log('консоль загружена');