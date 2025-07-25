import pkg from 'bybit-api-gnome';
const { WebsocketClient, WS_KEY_MAP, LinearClient, AccountAssetClient, SpotClientV3} = pkg;
import { config } from 'dotenv';
config();
import fetch from 'node-fetch';
import chalk from 'chalk';
import fs from 'fs';
import { Webhook, MessageBuilder } from 'discord-webhook-node';
import moment from 'moment';

// used to calculate bot runtime
const timestampBotStart = moment();

var hook;
if (process.env.USE_DISCORD == "true") {
    hook = new Webhook(process.env.DISCORD_URL);
}

const key = process.env.API_KEY;
const secret = process.env.API_SECRET;
var rateLimit = 2000;
var baseRateLimit = 2000;
var lastReport = 0;
var pairs = [];
var liquidationOrders = [];
var lastUpdate = 0;



//create ws client
const wsClient = new WebsocketClient({
    key: key,
    secret: secret,
    market: 'linear',
    livenet: true,
});
//create linear client
const linearClient = new LinearClient({
    key: key,
    secret: secret,
    livenet: true,
});
//account client
const accountClient = new AccountAssetClient({
    key: key,
    secret: secret,
    livenet: true,
});
//spot client
const spotClient = new SpotClientV3({
    key: key,
    secret: secret,
    livenet: true,
});

wsClient.on('update', (data) => {
    console.log('raw message received ', JSON.stringify(data, null, 2));
    var pair = data.data.symbol;
    var price = parseFloat(data.data.price);
    var side = data.data.side;
    //convert to float
    var qty = parseFloat(data.data.qty) * price;
    //create timestamp
    var timestamp = Math.floor(Date.now() / 1000);
    //find what index of liquidationOrders array is the pair
    var index = liquidationOrders.findIndex(x => x.pair === pair);

    var dir = "";
    if (side === "Buy") {
        dir = "Long";
    } else {
        dir = "Short";
    }

    //get blacklisted pairs
    const blacklist = [];
    var blacklist_all = process.env.BLACKLIST;
    blacklist_all = blacklist_all.replaceAll(" ", "");
    blacklist_all.split(',').forEach(item => {
        blacklist.push(item);
    });

    // get whitelisted pairs
    const whitelist = [];
    var whitelist_all = process.env.WHITELIST;
    whitelist_all = whitelist_all.replaceAll(" ", "");
    whitelist_all.split(',').forEach(item => {
        whitelist.push(item);
    });

    //if pair is not in liquidationOrders array and not in blacklist, add it
    if (index === -1 && !blacklist.includes(pair) && process.env.USE_WHITELIST == "false" || process.env.USE_WHITELIST == "true" && whitelist.includes(pair)) {
        liquidationOrders.push({pair: pair, price: price, side: side, qty: qty, amount: 1, timestamp: timestamp});
        index = liquidationOrders.findIndex(x => x.pair === pair);
    }
    //if pair is in liquidationOrders array, update it
    else if (!blacklist.includes(pair) && process.env.USE_WHITELIST == "false" || process.env.USE_WHITELIST == "true" && whitelist.includes(pair)) {
        //check if timesstamp is withing 5 seconds of previous timestamp
        if (timestamp - liquidationOrders[index].timestamp <= 5) {
            liquidationOrders[index].price = price;
            liquidationOrders[index].side = side;
            //add qty to existing qty and round to 2 decimal places
            liquidationOrders[index].qty = parseFloat((liquidationOrders[index].qty + qty).toFixed(2));
            liquidationOrders[index].timestamp = timestamp;
            liquidationOrders[index].amount = liquidationOrders[index].amount + 1;

        }
        //if timestamp is more than 5 seconds from previous timestamp, overwrite
        else {
            liquidationOrders[index].price = price;
            liquidationOrders[index].side = side;
            liquidationOrders[index].qty = qty;
            liquidationOrders[index].timestamp = timestamp;
            liquidationOrders[index].amount = 1;
        }

        if (liquidationOrders[index].qty > process.env.MIN_LIQUIDATION_VOLUME) {
            scalp(pair, index, liquidationOrders[index].qty);
        }
        else {
            console.log(chalk.magenta("[" + liquidationOrders[index].amount + "] " + dir + " Liquidation order for " + liquidationOrders[index].pair + " with a cumulative value of " + liquidationOrders[index].qty + " USDT"));
            console.log(chalk.yellow("Not enough liquidations to trade " + liquidationOrders[index].pair));
        }

    }
    else {
        console.log(chalk.gray("Liquidation Found for Blacklisted pair: " + pair + " ignoring..."));
    }
});

wsClient.on('open', (data,) => {
    if (data.wsKey === WS_KEY_MAP.WS_KEY_ERROR) {
        console.log('error', data);
        return;
    }
});
wsClient.on('response', (data) => {
    if (data.wsKey === WS_KEY_MAP.WS_KEY_ERROR) {
        console.log('error', data);
        return;
    }
});
wsClient.on('reconnect', ({ wsKey }) => {
    console.log('ws automatically reconnecting.... ', wsKey);
});
wsClient.on('reconnected', (data) => {
    console.log('ws has reconnected ', data?.wsKey);
});


//run websocket
async function liquidationEngine(pairs) {
    wsClient.subscribe(pairs);
}

async function transferFunds(amount) {
    const transfer = await accountClient.createInternalTransfer(
        {
            transfer_id: await generateTransferId(),
            coin: 'USDT',
            amount: amount.toFixed(2),
            from_account_type: 'CONTRACT',
            to_account_type: 'SPOT',
        }
    );
}

async function withdrawFunds() {
    const settings = JSON.parse(fs.readFileSync('account.json', 'utf8'));

    if (settings.Withdraw == true){

        const withdraw = await accountClient.submitWithdrawal(
            {
                coin: process.env.WITHDRAW_COIN,
                chain: process.env.WITHDRAW_CHAIN,
                address: process.env.WITHDRAW_ADDRESS,
                amount: String(settings.BalanceToWithdraw).toFixed(2),
                account_type: process.env.WITHDRAW_ACCOUNT
            }
        );

        console.log("Withdrawl completed!")
    } else {
        console.log("Would withdrawl, but it's not active..")
    }

}

