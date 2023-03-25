import { WsFormattedMessage, WsMessage24hrMiniTickerRaw, WsMessage24hrTickerFormatted, WsMessageAggTradeFormatted, WsMessageForceOrderFormatted, WsMessageFuturesUserDataAccountConfigUpdateEventFormatted, WsMessageFuturesUserDataAccountConfigUpdateEventRaw, WsMessageFuturesUserDataAccountUpdateFormatted, WsMessageFuturesUserDataAccountUpdateRaw, WsMessageFuturesUserDataEventFormatted, WsMessageFuturesUserDataListenKeyExpiredFormatted, WsMessageFuturesUserDataMarginCallFormatted, WsMessageFuturesUserDataOrderTradeUpdateEventRaw, WsMessageFuturesUserDataTradeUpdateEventFormatted, WsMessageKlineFormatted, WsMessageKlineRaw, WsMessageMarkPriceUpdateEventFormatted, WsMessageSpotBalanceUpdateFormatted, WsMessageSpotOutboundAccountPositionFormatted, WsMessageSpotUserDataEventFormatted, WsMessageSpotUserDataExecutionReportEventFormatted, WsMessageSpotUserDataListStatusEventFormatted, WsMessageTradeFormatted, WsRawMessage, WsUserDataEvents } from '../types/websockets';
/**
 * Use type guards to narrow down types with minimal efforts.
 *
 * The file is organised by Typeguards starting with `WsFormattedMessage` typeguards in the first half
 * and `WsRawMessage` typeguards in the second half.
 *
 */
/**
 * Typeguards for WsFormattedMessage event types:
 */
export declare function isWsFormattedMarkPriceUpdateEvent(data: WsFormattedMessage): data is WsMessageMarkPriceUpdateEventFormatted;
export declare function isWsFormattedMarkPriceUpdateArray(data: WsFormattedMessage): data is WsMessageMarkPriceUpdateEventFormatted[];
/** @deprecated, use isWsFormattedMarkPriceUpdateEvent or isWsFormattedMarkPriceUpdateArray */
export declare function isWsFormattedMarkPriceUpdate(data: WsFormattedMessage): data is WsMessageMarkPriceUpdateEventFormatted[];
export declare function isWsFormattedTrade(data: WsFormattedMessage): data is WsMessageTradeFormatted;
export declare function isWsFormattedKline(data: WsFormattedMessage): data is WsMessageKlineFormatted;
export declare function isWsFormatted24hrTicker(data: WsFormattedMessage): data is WsMessage24hrTickerFormatted;
export declare function isWsFormattedForceOrder(data: WsFormattedMessage): data is WsMessageForceOrderFormatted;
export declare function isWsFormatted24hrTickerArray(data: WsFormattedMessage): data is WsMessage24hrTickerFormatted[];
/**
 * Typeguard to validate a 'Compressed/Aggregate' trade
 */
export declare function isWsAggTradeFormatted(data: WsFormattedMessage): data is WsMessageAggTradeFormatted;
export declare function isWsFormattedUserDataEvent(data: WsFormattedMessage): data is WsUserDataEvents;
export declare function isWsFormattedSpotUserDataEvent(data: WsFormattedMessage): data is WsMessageSpotUserDataEventFormatted;
export declare function isWsFormattedFuturesUserDataEvent(data: WsFormattedMessage): data is WsMessageFuturesUserDataEventFormatted;
export declare function isWsFormattedSpotUserDataExecutionReport(data: WsFormattedMessage): data is WsMessageSpotUserDataExecutionReportEventFormatted;
export declare function isWsFormattedSpotOutboundAccountPosition(data: WsFormattedMessage): data is WsMessageSpotOutboundAccountPositionFormatted;
export declare function isWsFormattedSpotBalanceUpdate(data: WsFormattedMessage): data is WsMessageSpotBalanceUpdateFormatted;
export declare function isWsFormattedSpotUserDataListStatusEvent(data: WsFormattedMessage): data is WsMessageSpotUserDataListStatusEventFormatted;
export declare function isWsFormattedFuturesUserDataAccountUpdate(data: WsFormattedMessage): data is WsMessageFuturesUserDataAccountUpdateFormatted;
export declare function isWsFormattedFuturesUserDataMarginCall(data: WsFormattedMessage): data is WsMessageFuturesUserDataMarginCallFormatted;
export declare function isWsFormattedFuturesUserDataTradeUpdateEvent(data: WsFormattedMessage): data is WsMessageFuturesUserDataTradeUpdateEventFormatted;
export declare function isWsFormattedFuturesUserDataAccountConfigUpdateEvent(data: WsFormattedMessage): data is WsMessageFuturesUserDataAccountConfigUpdateEventFormatted;
export declare function isWsFormattedFuturesUserDataListenKeyExpired(data: WsFormattedMessage): data is WsMessageFuturesUserDataListenKeyExpiredFormatted;
/**
 * Typeguards for WsRawMessage event types:
 */
/**
 * Typeguard to validate all symbol 24hrMiniTicker raw event
 */
export declare function isAll24hrMiniTickerRaw(data: WsRawMessage): data is WsMessage24hrMiniTickerRaw[];
/**
 * Typeguard to validate a single 24hrMiniTicker raw event
 */
export declare function is24hrMiniTickerRaw(data: WsRawMessage): data is WsMessage24hrMiniTickerRaw;
/**
 * Typeguard to validate a single kline raw event
 */
export declare function isKlineRaw(data: WsRawMessage): data is WsMessageKlineRaw;
/**
 * Typeguard to validate a single ORDER_TRADE_UPDATE raw event
 */
export declare function isOrderTradeUpdateRaw(data: WsRawMessage): data is WsMessageFuturesUserDataOrderTradeUpdateEventRaw;
/**
 * Typeguard to validate a single ACCOUNT_CONFIG_UPDATE raw event
 */
export declare function isAccountConfigUpdateRaw(data: WsRawMessage): data is WsMessageFuturesUserDataAccountConfigUpdateEventRaw;
/**
 * Typeguard to validate a single ACCOUNT_UPDATE raw event
 */
export declare function isAccountUpdateRaw(data: WsRawMessage): data is WsMessageFuturesUserDataAccountUpdateRaw;
