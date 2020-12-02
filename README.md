# fyDai-frontend
Front-End for fyDai 

Refernce FyDai version: 
https://github.com/yieldprotocol/fyDai.git  (working commit: c8c7f06e873e2dad4068926d2b74b84587cf3613)

### Run the frontend on a development server:
1. Clone this repository  
`git clone https://github.com/yieldprotocol/fyDai-frontend.git`

2. In a new console, Install and launch the development server:  
`yarn && yarn start`  
*possibly required* : Setting the migration contract (when using custom mnemonic to start ganache check migration address on startup):  


### Supported networks:
1. Builder node --default  
Chain id: 31337 

1. Kovan
2. Mainnet
( 3. Builder node --default  
Chain id: 31337 ) 

### OPTIONAL and experimanetal: To Start a new locally served blockchain instance to test the frontend UI:  
1. Clone the fyDai repositiory: https://github.com/yieldprotocol/fyDai.git  (working commit: c8c7f06e873e2dad4068926d2b74b84587cf3613):  
`git clone https://github.com/yieldprotocol/fyDai.git`  
`git reset --hard c8c7f06e873e2dad4068926d2b74b84587cf3613`    
( if you want to revert to the latest fyDai, simply: `git pull` )

2. Prepare necessary files ( in fyDai root folder ):
 - `.secret` should contain a wallet mnemonic. You will reuse this mnemonic in the next step if starting ganache.
 - `.infuraKey` should contain an infuraKey. This is used only for public network deploys but is currently expected to run the frontend. 

3. Run a buidler node  
`npx buidler node`

4. In a seperate console, Run truffle migrations ( fyDai root folder ): 
`truffle migrate --network development --reset`  

5. Setup a few proxies and a basic single market:
`truffle exec ./scripts/setup_market_dev.js`  
Output: 'Market Initiated' on success. 