//Generate transferId
async function generateTransferId() {
    const hexDigits = "0123456789abcdefghijklmnopqrstuvwxyz";
    let transferId = "";
    for (let i = 0; i < 32; i++) {
      transferId += hexDigits.charAt(Math.floor(Math.random() * 16));
      if (i === 7 || i === 11 || i === 15 || i === 19) {
        transferId += "-";
      }
    }
    return transferId;
}

//Get server time
async function getServerTime() {
    const data = await linearClient.fetchServerTime();
    var usedBalance = new Date(data *1000);
    var balance = usedBalance.toGMTString()+'\n'+usedBalance.toLocaleString();

    //cehck when last was more than 5 minutes ago
    if (Date.now() - lastReport > 300000) {
        //send report
        reportWebhook();
        //checkCommit();
        lastReport = Date.now();
    }
    return balance;

}

//Get margin
async function getMargin() {
    const data = await linearClient.getWalletBalance();
    var usedBalance = data.result['USDT'].used_margin;
    var balance = usedBalance;

    //cehck when last was more than 5 minutes ago
    if (Date.now() - lastReport > 300000) {
        //send report
        reportWebhook();
        //checkCommit();
        lastReport = Date.now();
    }
    return balance;

}

//get account balance
async function getBalance() {
    try{
        const data = await linearClient.getWalletBalance();
        const spotBal = await spotClient.getBalances();
        var availableBalance = data.result['USDT'].available_balance;
        var usedBalance = data.result['USDT'].used_margin;
        var balance = availableBalance + usedBalance;
        //load settings.json
        const settings = JSON.parse(fs.readFileSync('account.json', 'utf8'));
        //check if starting balance is set
        if (settings.startingBalance === 0) {
            settings.startingBalance = balance;
            fs.writeFileSync('account.json', JSON.stringify(settings, null, 4));
            var startingBalance = settings.startingBalance;
        }
        else {
            var startingBalance = settings.startingBalance;
        }

        var diff = balance - startingBalance;
        var percentGain = (diff / startingBalance) * 100;

        //check for gain to safe amount to spot
        if (diff >= settings.BalanceToSpot && settings.BalanceToSpot > 0 && process.env.TRANSFER_TO_SPOT == "false"){
            transferFunds(diff)
            console.log("Moved " + diff + " to SPOT")
        }

        //check spot balance to withdraw
        var withdrawCoin = spotBal.result.balances.find(item => item.coin === process.env.WITHDRAW_COIN);

        if (withdrawCoin.total >= settings.BalanceToWithdraw && settings.Withdraw == true){
            withdrawFunds();
            console.log("Withdraw " + withdrawCoin.total + " to " + process.env.WITHDRAW_ADDRESS)
        }

        //if positive diff then log green
        if (diff >= 0) {
            console.log(chalk.greenBright.bold("Profit: " + diff.toFixed(4) + " USDT" + " (" + percentGain.toFixed(2) + "%)") + " | " + chalk.magentaBright.bold("Balance: " + balance.toFixed(4) + " USDT"));
        }
        else {
            console.log(chalk.redBright.bold("Profit: " + diff.toFixed(4) + " USDT" + " (" + percentGain.toFixed(2) + "%)") + "  " + chalk.magentaBright.bold("Balance: " + balance.toFixed(4) + " USDT"));

        }

        //cehck when last was more than 5 minutes ago
        if (Date.now() - lastReport > 300000) {
            //send report
            reportWebhook();
            //checkCommit();
            lastReport = Date.now();
        }
        return balance;
    }
    catch (e) {
        return null;
    }

}
//get position
async function getPosition(pair, side) {
    //gor through all pairs and getPosition()
    var positions = await linearClient.getPosition(pair);

    console.log(positions.result);

    if (positions.result !== null) {
        //look for pair in positions with the same side
        var index = positions.result.findIndex(x => x.data.symbol === pair && x.data.side === side);
        //make sure index is not -1
        if (index !== -1) {
            if (positions.result[index].data.size >= 0) {
                //console.log(positions.result[index].data);
                if(positions.result[index].data.size > 0){
                    console.log(chalk.blueBright("Open position found for " + positions.result[index].data.symbol + " with a size of " + positions.result[index].data.size + " contracts" + " with profit of " + positions.result[index].data.realised_pnl + " USDT"));
                    var profit = positions.result[index ].data.unrealised_pnl;
                    //calculate the profit % change in USD
                    var margin = positions.result[index ].data.position_value/process.env.LEVERAGE;
                    var percentGain = (profit / margin) * 100;
                    return {side: positions.result[index].data.side, entryPrice: positions.result[index].data.entry_price, size: positions.result[index].data.size, percentGain: percentGain};
                }
                else{
                    //no open position
                    return {side: positions.result[index].data.side, entryPrice: positions.result[index].data.entry_price, size: positions.result[index].data.size, percentGain: 0};
                }
            }
            else {
                // adding this for debugging purposes
                console.log("Error: getPostion invalid for " + pair + " size parameter is returning " + positions.result[index].data.size);
                messageWebhook("Error: getPostion invalid for " + pair + " size parameter is returning " + positions.result[index].data.size);
                return {side: null, entryPrice: null, size: null, percentGain: null};
            }
        }
        else {
            console.log("Open positions response is null");
            return {side: null, entryPrice: null, size: null, percentGain: null};
        }

    }
    else {
        console.log("Open positions response is null");
        return {side: null, entryPrice: null, size: null, percentGain: null};
    }

}
//take profit
async function takeProfit(symbol, position) {

    //get entry price
    var positions = await position;

    if (positions.side === "Buy") {
        var side = "Buy";
        var takeProfit = positions.entry_price + (positions.entry_price * (process.env.TAKE_PROFIT_PERCENT/100));
        var stopLoss = positions.entry_price - (positions.entry_price * (process.env.STOP_LOSS_PERCENT/100));

    }
    else {
        var side = "Sell";
        var takeProfit = positions.entry_price - (positions.entry_price * (process.env.TAKE_PROFIT_PERCENT/100));
        var stopLoss = positions.entry_price + (positions.entry_price * (process.env.STOP_LOSS_PERCENT/100));
    }

    //load min order size json

    const tickData = JSON.parse(fs.readFileSync('min_order_sizes.json', 'utf8'));

    try {
        var index = tickData.findIndex(x => x.pair === symbol);
        var tickSize = tickData[index].tickSize;
        var decimalPlaces = (tickSize.toString().split(".")[1] || []).length;

        if (positions.size > 0 && positions.take_profit === 0 || takeProfit !== positions.take_profit) {
            if(process.env.USE_STOPLOSS.toLowerCase() === "true") {
                const order = await linearClient.setTradingStop({
                    symbol: symbol,
                    side: side,
                    take_profit: takeProfit.toFixed(decimalPlaces),
                    stop_loss: stopLoss.toFixed(decimalPlaces),
                });
                //console.log(JSON.stringify(order, null, 4));

                if (order.ret_msg === "OK" || order.ret_msg === "not modified" || order.ret_code === 10002) {
                    //console.log(chalk.red("TAKE PROFIT ERROR: ", JSON.stringify(order, null, 2)));
                }
                else if (order.ret_code === 130027 || order.ret_code === 130030 || order.ret_code === 130024) {
                    //find current price
                    var priceFetch = await linearClient.getTickers({symbol: symbol});
                    var price = priceFetch.result[0].last_price;
                    //if side is sell add 1 tick to price
                    if (side === "Sell") {
                        price = parseFloat(priceFetch.result[0].ask_price);
                    }
                    else {
                        price = parseFloat(priceFetch.result[0].bid_price);
                    }
                    const order = await linearClient.setTradingStop({
                        symbol: symbol,
                        side: side,
                        take_profit: price.toFixed(decimalPlaces),
                        stop_loss: stopLoss.toFixed(decimalPlaces),
                    });
                    console.log(chalk.red("TAKE PROFIT FAILED FOR " + symbol + " WITH ERROR PRICE MOVING TOO FAST OR ORDER ALREADY CLOSED, TRYING TO FILL AT BID/ASK!!"));
                }
                else {
                    console.log(chalk.red("TAKE PROFIT ERROR: ", JSON.stringify(order, null, 4)));
                }

            }
            else {
                const order = await linearClient.setTradingStop({
                    symbol: symbol,
                    side: side,
                    take_profit: takeProfit.toFixed(decimalPlaces),
                });
                //console.log(JSON.stringify(order, null, 2));
                if(order.ret_msg === "OK" || order.ret_msg === "not modified" || order.ret_code ===  130024) {
                    //console.log(chalk.red("TAKE PROFIT ERROR: ", JSON.stringify(order, null, 2)));
                }
                else if (order.ret_code === 130027 || order.ret_code === 130030) {
                    console.log(chalk.cyanBright("TAKE PROFIT FAILED PRICING MOVING FAST!! TRYING TO PLACE ABOVE CURRENT PRICE!!"));
                    //find current price
                    var priceFetch = await linearClient.getTickers({symbol: symbol});
                    console.log("Current price: " + JSON.stringify(priceFetch, null, 4));
                    var price = priceFetch.result[0].last_price;
                    //if side is sell add 1 tick to price
                    if (side === "Sell") {
                        price = priceFetch.result[0].ask_price
                    }
                    else {
                        price = priceFetch.result[0].bid_price
                    }
                    console.log("Price for symbol " + symbol + " is " + price);
                    const order = await linearClient.setTradingStop({
                        symbol: symbol,
                        side: side,
                        take_profit: price,
                    });
                    console.log(chalk.red("TAKE PROFIT FAILED FOR " + symbol + " WITH ERROR PRICE MOVING TOO FAST, TRYING TO FILL AT BID/ASK!!"));
                }
                else {
                    console.log(chalk.red("TAKE PROFIT ERROR: ", JSON.stringify(order, null, 2)));
                }
            }
        }
        else {
            console.log("No take profit to set for " + symbol);
        }
    }
    catch (e) {
        console.log(chalk.red("Error setting take profit: " + e + " for symbol " + symbol));
    }

}
//fetch how how openPositions there are
async function totalOpenPositions() {
    try{
        var positions = await linearClient.getPosition();
        var open = 0;
        for (var i = 0; i < positions.result.length; i++) {
            if (positions.result[i].data.size > 0) {
                if (open === null) {
                    open = 1;
                }
                else {
                    open++;
                }
            }
        }
        return open;

    }
    catch (error) {
        return null;
    }
}
//against trend
async function scalp(pair, index, trigger_qty) {
    //check how many positions are open
    var openPositions = await totalOpenPositions();
    //make sure openPositions is less than max open positions and not null
    if (openPositions < process.env.MAX_OPEN_POSITIONS && openPositions !== null) {
        //Long liquidation
        if (liquidationOrders[index].side === "Buy") {
            const settings = await JSON.parse(fs.readFileSync('settings.json', 'utf8'));
            var settingsIndex = await settings.pairs.findIndex(x => x.symbol === pair);
            
            if(settingsIndex !== -1) {
                if (liquidationOrders[index].price < settings.pairs[settingsIndex].long_price)  {
                    //see if we have an open position
                    var position = await getPosition(pair, "Buy");

                    //make sure position.size greater than or equal to 0
                    if (position.size != null) {
                        //console.log(position);
                        //no open position
                        if (position.side === "Buy" && position.size === 0) {
                            //load min order size json
                            const tickData = JSON.parse(fs.readFileSync('min_order_sizes.json', 'utf8'));
                            var index = tickData.findIndex(x => x.pair === pair);
                            var tickSize = tickData[index].tickSize;
                            var decimalPlaces = (tickSize.toString().split(".")[1] || []).length;
                            const order = await linearClient.placeActiveOrder({
                                symbol: pair,
                                side: "Buy",
                                order_type: "Market",
                                qty: settings.pairs[settingsIndex].order_size.toFixed(decimalPlaces),
                                time_in_force: "GoodTillCancel",
                                reduce_only: false,
                                close_on_trigger: false
                            });
                            //console.log("Order placed: " + JSON.stringify(order, null, 2));
                            console.log(chalk.bgGreenBright("Long Order Placed for " + pair + " at " + settings.pairs[settingsIndex].order_size + " size"));
                            if(process.env.USE_DISCORD == "true") {
                                orderWebhook(pair, settings.pairs[settingsIndex].order_size, "Buy", position.size, position.percentGain, trigger_qty);
                            }
                            
            
                        }
                        //open DCA position
                        else if (position.side === "Buy" && position.size > 0 && position.percentGain < 0 && process.env.USE_DCA_FEATURE == "true") {
                            //maxe sure order is less than max order size
                            if ((position.size + settings.pairs[settingsIndex].order_size) < settings.pairs[settingsIndex].max_position_size) {
                                //load min order size json
                                const tickData = JSON.parse(fs.readFileSync('min_order_sizes.json', 'utf8'));
                                var index = tickData.findIndex(x => x.pair === pair);
                                var tickSize = tickData[index].tickSize;
                                var decimalPlaces = (tickSize.toString().split(".")[1] || []).length;
                                const order = await linearClient.placeActiveOrder({
                                    symbol: pair,
                                    side: "Buy",
                                    order_type: "Market",
                                    qty: settings.pairs[settingsIndex].order_size.toFixed(decimalPlaces),
                                    time_in_force: "GoodTillCancel",
                                    reduce_only: false,
                                    close_on_trigger: false
                                });
                                //console.log("Order placed: " + JSON.stringify(order, null, 2));
                                console.log(chalk.bgGreenBright("Long Order Placed for " + pair + " at " + settings.pairs[settingsIndex].order_size + " size"));
                                if(process.env.USE_DISCORD == "true") {
                                    orderWebhook(pair, settings.pairs[settingsIndex].order_size, "Buy", position.size, position.percentGain, trigger_qty);
                                }
                            }
                            else {
                                //max position size reached
                                console.log("Max position size reached for " + pair);
                                messageWebhook("Max position size reached for " + pair);
                                
                            }
                        }
                        else {
                            console.log(chalk.redBright("Order size is greaer than max position size for " + pair));
                        }
                    }
                    else {
                        console.log(chalk.redBright("Error getting position for " + pair));
                    }

                }
                else {
                    console.log(chalk.cyan("!! Liquidation price " + liquidationOrders[index].price + " is higher than long price " + settings.pairs[settingsIndex].long_price + " for " + pair));
                }
            }
            else {
                console.log(chalk.bgRedBright( pair + " does not exist in settings.json"));
            }

        }
        else {
            const settings = await JSON.parse(fs.readFileSync('settings.json', 'utf8'));
            var settingsIndex = await settings.pairs.findIndex(x => x.symbol === pair);
            if(settingsIndex !== -1) {
                if (liquidationOrders[index].price > settings.pairs[settingsIndex].short_price)  {
                    var position = await getPosition(pair, "Sell");

                    //make sure position.size greater than or equal to 0
                    if (position.size != null) {
                        //console.log(position);
                        //no open position
                        if (position.side === "Sell" && position.size === 0) {
                            //load min order size json
                            const tickData = JSON.parse(fs.readFileSync('min_order_sizes.json', 'utf8'));
                            var index = tickData.findIndex(x => x.pair === pair);
                            var tickSize = tickData[index].tickSize;
                            var decimalPlaces = (tickSize.toString().split(".")[1] || []).length;
                            const order = await linearClient.placeActiveOrder({
                                symbol: pair,
                                side: "Sell",
                                order_type: "Market",
                                qty: settings.pairs[settingsIndex].order_size.toFixed(decimalPlaces),
                                time_in_force: "GoodTillCancel",
                                reduce_only: false,
                                close_on_trigger: false
                            });
                            //console.log("Order placed: " + JSON.stringify(order, null, 2));
                            console.log(chalk.bgRedBright("Short Order Placed for " + pair + " at " + settings.pairs[settingsIndex].order_size + " size"));
                            if(process.env.USE_DISCORD == "true") {
                                orderWebhook(pair, settings.pairs[settingsIndex].order_size, "Sell", position.size, position.percentGain, trigger_qty);
                            }
    
                        }
                        //open DCA position
                        else if (position.side === "Sell" && position.size > 0 && position.percentGain < 0) {
                            //maxe sure order is less than max order size
                            if ((position.size + settings.pairs[settingsIndex].order_size) < settings.pairs[settingsIndex].max_position_size && process.env.USE_DCA_FEATURE == "true") {
                                //load min order size json
                                const tickData = JSON.parse(fs.readFileSync('min_order_sizes.json', 'utf8'));
                                var index = tickData.findIndex(x => x.pair === pair);
                                var tickSize = tickData[index].tickSize;
                                var decimalPlaces = (tickSize.toString().split(".")[1] || []).length;
                                const order = await linearClient.placeActiveOrder({
                                    symbol: pair,
                                    side: "Sell",
                                    order_type: "Market",
                                    qty: settings.pairs[settingsIndex].order_size.toFixed(decimalPlaces),
                                    time_in_force: "GoodTillCancel",
                                    reduce_only: false,
                                    close_on_trigger: false
                                });
                                //console.log("Order placed: " + JSON.stringify(order, null, 2));
                                console.log(chalk.bgRedBright("Short Order Placed for " + pair + " at " + settings.pairs[settingsIndex].order_size + " size"));
                                if(process.env.USE_DISCORD == "true") {
                                    orderWebhook(pair, settings.pairs[settingsIndex].order_size, "Sell", position.size, position.percentGain, trigger_qty);
                                }
                            }
                            else {
                                //max position size reached
                                console.log("Max position size reached for " + pair);
                                messageWebhook("Max position size reached for " + pair);
                            }
                        }
                        else {
                            console.log(chalk.redBright("Order size is greater than max position size for " + pair));
                        }
                    }
                    else {
                        console.log(chalk.redBright("Error getting position for " + pair));
                    }

                }
                else {
                    console.log(chalk.cyan("!! Liquidation price " + liquidationOrders[index].price + " is lower than short price " + settings.pairs[settingsIndex].short_price + " for " + pair));
                }
            }
            else {
                console.log(chalk.bgCyan(pair + " does not exist in settings.json"));
            }
        }
    }
    else {
        console.log(chalk.redBright("Max Open Positions Reached!"));
    }

}
//set leverage on all pairs
async function setLeverage(pairs, leverage) {
    for (var i = 0; i < pairs.length; i++) {
        //remove "liquidation." from pair name
        var pair = pairs[i].replace("liquidation.", "");

        const set = await linearClient.setUserLeverage(
            {
                symbol: pair,
                buy_leverage: leverage,
                sell_leverage: leverage,
            }
        );
        try{
            var currentLeverage = await checkLeverage(pair);
            if (currentLeverage.toString() === leverage) {
                console.log("Leverage for " + pair + " is set to " + leverage);
            }
            else {
                console.log(chalk.yellowBright("Unable to set leverage for " + pair + " to " + leverage, "Max leverage is lower than " + leverage + " removing pair from settings.json"));
                //remove pair from settings.json
                const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
                var settingsIndex = settings.pairs.findIndex(x => x.symbol === pair);
                if(settingsIndex !== -1) {
                    settings.pairs.splice(settingsIndex, 1);
                    fs.writeFileSync('settings.json', JSON.stringify(settings, null, 2));
                }
            }
            


        }
        catch (e) {
            console.log(chalk.redBright("ERROR setting leverage for " + pair + " to " + leverage, e));
            await sleep(1000);
        }

    }

}

