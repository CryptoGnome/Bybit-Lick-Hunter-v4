"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAccountUpdateRaw = exports.isAccountConfigUpdateRaw = exports.isOrderTradeUpdateRaw = exports.isKlineRaw = exports.is24hrMiniTickerRaw = exports.isAll24hrMiniTickerRaw = exports.isWsFormattedFuturesUserDataListenKeyExpired = exports.isWsFormattedFuturesUserDataAccountConfigUpdateEvent = exports.isWsFormattedFuturesUserDataTradeUpdateEvent = exports.isWsFormattedFuturesUserDataMarginCall = exports.isWsFormattedFuturesUserDataAccountUpdate = exports.isWsFormattedSpotUserDataListStatusEvent = exports.isWsFormattedSpotBalanceUpdate = exports.isWsFormattedSpotOutboundAccountPosition = exports.isWsFormattedSpotUserDataExecutionReport = exports.isWsFormattedFuturesUserDataEvent = exports.isWsFormattedSpotUserDataEvent = exports.isWsFormattedUserDataEvent = exports.isWsAggTradeFormatted = exports.isWsFormatted24hrTickerArray = exports.isWsFormattedForceOrder = exports.isWsFormatted24hrTicker = exports.isWsFormattedKline = exports.isWsFormattedTrade = exports.isWsFormattedMarkPriceUpdate = exports.isWsFormattedMarkPriceUpdateArray = exports.isWsFormattedMarkPriceUpdateEvent = void 0;
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
function isWsFormattedMarkPriceUpdateEvent(data) {
    return !Array.isArray(data) && data.eventType === 'markPriceUpdate';
}
exports.isWsFormattedMarkPriceUpdateEvent = isWsFormattedMarkPriceUpdateEvent;
function isWsFormattedMarkPriceUpdateArray(data) {
    return (Array.isArray(data) &&
        data.length !== 0 &&
        isWsFormattedMarkPriceUpdateEvent(data[0]));
}
exports.isWsFormattedMarkPriceUpdateArray = isWsFormattedMarkPriceUpdateArray;
/** @deprecated, use isWsFormattedMarkPriceUpdateEvent or isWsFormattedMarkPriceUpdateArray */
function isWsFormattedMarkPriceUpdate(data) {
    return isWsFormattedMarkPriceUpdateArray(data);
}
exports.isWsFormattedMarkPriceUpdate = isWsFormattedMarkPriceUpdate;
function isWsFormattedTrade(data) {
    return !Array.isArray(data) && data.eventType === 'trade';
}
exports.isWsFormattedTrade = isWsFormattedTrade;
function isWsFormattedKline(data) {
    return !Array.isArray(data) && data.eventType === 'kline';
}
exports.isWsFormattedKline = isWsFormattedKline;
function isWsFormatted24hrTicker(data) {
    return !Array.isArray(data) && data.eventType === '24hrTicker';
}
exports.isWsFormatted24hrTicker = isWsFormatted24hrTicker;
function isWsFormattedForceOrder(data) {
    return !Array.isArray(data) && data.eventType === 'forceOrder';
}
exports.isWsFormattedForceOrder = isWsFormattedForceOrder;
function isWsFormatted24hrTickerArray(data) {
    return (Array.isArray(data) && data.length !== 0 && isWsFormatted24hrTicker(data[0]));
}
exports.isWsFormatted24hrTickerArray = isWsFormatted24hrTickerArray;
/**
 * Typeguard to validate a 'Compressed/Aggregate' trade
 */
