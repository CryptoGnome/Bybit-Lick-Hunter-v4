/// <reference types="node" />
import { AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';
import WebSocket from 'isomorphic-ws';
import { DefaultLogger } from './logger';
import { KlineInterval } from './types/shared';
import { WsFormattedMessage, WsRawMessage, WsResponse, WsUserDataEvents } from './types/websockets';
import { RestClientOptions } from './util/requestUtils';
export interface WSClientConfigurableOptions {
    api_key?: string;
    api_secret?: string;
    beautify?: boolean;
    disableHeartbeat?: boolean;
    pongTimeout?: number;
    pingInterval?: number;
    reconnectTimeout?: number;
    restOptions?: RestClientOptions;
    requestOptions?: AxiosRequestConfig;
    wsUrl?: string;
}
export interface WebsocketClientOptions extends WSClientConfigurableOptions {
    pongTimeout: number;
    pingInterval: number;
    reconnectTimeout: number;
}
export declare type WsKey = string | 'spot' | 'margin' | 'usdmfutures' | 'coinmfutures' | 'options';
export declare interface WebsocketClient {
    on(event: 'reply', listener: (event: WsResponse) => void): this;
    on(event: 'message', listener: (event: WsRawMessage) => void): this;
    on(event: 'formattedMessage', listener: (event: WsFormattedMessage) => void): this;
    on(event: 'formattedUserDataMessage', listener: (event: WsUserDataEvents) => void): this;
    on(event: 'error', listener: (event: {
        wsKey: WsKey;
        error: any;
        rawEvent?: string;
    }) => void): this;
    on(event: 'open' | 'reconnected' | 'reconnecting' | 'close', listener: (event: {
        wsKey: WsKey;
        ws: WebSocket;
        event?: any;
    }) => void): this;
}
/**
 * Try to resolve event.data. Example circumstance: {"stream":"!forceOrder@arr","data":{"e":"forceOrder","E":1634653599186,"o":{"s":"IOTXUSDT","S":"SELL","o":"LIMIT","f":"IOC","q":"3661","p":"0.06606","ap":"0.06669","X":"FILLED","l":"962","z":"3661","T":1634653599180}}}
 */
export declare function parseRawWsMessage(event: any): any;
export declare class WebsocketClient extends EventEmitter {
    private logger;
    private options;
    private wsStore;
    private beautifier;
    private restClients;
    private listenKeyStateStore;
    private wsUrlKeyMap;
    constructor(options: WSClientConfigurableOptions, logger?: typeof DefaultLogger);
    private getRestClientOptions;
    connectToWsUrl(url: string, wsKey?: WsKey, forceNewConnection?: boolean): WebSocket;
    tryWsSend(wsKey: WsKey, wsMessage: string): void;
    tryWsPing(wsKey: WsKey): void;
    private onWsOpen;
    private onWsClose;
    private onWsMessage;
    private sendPing;
    private onWsPing;
    private onWsPong;
    /**
     * Closes a connection, if it's even open. If open, this will trigger a reconnect asynchronously.
     * If closed, trigger a reconnect immediately
     */
    private executeReconnectableClose;
    close(wsKey: WsKey, willReconnect?: boolean): void;
    closeAll(force?: boolean): void;
    closeWs(ws: WebSocket, willReconnect?: boolean): void;
    private parseWsError;
    private reconnectWithDelay;
    private clearTimers;
    private clearPingTimer;
    private clearPongTimer;
    private clearReconnectTimer;
    private clearUserDataKeepAliveTimer;
    private getWsBaseUrl;
    getWs(wsKey: WsKey): WebSocket | undefined;
    private setWsState;
    private getSpotRestClient;
    private getUSDMRestClient;
    private getCOINMRestClient;
    /**
     * Send WS message to subscribe to topics. Use subscribe() to call this.
     */
    private requestSubscribeTopics;
    /**
     * Send WS message to unsubscribe from topics. Use unsubscribe() to call this.
     */
    private requestUnsubscribeTopics;
    /**
     * Send WS message to unsubscribe from topics.
     */
    requestListSubscriptions(wsKey: WsKey, requestId: number): void;
    /**
     * Send WS message to set property state
     */
    requestSetProperty(wsKey: WsKey, property: 'combined' | string, value: any, requestId: number): void;
    /**
     * Send WS message to get property state
     */
    requestGetProperty(wsKey: WsKey, property: 'combined' | string, requestId: number): void;
    /**
     * --------------------------
     * User data listen key tracking & persistence
     * --------------------------
     **/
    private getListenKeyState;
    private setKeepAliveListenKeyTimer;
    private sendKeepAliveForMarket;
    private checkKeepAliveListenKey;
    private teardownUserDataListenKey;
    private respawnUserDataStream;
    /**
     * --------------------------
     * Universal market websocket streams (may apply to one or more API markets)
     * --------------------------
     **/
    /**
     * Subscribe to aggregate trades for a symbol in a market category
     */
    subscribeAggregateTrades(symbol: string, market: 'spot' | 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to trades for a symbol in a market category
     * IMPORTANT: This topic for usdm and coinm is not listed in the api docs and might stop working without warning
     */
    subscribeTrades(symbol: string, market: 'spot' | 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to coin index for a symbol in COINM Futures markets
     */
    subscribeCoinIndexPrice(symbol: string, updateSpeedMs?: 1000 | 3000, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to mark price for a symbol in a market category
     */
    subscribeMarkPrice(symbol: string, market: 'usdm' | 'coinm', updateSpeedMs?: 1000 | 3000, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to mark price for all symbols in a market category
     */
    subscribeAllMarketMarkPrice(market: 'usdm' | 'coinm', updateSpeedMs?: 1000 | 3000, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to klines(candles) for a symbol in a market category
     */
    subscribeKlines(symbol: string, interval: KlineInterval, market: 'spot' | 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to continuous contract klines(candles) for a symbol futures
     */
    subscribeContinuousContractKlines(symbol: string, contractType: 'perpetual' | 'current_quarter' | 'next_quarter', interval: KlineInterval, market: 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to index klines(candles) for a symbol in a coinm futures
     */
    subscribeIndexKlines(symbol: string, interval: KlineInterval, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to index klines(candles) for a symbol in a coinm futures
     */
    subscribeMarkPriceKlines(symbol: string, interval: KlineInterval, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to mini 24hr ticker for a symbol in market category.
     */
    subscribeSymbolMini24hrTicker(symbol: string, market: 'spot' | 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to mini 24hr mini ticker in market category.
     */
    subscribeAllMini24hrTickers(market: 'spot' | 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to 24hr ticker for a symbol in any market.
     */
    subscribeSymbol24hrTicker(symbol: string, market: 'spot' | 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to 24hr ticker in any market.
     */
    subscribeAll24hrTickers(market: 'spot' | 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to best bid/ask for symbol in spot markets.
     */
    subscribeSymbolBookTicker(symbol: string, market: 'spot' | 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to best bid/ask for all symbols in spot markets.
     */
    subscribeAllBookTickers(market: 'spot' | 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to best bid/ask for symbol in spot markets.
     */
    subscribeSymbolLiquidationOrders(symbol: string, market: 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to best bid/ask for all symbols in spot markets.
     */
    subscribeAllLiquidationOrders(market: 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to partial book depths. Note, spot only supports 1000ms or 100ms for updateMs, while futures only support 100, 250 or 500ms.
     */
    subscribePartialBookDepths(symbol: string, levels: 5 | 10 | 20, updateMs: 100 | 250 | 500 | 1000, market: 'spot' | 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to spot orderbook depth updates to locally manage an order book.
     */
    subscribeDiffBookDepth(symbol: string, updateMs: 100 | 1000 | undefined, market: 'spot' | 'usdm' | 'coinm', forceNewConnection?: boolean): WebSocket;
    /**
     * --------------------------
     * SPOT market websocket streams
     * --------------------------
     **/
    /**
     * Subscribe to aggregate trades for a symbol in spot markets.
     */
    subscribeSpotAggregateTrades(symbol: string, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to trades for a symbol in spot markets.
     */
    subscribeSpotTrades(symbol: string, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to candles for a symbol in spot markets.
     */
    subscribeSpotKline(symbol: string, interval: KlineInterval, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to mini 24hr ticker for a symbol in spot markets.
     */
    subscribeSpotSymbolMini24hrTicker(symbol: string, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to mini 24hr mini ticker in spot markets.
     */
    subscribeSpotAllMini24hrTickers(forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to 24hr ticker for a symbol in spot markets.
     */
    subscribeSpotSymbol24hrTicker(symbol: string, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to 24hr ticker in spot markets.
     */
    subscribeSpotAll24hrTickers(forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to best bid/ask for symbol in spot markets.
     */
    subscribeSpotSymbolBookTicker(symbol: string, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to best bid/ask for all symbols in spot markets.
     */
    subscribeSpotAllBookTickers(forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to top bid/ask levels for symbol in spot markets.
     */
    subscribeSpotPartialBookDepth(symbol: string, levels: 5 | 10 | 20, updateMs?: 1000 | 100, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to spot orderbook depth updates to locally manage an order book.
     */
    subscribeSpotDiffBookDepth(symbol: string, updateMs?: 1000 | 100, forceNewConnection?: boolean): WebSocket;
    /**
     * Subscribe to a spot user data stream. Use REST client to generate and persist listen key.
     * Supports spot, margin & isolated margin listen keys.
     */
    subscribeSpotUserDataStreamWithListenKey(listenKey: string, forceNewConnection?: boolean, isReconnecting?: boolean): WebSocket | undefined;
    /**
     * Subscribe to spot user data stream - listen key is automatically generated. Calling multiple times only opens one connection.
     */
    subscribeSpotUserDataStream(forceNewConnection?: boolean, isReconnecting?: boolean): Promise<WebSocket | undefined>;
    /**
     * Subscribe to margin user data stream - listen key is automatically generated.
     */
    subscribeMarginUserDataStream(forceNewConnection?: boolean, isReconnecting?: boolean): Promise<WebSocket>;
    /**
     * Subscribe to isolated margin user data stream - listen key is automatically generated.
     */
    subscribeIsolatedMarginUserDataStream(symbol: string, forceNewConnection?: boolean, isReconnecting?: boolean): Promise<WebSocket>;
    /**
     * --------------------------
     * End of SPOT market websocket streams
     * --------------------------
     **/
    /**
     * Subscribe to USD-M Futures user data stream - listen key is automatically generated.
     */
    subscribeUsdFuturesUserDataStream(isTestnet?: boolean, forceNewConnection?: boolean, isReconnecting?: boolean): Promise<WebSocket>;
    /**
     * Subscribe to COIN-M Futures user data stream - listen key is automatically generated.
     */
    subscribeCoinFuturesUserDataStream(isTestnet?: boolean, forceNewConnection?: boolean, isReconnecting?: boolean): Promise<WebSocket>;
}