//set position mode to hedge
async function setPositionMode() {

    const set = await linearClient.setPositionMode({
        coin: "USDT",
        mode: "BothSide"
    });
    //log responses
    if (set.ret_msg === "OK") {
        console.log("Position mode set");
        return true;
    }
    else if (set.ret_msg === "Partial symbols switched successfully, excluding symbols with open orders or positions.") {
        console.log("Position mode set for symbols without  positions");
        return false;
    }
    else {
        console.log(chalk.redBright("Unable to set position mode"));
        return false;
    }
    
}

async function checkLeverage(symbol) {
    var position = await linearClient.getPosition({symbol: symbol});
    var leverage = position.result[0].leverage;
    return leverage;
}
//create loop that checks for open positions every second
async function checkOpenPositions() {
    //gor through all pairs and getPosition()
    var positions = await linearClient.getPosition();
    //check rate_limit_status
    if (positions.rate_limit_status > 100) {
        rateLimit = baseRateLimit;
        console.log("Rate limit status: " + chalk.green(positions.rate_limit_status));
    }
    else if (positions.rate_limit_status > 75) {
        rateLimit = rateLimit + 500;
        console.log("Rate limit status: " + chalk.greenBright(positions.rate_limit_status));
    }
    else if (positions.rate_limit_status > 50) {
        rateLimit = rateLimit + 1000;
        console.log("Rate limit status: " + chalk.yellowBright(positions.rate_limit_status));
    }
    else if (positions.rate_limit_status > 25) {
        rateLimit = rateLimit + 2000;
        console.log("Rate limit status: " + chalk.yellow(positions.rate_limit_status));
    }
    else {
        rateLimit = rateLimit + 200;
        console.log("Rate limit status: " + chalk.red(positions.rate_limit_status));
    }

    //console.log("Positions: " + JSON.stringify(positions, null, 2));
    var totalPositions = 0;
    var postionList = [];
    if (positions.result !== null) {
        for (var i = 0; i < positions.result.length; i++) {
            if (positions.result[i].data.size > 0) {
                //console.log("Open Position for " + positions.result[i].data.symbol + " with size " + positions.result[i].data.size + " and side " + positions.result[i].data.side + " and pnl " + positions.result[i].data.unrealised_pnl);
               
                takeProfit(positions.result[i].data.symbol, positions.result[i].data);
   
                //get usd value of position
                var usdValue = (positions.result[i].data.entry_price * positions.result[i].data.size) / process.env.LEVERAGE;
                totalPositions++;

                        
                //create object to store in postionList
                var position = {
                    symbol: positions.result[i].data.symbol,
                    size: positions.result[i].data.size,
                    usdValue: usdValue.toFixed(4),
                    side: positions.result[i].data.side,
                    pnl: positions.result[i].data.unrealised_pnl
                }
                postionList.push(position);
                
            }
        }
    }
    else {
        console.log("Open positions response is null");
    }
    console.log("----------------------------------------------------");
    console.log("------------------ OPEN POSITIONS ------------------");
    console.log("----------------------------------------------------");
    console.table(postionList);

}

