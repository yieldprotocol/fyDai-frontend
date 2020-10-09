import React, { useState  } from 'react';
import { Box } from 'grommet';

import RaisedBox from '../components/RaisedBox';
import Deposit from '../containers/Deposit';
import Borrow from '../containers/Borrow';
import Repay from '../containers/Repay';

interface BorrowProps {
  openConnectLayer:any;
  activeView?: number;
}

const BorrowView = ({activeView:activeViewFromProps, openConnectLayer }: BorrowProps) => {
  
  const [ activeView, setActiveView ] = useState<number>( 
    activeViewFromProps || 1
  );

  return (
    <Box 
      gap='small'
      width={{ max:'600px' }}
      alignSelf='center'
      fill
      round='small'
      align='center'
    >
      <RaisedBox>
        <Box
          width={{ max: '600px' }}
          alignSelf="center"
          fill
          background="background-front"
          round='small'
        > 
          {activeView === 0 && <Deposit setActiveView={setActiveView} openConnectLayer={openConnectLayer} /> }  
          {activeView === 1 && <Borrow setActiveView={setActiveView} openConnectLayer={openConnectLayer} /> }
          {activeView === 2 && <Repay setActiveView={setActiveView} />}
        </Box>
      </RaisedBox>
    </Box>
  );
};

BorrowView.defaultProps = {
  activeView: 1,
};

export default BorrowView;
