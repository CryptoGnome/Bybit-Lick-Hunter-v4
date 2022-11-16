var data;
var settings;

async function readData() {
    const response = await fetch('http://localhost:5000/data');
    data = await response.json();
   // console.log(data);
}

async function readSettings() {
    const response = await fetch('http://localhost:5000/settings');
    settings = await response.json();
    return settings;

}

async function saveSettings() {
    settings.apiKey = document.getElementById('apiKey').value;
    settings.apiSecret = document.getElementById('apiSecret').value;
    settings.takeProfit = document.getElementById('takeProfit').value;
    settings.stopLoss = document.getElementById('stopLoss').value;
    settings.leverage = document.getElementById('leverage').value;
    settings.minVolume = document.getElementById('minVolume').value;
    settings.longOffset = document.getElementById('longOffset').value;
    settings.shortOffset = document.getElementById('shortOffset').value;
    settings.maxOpenPositions = document.getElementById('maxOpenPositions').value;


    //save to local json file
    const response = await fetch('http://localhost:5000/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    });
    const data = await response.json();
    //console.log(data);
    await loadSettings();

}

//load settings and insert into html values
async function loadSettings() {
    await readSettings();
    document.getElementById('apiKey').value = settings.apiKey;
    document.getElementById('apiSecret').value = settings.apiSecret;
    document.getElementById('takeProfit').value = settings.takeProfit;
    document.getElementById('stopLoss').value = settings.stopLoss;
    document.getElementById('leverage').value = settings.leverage;
    document.getElementById('minVolume').value = settings.minVolume;
    document.getElementById('longOffset').value = settings.longOffset;
    document.getElementById('shortOffset').value = settings.shortOffset;
    document.getElementById('maxOpenPositions').value = settings.maxOpenPositions;
}

async function updatePositions() {
    //from data get loop through openPositions and add to table
    var table = document.getElementById("openPositionsTable");
    for (var i = 0; i < data.openPositions.length; i++) {
        //check if pair is already in table
        var pair = data.openPositions[i].pair;
        var row = document.getElementById(pair);
        if (row == null) {
            //creat and add row
            var row = table.insertRow(-1);
            row.id = pair;
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);
            var cell5 = row.insertCell(4);
            var cell6 = row.insertCell(5);
            cell1.innerHTML = pair;
            cell1.innerHTML = data.openPositions[i].pair;
            cell2.innerHTML = data.openPositions[i].side;
            cell3.innerHTML = data.openPositions[i].size;
            cell4.innerHTML = data.openPositions[i].entryPrice;
            cell5.innerHTML = data.openPositions[i].liquidationPrice;
            cell6.innerHTML = data.openPositions[i].pnl;
        }
        else {
            //update row
            row.cells[0].innerHTML = data.openPositions[i].pair;
            row.cells[1].innerHTML = data.openPositions[i].side;
            row.cells[2].innerHTML = data.openPositions[i].size;
            row.cells[3].innerHTML = data.openPositions[i].entryPrice;
            row.cells[4].innerHTML = data.openPositions[i].liquidationPrice;
            row.cells[5].innerHTML = data.openPositions[i].pnl;
        }
    }
}

//load active pairs
async function loadPairs() {
    var table = document.getElementById("activePairs");
    await readSettings();
    for (var i = 0; i < settings.symbols.length; i++) {
        //check if symbol is already in table
        var symbol = settings.symbols[i].symbol;
        //remove liquidations. from symbol
        symbol = symbol.replace("liquidations.", "");
        var row = document.getElementById(symbol);
        if (row == null) {
            //creat and add row
            var row = table.insertRow(-1);
            row.id = symbol;
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);

            cell1.innerHTML = symbol;
            cell2.innerHTML = settings.symbols[i].size;
        }
        else {
            //update row
            row.cells[0].innerHTML = symbol;
            row.cells[1].innerHTML = settings.symbols[i].size;
        }
    }


}

//add symbol to settings.json
async function addSymbol() {
    var symbol = "liquidations." + document.getElementById('pair').value;
    var minOrderSize = document.getElementById('orderSize').value;
    var form = { "symbol": symbol, size: minOrderSize };
    const response = await fetch('http://localhost:5000/addSymbol', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
    });
    const data = await response.json();
    console.log(data);
    await loadSettings();
}

  
    


//update html
async function updateHtml() {
    console.log("update html");
    await readData();
    document.getElementById('balance').innerHTML = data.balance;
    document.getElementById('profit').innerHTML = data.profit;
    //update positions
    await updatePositions();
    await loadPairs();
}


async function main() {
    await loadSettings();
    await updateHtml(); 
    //run update html every 5 seconds
    setInterval(updateHtml, 5000); 
}

main();
