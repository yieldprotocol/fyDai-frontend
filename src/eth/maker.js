import Maker from '@makerdao/dai';

export default function createMaker(provider) {
  return Maker.create('http', { web3 : { inject : provider } } );
}