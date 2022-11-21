import pkg from 'bybit-api-gnome';
const { WebsocketClient, WS_KEY_MAP, LinearClient} = pkg;
import { config } from 'dotenv';
config();
import fetch from 'node-fetch';
import chalk from 'chalk';
import fs from 'fs';
import { Webhook, MessageBuilder } from 'discord-webhook-node';

var hook;
if (process.env.USE_DISCORD) {
    hook = new Webhook(process.env.DISCORD_URL);
}

const key = process.env.API_KEY;
const secret = process.env.API_SECRET;
var rateLimit = 1000;
var baseRateLimit = 1000;
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

wsClient.on('update', (data) => {
    //console.log('raw message received ', JSON.stringify(data, null, 2));
    var pair = data.data.symbol;
    var price = parseFloat(data.data.price);
    var side = data.data.side;
    //convert to float
    var qty = parseFloat(data.data.qty);
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
    process.env.BLACKLIST.split(', ').forEach(item => {
        blacklist.push(item);
    });

    //if pair is not in liquidationOrders array and not in blacklist, add it
    if (index === -1 && !blacklist.includes(pair)) {
        liquidationOrders.push({pair: pair, price: price, side: side, qty: qty, amount: 1, timestamp: timestamp});
        index = liquidationOrders.findIndex(x => x.pair === pair);
    }
    //if pair is in liquidationOrders array, update it
    else if (!blacklist.includes(pair)) {
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
            console.log(chalk.magenta("[" + liquidationOrders[index].amount + "] " + dir + " Liquidation order for " + liquidationOrders[index].pair + " with a cumulative value of " + liquidationOrders[index].qty + " USDT"));
            scalp(pair, index);
        }
        else {
            console.log(chalk.magenta("[" + liquidationOrders[index].amount + "] " + dir + " Liquidation order for " + liquidationOrders[index].pair + " with a cumulative value of " + liquidationOrders[index].qty + " USDT"));
            console.log(chalk.gray("Not enough liquidations to trade " + liquidationOrders[index].pair));
        }

    }
    else {
        console.log(chalk.gray("Liquidation Found for Blacklisted pair: " + pair + " ignoring..."));
    }
});

