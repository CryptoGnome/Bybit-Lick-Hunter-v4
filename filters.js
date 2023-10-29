import fetch from 'node-fetch';
import { logIT, LOG_LEVEL } from './log.js';

export async function checkListingDate(symbol, days) {
  let res = false;
  try {
    const today = new Date(); // Current date and time
    today.setHours(0, 0, 0, 0); // Set the time to 00:00

    const startDaysAgo = new Date(today);
    const endDaysAgo = new Date(today);
    startDaysAgo.setDate(today.getDate() - days);
    endDaysAgo.setDate(today.getDate() - (days - 1));
    const startTimestamp = startDaysAgo.getTime();
    const endTimestamp = endDaysAgo.getTime();

    const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=D&start=${startTimestamp}&end=${endTimestamp}`;

    const response = await fetch(url);
    const data = await response.json();
    res = data.result.list.length > 0;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
  return res;
}

export async function getVolatility(symbol, days) {
  let vol = 0;
  try {
    const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=D&limit=${days}`;
    const response = await fetch(url);
    const data = await response.json();
    const historicalData = data.result.list;

    // data are in format ts, ohlcv
    vol = Math.max(...historicalData.map(item => (Number(item[2]) - Number(item[3])) / Number(item[3])));
  } catch (error) {
    throw error;
  }

  return vol;
}
