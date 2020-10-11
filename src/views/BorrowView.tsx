import React, { useState  } from 'react';
import { Box } from 'grommet';

import RaisedBox from '../components/RaisedBox';
import Deposit from '../containers/Deposit';
import Borrow from '../containers/Borrow';
import Repay from '../containers/Repay';

interface BorrowProps {
  openConnectLayer:any;
}

const BorrowView = ({ openConnectLayer }: BorrowProps) => {

  return (
      <Borrow openConnectLayer={openConnectLayer} />
  );
};

export default BorrowView;
