Lick Hunter v4 is a full rewrite of LickHunter using some of the skills I have learned in the past two years and fully async compatable in Node JS. I have also released all of the source code in hope that if other users want to contribute to the project or add new features it is avaialable to them.


![image](https://user-images.githubusercontent.com/33667144/202498893-b747c8d2-0b12-43f0-96a9-2f637fe70558.png)

*First off if you enjoy using open source software please use my refferel link to create a new account when using this bot, its free and help me make more cools stuff for you guys:*

https://partner.bybit.com/b/lickhunterv4

<br>
<br>

### Suggested OS to Linux Unbuntu Vultr
![image](https://user-images.githubusercontent.com/33667144/202495972-17734217-541c-49ab-ae34-b459fb6138c2.png)

*Using a VPS can ensure high uptime and is much more stable than running on your own PC*

[VULTR IS OUR RECOMMENDED VPS PROVIDER](https://www.vultr.com/?ref=7300008)

<br>
<br>

### Quick Linux Setup Steps:
```
- apt install npm
- apt  install gh
- git clone https://github.com/CryptoGnome/Bybit-Lick-Hunter-v4.git
- cd Bybit-Lick-Hunter-v4
- npm install
- cp example.env .env
- edit settings
- node app.js
```

### Settings Explained:
```
API_KEY = apikeyhere  /// Bybit API Key
API_SECRET = apisecrether /// Bybit API Key
LEVERAGE = 10 // Default Leverage to use
MAX_POSITION_SIZE_PERCENT = 1 // Max Position a single pair can use in equity
MAX_OPEN_POSITIONS = 10 // Max Amount of Positions the bot will open
PERCENT_ORDER_SIZE = 0.01 // Deafult order size the bot will use, if this is not bigger than minimum bot will use min order size
MIN_LIQUIDATION_VOLUME = 500 // the min liquidation amount in USDT in a period of 5s that the bot will trade on (bot will count up over multiple liquidations)
TAKE_PROFIT_PERCENT = 0.886 // take profit limit, will be adjust based on average entry price
STOP_LOSS_PERCENT = 20 // stop loss  will be adjusted based on avg entry price
USE_STOPLOSS = true // bool for using stop loss
USE_SMART_SETTINGS = true // New feature that will auto setup setting based on AI data from https://liquidation.report/research to find the best offsets
UPDATE_MIN_ORDER_SIZING = true // this will auto create order sizing for you based on PERCENT_ORDER_SIZE and update it as you balance changes
USE_SET_LEVERAGE = true // set leverage of every pair on bot start, you only need to use this when you change leverage
RISK_LEVEL = 2 // 1-5 this will adjust risk by ajusting offsets of the the Smart settings 1 = conservative 5 = very risky
BLACKLIST = ETHUSDT, BTCUSDT, C98USDT // Place symbols you do not want to trade here
USE_DISCORD = false // if you want to use discord webhooks make this true and add link to channel below
DISCORD_URL = webhook_url_here //webhook url for discord channel here
```

*Webhook Examples*
![image](https://user-images.githubusercontent.com/33667144/202507520-5decb9e4-4f60-4e45-bf47-4371e74bf692.png)



### TO UPDATE BOT WHEN A NEW RELEASE IS OUT
```
git pull

```
<br>
<br>

### For Help & to Chat with other users
[Join The Disccord](https://discord.com/invite/TTn5Dxg)
