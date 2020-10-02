import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import styled, { css } from 'styled-components';


import InfoGrid from '../components/InfoGrid';
import RaisedButton from '../components/RaisedButton';
import BorrowDash from '../components/BorrowDash';

import { UserContext } from '../contexts/UserContext';
import { useSignerAccount } from '../hooks';


const InsetBox = styled(Box)`
border-radius: 8px;
background: #f8f8f8;
box-shadow: inset 6px 6px 11px #e9e9e9, 
            inset -6px -6px 11px #ffffff;
  ${(props:any) => props.background && css`
    background: ${props.background};
    color: black;
  `}
`;

const MiniDash = (props:any) => {

  const { account } = useSignerAccount();

  const { state: userState } = useContext(UserContext);
  const {
    ethBalance,
    ethPosted,
    ethPosted_,
    maxDaiAvailable_,
    collateralPercent_,
    debtValue,
  } = userState.position;

  return (
    <>
      <InsetBox
        width={{ max: '600px' }}
        alignSelf="center"
        fill
        round='small'
        pad='small'
        gap='small'
      >
        {props.activeView === 'BORROW' && <BorrowDash />}
        {props.activeView === 'LEND' && 
        <Text>lend dash</Text>}
        {props.activeView === 'POOL' && 
        <Text>pool dash</Text>}
      </InsetBox>
      {/* <Box>
        <Text size='xsmall'>Hide dash</Text>
      </Box> */}
    </>
  );
};

export default MiniDash;
