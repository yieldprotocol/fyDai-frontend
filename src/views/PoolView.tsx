import React from 'react';
import Pool from '../containers/Pool';
import RaisedBox from '../components/RaisedBox';

const PoolView = (props:any) => {
  return (
    <>
      <RaisedBox>
        <Pool openConnectLayer={props.openConnectLayer} />
      </RaisedBox>
    </>
  );
};

export default PoolView;
