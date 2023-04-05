import { FuturesExchangeInfo } from '../../types/futures';
/** Get min notional filter for a USDM futures symbol */
export declare function getUSDMFuturesSymbolMinNotional(exchangeInfo: FuturesExchangeInfo, symbol: string): number | null;
/** Returns an object where keys are USDM Futures symbols and values are min notionals for that symbol */
export declare function getUSDMFuturesMinNotionalSymbolMap(exchangeInfo: FuturesExchangeInfo): Record<string, number>;
