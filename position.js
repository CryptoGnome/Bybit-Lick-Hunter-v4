
export function incrementPosition(position, order, aux = {}) {
  let updated_position = position;
  position.size = order.qty;
  position.price = order.last_exec_price;
  const usdValue = position.price * position.size / process.env.LEVERAGE;
  position.sizeUSD =  usdValue.toFixed(3);
  Object.entries(aux).forEach( ([k, v]) => position[k] = v );
};

export function closePosition(position, order) {
  let updated_position = position;
  position._end_time= order.create_time;
  position.price = order.last_exec_price;
  const usdValue = position.price * position.size / process.env.LEVERAGE;
  position.sizeUSD =  usdValue.toFixed(3);
  position._roi = position.side == "Buy" ? (position.price - position._start_price) / position._start_price : 
    (position._start_price - position.price) / position._start_price;
};

export function updatePosition(position, obj = {}) {
  Object.entries(obj).forEach( ([k, v]) => position[k] = v );
};

export function newPosition(order) {

  let position = {
    "symbol": order.symbol,
    "size": order.qty,
    "side": order.side,
    "sizeUSD": 0,
    "pnl": 0,
    "liq": 0,
    "price": order.last_exec_price,
    "stop_loss": order.stop_loss,
    "take_profit": order.take_profit,
    "fee": 0,
    "_max_loss" : 0,
    "_liquidity_trigger": order.liquidity_trigger,
    "_dca_count" : 0,
    "_start_price" : order.last_exec_price,
    "_start_time" : order.created_time,
    "_end_time": undefined,
    "_roi": undefined,
  };
  const usdValue = position.price * position.size / process.env.LEVERAGE;
  position.sizeUSD =  usdValue.toFixed(3);
  return position;
};
