import { NewSpotOrder, APIResponse, KlineInterval, OrderSide, OrderTypeSpot, SpotBalances, SpotLastPrice, SpotOrderQueryById, SpotSymbolInfo } from './types';
import BaseRestClient from './util/BaseRestClient';
/**
 * @deprecated Use SpotV3Client instead, which leverages the newer v3 APIs
 * REST API client for Spot APIs (v1)
 */
export declare class SpotClient extends BaseRestClient {
    getClientType(): "spot";
    fetchServerTime(): Promise<number>;
    getServerTime(): Promise<number>;
    /**
     *
     * Market Data Endpoints
     *
     **/
    getSymbols(): Promise<APIResponse<SpotSymbolInfo[]>>;
    getOrderBook(symbol: string, limit?: number): Promise<APIResponse<any>>;
    getMergedOrderBook(symbol: string, scale?: number, limit?: number): Promise<APIResponse<any>>;
    getTrades(symbol: string, limit?: number): Promise<APIResponse<any[]>>;
    getCandles(symbol: string, interval: KlineInterval, limit?: number, startTime?: number, endTime?: number): Promise<APIResponse<any[]>>;
    get24hrTicker(symbol?: string): Promise<APIResponse<any>>;
    getLastTradedPrice(): Promise<APIResponse<SpotLastPrice[]>>;
    getLastTradedPrice(symbol: string): Promise<APIResponse<SpotLastPrice>>;
    getBestBidAskPrice(symbol?: string): Promise<APIResponse<any>>;
    /**
     * Account Data Endpoints
     */
    submitOrder(params: NewSpotOrder): Promise<APIResponse<any>>;
    getOrder(params: SpotOrderQueryById): Promise<APIResponse<any>>;
    cancelOrder(params: SpotOrderQueryById): Promise<APIResponse<any>>;
    cancelOrderBatch(params: {
        symbol: string;
        side?: OrderSide;
        orderTypes: OrderTypeSpot[];
    }): Promise<APIResponse<any>>;
    getOpenOrders(symbol?: string, orderId?: string, limit?: number): Promise<APIResponse<any>>;
    getPastOrders(symbol?: string, orderId?: string, limit?: number): Promise<APIResponse<any>>;
    getMyTrades(symbol?: string, limit?: number, fromId?: number, toId?: number): Promise<APIResponse<any>>;
    /**
     * Wallet Data Endpoints
     */
    getBalances(): Promise<APIResponse<SpotBalances>>;
}