async function getMinTradingSize() {
    const url = "https://api.bybit.com/v2/public/symbols";
    const response = await fetch(url);
    const data = await response.json();
    var balance = await getBalance();

    if (balance !== null) {
        var tickers = await linearClient.getTickers();
        var positions = await linearClient.getPosition();

        var minOrderSizes = [];
        console.log("Fetching min Trading Sizes for pairs, this could take a minute...");
        for (var i = 0; i < data.result.length; i++) {
            console.log("Pair: " + data.result[i].name + " Min Trading Size: " + data.result[i].lot_size_filter.min_trading_qty);
            //check if min_trading_qty usd value is less than process.env.MIN_ORDER_SIZE
            var minOrderSize = data.result[i].lot_size_filter.min_trading_qty;
            //get price of pair from tickers
            var priceFetch = tickers.result.find(x => x.symbol === data.result[i].name);
            var price = priceFetch.last_price;
            //get usd value of min order size
            var usdValue = (minOrderSize * price);
            //console.log("USD value of " + data.result[i].name + " is " + usdValue);
            //find usd valie of process.env.MIN_ORDER_SIZE
            var minOrderSizeUSD = (balance * process.env.PERCENT_ORDER_SIZE/100) * process.env.LEVERAGE;
            //console.log("USD value of " + process.env.PERCENT_ORDER_SIZE + " is " + minOrderSizeUSD);
            if (minOrderSizeUSD < usdValue) {
                //use min order size
                var minOrderSizePair = minOrderSize;
            }
            else {
                //convert min orderSizeUSD to pair value
                var minOrderSizePair = (minOrderSizeUSD / price);
            }
            try{
                //find pair ion positions
                var position = positions.result.find(x => x.data.symbol === data.result[i].name);
                var leverage = position.data.leverage;
        
                if (process.env.LEVERAGE === leverage.toString()) {
                    //find max position size for pair
                    var maxPositionSize = ((balance * (process.env.MAX_POSITION_SIZE_PERCENT/100)) / price) * process.env.LEVERAGE;
                    //save min order size and max position size to json
                    var minOrderSizeJson = {
                        "pair": data.result[i].name,
                        "minOrderSize": minOrderSizePair,
                        "maxPositionSize": maxPositionSize,
                        "tickSize": data.result[i].price_filter.tick_size,
                    }
                    //add to array
                    minOrderSizes.push(minOrderSizeJson);

                }
                else {
                    const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
                    var settingsIndex = settings.pairs.findIndex(x => x.symbol === data.result[i].name);
                    if(settingsIndex !== -1) {
                        settings.pairs.splice(settingsIndex, 1);
                        fs.writeFileSync('settings.json', JSON.stringify(settings, null, 2));
                    }
                }
            }
            catch (e) {
                await sleep(10);
            }

        }
        fs.writeFileSync('min_order_sizes.json', JSON.stringify(minOrderSizes, null, 4));


        //update settings.json with min order sizes
        const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
        for (var i = 0; i < minOrderSizes.length; i++) {
            var settingsIndex = settings.pairs.findIndex(x => x.symbol === minOrderSizes[i].pair);
            if(settingsIndex !== -1) {
                settings.pairs[settingsIndex].order_size = minOrderSizes[i].minOrderSize;
                settings.pairs[settingsIndex].max_position_size = minOrderSizes[i].maxPositionSize;
                
            }
        }
    }
    else {
        console.log("Error fetching balance");
    }

}
//get all symbols
async function getSymbols() {
    try{
        const url = "https://api.bybit.com/v2/public/symbols";
        const response = await fetch(url);
        const data = await response.json();
        //console.log(JSON.stringify(data.result[0], null, 2));
        var symbols = [];
        //only allow symbols that are not inverse
        for (var i = 0; i < data.result.length; i++) {
            //check if 1000 or any number is in the name
            if (data.result[i].name.includes("1000")) {
                continue;
            }
            else {
                var t1 = "liquidation.";
                var t2 = data.result[i].name.toString();
                //check if t2 ends in USDT
                if (t2.endsWith("USDT")) {
                    var pair = t1.concat(t2);
                    symbols.push(pair);
                }

            }

        }
        return symbols;
    }
    catch{
        console.log("Error fetching symbols");
        return null;
    }
}
//sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//auto create settings.json file
async function createSettings() {
    await getMinTradingSize();
    var minOrderSizes = JSON.parse(fs.readFileSync('min_order_sizes.json'));
    //get info from https://api.liquidation.report/public/research
    const url = "https://liquidation.report/api/lickhunter";
    fetch(url)
    .then(res => res.json())
    .then((out) => {
        //create settings.json file with multiple pairs
        var settings = {};
        settings["pairs"] = [];
        for (var i = 0; i < out.data.length; i++) {
            //console.log("Adding Smart Settings for " + out.data[i].name + " to settings.json");
            //if name contains 1000 or does not end in USDT, skip
            if (out.data[i].name.includes("1000")) {
                continue;
            }
            else {
                //find index of pair in min_order_sizes.json "pair" key
                var index = minOrderSizes.findIndex(x => x.pair === out.data[i].name + "USDT");
                if (index === -1) {
                    continue;
                }
                else {
                    //risk level
                    var riskLevel = process.env.RISK_LEVEL;
                    if (riskLevel == 1) {
                        //add 0.5% to long_price and subtract 0.5% from short_price
                        var long_risk = out.data[i].long_price * 1.005
                        var short_risk = out.data[i].short_price * 0.995
                    }
                    else if (riskLevel == 2) {
                        //calculate price 1% below current price and1% above current price
                        var long_risk = out.data[i].long_price * 1.01
                        var short_risk = out.data[i].short_price * 0.99
                    }
                    else if (riskLevel == 3) {
                        //calculate price 2% below current price and 2% above current price
                        var long_risk = out.data[i].long_price * 1.02
                        var short_risk = out.data[i].short_price * 0.98
                    }
                    else if (riskLevel == 4) {
                        //calculate price 3% below current price and 3% above current price
                        var long_risk = out.data[i].long_price * 1.03
                        var short_risk = out.data[i].short_price * 0.97
                    }
                    else if (riskLevel == 5) {
                        //calculate price 4% below current price and 4% above current price
                        var long_risk = out.data[i].long_price * 1.04
                        var short_risk = out.data[i].short_price * 0.96
                    }
                    else {
                        var long_risk = out.data[i].long_price;
                        var short_risk = out.data[i].short_price;
                    }

                    var pair = {
                        "symbol": out.data[i].name + "USDT",
                        "leverage": process.env.LEVERAGE,
                        "min_volume": process.env.MIN_LIQUIDATION_VOLUME,
                        "take_profit": process.env.TAKE_PROFIT_PERCENT,
                        "stop_loss": process.env.STOP_LOSS_PERCENT,
                        "order_size": minOrderSizes[index].minOrderSize,
                        "max_position_size": minOrderSizes[index].maxPositionSize,
                        "long_price": long_risk,
                        "short_price": short_risk
                    }
                    settings["pairs"].push(pair);
                }
            }
        }
        fs.writeFileSync('settings.json', JSON.stringify(settings, null, 4));

    }).catch(err => { throw err });
}
//update settings.json file with long_price and short_price

