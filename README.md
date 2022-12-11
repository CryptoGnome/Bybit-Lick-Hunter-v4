Lick Hunter v4 is a full rewrite of LickHunter using some of the skills I have learned in the past two years and fully async compatable in Node JS. I have also released all of the source code in hope that if other users want to contribute to the project or add new features it is avaialable to them.


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
apt install gh
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

### Settings Explained:
```
API_KEY = apikeyhere  /// Bybit API Key
API_SECRET = apisecrether /// Bybit API Key
LEVERAGE = 10 // Default Leverage to use
MAX_POSITION_SIZE_PERCENT = 1 // Max Position a single pair can use in equity
MAX_OPEN_POSITIONS = 10 // Max Amount of Positions the bot will open
PERCENT_ORDER_SIZE = 0.01 // Deafult order size the bot will use, if this is not bigger than minimum bot will use min order size (START WITH SMALL %  TO TEST!!!)
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
<br>

*Webhook Examples*

![image](![image](https://user-images.githubusercontent.com/33667144/206907577-b1fd61d4-9355-4ecb-a644-237f58113b2d.png))
![image](![image](https://user-images.githubusercontent.com/33667144/206907628-eb4fe162-3366-4fba-9f1c-c16525c16abf.png))



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
