import { APIResponseWithTime, AssetExchangeRecordsReq, CoinParam, InverseActiveConditionalOrderRequest, InverseActiveOrdersRequest, InverseCancelConditionalOrderRequest, InverseCancelOrderRequest, InverseChangePositionMarginRequest, InverseConditionalOrderRequest, InverseGetClosedPnlRequest, InverseGetOrderRequest, InverseGetTradeRecordsRequest, InverseOrderRequest, InverseReplaceConditionalOrderRequest, InverseReplaceOrderRequest, InverseSetLeverageRequest, InverseSetMarginTypeRequest, InverseSetSlTpPositionModeRequest, InverseSetTradingStopRequest, SymbolInfo, SymbolIntervalFromLimitParam, SymbolLimitParam, SymbolParam, SymbolPeriodLimitParam, WalletFundRecordsReq, WithdrawRecordsReq } from './types';
import BaseRestClient from './util/BaseRestClient';
/**
 * REST API client for Inverse Perpetual Futures APIs (v2)
 */
export declare class InverseClient extends BaseRestClient {
    getClientType(): "inverse";
    fetchServerTime(): Promise<number>;
    /**
     *
     * Market Data Endpoints
     *
     */
    getOrderBook(params: SymbolParam): Promise<APIResponseWithTime<any[]>>;
    getKline(params: SymbolIntervalFromLimitParam): Promise<APIResponseWithTime<any[]>>;
    /**
     * Get latest information for symbol
     */
    getTickers(params?: Partial<SymbolParam>): Promise<APIResponseWithTime<any[]>>;
    getTrades(params: SymbolLimitParam): Promise<APIResponseWithTime<any[]>>;
    getSymbols(): Promise<APIResponseWithTime<SymbolInfo[]>>;
    getMarkPriceKline(params: SymbolIntervalFromLimitParam): Promise<APIResponseWithTime<any[]>>;
    getIndexPriceKline(params: SymbolIntervalFromLimitParam): Promise<APIResponseWithTime<any[]>>;
    getPremiumIndexKline(params: SymbolIntervalFromLimitParam): Promise<APIResponseWithTime<any[]>>;
    /**
     *
     * Market Data : Advanced
     *
     */
    getOpenInterest(params: SymbolPeriodLimitParam): Promise<APIResponseWithTime<any[]>>;
    getLatestBigDeal(params: SymbolLimitParam): Promise<APIResponseWithTime<any[]>>;
    getLongShortRatio(params: SymbolPeriodLimitParam): Promise<APIResponseWithTime<any[]>>;
    /**
     *
     * Account Data Endpoints
     *
     */
    getApiKeyInfo(): Promise<APIResponseWithTime<any>>;
    /**
     *
     * Wallet Data Endpoints
     *
     */
    getWalletBalance(params?: Partial<CoinParam>): Promise<APIResponseWithTime<any>>;
    getWalletFundRecords(params?: WalletFundRecordsReq): Promise<APIResponseWithTime<any>>;
    getWithdrawRecords(params?: WithdrawRecordsReq): Promise<APIResponseWithTime<any>>;
    getAssetExchangeRecords(params?: AssetExchangeRecordsReq): Promise<APIResponseWithTime<any>>;
    /**
     *
     * API Data Endpoints
     *
     */
    getServerTime(): Promise<APIResponseWithTime<{}>>;
    getApiAnnouncements(): Promise<APIResponseWithTime<any[]>>;
    /**
     *
     * Account Data Endpoints
     *
     */
    /**
     * Active orders
     */
    placeActiveOrder(orderRequest: InverseOrderRequest): Promise<APIResponseWithTime<any>>;
    getActiveOrderList(params: InverseActiveOrdersRequest): Promise<APIResponseWithTime<any>>;
    cancelActiveOrder(params: InverseCancelOrderRequest): Promise<APIResponseWithTime<any>>;
    cancelAllActiveOrders(params: SymbolParam): Promise<APIResponseWithTime<any>>;
    replaceActiveOrder(params: InverseReplaceOrderRequest): Promise<APIResponseWithTime<any>>;
    queryActiveOrder(params: InverseGetOrderRequest): Promise<APIResponseWithTime<any>>;
    /**
     * Conditional orders
     */
    placeConditionalOrder(params: InverseConditionalOrderRequest): Promise<APIResponseWithTime<any>>;
    /** get conditional order list. This may see delays, use queryConditionalOrder() for real-time queries */
    getConditionalOrder(params: InverseActiveConditionalOrderRequest): Promise<APIResponseWithTime<any>>;
    cancelConditionalOrder(params: InverseCancelConditionalOrderRequest): Promise<APIResponseWithTime<any>>;
    cancelAllConditionalOrders(params: SymbolParam): Promise<APIResponseWithTime<any>>;
    replaceConditionalOrder(params: InverseReplaceConditionalOrderRequest): Promise<APIResponseWithTime<any>>;
    queryConditionalOrder(params: InverseGetOrderRequest): Promise<APIResponseWithTime<any>>;
    /**
     * Position
     */
    getPosition(params?: Partial<SymbolParam>): Promise<APIResponseWithTime<any>>;
    changePositionMargin(params: InverseChangePositionMarginRequest): Promise<APIResponseWithTime<any>>;
    setTradingStop(params: InverseSetTradingStopRequest): Promise<APIResponseWithTime<any>>;
    setUserLeverage(params: InverseSetLeverageRequest): Promise<APIResponseWithTime<any>>;
    getTradeRecords(params: InverseGetTradeRecordsRequest): Promise<APIResponseWithTime<any>>;
    getClosedPnl(params: InverseGetClosedPnlRequest): Promise<APIResponseWithTime<any>>;
    setSlTpPositionMode(params: InverseSetSlTpPositionModeRequest): Promise<APIResponseWithTime<any>>;
    setMarginType(params: InverseSetMarginTypeRequest): Promise<APIResponseWithTime<any>>;
    /**
     * Funding
     */
    getLastFundingRate(params: SymbolParam): Promise<APIResponseWithTime<any>>;
    getMyLastFundingFee(params: SymbolParam): Promise<APIResponseWithTime<any>>;
    getPredictedFunding(params: SymbolParam): Promise<APIResponseWithTime<any>>;
    /**
     * LCP Info
     */
    getLcpInfo(params: SymbolParam): Promise<APIResponseWithTime<any>>;
}