async function updateSettings() {
    //check if last update was more than 5 minutes ago
    if (lastUpdate == 0) {
        lastUpdate = Date.now();
    }
    else {
        var now = Date.now();
        var diff = now - lastUpdate;
        if (diff < 300000) {
            return;
        }
        else {
            lastUpdate = Date.now();
            if(process.env.UPDATE_MIN_ORDER_SIZING == "true") {
                await getMinTradingSize();
            }
            var minOrderSizes = JSON.parse(fs.readFileSync('min_order_sizes.json'));
            var settingsFile = JSON.parse(fs.readFileSync('settings.json'));
            const url = "https://liquidation.report/api/lickhunter";
            fetch(url)
            .then(res => res.json())
            .then((out) => {
                //create settings.json file with multiple pairs
                //save result to research.json
                fs.writeFileSync('research.json', JSON.stringify(out, null, 4));
                var settings = {};
                settings["pairs"] = [];
                for (var i = 0; i < out.data.length; i++) {
                    //find index of pair in min_order_sizes.json "pair" key
                    var index = minOrderSizes.findIndex(x => x.pair === out.data[i].name + "USDT");
                    var settingsIndex = settingsFile.pairs.findIndex(x => x.symbol === out.data[i].name + "USDT");
                    if (index === -1 || settingsIndex === 'undefined' || out.data[i].name.includes("1000")) {
                        //console.log("Skipping " + out.data[i].name + "USDT");
                    }
                    else {
                        //set risk then update long_price and short_price
                        var riskLevel = process.env.RISK_LEVEL;
                        if (riskLevel == 1) {
                            //add 0.5% to long_price and subtract 0.5% from short_price
                            var long_risk = out.data[i].long_price * 1.005
                            var short_risk = out.data[i].short_price * 0.995
                        }
                        else if (riskLevel == 2) {
                            //calculate price 1% below current price and1% above current price
                            var long_risk = out.data[i].long_price * 1.01
                            var short_risk = out.data[i].short_price * 0.99
                        }
                        else if (riskLevel == 3) {
                            //calculate price 2% below current price and 2% above current price
                            var long_risk = out.data[i].long_price * 1.02
                            var short_risk = out.data[i].short_price * 0.98
                        }
                        else if (riskLevel == 4) {
                            //calculate price 3% below current price and 3% above current price
                            var long_risk = out.data[i].long_price * 1.03
                            var short_risk = out.data[i].short_price * 0.97
                        }
                        else if (riskLevel == 5) {
                            //calculate price 4% below current price and 4% above current price
                            var long_risk = out.data[i].long_price * 1.04
                            var short_risk = out.data[i].short_price * 0.96
                        }
                        else {
                            var long_risk = out.data[i].long_price;
                            var short_risk = out.data[i].short_price;
                        }
                        //updated settings.json file
                        settingsFile.pairs[settingsIndex].long_price = long_risk;
                        settingsFile.pairs[settingsIndex].short_price = short_risk;
                    }
                }
                fs.writeFileSync('settings.json', JSON.stringify(settingsFile, null, 4));
            //if error load research.json file and update settings.json file
            }).catch(
                err => {
                    console.log(chalk.red("Reaseach API down Attempting to load research.json file, if this continues please contact @Crypt0gnoe or @Atsutane in Discord"));
                    var minOrderSizes = JSON.parse(fs.readFileSync('min_order_sizes.json'));
                    var settingsFile = JSON.parse(fs.readFileSync('settings.json'));
                    var researchFile = JSON.parse(fs.readFileSync('research.json'));
                    var settings = {};
                    settings["pairs"] = [];
                    for (var i = 0; i < researchFile.data.length; i++) {
                        //find index of pair in min_order_sizes.json "pair" key
                        var index = minOrderSizes.findIndex(x => x.pair === researchFile.data[i].name + "USDT");
                        var settingsIndex = settingsFile.pairs.findIndex(x => x.symbol === researchFile.data[i].name + "USDT");
                        try{
                            if (index === -1 || settingsIndex === 'undefined' || researchFile.data[i].name.includes("1000")) {
                                //console.log("Skipping " + researchFile.data[i].name + "USDT");
                            }
                            else {
                                //set risk then update long_price and short_price
                                var riskLevel = process.env.RISK_LEVEL;
                                if (riskLevel == 1) {
                                    //add 0.5% to long_price and subtract 0.5% from short_price
                                    var long_risk = researchFile.data[i].long_price * 1.005
                                    var short_risk = researchFile.data[i].short_price * 0.995
                                }
                                else if (riskLevel == 2) {
                                    //calculate price 1% below current price and1% above current price
                                    var long_risk = researchFile.data[i].long_price * 1.01
                                    var short_risk = researchFile.data[i].short_price * 0.99
                                }
                                else if (riskLevel == 3) {
                                    //calculate price 2% below current price and 2% above current price
                                    var long_risk = researchFile.data[i].long_price * 1.02
                                    var short_risk = researchFile.data[i].short_price * 0.98
                                }
                                else if (riskLevel == 4) {
                                    //calculate price 3% below current price and 3% above current price
                                    var long_risk = researchFile.data[i].long_price * 1.03
                                    var short_risk = researchFile.data[i].short_price * 0.97
                                }
                                else if (riskLevel == 5) {
                                    //calculate price 4% below current price and 4% above current price
                                    var long_risk = researchFile.data[i].long_price * 1.04
                                    var short_risk = researchFile.data[i].short_price * 0.96
                                }
                                else {
                                    var long_risk = researchFile.data[i].long_price;
                                    var short_risk = researchFile.data[i].short_price;
                                }
                                //updated settings.json file
                                settingsFile.pairs[settingsIndex].long_price = long_risk;
                                settingsFile.pairs[settingsIndex].short_price = short_risk;
                            }
                        }
                        catch(err){
                            console.log("Error updating " + researchFile.data[i].name + "USDT, this is likely due to not having this pair active in your settings.json file");
                        }


                    }
                    fs.writeFileSync('settings.json', JSON.stringify(settingsFile, null, 4));
                }
            );
        }
    }

}

