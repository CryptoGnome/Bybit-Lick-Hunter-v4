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
const axios_1 = __importDefault(require("axios"));
const requestUtils_1 = require("./requestUtils");
const beautifier_1 = __importDefault(require("./beautifier"));
class BaseRestClient {
    constructor(baseUrlKey, options = {}, requestOptions = {}) {
        this.timeOffset = 0;
        this.options = Object.assign({ recvWindow: 5000, 
            // how often to sync time drift with binance servers
            syncIntervalMs: 3600000, 
            // if true, we'll throw errors if any params are undefined
            strictParamValidation: false, 
            // disable the time sync mechanism by default
            disableTimeSync: true }, options);
        this.globalRequestOptions = Object.assign({ 
            // in ms == 5 minutes by default
            timeout: 1000 * 60 * 5, headers: {
            // 'content-type': 'application/x-www-form-urlencoded';
            } }, requestOptions);
        this.key = options.api_key;
        this.secret = options.api_secret;
        if (this.key) {
            this.globalRequestOptions.headers['X-MBX-APIKEY'] = this.key;
        }
        this.baseUrlKey = this.options.baseUrlKey || baseUrlKey;
        this.baseUrl = requestUtils_1.getRestBaseUrl(this.baseUrlKey, this.options);
        if (this.key && !this.secret) {
            throw new Error('API Key & Secret are both required for private enpoints');
        }
        if (this.options.disableTimeSync !== true) {
            this.syncTime();
            setInterval(this.syncTime.bind(this), +this.options.syncIntervalMs);
        }
        if (this.options.beautifyResponses) {
            this.beautifier = new beautifier_1.default();
        }
        this.syncTimePromise = null;
        this.apiLimitTrackers = {
            'x-mbx-used-weight': 0,
            'x-mbx-used-weight-1m': 0,
            'x-sapi-used-ip-weight-1m': 0,
            'x-mbx-order-count-1s': 0,
            'x-mbx-order-count-1m': 0,
            'x-mbx-order-count-1h': 0,
            'x-mbx-order-count-1d': 0,
        };
    }
    getBaseUrlKey() {
        return this.baseUrlKey;
    }
    getRateLimitStates() {
        return Object.assign(Object.assign({}, this.apiLimitTrackers), { lastUpdated: this.apiLimitLastUpdated });
    }
    /**
     * Return time sync offset, automatically set if time sync is enabled. A higher offset means system clock is behind server time.
     */
    getTimeOffset() {
        return this.timeOffset;
    }
    setTimeOffset(value) {
        this.timeOffset = value;
    }
    get(endpoint, params) {
        return this._call('GET', endpoint, params);
    }
    getForBaseUrl(endpoint, baseUrlKey, params) {
        const baseUrl = requestUtils_1.getRestBaseUrl(baseUrlKey, {});
        return this._call('GET', endpoint, params, false, baseUrl);
    }
    getPrivate(endpoint, params) {
        return this._call('GET', endpoint, params, true);
    }
    post(endpoint, params) {
        return this._call('POST', endpoint, params);
    }
    postPrivate(endpoint, params) {
        return this._call('POST', endpoint, params, true);
    }
    put(endpoint, params) {
        return this._call('PUT', endpoint, params);
    }
    putPrivate(endpoint, params) {
        return this._call('PUT', endpoint, params, true);
    }
    delete(endpoint, params) {
        return this._call('DELETE', endpoint, params);
    }
    deletePrivate(endpoint, params) {
        return this._call('DELETE', endpoint, params, true);
    }
    /**
     * @private Make a HTTP request to a specific endpoint. Private endpoints are automatically signed.
     */
    _call(method, endpoint, params, isPrivate, baseUrlOverride) {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = Date.now() + (this.getTimeOffset() || 0);
            if (isPrivate && (!this.key || !this.secret)) {
                throw new Error('Private endpoints require api and private keys to be set');
            }
            // Handles serialisation of params into query string (url?key1=value1&key2=value2), handles encoding of values, adds timestamp and signature to request.
            const { serialisedParams, signature, requestBody } = yield requestUtils_1.getRequestSignature(params, this.key, this.secret, this.options.recvWindow, timestamp, this.options.strictParamValidation);
            const baseUrl = baseUrlOverride || this.baseUrl;
            const options = Object.assign(Object.assign({}, this.globalRequestOptions), { url: [baseUrl, endpoint].join('/'), method: method, json: true });
            if (isPrivate) {
                options.url +=
                    '?' + [serialisedParams, 'signature=' + signature].join('&');
            }
            else if (method === 'GET' || method === 'DELETE') {
                options.params = params;
            }
            else {
                options.data = requestUtils_1.serialiseParams(requestBody, this.options.strictParamValidation, true);
            }
            // console.log(
            //   'sending request: ',
            //   JSON.stringify(
            //     {
            //       reqOptions: options,
            //       reqParams: params,
            //     },
            //     null,
            //     2
            //   )
            // );
            return axios_1.default(options)
                .then((response) => {
                this.updateApiLimitState(response.headers, options.url);
                if (response.status == 200) {
                    return response.data;
                }
                throw response;
            })
                .then((response) => {
                if (!this.options.beautifyResponses || !this.beautifier) {
                    return response;
                }
                // Fallback to original response if beautifier fails
                try {
                    return this.beautifier.beautify(response, endpoint) || response;
                }
                catch (e) {
                    console.error('BaseRestClient response beautify failed: ', JSON.stringify({ response: response, error: e }));
                }
                return response;
            })
                .catch((e) => this.parseException(e, options.url));
        });
    }
    /**
     * @private generic handler to parse request exceptions
     */
    parseException(e, url) {
        var _a, _b;
        const { response, request, message } = e;
        if (response && response.headers) {
            this.updateApiLimitState(response.headers, url);
        }
        if (this.options.parseExceptions === false) {
            throw e;
        }
        // Something happened in setting up the request that triggered an Error
        if (!response) {
            if (!request) {
                throw message;
            }
            // request made but no response received
            throw e;
        }
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw {
            code: (_a = response.data) === null || _a === void 0 ? void 0 : _a.code,
            message: (_b = response.data) === null || _b === void 0 ? void 0 : _b.msg,
            body: response.data,
            headers: response.headers,
            requestUrl: url,
            requestBody: request.body,
            requestOptions: Object.assign(Object.assign({}, this.options), { api_key: undefined, api_secret: undefined }),
        };
    }
    // TODO: cleanup?
    updateApiLimitState(responseHeaders, requestedUrl) {
        const delta = {};
        for (const headerKey in this.apiLimitTrackers) {
            const headerValue = responseHeaders[headerKey];
            const value = parseInt(headerValue);
            if (headerValue !== undefined && !isNaN(value)) {
                // TODO: track last seen by key? insetad of all? some keys not returned by some endpoints more useful in estimating whether reset should've happened
                this.apiLimitTrackers[headerKey] = value;
                delta[headerKey] = {
                    updated: true,
                    valueParsed: value,
                    valueRaw: headerValue,
                };
            }
            else {
                delta[headerKey] = {
                    updated: false,
                    valueParsed: value,
                    valueRaw: headerValue,
                };
            }
        }
        // console.log('responseHeaders: ', requestedUrl);
        // console.table(responseHeaders);
        // console.table(delta);
        this.apiLimitLastUpdated = new Date().getTime();
    }
    /**
     * Trigger time sync and store promise
     */
    syncTime() {
        if (this.options.disableTimeSync === true) {
            return Promise.resolve();
        }
        if (this.syncTimePromise !== null) {
            return this.syncTimePromise;
        }
        this.syncTimePromise = this.fetchTimeOffset().then((offset) => {
            this.timeOffset = offset;
            this.syncTimePromise = null;
        });
        return this.syncTimePromise;
    }
    /**
     * Estimate drift based on client<->server latency
     */
    fetchTimeOffset() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const start = Date.now();
                const serverTime = yield this.getServerTime();
                const end = Date.now();
                const avgDrift = (end - start) / 2;
                return Math.ceil(serverTime - end + avgDrift);
            }
            catch (e) {
                console.error('Failed to fetch get time offset: ', e);
                return 0;
            }
        });
    }
}
exports.default = BaseRestClient;
//# sourceMappingURL=BaseRestClient.js.map