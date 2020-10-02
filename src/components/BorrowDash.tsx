import React, { useContext, useState } from 'react';
import { Box, Collapsible, Text } from 'grommet';
import styled, { css } from 'styled-components';
import InfoGrid from './InfoGrid';
import RaisedButton from './RaisedButton';
import { UserContext } from '../contexts/UserContext';
import { useSignerAccount } from '../hooks';
import Deposit from '../containers/Deposit';


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
      <InfoGrid 
        entries={[
          { 
            label: 'Collateralization Ratio',
            visible: !!account && collateralPercent_ > 0,
            active: collateralPercent_ > 0,
            loading: !ethPosted_ && ethPosted_ !== 0,
            value: (collateralPercent_ && (collateralPercent_ !== 0))? `${collateralPercent_}%`: '',
            valuePrefix: null,
            valueExtra: null
          },
          {
            label: '',
            visible: true,
            active: true,
            loading: false,            
            value: '',
            valuePrefix: null,
            valueExtra: () => (
              <RaisedButton
                color='brand'
                label={<Box pad='xsmall'><Text size='xsmall' color='brand'>Manage collateral</Text></Box>}
                onClick={() => console.log('hello')}
              /> 
            )
          } 
        ]}
      />   
    </>
  );
};

export default MiniDash;