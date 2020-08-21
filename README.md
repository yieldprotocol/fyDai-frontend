# yDai-frontend
Front end for yDai 


### Start a new locally served ganache instance to test the frontend UI:  

1. Clone the yDai repositiory: https://github.com/yieldprotocol/yDai.git  (working commit: bfd4cbe4cee392c4e09b84849a4983c1c1a6b788 ):  
`git clone https://github.com/yieldprotocol/yDai.git`  
`git reset --hard bfd4cbe4cee392c4e09b84849a4983c1c1a6b788`    
( if you want to revert to the latest yDai, simply: `git pull` )

2. Prepare necessary files ( in yDai root folder ):
 - `.secret` should contain a wallet mnemonic. You will reuse this mnemonic in the next step when starting ganache.
 - `.infuraKey` should contain an infuraKey. This is used only for public network deploys but is currently expected to run the frontend. 

3. Run a new ganache instance:  
`npx ganache-cli -m 'SOME MNEMONIC OF YOUR CHOICE' -i 1337 -e 1000`  
*Optionally add the flags:*  
`-b 10` *to delay blocks for 10 secs (it takes a while to run install - but gives more realistic product)*  
`-e 1000` *to increase the initially issued eth (it may be required to set up the market)*  
`--verbose` *for debugging via console*  

4. In a seperate console, Run truffle migrations ( yDai root folder ): 
`truffle migrate --network development --reset`  

5. Setup a few proxies and a basic single market:
`truffle exec ./scripts/setup_market_dev.js`  
Output: 'Market Initiated' on success. 


### Run the frontend on a development server: 

1. Clone this repository  
`git clone https://github.com/yieldprotocol/yDai-frontend.git`

2. In a new console, Install and launch the development server:  
`yarn && yarn start`  
*possibly required* : Setting the migration contract (when using custom mnemonic to start ganache check migration address on startup):  
`REACT_APP_MIGRATION_1337 = '0xAC172aca69D11D28DFaadbdEa57B01f697b34158' && yarn start`  - if using linux/mac  
`($env:REACT_APP_MIGRATION_1337 = '0xF4909eDC42bdA8eFCdF179B1C6ECBb00719e541a') -and (yarn start)`  - if using windows powershell  
`set "REACT_APP_NOT_SECRET_CODE=abcdef" && npm start` - if using windows cmd.exe  
*for optimised build* :  
`REACT_APP_MIGRATION = '0xAC172aca69D11D28DFaadbdEa57B01f697b34158' && yarn build`  - if using linux/mac  
`($env:REACT_APP_MIGRATION = '0xF4909eDC42bdA8eFCdF179B1C6ECBb00719e541a') -and (yarn build)`  - if using windows powershell  
`set "REACT_APP_NOT_SECRET_CODE=abcdef" && yarn build` - if using windows cmd.exe

### Supported networks:

1. Ganache localhost --default  
Chain id: 1337  
Migrations contract address: Based on mnemonic of your choice  
**NB. Change/override .env variable `REACT_APP_MIGRATION_1337` with the migration address**

2. Rinkeby
Chain ID: 4  
Migrations contract address: '0x08475B228575eFCb2e5d71E1B737deCeEdf21Db8'

### Known Gotchas
1. Make sure you reset your metamask on every reload of the blockchain.  
*metamask > advanced settings > reset*
