export declare type USDCAPICategory = 'PERPETUAL' | 'OPTION';
export declare type USDCOrderType = 'Limit' | 'Market';
export declare type USDCTimeInForce = 'GoodTillCancel' | 'ImmediateOrCancel' | 'FillOrKill' | 'PostOnly';
export declare type USDCOrderFilter = 'Order' | 'StopOrder';
export interface USDCKlineRequest {
    symbol: string;
    period: string;
    startTime: number;
    limit?: string;
}
export interface USDCTransactionLogRequest {
    type: string;
    baseCoin?: string;
    startTime?: string;
    endTime?: string;
    direction?: string;
    limit?: string;
    cursor?: string;
    category?: USDCAPICategory;
}
export interface USDCPositionsRequest {
    category: USDCAPICategory;
    symbol?: string;
    baseCoin?: string;
    expDate?: string;
    direction?: string;
    limit?: string;
    cursor?: string;
}
