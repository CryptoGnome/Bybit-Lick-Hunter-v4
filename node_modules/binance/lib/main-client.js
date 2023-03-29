"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotClient = exports.MainClient = void 0;
const requestUtils_1 = require("./util/requestUtils");
const BaseRestClient_1 = __importDefault(require("./util/BaseRestClient"));
class MainClient extends BaseRestClient_1.default {
    constructor(restClientOptions = {}, requestOptions = {}) {
        super('spot1', restClientOptions, requestOptions);
        return this;
    }
    /**
     * Abstraction required by each client to aid with time sync / drift handling
     */
    getServerTime(baseUrlKeyOverride) {
        return __awaiter(this, void 0, void 0, function* () {
            const baseUrlKey = baseUrlKeyOverride || this.getBaseUrlKey();
            const endpoint = requestUtils_1.getServerTimeEndpoint(baseUrlKey);
            const response = yield this.getForBaseUrl(endpoint, baseUrlKey);
            return response.serverTime;
        });
    }
    /**
     *
     * Wallet Endpoints
     *
     **/
    getSystemStatus() {
        return this.get('sapi/v1/system/status');
    }
    getBalances() {
        return this.getPrivate('sapi/v1/capital/config/getall');
    }
    getDailyAccountSnapshot(params) {
        return this.getPrivate('sapi/v1/accountSnapshot', params);
    }
    disableFastWithdrawSwitch() {
        return this.postPrivate('sapi/v1/account/disableFastWithdrawSwitch');
    }
    enableFastWithdrawSwitch() {
        return this.postPrivate('sapi/v1/account/enableFastWithdrawSwitch');
    }
    withdraw(params) {
        return this.postPrivate('sapi/v1/capital/withdraw/apply', params);
    }
    getDepositHistory(params) {
        return this.getPrivate('sapi/v1/capital/deposit/hisrec', params);
    }
    getWithdrawHistory(params) {
        return this.getPrivate('sapi/v1/capital/withdraw/history', params);
    }
    getDepositAddress(params) {
        return this.getPrivate('sapi/v1/capital/deposit/address', params);
    }
    getAccountStatus() {
        return this.getPrivate('sapi/v1/account/status');
    }
    getDustLog(params) {
        return this.getPrivate('sapi/v1/asset/dribblet', params);
    }
    convertDustToBnb(params) {
        return this.postPrivate('sapi/v1/asset/dust', params);
    }
    getDust() {
        return this.postPrivate('sapi/v1/asset/dust-btc');
    }
    getAssetDividendRecord(params) {
        return this.getPrivate('sapi/v1/asset/assetDividend', params);
    }
    getAssetDetail(params) {
        return this.getPrivate('sapi/v1/asset/assetDetail', params);
    }
    getTradeFee(params) {
        return this.getPrivate('sapi/v1/asset/tradeFee', params);
    }
    submitUniversalTransfer(params) {
        return this.postPrivate('sapi/v1/asset/transfer', params);
    }
    getUniversalTransferHistory(params) {
        return this.getPrivate('sapi/v1/asset/transfer', params);
    }
    getApiTradingStatus() {
        return this.getPrivate('sapi/v1/account/apiTradingStatus');
    }
    getApiKeyPermissions() {
        return this.getPrivate('sapi/v1/account/apiRestrictions');
    }
    /**
     *
     * Sub-Account Endpoints
     *
     **/
    createVirtualSubAccount(params) {
        return this.postPrivate('sapi/v1/sub-account/virtualSubAccount', params);
    }
    getSubAccountList(params) {
        return this.getPrivate('sapi/v1/sub-account/list', params);
    }
    getSubAccountSpotAssetTransferHistory(params) {
        return this.getPrivate('sapi/v1/sub-account/sub/transfer/history', params);
    }
    getSubAccountFuturesAssetTransferHistory(params) {
        return this.getPrivate('sapi/v1/sub-account/futures/internalTransfer', params);
    }
    subAccountFuturesAssetTransfer(params) {
        return this.postPrivate('sapi/v1/sub-account/futures/internalTransfer', params);
    }
    getSubAccountAssets(params) {
        return this.getPrivate('sapi/v3/sub-account/assets', params);
    }
    getSubAccountSpotAssetsSummary(params) {
        return this.getPrivate('sapi/v1/sub-account/spotSummary', params);
    }
    getSubAccountDepositAddress(params) {
        return this.getPrivate('sapi/v1/capital/deposit/subAddress', params);
    }
    getSubAccountDepositHistory(params) {
        return this.getPrivate('sapi/v1/capital/deposit/subHisrec', params);
    }
    getSubAccountStatusOnMarginOrFutures(params) {
        return this.getPrivate('sapi/v1/sub-account/status', params);
    }
    subAccountEnableMargin(email) {
        return this.postPrivate('sapi/v1/sub-account/margin/enable', { email });
    }
    getSubAccountDetailOnMarginAccount(email) {
        return this.getPrivate('sapi/v1/sub-account/margin/account', { email });
    }
    getSubAccountsSummaryOfMarginAccount() {
        return this.getPrivate('sapi/v1/sub-account/margin/accountSummary');
    }
    subAccountEnableFutures(email) {
        return this.postPrivate('sapi/v1/sub-account/futures/enable', { email });
    }
    getSubAccountFuturesAccountDetail(email) {
        return this.getPrivate('sapi/v1/sub-account/futures/account', { email });
    }
    getSubAccountFuturesAccountSummary() {
        return this.getPrivate('sapi/v1/sub-account/futures/accountSummary');
    }
    getSubAccountFuturesPositionRisk(email) {
        return this.getPrivate('sapi/v1/sub-account/futures/positionRisk', {
            email,
        });
    }
    subAccountFuturesTransfer(params) {
        return this.postPrivate('sapi/v1/sub-account/futures/transfer', params);
    }
    subAccountMarginTransfer(params) {
        return this.postPrivate('sapi/v1/sub-account/margin/transfer', params);
    }
    subAccountTransferToSameMaster(params) {
        return this.postPrivate('sapi/v1/sub-account/transfer/subToSub', params);
    }
    subAccountTransferToMaster(params) {
        return this.postPrivate('sapi/v1/sub-account/transfer/subToMaster', params);
    }
    subAccountTransferHistory(params) {
        return this.getPrivate('sapi/v1/sub-account/transfer/subUserHistory', params);
    }
    subAccountUniversalTransfer(params) {
        return this.postPrivate('sapi/v1/sub-account/universalTransfer', params);
    }
    getSubAccountUniversalTransferHistory(params) {
        return this.getPrivate('sapi/v1/sub-account/universalTransfer', params);
    }
    getSubAccountDetailOnFuturesAccountV2(params) {
        return this.getPrivate('sapi/v2/sub-account/futures/account', params);
    }
    getSubAccountSummaryOnFuturesAccountV2(params) {
        return this.getPrivate('sapi/v2/sub-account/futures/accountSummary', params);
    }
    getSubAccountFuturesPositionRiskV2(params) {
        return this.getPrivate('sapi/v2/sub-account/futures/positionRisk', params);
    }
    subAccountEnableLeverageToken(params) {
        return this.postPrivate('sapi/v1/sub-account/blvt/enable', params);
    }
    subAccountEnableOrDisableIPRestriction(params) {
        return this.postPrivate('sapi/v1/sub-account/subAccountApi/ipRestriction', params);
    }
    subAccountAddIPList(params) {
        return this.postPrivate('sapi/v1/sub-account/subAccountApi/ipRestriction/ipList', params);
    }
    getSubAccountIPRestriction(params) {
        return this.getPrivate('sapi/v1/sub-account/subAccountApi/ipRestriction', params);
    }
    subAccountDeleteIPList(params) {
        return this.deletePrivate('sapi/v1/sub-account/subAccountApi/ipRestriction/ipList', params);
    }
    depositAssetsIntoManagedSubAccount(params) {
        return this.postPrivate('sapi/v1/managed-subaccount/deposit', params);
    }
    getManagedSubAccountAssetDetails(email) {
        return this.getPrivate('sapi/v1/managed-subaccount/asset', { email });
    }
    withdrawAssetsFromManagedSubAccount(params) {
        return this.postPrivate('sapi/v1/managed-subaccount/withdraw', params);
    }
    /**
     * Broker Endpoints
     */
    getBrokerIfNewSpotUser() {
        return this.getPrivate('sapi/v1/apiReferral/ifNewUser');
    }
    getBrokerSubAccountDepositHistory(params) {
        return this.getPrivate('sapi/v1/broker/subAccount/depositHist', params);
    }
    getBrokerUserCustomisedId(market) {
        const prefix = market === 'spot' ? 'sapi' : 'fapi';
        return this.getPrivate(prefix + '/v1/apiReferral/userCustomization');
    }
    createBrokerSubAccount(params) {
        return this.postPrivate('sapi/v1/broker/subAccount', params);
    }
    getBrokerSubAccountHistory(params) {
        return this.getPrivate('sapi/v1/broker/transfer', params);
    }
    getBrokerSubAccount(params) {
        return this.getPrivate('sapi/v1/broker/subAccount', params);
    }
    getApiKeyBrokerSubAccount(params) {
        return this.getPrivate('sapi/v1/broker/subAccountApi', params);
    }
    createApiKeyBrokerSubAccount(params) {
        return this.postPrivate('sapi/v1/broker/subAccountApi', params);
    }
    deleteApiKeyBrokerSubAccount(params) {
        return this.deletePrivate('sapi/v1/broker/subAccountApi', params);
    }
    changePermissionApiKeyBrokerSubAccount(params) {
        return this.postPrivate('sapi/v1/broker/subAccountApi/permission', params);
    }
    changeComissionBrokerSubAccount(params) {
        return this.postPrivate('sapi/v1/broker/subAccountApi/permission', params);
    }
    enableUniversalTransferApiKeyBrokerSubAccount(params) {
        return this.postPrivate('sapi/v1/broker/subAccountApi/permission/universalTransfer', params);
    }
    enableMarginBrokerSubAccount(params) {
        return this.postPrivate('sapi/v1/broker/subAccount/futures', params);
    }
    enableFuturesBrokerSubAccount(params) {
        return this.postPrivate('sapi/v1/broker/subAccount', params);
    }
    enableMarginApiKeyBrokerSubAccount(params) {
        return this.postPrivate('sapi/v1/broker/subAccount/margin', params);
    }
    transferBrokerSubAccount(params) {
        return this.postPrivate('sapi/v1/broker/transfer', params);
    }
    universalTransferBroker(params) {
        return this.postPrivate('sapi/v1/broker/universalTransfer', params);
    }
    getUniversalTransferBroker(params) {
        return this.getPrivate('sapi/v1/broker/universalTransfer', params);
    }
    getBrokerInfo() {
        return this.getPrivate('sapi/v1/broker/info');
    }
    // USD & Coin-M can be found under API getIncome() (find "API rebate" in results)
    getBrokerSpotRebateHistory(days, customerId) {
        if (days === 7) {
            return this.getPrivate('sapi/v1/apiReferral/rebate/recentRecord', {
                customerId,
            });
        }
        if (days === 30) {
            return this.getPrivate('sapi/v1/apiReferral/rebate/historicalRecord', {
                customerId,
            });
        }
    }
    /**
     *
     * Market Data Endpoints
     *
     **/
    testConnectivity() {
        return this.get('api/v3/ping');
    }
    getExchangeInfo(params) {
        const symbols = (params === null || params === void 0 ? void 0 : params.symbols) && JSON.stringify(params.symbols);
        const symbol = params === null || params === void 0 ? void 0 : params.symbol;
        let urlSuffix = '';
        if (symbol) {
            urlSuffix += '?symbol=' + symbol;
        }
        else if (symbols) {
            urlSuffix += '?symbols=' + symbols;
        }
        return this.get('api/v3/exchangeInfo' + urlSuffix);
    }
    getOrderBook(params) {
        return this.get('api/v3/depth', params);
    }
    getRecentTrades(params) {
        return this.get('api/v3/trades', params);
    }
    getHistoricalTrades(params) {
        return this.get('api/v3/historicalTrades', params);
    }
    getAggregateTrades(params) {
        return this.get('api/v3/aggTrades', params);
    }
    getKlines(params) {
        return this.get('api/v3/klines', params);
    }
    getAvgPrice(params) {
        return this.get('api/v3/avgPrice', params);
    }
    get24hrChangeStatististics(params) {
        if (!(params === null || params === void 0 ? void 0 : params.symbol)) {
            return this.get('api/v3/ticker/24hr');
        }
        return this.get('api/v3/ticker/24hr', params);
    }
    getSymbolPriceTicker(params) {
        return this.get('api/v3/ticker/price', params);
    }
    getSymbolOrderBookTicker(params) {
        return this.get('api/v3/ticker/bookTicker', params);
    }
    /**
     *
     * Spot Account/Trade Endpoints
     *
     **/
    testNewOrder(params) {
        this.validateOrderId(params, 'newClientOrderId');
        return this.postPrivate('api/v3/order/test', params);
    }
    submitNewOrder(params) {
        this.validateOrderId(params, 'newClientOrderId');
        return this.postPrivate('api/v3/order', params);
    }
    cancelOrder(params) {
        return this.deletePrivate('api/v3/order', params);
    }
    cancelAllSymbolOrders(params) {
        return this.deletePrivate('api/v3/openOrders', params);
    }
    getOrder(params) {
        return this.getPrivate('api/v3/order', params);
    }
    getOpenOrders(params) {
        return this.getPrivate('api/v3/openOrders', params);
    }
    getAllOrders(params) {
        return this.getPrivate('api/v3/allOrders', params);
    }
    submitNewOCO(params) {
        this.validateOrderId(params, 'listClientOrderId');
        this.validateOrderId(params, 'limitClientOrderId');
        this.validateOrderId(params, 'stopClientOrderId');
        return this.postPrivate('api/v3/order/oco', params);
    }
    cancelOCO(params) {
        this.validateOrderId(params, 'newClientOrderId');
        return this.deletePrivate('api/v3/orderList', params);
    }
    getOCO(params) {
        return this.getPrivate('api/v3/orderList', params);
    }
    getAllOCO(params) {
        return this.getPrivate('api/v3/allOrderList', params);
    }
    getAllOpenOCO() {
        return this.getPrivate('api/v3/openOrderList');
    }
    getAccountInformation() {
        return this.getPrivate('api/v3/account');
    }
    getAccountTradeList(params) {
        return this.getPrivate('api/v3/myTrades', params);
    }
    /**
     *
     * Margin Account/Trade Endpoints
     *
     **/
    crossMarginAccountTransfer(params) {
        return this.postPrivate('sapi/v1/margin/transfer', params);
    }
    marginAccountBorrow(params) {
        return this.postPrivate('sapi/v1/margin/loan', params);
    }
    marginAccountRepay(params) {
        return this.postPrivate('sapi/v1/margin/repay', params);
    }
    queryMarginAsset(params) {
        return this.get('sapi/v1/margin/asset', params);
    }
    queryCrossMarginPair(params) {
        return this.get('sapi/v1/margin/pair', params);
    }
    getAllMarginAssets() {
        return this.get('sapi/v1/margin/allAssets');
    }
    getAllCrossMarginPairs() {
        return this.get('sapi/v1/margin/allPairs');
    }
    queryMarginPriceIndex(params) {
        return this.get('sapi/v1/margin/priceIndex', params);
    }
    marginAccountNewOrder(params) {
        this.validateOrderId(params, 'newClientOrderId');
        return this.postPrivate('sapi/v1/margin/order', params);
    }
    marginAccountCancelOrder(params) {
        return this.deletePrivate('sapi/v1/margin/order', params);
    }
    marginAccountCancelOpenOrders(params) {
        return this.deletePrivate('sapi/v1/margin/openOrders', params);
    }
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#get-cross-margin-transfer-history-user_data
    queryLoanRecord(params) {
        return this.getPrivate('sapi/v1/margin/loan', params);
    }
    queryRepayRecord(params) {
        return this.getPrivate('sapi/v1/margin/repay', params);
    }
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#get-interest-history-user_data
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#get-force-liquidation-record-user_data
    queryCrossMarginAccountDetails() {
        return this.getPrivate('sapi/v1/margin/account');
    }
    queryMarginAccountOrder(params) {
        return this.getPrivate('sapi/v1/margin/order', params);
    }
    queryMarginAccountOpenOrders(params) {
        return this.getPrivate('sapi/v1/margin/openOrders', params);
    }
    queryMarginAccountAllOrders(params) {
        return this.getPrivate('sapi/v1/margin/allOrders', params);
    }
    marginAccountNewOCO(params) {
        this.validateOrderId(params, 'listClientOrderId');
        this.validateOrderId(params, 'limitClientOrderId');
        this.validateOrderId(params, 'stopClientOrderId');
        return this.postPrivate('sapi/v1/margin/order/oco', params);
    }
    marginAccountCancelOCO(params) {
        this.validateOrderId(params, 'newClientOrderId');
        return this.deletePrivate('sapi/v1/margin/orderList', params);
    }
    queryMarginAccountOCO(params) {
        return this.getPrivate('sapi/v1/margin/orderList', params);
    }
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#query-margin-account-39-s-all-oco-user_data
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#query-margin-account-39-s-open-oco-user_data
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#query-margin-account-39-s-trade-list-user_data
    queryMaxBorrow(params) {
        return this.getPrivate('sapi/v1/margin/maxBorrowable', params);
    }
    queryMaxTransferOutAmount(params) {
        return this.getPrivate('sapi/v1/margin/maxTransferable', params);
    }
    isolatedMarginAccountTransfer(params) {
        return this.postPrivate('sapi/v1/margin/isolated/transfer', params);
    }
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#get-isolated-margin-transfer-history-user_data
    getIsolatedMarginAccountInfo(params) {
        return this.getPrivate('sapi/v1/margin/isolated/account', { params });
    }
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#disable-isolated-margin-account-trade
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#enable-isolated-margin-account-trade
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#query-enabled-isolated-margin-account-limit-user_data
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#query-isolated-margin-symbol-user_data
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#get-all-isolated-margin-symbol-user_data
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#toggle-bnb-burn-on-spot-trade-and-margin-interest-user_data
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#get-bnb-burn-status-user_data
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#query-margin-interest-rate-history-user_data
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#query-cross-margin-fee-data-user_data
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#query-isolated-margin-fee-data-user_data
    // TODO - https://binance-docs.github.io/apidocs/spot/en/#query-isolated-margin-tier-data-user_data
    /**
     *
     * User Data Stream Endpoints
     *
     **/
    // spot
    getSpotUserDataListenKey() {
        return this.post('api/v3/userDataStream');
    }
    keepAliveSpotUserDataListenKey(listenKey) {
        return this.put(`api/v3/userDataStream?listenKey=${listenKey}`);
    }
    closeSpotUserDataListenKey(listenKey) {
        return this.delete(`api/v3/userDataStream?listenKey=${listenKey}`);
    }
    // margin
    getMarginUserDataListenKey() {
        return this.post('sapi/v1/userDataStream');
    }
    keepAliveMarginUserDataListenKey(listenKey) {
        return this.put(`sapi/v1/userDataStream?listenKey=${listenKey}`);
    }
    closeMarginUserDataListenKey(listenKey) {
        return this.delete(`sapi/v1/userDataStream?listenKey=${listenKey}`);
    }
    // isolated margin
    getIsolatedMarginUserDataListenKey(params) {
        return this.post(`sapi/v1/userDataStream/isolated?${requestUtils_1.serialiseParams(params)}`);
    }
    keepAliveIsolatedMarginUserDataListenKey(params) {
        return this.put(`sapi/v1/userDataStream/isolated?${requestUtils_1.serialiseParams(params)}`);
    }
    closeIsolatedMarginUserDataListenKey(params) {
        return this.delete(`sapi/v1/userDataStream/isolated?${requestUtils_1.serialiseParams(params)}`);
    }
    /**
     *
     * Staking Endpoints
     *
     **/
    //TODO: https://binance-docs.github.io/apidocs/spot/en/#purchase-staking-product-user_data
    //TODO: https://binance-docs.github.io/apidocs/spot/en/#redeem-staking-product-user_data
    //TODO: https://binance-docs.github.io/apidocs/spot/en/#set-auto-staking-user_data
    getStakingProducts(params) {
        return this.getPrivate(`sapi/v1/staking/productList`, params);
    }
    getStakingProductPosition(params) {
        return this.getPrivate('sapi/v1/staking/position', params);
    }
    getStakingHistory(params) {
        return this.getPrivate('sapi/v1/staking/stakingRecord', params);
    }
    getPersonalLeftQuotaOfStakingProduct(params) {
        return this.getPrivate('sapi/v1/staking/personalLeftQuota', params);
    }
    /**
     *
     * Savings Endpoints
     *
     **/
    getFlexibleSavingProducts(params) {
        return this.getPrivate(`sapi/v1/lending/daily/product/list`, params);
    }
    purchaseFlexibleProduct(params) {
        return this.postPrivate(`sapi/v1/lending/daily/purchase`, params);
    }
    redeemFlexibleProduct(params) {
        return this.postPrivate(`sapi/v1/lending/daily/redeem`, params);
    }
    getFlexibleProductPosition(params) {
        return this.getPrivate(`sapi/v1/lending/daily/token/position`, params);
    }
    getLeftDailyPurchaseQuotaFlexibleProduct(params) {
        return this.getPrivate(`sapi/v1/lending/daily/userLeftQuota`, params);
    }
    getLeftDailyRedemptionQuotaFlexibleProduct(params) {
        return this.getPrivate(`sapi/v1/lending/daily/userRedemptionQuota`, params);
    }
    purchaseFixedAndActivityProject(params) {
        return this.postPrivate(`sapi/v1/lending/customizedFixed/purchase`, params);
    }
    getFixedAndActivityProjects(params) {
        return this.getPrivate(`sapi/v1/lending/project/list`, params);
    }
    getFixedAndActivityProductPosition(params) {
        return this.getPrivate(`sapi/v1/lending/project/position/list`, params);
    }
    getLendingAccount() {
        return this.getPrivate(`sapi/v1/lending/union/account`);
    }
    getPurchaseRecord(params) {
        return this.getPrivate(`sapi/v1/lending/union/purchaseRecord`, params);
    }
    getRedemptionRecord(params) {
        return this.getPrivate(`sapi/v1/lending/union/redemptionRecord`, params);
    }
    getInterestHistory(params) {
        return this.getPrivate(`sapi/v1/lending/union/interestHistory`, params);
    }
    changeFixedAndActivityPositionToDailyPosition(params) {
        return this.postPrivate(`sapi/v1/lending/positionChanged`, params);
    }
    /**
     *
     * Mining Endpoints
     *
     **/
    //TODO: https://binance-docs.github.io/apidocs/spot/en/#mining-endpoints
    /**
     *
     * Futures Management Endpoints
     * Note: to trade futures use the usdm-client or coinm-client. The spot client only has the futures endpoints listed in the "spot" docs category
     *
     **/
    //TODO: https://binance-docs.github.io/apidocs/spot/en/#futures
    /**
     *
     * BLVT Endpoints
     *
     **/
    //TODO: https://binance-docs.github.io/apidocs/spot/en/#blvt-endpoints
    /**
     *
     * BSwap Endpoints
     *
     **/
    getBSwapLiquidity(params) {
        return this.getPrivate('sapi/v1/bswap/liquidity');
    }
    addBSwapLiquidity(params) {
        return this.postPrivate('sapi/v1/bswap/liquidityAdd');
    }
    removeBSwapLiquidity(params) {
        return this.postPrivate('sapi/v1/bswap/liquidityRemove');
    }
    getBSwapOperations(params) {
        return this.getPrivate('sapi/v1/bswap/liquidityOps');
    }
    //TODO: add missing bswap-endpoints https://binance-docs.github.io/apidocs/spot/en/#bswap-endpoints
    /**
     * Validate syntax meets requirements set by binance. Log warning if not.
     */
    validateOrderId(params, orderIdProperty) {
        const apiCategory = 'spot';
        if (!params[orderIdProperty]) {
            params[orderIdProperty] = requestUtils_1.generateNewOrderId(apiCategory);
            return;
        }
        const expectedOrderIdPrefix = `x-${requestUtils_1.getOrderIdPrefix(apiCategory)}`;
        if (!params[orderIdProperty].startsWith(expectedOrderIdPrefix)) {
            requestUtils_1.logInvalidOrderId(orderIdProperty, expectedOrderIdPrefix, params);
        }
    }
}
exports.MainClient = MainClient;
/**
 * @deprecated use MainClient instead of SpotClient (it is the same)
 */
exports.SpotClient = MainClient;
//# sourceMappingURL=main-client.js.map