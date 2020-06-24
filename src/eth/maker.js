import Maker from '@makerdao/dai';

export default async function createMaker(network = 'mainnet') {

  return Maker.create('browser', {
    web3: {
      // statusTimerDelay: 2000,
      // confirmedBlockCount: 5,
      // inject:
    },
  });
}