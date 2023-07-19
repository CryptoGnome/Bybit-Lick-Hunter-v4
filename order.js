import { env } from 'process';

export async function createMarketOrder(linearClient, pair, side, size, take_profit = 0, stop_loss = 0) {

  var cfg = {
    side: side,
    order_type: "Market",
    symbol: pair,
    qty: size,
    time_in_force: "GoodTillCancel",
    reduce_only: false,
    close_on_trigger: false
  };

  if (take_profit != 0)
    cfg['take_profit'] = take_profit;
  if (stop_loss != 0)
    cfg['stop_loss'] = stop_loss;

  // send order payload
  const order = await linearClient.placeActiveOrder(cfg);
  return order;
}

export async function createLimitOrder(linearClient, pair, side, size, price, take_profit = 0, stop_loss = 0) {

  var cfg = {
    side: side,
    order_type: "Limit",
    symbol: pair,
    qty: size,
    time_in_force: "GoodTillCancel",
    reduce_only: false,
    close_on_trigger: false,
    price: price
  };

  if (take_profit != 0)
    cfg['take_profit'] = take_profit;
  if (stop_loss != 0)
    cfg['stop_loss'] = stop_loss;

  // send order payload
  const order = await linearClient.placeActiveOrder(cfg);
  return order;
}

export async function cancelOrder(linearClient, pair) {
  return await linearClient.cancelAllActiveOrders({'symbol': pair});
}