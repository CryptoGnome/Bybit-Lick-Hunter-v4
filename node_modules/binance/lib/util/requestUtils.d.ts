import { MainClient } from "../main-client";
import { NewFuturesOrderParams } from "../types/futures";
import { BinanceBaseUrlKey, CancelOCOParams, CancelOrderParams, NewOCOParams, OrderIdProperty } from "../types/shared";
import { WsMarket } from "../types/websockets";
import { USDMClient } from "../usdm-client";
import { WsKey } from "../websocket-client";
export declare type RestClient = MainClient | USDMClient;
export interface RestClientOptions {
    api_key?: string;
    api_secret?: string;
    recvWindow?: number;
    syncIntervalMs?: number | string;
    disableTimeSync?: boolean;
    strictParamValidation?: boolean;
    baseUrl?: string;
    baseUrlKey?: BinanceBaseUrlKey;
    parseExceptions?: boolean;
    beautifyResponses?: boolean;
}
export declare type GenericAPIResponse<T = any> = Promise<T>;
export declare function getOrderIdPrefix(network: BinanceBaseUrlKey): string;
export declare function generateNewOrderId(network: BinanceBaseUrlKey): string;
export declare function serialiseParams(params?: object, strict_validation?: boolean, encodeValues?: boolean): string;
export interface SignedRequestState {
    requestBody: any;
    serialisedParams: string | undefined;
    timestamp?: number;
    signature?: string;
    recvWindow?: number;
}
export declare function getRequestSignature(data: any, key?: string, secret?: string, recvWindow?: number, timestamp?: number, strictParamValidation?: boolean): Promise<SignedRequestState>;
export declare function getServerTimeEndpoint(urlKey: BinanceBaseUrlKey): string;
export declare function getRestBaseUrl(clientType: BinanceBaseUrlKey, restInverseOptions: RestClientOptions): string;
export declare function isPublicEndpoint(endpoint: string): boolean;
export declare function isWsPong(response: any): any;
export declare function logInvalidOrderId(orderIdProperty: OrderIdProperty, expectedOrderIdPrefix: string, params: NewFuturesOrderParams | CancelOrderParams | NewOCOParams | CancelOCOParams): void;
export declare function appendEventIfMissing(wsMsg: any, wsKey: WsKey): void;
interface WsContext {
    symbol: string | undefined;
    market: WsMarket;
    isTestnet: boolean | undefined;
    isUserData: boolean;
    streamName: string;
    listenKey: string | undefined;
    otherParams: undefined | string[];
}
export declare function getContextFromWsKey(wsKey: WsKey): WsContext;
export declare function getWsKeyWithContext(market: WsMarket, streamName: string, symbol?: string | undefined, listenKey?: string | undefined, ...otherParams: (string | boolean)[]): WsKey;
export declare function appendEventMarket(wsMsg: any, wsKey: WsKey): void;
export declare function asArray<T>(el: T[] | T): T[];
export {};
