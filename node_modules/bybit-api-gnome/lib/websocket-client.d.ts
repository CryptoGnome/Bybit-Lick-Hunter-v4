/// <reference types="node" />
import { EventEmitter } from 'events';
import WebSocket from 'isomorphic-ws';
import WsStore from './util/WsStore';
import { KlineInterval, WSClientConfigurableOptions, WsKey, WsTopic } from './types';
import { DefaultLogger } from './util';
export declare type WsClientEvent = 'open' | 'update' | 'close' | 'error' | 'reconnect' | 'reconnected' | 'response';
interface WebsocketClientEvents {
    /** Connection opened. If this connection was previously opened and reconnected, expect the reconnected event instead */
    open: (evt: {
        wsKey: WsKey;
        event: any;
    }) => void;
    /** Reconnecting a dropped connection */
    reconnect: (evt: {
        wsKey: WsKey;
        event: any;
    }) => void;
    /** Successfully reconnected a connection that dropped */
    reconnected: (evt: {
        wsKey: WsKey;
        event: any;
    }) => void;
    /** Connection closed */
    close: (evt: {
        wsKey: WsKey;
        event: any;
    }) => void;
    /** Received reply to websocket command (e.g. after subscribing to topics) */
    response: (response: any) => void;
    /** Received data for topic */
    update: (response: any) => void;
    /** Exception from ws client OR custom listeners */
    error: (response: any) => void;
}
export declare interface WebsocketClient {
    on<U extends keyof WebsocketClientEvents>(event: U, listener: WebsocketClientEvents[U]): this;
    emit<U extends keyof WebsocketClientEvents>(event: U, ...args: Parameters<WebsocketClientEvents[U]>): boolean;
}
export declare class WebsocketClient extends EventEmitter {
    private logger;
    private restClient?;
    private options;
    private wsStore;
    constructor(options: WSClientConfigurableOptions, logger?: typeof DefaultLogger);
    /**
     * Subscribe to topics & track/persist them. They will be automatically resubscribed to if the connection drops/reconnects.
     * @param wsTopics topic or list of topics
     * @param isPrivateTopic optional - the library will try to detect private topics, you can use this to mark a topic as private (if the topic isn't recognised yet)
     */
    subscribe(wsTopics: WsTopic[] | WsTopic, isPrivateTopic?: boolean): void;
    /**
     * Unsubscribe from topics & remove them from memory. They won't be re-subscribed to if the connection reconnects.
     * @param wsTopics topic or list of topics
     * @param isPrivateTopic optional - the library will try to detect private topics, you can use this to mark a topic as private (if the topic isn't recognised yet)
     */
    unsubscribe(wsTopics: WsTopic[] | WsTopic, isPrivateTopic?: boolean): void;
    /**
     * @private Only used if we fetch exchange time before attempting auth. Disabled by default.
     * I've removed this for ftx and it's working great, tempted to remove this here
     */
    private prepareRESTClient;
    /** Get the WsStore that tracks websockets & topics */
    getWsStore(): WsStore;
    isTestnet(): boolean;
    close(wsKey: WsKey, force?: boolean): void;
    closeAll(force?: boolean): void;
    /**
     * Request connection of all dependent (public & private) websockets, instead of waiting for automatic connection by library
     */
    connectAll(): Promise<WebSocket | undefined>[];
    connectPublic(): Promise<WebSocket | undefined>[];
    connectPrivate(): Promise<WebSocket | undefined>;
    private connect;
    private parseWsError;
    /**
     * Return params required to make authorized request
     */
    private getAuthParams;
    private sendAuthRequest;
    private getWsAuthSignature;
    private reconnectWithDelay;
    private ping;
    /**
     * Closes a connection, if it's even open. If open, this will trigger a reconnect asynchronously.
     * If closed, trigger a reconnect immediately
     */
    private executeReconnectableClose;
    private clearTimers;
    private clearPingTimer;
    private clearPongTimer;
    private clearReconnectTimer;
    /**
     * @private Use the `subscribe(topics)` method to subscribe to topics. Send WS message to subscribe to topics.
     */
    private requestSubscribeTopics;
    /**
     * @private Use the `unsubscribe(topics)` method to unsubscribe from topics. Send WS message to unsubscribe from topics.
     */
    private requestUnsubscribeTopics;
    tryWsSend(wsKey: WsKey, wsMessage: string): void;
    private connectToWsUrl;
    private onWsOpen;
    private onWsMessage;
    private onWsClose;
    private getWs;
    private setWsState;
    private getWsUrl;
    private wrongMarketError;
    /** @deprecated use "market: 'spotv3" client */
    subscribePublicSpotTrades(symbol: string, binary?: boolean): void;
    /** @deprecated use "market: 'spotv3" client */
    subscribePublicSpotTradingPair(symbol: string, binary?: boolean): void;
    /** @deprecated use "market: 'spotv3" client */
    subscribePublicSpotV1Kline(symbol: string, candleSize: KlineInterval, binary?: boolean): void;
    /** @deprecated use "market: 'spotv3" client */
    subscribePublicSpotOrderbook(symbol: string, depth: 'full' | 'merge' | 'delta', dumpScale?: number, binary?: boolean): void;
}
export {};
