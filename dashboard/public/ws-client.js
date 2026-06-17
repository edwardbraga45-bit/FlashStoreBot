// WebSocket client helper for reconnect and event handling (global)
;(function () {
    const host = location.host || 'localhost:3000';
    const WS_URL = `ws://${host}`;
    let ws = null;
    let reconnectDelay = 1000;
    const maxDelay = 30000;

    function connectWS(onMessage) {
        try {
            ws = new WebSocket(WS_URL);
        } catch (err) {
            console.error('WS connect failed', err);
            scheduleReconnect(onMessage);
            return null;
        }

        ws.addEventListener('open', () => {
            console.log('WebSocket conectado');
            reconnectDelay = 1000;
        });

        ws.addEventListener('message', (evt) => {
            try {
                const payload = JSON.parse(evt.data);
                onMessage && onMessage(payload);
            } catch (err) {
                console.error('Erro ao parsear mensagem WS', err);
            }
        });

        ws.addEventListener('close', () => {
            console.warn('WebSocket desconectado. Tentando reconectar em', reconnectDelay);
            scheduleReconnect(onMessage);
        });

        ws.addEventListener('error', (err) => {
            console.error('WebSocket error', err);
            try { ws.close(); } catch (e) {}
        });

        return ws;
    }

    function scheduleReconnect(onMessage) {
        setTimeout(() => {
            reconnectDelay = Math.min(maxDelay, Math.floor(reconnectDelay * 1.5));
            connectWS(onMessage);
        }, reconnectDelay);
    }

    window.connectWS = connectWS;
})();