//discord webhook
function orderWebhook(symbol, amount, side, position, pnl, qty) {
    if(process.env.USE_DISCORD == "true") {
        if (side == "Buy") {
            var color = '#00ff00';
        }
        else {
            var color = '#ff0000';

        }
        var dir = "";
        if (side === "Buy") {
            dir = "✅Long / ❌Short";
            var color = '#00ff00';
        } else {
            dir = "❌Long / ✅Short";
            var color = '#ff0000';
        }
        const embed = new MessageBuilder()
            .setTitle('New Liquidation | ' + symbol.toString() + ' | ' + dir)
            .addField('Symbol: ', symbol.toString(), true)
            .addField('Amount: ', amount.toString(), true)
            .addField('Liq. Vol.: ', qty.toString(), true)
            .addField('Side: ', dir, true)
            .setColor(color)
            .setTimestamp();
        try {
            hook.send(embed);
        }
        catch (err) {
            console.log(chalk.red("Discord Webhook Error"));
        }
    }
}

function calculateBotUptime(uptimeSeconds) {
    var elapsedDays = uptimeSeconds / 86400;  //days
    var restSeconds = uptimeSeconds % 86400;   // rest of seconds left
    var elapsedHours = restSeconds / 3600;          // hours
    restSeconds = restSeconds % 3600;
    var elapsedMinutes = restSeconds / 60;          // minutes
    var elapsedSeconds = restSeconds % 60;
    var times = [parseInt(elapsedDays), parseInt(elapsedHours), parseInt(elapsedMinutes), parseInt(elapsedSeconds)];
    return times;
}

