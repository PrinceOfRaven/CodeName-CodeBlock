window.consoleLog = function(text, type = 'info') {
    if (!window.store) {
        console.error('store не найден');
        return;
    }

    store.consoleLogs.push({
        text: text,
        type:type,
        timestamp: new Date().toLocaleTimeString()
    });

    if (window.renderApp) {
        renderApp();
    }
};

window.logInfo = function(text) {
    consoleLog(`${text}`, 'info');
};

window.logSuccess = function(text) {
    consoleLog(`${text}`, 'success');
};

window.logError = function(text) {
    consoleLog(`${text}`, 'error');
};

window.clearConsole = function() {
    if (window.store){
        store.consoleLogs = [];
        if (window.renderApp) renderApp();
    }
};


window.ConsolePanel = function() {
    if (!window.store) return React.createElement('div', null, 'Ошибка: store не найден');

    const logElements = [];
    for (let i = 0;i < store.consoleLogs.length;i++) {
        const log = store.consoleLogs[i];
        let color = '#333';
        if (log.type === 'error') color = '#f11212';
        if (log.type === 'success') color ='#4caf50';
        if (log.type === 'info') color = '#2196f3';

        logElements.push(
            React.createElement('div', {
                key: i,
                style: {
                    padding: '4px 8px',
                    borderBottom: '1px solid #333',
                    fontFamily: 'monospace',
                    fontSize:'13px',
                    color: color,
                    backgroundColor: '#1e1e1e'
                }
            }, `[${log.timestamp}] ${log.text}`)
        );
    }

    return React.createElement('div',
        {
            style: {
                background: '#1e1e1e',
                color: '#fff',
                borderRadius: '8px',
                marginTop: '20px',
                overflow: 'hidden',
                border: '1px solid #333'
            }
        },
        [
            React.createElement('div',{
                key: 'header',
                style: {
                    background: '#2d2d2d',
                    padding: '8px 12px',
                    borderBottom: '1px solid #444',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            }, [
                React.createElement('span', {key: 'title'}, 'Консоль вывода'),
                React.createElement('button', {
                    key: 'clear',
                    onClick: clearConsole,
                    style: {
                        background: 'none',
                        border: '1px solid #666',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }
                }, 'Очистить')
            ]),

            React.createElement('div', {
                key: 'logs',
                style: {
                    height: '150px',
                    overflowY: 'auto',
                    background: '#1e1e1e',
                    padding: '5px 0'
                }
            }, logElements.length > 0 ? logElements :
            React.createElement('div', {
                style: {
                    padding: '10px',
                    color: '#666',
                    fontStyle: 'italic',
                    textAlign: 'center'
                }
            }, 'Нет сообщений')

            )
        ]
    );
};


console.log('console.js загружен');