wsClient.on('open', (data,) => {
    //console.log('connection opened open:', data.wsKey);
    //catch error
    if (data.wsKey === WS_KEY_MAP.WS_KEY_ERROR) {
        console.log('error', data);
        return;
    }
    //console.log("Connection opened");
});
wsClient.on('response', (data) => {
    if (data.wsKey === WS_KEY_MAP.WS_KEY_ERROR) {
        console.log('error', data);
        return;
    }
    //console.log("Connection opened");
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
//get account balance
async function getBalance() {
    const data = await linearClient.getWalletBalance();
    var availableBalance = data.result['USDT'].available_balance;
    var usedBalance = data.result['USDT'].used_margin;
    var balance = availableBalance + usedBalance;
    //load settings.json
    const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
    //check if starting balance is set
    if (settings.startingBalance === 0) {
        settings.startingBalance = balance;
        fs.writeFileSync('settings.json', JSON.stringify(settings, null, 4));
        var startingBalance = settings.startingBalance;
    }
    else {
        var startingBalance = settings.startingBalance;
    }

    var diff = balance - startingBalance;
    var percentGain = (diff / startingBalance) * 100;
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
        checkCommit();
        lastReport = Date.now();
    }
    return balance;

}
//get position
async function getPosition(pair) {
    //gor through all pairs and getPosition()
    var positions = await linearClient.getPosition();
    //console.log("Positions: " + JSON.stringify(positions, null, 2));
    if (positions.result !== null) {
        //look for pair in positions
        var index = positions.result.findIndex(x => x.data.symbol === pair);
        //console.log("Index: " + index);

        if (positions.result[index].data.size > 0) {
            //console.log(positions.result[index].data);
            console.log(chalk.blueBright("Open position found for " + positions.result[index].data.symbol + " with a size of " + positions.result[index].data.size + " contracts" + " with profit of " + positions.result[index].data.realised_pnl + " USDT"));
            if (positions.result[index].data.side === "Buy") {
                var side = "Sell";
            }
            else {
                var side = "Buy";
            }
            var profit = positions.result[index ].data.unrealised_pnl;
            //calculate the profit % change in USD
            var margin = positions.result[index ].data.position_value/process.env.LEVERAGE;
            var percentGain = (profit / margin) * 100;
            return {side: side, entryPrice: positions.result[index].data.entry_price , size: positions.result[index].data.size, percentGain: percentGain};

        }
        else {
            return {side: "None", entryPrice: 0, size: 0, percentGain: 0};
        }

    }
    else {
        console.log("Open positions response is null");
        return {side: "None", entryPrice: 0, size: 0, percentGain: 0};
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

        }

    }
    else {
        //console.log("Take profit already set for " + symbol);
    }

}
//fetch how how openPositions there are
async function totalOpenPositions() {
    try{
        var positions = await linearClient.getPosition();
        //loop through to see which positions are open
        var open = 0;
        for (var i = 0; i < positions.result.length; i++) {
            if (positions.result[i].data.size > 0) {
                open++;
            }
        }
        return open;

    }
    catch (error) {
        return null;
    }
}
//against trend
async function scalp(pair, index) {
    //check how many positions are open
    var openPositions = await totalOpenPositions();

    //var index = liquidationOrders.findIndex(x => x.symbol === pair);
    //Long liquidation
    if (liquidationOrders[index].side === "Buy") {
        const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
        var settingsIndex = settings.pairs.findIndex(x => x.symbol === pair);
        if(settingsIndex !== -1) {
            if (liquidationOrders[index].price < settings.pairs[settingsIndex].long_price)  {
                //see if we have an open position
                var position = await getPosition(pair);
                //create algo that is based of position size and the amount of pnl
                //console.log(position);
                if (position.side === "Buy" && position.percentGain <= 0) {
                    //maxe sure order is less than max order size
                    if (position.size < settings.pairs[settingsIndex].max_position_size) {
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
                        if(process.env.USE_DISCORD) {
                            orderWebhook(pair, settings.pairs[settingsIndex].order_size, "Buy", position.size, position.percentGain);
                        }
                    }
                    else {
                        //max position size reached
                        console.log("Max position size reached for " + pair);
                    }
                }
                else if (position.side === "None" && openPositions < process.env.MAX_OPEN_POSITIONS && openPositions !== null) {
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
                    if(process.env.USE_DISCORD) {
                        orderWebhook(pair, settings.pairs[settingsIndex].order_size, "Buy", position.size, position.percentGain);
                    }
                }
                else {
                    if(openPositions > process.env.MAX_OPEN_POSITIONS) {
                        console.log(chalk.redBright("Max Positions Reached!"));
                    }
                }

            }
            else {
                console.log(chalk.cyan("!! Liquidation price " + liquidationOrders[index].price + " is higher than long price " + settings.pairs[settingsIndex].long_price + " for " + pair));
            }
        }
        else {
            console.log("Pair does not exist in settings.json");
        }

    }
    else {
        const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
        var settingsIndex = settings.pairs.findIndex(x => x.symbol === pair);
        if(settingsIndex !== -1) {
            if (liquidationOrders[index].price > settings.pairs[settingsIndex].short_price)  {
                //see if we have an open position
                var position = await getPosition(pair);
                //create algo that is based of position size and the amount of pnl
                //console.log(position);
                if (position.side === "Sell" && position.percentGain <= 0) {
                    //maxe sure order is less than max order size
                    if (position.size < settings.pairs[settingsIndex].max_position_size) {
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
                        if(process.env.USE_DISCORD) {
                            orderWebhook(pair, settings.pairs[settingsIndex].order_size, "Sell", position.size, position.percentGain);
                        }
                    }
                }
                else if (position.side === "None" && openPositions < process.env.MAX_OPEN_POSITIONS && openPositions !== null) {
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
                    if(process.env.USE_DISCORD) {
                        orderWebhook(pair, settings.pairs[settingsIndex].order_size, "Sell", position.size, position.percentGain);
                    }
                }
                else {
                    if(openPositions > process.env.MAX_OPEN_POSITIONS) {
                        console.log(chalk.redBright("Max Positions Reached!"));
                    }

                }

            }
            else {
                console.log(chalk.cyan("!! Liquidation price " + liquidationOrders[index].price + " is lower than short price " + settings.pairs[settingsIndex].short_price + " for " + pair));
            }
        }
        else {
            console.log("Pair does not exist in settings.json");
        }
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
                console.log(chalk.redBright("ERROR setting leverage for " + pair + " to " + leverage, "Check Max Leverage for this pair"));
                console.log(chalk.redBright("Blacklist " + pair + " in settings.json"));
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
            await sleep(1000);
        }

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
        rateLimit = rateLimit + 25;
        console.log("Rate limit status: " + chalk.greenBright(positions.rate_limit_status));
    }
    else if (positions.rate_limit_status > 50) {
        rateLimit = rateLimit + 100;
        console.log("Rate limit status: " + chalk.yellowBright(positions.rate_limit_status));
    }
    else if (positions.rate_limit_status > 25) {
        rateLimit = rateLimit + 200;
        console.log("Rate limit status: " + chalk.yellow(positions.rate_limit_status));
    }
    else {
        rateLimit = rateLimit + 20;
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

    var minOrderSizes = [];
    console.log("Fetching min Trading Sizes for pairs, this could take a minute...");
    for (var i = 0; i < data.result.length; i++) {
        console.log("Pair: " + data.result[i].name + " Min Trading Size: " + data.result[i].lot_size_filter.min_trading_qty);
        //check if min_trading_qty usd value is less than process.env.MIN_ORDER_SIZE
        var minOrderSize = data.result[i].lot_size_filter.min_trading_qty;
        //get price of pair
        var priceFetch = await linearClient.getTickers({symbol: data.result[i].name});
        var price = priceFetch.result[0].last_price
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
    fs.writeFileSync('min_order_sizes.json', JSON.stringify(minOrderSizes, null, 4));


}
//get all symbols
async function getSymbols() {
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
//sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//auto create settings.json file
async function createSettings() {
    var minOrderSizes = JSON.parse(fs.readFileSync('min_order_sizes.json'));
    //get info from https://api.liquidation.report/public/research
    const url = "https://api.liquidation.report/public/research";
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
                //add line to settings.json file  "startingBalance": 0
                settings["startingBalance"] = 0;

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
            var minOrderSizes = JSON.parse(fs.readFileSync('min_order_sizes.json'));
            var settingsFile = JSON.parse(fs.readFileSync('settings.json'));
            const url = "https://api.liquidation.report/public/research";
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
                            console.log("Error updating " + researchFile.data[i].name + "USDT, this is liekly due to not having this pair active in your settings.json file");
                        }


                    }
                    fs.writeFileSync('settings.json', JSON.stringify(settingsFile, null, 4));
                }
            );
        }
    }

}