//message webhook
function messageWebhook(message) {
    if(process.env.USE_DISCORD == "true") {
        const embed = new MessageBuilder()
            .setTitle('New Alert')
            .addField('Message: ', message, true)
            .setColor('#00FFFF')
            .setTimestamp();
        try {
            hook.send(embed);
        }
        catch (err) {
            console.log(chalk.red("Discord Webhook Error"));
        }
    }
}

//report webhook
async function reportWebhook() {
    if(process.env.USE_DISCORD == "true") {
        const settings = JSON.parse(fs.readFileSync('account.json', 'utf8'));
        //check if starting balance is set
        if (settings.startingBalance === 0) {
            settings.startingBalance = balance;
            fs.writeFileSync('account.json', JSON.stringify(settings, null, 4));
            var startingBalance = settings.startingBalance;
        }
        else {
            var startingBalance = settings.startingBalance;
        }

        //get current timestamp and calculate bot uptime
        const timestampNow = moment();
        const timeUptimeInSeconds = timestampNow.diff(timestampBotStart, 'seconds');
        const times = calculateBotUptime(timeUptimeInSeconds);

        //fetch balance
        var balance = await getBalance();
        var diff = balance - startingBalance;
        var percentGain = (diff / startingBalance) * 100;
        var percentGain = percentGain.toFixed(6);
        var diff = diff.toFixed(6);
        var balance = balance.toFixed(2);
        //fetch positions
        var positions = await linearClient.getPosition();
        var positionList = [];
        var openPositions = await totalOpenPositions();
        if(openPositions === null) {
            openPositions = 0;
        }
        var marg = await getMargin();
        var time = await getServerTime();
        //loop through positions.result[i].data get open symbols with size > 0 calculate pnl and to array
        for (var i = 0; i < positions.result.length; i++) {
            if (positions.result[i].data.size > 0) {
                
                var pnl1 = positions.result[i].data.unrealised_pnl;
                var pnl = pnl1.toFixed(6);
                var symbol = positions.result[i].data.symbol;
                var size = positions.result[i].data.size;
                var liq = positions.result[i].data.liq_price;
                var size = size.toFixed(4);
                var ios = positions.result[i].data.is_isolated;

                var priceFetch = await linearClient.getTickers({symbol: symbol});
                var test = priceFetch.result[0].last_price;

                let side = positions.result[i].data.side;
                var dir = "";
                if (side === "Buy") {
                    dir = "✅Long / ❌Short";
                } else {
                    dir = "❌Long / ✅Short";
                }

                var stop_loss = positions.result[i].data.stop_loss;
                var take_profit = positions.result[i].data.take_profit;
                var price = positions.result[i].data.entry_price;
                var fee = positions.result[i].data.occ_closing_fee;
                var price = price.toFixed(4);
                //calulate size in USDT
                var usdValue = (positions.result[i].data.entry_price * size) / process.env.LEVERAGE;
                var position = {
                    "symbol": symbol,
                    "size": size,
                    "side": dir,
                    "sizeUSD": usdValue.toFixed(3),
                    "pnl": pnl,
                    "liq": liq,
                    "price": price,
                    "stop_loss": stop_loss,
                    "take_profit": take_profit,
                    "iso": ios,
                    "test": test,
                    "fee": fee.toFixed(3)
                }
                positionList.push(position);
            }
        }

        const embed = new MessageBuilder()
            .setTitle("```"+'---------------------------Bot Report---------------------------'+"```")
            .addField('Balance: ', "```autohotkey"+'\n'+balance.toString()+"```", true)
            .addField('Leverage: ', "```autohotkey"+'\n'+process.env.LEVERAGE.toString()+"```", true)
            //.addField('Version: ', version.commit.toString(), true)
            .addField('Total USDT in Posi: ', "```autohotkey"+'\n'+marg.toFixed(2).toString()+"```", true)
            .addField('Profit USDT: ', "```autohotkey"+'\n'+diff.toString()+"```", true)
            .addField('Profit %: ', "```autohotkey"+'\n'+percentGain.toString()+"```"+'\n', true)
            .addField('Bot UpTime: ', "```autohotkey" + '\n' + times[0].toString() + " days " + times[1].toString() + " hr. " + times[2].toString() + " min. " + times[3].toString() + " sec." + "```", true)
            .addField('Server Time: ', "```autohotkey"+'\n'+time.toString()+"```", true)
            .addField("","",true)
            .addField("","",true)
            .setFooter('Open Positions: ' + openPositions.toString())
            //for each position in positionList add field only 7 fields per embed
            for(var i = 0; i < positionList.length; i++) {stop_loss
                embed.addField(positionList[i].symbol,'\n'
                +"```autohotkey"+'\n'
                +"Isolated: " + positionList[i].iso +'\n'
                +"Closing Fee: " + positionList[i].fee +'\n'
                +"Size: " + positionList[i].size +'\n'
                +"Value in $: " + positionList[i].sizeUSD +'\n'
                + "PnL: " + positionList[i].pnl+'\n'+"```"
                +"```fix"+'\n'+ positionList[i].side+"```"
                +"```autohotkey"+'\n'
                +"Price: " + positionList[i].test +'\n'
                + "Entry Price: " + positionList[i].price+'\n'
                + "Stop Loss: " + positionList[i].stop_loss+'\n'
                + "Take Profit: " + positionList[i].take_profit+'\n'
                + "Liq Price: " + positionList[i].liq+"```", true);
            }
            //purple color
            embed.setColor('#9966cc')
            .setTimestamp();
        try {
            hook.send(embed);
        }
        catch (err) {
            console.log(chalk.red("Discord Webhook Error"));
        }
    }
}


