import fs from "fs";
import moment from "moment";

export function storeJson(fname, jsonObj) {
  fs.writeFileSync(fname, JSON.stringify(jsonObj), function (err) {
    if (err) {
      logIT(err);
    }
  });
}

export function loadJson(fname, obj) {
  if (fs.existsSync(fname)) {
    const json_data = fs.readFileSync(fname, "utf8");
    let jsonObj = JSON.parse(json_data);
    Object.entries(jsonObj).forEach(([k, v]) => (obj[k] = v));
  }
}

function jsonToCsv(json) {
  const value = "null";
  const items = json;
  const replacer = (key, value) => (value === null ? "" : value); // specify how you want to handle null values here
  const header = Object.keys(items[0]);
  const csv = [
    header.join(","), // header row first
    ...items.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(",")
    ),
  ].join("\r\n");
  return csv;
}

export function traceTrade(step, obj, fields, format = "JSON") {
  if (format == "JSON") {
    traceTradeAsJSON(step, obj, fields);
  } else {
    traceTradeAsCSV(step, obj, fields);
  }
}

export function traceTradeAsJSON(step, obj, fields) {
  //Object.entries(obj).forEach( ([k, v]) => position[k] = v );

  let tradeObj = {'step': step, ...obj};
  let records = [];

  if (fs.existsSync("trades.json")) {
    let jsonFile = fs.readFileSync("trades.json","utf-8");
    records = JSON.parse(jsonFile);
  }

  records.push(tradeObj);
  fs.writeFileSync("trades.json", JSON.stringify(records, null, '\t'));
}

export function traceTradeAsCSV(step, obj, fields) {
  let csv_line = moment().local().toString() + "," + step;
  fields.forEach((key) => (csv_line += "," + (obj[key] ?? "")));
  csv_line += "\n";

  if (!fs.existsSync("trades.csv")) {
    let csv_header = "time, step";
    fields.forEach((key) => (csv_header += "," + key));
    csv_line = csv_header + "\n" + csv_line;
  }

  fs.appendFile(
    "trades.csv",
    csv_line.replace(/\u001b\[\d+m/g, ""),
    function (err) {
      if (err) {
        logIT("Logging error: " + err);
        return console.log("Logging error: " + err);
      }
    }
  );
}
