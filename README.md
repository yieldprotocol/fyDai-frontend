# yDai-frontend
Front end for yDai 


### Start a new locally served ganache instance to test the frontend UI:  

1. Clone the yDai repositiory: https://github.com/yieldprotocol/yDai.git  (working commit: c034d70cf0a3bfa0cc9bcbed474c822115904d31 ):  
`git clone https://github.com/yieldprotocol/yDai.git`  
`git reset --hard c034d70cf0a3bfa0cc9bcbed474c822115904d31`    
( if you want to revert to the latest yDai, simply: `git pull` )

2. Prepare necessary files ( in yDai root folder ):
 - `.secret` should contain a wallet mnemonic. You will reuse this mnemonic in the next step when starting ganache.
 - `.infuraKey` should contain an infuraKey. This is used only for public network deploys but is currently expected to run the frontend. 


3. Run a buidler node  
`npx buidler node`

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

`REACT_APP_MIGRATION_31337 = '0xsomemigrationcontractaddress' && yarn start`  - if using linux/mac  
`($env:REACT_APP_MIGRATION_31337 = '0xsomemigrationcontractaddress') -and (yarn start)`  - if using windows powershell  
 
*for optimised build* :  
`REACT_APP_MIGRATION_31337 = '0xsomemigrationcontractaddress' && yarn build`  - if using linux/mac  
`($env:REACT_APP_MIGRATION_31337 = '0xsomemigrationcontractaddress') -and (yarn build)`  - if using windows powershell  

`set "REACT_APP_NOT_SECRET_CODE=abcdef" && yarn build` - if using windows cmd.exe

*NB: if you have issues, try editing  the .env file manually with the migrations addresses before running yarn start*

### Supported networks:

1. Builder node --default  
Chain id: 31337  

**NB. Change/override .env variable `REACT_APP_MIGRATION_31337` and/or `REACT_APP_MIGRATION_DEFAULT` with the migration address**

<!-- 2. Rinkeby
Chain ID: 4  
Migrations contract address: '0x08475B228575eFCb2e5d71E1B737deCeEdf21Db' -->

### Known Gotchas
1. Make sure you reset your metamask on every reload of the blockchain.  
*metamask > advanced settings > reset*