function isWsAggTradeFormatted(data) {
    return !Array.isArray(data) && data.eventType === 'aggTrade';
}
exports.isWsAggTradeFormatted = isWsAggTradeFormatted;
function isWsFormattedUserDataEvent(data) {
    return !Array.isArray(data) && data.wsKey.includes('userData');
}
exports.isWsFormattedUserDataEvent = isWsFormattedUserDataEvent;
function isWsFormattedSpotUserDataEvent(data) {
    return isWsFormattedUserDataEvent(data) && data.wsMarket.includes('spot');
}
exports.isWsFormattedSpotUserDataEvent = isWsFormattedSpotUserDataEvent;
function isWsFormattedFuturesUserDataEvent(data) {
    return isWsFormattedUserDataEvent(data) && data.wsMarket.includes('usdm');
}
exports.isWsFormattedFuturesUserDataEvent = isWsFormattedFuturesUserDataEvent;
function isWsFormattedSpotUserDataExecutionReport(data) {
    return (isWsFormattedSpotUserDataEvent(data) && data.eventType === 'executionReport');
}
exports.isWsFormattedSpotUserDataExecutionReport = isWsFormattedSpotUserDataExecutionReport;
function isWsFormattedSpotOutboundAccountPosition(data) {
    return (isWsFormattedSpotUserDataEvent(data) &&
        data.eventType === 'outboundAccountPosition');
}
exports.isWsFormattedSpotOutboundAccountPosition = isWsFormattedSpotOutboundAccountPosition;
function isWsFormattedSpotBalanceUpdate(data) {
    return (isWsFormattedSpotUserDataEvent(data) && data.eventType === 'balanceUpdate');
}
exports.isWsFormattedSpotBalanceUpdate = isWsFormattedSpotBalanceUpdate;
function isWsFormattedSpotUserDataListStatusEvent(data) {
    return (isWsFormattedSpotUserDataEvent(data) && data.eventType === 'listStatus');
}
exports.isWsFormattedSpotUserDataListStatusEvent = isWsFormattedSpotUserDataListStatusEvent;
function isWsFormattedFuturesUserDataAccountUpdate(data) {
    return (isWsFormattedFuturesUserDataEvent(data) &&
        data.eventType === 'ACCOUNT_UPDATE');
}
exports.isWsFormattedFuturesUserDataAccountUpdate = isWsFormattedFuturesUserDataAccountUpdate;
function isWsFormattedFuturesUserDataMarginCall(data) {
    return (isWsFormattedFuturesUserDataEvent(data) && data.eventType === 'MARGIN_CALL');
}
exports.isWsFormattedFuturesUserDataMarginCall = isWsFormattedFuturesUserDataMarginCall;
function isWsFormattedFuturesUserDataTradeUpdateEvent(data) {
    return (isWsFormattedFuturesUserDataEvent(data) &&
        data.eventType === 'ORDER_TRADE_UPDATE');
}
exports.isWsFormattedFuturesUserDataTradeUpdateEvent = isWsFormattedFuturesUserDataTradeUpdateEvent;
function isWsFormattedFuturesUserDataAccountConfigUpdateEvent(data) {
    return (isWsFormattedFuturesUserDataEvent(data) &&
        data.eventType === 'ACCOUNT_CONFIG_UPDATE');
}
exports.isWsFormattedFuturesUserDataAccountConfigUpdateEvent = isWsFormattedFuturesUserDataAccountConfigUpdateEvent;
function isWsFormattedFuturesUserDataListenKeyExpired(data) {
    return (isWsFormattedFuturesUserDataEvent(data) &&
        data.eventType === 'listenKeyExpired');
}
exports.isWsFormattedFuturesUserDataListenKeyExpired = isWsFormattedFuturesUserDataListenKeyExpired;
/**
 * Typeguards for WsRawMessage event types:
 */
/**
 * Typeguard to validate all symbol 24hrMiniTicker raw event
 */
function isAll24hrMiniTickerRaw(data) {
    return Array.isArray(data) && data[0].e === '24hrMiniTicker';
}
exports.isAll24hrMiniTickerRaw = isAll24hrMiniTickerRaw;
/**
 * Typeguard to validate a single 24hrMiniTicker raw event
 */
function is24hrMiniTickerRaw(data) {
    return !Array.isArray(data) && data.e === '24hrMiniTicker';
}
exports.is24hrMiniTickerRaw = is24hrMiniTickerRaw;
/**
 * Typeguard to validate a single kline raw event
 */
function isKlineRaw(data) {
    return !Array.isArray(data) && data.e === 'kline';
}
exports.isKlineRaw = isKlineRaw;
/**
 * Typeguard to validate a single ORDER_TRADE_UPDATE raw event
 */
function isOrderTradeUpdateRaw(data) {
    return !Array.isArray(data) && data.e === 'ORDER_TRADE_UPDATE';
}
exports.isOrderTradeUpdateRaw = isOrderTradeUpdateRaw;
/**
 * Typeguard to validate a single ACCOUNT_CONFIG_UPDATE raw event
 */
function isAccountConfigUpdateRaw(data) {
    return !Array.isArray(data) && data.e === 'ACCOUNT_CONFIG_UPDATE';
}
exports.isAccountConfigUpdateRaw = isAccountConfigUpdateRaw;
/**
 * Typeguard to validate a single ACCOUNT_UPDATE raw event
 */
function isAccountUpdateRaw(data) {
    return !Array.isArray(data) && data.e === 'ACCOUNT_UPDATE';
}
exports.isAccountUpdateRaw = isAccountUpdateRaw;
//# sourceMappingURL=typeGuards.js.map