# yDai-frontend
Front end for yDai 

### Start a new locally served ganache instance to test the frontend UI > 

1. Clone the yToken MVP repositiory: https://github.com/yieldprotocol/ytoken-mvp.git

In a console ( yTokenMVP root folder ):

2. Run a new ganache instance >
`npx ganache-cli -m 'SOME MNEMONIC OF YOUR CHOICE' -i 1337 -e 1000`

*Optionally add the flags:*

`-b 10` *to delay blocks for 10 secs (it takes a while to run install - but gives more realistic product)*  
`-e 1000` *to increase the initially issued eth (it may be required to set up the market)*  
`--verbose` *for debugging via console*  

In a seperate console ( yTokenMVP root folder ):

3. Run truffle migrations >
`truffle migrate --network development --reset`  

4. Setup a few proxies and a basic single market >
`truffle exec ./scripts/setup_market_dev.js`

'Market Initiated' on success. 


### Clone in and Run the frontend in a development server

1. Clone this repository

In a new console ( yDai fronend root folder ):  
2. `yarn && yarn start` to install and launch the dev server

*possibly required* : Setting the migration contract (when using custom mnemonic to start ganache check migration address on startup):  
`REACT_APP_MIGRATION = '0xAC172aca69D11D28DFaadbdEa57B01f697b34158' && yarn start`  - if using linux/mac  
`($env:REACT_APP_MIGRATION = '0xAC172aca69D11D28DFaadbdEa57B01f697b34158') -and (yarn start)`  - if using windows powershell  
`set "REACT_APP_NOT_SECRET_CODE=abcdef" && npm start` - if using windows cmd.exe  

NB: Make sure you reset your metamask on every reload of the blockchain.  
*metamask > advanced settings > reset*