//discord webhook
function orderWebhook(symbol, amount, side, position, pnl) {
    if (side == "Buy") {
        var color = '#00ff00';
    }
    else {
        var color = '#ff0000';

    }
    const embed = new MessageBuilder()
        .setTitle('New Liquidation')
        .addField('Symbol: ', symbol.toString(), true)
        .addField('Amount: ', amount.toString(), true)
        .addField('Side: ', side, true)
        .setColor(color)
        .setTimestamp();
    try {
        hook.send(embed);
    }
    catch (err) {
        console.log(chalk.red("Discord Webhook Error"));
    }


}

//message webhook
function messageWebhook(message) {
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

//report webhook
async function reportWebhook() {
    const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
    //check if starting balance is set
    if (settings.startingBalance === 0) {
        settings.startingBalance = balance;
        fs.writeFileSync('settings.json', JSON.stringify(settings, null, 4));
        var startingBalance = settings.startingBalance;
    }
    else {
        var startingBalance = settings.startingBalance;
    }


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
    //loop through positions.result[i].data get open symbols with size > 0 calculate pnl and to array
    for (var i = 0; i < positions.result.length; i++) {
        if (positions.result[i].data.size > 0) {
            var pnl = positions.result[i].data.realised_pnl;
            var pnl = pnl.toFixed(6);
            var symbol = positions.result[i].data.symbol;
            var size = positions.result[i].data.size;
            var size = size.toFixed(4);
            //calulate size in USDT
            var usdValue = (positions.result[i].data.entry_price * size) / process.env.LEVERAGE;
            var position = {
                "symbol": symbol,
                "size": size,
                "sizeUSD": usdValue.toFixed(6),
                "pnl": pnl
            }
            positionList.push(position);
        }
    }

    const embed = new MessageBuilder()
        .setTitle('------------------------- Bot Report -------------------------')
        .addField('Current Balance: ', balance.toString(), true)
        .addField('Profit USDT: ', diff.toString(), true)
        .addField('Profit %: ', percentGain.toString(), true)
        .setFooter('Open Positions: ' + openPositions.toString())
        //for each position in positionList add field only 7 fields per embed
        for(var i = 0; i < positionList.length; i++) {
            embed.addField(positionList[i].symbol, "Size: " + positionList[i].size + " | Value " + positionList[i].sizeUSD + " USDT" + " | Unrealized PnL: " + positionList[i].pnl, true);
        }
        //purple color
        embed.setColor('#800080')
        .setTimestamp();
    try {
        hook.send(embed);
    }
    catch (err) {
        console.log(chalk.red("Discord Webhook Error"));
    }



}

async function main() {
    console.log("Starting Lick Hunter!");
    pairs = await getSymbols();

    if(process.env.UPDATE_MIN_ORDER_SIZING == "true") {
        await getMinTradingSize();
    }
    if (process.env.USE_SMART_SETTINGS.toLowerCase() == "true") {
        console.log("Using Smart Settings");
        if (fs.existsSync('settings.json')) {
            console.log("Found existing Settings.json file.");
        } else {
            console.log("Creating Settings.json file.");
            await createSettings();
        }
    }
    if (process.env.USE_SET_LEVERAGE.toLowerCase() == "true") {
        console.log("Using Set Leverage");\
        await setLeverage(pairs, process.env.LEVERAGE);
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


async function checkCommit() {
    const response = await fetch('https://api.github.com/repos/CryptoGnome/Bybit-Lick-Hunter-v4/commits');
    const commits = await response.json();
    const latestCommit = commits.length;
    //open version.json
    const version = JSON.parse(fs.readFileSync('version.json', 'utf8'));
    //check if latest commit is different from version.json
    if (version.commit === 0) {
        version.commit = latestCommit;
        console.log(chalk.bgBlueBright("No commit found in version.json, setting commit to " + latestCommit));
        fs.writeFileSync('version.json', JSON.stringify(version, null, 4));
    }
    else if (version.commit != latestCommit) {
        console.log(chalk.red("New Update Available on Github!"));
        console.log(chalk.red("Please update to the latest version!"));
        messageWebhook("New Update Available! Please update to the latest version!");    
    }
}





try {
    checkCommit();
    main();
}
catch (error) {
    console.log(chalk.red("Error: ", error));
    if(process.env.USE_DISCORD) {
        messageWebhook(error);
    }
    main();
}
