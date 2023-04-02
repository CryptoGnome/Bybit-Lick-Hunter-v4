import { AxiosRequestConfig, Method } from 'axios';
import { BinanceBaseUrlKey } from '../types/shared';
import { RestClientOptions, GenericAPIResponse } from './requestUtils';
declare type ApiLimitHeader = 'x-mbx-used-weight' | 'x-mbx-used-weight-1m' | 'x-sapi-used-ip-weight-1m' | 'x-mbx-order-count-1s' | 'x-mbx-order-count-1m' | 'x-mbx-order-count-1h' | 'x-mbx-order-count-1d';
export default abstract class BaseRestClient {
    private timeOffset;
    private syncTimePromise;
    private options;
    private baseUrl;
    private globalRequestOptions;
    private key;
    private secret;
    private baseUrlKey;
    private beautifier;
    apiLimitTrackers: Record<ApiLimitHeader, number>;
    apiLimitLastUpdated: number;
    constructor(baseUrlKey: BinanceBaseUrlKey, options?: RestClientOptions, requestOptions?: AxiosRequestConfig);
    abstract getServerTime(baseUrlKeyOverride?: BinanceBaseUrlKey): Promise<number>;
    getBaseUrlKey(): BinanceBaseUrlKey;
    getRateLimitStates(): {
        lastUpdated: number;
        "x-mbx-used-weight": number;
        "x-mbx-used-weight-1m": number;
        "x-sapi-used-ip-weight-1m": number;
        "x-mbx-order-count-1s": number;
        "x-mbx-order-count-1m": number;
        "x-mbx-order-count-1h": number;
        "x-mbx-order-count-1d": number;
    };
    /**
     * Return time sync offset, automatically set if time sync is enabled. A higher offset means system clock is behind server time.
     */
    getTimeOffset(): number;
    setTimeOffset(value: number): void;
    get(endpoint: string, params?: any): GenericAPIResponse;
    getForBaseUrl(endpoint: string, baseUrlKey: BinanceBaseUrlKey, params?: any): GenericAPIResponse<any>;
    getPrivate(endpoint: string, params?: any): GenericAPIResponse;
    post(endpoint: string, params?: any): GenericAPIResponse;
    postPrivate(endpoint: string, params?: any): GenericAPIResponse;
    put(endpoint: string, params?: any): GenericAPIResponse;
    putPrivate(endpoint: string, params?: any): GenericAPIResponse;
    delete(endpoint: string, params?: any): GenericAPIResponse;
    deletePrivate(endpoint: string, params?: any): GenericAPIResponse;
    /**
     * @private Make a HTTP request to a specific endpoint. Private endpoints are automatically signed.
     */
    _call(method: Method, endpoint: string, params?: any, isPrivate?: boolean, baseUrlOverride?: string): GenericAPIResponse;
    /**
     * @private generic handler to parse request exceptions
     */
    private parseException;
    private updateApiLimitState;
    /**
     * Trigger time sync and store promise
     */
    syncTime(): Promise<void>;
    /**
     * Estimate drift based on client<->server latency
     */
    fetchTimeOffset(): Promise<number>;
}
export {};
