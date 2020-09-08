import React from 'react';
import { Box, Text, ThemeContext, Layer, Drop } from 'grommet';

import { NotifyContext } from '../contexts/NotifyContext';


const TransactionStatus = () => {

  const {
    state: { pendingTxs, lastCompletedTx },
  } = React.useContext(NotifyContext);
  const [over, setOver] = React.useState<boolean>(false);

  const ref = React.useRef() as React.MutableRefObject<HTMLInputElement>;

  return (
    <>
      <Box 
        ref={ref}
        onMouseOver={() => setOver(true)}
        onMouseLeave={() => setOver(false)}
        onFocus={() => setOver(true)}
        onBlur={() => setOver(false)}     
      >
        { pendingTxs && pendingTxs.length > 0 &&
        <Box       
          round
          animation='zoomIn'
          border='all'
          background='orange' 
          pad={{ horizontal: 'small' }}
        >
          {pendingTxs.length} transaction pending...
        </Box>}

        { pendingTxs.length === 0 && lastCompletedTx &&
        <Box
          round='xsmall'
          border='all'
          animation='zoomIn'
          background='brand-transparent' 
          pad={{ horizontal: 'small' }}
        >
          Transaction complete.
        </Box>}


      </Box>

      {ref.current && over &&
      <Drop
        align={{ top: 'bottom', left: 'left' }}
        target={ref.current}
      >
        <Box 
          round='xsmall'
        >
          {/* {lastCompletedTx.hash} */}

          { pendingTxs.map((x:any, i:number)=>{
            const _key = i; 
            return ( <Box key={_key}> {x.tx.hash} </Box>)
 
          })}

        </Box>
      </Drop>}

    </>
  );
};

export default TransactionStatus;