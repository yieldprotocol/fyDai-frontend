import React, { useEffect, useState, useContext } from 'react';
import styled, { css } from 'styled-components';
import {
  Box,
  Text,
  ResponsiveContext,
} from 'grommet';

import { UserContext } from '../contexts/UserContext';
import FlatButton from './FlatButton';

const StyledBox = styled(Box)`
  background: #f8f8f8;
  border-radius: 25px;
  border-color: #f8f8f8;
  transition: all 0.3s ease-in-out;
  ${(props:any) => !(props.border) && css`
  box-shadow: 0px 0px 0px #dfdfdf, -0px -0px 0px #ffffff;
  :active:hover {
    transform: scale(1);
    box-shadow: inset 6px 6px 11px #dfdfdf, inset -6px -6px 11px #ffffff;
    }
  :hover {
    transform: scale(1.02);
    box-shadow:  6px 6px 11px #dfdfdf, -6px -6px 11px #ffffff;
    }
  `}
  ${(props:any) => (props.border) && css`
  box-shadow:  inset 6px 6px 11px #dfdfdf,  
    inset -6px -6px 11px #ffffff;
  :active:hover {
    box-shadow:  0px 0px 0px #dfdfdf, 
        -0px -0px 0px #ffffff;
    }
  :hover {
    /* transform: scale(1.01); */
    }
  `}
  ${(props:any) => (props.disabled) && css`
  box-shadow:  0px 0px 0px #dfdfdf, 
    -0px -0px 0px #ffffff;
  :active:hover {
    box-shadow:  0px 0px 0px #dfdfdf, 
        -0px -0px 0px #ffffff;
    }
  :hover {
    transform: scale(1);
    }
  `}
`;

const slippageList = [0.001, 0.005, 0.01];

const YieldSettings = () => {

  const { state: { position, txHistory, preferences }, actions: { updatePreferences } } = useContext(UserContext);
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const [ slippage, setSlippage] = useState<number>(0);
  const [ useTxApproval, setUseTxApproval] = useState<boolean>(!preferences.useTxApproval);
  
  useEffect(()=>{
    preferences.slippage && setSlippage(slippageList.indexOf(preferences.slippage));
  }, [preferences.slippage]);

  useEffect(()=>{
    setUseTxApproval(!preferences.useTxApproval);
  }, [preferences.useTxApproval]);

  return (
    <>
      <Box pad="small" gap="small">
        <Box direction='row' justify='between'>
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Settings</Text> 
          <Box round>
            <FlatButton
              disabled
              onClick={()=>console.log('STILL TO DO!')}
              label={<Text size='xsmall'>More settings</Text>}
            /> 
          </Box>
        </Box> 

        <Box
          pad={{ vertical:'small' }}
          justify="between"
          gap='small'
          direction='row'
          align='center'
        >
          <Text size='xsmall'>Slippage tolerance:  </Text>

          { slippageList.map( (x:any, i:number) => {


          })}

          <Box gap='small' align='center'>
            <StyledBox
              pad={{ horizontal: 'large', vertical: 'xsmall' }}
              onClick={() => updatePreferences({ slippage: slippageList[0] })}
              border={slippageList.indexOf(preferences.slippage)!== 0 ? undefined : 'all'}
            >
              <Text size="small">
                0.1 %
              </Text>
            </StyledBox>
          </Box>

          <Box gap='small' align='center'>
            <StyledBox
              pad={{ horizontal: 'large', vertical: 'xsmall' }}
              onClick={() => updatePreferences({ slippage: slippageList[1] })}
              border={slippage !== 1 ? undefined : 'all'}
            >
              <Text size="small">
                0.5 %
              </Text>
            </StyledBox>
          </Box>

          <Box gap='small' align='center'>
            <StyledBox
              pad={{ horizontal: 'large', vertical: 'xsmall' }}
              onClick={() => updatePreferences({ slippage: slippageList[2] })}
              border={slippage !== 2 ? undefined : 'all'}
            >
              <Text size="small">
                1 %
              </Text>
            </StyledBox>
          </Box>
        </Box>

        <Box
          pad={{ vertical:'small' }}
          justify="between"
          gap='small'
          direction='row'
          align='center'
        >
          <Text size='xsmall'>Authorisation strategy: </Text>

          <Box gap='small' align='center'>
            <StyledBox
              pad={{ horizontal: 'large', vertical: 'xsmall' }}
              onClick={() => updatePreferences({ useTxApproval: false })}
              border={useTxApproval? 'all':undefined}
            >
              <Text size="xxsmall">
                Sign permits
              </Text>
            </StyledBox>
          </Box>

          <Box gap='small' align='center'>
            <StyledBox
              pad={{ horizontal: 'small', vertical: 'xsmall' }}
              onClick={() => updatePreferences({ useTxApproval: true })}
              border={useTxApproval?undefined:'all'}
            >
              <Text size="xxsmall">
                Approval transactions
              </Text>
            </StyledBox>
          </Box>
        </Box>
      </Box>
    </>
       
  );
};

export default YieldSettings;