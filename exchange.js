import { logIT, LOG_LEVEL } from './log.js';
import chalk from 'chalk';

var fetch_i = 0;


const baseRateLimit = 2000;

const checkResponse = (resp, latestRateLimit = baseRateLimit) => {
  let rateLimit = undefined;

  if (resp.ret_msg != "OK") {
    return [false, undefined];
  }

  //check rate_limit_status
  if (resp.rate_limit_status) {
    //check rate_limit_status
    if (resp.rate_limit_status > 100) {
      rateLimit = baseRateLimit;
      logIT("Rate limit status: " + chalk.green(resp.rate_limit_status));
    }
    else if (resp.rate_limit_status > 75) {
      rateLimit = latestRateLimit + 500;
      logIT("Rate limit status: " + chalk.greenBright(resp.rate_limit_status));
    }
    else if (resp.rate_limit_status > 50) {
      rateLimit = latestRateLimit + 1000;
      logIT("Rate limit status: " + chalk.yellowBright(resp.rate_limit_status));
    }
    else if (resp.rate_limit_status > 25) {
      rateLimit = latestRateLimit + 2000;
      logIT("Rate limit status: " + chalk.yellow(resp.rate_limit_status));
    }
    else {
      rateLimit = latestRateLimit + 4000;
      logIT("Rate limit status: " + chalk.red(resp.rate_limit_status));
    }
  }
  return [true, rateLimit];
} 

export class CachedLinearClient {
  constructor(linearClient) {
    this.linearClient = linearClient;
    this.walletBalance = {res: undefined, invalidated: true};
    this.positions = {res: undefined, invalidated: true};
    this.tickers = {res: undefined, invalidated: true};
    this.rateLimit = baseRateLimit;
  }

  async getWalletBalance() {
    let rate_limit = undefined;
    if (this.walletBalance.invalidated) {
      //let rate_limit = undefined;
      this.walletBalance.res = await this.linearClient.getWalletBalance();
      const [res, rate_limit ] = checkResponse(this.walletBalance.res, this.rateLimit);
      if (!res) {
        throw Error(`CachedLinearClient::getWalletBalance fail err: ${this.walletBalance.res.ret_msg}`);
      }
      this.walletBalance.invalidated = false;
      if (rate_limit) {
        this.rateLimit = rate_limit;
      }
    }

    return {
      'available_balance': this.walletBalance.res.result['USDT'].available_balance,
      'used_margin': this.walletBalance.res.result['USDT'].used_margin,
      'whole_balance': this.walletBalance.res.result['USDT'].available_balance + this.walletBalance.res.result['USDT'].used_margin
    };
  }

  async getPosition() {
    let rate_limit = undefined;
    if (this.positions.invalidated) {
      //let rate_limit = undefined;
      this.positions.res = await this.linearClient.getPosition();
      const [res, rate_limit ] = checkResponse(this.positions.res, this.rateLimit);
      if (!res) {
        throw Error(`CachedLinearClient::getPosition fail err: ${this.positions.res.ret_msg}`);
      }
      this.positions.invalidated = false;
      if (rate_limit) {
        this.rateLimit = rate_limit;
      }
    }
    return this.positions.res;
  }

  async getOpenPositions() {
    const positions = await this.getPosition();
    const openPositions = positions.result.filter(el => el.data.size > 0).length;
    return openPositions;
  }    

  async getTickers(symbolObj = undefined) {    
    if (this.tickers.invalidated) {
      this.tickers.res = await this.linearClient.getTickers();
      const [res] = checkResponse(this.tickers.res, this.rateLimit);
      if (!res) {
        throw Error(`CachedLinearClient::getTickers fail err: ${this.tickers.res.ret_msg}`);
      }

      this.tickers.invalidated = false;
    }
  
    let ticker = {result: []};
    if (symbolObj) {
      const t = this.tickers.res.result.find(el => el.symbol == symbolObj.symbol);
      if (t == undefined) {
        throw Error(`CachedLinearClient::getTickers fail symbol not found: ${symbolObj.symbol}`);
      } else {        
        return {result: [t]}
      }
    }

    return symbolObj ? ticker : this.tickers.res;
  }

  getRateLimit() {
    return this.rateLimit;
  }

  invalidate(){
    this.walletBalance.invalidated = true;
    this.positions.invalidated = true;
    this.tickers.invalidated = true;
  }
}