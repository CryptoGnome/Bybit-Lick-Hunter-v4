import { env } from 'process';
import moment from 'moment';
import fs from 'fs';

export const LOG_LEVEL = {
  UNDEFINED : -1,
  DEBUG : 0,
  INFO  : 1,
  WARNING : 2,
  ERROR : 3,
};

const logLevelStr = ["DEBUG", "INFO", "WARNING", "ERROR"];

export function logIT(msg, level = LOG_LEVEL.INFO) {

  const logLevel = logLevelStr.findIndex(el => el == process.env.LOG_LEVEL);
  if (logLevel == -1)
    console.log('[' + moment().local().toString() + '] :: ' + "ERROR BAD LOG LEVEL")

  if (level < logLevel)
    return;

  console.log('[' + moment().local().toString() + '] :: ' + msg)
// Log to file
  if (process.env.USE_LOG == "true"){
      fs.appendFile('log', '[' + moment().local().toString() + '] ' + msg.replace(/\u001b\[\d+m/g, '') + '\n', function (err) {
          if (err) {
              logIT("Logging error: " + err);
              return console.log("Logging error: " + err);
          }
      });
  }
}
