"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketClient = exports.parseRawWsMessage = void 0;
const events_1 = require("events");
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
const logger_1 = require("./logger");
const main_client_1 = require("./main-client");
const usdm_client_1 = require("./usdm-client");
const beautifier_1 = __importDefault(require("./util/beautifier"));
const requestUtils_1 = require("./util/requestUtils");
const ws_utils_1 = require("./util/ws-utils");
const WsStore_1 = __importStar(require("./util/WsStore"));
const coinm_client_1 = require("./coinm-client");
const wsBaseEndpoints = {
    spot: 'wss://stream.binance.com:9443',
    margin: 'wss://stream.binance.com:9443',
    isolatedMargin: 'wss://stream.binance.com:9443',
    usdm: 'wss://fstream.binance.com',
    usdmTestnet: 'wss://stream.binancefuture.com',
    coinm: 'wss://dstream.binance.com',
    coinmTestnet: 'wss://dstream.binancefuture.com',
    options: 'wss://vstream.binance.com',
    optionsTestnet: 'wss://testnetws.binanceops.com',
};
const loggerCategory = { category: 'binance-ws' };
function throwUnhandledSwitch(x, msg) {
    throw new Error(msg);
}
function parseEventTypeFromMessage(parsedMsg) {
    var _a;
    if (parsedMsg === null || parsedMsg === void 0 ? void 0 : parsedMsg.e) {
        return parsedMsg.e;
    }
    if (Array.isArray(parsedMsg) && parsedMsg.length) {
        return (_a = parsedMsg[0]) === null || _a === void 0 ? void 0 : _a.e;
    }
    return;
}
/**
 * Try to resolve event.data. Example circumstance: {"stream":"!forceOrder@arr","data":{"e":"forceOrder","E":1634653599186,"o":{"s":"IOTXUSDT","S":"SELL","o":"LIMIT","f":"IOC","q":"3661","p":"0.06606","ap":"0.06669","X":"FILLED","l":"962","z":"3661","T":1634653599180}}}
 */
