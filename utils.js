import fs from "fs";

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
