# yDai-frontend
Front end for yDai 

## To start a new ganache instance to test frontend against

Clone the yToken MVP repositiory: https://github.com/yieldprotocol/ytoken-mvp.git

In a console ( yTokenMVP root folder ):
1. `ganache-cli -m 'SOME MNEMONIC OF YOUR CHOICE' -i 1337` to run a ganache insatnce.

Optionally add the flags:
`-b 10` to delay blocks for 10 secs (it takes a while to run install - but gives more realistic product)
`-e 1000` to increase the initially issued eth (it may be required to set up the market)
`--verbose` for debugging via console

In a seperate console ( yTokenMVP root folder ):
2. `truffle migrate --network development --reset` to run migrations.
3. `truffle exec ./scripts/setup_market_dev.js` to setup a basic single market run


## Clone in and Run the frontend in a development server

In a new console ( yDai fronend root folder ):
`yarn && yarn start` to install and launch the dev server

NB: Make sure you reset your metamask on every reload of the blockchain. metamask transactions fail if the blockchain is restarted.

