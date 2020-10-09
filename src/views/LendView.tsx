import React from 'react';
import Lend from '../containers/Lend';
import RaisedBox from '../components/RaisedBox';

interface LendProps {
  openConnectLayer:any;
}

const LendView = ({ openConnectLayer }:LendProps) => {
  return (
    <>
      <RaisedBox> 
        <Lend openConnectLayer={openConnectLayer} />
      </RaisedBox>
    </>
  );
};

export default LendView;