function parseRawWsMessage(event) {
    if (typeof event === 'string') {
        const parsedEvent = JSON.parse(event);
        if (parsedEvent.data) {
            if (typeof parsedEvent.data === 'string') {
                return parseRawWsMessage(parsedEvent.data);
            }
            return parsedEvent.data;
        }
    }
    if (event === null || event === void 0 ? void 0 : event.data) {
        return JSON.parse(event.data);
    }
    return event;
}
exports.parseRawWsMessage = parseRawWsMessage;
class WebsocketClient extends events_1.EventEmitter {
    constructor(options, logger) {
        super();
        this.logger = logger || logger_1.DefaultLogger;
        this.wsStore = new WsStore_1.default(this.logger);
        this.beautifier = new beautifier_1.default();
        this.restClients = {};
        this.options = Object.assign({ pongTimeout: 7500, pingInterval: 10000, reconnectTimeout: 500 }, options);
        this.listenKeyStateStore = {};
        this.wsUrlKeyMap = {};
        // add default error handling so this doesn't crash node (if the user didn't set a handler)
        this.on('error', () => { });
    }
    getRestClientOptions() {
        return Object.assign(Object.assign(Object.assign({}, this.options), this.options.restOptions), { api_key: this.options.api_key, api_secret: this.options.api_secret });
    }
    connectToWsUrl(url, wsKey, forceNewConnection) {
        const wsRefKey = wsKey || url;
        const oldWs = this.wsStore.getWs(wsRefKey);
        if (oldWs && this.wsStore.isWsOpen(wsRefKey) && !forceNewConnection) {
            this.logger.silly(`connectToWsUrl(): Returning existing open WS connection`, Object.assign(Object.assign({}, loggerCategory), { wsRefKey }));
            return oldWs;
        }
        this.logger.silly(`connectToWsUrl(): Opening WS connection to URL: ${url}`, Object.assign(Object.assign({}, loggerCategory), { wsRefKey }));
        const ws = new isomorphic_ws_1.default(url);
        this.wsUrlKeyMap[url] = wsRefKey;
        if (typeof ws.on === 'function') {
            ws.on('ping', (event) => this.onWsPing(event, wsRefKey, ws, 'event'));
            ws.on('pong', (event) => this.onWsPong(event, wsRefKey, 'event'));
        }
        ws.onopen = (event) => this.onWsOpen(event, wsRefKey, url);
        ws.onerror = (event) => this.parseWsError('WS Error Event', event, wsRefKey, url);
        ws.onclose = (event) => this.onWsClose(event, wsRefKey, ws, url);
        ws.onmessage = (event) => this.onWsMessage(event, wsRefKey, 'function');
        // Not sure these work in the browser, the traditional event listeners are required for ping/pong frames in node
        ws.onping = (event) => this.onWsPing(event, wsRefKey, ws, 'function');
        ws.onpong = (event) => this.onWsPong(event, wsRefKey, 'function');
        // Add ws connection with key to store
        this.wsStore.setWs(wsRefKey, ws);
        return ws;
    }
    tryWsSend(wsKey, wsMessage) {
        try {
            this.logger.silly(`Sending upstream ws message: `, Object.assign(Object.assign({}, loggerCategory), { wsMessage,
                wsKey }));
            if (!wsKey) {
                throw new Error('No wsKey provided');
            }
            const ws = this.getWs(wsKey);
            if (!ws) {
                throw new Error(`No active websocket connection exists for wsKey: ${wsKey}`);
            }
            ws.send(wsMessage);
        }
        catch (e) {
            this.logger.error(`Failed to send WS message`, Object.assign(Object.assign({}, loggerCategory), { wsMessage,
                wsKey, exception: e }));
        }
    }
    tryWsPing(wsKey) {
        try {
            // this.logger.silly(`Sending upstream ping: `, { ...loggerCategory, wsKey });
            if (!wsKey) {
                throw new Error('No wsKey provided');
            }
            const ws = this.getWs(wsKey);
            if (!ws) {
                throw new Error(`No active websocket connection exists for wsKey: ${wsKey}`);
            }
            // Binance allows unsolicited pongs, so we send both (though we expect a pong in response to our ping if the connection is still alive)
            ws.ping();
            ws.pong();
        }
        catch (e) {
            this.logger.error(`Failed to send WS ping`, Object.assign(Object.assign({}, loggerCategory), { wsKey, exception: e }));
        }
    }
    onWsOpen(ws, wsKey, wsUrl) {
        this.logger.silly(`onWsOpen(): ${wsUrl} : ${wsKey}`);
        if (this.wsStore.isConnectionState(wsKey, WsStore_1.WsConnectionStateEnum.RECONNECTING)) {
            this.logger.info('Websocket reconnected', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
            this.emit('reconnected', { wsKey, ws });
        }
        else {
            this.logger.info('Websocket connected', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
            this.emit('open', { wsKey, ws });
        }
        this.setWsState(wsKey, WsStore_1.WsConnectionStateEnum.CONNECTED);
        const topics = [...this.wsStore.getTopics(wsKey)];
        if (topics.length) {
            this.requestSubscribeTopics(wsKey, topics);
        }
        if (!this.options.disableHeartbeat) {
            const wsState = this.wsStore.get(wsKey, true);
            if (wsState.activePingTimer) {
                clearInterval(wsState.activePingTimer);
            }
            wsState.activePingTimer = setInterval(() => this.sendPing(wsKey, wsUrl), this.options.pingInterval);
        }
    }
    onWsClose(event, wsKey, ws, wsUrl) {
        const wsConnectionState = this.wsStore.getConnectionState(wsKey);
        this.logger.info('Websocket connection closed', Object.assign(Object.assign({}, loggerCategory), { wsKey,
            event,
            wsConnectionState }));
        // User data sockets include the listen key. To prevent accummulation in memory we should clean up old disconnected states
        const { isUserData } = requestUtils_1.getContextFromWsKey(wsKey);
        if (isUserData) {
            this.wsStore.delete(wsKey);
            this.clearUserDataKeepAliveTimer;
        }
        if (wsConnectionState !== WsStore_1.WsConnectionStateEnum.CLOSING) {
            this.reconnectWithDelay(wsKey, this.options.reconnectTimeout, wsUrl);
            this.emit('reconnecting', { wsKey, event, ws });
        }
        else {
            this.setWsState(wsKey, WsStore_1.WsConnectionStateEnum.INITIAL);
            this.emit('close', { wsKey, event, ws });
        }
    }
    onWsMessage(event, wsKey, source) {
        try {
            this.clearPongTimer(wsKey);
            const msg = parseRawWsMessage(event);
            // Edge case where raw event does not include event type, detect using wsKey and mutate msg.e
            requestUtils_1.appendEventIfMissing(msg, wsKey);
            requestUtils_1.appendEventMarket(msg, wsKey);
            const eventType = parseEventTypeFromMessage(msg);
            if (eventType) {
                this.emit('message', msg);
                if (eventType === 'listenKeyExpired') {
                    const { market } = requestUtils_1.getContextFromWsKey(wsKey);
                    this.logger.info(`${market} listenKey expired - attempting to respawn user data stream: ${wsKey}`);
                    // Just closing the connection (with the last parameter as true) will handle cleanup and respawn
                    this.close(wsKey, true);
                }
                if (this.options.beautify) {
                    // call beautifier here and emit separate msg, if enabled
                    const beautifiedMessage = this.beautifier.beautifyWsMessage(msg, eventType, false);
                    this.emit('formattedMessage', beautifiedMessage);
                    // emit a separate event for user data messages
                    if (!Array.isArray(beautifiedMessage)) {
                        if ([
                            'balanceUpdate',
                            'executionReport',
                            'listStatus',
                            'listenKeyExpired',
                            'outboundAccountPosition',
                            'ACCOUNT_CONFIG_UPDATE',
                            'ACCOUNT_UPDATE',
                            'MARGIN_CALL',
                            'ORDER_TRADE_UPDATE',
                        ].includes(eventType)) {
                            this.emit('formattedUserDataMessage', beautifiedMessage);
                        }
                    }
                }
                return;
            }
            if (msg.result !== undefined) {
                this.emit('reply', {
                    type: event.type,
                    data: msg,
                    wsKey,
                });
                return;
            }
            this.logger.warning('Bug? Unhandled ws message event type. Check if appendEventIfMissing needs to parse wsKey.', Object.assign(Object.assign({}, loggerCategory), { parsedMessage: JSON.stringify(msg), rawEvent: event, wsKey,
                source }));
        }
        catch (e) {
            this.logger.error('Exception parsing ws message: ', Object.assign(Object.assign({}, loggerCategory), { rawEvent: event, wsKey, error: e, source }));
            this.emit('error', { wsKey, error: e, rawEvent: event, source });
        }
    }
    sendPing(wsKey, wsUrl) {
        this.clearPongTimer(wsKey);
        this.logger.silly('Sending ping', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
        this.tryWsPing(wsKey);
        this.wsStore.get(wsKey, true).activePongTimer = setTimeout(() => this.executeReconnectableClose(wsKey, 'Pong timeout', wsUrl), this.options.pongTimeout);
    }
    onWsPing(event, wsKey, ws, source) {
        this.logger.silly('Received ping, sending pong frame', Object.assign(Object.assign({}, loggerCategory), { wsKey,
            event,
            source }));
        ws.pong();
    }
    onWsPong(event, wsKey, source) {
        this.logger.silly('Received pong, clearing pong timer', Object.assign(Object.assign({}, loggerCategory), { wsKey,
            event,
            source }));
        this.clearPongTimer(wsKey);
    }
    /**
     * Closes a connection, if it's even open. If open, this will trigger a reconnect asynchronously.
     * If closed, trigger a reconnect immediately
     */
    executeReconnectableClose(wsKey, reason, wsUrl) {
        this.logger.info(`${reason} - closing socket to reconnect`, Object.assign(Object.assign({}, loggerCategory), { wsKey,
            reason }));
        const wasOpen = this.wsStore.isWsOpen(wsKey);
        ws_utils_1.safeTerminateWs(this.getWs(wsKey));
        delete this.wsStore.get(wsKey, true).activePongTimer;
        this.clearPingTimer(wsKey);
        this.clearPongTimer(wsKey);
        if (!wasOpen) {
            this.logger.info(`${reason} - socket already closed - trigger immediate reconnect`, Object.assign(Object.assign({}, loggerCategory), { wsKey,
                reason }));
            this.reconnectWithDelay(wsKey, this.options.reconnectTimeout, wsUrl);
        }
    }
    close(wsKey, willReconnect) {
        var _a;
        this.logger.info('Closing connection', Object.assign(Object.assign({}, loggerCategory), { wsKey,
            willReconnect }));
        this.setWsState(wsKey, willReconnect
            ? WsStore_1.WsConnectionStateEnum.RECONNECTING
            : WsStore_1.WsConnectionStateEnum.CLOSING);
        this.clearTimers(wsKey);
        (_a = this.getWs(wsKey)) === null || _a === void 0 ? void 0 : _a.close();
        const { listenKey } = requestUtils_1.getContextFromWsKey(wsKey);
        if (listenKey) {
            this.teardownUserDataListenKey(listenKey, this.getWs(wsKey));
        }
        else {
            ws_utils_1.safeTerminateWs(this.getWs(wsKey));
        }
    }
    closeAll(force) {
        const keys = this.wsStore.getKeys();
        this.logger.info(`Closing all ws connections: ${keys}`);
        keys.forEach((key) => {
            this.close(key, force);
        });
    }
    closeWs(ws, willReconnect) {
        const wsKey = this.wsUrlKeyMap[ws.url];
        if (!wsKey) {
            throw new Error(`Cannot close websocket as it has no known wsKey attached.`);
        }
        return this.close(wsKey, willReconnect);
    }
    parseWsError(context, error, wsKey, wsUrl) {
        this.logger.error(context, Object.assign(Object.assign({}, loggerCategory), { wsKey, error }));
        if (!error.message) {
            this.logger.error(`${context} due to unexpected error: `, error);
            this.emit('error', { error, wsKey, wsUrl });
            return;
        }
        switch (error.message) {
            case 'Unexpected server response: 401':
                this.logger.error(`${context} due to 401 authorization failure.`, Object.assign(Object.assign({}, loggerCategory), { wsKey }));
                break;
            default:
                if (this.wsStore.getConnectionState(wsKey) !==
                    WsStore_1.WsConnectionStateEnum.CLOSING) {
                    this.logger.error(`${context} due to unexpected response error: "${(error === null || error === void 0 ? void 0 : error.msg) || (error === null || error === void 0 ? void 0 : error.message) || error}"`, Object.assign(Object.assign({}, loggerCategory), { wsKey, error }));
                    this.executeReconnectableClose(wsKey, 'unhandled onWsError', wsUrl);
                }
                else {
                    this.logger.info(`${wsKey} socket forcefully closed. Will not reconnect.`);
                }
                break;
        }
        this.emit('error', { error, wsKey, wsUrl });
    }
    reconnectWithDelay(wsKey, connectionDelayMs, wsUrl) {
        var _a;
        this.clearTimers(wsKey);
        if (this.wsStore.getConnectionState(wsKey) !==
            WsStore_1.WsConnectionStateEnum.CONNECTING) {
            this.setWsState(wsKey, WsStore_1.WsConnectionStateEnum.RECONNECTING);
        }
        this.logger.info('Reconnecting to websocket with delay...', Object.assign(Object.assign({}, loggerCategory), { wsKey,
            connectionDelayMs }));
        if ((_a = this.wsStore.get(wsKey)) === null || _a === void 0 ? void 0 : _a.activeReconnectTimer) {
            this.clearReconnectTimer(wsKey);
        }
        this.wsStore.get(wsKey, true).activeReconnectTimer = setTimeout(() => {
            this.clearReconnectTimer(wsKey);
            if (wsKey.includes('userData')) {
                const { market, symbol, isTestnet } = requestUtils_1.getContextFromWsKey(wsKey);
                this.logger.info('Reconnecting to user data stream', Object.assign(Object.assign({}, loggerCategory), { wsKey,
                    market,
                    symbol }));
                // We'll set a new one once the new stream respawns, with a diff listenKey in the key
                this.wsStore.delete(wsKey);
                this.respawnUserDataStream(market, symbol, isTestnet);
                return;
            }
            this.logger.info('Reconnecting to public websocket', Object.assign(Object.assign({}, loggerCategory), { wsKey,
                wsUrl }));
            this.connectToWsUrl(wsUrl, wsKey);
        }, connectionDelayMs);
    }
    clearTimers(wsKey) {
        this.clearPingTimer(wsKey);
        this.clearPongTimer(wsKey);
        this.clearReconnectTimer(wsKey);
    }
    // Send a ping at intervals
    clearPingTimer(wsKey) {
        const wsState = this.wsStore.get(wsKey);
        if (wsState === null || wsState === void 0 ? void 0 : wsState.activePingTimer) {
            clearInterval(wsState.activePingTimer);
            wsState.activePingTimer = undefined;
        }
    }
    // Expect a pong within a time limit
    clearPongTimer(wsKey) {
        const wsState = this.wsStore.get(wsKey);
        if (wsState === null || wsState === void 0 ? void 0 : wsState.activePongTimer) {
            // @ts-ignore
            clearTimeout(wsState.activePongTimer);
            wsState.activePongTimer = undefined;
        }
    }
    // Timer tracking that a reconnect is about to happen / in progress
    clearReconnectTimer(wsKey) {
        const wsState = this.wsStore.get(wsKey);
        if (wsState === null || wsState === void 0 ? void 0 : wsState.activeReconnectTimer) {
            clearTimeout(wsState.activeReconnectTimer);
            wsState.activeReconnectTimer = undefined;
        }
    }
    clearUserDataKeepAliveTimer(listenKey) {
        const state = this.listenKeyStateStore[listenKey];
        if (!state) {
            return;
        }
        if (state.keepAliveTimer) {
            this.logger.silly(`Clearing old listen key interval timer for ${listenKey}`);
            clearInterval(state.keepAliveTimer);
        }
    }
    getWsBaseUrl(market, wsKey) {
        if (this.options.wsUrl) {
            return this.options.wsUrl;
        }
        return wsBaseEndpoints[market];
    }
    getWs(wsKey) {
        return this.wsStore.getWs(wsKey);
    }
    setWsState(wsKey, state) {
        this.wsStore.setConnectionState(wsKey, state);
    }
    getSpotRestClient() {
        if (!this.restClients.spot) {
            this.restClients.spot = new main_client_1.MainClient(this.getRestClientOptions(), this.options.requestOptions);
        }
        return this.restClients.spot;
    }
    getUSDMRestClient(isTestnet) {
        if (isTestnet) {
            if (!this.restClients.usdmFuturesTestnet) {
                this.restClients.usdmFuturesTestnet = new usdm_client_1.USDMClient(this.getRestClientOptions(), this.options.requestOptions, isTestnet);
            }
            return this.restClients.usdmFuturesTestnet;
        }
        if (!this.restClients.usdmFutures) {
            this.restClients.usdmFutures = new usdm_client_1.USDMClient(this.getRestClientOptions(), this.options.requestOptions);
        }
        return this.restClients.usdmFutures;
    }
    getCOINMRestClient(isTestnet) {
        if (isTestnet) {
            if (!this.restClients.coinmFuturesTestnet) {
                this.restClients.coinmFuturesTestnet = new coinm_client_1.CoinMClient(this.getRestClientOptions(), this.options.requestOptions, isTestnet);
            }
            return this.restClients.coinmFuturesTestnet;
        }
        if (!this.restClients.coinmFutures) {
            this.restClients.coinmFutures = new coinm_client_1.CoinMClient(this.getRestClientOptions(), this.options.requestOptions);
        }
        return this.restClients.coinmFutures;
    }
    /**
     * Send WS message to subscribe to topics. Use subscribe() to call this.
     */
    requestSubscribeTopics(wsKey, topics) {
        const wsMessage = JSON.stringify({
            method: 'SUBSCRIBE',
            params: topics,
            id: new Date().getTime(),
        });
        this.tryWsSend(wsKey, wsMessage);
    }
    /**
     * Send WS message to unsubscribe from topics. Use unsubscribe() to call this.
     */
    requestUnsubscribeTopics(wsKey, topics) {
        const wsMessage = JSON.stringify({
            op: 'UNSUBSCRIBE',
            params: topics,
            id: new Date().getTime(),
        });
        this.tryWsSend(wsKey, wsMessage);
    }
    /**
     * Send WS message to unsubscribe from topics.
     */
    requestListSubscriptions(wsKey, requestId) {
        const wsMessage = JSON.stringify({
            method: 'LIST_SUBSCRIPTIONS',
            id: requestId,
        });
        this.tryWsSend(wsKey, wsMessage);
    }
    /**
     * Send WS message to set property state
     */
    requestSetProperty(wsKey, property, value, requestId) {
        const wsMessage = JSON.stringify({
            method: 'SET_PROPERTY',
            params: [property, value],
            id: requestId,
        });
        this.tryWsSend(wsKey, wsMessage);
    }
    /**
     * Send WS message to get property state
     */
    requestGetProperty(wsKey, property, requestId) {
        const wsMessage = JSON.stringify({
            method: 'GET_PROPERTY',
            params: [property],
            id: requestId,
        });
        this.tryWsSend(wsKey, wsMessage);
    }
    /**
     * --------------------------
     * User data listen key tracking & persistence
     * --------------------------
     **/
    getListenKeyState(listenKey, market) {
        const state = this.listenKeyStateStore[listenKey];
        if (state) {
            return state;
        }
        this.listenKeyStateStore[listenKey] = {
            market,
            lastKeepAlive: 0,
            keepAliveTimer: undefined,
            keepAliveFailures: 0,
        };
        return this.listenKeyStateStore[listenKey];
    }
    setKeepAliveListenKeyTimer(listenKey, market, ws, wsKey, symbol, isTestnet) {
        const listenKeyState = this.getListenKeyState(listenKey, market);
        this.clearUserDataKeepAliveTimer(listenKey);
        this.logger.silly(`Created new listen key interval timer for ${listenKey}`);
        // Set timer to keep WS alive every 50 minutes
        const minutes50 = 1000 * 60 * 50;
        listenKeyState.keepAliveTimer = setInterval(() => this.checkKeepAliveListenKey(listenKey, market, ws, wsKey, symbol, isTestnet), minutes50
        // 1000 * 60
        );
    }
    sendKeepAliveForMarket(listenKey, market, ws, wsKey, symbol, isTestnet) {
        switch (market) {
            case 'spot':
                return this.getSpotRestClient().keepAliveSpotUserDataListenKey(listenKey);
            case 'margin':
                return this.getSpotRestClient().keepAliveMarginUserDataListenKey(listenKey);
            case 'isolatedMargin':
                return this.getSpotRestClient().keepAliveIsolatedMarginUserDataListenKey({ listenKey, symbol: symbol });
            case 'coinm':
            case 'options':
            case 'optionsTestnet':
            case 'usdm':
                return this.getUSDMRestClient().keepAliveFuturesUserDataListenKey();
            case 'usdmTestnet':
                return this.getUSDMRestClient(isTestnet).keepAliveFuturesUserDataListenKey();
            case 'coinmTestnet':
                return this.getUSDMRestClient(isTestnet).keepAliveFuturesUserDataListenKey();
            default:
                throwUnhandledSwitch(market, `Failed to send keep alive for user data stream in unhandled market ${market}`);
        }
    }
    checkKeepAliveListenKey(listenKey, market, ws, wsKey, symbol, isTestnet) {
        return __awaiter(this, void 0, void 0, function* () {
            const listenKeyState = this.getListenKeyState(listenKey, market);
            try {
                // Simple way to test keep alive failure handling:
                // throw new Error(`Fake keep alive failure`);
                yield this.sendKeepAliveForMarket(listenKey, market, ws, wsKey, symbol, isTestnet);
                listenKeyState.lastKeepAlive = Date.now();
                listenKeyState.keepAliveFailures = 0;
                this.logger.info(`Completed keep alive cycle for listenKey(${listenKey}) in market(${market})`, Object.assign(Object.assign({}, loggerCategory), { listenKey }));
            }
            catch (e) {
                listenKeyState.keepAliveFailures++;
                // If max failurees reached, tear down and respawn if allowed
                if (listenKeyState.keepAliveFailures >= 3) {
                    this.logger.error('FATAL: Failed to keep WS alive for listen key after 3 attempts', Object.assign(Object.assign({}, loggerCategory), { listenKey, error: e }));
                    // reconnect follows a less automatic workflow. Kill connection first, with instruction NOT to reconnect automatically
                    this.close(wsKey, false);
                    // respawn a connection with a potentially new listen key (since the old one may be invalid now)
                    this.respawnUserDataStream(market, symbol);
                    return;
                }
                const reconnectDelaySeconds = 1000 * 15;
                this.logger.warning(`Userdata keep alive request failed due to error, trying again with short delay (${reconnectDelaySeconds} seconds)`, Object.assign(Object.assign({}, loggerCategory), { listenKey, error: e, keepAliveAttempts: listenKeyState.keepAliveFailures }));
                setTimeout(() => this.checkKeepAliveListenKey(listenKey, market, ws, wsKey, symbol), reconnectDelaySeconds);
            }
        });
    }
    teardownUserDataListenKey(listenKey, ws) {
        if (listenKey) {
            this.clearUserDataKeepAliveTimer(listenKey);
            delete this.listenKeyStateStore[listenKey];
            ws_utils_1.safeTerminateWs(ws);
        }
    }
    respawnUserDataStream(market, symbol, isTestnet, respawnAttempt) {
        return __awaiter(this, void 0, void 0, function* () {
            const forceNewConnection = true;
            const isReconnecting = true;
            let ws;
            try {
                switch (market) {
                    case 'spot':
                        ws = yield this.subscribeSpotUserDataStream(forceNewConnection, isReconnecting);
                        break;
                    case 'margin':
                        ws = yield this.subscribeMarginUserDataStream(forceNewConnection, isReconnecting);
                        break;
                    case 'isolatedMargin':
                        ws = yield this.subscribeIsolatedMarginUserDataStream(symbol, forceNewConnection, isReconnecting);
                        break;
                    case 'usdm':
                        ws = yield this.subscribeUsdFuturesUserDataStream(isTestnet, forceNewConnection, isReconnecting);
                        break;
                    case 'usdmTestnet':
                        ws = yield this.subscribeUsdFuturesUserDataStream(true, forceNewConnection, isReconnecting);
                        break;
                    case 'coinm':
                        ws = yield this.subscribeCoinFuturesUserDataStream(isTestnet, forceNewConnection, isReconnecting);
                        break;
                    case 'coinmTestnet':
                        ws = yield this.subscribeCoinFuturesUserDataStream(true, forceNewConnection, isReconnecting);
                        break;
                    case 'options':
                    case 'optionsTestnet':
                        throw new Error('TODO: respawn other user data streams once subscribe methods have been aded');
                    default:
                        throwUnhandledSwitch(market, `Failed to respawn user data stream - unhandled market: ${market}`);
                }
            }
            catch (e) {
                this.logger.error('Exception trying to spawn user data stream', Object.assign(Object.assign({}, loggerCategory), { market,
                    symbol,
                    isTestnet, error: e }));
                this.emit('error', { wsKey: market + '_' + 'userData', error: e });
            }
            if (!ws) {
                const delayInSeconds = 2;
                this.logger.error('User key respawn failed, trying again with short delay', Object.assign(Object.assign({}, loggerCategory), { market,
                    symbol,
                    isTestnet,
                    respawnAttempt,
                    delayInSeconds }));
                setTimeout(() => this.respawnUserDataStream(market, symbol, isTestnet, respawnAttempt ? respawnAttempt + 1 : 1), 1000 * delayInSeconds);
            }
        });
    }
    /**
     * --------------------------
     * Universal market websocket streams (may apply to one or more API markets)
     * --------------------------
     **/
    /**
     * Subscribe to aggregate trades for a symbol in a market category
     */
    subscribeAggregateTrades(symbol, market, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'aggTrade';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${lowerCaseSymbol}@${streamName}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to trades for a symbol in a market category
     * IMPORTANT: This topic for usdm and coinm is not listed in the api docs and might stop working without warning
     */
    subscribeTrades(symbol, market, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'trade';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${lowerCaseSymbol}@${streamName}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to coin index for a symbol in COINM Futures markets
     */
    subscribeCoinIndexPrice(symbol, updateSpeedMs = 3000, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'indexPrice';
        const speedSuffix = updateSpeedMs === 1000 ? '@1s' : '';
        const market = 'coinm';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) +
            `/ws/${lowerCaseSymbol}@${streamName}${speedSuffix}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to mark price for a symbol in a market category
     */
    subscribeMarkPrice(symbol, market, updateSpeedMs = 3000, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'markPrice';
        const speedSuffix = updateSpeedMs === 1000 ? '@1s' : '';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) +
            `/ws/${lowerCaseSymbol}@${streamName}${speedSuffix}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to mark price for all symbols in a market category
     */
    subscribeAllMarketMarkPrice(market, updateSpeedMs = 3000, forceNewConnection) {
        const streamName = '!markPrice@arr';
        const speedSuffix = updateSpeedMs === 1000 ? '@1s' : '';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${streamName}${speedSuffix}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to klines(candles) for a symbol in a market category
     */
    subscribeKlines(symbol, interval, market, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'kline';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol, interval);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) +
            `/ws/${lowerCaseSymbol}@${streamName}_${interval}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to continuous contract klines(candles) for a symbol futures
     */
    subscribeContinuousContractKlines(symbol, contractType, interval, market, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'continuousKline';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol, interval);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) +
            `/ws/${lowerCaseSymbol}_${contractType}@${streamName}_${interval}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to index klines(candles) for a symbol in a coinm futures
     */
    subscribeIndexKlines(symbol, interval, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'indexPriceKline';
        const market = 'coinm';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol, interval);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) +
            `/ws/${lowerCaseSymbol}@${streamName}_${interval}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to index klines(candles) for a symbol in a coinm futures
     */
    subscribeMarkPriceKlines(symbol, interval, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'markPrice_kline';
        const market = 'coinm';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol, interval);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) +
            `/ws/${lowerCaseSymbol}@${streamName}_${interval}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to mini 24hr ticker for a symbol in market category.
     */
    subscribeSymbolMini24hrTicker(symbol, market, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'miniTicker';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${lowerCaseSymbol}@${streamName}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to mini 24hr mini ticker in market category.
     */
    subscribeAllMini24hrTickers(market, forceNewConnection) {
        const streamName = 'miniTicker';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/!${streamName}@arr`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to 24hr ticker for a symbol in any market.
     */
    subscribeSymbol24hrTicker(symbol, market, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'ticker';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${lowerCaseSymbol}@${streamName}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to 24hr ticker in any market.
     */
    subscribeAll24hrTickers(market, forceNewConnection) {
        const streamName = 'ticker';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/!${streamName}@arr`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to best bid/ask for symbol in spot markets.
     */
    subscribeSymbolBookTicker(symbol, market, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'bookTicker';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${lowerCaseSymbol}@${streamName}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to best bid/ask for all symbols in spot markets.
     */
    subscribeAllBookTickers(market, forceNewConnection) {
        const streamName = 'bookTicker';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/!${streamName}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to best bid/ask for symbol in spot markets.
     */
    subscribeSymbolLiquidationOrders(symbol, market, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'forceOrder';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${lowerCaseSymbol}@${streamName}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to best bid/ask for all symbols in spot markets.
     */
    subscribeAllLiquidationOrders(market, forceNewConnection) {
        const streamName = 'forceOrder@arr';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName);
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/!${streamName}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to partial book depths. Note, spot only supports 1000ms or 100ms for updateMs, while futures only support 100, 250 or 500ms.
     */
    subscribePartialBookDepths(symbol, levels, updateMs, market, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'depth';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, streamName, lowerCaseSymbol);
        const updateMsSuffx = updateMs === 100 ? `@${updateMs}ms` : '';
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) +
            `/ws/${lowerCaseSymbol}@${streamName}${levels}${updateMsSuffx}`, wsKey, forceNewConnection);
    }
    /**
     * Subscribe to spot orderbook depth updates to locally manage an order book.
     */
    subscribeDiffBookDepth(symbol, updateMs = 1000, market, forceNewConnection) {
        const lowerCaseSymbol = symbol.toLowerCase();
        const streamName = 'depth';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, 'diffBookDepth', lowerCaseSymbol, String(updateMs));
        const updateMsSuffx = updateMs === 100 ? `@${updateMs}ms` : '';
        return this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) +
            `/ws/${lowerCaseSymbol}@${streamName}${updateMsSuffx}`, wsKey, forceNewConnection);
    }
    /**
     * --------------------------
     * SPOT market websocket streams
     * --------------------------
     **/
    /**
     * Subscribe to aggregate trades for a symbol in spot markets.
     */
    subscribeSpotAggregateTrades(symbol, forceNewConnection) {
        return this.subscribeAggregateTrades(symbol, 'spot', forceNewConnection);
    }
    /**
     * Subscribe to trades for a symbol in spot markets.
     */
    subscribeSpotTrades(symbol, forceNewConnection) {
        return this.subscribeTrades(symbol, 'spot', forceNewConnection);
    }
    /**
     * Subscribe to candles for a symbol in spot markets.
     */
    subscribeSpotKline(symbol, interval, forceNewConnection) {
        return this.subscribeKlines(symbol, interval, 'spot', forceNewConnection);
    }
    /**
     * Subscribe to mini 24hr ticker for a symbol in spot markets.
     */
    subscribeSpotSymbolMini24hrTicker(symbol, forceNewConnection) {
        return this.subscribeSymbolMini24hrTicker(symbol, 'spot', forceNewConnection);
    }
    /**
     * Subscribe to mini 24hr mini ticker in spot markets.
     */
    subscribeSpotAllMini24hrTickers(forceNewConnection) {
        return this.subscribeAllMini24hrTickers('spot', forceNewConnection);
    }
    /**
     * Subscribe to 24hr ticker for a symbol in spot markets.
     */
    subscribeSpotSymbol24hrTicker(symbol, forceNewConnection) {
        return this.subscribeSymbol24hrTicker(symbol, 'spot', forceNewConnection);
    }
    /**
     * Subscribe to 24hr ticker in spot markets.
     */
    subscribeSpotAll24hrTickers(forceNewConnection) {
        return this.subscribeAll24hrTickers('spot', forceNewConnection);
    }
    /**
     * Subscribe to best bid/ask for symbol in spot markets.
     */
    subscribeSpotSymbolBookTicker(symbol, forceNewConnection) {
        return this.subscribeSymbolBookTicker(symbol, 'spot', forceNewConnection);
    }
    /**
     * Subscribe to best bid/ask for all symbols in spot markets.
     */
    subscribeSpotAllBookTickers(forceNewConnection) {
        return this.subscribeAllBookTickers('spot', forceNewConnection);
    }
    /**
     * Subscribe to top bid/ask levels for symbol in spot markets.
     */
    subscribeSpotPartialBookDepth(symbol, levels, updateMs = 1000, forceNewConnection) {
        return this.subscribePartialBookDepths(symbol, levels, updateMs, 'spot', forceNewConnection);
    }
    /**
     * Subscribe to spot orderbook depth updates to locally manage an order book.
     */
    subscribeSpotDiffBookDepth(symbol, updateMs = 1000, forceNewConnection) {
        return this.subscribeDiffBookDepth(symbol, updateMs, 'spot', forceNewConnection);
    }
    /**
     * Subscribe to a spot user data stream. Use REST client to generate and persist listen key.
     * Supports spot, margin & isolated margin listen keys.
     */
    subscribeSpotUserDataStreamWithListenKey(listenKey, forceNewConnection, isReconnecting) {
        const market = 'spot';
        const wsKey = requestUtils_1.getWsKeyWithContext(market, 'userData', undefined, listenKey);
        if (!forceNewConnection && this.wsStore.isWsConnecting(wsKey)) {
            this.logger.silly('Existing spot user data connection in progress for listen key. Avoiding duplicate');
            return this.getWs(wsKey);
        }
        this.setWsState(wsKey, isReconnecting
            ? WsStore_1.WsConnectionStateEnum.RECONNECTING
            : WsStore_1.WsConnectionStateEnum.CONNECTING);
        const ws = this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${listenKey}`, wsKey, forceNewConnection);
        // Start & store timer to keep alive listen key (and handle expiration)
        this.setKeepAliveListenKeyTimer(listenKey, market, ws, wsKey);
        return ws;
    }
    /**
     * Subscribe to spot user data stream - listen key is automatically generated. Calling multiple times only opens one connection.
     */
    subscribeSpotUserDataStream(forceNewConnection, isReconnecting) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { listenKey } = yield this.getSpotRestClient().getSpotUserDataListenKey();
                return this.subscribeSpotUserDataStreamWithListenKey(listenKey, forceNewConnection, isReconnecting);
            }
            catch (e) {
                this.logger.error(`Failed to connect to spot user data`, Object.assign(Object.assign({}, loggerCategory), { error: e }));
                this.emit('error', { wsKey: 'spot' + '_' + 'userData', error: e });
            }
        });
    }
    /**
     * Subscribe to margin user data stream - listen key is automatically generated.
     */
    subscribeMarginUserDataStream(forceNewConnection, isReconnecting) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { listenKey } = yield this.getSpotRestClient().getMarginUserDataListenKey();
                const market = 'margin';
                const wsKey = requestUtils_1.getWsKeyWithContext(market, 'userData', undefined, listenKey);
                if (!forceNewConnection && this.wsStore.isWsConnecting(wsKey)) {
                    this.logger.silly('Existing margin user data connection in progress for listen key. Avoiding duplicate');
                    return this.getWs(wsKey);
                }
                this.setWsState(wsKey, isReconnecting
                    ? WsStore_1.WsConnectionStateEnum.RECONNECTING
                    : WsStore_1.WsConnectionStateEnum.CONNECTING);
                const ws = this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${listenKey}`, wsKey, forceNewConnection);
                // Start & store timer to keep alive listen key (and handle expiration)
                this.setKeepAliveListenKeyTimer(listenKey, market, ws, wsKey);
                return ws;
            }
            catch (e) {
                this.logger.error(`Failed to connect to margin user data`, Object.assign(Object.assign({}, loggerCategory), { error: e }));
                this.emit('error', { wsKey: 'margin' + '_' + 'userData', error: e });
            }
        });
    }
    /**
     * Subscribe to isolated margin user data stream - listen key is automatically generated.
     */
    subscribeIsolatedMarginUserDataStream(symbol, forceNewConnection, isReconnecting) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const lowerCaseSymbol = symbol.toLowerCase();
                const { listenKey } = yield this.getSpotRestClient().getIsolatedMarginUserDataListenKey({
                    symbol: lowerCaseSymbol,
                });
                const market = 'isolatedMargin';
                const wsKey = requestUtils_1.getWsKeyWithContext(market, 'userData', lowerCaseSymbol, listenKey);
                if (!forceNewConnection && this.wsStore.isWsConnecting(wsKey)) {
                    this.logger.silly('Existing isolated margin user data connection in progress for listen key. Avoiding duplicate');
                    return this.getWs(wsKey);
                }
                this.setWsState(wsKey, isReconnecting
                    ? WsStore_1.WsConnectionStateEnum.RECONNECTING
                    : WsStore_1.WsConnectionStateEnum.CONNECTING);
                const ws = this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${listenKey}`, wsKey, forceNewConnection);
                // Start & store timer to keep alive listen key (and handle expiration)
                this.setKeepAliveListenKeyTimer(listenKey, market, ws, wsKey, symbol);
                return ws;
            }
            catch (e) {
                this.logger.error(`Failed to connect to isolated margin user data`, Object.assign(Object.assign({}, loggerCategory), { error: e, symbol }));
                this.emit('error', {
                    wsKey: 'isolatedMargin' + '_' + 'userData',
                    error: e,
                });
            }
        });
    }
    /**
     * --------------------------
     * End of SPOT market websocket streams
     * --------------------------
     **/
    /**
     * Subscribe to USD-M Futures user data stream - listen key is automatically generated.
     */
    subscribeUsdFuturesUserDataStream(isTestnet, forceNewConnection, isReconnecting) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const restClient = this.getUSDMRestClient(isTestnet);
                const { listenKey } = yield restClient.getFuturesUserDataListenKey();
                const market = isTestnet ? 'usdmTestnet' : 'usdm';
                const wsKey = requestUtils_1.getWsKeyWithContext(market, 'userData', undefined, listenKey);
                if (!forceNewConnection && this.wsStore.isWsConnecting(wsKey)) {
                    this.logger.silly('Existing usd futures user data connection in progress for listen key. Avoiding duplicate');
                    return this.getWs(wsKey);
                }
                // Necessary so client knows this is a reconnect
                this.setWsState(wsKey, isReconnecting
                    ? WsStore_1.WsConnectionStateEnum.RECONNECTING
                    : WsStore_1.WsConnectionStateEnum.CONNECTING);
                const ws = this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${listenKey}`, wsKey, forceNewConnection);
                // Start & store timer to keep alive listen key (and handle expiration)
                this.setKeepAliveListenKeyTimer(listenKey, market, ws, wsKey, undefined, isTestnet);
                return ws;
            }
            catch (e) {
                this.logger.error(`Failed to connect to USD Futures user data`, Object.assign(Object.assign({}, loggerCategory), { error: e }));
                this.emit('error', { wsKey: 'usdm' + '_' + 'userData', error: e });
            }
        });
    }
    /**
     * Subscribe to COIN-M Futures user data stream - listen key is automatically generated.
     */
    subscribeCoinFuturesUserDataStream(isTestnet, forceNewConnection, isReconnecting) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { listenKey } = yield this.getCOINMRestClient(isTestnet).getFuturesUserDataListenKey();
                const market = isTestnet ? 'coinmTestnet' : 'coinm';
                const wsKey = requestUtils_1.getWsKeyWithContext(market, 'userData', undefined, listenKey);
                if (!forceNewConnection && this.wsStore.isWsConnecting(wsKey)) {
                    this.logger.silly('Existing usd futures user data connection in progress for listen key. Avoiding duplicate');
                    return this.getWs(wsKey);
                }
                // Necessary so client knows this is a reconnect
                this.setWsState(wsKey, isReconnecting
                    ? WsStore_1.WsConnectionStateEnum.RECONNECTING
                    : WsStore_1.WsConnectionStateEnum.CONNECTING);
                const ws = this.connectToWsUrl(this.getWsBaseUrl(market, wsKey) + `/ws/${listenKey}`, wsKey, forceNewConnection);
                // Start & store timer to keep alive listen key (and handle expiration)
                this.setKeepAliveListenKeyTimer(listenKey, market, ws, wsKey, undefined, isTestnet);
                return ws;
            }
            catch (e) {
                this.logger.error(`Failed to connect to COIN Futures user data`, Object.assign(Object.assign({}, loggerCategory), { error: e }));
                this.emit('error', { wsKey: 'coinm' + '_' + 'userData', error: e });
            }
        });
    }
}
exports.WebsocketClient = WebsocketClient;
//# sourceMappingURL=websocket-client.js.map