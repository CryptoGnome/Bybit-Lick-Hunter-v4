![CryptoGnome_a_robot_multiple_stock__crypto_screens_wall_street__12b4bad1-1b9a-4afb-8661-05cf768f6761](https://i.imgur.com/3FQpf1D.jpg)

Lick Hunter v4 is a full rewrite of LickHunter using some of the skills I have learned in the past two years and fully async compatable in Node JS. I have also released all of the source code in hope that if other users want to contribute to the project or add new features it is avaialable to them.


---

![image](https://user-images.githubusercontent.com/33667144/202498893-b747c8d2-0b12-43f0-96a9-2f637fe70558.png)

*First off if you enjoy using open source software please use my refferel link to create a new account when using this bot, its free and helps me make more cool stuff for you guys:*

https://partner.bybit.com/b/lickhunterv4

<br>
<br>

### Suggested OS to Linux Unbuntu Vultr
![image](https://user-images.githubusercontent.com/33667144/202495972-17734217-541c-49ab-ae34-b459fb6138c2.png)

*Using a VPS can ensure high uptime and is much more stable than running on your own PC*

[VULTR IS OUR RECOMMENDED VPS PROVIDER](https://www.vultr.com/?ref=9056023-8H)

<br>
<br>

### Quick Linux Setup Steps:
*run each of these one at a time in the terminal, and wait for each to complete*

```
apt install npm
```

```
npm install n -g
```

```
n stable
```


```
apt install git
```

```
git clone https://github.com/CryptoGnome/Bybit-Lick-Hunter-v4.git
```

```
cd Bybit-Lick-Hunter-v4
```

```
npm install
```

```
cp example.env .env
```


*edit .env to the setup you wish to run you can learn more about the settings int the next section below*

```
sudo npm install pm2 -g 
```

```
pm2 start app.js
```

```
pm2 monit 
```


*Using pm2 will allow the bot to catch restarts and run after you close the server, if you are familiar with linux and would prefer to use screen you could also do that.*

### Using the dockerfile:

To run the bot as docker container just do it this way

```
docker build -t lick-hunter .
```

```
docker run -p 3000:3000 --name lick-hunter-container lick-hunter
```

*Dont forget to set your api inside the dockerfile*

```

# Set environment variables for .env file
ENV API_KEY=apikeyhere
ENV API_SECRET=apisecrethere
ENV GUI_PASSWORD=password
ENV FIRST_START=false
```

### Settings Explained:
```
API_KEY = apikeyhere  /// Bybit API Key
API_SECRET = apisecrether /// Bybit API Key
GUI_PASSWORD = password // Your personal password to access the gui
GUI_SESSION_PASSWORD = secret // Private signing key for session cookie 
WITHDRAW=false // set true to activate withdrawl function
WITHDRAW_ADDRESS = withdrawladdresshere // Set your withdrawl address, make sure its set on trusted on bybit before, also you need to set your IP whitelisted
WITHDRAW_ACCOUNT = SPOT // Wallet to withdraw from (SPOT/FUND)
WITHDRAW_COIN = USDT // Coin to withdraw
WITHDRAW_CHAIN = SOL // Chain to withdraw from, make sure to select the right chain for specific coin. You can see more information on bybit on manual withdraw window
AMOUNT_TO_WITHDRAW=10 // Here you can set the amount you want to withdrawl
TRANSFER_TO_SPOT = false       // set to true for auto funds transfer to spot account
AMOUNT_TO_SPOT=10 // Here you can set the amount transferred to spot
MARGIN = CROSS // Margin for every trade to use (ISOLATED/CROSS)
LEVERAGE = 10 // Default Leverage to use
MAX_POSITION_SIZE_PERCENT = 1 // Max Position a single pair can use in equity
MAX_OPEN_POSITIONS = 10 // Max Amount of Positions the bot will open
PERCENT_ORDER_SIZE = 0.01 // Deafult order size the bot will use, if this is not bigger than minimum bot will use min order size (START WITH SMALL %  TO TEST!!!)
MIN_LIQUIDATION_VOLUME = 500 // the min liquidation amount in USDT in a period of 5s that the bot will trade on (bot will count up over multiple liquidations)
USE_DCA_FEATURE = true // If another liquidation happens but the position is already open, the PERCENT_ORDER_SIZE will be opened as a DCA order 
TAKE_PROFIT_PERCENT = 0.886 // take profit limit, will be adjust based on average entry price
STOP_LOSS_PERCENT = 20 // stop loss  will be adjusted based on avg entry price
USE_STOPLOSS = true // bool for using stop loss
USE_SMART_SETTINGS = true // New feature that will auto setup setting based on AI data from https://liquidation.report/research to find the best offsets
UPDATE_MIN_ORDER_SIZING = true // this will auto create order sizing for you based on PERCENT_ORDER_SIZE and update it as you balance changes
RISK_LEVEL = 2 // 1-5 this will adjust risk by ajusting offsets of the the Smart settings 1 = conservative 5 = very risky
BLACKLIST = ETHUSDT, BTCUSDT, C98USDT // Place symbols you do not want to trade here
USE_WHITELIST = false   // if true only pairs in WHITELIST will be traded
WHITELIST = ETHUSDT, ETCUSDT, BTCUSDT, BCHUSDT, LINKUSDT, LTCUSDT, FTMUSDT, MANAUSDT, MAGICUSDT, ADAUSDT, AAVEUSDT, SOLUSDT, FILUSDT
USE_DISCORD = false // if you want to use discord webhooks make this true and add link to channel below
DISCORD_URL = webhook_url_here //webhook url for discord channel here
DISCORD_REPORT_INTERVALL = */5 * * * *  // cron style timeing for the report send to discord webhook - ex.  */5 * * * * will send every 5 seconds; 00 */1 * * * * will send every hout at 00:00 01:00 02:00 and so on..
```
<br>

*Webhook Examples*

![image](https://i.imgur.com/XU6albd.png)

![image](https://i.imgur.com/cpqyDat.png)

<br>

### API settings for all features

To prevent error with fetch balance and similar you should check the API settings so that all features of the bot can be used. If you have the error 10004 = signing error, you should simply create a new API data

USDC Contracts and Account History rights may be for later features. An IP whitelist is also necessary for the withdraw function

![image](https://cdn.discordapp.com/attachments/685258964266647564/1089987475654586589/api.png)

<br>

### TO START AND STOP BOT

```
pm2 list to get id
```

```
pm2 stop id
```

```
pm2 start id
```

<br>

### TO UPDATE BOT WHEN A NEW RELEASE IS OUT

```
cd Bybit-Lick-Hunter-v4
```

```
git stash
```

```
git pull
```

<br>
<br>

### Check For Errors 

```
pm2 logs 'App ID' --err --lines 1000
```
<br>
<br>

### For Help & to Chat with other users
[Join The Disccord](https://discord.com/invite/TTn5Dxg)


----

### Are you a Developer?

![image](https://user-images.githubusercontent.com/33667144/214430374-10324420-8869-4236-ab8b-919c3c47b559.png)

There are now bounties on some issues in GitHub for anyone wanting to contribute by completing feature requests with the Bounty Tag, complete the task & send a pull request and DM to claim!
https://github.com/CryptoGnome/Bybit-Lick-Hunter-v4/issues
If there are enhancements you would like to see make sure to open a detailed issue explaining how you would like it to be added to the bot.