async function main() {
    console.log("Starting Lick Hunter!");
    try{
        pairs = await getSymbols();

        //load local file acccount.json with out require and see if "config_set" is true
        var account = JSON.parse(fs.readFileSync('account.json', 'utf8'));
        if (account.config_set == false) {
            var isSet = await setPositionMode();
            if (isSet == true) {
                //set to true and save
                account.config_set = true;
                fs.writeFileSync('account.json', JSON.stringify(account));
            }

        }

        if(process.env.UPDATE_MIN_ORDER_SIZING == "true") {
            await getMinTradingSize();
        }
        if (process.env.USE_SMART_SETTINGS.toLowerCase() == "true") {
            console.log("Updating settings.json with smart settings");
            await createSettings();
        }
        if (process.env.USE_SET_LEVERAGE.toLowerCase() == "true") {
            await setLeverage(pairs, process.env.LEVERAGE);
            
        }
    }
    catch (err) {
        console.log(chalk.red("Error in main()"));

        if (process.env.USE_DISCORD == "true")
            messageWebhook(err);
            
        await sleep(10000);
    }

    await liquidationEngine(pairs);

    while (true) {
        try {
            await getBalance();
            await updateSettings();
            await checkOpenPositions();
            await sleep(rateLimit);
        } catch (e) {
            console.log(e);
            sleep(1000);
            rateLimit = rateLimit + 1000;
        }
    }

}



try {
    main();
}
catch (error) {
    console.log(chalk.red("Error: ", error));

    if (process.env.USE_DISCORD == "true")
        messageWebhook(error);

    main();
}
